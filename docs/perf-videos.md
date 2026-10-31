# Video payload: lazy mounting, re-encoded files, posters

Scope: the four preview videos on the landing page (`constructor`, `samo`, `kran`, `parser-extension`).
Base commit: `b0f9500`.

## What changed

1. `ui/LazyVideo/index.tsx` (new client component). Renders the caller's wrapper element with a poster placeholder and mounts the real video only when the wrapper comes within 300 px of the
   viewport. Once mounted it stays mounted. Playback pauses when the wrapper leaves the viewport and resumes when it returns, except for a non-looping clip that already reached its end: that one
   keeps its last frame instead of restarting. The `IntersectionObserver` construction is guarded with `typeof IntersectionObserver === 'function'`, the same check `react-use`'s `useIntersection`
   uses, and the observer disconnects on unmount.
2. The video element has no `poster` attribute. The placeholder is a single `next/image` that covers the wrapper until the video fires its `playing` event, and only then is it unmounted. A poster
   URL is therefore fetched exactly once, through the image optimizer, and the box always has artwork painted on it: while the video is still fetching or decoding, the placeholder is what the user
   sees.
3. The four call sites use the component: `ui/ProjectCard/index.tsx` (`ProjectCardLargeConstructor`, `ProjectCardLargeSamo`, `ProjectCardLargeKran`) and `ui/Factoid/index.tsx`
   (`FactoidParserExtension`). Each passes a `sizes` string that describes the placeholder box, which is the wrapper box, not the video box. `kran` passes `loop={false}`, matching the base markup.
4. The placeholder is a `next/image` with `fill`, `sizes`, `loading="lazy"`, `object-fit: cover` and `object-position: left top`. `fill` needs a sized parent, so the four wrapper boxes are pinned in
   SCSS to the box the media element occupied before: `constructor` gained `height: 400px`, `samo` gained `aspect-ratio: 860 / 612`, `parser-extension` gained `width: 347px` plus
   `aspect-ratio: 694 / 390` and `width: 430px` in the mobile block.
5. The placeholder is decorative: `alt=""`, no `aria-label` on the video, no `poster` attribute. The card heading already names the project.
6. The four MP4 files were re-encoded in place and four WebP posters were added under `public/videos/posters/`.

The SSR HTML contains no `<video>` element and no `_visible` class on any card, so with JavaScript disabled the page shows no player and no poster: the four wrappers start at `opacity: 0` (and
`visibility: hidden` for `constructor`) and only the JS-set `_visible` class reveals them. That matches the base commit, where the videos were equally invisible without JavaScript.

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

The 2x resolution pass cost payload: video bytes fetched after a full scroll went from 471 KB in the previous 644x540 / 674x480 pass to 809 KB with 954x800 / 860x612. The extra bytes are the
price of the sharpness fix the review asked for.

## Posters

Frame at 0.5 s of each re-encoded file, `cwebp -q 60 -m 6 -sharp_yuv`, sized to twice the placeholder box so they are not upscaled at DPR 2:

| poster                                  | pixels  | size     | placeholder box (desktop) | video element box (desktop) | scale vs box |
| --------------------------------------- | ------- | -------- | ------------------------- | --------------------------- | ------------ |
| `posters/constructor-preview.webp`      | 954x800 | 30 818 B | 415x400                   | 477x400                     | 2.00x        |
| `posters/samo-preview.webp`             | 860x612 | 30 332 B | 430x306                   | 430x306                     | 2.00x        |
| `posters/kran-preview.webp`             | 670x430 | 9 462 B  | 313x214                   | 335x215                     | 2.00x        |
| `posters/parser-extension-preview.webp` | 694x390 | 23 628 B | 347x195                   | 347x195                     | 2.00x        |

The placeholder box is not always the video box: `samo` and `parser-extension` match exactly, while the `constructor` video is 477 px wide inside its 415 px wrapper and the `kran` video is 335 px
wide inside its 313 px wrapper, in both cases overflowing and clipped as before. Since the wrapper box is what both states share and it is fixed, there is no reflow when the video replaces the
placeholder; `cover` plus the left top anchor makes the placeholder show the same crop of the frame that the overflowing video shows.

At DPR 2 every poster is at least as wide as its box, so nothing is upscaled. At DPR 3 the clipped video element still needs more pixels than the encode has:

| card               | DPR 3 requirement (video element box x 3) | encoded / poster              | upscale |
| ------------------ | ----------------------------------------- | ----------------------------- | ------- |
| `constructor`      | 1050x880                                  | 954x800                       | 1.10x   |
| `samo`             | 1098x781                                  | 860x612                       | 1.28x   |
| `parser-extension` | 1290x725                                  | 854x480                       | 1.51x   |
| `kran`             | 531x342                                   | 670x430 poster, 748x480 video | none    |

The placeholder reaches the browser through the Next image optimizer: at DPR 1 the `constructor` placeholder asks for `w=640` (19 346 B) and at DPR 3 for `w=1080` (32 234 B) from the 954x800
source. Every poster is fetched once per page view.

## Measurements

`/tmp/perf/measure.sh`, headless Chrome, cache disabled, production build, desktop 1440x900 and emulated mobile 390x844 with 4x CPU throttling and 1.6 Mbps / 150 ms. Baseline is the base commit
`b0f9500` served from a separate copy on port 3399, branch is port 3301, both measured in the same session. Timing rows list the runs and their median.

| metric                                 | baseline `b0f9500`                     | branch                             |
| -------------------------------------- | -------------------------------------- | ---------------------------------- |
| desktop initial `transferKB`           | 3032                                   | 1222                               |
| desktop initial `videoKB`              | 1810                                   | 0                                  |
| desktop initial `imgKB`                | 934                                    | 934                                |
| desktop initial `requests`             | 48                                     | 45                                 |
| desktop initial `lcp`                  | 84 / 100 / 152, median 100 ms          | 72 / 72 / 192, median 72 ms        |
| desktop initial `load`                 | 219 / 238 / 466, median 238 ms         | 89 / 137 / 206, median 137 ms      |
| desktop `cls`                          | 0                                      | 0                                  |
| desktop after full scroll `imgKB`      | 1105                                   | 1199                               |
| desktop after full scroll `videoKB`    | 1810                                   | 809                                |
| desktop after full scroll `transferKB` | 3203                                   | 2296                               |
| desktop after full scroll `lcp`        | 12628 ms (`IMG`)                       | 12608 ms (`IMG`)                   |
| desktop after full scroll `cls`        | 0                                      | 0                                  |
| mobile initial `transferKB`            | 1783                                   | 1222                               |
| mobile initial `videoKB`               | 562                                    | 0                                  |
| mobile initial `imgKB`                 | 934                                    | 934                                |
| mobile initial `lcp`                   | 780 / 868 / 892, median 868 ms         | 768 / 772 / 904, median 772 ms     |
| mobile `load`                          | 13429 / 13450 / 13457, median 13450 ms | 6613 / 6619 / 6621, median 6619 ms |
| mobile `cls`                           | 0                                      | 0                                  |
| mobile after full scroll `imgKB`       | 1064                                   | 1158                               |
| mobile after full scroll `videoKB`     | 1810                                   | 809                                |
| mobile after full scroll `transferKB`  | 3162                                   | 2255                               |
| mobile after full scroll `lcp`         | 780 ms, `P` (hero text)                | 27032 ms, `IMG` (samo placeholder) |
| mobile after full scroll `cls`         | 0                                      | 0                                  |

`imgKB` after a full scroll is the one row that grew: +94 KB on both viewports, which is exactly the four optimized posters fetched once (52 KB at DPR 1 for the same four files, 94 KB at DPR 2
and DPR 3). Before the poster attribute was removed the same row was +187 KB, because every poster was fetched twice, once raw by the video element and once through the optimizer.

After-scroll `lcp` is not comparable between the two builds. The candidate element and its paint time depend on what the probe's synthetic scroll happens to reveal: in these runs the base
commit kept the hero paragraph (`P`) on mobile, another run on the reviewer's side caught a card background paint (`DIV kran_visible`), and this branch caught the `samo` placeholder (`IMG`) because
the placeholder is lazy and paints late under the throttled profile, with an earlier run catching a `VIDEO` frame instead. On desktop both sides land on a project screenshot (`IMG`) at about the
same time (12628 ms base, 12608 ms branch). Initial `lcp` is unchanged or better on both viewports.

## Functional verification

Headless Chrome with WebGL, cache disabled, DOM and resource timing read over the live page:

- poster fetched exactly once per card. Desktop, after a full scroll: 4 requests, all to `/_next/image`, one each, 52 KB, zero raw `/videos/posters/*.webp` requests. Mobile: 4 requests, one each,
  94 KB, zero raw requests. Before any scroll: zero poster requests on both viewports.
- box never empty. On the emulated mobile viewport the `constructor` wrapper was sampled every 40 ms after scrolling it into view: placeholder present and loading at 0 ms, placeholder present
  while the video was mounted with `readyState 1` and not yet painting at 41 ms, placeholder gone at 164 ms with the video at `readyState 4`. No sample had neither a placeholder nor a playing
  video, and the wrapper stayed at 240 px throughout.
- before any scroll: 0 `<video>` elements, 12 `<img>` (8 pre-existing plus 4 placeholders), each placeholder `loading="lazy"`, wrapper boxes 415x400, 347x195, 430x306 and 313x214 on desktop and
  350x240, 430x242, 366x260 and 160x112 on mobile, the same boxes as the base commit within one rounding pixel.
- after scrolling each card into view: the video exists with `preload="none"`, no `poster` attribute and `paused=false`. 954x800 / 8.002 s, 854x480 / 8.008 s, 860x612 / 8.400 s, 748x480 / 2.035 s,
  all `readyState 4`.
- `kran`: the clip ends at `currentTime` 2.035 with `ended=true`. Scrolling to the top and back leaves it `paused=true`, `ended=true`, `currentTime` 2.035, so it does not restart.
- no JavaScript exception and no `console.error` during load or during the scroll pass. The only console entry is the pre-existing 404 for `/<lang>/_vercel/speed-insights/script.js`, which the
  layout requests outside Vercel on the base commit too.
- screenshots: `/tmp/perf/v6-card-constructor.png` (branch, scrollY 2900) against `/tmp/perf/v6-base-card-constructor.png` (base, same scrollY) shows the media box in the same place, the same size
  and the same top-left radius; `/tmp/perf/v6-cards.png` (scrollY 5900) shows the samo and kran cards with no empty box and no letterboxing. Both were taken before the poster attribute was
  removed; the placeholder and the video paint the same frame, so the geometry is unchanged by that fix.

## Trade-offs and limits

1. Video bytes after a full scroll are 809 KB instead of the 471 KB of the first pass, because two clips are now 954x800 and 860x612. That is the cost of removing the DPR 2 upscale. Dropping to
   crf 30 or 24 fps would take roughly 100 KB back if the ceiling gets tight.
2. Posters are lazy, so the placeholder is in the markup from the first paint but its bytes arrive when the card approaches the viewport. The placeholder stays mounted until the first video frame
   plays, which keeps the box filled in both states but means the poster fetch and the video fetch overlap by up to 300 px of scrolling.
3. Mobile at DPR 3 still upscales the placeholder and the video by 1.10x (`constructor`), 1.28x (`samo`) and 1.51x (`parser-extension`). `kran` is covered.
4. The pinned wrapper boxes in SCSS are the one place where layout now depends on the placeholder; a future change to a card's media box has to update both the class and the wrapper.
5. `ffmpeg`/`ffprobe` on this machine need `DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib` (ffmpeg 8.1.2 links libx265.216, brew opt points at 4.3). Nothing was installed or relinked.
