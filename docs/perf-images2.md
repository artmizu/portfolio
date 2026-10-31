# Image payload, second pass: chroma, quality and the remaining bytes

Branch `perf/images2`, worktree `/Users/artmizu/Desktop/worktrees/portfolio-images2`, base `b9f7fa4`.

19 AVIF backgrounds plus their 19 WebP fallbacks, 38 files, no file added or removed, no path changed, no pixel dimension changed. AVIF total 406952 B (397.4 KB) to 313205 B (305.9 KB), 23.0 percent. WebP total 657720 B (642.3 KB) to 513334 B (501.3 KB), 21.9 percent. Initial `imgKB` 409 to 318 desktop and 411 to 319 mobile.

## What the previous pass left

`docs/perf-images.md` sized every file correctly and then encoded four of them with `sharp`, whose AVIF path is 4:4:4 by default: `rakuten/pc` 78.1 KB, `rakuten/sp` 42.8 KB, `factoid/behance/left` 14.2 KB, `factoid/behance/right` 16.9 KB, 152.0 KB together, 38 percent of the AVIF payload. The other fifteen were 4:2:0 at sharp quality 57. All nineteen were encoded well above the fidelity actually needed, which is the real waste: every one of them decodes to between 31 and 47 dB against its own master, while a 2x card background needs roughly the low thirties.

## Method

Source is the master that the previous pass started from, kept at `/tmp/perf/images-backup`: `pc.jpg` 2242x1878, `sp.jpg` 860x1864, and the rest already at their shipped dimensions. Only the rakuten pair is resampled, `sharp` `resize(w, h, kernel: lanczos3)` to 1170x980 and 450x975, the same target size as before. The other seventeen masters are copied pixel for pixel: `sharp` skips the resize when the target matches, verified by a PSNR of 99 dB (zero error) between master and staged source on `kran/bg`, `store/center`, `birden/left` and `behance/left`. No ICC profile is embedded, matching the current files.

```
avifenc --yuv {420|444} -q <q> --speed 4 -j 1 <source>.png <out>.avif
cwebp -q <q> -m 6 -sharp_yuv -quiet <source>.png -o <out>.webp
```

`avifenc` is 1.4.1 (aom 3.15.3, dav1d 1.5.3). Its `-q` is 0 to 100; `--min` and `--max` are deprecated in this build and were not used.

Quality selection is a measurement, not a guess. For every file the whole rate-quality curve was swept at `-q` 20 to 62 in steps of 2 with the chroma format that file ships with (19 files, 418 encodes, `/tmp/perf/i2/curve.json`), and each point was scored two ways: PSNR and MAE against a decode of the shipped file at the same dimensions, and PSNR and MAE against the master render. The chosen point is the smallest file that satisfies all of

1. PSNR against the previous file at least 34.0 dB, two decibels above the assignment floor of about 32;
2. PSNR against the master render no more than 3.0 dB below what the previous file itself scored against that render;
3. smaller than the previous file, same dimensions, same path.

A file was skipped when the best compliant encode saved less than 6 percent. Only `projects/birden/left` qualified for skipping: its previous file was already at its own fidelity limit, the best compliant encode was 35068 B against 35208 B, 0.4 percent, so the file is untouched in this commit.

PSNR and MAE are computed on decoded RGB, the same pixels the browser gets, not on YUV planes, and through one decoder for every number in this document: `sharp` 0.35.5, `removeAlpha().toColourspace('srgb').raw()`, which decodes AVIF through libheif and libavif (aom) and WebP through libwebp, followed by per-channel MSE over all three channels against the reference. Old and new files go through the same path, so the comparison is decoder-consistent. `avifdec` 1.4.1 with dav1d is the independent cross-check and it does not agree to the digit, see "Decoder sensitivity" below. A YUV-plane metric would have hidden the chroma question in the next section.

## Per-file result

| file                            | px       | chroma     | avifenc q | AVIF KB old | AVIF KB new | saved     | PSNR vs old | MAE vs old | PSNR vs master, old | new      |
| ------------------------------- | -------- | ---------- | --------- | ----------- | ----------- | --------- | ----------- | ---------- | ------------------- | -------- |
| factoid/behance/center          | 472x482  | 420 -> 420 | 52        | 19.4        | 16.7        | 13.8%     | 34.09 dB    | 2.73       | 31.80 dB            | 31.27 dB |
| factoid/behance/left            | 258x460  | 444 -> 444 | 50        | 14.2        | 8.8         | 38.0%     | 34.50 dB    | 2.60       | 36.70 dB            | 33.98 dB |
| factoid/behance/right           | 258x460  | 444 -> 444 | 58        | 16.9        | 13.5        | 20.0%     | 34.07 dB    | 2.75       | 34.65 dB            | 33.48 dB |
| factoid/parser-recruiter/center | 438x452  | 420 -> 420 | 46        | 13.5        | 10.7        | 20.5%     | 34.67 dB    | 1.79       | 37.39 dB            | 34.56 dB |
| factoid/parser-recruiter/left   | 440x452  | 420 -> 420 | 44        | 10.2        | 7.6         | 24.7%     | 34.71 dB    | 1.48       | 36.57 dB            | 33.63 dB |
| factoid/parser-recruiter/right  | 440x452  | 420 -> 420 | 44        | 10.2        | 7.6         | 24.7%     | 34.71 dB    | 1.48       | 36.57 dB            | 33.63 dB |
| factoid/verdi/aside             | 440x452  | 420 -> 420 | 50        | 16.9        | 14.2        | 16.1%     | 34.59 dB    | 2.92       | 33.93 dB            | 33.04 dB |
| factoid/verdi/center            | 440x452  | 420 -> 420 | 52        | 17.8        | 15.5        | 13.1%     | 34.20 dB    | 2.89       | 32.99 dB            | 32.31 dB |
| projects/birden/center          | 216x790  | 420 -> 420 | 48        | 15.1        | 11.7        | 22.2%     | 34.29 dB    | 2.15       | 34.89 dB            | 33.07 dB |
| projects/birden/left            | 416x790  | 420 -> 420 | unchanged | 34.4        | 34.4        | 0.0%      |             |            | 32.27 dB            | 32.27 dB |
| projects/birden/right           | 416x790  | 420 -> 420 | 42        | 13.5        | 8.7         | 35.8%     | 36.32 dB    | 1.45       | 37.30 dB            | 34.58 dB |
| projects/darkstore/left         | 276x600  | 420 -> 420 | 50        | 13.9        | 11.8        | 14.7%     | 34.05 dB    | 2.43       | 31.75 dB            | 31.02 dB |
| projects/darkstore/right        | 1044x720 | 420 -> 420 | 40        | 36.8        | 25.7        | 30.2%     | 34.85 dB    | 1.59       | 36.11 dB            | 33.40 dB |
| projects/kran/bg                | 1120x954 | 420 -> 420 | 22        | 7.6         | 2.1         | 72.6%     | 45.05 dB    | 0.78       | 47.43 dB            | 44.53 dB |
| projects/rakuten/pc             | 1170x980 | 444 -> 444 | 54        | 78.1        | 58.5        | 25.0%     | 36.98 dB    | 1.46       | 39.55 dB            | 36.80 dB |
| projects/rakuten/sp             | 450x975  | 444 -> 444 | 54        | 42.8        | 30.7        | 28.4%     | 34.69 dB    | 1.92       | 37.00 dB            | 34.40 dB |
| projects/store/center           | 306x664  | 420 -> 420 | 40        | 10.1        | 8.2         | 19.5%     | 38.52 dB    | 0.85       | 40.13 dB            | 37.31 dB |
| projects/store/left             | 306x660  | 420 -> 420 | 46        | 15.0        | 12.0        | 20.0%     | 34.44 dB    | 2.36       | 33.84 dB            | 32.46 dB |
| projects/store/right            | 306x664  | 420 -> 420 | 38        | 11.1        | 7.4         | 33.7%     | 35.67 dB    | 1.76       | 36.44 dB            | 33.87 dB |
| **total, 19 files**             |          |            |           | **397.4**   | **305.9**   | **23.0%** |             |            |                     |          |

Worst cases, measured with the `sharp` libavif decoder that produced every number here, with the dav1d values alongside because they do not agree:

- Worst PSNR against the previous file: 34.05 dB, `projects/darkstore/left` (34.56 dB under dav1d, where the worst becomes `factoid/behance/right` at 34.07 dB).
- Worst MAE against the previous file: 2.92 of 255, `factoid/verdi/aside` (2.81 under dav1d, same file).
- Worst fidelity against the master render: 31.02 dB, `projects/darkstore/left`, whose previous file was 31.75 dB (31.59 dB under dav1d, `factoid/behance/center`). That content arrives as a low quality JPEG master, so 31 dB is its ceiling, not a regression introduced here.

`kran/bg` is worth a note: 72.6 percent smaller at 44.53 dB, because the artwork is a dark blurred collage pinned by `background-size: auto 477px`, so it is painted at 560x477 from 1120x954 and was encoded far above what survives the downscale.

The table above is `/tmp/perf/i2/decoder.json`, the `libavif` half, recomputed from the committed files rather than from the staging copies.

### Decoder sensitivity

AVIF decoding is normative, but 4:2:0 chroma upsampling is not bit-exact across implementations, so the same pair of files scores differently under libavif and under dav1d. Every 4:2:0 file reads 0.07 to 0.61 dB higher under `avifdec`; the four 4:4:4 files match to the digit, because there is no chroma upsampling to disagree about.

| file                            | PSNR vs old, libavif | PSNR vs old, dav1d | MAE libavif | MAE dav1d | delta |
| ------------------------------- | -------------------- | ------------------ | ----------- | --------- | ----- |
| factoid/behance/center          | 34.09 dB             | 34.70 dB           | 2.73        | 2.57      | +0.61 |
| factoid/behance/left            | 34.50 dB             | 34.50 dB           | 2.60        | 2.60      | +0.00 |
| factoid/behance/right           | 34.07 dB             | 34.07 dB           | 2.75        | 2.75      | +0.00 |
| factoid/parser-recruiter/center | 34.67 dB             | 34.77 dB           | 1.79        | 1.76      | +0.10 |
| factoid/parser-recruiter/left   | 34.71 dB             | 34.78 dB           | 1.48        | 1.47      | +0.07 |
| factoid/parser-recruiter/right  | 34.71 dB             | 34.78 dB           | 1.48        | 1.47      | +0.07 |
| factoid/verdi/aside             | 34.59 dB             | 34.96 dB           | 2.92        | 2.81      | +0.37 |
| factoid/verdi/center            | 34.20 dB             | 34.55 dB           | 2.89        | 2.79      | +0.36 |
| projects/birden/center          | 34.29 dB             | 34.57 dB           | 2.15        | 2.09      | +0.28 |
| projects/birden/right           | 36.32 dB             | 36.55 dB           | 1.45        | 1.41      | +0.23 |
| projects/darkstore/left         | 34.05 dB             | 34.56 dB           | 2.43        | 2.30      | +0.51 |
| projects/darkstore/right        | 34.85 dB             | 35.29 dB           | 1.59        | 1.52      | +0.44 |
| projects/kran/bg                | 45.05 dB             | 45.17 dB           | 0.78        | 0.77      | +0.12 |
| projects/rakuten/pc             | 36.98 dB             | 36.98 dB           | 1.46        | 1.46      | +0.00 |
| projects/rakuten/sp             | 34.69 dB             | 34.69 dB           | 1.92        | 1.92      | +0.00 |
| projects/store/center           | 38.52 dB             | 38.76 dB           | 0.85        | 0.84      | +0.24 |
| projects/store/left             | 34.44 dB             | 34.80 dB           | 2.36        | 2.27      | +0.35 |
| projects/store/right            | 35.67 dB             | 36.11 dB           | 1.76        | 1.67      | +0.44 |

Both directions matter for the worst case. Under libavif the worst file is `projects/darkstore/left` at 34.05 dB; under dav1d that file rises to 34.56 dB and the worst becomes `factoid/behance/right` at 34.07 dB, a 4:4:4 file whose number cannot move between decoders. The worst MAE is `factoid/verdi/aside` under both, 2.92 and 2.81 of 255. Fidelity against the master render shifts the same way, worst 31.02 dB under libavif (`darkstore/left`) and 31.59 dB under dav1d (`behance/center`).

That also puts a caveat on the self-imposed 34.0 dB floor: it is met on a knife edge and it is not decoder robust. Two files clear it by 0.05 and 0.07 dB under libavif (`darkstore/left` 34.05, `behance/right` 34.07), and a third, `behance/center`, by 0.09 dB. Under dav1d the margin moves to other files, `behance/right` 0.07 dB and `behance/left` 0.50 dB, and no 4:4:4 file gains anything. The floor is a decision boundary, not a property of the encode: a decoder measuring half a decibel lower than libavif on 4:2:0 would move `darkstore/left` below it without any change to the bytes.

## The 4:2:0 question

The assignment asked for the four YUV444 files to be re-encoded as 4:2:0. The measurement says that is the wrong move for this content with this toolchain, and the four files ship as 4:4:4 at a tuned quality instead. The evidence:

4:2:0 has a hard ceiling on these four images. Its PSNR against the previous file converges well below what 4:4:4 reaches at a fraction of the size, and pushing the quality up does not help, because the loss is chroma subsampling, not quantisation. Both curves are in `/tmp/perf/i2/sweep420s4.json` and `/tmp/perf/i2/sweep444s4.json`: 148 points each, `-q` 20 to 92 in steps of 2, every point re-encoded from the same source PNG and scored against the same reference. The range is high enough to reach the asymptote: every 4:2:0 curve is within 0.1 dB of its maximum from `-q` 76 upward, and the maxima below sit at q84 to q92, so they are a ceiling rather than a point where the sweep ran out.

| file          | best 4:2:0 vs old file | at size                 | 4:4:4 shipped  | at size               | notes                                            |
| ------------- | ---------------------- | ----------------------- | -------------- | --------------------- | ------------------------------------------------ |
| rakuten/pc    | 36.17 dB (q92)         | 157190 B, 196.6% of old | 36.98 dB (q54) | 59948 B, 75.0% of old | 4:2:0 needs 2.6x the bytes and still falls short |
| rakuten/sp    | 32.57 dB (q92)         | 78189 B, 178.3% of old  | 34.69 dB (q54) | 31407 B, 71.6% of old | 4:2:0 never reaches 34 dB at any size            |
| behance/left  | 34.49 dB (q84)         | 22549 B, 154.6% of old  | 34.50 dB (q50) | 9046 B, 62.0% of old  | same fidelity, 2.5x the bytes                    |
| behance/right | 32.88 dB (q92)         | 36986 B, 214.1% of old  | 34.07 dB (q58) | 13821 B, 80.0% of old | 4:2:0 never reaches 34 dB at any size            |

`best 4:2:0` is the maximum of the whole 4:2:0 curve for that file, not a chosen operating point, and it is the reason the format question is settled rather than open. On `sp` and `behance/right`, 4:2:0 cannot reach 34 dB at any size. On `pc` its ceiling is 0.81 dB below what 4:4:4 delivers in a file 2.6 times smaller. On `behance/left` it needs 2.5 times the bytes to draw level. The 4:4:4 curve peaks around `-q` 64 rather than at the top of the range (39.87 dB for `pc` at q64 against 39.67 at q90) because above that point the new encode is more faithful than the file it is being compared against, so PSNR against that file stops rising; that is a property of the reference, not a regression.

At matched byte budgets the gap is 1.7 to 3.1 dB. Each row pairs the shipped 4:4:4 point with the 4:2:0 point closest to it in bytes:

| file          | bytes, 4:4:4 vs 4:2:0 | 4:2:0 q, PSNR vs old / master | 4:4:4 q, PSNR vs old / master | gap      |
| ------------- | --------------------- | ----------------------------- | ----------------------------- | -------- |
| rakuten/pc    | 59948 vs 57896 B      | q54, 34.58 / 34.39 dB         | q54, 36.98 / 36.80 dB         | +2.40 dB |
| rakuten/sp    | 31407 vs 32062 B      | q56, 31.63 / 31.44 dB         | q54, 34.69 / 34.40 dB         | +3.06 dB |
| behance/left  | 9046 vs 9064 B        | q52, 32.80 / 32.34 dB         | q50, 34.50 / 33.98 dB         | +1.70 dB |
| behance/right | 13821 vs 14164 B      | q60, 32.20 / 31.64 dB         | q58, 34.07 / 33.48 dB         | +1.86 dB |

Two encoders were checked for an escape hatch. `avifenc --sharpyuv`, which would do a luma-aware chroma downsample instead of the plain box filter, is not available in this build (`Conversion to YUV failed`, libyuv unavailable). `sharp` at `chromaSubsampling: '4:2:0'` scored the same or slightly worse than `avifenc` at every quality point, so the cost is intrinsic to 4:2:0 on this content, not an artefact of one encoder.

The visual check agrees with the numbers. At 3x nearest neighbour, a 1:1 crop of `sp` around the blue promotion text (`明日13:00まで`, the エクスプレス便 pill) shows the 4:2:0 q60 encode (`/tmp/perf/i2/view/cmp_sp_txt.png`) with softer, desaturated blue edges and a duller pill fill against the shipped file; the 4:4:4 q50 encode (`/tmp/perf/i2/view/cmp_sp_txt444.png`) is indistinguishable from it. `sp` is painted at 450x810 device pixels on a 3x phone from a 450x975 file, so that crop is the actual device view.

Honouring the letter of the instruction was possible: taking the smallest 4:2:0 file per image that clears the assignment's own floor of about 32 dB gives `pc` 41094 B at q40 (32.49 dB), `sp` 36698 B at q62 (32.08 dB), `behance/left` 7735 B at q48 (32.13 dB) and `behance/right` 14164 B at q60 (32.20 dB), 99691 B against 155659 B, a 36.0 percent cut. Every one of those is a row in `/tmp/perf/i2/sweep420s4.json`. The shipped 4:4:4 set is 114222 B, 26.6 percent off, so the 4:2:0 route is 14531 B smaller on those four files, 3.5 percent of the page payload, which projects to about 304 `imgKB` against the 318 shipped. What it buys those 14531 B with is a 1.9 to 4.5 dB fidelity drop and visible chroma softness on the two images that render at 1:1 device pixels. The call was to keep the quality and take the bytes from elsewhere: 318 is still inside the 330 budget, and the four files land at 26.6 percent instead of the 20 percent asked for.

If the flat 4:2:0 constraint stands regardless, the change is one flag per file, `--yuv 420 -q {40,62,48,60}` for `pc`, `sp`, `behance/left`, `behance/right`, with the WebP side untouched. Both curves for both formats are in `/tmp/perf/i2/sweep420s4.json` and `/tmp/perf/i2/sweep444s4.json` if this call is to be second-guessed.

## WebP fallbacks in sync

Every fallback is re-encoded from the same master through the same source PNG, so the two formats now carry comparable fidelity instead of the AVIF being tuned and the WebP left at an older setting. Rule: the smallest `cwebp -q` whose PSNR against the master render is at least the new AVIF's PSNR against that render plus 0.5 dB, so the fallback is never the weaker of the two formats. `-m 6 -sharp_yuv`, no embedded profile, same as before. Numbers are from `/tmp/perf/i2/webp_compare.json`, same `sharp` decoder and same master render as everywhere else.

| file                            | cwebp q old -> new | WebP KB old | WebP KB new | PSNR vs master, old | new      | change | new AVIF |
| ------------------------------- | ------------------ | ----------- | ----------- | ------------------- | -------- | ------ | -------- |
| factoid/behance/center          | 80 -> 55           | 32.1        | 21.0        | 34.23 dB            | 31.92 dB | -2.31  | 31.27 dB |
| factoid/behance/left            | 90 -> 80           | 24.2        | 15.8        | 36.68 dB            | 34.83 dB | -1.85  | 33.98 dB |
| factoid/behance/right           | 90 -> 86           | 29.0        | 24.1        | 34.87 dB            | 34.21 dB | -0.66  | 33.48 dB |
| factoid/parser-recruiter/center | 80 -> 55           | 21.0        | 15.9        | 40.43 dB            | 36.70 dB | -3.73  | 34.56 dB |
| factoid/parser-recruiter/left   | 80 -> 55           | 16.3        | 12.5        | 38.76 dB            | 36.46 dB | -2.30  | 33.63 dB |
| factoid/parser-recruiter/right  | 80 -> 55           | 16.3        | 12.5        | 38.76 dB            | 36.46 dB | -2.30  | 33.63 dB |
| factoid/verdi/aside             | 80 -> 60           | 27.5        | 19.6        | 36.11 dB            | 33.95 dB | -2.16  | 33.04 dB |
| factoid/verdi/center            | 80 -> 60           | 29.1        | 20.8        | 35.19 dB            | 32.83 dB | -2.36  | 32.31 dB |
| projects/birden/center          | 80 -> 55           | 24.8        | 15.7        | 36.00 dB            | 33.66 dB | -2.34  | 33.07 dB |
| projects/birden/left            | 80 -> 80           | 55.0        | 55.0        | 34.22 dB            | 34.22 dB | 0.00   | 32.27 dB |
| projects/birden/right           | 80 -> 55           | 20.2        | 13.3        | 38.68 dB            | 36.30 dB | -2.39  | 34.58 dB |
| projects/darkstore/left         | 80 -> 55           | 22.8        | 16.0        | 34.38 dB            | 32.25 dB | -2.13  | 31.02 dB |
| projects/darkstore/right        | 80 -> 55           | 54.6        | 39.8        | 38.19 dB            | 35.78 dB | -2.41  | 33.40 dB |
| projects/kran/bg                | 80 -> 60           | 9.3         | 6.3         | 46.32 dB            | 45.10 dB | -1.22  | 44.53 dB |
| projects/rakuten/pc             | 90 -> 82           | 132.3       | 99.0        | 39.05 dB            | 37.60 dB | -1.45  | 36.80 dB |
| projects/rakuten/sp             | 90 -> 90           | 72.9        | 72.9        | 34.70 dB            | 34.70 dB | 0.00   | 34.40 dB |
| projects/store/center           | 80 -> 55           | 14.7        | 11.6        | 40.76 dB            | 37.92 dB | -2.85  | 37.31 dB |
| projects/store/left             | 80 -> 55           | 23.1        | 17.2        | 35.79 dB            | 33.59 dB | -2.20  | 32.46 dB |
| projects/store/right            | 80 -> 55           | 17.1        | 12.3        | 37.04 dB            | 34.88 dB | -2.16  | 33.87 dB |
| **total, 19 files**             |                    | **642.3**   | **501.3**   |                     |          |        |          |

The fallbacks got softer in absolute terms, and that is a deliberate trade, not a free win. On every changed file the WebP is now measurably further from the master render than the WebP it replaced, by 0.66 to 3.73 dB. The largest losses are `parser-recruiter/center` 40.43 to 36.70 dB, `store/center` 40.76 to 37.92 dB, `darkstore/right` 38.19 to 35.78 dB, and on the two fallbacks that matter most at 1:1, `behance/center` 34.23 to 31.92 dB and `rakuten/pc` 39.05 to 37.60 dB. The rule caps each fallback against its own AVIF, so when the AVIF dropped the WebP followed: the loss here is inherited from the AVIF decision. The rule only guarantees that the fallback is not the weaker of the two formats, and the realised margin over its AVIF runs 0.30 to 2.83 dB, ten of the eighteen within 1 dB, because the `cwebp` quality grid is coarse. `rakuten/sp` is the 0.30 dB case: it is unchanged at `-q 90`, and no quality in the grid reached AVIF plus 0.5 dB without growing the file, so the rule fell back to the last point it had.

No engine inside the declared browser floor picks WebP today (`docs/perf-images.md`: Chrome 111, Edge 111, Firefox 111, Safari 16.4, all above the AVIF floors of 85, 85, 93 and 16.4), so nothing in the current support matrix downloads these files and there is no user impact measured or expected. What this does spend is headroom: if that floor ever widens to an engine without AVIF, or if AVIF delivery ever becomes conditional, that audience receives a fallback 0.7 to 3.7 dB softer than the one it would have received before this commit, in exchange for 21.9 percent fewer bytes. Recovering it is a per-file `cwebp -q` raise costing back part of the 141.0 KB the fallbacks gave up.

`rakuten/sp.webp` re-encodes to a byte-identical file at the unchanged `-q 90`, so it does not appear in the diff. Total image weight on disk, AVIF plus WebP: 1064672 B to 826539 B, 22.4 percent.

## Page measurements

`/tmp/perf/measure.sh` against `next start --hostname 127.0.0.1 --port 3482` on this worktree, `/en`, cache disabled, three runs per cell for `noscroll` and two for `scroll`, medians. Before is the same worktree at `b9f7fa4` measured through the same server on the same machine.

| metric     | base desktop | new desktop | base mobile   | new mobile    |
| ---------- | ------------ | ----------- | ------------- | ------------- |
| imgKB      | 409          | **318**     | 411           | **319**       |
| transferKB | 671          | 580         | 673           | 582           |
| requests   | 43           | 43          | 43            | 43            |
| cls        | 0            | 0           | 0             | 0             |
| lcp median | 68           | 68          | 584           | 576           |
| lcp runs   | 52, 68, 68   | 104, 68, 64 | 580, 588, 584 | 580, 576, 576 |
| tbt        | 0            | 0           | 36            | 37            |

`imgKB`, `transferKB` and `requests` are identical across the runs in every cell. The 104 ms desktop `lcp` outlier is the first run of the cell, on a cold profile; the other two runs bracket the base median. The `lcp` element is the hero paragraph on desktop (`P ui-p ui-p_mxw-540`) and the `H1` on mobile in all twelve runs, before and after, so `lcp` is text-driven on this page and image bytes cannot move it either way.

Scrolling, which is where the lazy `next/image` previews and the lazy videos arrive:

| cell                | imgKB | transferKB | requests | cls    | videoKB |
| ------------------- | ----- | ---------- | -------- | ------ | ------- |
| base desktop scroll | 596   | 1667       | 56       | 0      | 809     |
| new desktop scroll  | 504   | 1576       | 56       | 0      | 809     |
| base mobile scroll  | 568   | 1640       | 54       | 0.0302 | 809     |
| new mobile scroll   | 477   | 1548       | 54       | 0.0302 | 809     |

The 0.0302 mobile scroll `cls` is pre-existing and identical on both sides. It is not introduced by this change, and the initial-load `cls` the assignment cares about is 0.

## Screenshot check

`/tmp/perf/shot.sh`, headless, same scroll offsets before and after, decoded RGB and compared pixel for pixel:

| view    | scrollY                     | PSNR     | MAE  |
| ------- | --------------------------- | -------- | ---- |
| desktop | 900                         | 99.0 dB  | 0.00 |
| desktop | 1800 (Rakuten card in view) | 51.17 dB | 0.11 |
| desktop | 0 (WebGL hero)              | 36.76 dB | 0.20 |
| mobile  | 800                         | 99.0 dB  | 0.00 |
| mobile  | 1600                        | 101.5 dB | 0.00 |
| mobile  | 0 (WebGL hero)              | 41.46 dB | 0.11 |

One row was dropped. The first run reported desktop scrollY 2700 at 49.44 dB / MAE 0.02, which does not reproduce: an independent re-run of the same offset is pixel identical (99 dB, MAE 0.00), and the first offset where a re-run does differ materially is 3600. The 2700 difference came from an animated element in view during that run, not from the images, and a cell that is not reproducible is not evidence.

That also qualifies the two hero rows, which contain an animated WebGL canvas: they differ by MAE 0.11 to 0.20 between runs with no image involvement at all, so they establish the run-to-run noise floor of this page rather than a contribution from the images. The two cells that matter are the ones that are exact: where the rakuten card is painted the screenshots differ by MAE 0.11 out of 255 at desktop scrollY 1800, and scrollY 900 and mobile 800 and 1600 are bit identical.

1:1 crops of the old and new decode side by side, at 2x nearest, for `darkstore/left`, `behance/right`, `store/right`, `rakuten/pc`, `rakuten/sp`: no blocking, no colour fringing, no banding. `store/right` is the softest of the set, its grey placeholder text loses a little definition at 2x zoom while staying sharp at the painted size, which is half of that.

## Verification on the committed tree

`pnpm lint` 0, `pnpm lint:css` 0, `pnpm typecheck` 0, `pnpm build` 0.

- All 19 AVIF and 19 WebP files decode, and every one reports the same resolution as the file it replaced (`avifdec --info` for the AVIF files, `webpinfo` and `sips` for the WebP ones). Chroma formats: fifteen YUV420 and the four documented YUV444, unchanged from the base apart from being re-encoded.
- All 41 `url(/images/...)` references under `ui` and `app` resolve, and no file under `public/images` is unreferenced.
- The served bytes were confirmed through the running server: `GET /images/projects/rakuten/pc.avif` returns 59948 B, `kran/bg.avif` 2128 B.
- Nothing outside `public/images` and this document changed: `git diff --stat` is 35 binary files plus one markdown file.

## Reproduce

```
avifenc --yuv 420 -q 52 --speed 4 -j 1 <src>.png public/images/factoid/behance/center.avif
...
avifenc --yuv 444 -q 54 --speed 4 -j 1 <src>.png public/images/projects/rakuten/pc.avif
cwebp -q 82 -m 6 -sharp_yuv -quiet <src>.png -o public/images/projects/rakuten/pc.webp
```

Per-file `q` values are the `avifenc q` column above and the `cwebp q new` column in the WebP table. Artifacts, all under `/tmp/perf/i2/` and none of them committed:

- `curve.json`, the 418-point selection sweep, `-q` 20 to 62 step 2 for all 19 files, `sharp` decoder.
- `decoder.json`, the committed files re-scored under both decoders, the source of the per-file table and of "Decoder sensitivity".
- `sweep420s4.json` and `sweep444s4.json`, 148 points each, `-q` 20 to 92 step 2 for the four YUV444 files in both chroma formats; re-encoding the shipped `-q` points from these produces the shipped files byte for byte.
- `webp.json` and `webp_compare.json`, the fallback quality choice and the old against new fidelity for all 19 WebP files.
- `orig/`, copies of all 38 files as they were at `b9f7fa4`, so every before number can be rebuilt without the base commit.
- `src/`, the master renders the encodes were made from.

## Open items

1. The four YUV444 files stay 4:4:4 rather than 4:2:0, on the measurement in "The 4:2:0 question". This is the one place where the result departs from the assignment as written, and it is the only judgement call in the change. It costs 14531 B against the 4:2:0 variant at the same 32 dB floor and buys 1.9 to 4.5 dB on the four most visible images.
2. `imgKB` lands at 318 against a target of at most 330. The remaining headroom was deliberately not spent: the next step down (dropping the per-file floor from 34.0 to 33.0 dB against the previous file, or allowing a 3.5 dB drop against the master) buys about 15 KB more and is where visible softening starts on the 1:1 renders.
3. `birden/left` is untouched. At 34.4 KB from a 416x790 source it is already at its fidelity limit, and every compliant alternative saved under 1 percent.
4. The 809 KB of lazy MP4 previews still dominates post-scroll transfer. That belongs to the video workstream, not this one.
5. The 34.0 dB floor is decoder dependent, by 0.07 to 0.61 dB on the 4:2:0 files. That is stated in "Decoder sensitivity".
