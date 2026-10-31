# Fonts, image negotiation and dead assets

Measured on branch `perf/fonts` against the base commit `b0f9500`, both built with `next build`
(Next.js 16.4.3, Turbopack) and served with `next start --port 3304`.

Tools: `/tmp/perf/measure.sh <url> <desktop|mobile> <scroll|noscroll> <out.json>` for the lab
numbers (desktop 1440x900 dpr 2 unthrottled, mobile 390x844 dpr 3 with 4x CPU throttle, 1.6 Mbit/s
and 150 ms latency), `/tmp/perf/eval.sh` for the request list of a loaded page, `curl` for content
negotiation, and a logging reverse proxy (`node`, no browser) when a full per request list was
needed. Two runs per configuration; run to run spread on desktop `lcp` is up to 28 ms, so read the
direction, not single milliseconds.

## 1. Fonts

### Shipped change

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
62 instead of 88. `/ru` contains 7182 cyrillic code points, the browser resolves them through the
`unicode-range` of the cyrillic faces and pulls exactly the same two files, in the same encoding, as
the base build, so Cyrillic typography on `/ru` is byte for byte unchanged.

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
`philosopher.className` to every heading, and a font class on the layout wrapper cannot override a
`font-family` set on the heading itself. `ui/h1/index.tsx` is outside this task's allowlist, so the
heading family must stay a single instance for both locales.

The shipped single instance reaches every acceptance criterion: `/en` 62 KB (budget 65), no cyrillic
request on `/en`, `/ru` unchanged at 88 KB.

## 2. Harness numbers

`noscroll`, two runs each, same machine and same server port.

| build  | locale | device  | lcp run 1 / run 2 | cls | fontKB | transferKB |
| ------ | ------ | ------- | ----------------- | --- | ------ | ---------- |
| before | `/en`  | desktop | 88 / 72           | 0   | 88     | 3033       |
| after  | `/en`  | desktop | 80 / 80           | 0   | 62     | 3003       |
| before | `/ru`  | desktop | 72 / 72           | 0   | 88     | 3032       |
| after  | `/ru`  | desktop | 68 / 96           | 0   | 88     | 3029       |
| before | `/en`  | mobile  | 596 / 608         | 0   | 88     | 1784       |
| after  | `/en`  | mobile  | 580 / 584         | 0   | 62     | 1755       |
| before | `/ru`  | mobile  | 616 / 724         | 0   | 88     | 1783       |
| after  | `/ru`  | mobile  | 588 / 584         | 0   | 88     | 1780       |

`cls` is 0 in every run. `lcp` equals `fcp` in every run (the LCP element is the lead paragraph on
desktop and the `h1` on mobile), and no configuration got slower: desktop `/en` 88/72 to 80/80,
desktop `/ru` 72/72 to 68/96 (one run 24 ms above the before pair, inside the spread), mobile `/en`
596/608 to 580/584, mobile `/ru` 616/724 to 588/584. `transferKB` follows the 26.5 KB font saving on
`/en`; `/ru` moves by 3 KB, which is the image work below.

`scroll` runs (all images and videos loaded) went from `transferKB` 3204 to 3117 on desktop and 3163
to 3088 on mobile.

## 3. Image negotiation

`next.config.ts` gained `images: { formats: ['image/avif', 'image/webp'] }`. Same request, three
`Accept` headers, against the production server:

```
curl -s -o /tmp/perf/g4-body.bin -D /tmp/perf/g4-head.txt \
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

Mobile candidates moved with the `sizes` change and are still lighter in AVIF: 32536 + 40252 + 59538
= 132326 B of WebP at 1200w/640w/828w before, 21513 + 25039 + 39230 = 85782 B of AVIF at
1920w/1080w/1200w after.

## 4. `sizes` on the project card images

The five `<Image>` usages in `ui/ProjectCard/index.tsx` now pass `sizes` derived from the fixed CSS
box widths in `ui/ProjectCard/index.module.scss` and the 900 px breakpoint:

| usage              | box, desktop | box, `<= 900px` | `sizes`                           |
| ------------------ | ------------ | --------------- | --------------------------------- |
| marketplace bottom | 453          | `display: none` | `453px`                           |
| marketplace top    | 556          | 520             | `(max-width: 900px) 520px, 556px` |
| uae left           | 300          | 300             | `300px`                           |
| uae right          | 400          | 400             | `400px`                           |
| samo bottom        | 450          | `display: none` | `450px`                           |

The sixth `<Image>` in the repository is `ui/OpenSourceCard/index.tsx` (60x60 box); it is outside the
allowlist and was left untouched.

Measured effect, from the proxy log: desktop candidates are unchanged (1200, 1080, 640, 828, 1080).
Without `sizes`, next/image emits a density srcset (`1x`/`2x` of the `width` prop), so on desktop the
`2x` candidate already matched the box at dpr 2. The real difference is mobile, where the density
srcset could not express dpr 3: the 553 px box asked for the `2x` 1200w candidate, and the 300/400 px
boxes asked for 640w/828w, all rendered at dpr 3 and therefore soft. With `sizes` the browser picks
1920w, 1080w and 1200w respectively, which is the box width times dpr 3. Those larger candidates cost
nothing extra here because the AVIF saving is bigger.

## 5. Dead asset

`public/videos/art/fallback.{mp4}` (3682207 B) was referenced by nothing: no `.tsx`, `.ts`, `.scss`
or `.css` file mentions it, and `ui/Art/index.tsx` renders only a canvas. The two rules that styled it,
`.art__fallback-wrapper` and `.art__fallback`, had no references in any `.tsx` file either and were
removed from `ui/Art/index.module.scss`.

| metric                 | before | after |
| ---------------------- | ------ | ----- |
| files in `public/`     | 59     | 58    |
| `du -sh public`        | 17M    | 14M   |
| `du -sk public`        | 17776  | 14180 |
| `du -sh public/videos` | 9.8M   | 6.3M  |

3596 KiB removed, matching the file size. `rg -n "fallback\.mp4"` over the whole tree returns
nothing, code, styles and docs included.

Two related findings, both outside the allowlist and left in place:

1. `ui/Art/fallback.{mp4}` is a byte identical copy (md5 `6ea9e15becf2677572015729072418fa`, same
   3682207 B) that is tracked in the source tree and referenced by nothing. It does not ship, but it
   is 3.5 MiB of repository.
2. `ui/Art/index.tsx` throws `Error('Canvas context not found')` when `canvas.getContext('webgl')`
   returns null. There is no error boundary around it, so a client without WebGL gets Next's global
   "This page couldn't load" screen for the whole page. Pre-existing on the base commit, worth a
   follow up.

## 6. Screenshots and what they show

`/tmp/perf/shot.sh` (which drives headless Chrome with `--disable-gpu`) produced four images:
`/tmp/g4-final-en-desktop.png`, `/tmp/g4-final-ru-desktop.png`,
`/tmp/g4-final-en-mobile.png`, `/tmp/g4-final-ru-mobile.png`. All four show Next's
"This page couldn't load / Reload to try again, or go back." error screen: white page, warning
triangle, heading, body copy, `Reload` and `Back` buttons. `/en` and `/ru` render pixel identical
files (same md5), and desktop differs from mobile only by viewport size.

The cause is the screenshot chrome, not this change: WebGL is unavailable there
(`document.createElement('canvas').getContext('webgl')` returns `false` with `--disable-gpu` and no
software WebGL fallback enabled), `ui/Art/index.tsx` throws on mount, and the error boundary
replaces the page. The base build behaves identically in the same browser, so no visual comparison
of the two builds is possible with that helper.

The measurement harness is WebGL capable and does render the real page: `lcpEl` is
`P ui-p ui-p_mxw-540 ui-p_large ui-p_my` on desktop and `H1 ...` on mobile, `imgCount` is 8, and the
resource list matches the production build. Font rendering on `/ru` is covered by the request
evidence in section 1: the same four files, same byte sizes as the base build.

## 7. Verification

```
pnpm lint       -> biome check, no findings
pnpm lint:css   -> stylelint, exit 0
pnpm typecheck  -> tsc --noEmit, exit 0
pnpm build      -> Next.js 16.4.3, compiled successfully, /en and /ru prerendered, exit 0
```
