# WebGL artwork lifecycle

`ui/Art/index.tsx` renders a fragment shader artwork: two feedback passes per frame, one `requestAnimationFrame` loop. This document records the lifecycle changes and the measurements that justify them.

## What changed

1. The loop stops when it cannot be seen. An `IntersectionObserver` (threshold 0) watches the canvas wrapper, and `document.hidden` is checked on every frame. When the wrapper leaves the viewport the pending frame is cancelled instead of drawn, and the observer restarts the loop when the canvas returns. The `document.hidden` check is defensive: it keeps the loop from scheduling while the page is hidden, but it is not a measured win, because a real hidden tab receives no `requestAnimationFrame` callbacks in Chrome anyway (see the frame scheduling note). A `visibilitychange` listener restarts the loop on unhide.
2. The animation clock only advances while frames are drawn. `uniforms.u_time` accumulates the frame delta, clamped to 0.1 s, and the delta base is cleared whenever the loop stops. A resume, a skipped frame or a hidden tab therefore produces no time jump and no visual flash.
3. Frame rate is capped by skipping frames, not by a timer. A frame is drawn only when at least `1000 / fps` ms passed since the last drawn frame: 30 fps at viewport width <= 900 px, 60 fps above.
4. The initial GL setup is deferred to the first idle period: `requestIdleCallback` with a 200 ms timeout, `setTimeout(0)` when the API is missing. The handle is cancelled on unmount. Hydration no longer shares a task with shader compilation.
5. The resize path is debounced by 250 ms after the last width change. Programs and buffers are created once. A resize only reallocates the two feedback textures and their framebuffers and updates `u_resolution`. Teardown deletes the GL objects it created.
6. A missing WebGL context degrades gracefully. When `canvas.getContext('webgl')` returns `null` the effect returns early: the wrapper and canvas stay mounted, nothing is thrown or logged, and the rest of the page keeps working. The previous code threw `Canvas context not found` from the effect, which made React unmount the whole page.

## Measurements

Method: production build (`pnpm build`, `next start`), `/tmp/perf/measure.sh`, base commit `b0f9500` served from a separate checkout on port 3417 and this branch on port 3457, alternating base and change runs. Desktop means 1440x900, device scale factor 2. Mobile means 390x844, device scale factor 3, 4x CPU throttle, slow 4G. Both ports were verified to serve their own build and to be bound by a single process before the runs.

Each cell is a single sample set: 4 runs per side on desktop, 8 runs per side on mobile, base and change alternating.

| metric             | desktop base | desktop change | mobile base | mobile change |
| ------------------ | ------------ | -------------- | ----------- | ------------- |
| tbt, ms (median)   | 0            | 0              | 40.5        | 37.5          |
| tbt, ms (mean)     | 0            | 0              | 43.4        | 43.3          |
| lcp, ms (range)    | 72 to 148    | 88 to 128      | 580 to 744  | 604 to 724    |
| cls                | 0            | 0              | 0           | 0             |
| initial transferKB | 3033         | 3033           | 1784        | 1785          |
| jsKB               | 170          | 171            | 170         | 171           |

Mobile tbt samples were base 59, 33, 43, 44, 37, 57, 36, 38 and change 39, 38, 31, 37, 33, 94, 31, 43; paired differences -20, +5, -12, -7, -4, +37, -5, +5 (mean -0.1, median -4.5, change higher in 3 of 8 pairs). Desktop lcp samples were base 148, 88, 76, 72 and change 128, 88, 88, 112; mobile lcp samples were base 744, 580, 620, 612, 608, 708, 720, 604 and change 608, 604, 616, 604, 688, 604, 724, 608.

LCP has no mechanism to change here. The LCP element is the same in every run of a mode (the hero paragraph on desktop, the `h1` on mobile), it is server HTML painted before hydration, and neither build touches it; the canvas is not the LCP element in any run. The ranges above therefore overlap and their spread, not the change, is what the samples show: the lowest and highest mobile values both belong to base runs, and the widest desktop value is a base run at 148 ms taken while the machine was busy. Treat the LCP row as noise.

Under mobile emulation each page produces exactly one long task, at 7.0 to 7.15 s, lasting 78 to 100 ms in both builds; that hydration task is the whole tbt. The Art setup task follows it and stays below the 50 ms long task threshold in both builds, and the first `drawArrays` happens at 7.18 to 7.33 s in both. The 1 KB of extra JS is the larger component chunk.

## Frame scheduling

`window.requestAnimationFrame` was wrapped after load as in the task brief, and `drawArrays` / `drawElements` were counted on the canvas context. Each number is a 3 s window on one page instance: visible, scrolled so the canvas is out of view, scrolled back, `document.hidden` forced with a `visibilitychange` dispatch, then unhidden.

| state                            | desktop base | desktop change | mobile base | mobile change |
| -------------------------------- | ------------ | -------------- | ----------- | ------------- |
| visible                          | 179 / 360    | 180 / 362      | 180 / 362   | 179 / 180     |
| scrolled out of view             | 180 / 360    | 0 / 0          | 180 / 360   | 0 / 0         |
| visible again                    | 180 / 360    | 180 / 360      | 180 / 360   | 180 / 180     |
| `document.hidden` forced in page | 180 / 360    | 0 / 0          | 180 / 360   | 0 / 0         |
| after unhide                     | 180 / 360    | 180 / 360      | 180 / 360   | 180 / 180     |

Values are rAF callbacks / GL draw calls. The shader issues 2 draws per frame, so 360 draws in 3 s is 60 fps and 180 draws is 30 fps. The emulated display refresh rate was 60 Hz, so the base commit already ran at 60 fps on desktop and the cap is visible on mobile only: 362 draws (60 fps) on base against 180 draws (30 fps) at 390 px.

The reproduced win over the base commit is the offscreen row: scrolling the canvas out of view drops scheduling from 180 rAF callbacks and 360 draws per 3 s to zero, and scrolling back restores both. The `document.hidden` row is weaker evidence and must not be read as a win over base. That row was produced by redefining `document.hidden` on the document and dispatching `visibilitychange` inside the page, which only exercises the component's own check. A genuinely hidden tab receives no `requestAnimationFrame` callbacks from Chrome at all, so the base commit would also stop drawing there, and the two builds cannot be distinguished for that state with the tooling available here. The `document.hidden` check is therefore defensive: it keeps the loop from scheduling work while the page is hidden (for example when a hidden tab is resumed mid-frame), and it is not a measured performance win.

## Resize

An iframe at 1440x900 hosts the page; the iframe element is then resized, so `window.innerWidth` changes for real. `createProgram`, `createTexture` and `deleteTexture` were counted on the canvas context, reset before each step.

| step                               | base buffer / client | base program, texture alloc, texture free | change buffer / client | change program, texture alloc, texture free |
| ---------------------------------- | -------------------- | ----------------------------------------- | ---------------------- | ------------------------------------------- |
| initial 1440x900                   | 330x795 / 330x795    | 0, 0, 0                                   | 330x795 / 330x795      | 0, 0, 0                                     |
| after 1440 -> 390                  | 370x250 / 370x250    | 2, 2, 0                                   | 370x250 / 370x250      | 0, 2, 2                                     |
| after 390 -> 1440                  | 370x250 / 330x795    | 0, 0, 0                                   | 330x795 / 330x795      | 0, 2, 2                                     |
| after 11 rapid width steps 400-480 | 370x250 / 460x250    | 0, 0, 0                                   | 460x250 / 460x250      | 0, 2, 2                                     |
| settled back at 1440x900           | 370x250 / 330x795    | 0, 0, 0                                   | 330x795 / 330x795      | 0, 2, 2                                     |

The change compiles shaders once per mount and performs exactly one texture reallocation per settled width, including one for 11 width steps that arrive within the 250 ms debounce. The canvas buffer matches `clientWidth/Height * min(1, devicePixelRatio)` after every step. The base commit re-runs its whole effect once, because it depends on a `wasResized` boolean that is never reset, and afterwards keeps a stale 370x250 buffer at a 330x795 client size.

## Missing WebGL

The page was served through a local proxy that injects, as the first script in `<head>`, a stub making `HTMLCanvasElement.prototype.getContext` return `null` for every WebGL type, plus `console.error` and `error` / `unhandledrejection` capture. The probe reads the result after load.

| probe                 | base                          | change                     |
| --------------------- | ----------------------------- | -------------------------- |
| `getContext('webgl')` | `null`                        | `null`                     |
| captured errors       | 1, `Canvas context not found` | 0                          |
| `video` elements      | 0                             | 4                          |
| `canvas` elements     | 0                             | 1                          |
| art wrapper class     | absent                        | present                    |
| body text length      | 70                            | 9328                       |
| `h1` text             | `This page couldn't load`     | `Aleksandr Kriuchkov, ...` |

On the base commit the throw unmounts the React tree and the visitor gets an error page. With the change the artwork area stays empty and the rest of the page is intact, with no console output.

## Visual check

Screenshots at 1440x900 and 390x844 (`/tmp/perf/webgl2/shot-{branch,base}-{desktop,mobile}.png`, taken with the headless `shot.sh` helper) show the same framing as the base commit: the artwork occupies the 310 px right column on desktop and the full width banner above the heading on mobile, with the same rounded crop, the same blue and red feedback bands and the same black attractor regions. The two builds are captured at different points of the animation, so pixel equality is not expected.

Animation was measured inside one page: two `readPixels` samples of the canvas 1.5 s apart differ in 72.3 percent of pixels on desktop and 63.6 percent on mobile (mean absolute difference 237 and 202 of 765), and the sampled 3x3 colour grid matches the screenshot palette. First `drawArrays` after navigation: 102 to 172 ms on desktop base and 114 to 140 ms on desktop change, so the deferred setup does not delay the first visible frame.

## Notes

- The browser runs were plain headless Chrome launched by the helpers in `/tmp/perf` (`measure.sh`, and `shot.sh` / `eval.sh` through `chrome-run.sh`), with no GPU or graphics flag beyond `--headless`: `grep -n disable-gpu` finds nothing in those four scripts. Rendering therefore goes through SwiftShader software GL, which is what makes the artwork appear in the screenshots and what inflates absolute timings. Context creation failed intermittently while many browsers were running in parallel, so every WebGL measurement above was rejected and retried when `getContext('webgl')` returned `null`.
- Headless software GL makes absolute timings and tbt larger than on a GPU machine. All comparisons here are like for like, base and change alternating on the same machine.
- `frameInterval()` reads `window.innerWidth` on every rAF callback, even though the resize listener already tracks width changes. It is a cheap property read, kept for simplicity so the cap always follows the live viewport, but it is per-frame work that a cached value would avoid.
- The 30 fps cap skips draws; it does not stop wakeups. One rAF callback still runs per display frame on a narrow viewport, so the mobile saving is GL work (half the draws, half the shader passes) and not a reduction in main thread wakeups. Only the offscreen and hidden gates stop the rAF chain itself.
- `u_time` semantics changed from the rAF timestamp to accumulated active time. The shader consumes `u_time` and `u_timedelta` unchanged, so the motion looks the same at a steady frame rate; only the phase at a given wall clock moment differs.
