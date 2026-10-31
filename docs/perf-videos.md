# Video payload: lazy mounting, re-encoded files, posters

Scope: the four preview videos on the landing page (`constructor`, `samo`, `kran`, `parser-extension`).
Base commit: `b0f9500`.

## What changed

1. `ui/LazyVideo/index.tsx` (new client component). Renders the existing wrapper element with a poster `<img>` that carries the same CSS class the `<video>` used, and mounts the real
   `<video preload="none" playsInline muted autoPlay loop src poster>` only when the wrapper comes within 300 px of the viewport. Once mounted it stays mounted. Playback pauses when the wrapper
   leaves the viewport and resumes when it returns. The IntersectionObserver disconnects on unmount.
2. The four `<video>` call sites now use `LazyVideo`: `ui/ProjectCard/index.tsx` (`ProjectCardLargeConstructor`, `ProjectCardLargeSamo`, `ProjectCardLargeKran`) and `ui/Factoid/index.tsx`
   (`FactoidParserExtension`). CSS classes, wrapper classes and markup nesting are unchanged.
3. The four MP4 files were re-encoded in place and four WebP posters were added under `public/videos/posters/`.

## Videos

`libx264 -crf 28 -preset slow -profile:v high`, `-pix_fmt yuv420p`, `-an`, `-movflags +faststart`. The sources have non-square pixels, so each file was scaled to its own display size and
`setsar=1` was applied. The rendered box on the page is therefore identical to the original (`477x400`, `430x306`, `335x215`, `347x195` at desktop widths).

| file                                   | before size | before pixels          | before duration | after size | after pixels | after SAR | after duration |
| -------------------------------------- | ----------- | ---------------------- | --------------- | ---------- | ------------ | --------- | -------------- |
| `projects/constructor-preview.mp4`     | 4 720 929 B | 1280x720, SAR 108:161  | 44.08 s         | 274 821 B  | 644x540      | 1:1       | 8.00 s         |
| `projects/samo-preview.mp4`            | 1 278 246 B | 720x480, SAR 2252:2403 | 56.98 s         | 96 178 B   | 674x480      | 1:1       | 8.40 s         |
| `projects/kran-preview.mp4`            | 77 308 B    | 720x480, SAR 281:270   | 2.04 s          | 37 084 B   | 748x480      | 1:1       | 2.04 s         |
| `factoid/parser-extension-preview.mp4` | 497 476 B   | 720x480, SAR 32:27     | 25.16 s         | 73 447 B   | 854x480      | 1:1       | 8.01 s         |

Total on disk: 6 573 959 B to 481 530 B (-93%).

Loop segments (chosen from contact sheets of each source):

- `constructor`: 20.5 s to 28.5 s, the promo page builder with the "Новый раздел телефонов" card grid.
- `samo`: 48.5 s to 56.9 s, the kanban board ending on the stacked column chart.
- `kran`: the whole clip, it is only 2.04 s long.
- `parser-extension`: 4.0 s to 12.0 s, the parsed list with the tooltip and the item state changes.

`moov` is placed before `mdat` in all four files (faststart verified by byte offset).

## Posters

Frame at 0.5 s of each re-encoded file, WebP via `cwebp`, sized to the CSS display box at 2x:

| poster                                  | pixels  | size     | CSS box (desktop) |
| --------------------------------------- | ------- | -------- | ----------------- |
| `posters/constructor-preview.webp`      | 954x800 | 25 736 B | 477x400           |
| `posters/samo-preview.webp`             | 719x512 | 24 576 B | 430x306           |
| `posters/kran-preview.webp`             | 670x430 | 9 462 B  | 335x215           |
| `posters/parser-extension-preview.webp` | 694x390 | 23 628 B | 347x195           |

`samo` is 719 px wide instead of 860 px because the encoded video is 674 px wide and upscaling adds no detail. Every poster keeps the exact aspect ratio of its video, so the poster box and the
video box are the same size and there is no reflow when the video replaces the poster.

No `width`/`height` attributes are set on the `<img>` or the `<video>`: on `video` and on `img` Chrome applies those attributes as presentational hints, which overrode the CSS-derived height
(the constructor block grew from 400 px to 540 px). The CSS classes alone produce the correct box.

## Measurements

Cache disabled, production build, `HEAD` of this branch, harness `/tmp/perf/measure.sh` (headless Chrome, `--disable-gpu`), 1440x900 desktop and 390x844 emulated mobile.

| metric                       | baseline | after   |
| ---------------------------- | -------- | ------- |
| desktop initial `transferKB` | 3032     | 1294    |
| desktop initial `videoKB`    | 1810     | 0       |
| desktop initial `imgKB`      | 934      | 1017    |
| desktop initial `lcp`        | 184 ms   | 100 ms  |
| desktop `cls`                | 0        | 0       |
| desktop `load`               | 970 ms   | 253 ms  |
| desktop `requests`           | 48       | 46      |
| mobile `load`                | 13488 ms | 6898 ms |
| mobile initial `videoKB`     | 562      | 0       |
| mobile `lcp`                 | 916 ms   | 868 ms  |
| mobile `cls`                 | 0        | 0       |

`videoKB` after a full scroll: 471 KB (constructor 269, parser-extension 72, samo 94, kran 37), measured with the same resource-timing formula on a cache-disabled headless run. The
`--disable-gpu` headless Chrome used by `measure.sh` cannot report this row: the site's WebGL hero throws `Canvas context not found` during hydration there (also on the base commit), so React
never mounts the cards and nothing is observed while scrolling. The initial-load rows are unaffected because the removed videos are absent from the server HTML and the posters are part of it.

## Functional verification

Headless Chrome with SwiftShader (WebGL available), cache disabled:

- before any scroll: 0 `<video>` elements, 4 poster images loaded and laid out at 477x400, 347x195, 430x306, 335x215.
- after scrolling each card into view: all four videos exist with `preload="none"`, `poster` set, `paused=false`, `loop=true`
  (constructor 644x540 at 8.002 s, parser-extension 854x480 at 8.008 s, samo 674x480 at 8.400 s, kran 748x480 at 2.035 s).
- after scrolling back to the top: all four report `paused=true`, so the pause/resume path works.
- no JavaScript exceptions. The only console entry is a pre-existing 404 for `/<lang>/_vercel/speed-insights/script.js`, which `app/[lng]/layout.tsx` requests outside Vercel on the base commit
  as well.
