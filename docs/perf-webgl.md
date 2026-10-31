# WebGL artwork lifecycle

`ui/Art/index.tsx` renders a fragment shader artwork: two feedback passes per frame, one `requestAnimationFrame` loop. This document records the lifecycle changes and the measurements that justify them.

## What changed

1. The render loop stops when it cannot be seen. An `IntersectionObserver` (threshold 0) watches the canvas wrapper, and `document.hidden` is checked each frame. When the wrapper leaves the viewport or the tab is hidden, the loop cancels its `requestAnimationFrame` instead of drawing. When it returns, the loop restarts on the next frame.
2. The animation clock only advances while frames are drawn. `uniforms.u_time` accumulates the frame delta, clamped to 0.1 s. A resume, a skipped frame, or a hidden tab therefore produces no time jump and no visual flash.
3. Frame rate is capped by skipping frames, not by a timer. A frame is drawn only when at least `1000 / fps` ms passed since the last drawn frame: 30 fps at viewport width <= 900 px, 60 fps above.
4. The initial GL setup is deferred to the first idle period: `requestIdleCallback` with a 200 ms timeout, `setTimeout(0)` when the API is missing. The handle is cancelled on unmount. Hydration no longer shares a task with shader compilation.
5. The resize path is debounced by 250 ms after the last width change. Programs and buffers are created once. A resize only reallocates the two feedback textures and their framebuffers, and updates `u_resolution`. Teardown deletes the GL objects it created.
6. The fallback path is unchanged: `getContext('webgl')` returning `null` still throws `Canvas context not found`.

## Measurements

Method: production build, `/tmp/perf/measure.sh` with the standard harness. Mobile means 390x844, device scale factor 3, 4x CPU throttle, slow 4G. Desktop means 1440x900, device scale factor 2. The base commit and this change were measured in alternating order (base, change, base, change) because the build machine was shared and its load varied.

Metric comparison, median of 4 interleaved runs:

| metric             | desktop base | desktop change | mobile base | mobile change |
| ------------------ | ------------ | -------------- | ----------- | ------------- |
| tbt, ms            | 0            | 0              | 65.5        | 50            |
| lcp, ms            | 56           | 56             | 704         | 604           |
| cls                | 0            | 0              | 0           | 0             |
| initial transferKB | 3022         | 3023           | 1774        | 1774          |
| jsKB               | 170          | 170            | 170         | 170           |

Mobile tbt samples were base 58, 72, 86, 59 and change 52, 52, 48, 37.

`requestAnimationFrame` calls in a 3 s window, counter injected after load:

| state                | desktop base | desktop change | mobile base | mobile change |
| -------------------- | ------------ | -------------- | ----------- | ------------- |
| visible              | 179          | 179            | 180         | 360           |
| scrolled out of view | 180          | 0              | 180         | 0             |
| visible again        | 180          | 179            | 180         | 360           |

`gl.drawArrays` / `gl.drawElements` calls in the same 3 s window (2 calls per frame):

| state                | desktop base  | desktop change | mobile base   | mobile change |
| -------------------- | ------------- | -------------- | ------------- | ------------- |
| visible              | 720 (120 fps) | 360 (60 fps)   | 720 (120 fps) | 180 (30 fps)  |
| scrolled out of view | 720           | 0              | 720           | 0             |
| `document.hidden`    | 722           | 0              | 702           | 0             |
| visible again        | 720           | 360            | 722           | 180           |

The emulated display refresh rate was 120 Hz, so the base commit rendered at 120 fps. The change renders at 60 fps above 900 px and 30 fps at or below 900 px, as specified. rAF scheduling stays at the display rate; only the draws are skipped.

First drawn frame, measured with a temporary `performance.now()` stamp that was removed before the commit. The base commit draws at 222 ms desktop and 143 ms mobile, because its setup starts as soon as hydration finishes. During development the deferred setup used a 1000 ms idle timeout and produced its first frame at 273 ms desktop and 239 ms mobile. The shipped timeout is 200 ms, so the first frame cannot land later than that plus one frame after the effect runs. All of these values stay below the largest contentful paint.

Resize from 1440 to 390 and back, plus 11 rapid width steps, with temporary counters that were removed before the commit:

| step                       | base canvas buffer | change canvas buffer | base program inits | change program inits |
| -------------------------- | ------------------ | -------------------- | ------------------ | -------------------- |
| initial 1440x900           | 330x795            | 330x795              | 1                  | 1                    |
| after 1440 -> 390          | 370x250            | 370x250              | 2                  | 1                    |
| after 390 -> 1440          | 370x250 (stale)    | 330x795              | 2                  | 1                    |
| after 11 rapid width steps | 370x250 (stale)    | 460x250              | 2                  | 1                    |

The base commit re-inits once because its effect depends on a `wasResized` boolean that is never reset, so later resizes never re-run it and the canvas buffer keeps the mobile size after returning to desktop. The change keeps a single program compile and reallocates the framebuffers once per settled width: 5 reallocations for the 4 settled widths of that test, one of which collapsed 11 rapid steps into a single reallocation. `canvas.width/height` matched `clientWidth/Height * min(1, devicePixelRatio)` after every step.
