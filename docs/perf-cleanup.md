# Dead media and dead CSS

Scope: files under `ui/` and `public/` that no TypeScript, TSX, SCSS, JSON, metadata or config file references, plus class blocks in the SCSS modules that never reach the DOM.
Base commit: `b9f7fa4`.

## Result

| metric                  | before | after      |
| ----------------------- | ------ | ---------- |
| `du -sh public`         | 2.9M   | 2.9M       |
| `du -sh ui`             | 13M    | 1.5M       |
| deleted bytes           |        | 11 789 855 |
| deleted files           |        | 24         |
| requests, desktop       | 43     | 43         |
| requests, mobile        | 43     | 43         |
| `transferKB`, desktop   | 671    | 671        |
| `transferKB`, mobile    | 673    | 673        |
| CLS, desktop, no scroll | 0      | 0          |
| CLS, mobile, no scroll  | 0      | 0          |

Both columns of every row are produced by the same instrument, so each row is a like-for-like pair. The request counts and `transferKB` figures in this table come from `/tmp/perf/measure.sh`, production build, cache disabled, device scale factor 2 on desktop and 3 on mobile, taken from its `initial` block before any scrolling. The runtime table further down reports sums of per-request `transferSize` collected with `/tmp/perf/eval.sh` in a separate session, and that harness leaves the cache enabled and uses device scale factor 1 on desktop, so it reads 667 KB desktop and 672 KB mobile for the same two builds. The 4 KB desktop and 1 KB mobile gaps between the two tables follow from those settings, not from a change: no figure here is compared against a figure from the other table.

Nothing under `public/` was removed. `du -sh public` is unchanged because every deleted file lived under `ui/`.

## How the reference list was built

Every path under `ui/` and `public/` was searched for, not assumed, with `rg -F` (fixed strings, no regex surprises) over the whole repository excluding `node_modules`, `.next` and the lockfile. Three patterns per file:

1. the repository relative path, for example `ui/ProjectCard/asset/samo/preview.mp4`
2. the last three path segments, for example `ProjectCard/asset/samo/preview.mp4`
3. the last two path segments, for example `samo/preview.mp4`

Script: a loop over `find ui public -type f`, printing size, path and the matching files for each pattern. 111 files before the deletions. Code files come out without a path hit because they are imported by directory, for example `from 'ui/h1'`, so the decision for every candidate was made on the asset sweep, not on the raw hit count: 15 of the 24 deleted files matched no pattern at all, the other 9 matched a `public/` path with the same file name and were checked against the reference that produced the hit.

Two hit classes had to be told apart by hand, because a substring hit is not a reference:

- `url(/images/factoid/behance/center.webp)` in `ui/Factoid/index.module.scss` matches the string `behance/center.webp`, which also matches `ui/Factoid/asset/behance/center.webp`. The leading slash makes it an absolute `public/` path, so the `ui/` copy is not the file being referenced. The same holds for `constructor/spot.svg`.
- `url(./asset/github-logo.svg)` in `ui/OpenSourceCard/index.module.scss` is relative to the module, so `ui/OpenSourceCard/asset/github-logo.svg` is live and stays.

The reverse check was done too: for every file that imports or points at something, the target exists. `ui/ProjectCard/index.tsx` imports five `./asset/**` files, `ui/OpenSourceCard/index.tsx` three, `ui/DateMarker/index.module.scss` one, `ui/Art/index.tsx` three shader sources. All of them are kept.

## Deleted

| file                                            | bytes     | proof it is unused                                                                                                                                                                                                                             |
| ----------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/Art/fallback.mp4`                           | 3 682 207 | no hit for `Art/fallback.mp4` or `fallback`. md5 `6ea9e15becf2677572015729072418fa`, identical to the blob removed from `public/videos/art/fallback.mp4` in `09ffc8c`. `ui/Art/index.tsx` renders a canvas, no `<video>` and no mp4 reference. |
| `ui/ProjectCard/asset/constructor/preview.mp4`  | 4 720 929 | no hit for `constructor/preview.mp4`. The card plays `/videos/projects/constructor-preview.mp4`, 595 492 B, the re-encoded copy. This size is the "before" row of `docs/perf-videos.md`.                                                       |
| `ui/ProjectCard/asset/samo/preview.mp4`         | 1 278 246 | same: the card plays `/videos/projects/samo-preview.mp4`, 121 355 B.                                                                                                                                                                           |
| `ui/ProjectCard/asset/kran/preview.mp4`         | 77 308    | same: the card plays `/videos/projects/kran-preview.mp4`, 37 084 B.                                                                                                                                                                            |
| `ui/ProjectCard/asset/constructor/spot.svg`     | 948       | the only `spot.svg` reference is `url(/images/projects/constructor/spot.svg)` in `ui/ProjectCard/index.module.scss`, an absolute `public/` path. md5 of both copies is `5d340be3fa3cefc4e4c7aa75ea183cf1`, so the kept file is the same bytes. |
| `ui/Factoid/asset/behance/center.jpg`           | 249 459   | `ui/Factoid/index.tsx` imports no asset. The behance card paints from `public/images/factoid/behance/**` through `image-set()` in `ui/Factoid/index.module.scss`.                                                                              |
| `ui/Factoid/asset/behance/left.jpg`             | 121 902   | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/behance/right.jpg`            | 147 272   | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/behance/center.webp`          | 53 834    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/behance/left.webp`            | 26 714    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/behance/right.webp`           | 32 202    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-recruiter/center.jpg`  | 102 892   | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-recruiter/left.jpg`    | 81 514    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-recruiter/right.jpg`   | 81 514    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-recruiter/center.webp` | 30 556    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-recruiter/left.webp`   | 22 932    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-recruiter/right.webp`  | 22 932    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/verdi/aside.jpg`              | 211 636   | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/verdi/center.jpg`             | 204 587   | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/verdi/aside.webp`             | 44 476    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/verdi/center.webp`            | 48 116    | same                                                                                                                                                                                                                                           |
| `ui/Factoid/asset/parser-extension/preview.mp4` | 497 476   | `ui/Factoid/index.tsx` plays `/videos/factoid/parser-extension-preview.mp4`, 73 447 B.                                                                                                                                                         |
| `ui/OpenSourceCard/asset/analytics.png`         | 49 048    | `ui/OpenSourceCard/index.tsx` maps the `analytics` variant to `./asset/prometheus.svg`; `analytics.png` has no hit in any file.                                                                                                                |
| `ui/OpenSourceCard/asset/github-logo-hover.svg` | 1 155     | the `:hover` state in `ui/OpenSourceCard/index.module.scss` sets an inline `data:image/svg+xml` background. The file itself has no hit.                                                                                                        |

Total: 11 789 855 B. `ui/` drops from 13M to 1.5M.

The four preview MP4s among these deletions are exactly the re-encode sources tabulated as the "before" column of `docs/perf-videos.md`: 4 720 929, 1 278 246, 77 308 and 497 476 B. Deleting them from the working tree does not delete them from the repository history: `git show b9f7fa4:ui/ProjectCard/asset/samo/preview.mp4 | wc -c` still returns 1278246, and every deleted path is retrievable from `d2f370d^` or any earlier commit.

The directories that became empty were removed from disk, which git does not track: `ui/Factoid/asset/behance`, `ui/Factoid/asset/parser-recruiter`, `ui/Factoid/asset/verdi`, `ui/Factoid/asset/parser-extension`, `ui/Factoid/asset`, `ui/ProjectCard/asset/constructor` and `ui/ProjectCard/asset/kran`.

## Kept on purpose

`public/og.jpg`, `public/favicon.ico`, `public/favicon.png` are referenced from metadata in `app/[lng]/page.tsx` and `app/[lng]/layout.tsx` as absolute URLs, so a path fragment search finds them only under `/og.jpg`, `/favicon.ico`, `/favicon.png`. Everything else under `public/` is referenced from `image-set()` or `next/image` sources. A sweep of all 50 files under `public/` looking for `/`-prefixed references found none unreferenced.

## Dead CSS

Method, two independent enumerations:

1. Static, per module. Every block in every `.scss` file under `ui/` was expanded through its nesting to a full selector, including `&_modifier` and `&__element` and their `@media` copies. Each class name was then looked for in the sources in the exact forms the code uses: `st['name']`, `st.name`, `styles.name`, `[styles.name]:`, and literal class strings in TSX, JSON and HTML. Handles for `classnames()`, `wrapperClassName` props and the `RichText` HTML in `i18n/locales/**` were included, which is why `ui-p`, `ui-p_large`, `ui-p_my` and `ui-p_mxw-540` count as used even though they only appear inside JSON strings. Result: no unreferenced class under `ui/`.
2. Runtime, whole page. The class set of every element in the live DOM at 1440x900 and 390x844, after scrolling the whole page, was compared with the class set of the CSS the page serves, which also covers `app/[lng]/page.module.scss` that the first pass did not reach. 135 selectors in CSS against 126 class tokens in the DOM. After discarding `url()` false positives (`avif`, `webp`, `woff2`, `svg`, `org`, `w3`), two names were left.

Of those two, `fVtmiq_h3_mb` is referenced by `ui/h3/index.tsx` as `[styles.h3_mb]: mb`, so it stays: the brief allows removal only when the class is not referenced. The other one is the removal below.

Removed from `app/[lng]/page.module.scss`:

```scss
	&__art-video {
		width: 310px;
		height: 775px;
	}
```

`rg -F art-video` over the repository returns only that declaration, and the DOM never carries the class in either viewport. The box it sized belonged to the fallback video deleted above.

Effect on the emitted CSS is exactly that rule, verified by concatenating the three served CSS chunks before and after and diffing at `}` boundaries:

```
-.bn1-OW_main-intro__art-video{width:310px;height:775px}
```

32646 B of CSS to 32591 B, the 55 B of the removed rule.

The same comparison was run in the other direction, JSX to stylesheet, because a name that JSX applies and the module never declares is the mirror image of a dead rule. Four such keys exist in `app/[lng]/page.tsx`: `st['main-page']` at line 70, `st['main-intro__description']` at line 91, `st['main-used-grid__el']` at line 109 and `st['main-used-grid__el-text']` at line 113. None of the four is declared in `app/[lng]/page.module.scss` or in any other stylesheet, so each resolves to `undefined`, contributes no class to its element and styles nothing. `rg -F` for each of the four names returns only the `page.tsx` line that uses it. All four are pre-existing on the base commit and are left in place: a dangling JSX key is not a dead CSS rule, and removing it is a code change outside the scope of this branch.

## Runtime verification

Prod server: `npx next start --hostname 127.0.0.1 --port 3483`. The baseline came from a second worktree checked out at `b9f7fa4` with its own `pnpm install --frozen-lockfile`, built and served on port 3487, so before and after were measured on the same machine, same Chrome, same harness, in one session.

Request lists were captured with `/tmp/perf/eval.sh` reading `performance.getEntriesByType('resource')` together with `responseStatus` and `transferSize`, in four configurations: desktop and mobile, without scrolling and after scrolling the whole page. Metrics and CLS came from `/tmp/perf/measure.sh <url> <desktop|mobile> scroll`.

Every absolute in the table below is specific to this machine, this Chrome build and this measurement window. An independent run of the same two builds elsewhere reports 45/58/45/56 requests and 694/1607/699/1665 KB, because its window catches two extra `/ru?_rsc=` route prefetches, and it catches them on both sides. The portable claim is the equality itself, not the absolutes: base and branch agree name for name, status for status and byte for byte, which holds regardless of how many prefetches a given machine happens to finish inside the window.

```
                       requests        transferKB          CLS
                     base  after     base  after       base    after
desktop noscroll       43     43       667    667         0        0
desktop scroll         56     56      1579   1579         0        0
mobile  noscroll       43     43       672    672         0        0
mobile  scroll         54     54      1640   1640    0.0302   0.0302
```

This table is the `/tmp/perf/eval.sh` scale, the same 667 and 672 KB that the `/tmp/perf/measure.sh` figures in the result table read as 671 and 673 for the reason given there.

The media commit alone leaves the request list byte-identical in all four configurations: no name added, no name removed, same per-request status, same per-request bytes. The CSS commit changes exactly one file name, the content hash of the chunk that lost the rule:

```
added  : /_next/static/chunks/3t9xgzfpzg6mo.css
removed: /_next/static/chunks/37rkoxa7yo7xo.css
```

Count, statuses and bytes are unchanged in all four configurations.

One 404 exists in every run, before and after: `/_vercel/speed-insights/script.js`, which `@vercel/speed-insights` requests and a local `next start` does not serve. It is in the baseline request list and is not caused by this change. Every image, video, font and CSS request returns 200, except the four MP4s which return 206 partial content, as in the baseline.

Pixel check with `/tmp/perf/shot.sh`, baseline server against final server, same viewport and scroll offset:

| viewport | scrollY | differing pixels |
| -------- | ------- | ---------------- |
| desktop  | 2000    | 0                |
| desktop  | 4500    | 0                |
| desktop  | 0       | 31890 of 1296000 |
| mobile   | 0       | 6435 of 1316250  |

The two offsets that show content are identical. Offset 0 carries the WebGL canvas, which animates: two shots of the _same_ server at offset 0 differ by 38965 pixels desktop and 6440 pixels mobile, more than the difference between servers. That residue is frame timing, not layout.

## Checks

`pnpm lint`, `pnpm lint:css`, `pnpm typecheck` and `pnpm build` pass before and after, at the base commit and at both commits of this branch. No dependency, lockfile, TypeScript, Biome, stylelint or Next configuration change.

## Note for a reviewer

`docs/perf-videos.md` quotes the 4 720 929, 1 278 246, 77 308 and 497 476 B rows as the "before" sizes of the four clips. Those were the files deleted here; the served copies under `public/videos/` are the re-encoded ones and are untouched. The numbers in that document stay accurate as a record of that earlier change, and the deleted sources remain readable from git history rather than from the worktree.

`docs/perf-fonts.md` listed `ui/Art/fallback.mp4` as a tracked, unreferenced copy left in place. That document now records the removal in `d2f370d`. No other document carried the same stale statement: `docs/perf-images.md` and `docs/perf-videos.md` do describe the `ui/` asset trees, but nothing they claim about which files remain is contradicted by this branch.
