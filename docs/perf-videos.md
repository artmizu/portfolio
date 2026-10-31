# Video payload: lazy mounting, re-encoded files, posters

Scope: the four preview videos on the landing page (`constructor`, `samo`, `kran`, `parser-extension`).
Base commit: `b0f9500`.

## What changed

1. `ui/LazyVideo/index.tsx` (new client component). Renders the caller's wrapper element with a poster image and mounts the real video only when the wrapper comes within 300 px of the
   viewport. Once mounted it stays mounted. Playback pauses when the wrapper leaves the viewport and resumes when it returns, except for a non-looping clip that already reached its end: that one
   keeps its last frame instead of restarting. The `IntersectionObserver` construction is guarded with `typeof IntersectionObserver === 'function'`, the same check `react-use`'s `useIntersection`
   uses, and the observer disconnects on unmount.
2. The four call sites use it: `ui/ProjectCard/index.tsx` (`ProjectCardLargeConstructor`, `ProjectCardLargeSamo`, `ProjectCardLargeKran`) and `ui/Factoid/index.tsx` (`FactoidParserExtension`).
   Each passes a `sizes` string taken from its CSS box so the poster is fetched at a usable width. `kran` passes `loop={false}`, matching the base markup, which has no `loop` on that clip.
3. The poster is a `next/image` with `fill`, `sizes`, `loading="lazy"`, `object-fit: cover` and `object-position: left top`. `fill` needs a sized parent, so the four wrapper boxes are now pinned in
   SCSS to exactly the box the video occupied before: `constructor` gained `height: 400px`, `samo` gained `aspect-ratio: 860 / 612`, `parser-extension` gained `width: 347px` plus
   `aspect-ratio: 694 / 390` and `width: 430px` in the mobile block. `cover` plus the left top anchor reproduces the crop the media element got from its own class, where the
   `constructor` video is 477 px wide inside a 415 px wrapper and the `kran` video is 335 px wide inside a 313 px wrapper.
4. The poster is decorative: `alt=""`, no `aria-label` on the video. The card heading already names the project.
5. The four MP4 files were re-encoded in place and four WebP posters were added under `public/videos/posters/`.

The SSR HTML contains no `<video>` element. With JavaScript disabled the page therefore shows the four poster images and no video player at all.

## Videos

`-c:v libx264 -crf 28 -preset slow -profile:v high -pix_fmt yuv420p -an -movflags +faststart`. The sources have non-square pixels, so each file was scaled to its own display size and `setsar=1`
was applied, which keeps the rendered box identical to the original.

| file                                   | before pixels / SAR    | before duration | before size | after pixels | after SAR | after duration | after size |
| -------------------------------------- | ---------------------- | --------------- | ----------- | ------------ | --------- | -------------- | ---------- |
| `projects/constructor-preview.mp4`     | 1280x720, SAR 108:161  | 44.078 s        | 4 720 929 B | 954x800      | 1:1       | 8.002 s        | 595 492 B  |
| `projects/samo-preview.mp4`            | 720x480, SAR 2252:2403 | 56.978 s        | 1 278 246 B | 860x612      | 1:1       | 8.400 s        | 121 355 B  |
| `projects/kran-preview.mp4`            | 720x480, SAR 281:270   | 2.035 s         | 77 308 B    | 748x480      | 1:1       | 2.035 s        | 37 084 B   |
| `factoid/parser-extension-preview.mp4` | 720x480, SAR 32:27     | 25.158 s        | 497 476 B   | 854x480      | 1:1       | 8.008 s        | 73 447 B   |

Total on disk: 6 573 959 B to 827 378 B. In-page metadata after decode: `videoWidth x videoHeight` 954x800, 860x612, 748x480 and 854x480, durations 8.002, 8.400, 2.035 and 8.008 s.

The loop segments are hard cuts, taken at the same offsets as the previous pass and chosen from contact sheets of each source:

- `constructor`: 20.5 s to 28.5 s, the promo page builder with the phone card grid.
- `samo`: 48.5 s to 56.9 s, the kanban board ending on the stacked column chart.
- `kran`: the whole clip, it is only 2.04 s long.
- `parser-extension`: 4.0 s to 12.0 s, the parsed list with the tooltip and the item state changes.

`moov` is placed before `mdat` in all four files (faststart verified by reading the atom order).

## Posters

Frame at 0.5 s of each re-encoded file, `cwebp -q 60 -m 6 -sharp_yuv`, sized to twice the CSS box so HiDPI screens are not upscaled by the poster:

| poster                                  | pixels  | size     | CSS box (desktop) | scale vs CSS box |
| --------------------------------------- | ------- | -------- | ----------------- | ---------------- |
| `posters/constructor-preview.webp`      | 954x800 | 30 818 B | 477x400           | 2.00x            |
| `posters/samo-preview.webp`             | 860x612 | 30 332 B | 430x306           | 2.00x            |
| `posters/kran-preview.webp`             | 670x430 | 9 462 B  | 335x215           | 2.00x            |
| `posters/parser-extension-preview.webp` | 694x390 | 23 628 B | 347x195           | 2.00x            |

Every poster keeps the exact aspect ratio of its video, so poster box equals video box and there is no reflow when the video replaces the poster.

Remaining resolution gap on mobile at DPR 3: `constructor` needs 1050x720 and has 954x800, `samo` needs 1098x781 and has 860x612, `parser-extension` needs 1290x725 and has 854x480.
`kran` needs 480x336 and has 748x480. Desktop at DPR 2 is covered for all four.

The poster reaches the browser through the Next image optimizer: at DPR 1 it asks for `w=640` (19 046 B), at DPR 2 for `w=1080` (32 234 B) from the 954x800 source. The optimizer output is served as
`image/webp`.

## Measurements

`/tmp/perf/measure.sh`, headless Chrome, cache disabled, production build, desktop 1440x900 and emulated mobile 390x844 with 4x CPU throttling and 1.6 Mbps / 150 ms. Baseline is the base commit
`b0f9500` served from a separate copy on port 3399, branch is port 3301, both measured in the same session.

| metric                                 | baseline `b0f9500`        | branch                         |
| -------------------------------------- | ------------------------- | ------------------------------ |
| desktop initial `transferKB`           | 3032                      | 1222                           |
| desktop initial `videoKB`              | 1810                      | 0                              |
| desktop initial `imgKB`                | 934                       | 934                            |
| desktop initial `requests`             | 48                        | 45                             |
| desktop initial `lcp`                  | 100 / 116 ms              | 80 to 108 ms (4 runs)          |
| desktop initial `load`                 | 226 / 257 ms              | 99 to 139 ms (4 runs)          |
| desktop `cls`                          | 0                         | 0                              |
| desktop after full scroll `videoKB`    | 1810                      | 809                            |
| desktop after full scroll `transferKB` | 3203                      | 2389                           |
| desktop after full scroll `lcp`        | 12636 ms (`IMG`)          | 12604 ms (`IMG`)               |
| desktop after full scroll `cls`        | 0                         | 0                              |
| mobile initial `transferKB`            | 1783                      | 1222                           |
| mobile initial `videoKB`               | 562                       | 0                              |
| mobile initial `imgKB`                 | 934                       | 934                            |
| mobile `load`                          | 13456 / 13426 ms (2 runs) | 6592 / 6618 / 6632 ms (3 runs) |
| mobile `lcp`                           | 776 / 888 ms (2 runs)     | 776 / 872 / 876 ms (3 runs)    |
| mobile `cls`                           | 0                         | 0                              |

Each timing row lists separate runs of the same measurement. `imgKB` is unchanged between the columns: no poster is requested during initial load, the four poster files only arrive when their card
approaches the viewport. Videos fetched after a full scroll, from resource timing: 809 KB (constructor 582, samo 119, parser-extension 72, kran 37).

The after-full-scroll `lcp` is an `IMG` in both columns: the largest paint on the page is a project screenshot that only arrives when it scrolls into view, so that row moves with the probe's scroll
speed, not with this change.

## Functional verification

Headless Chrome with WebGL, cache disabled, DOM read over the live page:

- before any scroll: 0 `<video>` elements, 4 wrapper boxes at 415x400, 347x195, 430x306 and 313x214, each holding one `next/image` poster with `loading="lazy"`. No poster file requested yet.
- approaching the `constructor` card: its poster is `complete` and laid out at 415x400, which is the box the video used to occupy.
- after scrolling each card into view: the video exists with `preload="none"`, `poster` set and `paused=false`. 954x800 / 8.002 s, 854x480 / 8.008 s, 860x612 / 8.400 s, 748x480 / 2.035 s, all
  `readyState 4`.
- `kran`: the clip ends at `currentTime` 2.035 with `ended=true`. Scrolling to the top and back leaves it `paused=true`, `ended=true`, `currentTime` 2.035, so it does not restart.
- mobile 390x844: wrapper boxes 350x240, 430x242, 366x260 and 160x112, identical to the base commit's boxes for the same cards (within one rounding pixel).
- no JavaScript exception and no `console.error` during load or during the scroll pass. The only console entry is the pre-existing 404 for `/<lang>/_vercel/speed-insights/script.js`, which the
  layout requests outside Vercel on the base commit too.
- screenshots: `/tmp/perf/v6-card-constructor.png` (branch, scrollY 2900) against `/tmp/perf/v6-base-card-constructor.png` (base, same scrollY) shows the video box in the same place, the same
  size and the same top-left radius; `/tmp/perf/v6-cards.png` (scrollY 5900) shows the samo and kran cards with no empty box and no letterboxing.
