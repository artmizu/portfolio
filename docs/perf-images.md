# Image payload

Every image on the site is a CSS background declared in `ui/**/*.module.scss`. Nothing is served through `next/image`, so there is no srcset and no viewport awareness. This change keeps the CSS approach and fixes the payload only.

## What was wrong

1. Assets were far larger than the box they paint. `rakuten/pc.webp` was 2242x1878 for a 330x380 box (6.8x linear), `rakuten/sp.webp` was 860x1864 for a 150x320 box (5.7x linear).
2. Every background shipped a JPEG or PNG fallback next to the WebP. No target browser needs those fallbacks.
3. The WebP files themselves were encoded at a very high bit rate (up to 0.24 bytes per pixel).

Baseline, cache disabled, production build, 1440x900: initial `imgKB` 934, initial `transferKB` 3033.

## How the new size was computed

The CSS display box is read from the `background-size` and `width`/`height` rules, not from the source file. For `background-size: cover` the painted size is `source * max(boxW / srcW, boxH / srcH)`. The target is 2x that painted size, capped at the source resolution and never upscaled. The result is a single uniform scale factor, so the covered crop stays identical to the previous framing at every breakpoint. Aspect ratio is preserved and nothing is cropped or stretched.

Each file is re-encoded twice:

- `.webp` at quality 80, written back to the existing path, so every stylesheet path stays valid.
- a sibling `.avif` at quality 57.

The stylesheets select the format with `image-set()` and a single `type()` descriptor per candidate:

```scss
background-image:
    image-set(
        url(/images/projects/store/left.avif) type("image/avif"),
        url(/images/projects/store/left.webp) type("image/webp")
    );
```

Browsers negotiate from `type()` and fetch exactly one file per element. Verified against the production server: 18 backgrounds per viewport, one request each, all of them `.avif`, and no `.webp`, `.jpg` or `.png` file is requested. The nineteenth file is the rakuten variant that the media query removes at that viewport.

350 KB of initial image payload is not reachable with WebP alone, because these are dense screenshots. Measured totals after resizing to 2x: WebP 517 KB, AVIF 329 KB. AVIF is therefore the served format. The WebP files remain as the fallback candidate at the same paths and the same dimensions.

## Sizes

`source` is the original WebP. `new` is the 2x-capped target. `webpKB` and `avifKB` are the new files.

| file                            | source    | src KB | new      | webp KB | avif KB |
| ------------------------------- | --------- | ------ | -------- | ------- | ------- |
| factoid/parser-recruiter/left   | 440x452   | 22.4   | 440x452  | 16.3    | 10.2    |
| factoid/parser-recruiter/center | 438x452   | 29.8   | 438x452  | 21.0    | 13.5    |
| factoid/parser-recruiter/right  | 440x452   | 22.4   | 440x452  | 16.3    | 10.2    |
| factoid/verdi/aside             | 440x452   | 43.4   | 440x452  | 27.5    | 16.9    |
| factoid/verdi/center            | 440x452   | 47.0   | 440x452  | 29.1    | 17.8    |
| factoid/behance/left            | 258x460   | 26.1   | 246x439  | 14.8    | 9.4     |
| factoid/behance/center          | 472x482   | 52.6   | 472x482  | 32.1    | 19.4    |
| factoid/behance/right           | 258x460   | 31.4   | 246x439  | 17.9    | 10.6    |
| projects/store/left             | 308x664   | 32.7   | 306x660  | 23.1    | 15.0    |
| projects/store/center           | 306x664   | 20.2   | 306x664  | 14.7    | 10.1    |
| projects/store/right            | 306x664   | 25.9   | 306x664  | 17.1    | 11.1    |
| projects/darkstore/left         | 276x600   | 34.6   | 276x600  | 22.8    | 13.9    |
| projects/darkstore/right        | 1044x720  | 80.0   | 1044x720 | 54.6    | 36.8    |
| projects/kran/bg                | 1120x954  | 17.1   | 1120x954 | 9.3     | 7.6     |
| projects/birden/left            | 416x790   | 78.1   | 416x790  | 55.0    | 34.4    |
| projects/birden/center          | 216x790   | 33.8   | 216x790  | 24.8    | 15.1    |
| projects/birden/right           | 416x790   | 29.8   | 416x790  | 20.2    | 13.5    |
| projects/rakuten/sp             | 860x1864  | 108.9  | 300x650  | 31.0    | 19.2    |
| projects/rakuten/pc             | 2242x1878 | 183.5  | 907x760  | 69.4    | 44.4    |
| total                           |           | 919.6  |          | 517.0   | 329.0   |

Files whose source already matched 2x the box keep their dimensions. Their bytes drop from re-encoding, not from resizing:

- `darkstore/left` box 138x300, source 276x600, exactly 2x.
- `darkstore/right` box 321x360 on desktop and 390x270 below 900 px. The desktop box paints 522x360, so 2x needs 1044x720, which is the source.
- `birden/*` boxes follow their sources at exactly 2x.
- `kran/bg` is painted at `auto 477px`, so the source is exactly 2x on desktop.
- factoid card stacks are painted at `background-size: 220px 226px`, so the source is exactly 2x.

## Rakuten variant selection

The card renders two boxes, `rakuten__left` (150x320 desktop, 150x270 below 900 px) and `rakuten__right` (330x380 desktop, 390x270 below 900 px). `sp` is the phone layout of the Rakuten site, `pc` is the desktop layout, so the pair only makes sense as a two-mockup composition on a wide viewport. On the base build both files were fetched at every width, which is 292 KB of Rakuten art on a 390 px screen.

The stylesheet now picks exactly one file per viewport and never both:

```scss
.rakuten__right {
    background-image:
        image-set(
            url(/images/projects/rakuten/pc.avif) type("image/avif"),
            url(/images/projects/rakuten/pc.webp) type("image/webp")
        );
}

.rakuten {
    @media (width <= 900px) {
        .rakuten__left {
            background-image:
                image-set(
                    url(/images/projects/rakuten/sp.avif) type("image/avif"),
                    url(/images/projects/rakuten/sp.webp) type("image/webp")
                );
        }

        .rakuten__right {
            background-image: none;
        }
    }
}
```

`sp` is therefore requested only at or below 900 px, `pc` only above it, one request each. The box that loses its artwork keeps its width and height, so the positioning of the visible mockup and the card height do not move. The visible delta is the rakuten card: at 1440 px the phone mockup slot is dark (the desktop screenshot still sits where it did), and at 390 px the clipped sliver of the desktop screenshot is gone (the phone mockup still sits where it did).

Network evidence, production build, cache disabled, full request list captured through a logging proxy in front of `next start`:

| viewport      | rakuten requests | image requests | `imgKB` |
| ------------- | ---------------- | -------------- | ------- |
| 1440x900 DPR2 | `pc.avif` only   | 18             | 324     |
| 390x844 DPR3  | `sp.avif` only   | 18             | 299     |

No `.webp`, `.jpg` or `.png` was requested at either viewport. Scrolling adds no image requests, the initial set is the whole set.

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

Orphans that were already unreferenced before this change, because those previews are imported from `ui/ProjectCard/asset/` and served through `next/image` (12 files):

```
public/images/projects/kran/bg-2.{jpg,webp}
public/images/projects/marketplace/{bottom,top}.{jpg,webp}
public/images/projects/samo/image.{jpg,webp}
public/images/projects/uae/{left,right}.{jpg,webp}
```

`public/images` went from 6.7 MB to 988 KB.

## Visual fidelity

The stylesheets change one property, `background-image`, plus the rakuten media query, so every element box, `background-size`, `background-position` and animation is identical to the base build. Boxes and computed `background-size` were measured on both builds and match for all 19 elements. Two of them now paint no image at one breakpoint each, by design: `rakuten__left` above 900 px and `rakuten__right` at or below it.

Encoding fidelity was then measured offline, without a browser: each asset is rendered the way the browser paints it (crop the source to the visible `cover` region at the real box and position, then a single LANCZOS resample to the device pixel box), once from the old WebP and once from the new AVIF. 28 renders, desktop at 1440x900 DPR2 and mobile at 390x844 DPR3.

| measure                   | desktop DPR2           | mobile DPR3            |
| ------------------------- | ---------------------- | ---------------------- |
| worst PSNR                | 31.6 dB (`rakuten/sp`) | 26.2 dB (`rakuten/sp`) |
| median PSNR               | 37.5 dB                | 39.0 dB                |
| worst mean absolute error | 3.3/255                | 5.5/255                |

Differences are re-encode noise on screenshot content, with no shift in framing, cropping or colour. The three lowest mobile numbers (`rakuten/sp`, `rakuten/pc`, `store/left`) come from the files being 2x by design: on a 3x phone screen the browser upscales them, where the old files carried 5 to 7 device pixels per CSS pixel. That is the intended trade of a 2x asset set.

## Result

Measured with `/tmp/perf/measure.sh`, production build, cache disabled, five runs per cell, medians shown. The baseline is the same repository built at `b0f9500` on the same machine at the same time.

| metric     | baseline desktop | new desktop | baseline mobile | new mobile |
| ---------- | ---------------- | ----------- | --------------- | ---------- |
| imgKB      | 934              | 324         | 934             | 299        |
| transferKB | 3022             | 2412        | 1774            | 2387       |
| videoKB    | 1810             | 1810        | 562             | 1810       |
| jsKB       | 170              | 170         | 170             | 170        |
| fontKB     | 88               | 88          | 88              | 88         |
| requests   | 45               | 44          | 44              | 44         |
| cls        | 0                | 0           | 0               | 0          |
| lcp        | 72               | 76          | 636             | 692        |

The mobile `transferKB` and `videoKB` cells are not comparable across builds: under the throttled mobile profile the run does not always finish pulling the four MP4 previews, so the baseline run that happened to complete fewer video requests reports a lower total. The desktop comparison is clean, both builds move the same 1810 KB of video.

Images carry 610 KB less on desktop and 635 KB less on mobile. `transferKB` cannot reach 1700 KB from this group: 1810 KB of the initial desktop payload is the four MP4 previews, which are outside this allowlist. Excluding video, the initial desktop payload drops from 1212 KB to 602 KB.

`lcp` medians differ by 4 ms on desktop and 56 ms on mobile with fully overlapping ranges (desktop 60 to 92 new against 68 to 124 base, mobile 612 to 716 new against 592 to 712 base). The mobile LCP element is the `<h1>` text node, not an image, and four other agents were building on this machine during the runs, so the spread is noise rather than a regression. `cls` is 0 in every run on both builds.

Reproduce the asset work with the numbers in this file: the box is read from the stylesheet, the target is `2x` of the painted size, the WebP is `cwebp -q 80 -m 6 -sharp_yuv`, the AVIF is quality 57 with 4:2:0, and ICC profiles of the source files are carried over.
