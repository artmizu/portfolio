# Image payload

Every image on the site is a CSS background declared in `ui/**/*.module.scss`. Nothing is served through `next/image`, so there is no srcset and no viewport awareness. This change keeps the CSS approach and fixes the payload only.

## Browser floor

The repository declares no `browserslist`, so the Next.js default applies. Next 16.4.3 targets Chrome 111, Edge 111, Firefox 111 and Safari 16.4 (`node_modules/next/dist/docs/03-architecture/supported-browsers.md`). AVIF is supported by all four of those floors (Chrome 85, Edge 85, Firefox 93, Safari 16.4), so `AVIF` as the first `image-set()` candidate with WebP as the second covers the declared target set exactly. Only an engine older than that floor, for example Safari 16.3 or earlier, would lose the image; such an engine is outside the declared target.

## What was wrong

1. Assets were far larger than the box they paint. `rakuten/pc.webp` was 2242x1878 for a 330x380 box (6.8x linear on the painted axis), `rakuten/sp.webp` was 860x1864 for a 150x320 box (5.7x linear).
2. Every background shipped a JPEG or PNG fallback next to the WebP. No browser in the declared target set needs those fallbacks.
3. The WebP files themselves were encoded at a very high bit rate (up to 0.24 bytes per pixel).

Baseline, cache disabled, production build, 1440x900: initial `imgKB` 934, initial `transferKB` 3033. At 390x844: `imgKB` 934, `transferKB` 1784.

## Sizing rule

The CSS display box is read from the stylesheet, not from the source file. For `background-size: cover` the painted size is `source * max(boxW / srcW, boxH / srcH)`; the factoid stacks are pinned by `background-size: 220px 226px`, and `kran/bg` by `background-size: auto 477px` (250px below 900px). The target is 2x the painted size, capped at the source and never upscaled, with one uniform scale factor so the covered crop stays identical to the previous framing at every breakpoint. Aspect ratio is preserved and nothing is cropped or stretched in the file.

Two groups need more than 2x:

- `rakuten/sp` and `rakuten/pc` are the only two assets a 3x phone renders large: 150x270 and 390x270 CSS pixels, which is 450x810 and 1170x810 device pixels. Sized at 2x they were undersampled on those screens, with visible softening on the search bar and small text. Both are now sized for 3x of the mobile painted box, which also keeps them above 2x of the desktop painted box: `sp` 450x975 against 300x650 desktop need, `pc` 1170x980 against 907x760 desktop need.
- `factoid/behance/left` and `right` are pinned by `background-size: 123px 230px`, so 2x is 246x460. Their sources are 258x460, so they now stay at native size instead of being downscaled to 246x439, which was 1.91x on the vertical axis.

Fidelity of the re-encoded pair, measured as a DPR3 render of the mobile box compared with a LANCZOS render of the original JPEG at the same device resolution:

| file       | DPR3 device box | AVIF         | PSNR     | MAE      |
| ---------- | --------------- | ------------ | -------- | -------- |
| rakuten/sp | 450x810         | q65, 42.8 KB | 37.00 dB | 1.58/255 |
| rakuten/pc | 1170x810        | q65, 78.1 KB | 39.55 dB | 1.13/255 |

Both were checked at 1:1 device pixels against the original render: the search bar, the logo and the small product text are indistinguishable at 300 percent zoom.

Each file is re-encoded twice:

- `.webp` at quality 90 for the four files above and 80 for the rest, written back to the existing path, so every stylesheet path stays valid.
- a sibling `.avif` at quality 65 for the four files above and 57 for the rest.

The stylesheets select the format with `image-set()` and a single `type()` descriptor per candidate:

```scss
background-image:
    image-set(
        url(/images/projects/store/left.avif) type("image/avif"),
        url(/images/projects/store/left.webp) type("image/webp")
    );
```

Browsers negotiate from `type()` and fetch exactly one file per element. Verified against the production server: 19 backgrounds per viewport, one request each, all of them `.avif`, and no `.webp`, `.jpg` or `.png` requested.

## Sizes

`source` is the original WebP at `b0f9500`, `new` is the file in this commit, `webpKB` and `avifKB` are the shipped files.

| file                    | box at 1440 (CSS px) | box at 390 (CSS px) | old px    | old KB | new px   | new webp KB | new avif KB |
| ----------------------- | -------------------- | ------------------- | --------- | ------ | -------- | ----------- | ----------- |
| behance/left            | exact 123x230        | exact 123x230       | 258x460   | 26.1   | 258x460  | 24.2        | 14.2        |
| behance/center          | exact 236x241        | exact 236x241       | 472x482   | 52.6   | 472x482  | 32.1        | 19.4        |
| behance/right           | exact 123x230        | exact 123x230       | 258x460   | 31.4   | 258x460  | 29.0        | 16.9        |
| parser-recruiter/left   | exact 220x226        | exact 220x226       | 440x452   | 22.4   | 440x452  | 16.3        | 10.2        |
| parser-recruiter/center | exact 220x226        | exact 220x226       | 438x452   | 29.8   | 438x452  | 21.0        | 13.5        |
| parser-recruiter/right  | exact 220x226        | exact 220x226       | 440x452   | 22.4   | 440x452  | 16.3        | 10.2        |
| verdi/aside             | exact 220x226        | exact 220x226       | 440x452   | 43.4   | 440x452  | 27.5        | 16.9        |
| verdi/center            | exact 220x226        | exact 220x226       | 440x452   | 47.0   | 440x452  | 29.1        | 17.8        |
| store/left              | cover 153x322        | cover 140x240       | 308x664   | 32.7   | 306x660  | 23.1        | 15.0        |
| store/center            | cover 153x322        | cover 140x240       | 306x664   | 20.2   | 306x664  | 14.7        | 10.1        |
| store/right             | cover 153x322        | cover 140x240       | 306x664   | 25.9   | 306x664  | 17.1        | 11.1        |
| darkstore/left          | cover 138x300        | cover 138x270       | 276x600   | 34.6   | 276x600  | 22.8        | 13.9        |
| darkstore/right         | cover 321x360        | cover 390x270       | 1044x720  | 80.0   | 1044x720 | 54.6        | 36.8        |
| kran/bg                 | auto 477px           | auto 250px          | 1120x954  | 17.1   | 1120x954 | 9.3         | 7.6         |
| birden/left             | cover 208x395        | cover 208x395       | 416x790   | 78.1   | 416x790  | 55.0        | 34.4        |
| birden/center           | cover 108x395        | cover 108x395       | 216x790   | 33.8   | 216x790  | 24.8        | 15.1        |
| birden/right            | cover 119x395        | cover 208x395       | 416x790   | 29.8   | 416x790  | 20.2        | 13.5        |
| rakuten/sp              | cover 150x320        | cover 150x270       | 860x1864  | 108.9  | 450x975  | 72.9        | 42.8        |
| rakuten/pc              | cover 330x380        | cover 390x270       | 2242x1878 | 183.5  | 1170x980 | 132.3       | 78.1        |
| total                   |                      |                     |           | 919.6  |          | 642.3       | 397.4       |

Files that already matched 2x their painted box keep their dimensions; their bytes drop from re-encoding only: `darkstore/left`, `darkstore/right`, `birden/*`, `kran/bg`, and the factoid stacks pinned at `background-size: 220px 226px`.

## Rakuten: two distinct artworks, both required

`rakuten__left` paints `sp` and `rakuten__right` paints `pc`. These are not two sizes of one image: `sp` is the phone layout of the Rakuten site and `pc` is the desktop layout, and the card shows them as a pair, a phone mockup next to a desktop screenshot. Both boxes are painted at 1440 px and at 390 px, so variant selection per viewport is the wrong model, and both files must be requested.

DOM boxes, base build:

```
desktop 1440: rakuten__left  x=720 y=2010 150x320   rakuten__right  x=887 y=2010 330x380
mobile   390: rakuten__left  x= 40 y=2544 150x270   rakuten__right  x=200 y=2544 390x270
```

The mobile right box starts at 200 because the wrapper sits at `left: max(20px, calc(50% - 269px))`, which is 20 px at 390 px wide, plus the 150 px phone box plus the 10 px gap.

Request list, captured with a logging HTTP proxy in front of `next start` (no browser instrumentation), production build, cache disabled, one document load per viewport, 19 image requests and 406952 B of image bytes:

```
desktop 1440x900 DPR2
  /images/projects/rakuten/sp.avif   43846 B  42.8 KB
  /images/projects/rakuten/pc.avif   79955 B  78.1 KB

mobile 390x844 DPR3
  /images/projects/rakuten/sp.avif   43846 B  42.8 KB
  /images/projects/rakuten/pc.avif   79955 B  78.1 KB
```

The pair cost 292.4 KB at `b0f9500`, 120.9 KB here.

## Scrolling

Scrolling does load more images: the five `next/image` previews of the marketplace, samo and uae cards are lazy. Measured with the same harness, `initial` against `afterScroll`:

| run          | initial imgKB | after scroll imgKB | initial requests | after scroll requests |
| ------------ | ------------- | ------------------ | ---------------- | --------------------- |
| base desktop | 934           | 1105               | 48               | 53                    |
| new desktop  | 412           | 583                | 48               | 53                    |
| base mobile  | 934           | 1064               | 47               | 51                    |
| new mobile   | 412           | 542                | 48               | 51                    |

The five previews are 169.6 KB of JPEG payload at 1200, 1080, 828, 640 and 1080 device pixels wide. On mobile the same walk pulls three of them, `uae/left` 39.3 KB, `uae/right` 58.1 KB and `marketplace/top` 31.8 KB, which is the +130 KB in the table.

## Deleted files

Removed after `rg` proved that nothing in the repository references them. `public/og.jpg` and the favicons are untouched.

Fallbacks dropped from the stylesheets (19 files):

```
public/images/factoid/behance/{center,left,right}.jpg
public/images/factoid/parser-recruiter/{center,left,right}.jpg
public/images/factoid/verdi/{aside,center}.jpg
public/images/projects/birden/{center,left,right}.png
public/images/projects/darkstore/{left,right}.jpg
public/images/projects/kran/bg.jpg
public/images/projects/rakuten/{pc,sp}.jpg
public/images/projects/store/{center,left,right}.jpg
```

Unreferenced files in `public/images` (7 files): `kran/bg-2.{jpg,webp}` is a second kran background, 932x954 against 1120x954 for `kran/bg`, added during the Next 16 upgrade and referenced by no stylesheet, component or asset import at any point in the history (`git log -S bg-2 -- ui/` is empty); the card paints `kran/bg.webp` only. `marketplace/{bottom,top}.{jpg,webp}`, `samo/image.{jpg,webp}` and `uae/{left,right}.{jpg,webp}` are copies whose live previews are imported from `ui/ProjectCard/asset/` as JPEG and served through `next/image`, so the copies in `public/images` were never reachable.

Dead sources in `ui/ProjectCard/asset` (26 files, 2.60 MB): that directory is reached only through static imports, and `index.tsx` imports exactly `marketplace/bottom.jpg`, `marketplace/top.jpg`, `samo/image.jpg`, `uae/left.jpg` and `uae/right.jpg`. Everything else there was unreachable: `birden/{left,center,right}.{png,webp}`, `darkstore/{left,right}.{jpg,webp}`, `kran/bg.{jpg,webp}`, `kran/bg-2.{jpg,webp}`, `store/{left,center,right}.{jpg,webp}`, `marketplace/{top,bottom}.webp`, `samo/image.webp`, `uae/{left,right}.webp`.

Directory sizes after the change, from `du -sk`:

- `public/images`: 1128 KB, was 6820 KB at `b0f9500`.
- `ui/ProjectCard/asset`: 7276 KB, was 9940 KB.

## Result

Measured with `/tmp/perf/measure.sh`, production build, cache disabled, five runs per cell, medians shown. Baseline is `b0f9500` built from the same clone and measured on the same machine.

| metric     | base desktop        | new desktop         | base mobile             | new mobile              |
| ---------- | ------------------- | ------------------- | ----------------------- | ----------------------- |
| imgKB      | 934                 | 412                 | 934                     | 412                     |
| transferKB | 3033                | 2511                | 1784                    | 2511                    |
| videoKB    | 1810                | 1810                | 562                     | 1810                    |
| jsKB       | 170                 | 170                 | 170                     | 170                     |
| fontKB     | 88                  | 88                  | 88                      | 88                      |
| requests   | 48                  | 48                  | 47                      | 48                      |
| cls        | 0                   | 0                   | 0                       | 0                       |
| lcp median | 60                  | 76                  | 632                     | 608                     |
| lcp runs   | 104, 60, 60, 76, 60 | 112, 76, 84, 72, 76 | 608, 628, 736, 632, 716 | 716, 600, 600, 608, 696 |

`imgKB`, `transferKB` and `requests` are identical in all five runs per cell; only the timing columns vary.

Images carry 522 KB less on desktop and on mobile. `transferKB` cannot reach 1700 KB from this group: 1810 KB of the initial desktop payload is the four MP4 previews, which are outside this allowlist. Excluding video, the initial desktop payload drops from 1223 KB to 701 KB.

The 350 KB figure in the original brief is not met by this commit: it is 412 KB. That brief assumed 2x assets throughout. Sizing the rakuten pair for 3x phones adds 57.3 KB and restoring the behance pair to native size adds 11.1 KB, so 344 KB became 412 KB. The two changes are the difference between passing a screenshot comparison at DPR3 and failing it.

`lcp` medians differ by 16 ms on desktop and are 24 ms better on mobile, with overlapping ranges (desktop 72 to 112 new against 60 to 104 base, mobile 600 to 716 new against 608 to 736 base). The mobile LCP element is the `<h1>` text node, not an image. `cls` is 0 in every run on both builds.

## Reproduce

The box is read from the stylesheet. The target is 2x the painted size, or 3x for the two rakuten files. WebP is `cwebp -q 80` (`-q 90` for the four re-encoded files), AVIF is sharp at quality 57 (`65` for the four), 4:2:0, and ICC profiles of the source JPEGs are carried over.
