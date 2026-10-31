# Video payload: lazy mounting, re-encoded files, posters

Scope: the four preview videos on the landing page (`constructor`, `samo`, `kran`, `parser-extension`).
Base commit: `b0f9500`.

## What changed

1. `ui/LazyVideo/index.tsx` (new client component). Renders the existing wrapper element with a poster `<img>` that carries the same CSS class the `<video>` used, and mounts the real
   `<video preload="none" playsInline muted autoPlay loop src poster>` only when the wrapper comes within 300 px of the viewport. Once mounted it stays mounted. Playback pauses when the wrapper
   leaves the viewport and resumes when it returns. The IntersectionObserver disconnects on unmount. The poster `<img>` is eager (it is the placeholder the user sees before playback) but carries
   `fetchPriority="low"` so the 83 KB of posters does not compete with the hero text that owns LCP.
2. The four `<video>` call sites now use `LazyVideo`: `ui/ProjectCard/index.tsx` (`ProjectCardLargeConstructor`, `ProjectCardLargeSamo`, `ProjectCardLargeKran`) and `ui/Factoid/index.tsx`
   (`FactoidParserExtension`). CSS classes, wrapper classes and markup nesting are unchanged. `kran` keeps the behaviour of the original markup and passes `loop={false}`: the base commit renders
   that clip without `loop`, so it plays once and holds the last frame. The other three keep `loop`.
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

Cache disabled, production build, 1440x900 desktop and 390x844 emulated mobile (4x CPU, 1.6 Mbps / 150 ms).

`/tmp/perf/measure.sh` as shipped passes `--disable-gpu`. The Chrome on this machine (156.0.8078.74) has no WebGL in that mode, `ui/Art/index.tsx` throws `Canvas context not found` from its
effect during hydration and React unmounts the page, so that harness reports `imgCount 0` and an error page for both the base commit and this branch. To get comparable numbers, baseline and
after were both measured with `/tmp/perf/measure-ng.sh`: byte for byte the same harness and probe, only without `--disable-gpu`, so WebGL works and the page renders.

| metric                                 | baseline (b0f9500)      | after                        |
| -------------------------------------- | ----------------------- | ---------------------------- |
| desktop initial `transferKB`           | 3032                    | 1304                         |
| desktop initial `videoKB`              | 1810                    | 0                            |
| desktop initial `imgKB`                | 934                     | 1017                         |
| desktop initial `requests`             | 48                      | 49                           |
| desktop initial `lcp`                  | 560 ms                  | 108 - 132 ms                 |
| desktop `cls`                          | 0                       | 0                            |
| desktop `load`                         | 689 ms                  | 126 - 152 ms                 |
| desktop after full scroll `videoKB`    | 1810                    | 471                          |
| desktop after full scroll `transferKB` | 3203                    | 1946                         |
| desktop after full scroll `lcp`        | 12584 ms (IMG)          | 12620 ms (IMG)               |
| desktop after full scroll `cls`        | 0                       | 0                            |
| mobile initial `transferKB`            | 1693 - 1783             | 1304                         |
| mobile initial `videoKB`               | 471 - 562               | 0                            |
| mobile `load` (4 runs)                 | 13401 / 13449 / 8886 ms | 6983 / 7005 / 7007 / 7131 ms |
| mobile `lcp` (4 runs)                  | 784 / 872 / 772 ms      | 776 / 776 / 780 / 960 ms     |
| mobile `cls`                           | 0                       | 0                            |

The after-full-scroll `lcp` is an `IMG` in both columns: the largest paint on the page is a project screenshot that only arrives when it scrolls into view, so that row moves with the scroll
speed of the probe, not with this change.

Videos fetched after a full scroll, from resource timing: 471 KB total (constructor 269, samo 94, parser-extension 72, kran 37). None of them is requested before the section approaches the
viewport.

## Functional verification

Headless Chrome with GPU and WebGL, 1440x900, cache disabled, poster state read before any scroll and video state read after scrolling each card to the centre of the viewport:

- before any scroll: 0 `<video>` elements, 4 poster images, all `complete`, laid out at 477x400, 347x195, 430x306 and 335x215, which is byte for byte the box the `<video>` occupied before.
  The constructor poster reports `visibility: hidden` because its own card keeps `visibility: hidden` until the reveal animation starts, exactly as on the base commit.
- after scrolling each card into view: the video for that card exists with `preload="none"`, `poster` set and `paused=false`. Constructor 644x540 / 8.002 s, parser-extension 854x480 / 8.008 s,
  samo 674x480 / 8.400 s, kran 748x480 / 2.035 s, all `readyState 4`.
- leaving a card pauses its video (`paused=true`), returning to it resumes it.
- kran reports `loop=false` and stops after its 2.035 s, matching the base markup which has no `loop` on that clip.
- no JavaScript exception and no `console.error` during load and during the scroll pass. The only console entry in the network log is the pre-existing 404 for
  `/<lang>/_vercel/speed-insights/script.js`, which the layout requests outside Vercel on the base commit too.
- screenshots of the card band at `/tmp/perf/videos5-cards.png` (scrollY 5900, samo and kran) and `/tmp/perf/videos5-card-constructor.png` (scrollY 2900): the video and poster boxes sit in
  their original position with the original border radius, no empty box, no letterboxing and no change in the surrounding text layout.
