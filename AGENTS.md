# AGENTS.md

Portfolio site for Aleksandr Kriuchkov. Next.js 16 App Router, React 19, TypeScript, SCSS modules.
Live at https://www.artmizu.ru. Two locales, `en` and `ru`, with `ru` as the default.

This file is the single source of truth for how the project is built and what must not regress. It replaces the
per-change evidence documents that used to live under `docs/`.

## Runtime and tooling

| thing                 | value                                                          |
| --------------------- | -------------------------------------------------------------- |
| Node                  | 26.13.0 LTS, pinned in `.nvmrc`, `.node-version` and `engines` |
| package manager       | pnpm 10.11.1, pinned in `packageManager`                       |
| framework             | Next.js 16.4.3 (App Router, Turbopack), React 19.3.1           |
| types                 | TypeScript 7.0.2                                               |
| JS/TS lint and format | Biome 2.6.4 (`pnpm lint`, `pnpm lint:fix`, `pnpm format`)      |
| CSS lint              | Stylelint 17 (`pnpm lint:css`), recess order, tabs             |
| React review          | react-doctor 0.9.18 (`pnpm doctor`, `pnpm doctor:trace`)       |

```bash
pnpm dev          # 0.0.0.0:3201
pnpm build
pnpm start        # 0.0.0.0:3200
pnpm lint         # biome check, includes formatting
pnpm lint:css
pnpm typecheck    # tsc --noEmit
pnpm doctor       # react-doctor static scan, must report no issues
```

Do not add ESLint. Biome owns JS/TS, Stylelint owns CSS/SCSS, and Biome's CSS support is disabled on purpose so the
two do not fight over `stylelint-config-recess-order`. `next.config.ts` sets `agentRules: false` so `next dev` does not
rewrite this file.

## Project map

```
app/[lng]/            layout (metadata, fonts, SpeedInsights), page (landing), globals.css
proxy.ts              locale middleware: cookie `i18next`, Accept-Language, redirect to /<lng>
i18n/                 settings, server helper getTranslation, client hook useTranslation, locales/*.json
shared/               font.ts (next/font), useIntersection.ts, type/
ui/                   one folder per component with a .module.scss next to it
  Art/                WebGL artwork: index.tsx (dynamic wrapper), Canvas.tsx, gl.ts, shaders
  LazyVideo/          lazy mounted preview video with image placeholder
  RichText/           the only HTML injection sink
public/               images, videos, posters, og.jpg, favicons
```

## Invariants per area

### WebGL artwork (`ui/Art`)

- `index.tsx` is a client wrapper that loads `Canvas.tsx` through `next/dynamic` with `ssr: false`, so the artwork
  chunk stays out of the initial HTML. Keep it that way.
- The placeholder is a solid `#000` box with the same dimensions and radius as the canvas (20 px desktop, 15 px
  mobile). It must never be a gradient or any other colour: the area has to look like the page background until the
  shader draws. `.art__canvas` is also black for the window between mount and first draw.
- A missing WebGL context must return early. Throwing inside the effect makes React unmount the entire page.
- The render loop stops when the canvas is offscreen or `document.hidden`, is capped at 30 fps at 900 px and below
  and 60 fps above, and the clock accumulates active time only, so resume never jumps.
- Resize re-initialisation is debounced by 250 ms. Only textures and framebuffers are reallocated; programs are
  created once.
- `gl.ts` is a local replacement for twgl and covers exactly the helpers used. Do not reintroduce twgl.

### Videos

- Any preview video goes through `ui/LazyVideo`. It mounts the real `<video preload="none" playsInline muted autoPlay>`
  when the wrapper is within 300 px of the viewport, pauses offscreen, resumes on return, and never restarts a
  non-looping clip that already ended.
- The video element must not carry a `poster` attribute. The placeholder is a `next/image` with `fill`, `sizes`,
  `loading="lazy"` and `alt=""`, kept on top until the video fires `playing`. A `poster` attribute plus the image
  placeholder downloads the same artwork twice.
- `fill` needs a sized parent, so each wrapper box is pinned in SCSS to the box the media element occupies. Changing a
  media box means changing that rule too.
- Encode recipe: `libx264 -crf 28 -preset slow -profile:v high -pix_fmt yuv420p -an -movflags +faststart`, scale to 2x
  the CSS box, `setsar=1` (several sources have non-square pixels), trimmed to a short loop. Current files:
  constructor 954x800 8.0 s, samo 860x612 8.4 s, parser-extension 854x480 8.0 s, kran 748x480 2.0 s.
- Posters live in `public/videos/posters/` as WebP, twice the placeholder box.

### Images

- Background images are declared in the `.module.scss` files as `image-set()` with AVIF first and WebP second, both at
  the same path, and are sized to 2x the painted CSS box. No JPEG or PNG fallbacks: the Next 16 browser floor
  (Chrome 111, Edge 111, Firefox 111, Safari 16.4) decodes AVIF.
- The rakuten pair is an exception in both senses: `sp` is the phone layout and `pc` is the desktop layout, two
  distinct artworks shown side by side, so both always load. They are sized to 3x the mobile box (sp 450x975,
  pc 1170x980) because they render at 1:1 device pixels on a 3x phone. Do not "optimise" them into one variant per
  viewport.
- Four files stay 4:4:4 (`rakuten/sp`, `rakuten/pc`, `behance/left`, `behance/right`) because 4:2:0 cannot hold their
  fidelity at any size; everything else is 4:2:0.
- Every `<Image>` passes `sizes`. `next.config.ts` sets `images.formats: ['image/avif', 'image/webp']`.

### Fonts

- `shared/font.ts` holds one instance per family with `subsets: ['latin', 'cyrillic']`. Cyrillic is preloaded on
  purpose: `/ru` is the default locale, and dropping it costs the default locale its first paint quality. The cost is
  26 KB of woff2 on `/en`, accepted.
- Only `ui/h1` applies `philosopher.className`; `h2` and `h3` inherit the family from CSS.
- After every `next` upgrade, verify: 4 font preload links on both `/en` and `/ru`, four `.woff2` requests on `/ru`,
  `document.fonts.check('16px Philosopher', 'Александр')` and `document.fonts.check('16px Inter', 'разработка')` both
  true, and the computed `font-family` of the `h1` is `Philosopher`.

### i18n and content

- Server-side translation uses `getTranslation` from `i18n/index.ts`. It is async and is not a hook; do not rename it
  to `use*`.
- Locale JSON contains a little HTML (`<b>`, `<p class=...>`). It is rendered through `ui/RichText`, the only
  `dangerouslySetInnerHTML` in the codebase, with a documented react-doctor override. Never pass user input to it.

### Scroll reveal

Cards start hidden (`opacity: 0`, and `visibility: hidden` for constructor) and are revealed by a JS-set `_visible`
class, driven by `shared/useIntersection` at `threshold: 0.8`. Two consequences: with JavaScript disabled the media
never appears, and any new card must follow the same reveal pattern.

### Removed dependencies

`twgl.js` and `react-use` were both replaced by local code (`ui/Art/gl.ts`, `shared/useIntersection.ts`). Do not add
them back.

## Performance budget

Current production baseline, `/en` desktop, cache disabled, production build:

| metric               | value                                         |
| -------------------- | --------------------------------------------- |
| initial transfer     | about 600 KB                                  |
| JS                   | 163 KB                                        |
| images               | 318 KB                                        |
| fonts                | 88 KB                                         |
| video at first paint | 0                                             |
| requests             | 47                                            |
| CLS                  | 0                                             |
| LCP                  | about 120 ms desktop, 600 ms mobile emulation |

A change that pushes any of these up needs a stated reason. LCP is text (hero paragraph on desktop, `h1` on mobile),
so image and video work cannot move it; treat small LCP differences as noise.

How to measure, and what to distrust:

- Always measure a production build with the cache disabled, desktop 1440x900 at DPR 2 and mobile 390x844 at DPR 3
  with 4x CPU and slow 4G emulation. Compare before and after in the same session, interleaved.
- Headless Chrome has no GPU, so WebGL costs are inflated by software rendering. Compare like for like and do not
  quote absolute headless WebGL numbers as device truth.
- Attribute every number to the build it came from. Absolute values differ between machines; only the before and after
  pair within one session is portable.

## Repository conventions

- Biome formatting: 2 spaces, single quotes, 120 columns, trailing commas. Do not hand-format.
- Comments only where the code cannot speak for itself, short, with the reason.
- `public/og.jpg`, the favicons and everything under `public/images` and `public/videos` are referenced; check with
  `rg` before deleting any asset.
- Local media tooling notes: `ffmpeg` needs `DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib` on this machine
  because the brew link points at a different x265, and `avifenc` here has no `--sharpyuv`.
