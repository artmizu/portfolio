# Initial JavaScript payload

This document records what left the initial JavaScript payload of `/en`, in which order, and what the measurements and the rendering comparisons show. Three changes were made:

1. The WebGL artwork loads as a separate chunk instead of being part of the page's initial script set (commit `3c5982b`).
2. `react-use` was replaced by a local `useIntersection` (commit `3c5982b`).
3. `twgl.js` was replaced by a local WebGL helper, `ui/Art/gl.ts` (commit `a66fd30`), and the helper's texture filtering was corrected to follow twgl's size branch (commit `2800cf0`).

The payload target of the first assignment (initial `jsKB` down by 30 percent) is still not reached, and the arithmetic that makes it unreachable is in the last section. What the three commits do achieve is a 12.0 percent smaller initial script set, a 9.4 percent smaller total JavaScript figure, and a rendered frame that is bit identical to the twgl build.

## What changed

1. The WebGL artwork is loaded as a separate chunk instead of being part of the page's initial script set. `ui/Art/index.tsx` is a client wrapper that calls `next/dynamic(() => import('./Canvas'), { ssr: false, loading: ArtPlaceholder })`; the canvas component lives in `ui/Art/Canvas.tsx`. The placeholder is a `div` styled by `ui/Art/placeholder.module.scss`: `width/height: 100%`, `background: #000`, the same `border-radius` as the canvas container (20 px, 15 px below 900 px), so the artwork area is the page background colour until the shader draws and the swap is invisible. `ui/Art/index.module.scss` sets `background: #000` on the canvas element as well, so the box stays black in the window between the canvas mount and its first draw. The placeholder style comes from the initially loaded stylesheet, not from the artwork chunk. The box of the placeholder is the box of the canvas in both breakpoints, because both fill the same parent: 310x775 px on desktop and 350x230 px on mobile. The server output of `.main-intro__art` is the React Suspense fallback for the `ssr: false` component, that is `<div class="KdTdxW_placeholder"></div>` and no canvas, and the client swaps the canvas in after hydration without moving anything (measured `cls` is 0 in every run).
2. `react-use` is gone. `shared/useIntersection.ts` returns the latest `IntersectionObserverEntry` (or `null`) for a ref, takes `rootMargin` and `threshold` as primitives so the effect re-subscribes only when those values change, is SSR safe (`IntersectionObserver` is checked before use, the observer is created in an effect), and disconnects on unmount. `ui/ProjectCard/index.tsx` and `ui/Factoid/index.tsx` use it with the same options (`rootMargin: '0px'`, `threshold: 0.8`), and `ui/ProjectCard/index.tsx` keeps its `useEffectEvent` callback so parent renders do not re-subscribe the observer. `react-use` was removed from `package.json` and `pnpm-lock.yaml` together with its whole dependency tree: 25 packages besides `react-use` and `twgl.js` (27 including those two) leave the lockfile. Besides the 10 direct dependencies of `react-use` (`copy-to-clipboard`, `fast-shallow-equal`, `js-cookie`, `nano-css`, `react-universal-interface`, `resize-observer-polyfill`, `screenfull`, `set-harmonic-interval`, `throttle-debounce`, `ts-easing`) the tree carried the css-in-js stack behind `nano-css` (`css-in-js-utils`, `css-tree`, `mdn-data`, `stylis`, `hyphenate-style-name`, `inline-style-prefixer`, `rtl-css-js`, `fastest-stable-stringify`, `source-map`), the stack-trace stack behind `stacktrace-js` (`stacktrace-gps`, `stack-generator`, `stackframe`, `error-stack-parser`) and `toggle-selection` behind `copy-to-clipboard`. `tslib`, `fast-deep-equal`, `@types/js-cookie` and `@xobotyi/scrollbar-width` stay in the lockfile because other packages use them.
3. `twgl.js` is gone. `ui/Art/gl.ts` implements the nine calls `ui/Art/Canvas.tsx` made into the twgl UMD bundle, and `Canvas.tsx` calls them directly. `twgl.js` 7.0.0 left `package.json` and `pnpm-lock.yaml`. The equivalence evidence is in its own section below.

## Chunk layout

Sizes are gzip bytes of the file on disk; the transfer figures are what the browser reports. `/en` was served by `next start` on `127.0.0.1:3481` from this worktree. Chunk names change with the content, so each table lists its own.

Branch base `b9f7fa4`, initial script set from the served HTML (all fetched):

| chunk            | gzip bytes | content                                                             |
| ---------------- | ---------- | ------------------------------------------------------------------- |
| 0ehvja7ge0_qo.js | 71924      | react-dom                                                           |
| 085qongtlwg77.js | 45105      | Next client framework (link prefetch, router, `startTransition`)    |
| 1mcdyudl649w7.js | 34740      | twgl.js UMD, `ui/Art`, `next/image`, `LazyVideo`, `useIntersection` |
| 0rwbtzltvd9uy.js | 8763       | Turbopack module helpers                                            |
| turbopack-3-*.js | 3972       | Turbopack client runtime                                            |
| 1cpyh6sau-mkl.js | 3545       | polyfills                                                           |
| 0u9d7duj89jsn.js | 2040       | runtime                                                             |
| 023vzsu9qo1vx.js | 1496       | runtime                                                             |
| 0h93gwr63c-6r.js | 272        | runtime                                                             |
| total            | 171857     | 171 KB transferred                                                  |

After `3c5982b` (dynamic split, `react-use` removed):

| chunk            | gzip bytes | content                                                                    |
| ---------------- | ---------- | -------------------------------------------------------------------------- |
| 0ehvja7ge0_qo.js | 71924      | react-dom                                                                  |
| 085qongtlwg77.js | 45105      | Next client framework                                                      |
| 08pi59ffffiag.js | 13993      | `next/image`, `LazyVideo`, `useIntersection`, ProjectCard art, placeholder |
| 0rwbtzltvd9uy.js | 8763       | Turbopack module helpers                                                   |
| turbopack-3-*.js | 3972       | Turbopack client runtime                                                   |
| 1cpyh6sau-mkl.js | 3545       | polyfills                                                                  |
| 0u9d7duj89jsn.js | 2040       | runtime                                                                    |
| 023vzsu9qo1vx.js | 1496       | runtime                                                                    |
| 1qqaeuost2z5a.js | 353        | `next/dynamic` loader for the artwork chunk and its stylesheet             |
| total            | 151191     | 151 KB transferred                                                         |

After `a66fd30` (local WebGL helper): the same set, with the loader chunk at 352 bytes, total 151190. After `2800cf0` (power-of-two filtering guard) the loader chunk is 353 bytes and the total is 151191, because the guard adds 72 gzip bytes to the artwork chunk.

The artwork chunk left the HTML in `3c5982b` and shrank in `a66fd30`:

| commit    | chunk             | gzip bytes | raw bytes | content                              | fetched at  |
| --------- | ----------------- | ---------- | --------- | ------------------------------------ | ----------- |
| `b9f7fa4` | 1mcdyudl649w7.js  | 34740      | 126590    | in the HTML, twgl plus shared code   | 20 ms       |
| `3c5982b` | 29xdxyzg6apze.js  | 22391      | 83230     | twgl.js UMD and the canvas           | 108 ms      |
| `a66fd30` | 2kmsrl7087_ot.js  | 3643       | 9590      | the local helper, canvas and shaders | 96 ms       |
| `2800cf0` | 156icnxeqatao.js  | 3715       | 9926      | the same plus the size guard         | 81 ms       |
| all       | 3heri1h3hogag.css | 292        |           | `ui/Art/index.module.scss`           | 81 to 96 ms |

Timing on loopback for `2800cf0`: initial scripts requested at 8 ms, first contentful paint at 64 ms, artwork chunk requested at 81 ms. The chunk is requested by the `next/dynamic` loader during hydration, the compiled loader is `dynamic(() => import(...), { loadableGenerated: ..., ssr: false, loading: () => <div className={placeholder} /> })`. The placeholder stylesheet (`KdTdxW_placeholder`, `#000` and radius) is part of the 29888 byte app stylesheet that the HTML links, so the placeholder is painted before the artwork chunk exists.

`0cz1d0mv5g_q7.js` (39490) is a `noModule` legacy chunk present in every build; Chrome does not fetch it and it is excluded from every number here.

## The local WebGL helper

`ui/Art/gl.ts` replaces, one for one, what `ui/Art/Canvas.tsx` used:

| twgl call                    | local replacement                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resizeCanvasToDisplaySize`  | same arithmetic: `clientWidth * max(0, multiplier) \| 0`, assigned only when the size changed                                                      |
| `createTextures`             | `createTexture` plus `texImage2D` with `RGBA`/`UNSIGNED_BYTE` and no data, then the size branch described below                                    |
| `createFramebufferInfo`      | `createFramebuffer` plus `framebufferTexture2D` for each attachment, size from `drawingBufferWidth/Height`                                         |
| `bindFramebufferInfo`        | `bindFramebuffer` plus `viewport` at the attachment size, or at the drawing buffer size for `null`                                                 |
| `createProgramInfo`          | compile, link, delete the shaders, then introspect active uniforms (type, location, sampler unit) and active attributes (location)                 |
| `createBufferInfoFromArrays` | one `ARRAY_BUFFER` per attribute, `Float32Array`, `STATIC_DRAW`, element count from data length and component count                                |
| `setBuffersAndAttributes`    | `bindBuffer`, `enableVertexAttribArray`, `vertexAttribPointer` with `FLOAT`, no normalise, stride 0, offset 0                                      |
| `setUniforms`                | dispatch on the introspected type: `uniform1f`, `uniform1i`, `uniform2fv`, and `uniform1i` plus `activeTexture` plus `bindTexture` for the sampler |
| `drawBufferInfo`             | `gl.drawArrays(TRIANGLES, 0, numElements)`                                                                                                         |

Two deliberate differences from twgl, both outside the paths this component takes:

- twgl guesses `numComponents` from the attribute name (`/coord|texture/` means 2, `/color/` means 4, otherwise 3). The local helper takes it from the caller, so `Canvas.tsx` states 3 for `a_position` and 2 for `a_texture` instead of relying on the attribute names.
- twgl picks texture filtering by size: for power-of-two textures it generates mipmaps and leaves the default `NEAREST_MIPMAP_LINEAR` min filter, `LINEAR` mag filter and `REPEAT` wrap in place; for everything else it sets `LINEAR` and `CLAMP_TO_EDGE`. The local helper reproduces that branch in `setTextureFilteringForSize`: `isPowerOf2(width) && isPowerOf2(height)` means `generateMipmap` plus `NEAREST_MIPMAP_LINEAR`, `LINEAR`, `REPEAT` set explicitly, otherwise `LINEAR`, `LINEAR`, `CLAMP_TO_EDGE`. The explicit parameters in the power-of-two branch are the same values twgl gets by leaving the defaults alone, so the resulting texture state is identical either way. Both sizes the page renders (330x795 and 370x250, and 580x250 after a resize) are not powers of two, so they take the second branch, which is why the rendered output does not change; the first branch is there so the helper matches twgl if a layout ever produces a power-of-two canvas.

The power-of-two branch is exercised by overriding the artwork box to 492x236 CSS pixels in an iframe, which makes the canvas 512x256, then forcing a window resize so the component reallocates its targets. `generateMipmap` is called twice, one per feedback texture, with `TEXTURE_MIN_FILTER` 9986 (`NEAREST_MIPMAP_LINEAR`), `TEXTURE_MAG_FILTER` 9729 (`LINEAR`) and `TEXTURE_WRAP_S` and `TEXTURE_WRAP_T` 10497 (`REPEAT`), no GL error from `getError`, and the loop keeps drawing and producing a non-black frame.

Everything else in `Canvas.tsx` is untouched: the two-pass feedback, the ping-pong parity on `u_frame`, the shaders, the uniform names, the frame pacing, the visibility gate, the resize debounce, the idle setup and the teardown.

## Equivalence of the twgl build and the local build

The comparison runs against the served build in headless Chrome through `/tmp/perf/eval.sh`, which patches the `WebGLRenderingContext` prototype from inside the page. Both builds are measured with the same probe, so the probe is build agnostic.

Draw calls. `drawArrays` and `drawElements` are counted for 2 s on a loaded page.

| state                       | twgl build (`3c5982b`) | local build (`a66fd30`, `2800cf0`) |
| --------------------------- | ---------------------- | ---------------------------------- |
| 1440x900, draws in 2 s      | 240 and 242            | 240, 240                           |
| 1440x900, frames per second | 60 and 60.5            | 60                                 |
| 390x844, draws in 2 s       | 120 and 122            | 120, 120                           |
| 390x844, frames per second  | 30 and 30.5            | 30                                 |

Two draws per frame, so 240 draws in 2 s is 60 frames per second on desktop and 120 draws is the 30 frame cap at 390 px. Base and local build agree.

Pixels. Both builds start their feedback textures black and evolve deterministically from the uniforms that reach the shader, so the probe replays a fixed uniform sequence: it clears both framebuffer attachments, then overrides `u_time` to `frame / 60`, `u_timedelta` to `1 / 60` and `u_frame` to `frame` immediately before every draw (through `getUniformLocation` on the current program, so it does not depend on either build's plumbing), and reads the whole drawing buffer back with `readPixels` at frame 120. `u_texture` and `u_resolution` keep the values each build's own code sets, so a plumbing mistake in either would show up as a pixel difference.

| build                                                 | viewport | FNV-1a of the readback | mean RGB              |
| ----------------------------------------------------- | -------- | ---------------------- | --------------------- |
| twgl, run 1                                           | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| twgl, run 2                                           | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| local `a66fd30`, run 1                                | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| local `a66fd30`, run 2                                | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| local `a66fd30`, run 3 (after a rebuild from scratch) | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| local `2800cf0` (size guard), run 1                   | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| local `2800cf0` (size guard), run 2                   | 330x795  | 744592224              | 20.46 / 20.68 / 26.19 |
| twgl                                                  | 370x250  | 1415744792             | 26.41 / 50.70 / 55.95 |
| local `a66fd30`                                       | 370x250  | 1415744792             | 26.41 / 50.70 / 55.95 |
| local `2800cf0` (size guard)                          | 370x250  | 1415744792             | 26.41 / 50.70 / 55.95 |

The hashes are equal, so the readbacks are identical byte for byte and the fraction of changed pixels between the two builds is 0. The comparison also covers the 16x16 grid of cell means the probe returns: max cell delta 0.0, 0 cells above 1/255 at both sizes. The same hash reproduces on repeated runs of the same build, which is what makes the cross-build comparison meaningful.

Uniforms reach the shaders. Reading `getUniform` on the current program at the first pass of three consecutive frames:

| build | viewport | `u_time`               | `u_frame`     | `u_resolution` |
| ----- | -------- | ---------------------- | ------------- | -------------- |
| twgl  | 330x795  | 3.6999, 3.7166, 3.7332 | 222, 223, 224 | [330, 795]     |
| local | 330x795  | 3.6998, 3.7165, 3.7331 | 222, 223, 224 | [330, 795]     |
| twgl  | 370x250  | 5.5665, 5.5998, 5.6332 | 163, 164, 165 | [370, 250]     |
| local | 370x250  | 5.6997, 5.7330, 5.7664 | 171, 172, 173 | [370, 250]     |

`u_time` advances by one frame interval per frame, `u_frame` counts frames, `u_resolution` matches the drawing buffer. The absolute values differ between runs because they depend on when the page was sampled, not on the build.

The frame is not static. Two full readbacks taken 600 ms apart, at frames 341 and 378 on desktop (60 fps, so 37 frames between the samples) and at frames 231 and 250 at 390 px (30 fps, so 19 frames between the samples), differ on 78.88 percent of the pixels on desktop and 61.85 percent at 390 px. The twgl build measured with the same 600 ms interval gives 79.07 and 61.05 percent. The mean RGB also moves between the two samples (64.1 to 80.3 in red on desktop).

Resize. An iframe hosts `/en` at 1440x900, then its width is set to 600 px, with `createTexture`, `deleteTexture`, `createFramebuffer`, `deleteFramebuffer`, `createProgram` and `texImage2D` counted on the iframe window:

| step         | canvas css | canvas buffer | programs | textures | framebuffers | uploads       | draws in 2 s |
| ------------ | ---------- | ------------- | -------- | -------- | ------------ | ------------- | ------------ |
| 1440x900     | 330x795    | 330x795       | 0        | 0 / 0    | 0 / 0        | none          | n/a          |
| after 600 px | 580x250    | 580x250       | 0        | 2 / 2    | 2 / 2        | 580x250 twice | 120          |

The resize reallocates the two feedback textures and their framebuffers at the new size, deletes the old ones, keeps the programs, and drawing continues at 120 draws in 2 s, which is the 30 frame cap for a 600 px viewport. This matches the behaviour recorded in `docs/perf-webgl.md` for the twgl build (0 programs, 2 texture allocations, 2 frees).

## Measurements

Method: `pnpm build`, `next start` on port 3481, `/tmp/perf/measure.sh <url> <desktop|mobile> noscroll <out.json>`. Desktop is 1440x900 at device scale factor 2, mobile is 390x844 at device scale factor 3 with 4x CPU throttling and slow 4G. Each cell is min / median / max over the runs.

Branch base `b9f7fa4` against `3c5982b`, all runs from the same session:

| metric     | desktop base (3 runs) | desktop `3c5982b` (8 runs) | mobile base (3 runs) | mobile `3c5982b` (6 runs) |
| ---------- | --------------------- | -------------------------- | -------------------- | ------------------------- |
| jsKB       | 171 / 171 / 171       | 173 / 173 / 173            | 171 / 171 / 171      | 173 / 173 / 173           |
| transferKB | 671 / 671 / 671       | 674 / 674 / 674            | 673 / 673 / 673      | 676 / 676 / 676           |
| requests   | 43 / 43 / 43          | 45 / 45 / 45               | 43 / 43 / 43         | 45 / 45 / 45              |
| fcp, ms    | 64 / 64 / 112         | 60 / 66 / 648              | 584 / 588 / 596      | 572 / 586 / 596           |
| lcp, ms    | 64 / 64 / 112         | 60 / 66 / 648              | 584 / 588 / 596      | 572 / 586 / 596           |
| cls        | 0 / 0 / 0             | 0 / 0 / 0                  | 0 / 0 / 0            | 0 / 0 / 0                 |
| tbt, ms    | 0 / 0 / 0             | 0 / 0 / 301                | 34 / 35 / 37         | 28 / 37 / 56              |
| load, ms   | 95 / 98 / 159         | 69 / 87 / 123              | 3728 / 3834 / 3837   | 3748 / 3778 / 3789        |

`3c5982b` against `a66fd30`, measured back to back in one session with a rebuild between the two sides:

| metric     | desktop `3c5982b` (3 runs) | desktop `a66fd30` (3 runs) | mobile `3c5982b` (4 runs) | mobile `a66fd30` (4 runs) |
| ---------- | -------------------------- | -------------------------- | ------------------------- | ------------------------- |
| jsKB       | 173 / 173 / 173            | 155 / 155 / 155            | 173 / 173 / 173           | 155 / 155 / 155           |
| transferKB | 674 / 674 / 674            | 656 / 656 / 656            | 676 / 676 / 676           | 657 / 657 / 657           |
| requests   | 45 / 45 / 45               | 45 / 45 / 45               | 45 / 45 / 45              | 45 / 45 / 45              |
| fcp, ms    | 64 / 88 / 92               | 60 / 64 / 68               | 592 / 608 / 632           | 572 / 588 / 620           |
| lcp, ms    | 64 / 88 / 92               | 60 / 64 / 68               | 592 / 608 / 632           | 572 / 588 / 620           |
| cls        | 0 / 0 / 0                  | 0 / 0 / 0                  | 0 / 0 / 0                 | 0 / 0 / 0                 |
| tbt, ms    | 0 / 0 / 0                  | 0 / 0 / 0                  | 41 / 46 / 62              | 34 / 36 / 48              |

`a66fd30` against `2800cf0` (power-of-two filtering guard), all runs from the same session:

| metric     | desktop `a66fd30` (3 runs) | desktop `2800cf0` (3 runs) | mobile `a66fd30` (4 runs) | mobile `2800cf0` (4 runs) |
| ---------- | -------------------------- | -------------------------- | ------------------------- | ------------------------- |
| jsKB       | 155 / 155 / 155            | 155 / 155 / 155            | 155 / 155 / 155           | 155 / 155 / 155           |
| transferKB | 656 / 656 / 656            | 656 / 656 / 656            | 657 / 657 / 657           | 658 / 658 / 658           |
| requests   | 45 / 45 / 45               | 45 / 45 / 45               | 45 / 45 / 45              | 45 / 45 / 45              |
| fcp, ms    | 60 / 64 / 68               | 48 / 48 / 60               | 572 / 588 / 620           | 576 / 588 / 592           |
| lcp, ms    | 60 / 64 / 68               | 48 / 48 / 60               | 572 / 588 / 620           | 576 / 588 / 592           |
| cls        | 0 / 0 / 0                  | 0 / 0 / 0                  | 0 / 0 / 0                 | 0 / 0 / 0                 |
| tbt, ms    | 0 / 0 / 0                  | 0 / 0 / 0                  | 34 / 36 / 48              | 33 / 34 / 35              |

The guard adds 72 gzip bytes to the artwork chunk (3643 to 3715) and moves the mobile total `transferKB` figure from 657 to 658 KB, 72 bytes of which is that chunk growth and the rest the harness rounding to whole KB. `jsKB`, `cls` and the desktop `transferKB` figure are unchanged (the exact JavaScript transfer sum stays at 158391 bytes). The desktop `fcp` and `lcp` medians fall from 64 to 48 ms and the mobile `tbt` median from 36 to 34 ms, which is machine load rather than the change: the guard only touches the texture setup path that these sizes do not take.

Across the three commits, from `b9f7fa4` to `2800cf0`: `jsKB` 171 to 155, `transferKB` 671 to 656 on desktop and 673 to 658 on mobile, requests 43 to 45, `cls` 0 throughout, and `lcp` inside the run to run spread of the earlier session. The initial script set goes from 171857 to 151191 gzip bytes, 12.0 percent, and the artwork chunk from 34740 bytes in the HTML to 3715 bytes out of it.

Reading:

- `jsKB` is every JavaScript response the page requested inside the sample window (9 s desktop, 20 s mobile), not the initial script set. It rose by 2 KB in `3c5982b` because the artwork chunk was fetched inside that window while one chunk became three, and it fell by 18 KB in `a66fd30` when the chunk behind it lost twgl. It is now below the branch base.
- The mobile `tbt` figures move with machine load: the `b9f7fa4` sample (34 to 37 ms) was taken on a quieter machine than the `3c5982b` and `a66fd30` samples (41 to 62 and 34 to 48 ms). The two sides measured back to back in one session overlap, and the `a66fd30` median is the lower of the two, so the difference between the commits is not attributable to the code change.
- `cls` is 0 in every run of every build. The LCP element is server HTML in all builds (the hero paragraph on desktop, the `h1` on mobile) and is not touched by any of the three changes.

## Behaviour

- The canvas renders and animates at the same rates as the base build, see the equivalence section.
- The placeholder is in the served HTML: `.main-intro__art` contains `<div class="KdTdxW_placeholder"></div>` and no `<canvas>` element, and the rule that styles it (`background: #000` plus 20 px radius, 15 px below 900 px) is in the 29888 byte stylesheet the HTML links. The base build had the canvas element in the HTML instead.
- The swap is invisible and leaves nothing behind. With the artwork chunk delayed by a local proxy, a probe that polls for the canvas reports the placeholder only before the mount (`canvas: 0`, `placeholder: 1`, computed background `rgb(0, 0, 0)`, box 310x775) and, in the first poll where the canvas exists (`canvas: 1`), `placeholder: 0` with the canvas background `rgb(0, 0, 0)` and the same 310x775 parent box. A `MutationObserver` on `.main-intro__art` never observed a state with a canvas and a placeholder node together, and at the end the subtree holds only `.art`, `.art__wrapper` and `.art__canvas`. The canvas is mounted about 21 ms before its first draw, and the black background of the canvas element covers that window.
- Canvas geometry is unchanged: the `.main-intro__art` parent measures 310x775 px on desktop and 350x230 px on mobile, and the canvas inside it is 330x795 and 370x250 because the canvas wrapper is inset by 10 px.
- Scroll reveals work. After scrolling `/en` from top to bottom, all 13 reveal targets carry their `_visible` class: `rakuten`, `marketplace`, `constructor`, `store`, `darkstore`, `uae`, `samo`, `kran`, `birden` from `ui/ProjectCard`, and `parser-recruiter`, `parser-extension`, `verdi`, `behance` from `ui/Factoid`. The expected set is 9 + 4.
- Lazy videos still mount and play. The same scroll leaves 4 `<video>` elements with `readyState` 4 and a non-zero `currentTime`, paused only because they are out of view at the end of the scroll. `ui/LazyVideo` and its own observer were not touched.

## Why the 30 percent target is still not reached

The target was a drop of at least 30 percent from `jsKB` 180 to 126, or from the 171 measured on the branch base to 120. After the three commits the figure is 155, which is 9.4 percent below 171, and 151191 gzip bytes of that is the initial script set, 12.0 percent below 171857.

The floor makes the target unreachable: react-dom is 71924 and the Next client framework chunk is 45105, which is 117029 bytes of JavaScript that exists before any application code, and the Turbopack client runtime, the polyfill chunk and the module helper chunks add 19828 more. A 30 percent cut from 171 is 51 KB, and 51 KB is more than the 54828 bytes that remain outside react-dom and the framework chunk, of which 19828 bytes are Turbopack runtime and helpers rather than application code. Reaching it needs the framework itself to shrink.

What was left to remove, and what it was worth: twgl was 18748 bytes of the artwork chunk (22391 to 3643, plus 72 bytes back for the size guard) and `react-use` was a few hundred bytes of `useIntersection` plus the dependency. Both are gone. The remaining application chunks are the 13993 byte one that carries `next/image`, `LazyVideo`, `useIntersection` and the ProjectCard art for the grid below the fold, and small runtime chunks.

## Limitations of the local helper

Two limitations of the local helper are known and deliberate, and a future reader should not be surprised by them:

- `setUniforms` dispatches on the GL type it introspected for each uniform and skips a value whose runtime type does not match, for example a number sent to a `FLOAT_VEC2` or an array sent to a `FLOAT`. Nothing is logged or thrown and the uniform keeps its previous value, so a mistake of that kind produces a wrong frame rather than an error. twgl behaves the same way for unknown names but its setters coerce more loosely, so the failure mode is not identical.
- Sampler units are assigned in active-uniform order, and only `SAMPLER_2D` is handled. With the single sampler in these two programs the unit is 0. A second sampler would shift the assignment, and a `SAMPLER_CUBE` would fall through the type dispatch and never be set.

## Follow-ups

- Serving `/_next/static/media/*.jpg` from the ProjectCard static imports costs images, not JavaScript, but those imports are the reason the 13993 byte chunk exists on the critical path. A dynamic boundary for the project grid would move it, at the cost of rendering the grid without HTML.
- `ui/Art/gl.ts` covers the nine calls this component needs, with power-of-two and non power-of-two texture filtering, but only the `SAMPLER_2D` sampler type. If the artwork starts using other twgl features (instancing, VAOs, cubemaps, a second sampler), they have to be added there rather than assumed from the twgl API.
