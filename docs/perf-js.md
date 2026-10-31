# Initial JavaScript payload

This document records why the WebGL artwork and `react-use` left the initial JavaScript payload of `/en`, what the chunk layout is before and after, and what the measurements show. The mechanism is sound and the artwork, the scroll reveals and the lazy videos still work, but the payload target of the assignment (initial `jsKB` down by 30 percent) is not reached. The arithmetic that makes that target unreachable is in the last section.

## What changed

1. The WebGL artwork is loaded as a separate chunk instead of being part of the page's initial script set. `ui/Art/index.tsx` is now a client wrapper that calls `next/dynamic(() => import('./Canvas'), { ssr: false, loading: ArtPlaceholder })`; the previous component moved unchanged to `ui/Art/Canvas.tsx`. The placeholder is a `div` styled by `ui/Art/placeholder.module.scss`: `width/height: 100%`, the same `border-radius` as the canvas container (20 px, 15 px below 900 px) and a dark blue and red gradient, so it is not an empty white box. The style comes from the initially loaded stylesheet, not from the artwork chunk. The box of the placeholder is the box of the canvas in both breakpoints, because both fill the same parent: 310x775 px on desktop and 350x230 px on mobile. The server output of `.main-intro__art` is the React Suspense fallback for the `ssr: false` component, that is `<div class="KdTdxW_placeholder"></div>` and no canvas, and the client swaps the canvas in after hydration without moving anything (measured `cls` is 0 in every run).
2. `react-use` is gone. `shared/useIntersection.ts` returns the latest `IntersectionObserverEntry` (or `null`) for a ref, takes `rootMargin` and `threshold` as primitives so the effect re-subscribes only when those values change, is SSR safe (`IntersectionObserver` is checked before use, the observer is created in an effect), and disconnects on unmount. `ui/ProjectCard/index.tsx` and `ui/Factoid/index.tsx` use it with the same options (`rootMargin: '0px'`, `threshold: 0.8`), and `ui/ProjectCard/index.tsx` keeps its `useEffectEvent` callback so parent renders do not re-subscribe the observer. `react-use` and its 4 transitive packages were removed from `package.json` and `pnpm-lock.yaml`.

## Chunk layout

Sizes are gzip bytes of the file on disk, and the transfer figure is what the browser reports for the request. `/en` was served by `next start` on `127.0.0.1:3481` from this worktree, base commit `b9f7fa4` first and then the change, so both sides share the same origin, server and harness.

Base, initial script set from the served HTML (all fetched):

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

`0cz1d0mv5g_q7.js` (39490) is a `noModule` legacy chunk in the same HTML; Chrome does not fetch it and it is excluded from every number here.

Change, initial script set from the served HTML:

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

The artwork chunk is not in the HTML:

| chunk             | gzip bytes | content                             | fetched at |
| ----------------- | ---------- | ----------------------------------- | ---------- |
| 29xdxyzg6apze.js  | 22391      | twgl.js UMD and the `ui/Art` canvas | 108 ms     |
| 2a3t-z__jp_dv.css | 276        | `ui/Art/index.module.scss`          | 108 ms     |

Timing on a loopback run: initial scripts requested at 20 ms, first contentful paint at 80 ms, artwork chunk requested at 108 ms and done at 117 ms. The chunk is requested by the `next/dynamic` loader during hydration, the compiled loader is `dynamic(() => import(...), { loadableGenerated: ..., ssr: false, loading: () => <div className={placeholder} /> })`. The placeholder stylesheet (`KdTdxW_placeholder`, gradient and radius) is part of the 30004 byte app stylesheet that the HTML links, so the placeholder is painted before the artwork chunk exists. That chunk is not part of the server output for the page either: the server renders the Suspense fallback `<div class="KdTdxW_placeholder"></div>` inside `.main-intro__art`, and the canvas replaces it on the client.

So the split moved 22391 bytes of twgl and canvas code off the initial script set and 13993 bytes of code that was grouped with it in the base build stayed on the critical path in a chunk of its own. The base chunk was 34740 and the two replacement chunks are 22391 + 13993 + 353 = 36737, a 1997 byte difference, which is the per-chunk module boilerplate of one extra script.

## Measurements

Method: `pnpm build`, `next start` on port 3481, `/tmp/perf/measure.sh <url> <desktop|mobile> noscroll <out.json>`, base measured first in the same worktree, then the change. Desktop is 1440x900 at device scale factor 2, mobile is 390x844 at device scale factor 3 with 4x CPU throttling and slow 4G. Each cell is min / median / max over the runs.

| metric     | desktop base (3 runs) | desktop change (8 runs) | mobile base (3 runs) | mobile change (6 runs) |
| ---------- | --------------------- | ----------------------- | -------------------- | ---------------------- |
| jsKB       | 171 / 171 / 171       | 173 / 173 / 173         | 171 / 171 / 171      | 173 / 173 / 173        |
| transferKB | 671 / 671 / 671       | 674 / 674 / 674         | 673 / 673 / 673      | 676 / 676 / 676        |
| requests   | 43 / 43 / 43          | 45 / 45 / 45            | 43 / 43 / 43         | 45 / 45 / 45           |
| fcp, ms    | 64 / 64 / 112         | 60 / 66 / 648           | 584 / 588 / 596      | 572 / 586 / 596        |
| lcp, ms    | 64 / 64 / 112         | 60 / 66 / 648           | 584 / 588 / 596      | 572 / 586 / 596        |
| cls        | 0 / 0 / 0             | 0 / 0 / 0               | 0 / 0 / 0            | 0 / 0 / 0              |
| tbt, ms    | 0 / 0 / 0             | 0 / 0 / 301             | 34 / 35 / 37         | 28 / 37 / 56           |
| load, ms   | 95 / 98 / 159         | 69 / 87 / 123           | 3728 / 3834 / 3837   | 3748 / 3778 / 3789     |

Reading:

- `jsKB` is every JavaScript response the page requested within the sample window (9 s desktop, 20 s mobile), not the initial script set. It grows by 2 KB because the artwork chunk still arrives inside that window, and because one chunk became three.
- The initial script set shrinks from 171857 to 151191 gzip bytes, 12.0 percent, and 22391 bytes of twgl code are no longer requested before first paint. That is the change that exists; it is not the same number as `jsKB`.
- `cls` is 0 in every run of both modes. The LCP element is unchanged and is server HTML in both builds (the hero paragraph on desktop, the `h1` on mobile), and its median moves by 2 ms on desktop and 2 ms on mobile, inside the spread of the samples. The 648 ms desktop outlier is one run on a loaded machine, and the 301 ms `tbt` value is that same run.
- Mobile `tbt` medians are 35 and 37 ms with overlapping ranges. The extra chunk lands after hydration and does not add a long task that shows up in these samples.

## Behaviour

- The canvas renders and animates. A desktop page patched at 4 s counts 240 `drawArrays` calls in 2 s, which is 60 frames per second and two draws per frame, the same rate as the base build. A screenshot after load is pixel-comparable with the base screenshot: the same artwork fills the same box.
- The placeholder is in the served HTML: `.main-intro__art` contains `<div class="KdTdxW_placeholder"></div>` and no `<canvas>` element, and the rule that styles it (gradient plus 20 px radius, 15 px below 900 px) is in the 30004 byte stylesheet the HTML links. The base build had the canvas element in the HTML instead.
- Canvas geometry is unchanged: the `.main-intro__art` parent measures 310x775 px on desktop and 350x230 px on mobile, and the canvas inside it is 330x795 and 370x250 because the canvas wrapper is inset by 10 px. These are the base values.
- Scroll reveals work through the new hook. After scrolling the page from top to bottom, all 13 reveal targets carry their `_visible` class: `rakuten`, `marketplace`, `constructor`, `store`, `darkstore`, `uae`, `samo`, `kran`, `birden` from `ui/ProjectCard`, and `parser-recruiter`, `parser-extension`, `verdi`, `behance` from `ui/Factoid`. The expected set for `/en` is 9 + 4.
- Lazy videos still mount and play. The same scroll leaves 4 `<video>` elements with `readyState` 4 and a non-zero `currentTime`, paused only because they are out of view at the end of the scroll. Their own observer in `ui/LazyVideo` was not touched.

## Why the 30 percent target is not reached

The target was a drop of at least 30 percent from `jsKB` 180 to 126, or from the 171 measured here to 120. The harness sums every JavaScript response inside the sample window, and two things block that number:

1. The artwork chunk is still fetched inside the window. `next/dynamic` starts the request during hydration, at 108 ms here, so within the 9 s and 20 s windows the bytes still count. Only the initial script set shrinks.
2. The removed chunk was not 34 KB of twgl. It was 22391 bytes of twgl and canvas plus 13993 bytes of `next/image`, `LazyVideo`, `useIntersection` and ProjectCard art that the page needs anyway, and that the base build had grouped with twgl. The removable weight is 22391 bytes, 13 percent of 171, and after the split the overhead of one extra chunk takes 2 KB back.

The remaining floor makes the target arithmetically unreachable: react-dom is 71924 and the Next client framework chunk is 45105, which is 117029 bytes of JavaScript that exists before any application code, and the Turbopack client runtime, the polyfill chunk and the module helper chunks add 19828 more. A 30 percent cut from 171 is 51 KB, and 51 KB is more than the 54828 bytes that remain outside react-dom and the framework chunk, of which 19828 bytes are Turbopack runtime and helpers rather than application code. Hitting the target therefore needs the framework to shrink as well. The largest honest result available from this mechanism is the 12 percent measured above, and the largest result available at all would be to remove twgl entirely (22391 bytes, another 13 percent, which needs hand-written WebGL or a tree-shakable twgl entry point) on top of it.

## Follow-ups

- Replace `twgl.js/dist/7.x/twgl.js` (UMD, 312 KB on disk, no tree-shaking) with the module build or with the eight WebGL calls this component uses. That removes up to 22391 bytes of the artwork chunk, and it would make the total JavaScript inside the measurement window smaller than the base build instead of 2 KB larger.
- Serving `/_next/static/media/*.jpg` from the ProjectCard static imports costs images, not JavaScript, but those imports are the reason the 13993 byte chunk exists on the critical path. A dynamic boundary for the project grid would move it, at the cost of rendering the grid without HTML.
