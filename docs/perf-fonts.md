# Fonts, image negotiation and dead assets

Measured on branch `perf/fonts` against the base commit `b0f9500`, both built with `next build`
(Next.js 16.4.3, Turbopack) and served with `next start --port 3304`.

Tools: `/tmp/perf/measure.sh <url> <desktop|mobile> <scroll|noscroll> <out.json>` for the lab
numbers (desktop 1440x900 dpr 2 unthrottled, mobile 390x844 dpr 3 with 4x CPU throttle, 1.6 Mbit/s
and 150 ms latency), `/tmp/perf/eval.sh` for the request list and timings of a loaded page, `curl`
for content negotiation and delivered pixel sizes, and a logging reverse proxy (`node`, no browser)
when a full per request list was needed. Two runs per configuration; the machine was shared with
other headless browsers, so desktop `lcp` spread reaches 60 ms and the direction matters, not single
milliseconds.

## 1. Fonts

### Shipped change in `perf/fonts`, reverted in `perf/fonts2`

This subsection describes the latin-only configuration that shipped on `perf/fonts`. It is no longer
the shipped configuration: `perf/fonts2` restores the cyrillic subsets. The history is kept as
written, and the current state with its numbers is in the last subsection of this section.

`shared/font.ts` asks for the latin subset only:

```ts
const inter = Inter({ subsets: ['latin'] });
const philosopher = Philosopher({ subsets: ['latin'], weight: '400' });
```

`subsets` in `next/font/google` controls **preloading**, not which faces are self hosted. The loader
downloads every file in the Google CSS2 response and rewrites the whole stylesheet, so all 12 subset
files (both families, latin, latin-ext, cyrillic, cyrillic-ext, greek, vietnamese) end up in
`.next/static/media/` and in the CSS with their own `unicode-range`. What changes is the `<link
rel="preload">` set in the document:

| locale          | preloaded woff2                                                | bytes |
| --------------- | -------------------------------------------------------------- | ----- |
| `/en` and `/ru` | `07c7676b89ed2778-s.p.2bn3s6zvc0dyp.woff2` (Inter latin)       | 48432 |
| `/en` and `/ru` | `51038ad943701fbc-s.p.0g1n-t9ppwqrh.woff2` (Philosopher latin) | 14000 |

### Requests per locale

Full list from the page itself (`performance.getEntriesByType('resource')`, headless, cache
disabled), base build versus this branch:

| locale | base                                                                                                          | this branch                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `/en`  | 4 files, 90212 B: Inter latin 48732, Philosopher latin 14300, Philosopher cyrillic 8136, Inter cyrillic 19044 | 2 files, 63032 B: Inter latin 48732, Philosopher latin 14300 |
| `/ru`  | 4 files, 90212 B (same four)                                                                                  | 4 files, 90212 B (same four, cyrillic fetched on demand)     |

`/en` contains no cyrillic code points (`document.documentElement.textContent` match count 0, RSC
payload included), so the browser never asks for the cyrillic faces and the harness reports `fontKB`
62 instead of 88. `/ru` contains 13249 cyrillic code points in the document source, 6067 of them in
visible text. The browser resolves them through the `unicode-range` of the cyrillic faces and pulls
exactly the same two files, in the same encoding, as the base build.

### The trade-off on `/ru`

`/ru` is the default locale (`fallbackLng` in `i18n/settings.ts`, and `x-default` points at `/ru`), so
the locale that loses its four preloads is the one most first-time visitors get. The two cyrillic
faces, 19044 + 8136 = 27180 B, are now requested only after the browser has parsed the document and
found Cyrillic text to paint. Measured on `/ru` with `/tmp/perf/eval.sh`: the latin faces finish at
29 and 31 ms, the cyrillic faces start at 53 and 66 ms and finish at 87 and 88 ms, FCP is 92 ms,
CLS is 0 in all four harness runs and LCP stays inside the noise band (see section 2). Because
next/font emits `font-display: swap`, Cyrillic text paints in the fallback face first and swaps when
the real face lands, so there is no invisible text, only a possible short swap.

The correctness of `/ru` now depends on a next/font implementation detail: it self hosts, and emits
`@font-face` with `unicode-range`, for every subset in the Google CSS2 response, including the
subsets that were not requested. If a future Next release starts filtering the response down to the
requested subsets, the cyrillic faces would disappear from the build and `/ru` would silently fall
back to the system font: no error, no failed request, just the wrong typeface. Re-check after every
`next` upgrade: `/ru` must request both cyrillic woff2 files and the computed `font-family` of the
`h1` must be `Philosopher`.

### Locale aware instances were implemented, measured and rejected

The brief asked for two instances per family selected by the `lng` parameter. Both variants were
built and measured on this machine:

| variant                                                                    | `/en` fontKB | `/ru` fontKB |
| -------------------------------------------------------------------------- | ------------ | ------------ |
| base commit                                                                | 88           | 88           |
| `interCyrillic`/`philosopherCyrillic` selected by `lng`, default `preload` | 88           | 88           |
| same, cyrillic instances at `preload: false`                               | 123          | 150          |
| single instance, latin subset (shipped)                                    | 62           | 88           |

1. With default `preload`, both instances are reachable from the route module, and preload links are
   collected per route chunk rather than per applied class: `/en` preloads all four faces
   (`07c7...`, `5103...`, `6271...`, `76b7...`), which is the base build's 88 KB. The budget of
   65 KB fails.
2. With `preload: false` on the cyrillic instances, next/font emits the preloaded and the
   non-preloaded copy of the same latin face under two file names (`...-s.p.2bn3s6zvc0dyp.woff2`
   and `...-s.2bn3s6zvc0dyp.woff2`). `/en` fetched both (48732 + 14300 twice = 123 KB), `/ru`
   fetched 150 KB.

A third blocker applies to Philosopher regardless of the variant: `ui/h1/index.tsx` applies
`philosopher.className` to the `h1` itself, and a font class on the layout wrapper cannot override a
`font-family` set on the element. `ui/h2/index.tsx` and `ui/h3/index.tsx` do not use the font class,
they take their family from CSS, but the `h1` is the element that carries the serif face on both
locales and it is outside this task's allowlist.

The shipped single instance reaches every acceptance criterion: `/en` 62 KB (budget 65), no cyrillic
request on `/en`, `/ru` unchanged at 88 KB.

That last sentence is where the reversal starts: "`/ru` unchanged at 88 KB" counted bytes but not
preloads. `/ru` still fetched the same 88 KB, just later, and the trade-off subsection above already
said which locale that hit.

### The cyrillic preloads were restored in `perf/fonts2`

Branch `perf/fonts2`, base `7f7fecd` (the merge of `perf/js`), built with `next build` and served with
`next start --port 3492`. Same tools as the rest of this document.

The owner reversed the decision: `/ru` is the default locale (`fallbackLng` in `i18n/settings.ts` and
the `x-default` alternate), so the locale that lost its preloads is the one most first-time visitors
get, and the Cyrillic faces should be back on the initial load. `shared/font.ts` now reads:

```ts
const inter = Inter({ subsets: ['latin', 'cyrillic'] });
const philosopher = Philosopher({ subsets: ['latin', 'cyrillic'], weight: '400' });
```

Nothing else changed. Because `subsets` controls preloading, not which faces are self hosted, the 12
`.next/static/media/*.woff2` files and their `@font-face` rules are identical in both builds; the
number of files marked with `-s.p.` (preloaded) goes from 2 to 4.

#### Preload links in the served HTML

| build                  | `/en` | `/ru` | faces preloaded                                                                                      |
| ---------------------- | ----- | ----- | ---------------------------------------------------------------------------------------------------- |
| latin only (`7f7fecd`) | 2     | 2     | Inter latin `07c7676b89ed2778-s.p`, Philosopher latin `51038ad943701fbc-s.p`                         |
| latin and cyrillic     | 4     | 4     | the same two plus Philosopher cyrillic `6271d0eae1748bf2-s.p`, Inter cyrillic `76b70a1dbe058eb5-s.p` |

#### woff2 requests per locale, fresh profile

`/tmp/perf/eval.sh`, `performance.getEntriesByType('resource')`, one page load each:

| locale | latin only                                                                                                                                   | latin and cyrillic                                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/en`  | 2 files, 63032 B: latin 48732 + 14300, `fontKB` 62                                                                                           | 4 files, 90212 B: adds Philosopher cyrillic 8136 and Inter cyrillic 19044, `fontKB` 88, cyrillic requests start 11 ms, end 47 ms |
| `/ru`  | 4 files, 90212 B, `fontKB` 88, cyrillic fetched on demand: Philosopher 8136 B starts 24 ms ends 38 ms, Inter 19044 B starts 33 ms ends 60 ms | 4 files, 90212 B, `fontKB` 88, all four start at 13 ms and end between 20 and 26 ms                                              |

That is the point of the revert: on `/ru` the two Cyrillic faces now arrive with the first paint
instead of 24 and 33 ms after the document started loading. On `/en` they are fetched even though the
page contains no Cyrillic code point (`document.documentElement.textContent` match count 0).

`document.fonts` after load confirms which faces exist and which are in use: the `@font-face` with
`unicode-range: U+301, U+400-45F, ...` for Inter and for Philosopher is `loaded` on both locales, the
cyrillic-ext face (`U+460-52F, ...`) stays `unloaded`, and `document.fonts.check('16px Philosopher',
'Александр')` and `document.fonts.check('16px Inter', 'разработка')` both return true.

#### Harness numbers

`/tmp/perf/measure.sh`, `noscroll`, port 3492, both sides built and measured in this session. Mobile
is 390x844 dpr 3 with 4x CPU throttling and slow 4G, desktop 1440x900 dpr 2 unthrottled.

| locale | device  | side           | runs | lcp samples                                                | lcp median | cls | fontKB | transferKB | requests |
| ------ | ------- | -------------- | ---- | ---------------------------------------------------------- | ---------- | --- | ------ | ---------- | -------- |
| `/en`  | desktop | latin only     | 4    | 76, 96, 96, 100                                            | 96         | 0   | 62     | 564        | 45       |
| `/en`  | desktop | latin+cyrillic | 5    | 60, 68, 76, 84, 84                                         | 76         | 0   | 88     | 591        | 47       |
| `/en`  | mobile  | latin only     | 8    | 572, 588, 588, 588, 592, 604, 620, 624                     | 590        | 0   | 62     | 566        | 45       |
| `/en`  | mobile  | latin+cyrillic | 8    | 596, 604, 608, 612, 616, 716, 724, 732                     | 614        | 0   | 88     | 592        | 47       |
| `/ru`  | desktop | latin only     | 4    | 80, 84, 92, 96                                             | 88         | 0   | 88     | 590        | 47       |
| `/ru`  | desktop | latin+cyrillic | 4    | 64, 68, 76, 116                                            | 72         | 0   | 88     | 590        | 47       |
| `/ru`  | mobile  | latin only     | 12   | 576, 588, 592, 592, 600, 600, 604, 604, 604, 608, 612, 724 | 602        | 0   | 88     | 591        | 47       |
| `/ru`  | mobile  | latin+cyrillic | 12   | 612, 612, 616, 624, 628, 632, 636, 720, 724, 728, 752, 772 | 634        | 0   | 88     | 591        | 47       |

`cls` is 0 in every run of both sides, both locales and both devices. `lcp` equals `fcp` in every run
(the LCP element is the lead paragraph on desktop and on `/ru` mobile, the `h1` on `/en` mobile).

Desktop: no regression. The `/en` median falls from 96 to 76 ms and the `/ru` median from 88 to 72 ms,
which is the same direction the earlier latin-only change could not demonstrate, and the samples
overlap in both directions, so neither direction is a reliable signal on this machine.

Mobile: worse, and the samples do not overlap much. `/en` 590 to 614 ms at the median, `/ru` 602 to 634
ms at the median, with a longer high tail on the cyrillic side (732 and 772 ms). `/en` also shows the
byte cost directly: the `load` event moves from 3307 to 3407 ms up to 3436 to 3468 ms, about the 27 KB
extra at the emulated 1.6 Mbit/s. `/ru` fetches the same bytes in both builds, so its shift cannot be a
byte count effect; the only difference there is that four faces are preloaded at high priority instead
of two preloaded and two requested after the document parse. The `tbt` of the cyrillic side (33 to 84
ms) is not higher than the latin-only side (36 to 89 ms), so CPU contention does not explain the shift
either. Honest summary: on the mobile emulation the revert costs about 25 to 35 ms of LCP at the
median, and the earlier latin-only change saved the mirror image of that. The acceptance criterion
"lcp not worse" is met on desktop and not met on the mobile emulation.

#### The cost of the revert on `/en`, stated explicitly

The two Cyrillic faces are 8136 + 19044 = 27180 B of woff2. `/en` fetches both because they are
preloaded, even though the page has no Cyrillic code point, so:

| metric        | `/en` latin only | `/en` latin+cyrillic | delta  |
| ------------- | ---------------- | -------------------- | ------ |
| font bytes    | 63032            | 90212                | +27180 |
| `fontKB`      | 62               | 88                   | +26    |
| `transferKB`  | 564 desktop      | 591 desktop          | +27    |
| `transferKB`  | 566 mobile       | 592 mobile           | +26    |
| requests      | 45               | 47                   | +2     |
| mobile `load` | 3307 to 3407 ms  | 3436 to 3468 ms      | +130   |

`/ru` pays nothing in bytes: same 90212 B, same `transferKB` 590 desktop and 591 mobile, same 47
requests. It buys the earlier font arrival described above.

#### Screenshots of `/ru` after the revert

`/tmp/perf/shot.sh http://127.0.0.1:3492/ru <out.png> <desktop|mobile>`, 5 s in, WebGL canvas
included:

| file                              | what it shows                                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/tmp/perf/fonts2-ru-desktop.png` | 1440x900, black background, two columns. Left: `RU` active and `EN` inactive in the switch, `Александр Крючков, разработка и дизайн` in Philosopher over two lines, the Telegram/GitHub/hello links, then the Cyrillic lead paragraphs and `3 года руководил командой разработки` in Inter Cyrillic. Right: the shader canvas. |
| `/tmp/perf/fonts2-ru-mobile.png`  | 390x844. The canvas card full width at the top, then the switch, the `h1` over four lines, the links and the Cyrillic body copy.                                                                                                                                                                                               |

Both show Cyrillic text in the self-hosted faces: the serif Cyrillic forms of Philosopher in the `h1`
and Inter's Cyrillic in the body, with no fallback shapes, no missing glyphs and no invisible text.

#### Check after a `next` upgrade

next/font self hosts every face in the Google CSS2 response and emits `@font-face` rules per subset,
so the cyrillic faces existing in the build is implementation behaviour, not a documented contract.
After every `next` upgrade, run these four checks against a fresh `pnpm build`:

```
ls .next/static/media/*-s.p.*.woff2 | wc -l                                              # 4
curl -s http://127.0.0.1:3492/ru | grep -o 'rel="preload" href="/_next/static/media/[^"]*"' | wc -l   # 4
rg -c 'unicode-range:U\+301,U\+400-45F' .next/static/chunks/*.css                        # 2, Inter and Philosopher
```

and in the browser on `/ru`: `document.fonts.check('16px Philosopher', 'Александр')` and
`document.fonts.check('16px Inter', 'разработка')` must both return true while exactly four `.woff2`
requests are in the resource list. If the cyrillic rules are no longer emitted, `/ru` silently falls
back to the system font: no error, no failed request, just the wrong typeface, which is the failure
mode the trade-off subsection above describes for the opposite direction.

## 2. Harness numbers

`noscroll`, two runs each, same machine and same server port.

| build  | locale | device  | lcp run 1 / run 2 | cls | fontKB | transferKB |
| ------ | ------ | ------- | ----------------- | --- | ------ | ---------- |
| before | `/en`  | desktop | 120 / 68          | 0   | 88     | 3033       |
| after  | `/en`  | desktop | 104 / 60          | 0   | 62     | 3003       |
| before | `/ru`  | desktop | 56 / 88           | 0   | 88     | 3032       |
| after  | `/ru`  | desktop | 104 / 56          | 0   | 88     | 3029       |
| before | `/en`  | mobile  | 612 / 688         | 0   | 88     | 1784       |
| after  | `/en`  | mobile  | 600 / 588         | 0   | 62     | 1756       |
| before | `/ru`  | mobile  | 716 / 632         | 0   | 88     | 1783       |
| after  | `/ru`  | mobile  | 612 / 652         | 0   | 88     | 1782       |

`cls` is 0 in every run. `lcp` equals `fcp` in every run (the LCP element is the lead paragraph on
desktop and the `h1` on mobile). Desktop `lcp` is dominated by machine noise: the two runs of the
same build differ by up to 52 ms and the before/after pairs overlap in both directions, so nothing
on desktop can be attributed to the change. Mobile is consistently better: `/en` 612/688 to
600/588, `/ru` 716/632 to 612/652. On mobile `/en` the 28 KB `transferKB` difference is 26.5 KB of fonts
plus the 1.7 KB of extra icon bytes described in section 4.

A second pair of runs on the final build, after the icon fix, gave 96/84 on desktop `/en`, 84/76 on
desktop `/ru`, 584/580 on mobile `/en` and 612/652 on mobile `/ru`, with the same `cls`, `fontKB` and
`transferKB` as the table, which is the run to run spread the paragraph above describes.

## 3. Image negotiation

`next.config.ts` gained `images: { formats: ['image/avif', 'image/webp'] }`. Same request, three
`Accept` headers, against the production server:

```
curl -s -o /tmp/perf/g4b-body.bin -D /tmp/perf/g4b-head.txt \
  -H 'Accept: image/avif,image/webp,*/*' \
  'http://127.0.0.1:3304/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ftop.0mn51nfxqhbc1.jpg&w=1080&q=75'
```

| `Accept`                    | `content-type` | bytes | first 12 bytes                             |
| --------------------------- | -------------- | ----- | ------------------------------------------ |
| `image/avif,image/webp,*/*` | `image/avif`   | 21253 | `0000001c6674797061766966` (`ftypavif`)    |
| `image/webp,*/*`            | `image/webp`   | 30908 | `52494646b478000057454250` (`RIFF...WEBP`) |
| `*/*`                       | `image/jpeg`   | 43705 | `ffd8ffdb0043000808080809` (JPEG SOI)      |

AVIF is 31 percent smaller than WebP and 51 percent smaller than JPEG for this 1080 px encoding. The
browser side effect, captured through the logging proxy at the same viewports the harness uses:

| image              | before (webp) | after (avif) |
| ------------------ | ------------- | ------------ |
| marketplace top    | 1200w, 32536  | 1200w, 21513 |
| marketplace bottom | 1080w, 17288  | 1080w, 12988 |
| uae left           | 640w, 40252   | 640w, 25039  |
| uae right          | 828w, 59538   | 828w, 39230  |
| samo bottom        | 1080w, 24040  | 1080w, 16227 |
| total, desktop     | 173654        | 104997       |

Mobile total is 132326 B of WebP before and 85782 B of AVIF after. The requested candidates differ
on mobile (1200w/640w/828w before, 1920w/1080w/1200w after, see section 4) but the delivered pixels
do not: Next does not upscale, so every candidate wider than the source returns the source. Measured
with `curl` plus `sips` on the response body:

| image              | source  | delivered for any requested w >= source |
| ------------------ | ------- | --------------------------------------- |
| marketplace top    | 1112 px | 1112x546                                |
| marketplace bottom | 906 px  | 906x422                                 |
| uae left           | 600 px  | 600x636                                 |
| uae right          | 800 px  | 800x748                                 |
| samo bottom        | 900 px  | 900x414                                 |

## 4. `sizes` on the card images

### Project cards

The five `<Image>` usages in `ui/ProjectCard/index.tsx` now pass `sizes` derived from the fixed CSS
box widths in `ui/ProjectCard/index.module.scss` and the 900 px breakpoint:

| usage              | box, desktop | box, `<= 900px` | `sizes`                           |
| ------------------ | ------------ | --------------- | --------------------------------- |
| marketplace bottom | 453          | `display: none` | `453px`                           |
| marketplace top    | 556          | 520             | `(max-width: 900px) 520px, 556px` |
| uae left           | 300          | 300             | `300px`                           |
| uae right          | 400          | 400             | `400px`                           |
| samo bottom        | 450          | `display: none` | `450px`                           |

What this does and does not change today. Without `sizes`, next/image emits a density srcset, `1x`
and `2x` of the `width` prop; with `sizes` it emits a width descriptor srcset and lets the browser
choose. The chosen candidates move (mobile dpr 3: 1200w/640w/828w to 1920w/1080w/1200w, desktop
unchanged at 1200w/1080w/640w/828w/1080w), but the delivered images do not: every candidate the box
can justify is wider than the source file, and Next caps at the source, so both builds deliver
1112x546, 906x422, 600x636, 800x748 and 900x414 on mobile and on desktop. The values are the correct
description of the layout, and they remove the 2x ceiling that would under-fetch as soon as these
assets are re-exported at higher resolution, but on the current assets the change is byte and pixel
neutral.

### Open source card icons

`ui/OpenSourceCard/index.tsx` renders one `<Image>` with `height="60"` and no `width` or `sizes`. The
icon box is 60x60 (`57x60` for the sitemap asset, whose source is 171x180); the `<= 900px` block in
`ui/OpenSourceCard/index.module.scss` changes card padding, height and title margin only, so the icon
box is the same at both breakpoints. `sizes="60px"` was added; the file was outside the original
allowlist and was added on review.

This one was a real under-fetch. Without `sizes`, the density srcset offered `64w` and `128w`, so at
dpr 3 the browser picked 128 and received a 128x128 image for a box that needs 180 device px. With
`sizes="60px"` the browser asks for `w=256` and receives the full 180x180 source. Measured through
the proxy at 390x844 dpr 3: `w=128` to `w=256`, 128x128 to 180x180 for the metrika icon (1988 B to
2353 B) and 128x135 to 171x180 for the sitemap icon (3719 B to 5060 B). Desktop dpr 2 still picks
`w=128`, so nothing changes there. The analytics icon is an SVG and is served unoptimized, `sizes`
has no effect on it.

## 5. Dead asset

`public/videos/art/fallback.{mp4}` (3682207 B) was referenced by nothing: no `.tsx`, `.ts`, `.scss`
or `.css` file mentions it, and `ui/Art/index.tsx` renders only a canvas. The two rules that styled
it, `.art__fallback-wrapper` and `.art__fallback`, had no references in any `.tsx` file either and
were removed from `ui/Art/index.module.scss`.

| metric                 | before | after |
| ---------------------- | ------ | ----- |
| files in `public/`     | 59     | 58    |
| `du -sh public`        | 17M    | 14M   |
| `du -sk public`        | 17776  | 14180 |
| `du -sh public/videos` | 9.8M   | 6.3M  |

3596 KiB removed, matching the file size. No code, style or config file references the deleted name:
`rg -n "fallback\.mp4"` reports no hits outside this document, which names the file by definition.

Two related findings, both outside the allowlist:

1. `ui/Art/fallback.{mp4}` is a byte identical copy (md5 `6ea9e15becf2677572015729072418fa`, same
   3682207 B) that was tracked in the source tree and referenced by nothing. It did not ship, but it
   was 3.5 MiB of repository. It has since been removed in `perf/cleanup`, commit `d2f370d`, together
   with the 23 other dead media files listed in `docs/perf-cleanup.md`. The bytes stay retrievable
   from `d2f370d^`.
2. `ui/Art/index.tsx` throws `Error('Canvas context not found')` when `canvas.getContext('webgl')`
   returns null. There is no error boundary around it, so a client without WebGL gets Next's global
   "This page couldn't load" screen for the whole page. Pre-existing on the base commit, still in
   place, worth a follow up.

## 6. Screenshots and what they show

`/tmp/perf/shot.sh` renders the real page on this machine, WebGL canvas included. Four images:

| file                      | what it shows                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tmp/g4b-en-desktop.png` | black background, two columns. Left: `RU EN` switch, `Aleksandr Kriuchkov, Development & Design` in Philosopher, the Telegram/GitHub/hello links, the lead paragraphs and `Managing a development team for 3.5 years` in Inter. Right: the shader canvas, a tall rounded card with a red, blue and brown fluid pattern around a black silhouette. |
| `/tmp/g4b-ru-desktop.png` | same layout, Cyrillic: `Александр Крючков, разработка и дизайн` in Philosopher, body copy in Inter Cyrillic, `3 года руководил командой разработки` as the section heading. Every glyph is from the self hosted faces, no fallback.                                                                                                               |
| `/tmp/g4b-en-mobile.png`  | 390x844. Canvas card full width at the top, then the `RU EN` switch, the `h1` over four lines, contact links, then the body copy.                                                                                                                                                                                                                 |
| `/tmp/g4b-ru-mobile.png`  | same order in Cyrillic, `h1` over four lines, Cyrillic body copy.                                                                                                                                                                                                                                                                                 |

An earlier run of the same helper, while the machine was running several other headless browsers,
got a Chrome instance without WebGL (`getContext('webgl')` returned `false`) and produced Next's
"This page couldn't load" screen for both locales. The same command on a quiet machine renders the
page as described above, so that error screen is a GPU contention artifact of the environment, not
of this branch. `cls` 0 in the harness and the screenshots agree: nothing shifts.

## 7. Verification

```
pnpm lint      -> biome check, 60 files, no findings
pnpm lint:css  -> stylelint, exit 0
pnpm typecheck -> tsc --noEmit, exit 0
pnpm build     -> Next.js 16.4.3, compiled successfully, /en and /ru prerendered, exit 0
```
