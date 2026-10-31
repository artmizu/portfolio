# Portfolio

Personal site of Aleksandr Kriuchkov, development and design. Bilingual (English and Russian), with an animated
WebGL artwork as the hero.

Live: https://www.artmizu.ru

## Stack

|           |                                                                    |
| --------- | ------------------------------------------------------------------ |
| Framework | Next.js 16.4 (App Router, Turbopack), React 19.3                   |
| Language  | TypeScript 7.0                                                     |
| Styling   | SCSS modules plus Stylelint with recess order                      |
| i18n      | i18next with `en` and `ru` locales, `ru` as default                |
| Graphics  | hand written WebGL fragment shaders, two feedback passes per frame |
| Tooling   | Biome for JS/TS lint and format, react-doctor for React review     |
| Runtime   | Node 26.13 LTS, pnpm 10.11                                         |
| Hosting   | Vercel                                                             |

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:3201
```

```bash
pnpm build        # production build
pnpm start        # serve the build on :3200
pnpm lint         # Biome check, includes formatting
pnpm lint:css     # Stylelint
pnpm typecheck    # tsc --noEmit
pnpm doctor       # react-doctor static scan
```

Node and pnpm versions are pinned in `.nvmrc`, `.node-version`, `engines` and `packageManager`, so `nvm use` and
`corepack` pick the right ones.

## Structure

```
app/[lng]/        layout, landing page, global styles
proxy.ts          locale middleware, cookie and Accept-Language detection
i18n/             settings, server helper, client hook, locales/*.json
shared/           fonts, intersection hook, shared types
ui/               one folder per component with its .module.scss
  Art/            WebGL artwork, local GL helpers, shaders
  LazyVideo/      lazy mounted preview video with image placeholder
  RichText/       the only HTML injection sink
public/           images, videos, posters, og.jpg, favicons
```

## Performance

The page is mostly static content, so the work went into payload rather than LCP. Measured on production, cache
disabled, `/en`:

| metric               | value        |
| -------------------- | ------------ |
| initial transfer     | about 600 KB |
| JavaScript           | 163 KB       |
| images               | 318 KB       |
| fonts                | 88 KB        |
| video at first paint | 0            |
| requests             | 47           |
| CLS                  | 0            |

How it gets there: preview videos mount only when their card approaches the viewport and are re-encoded to short
loops; background images are right sized AVIF with WebP fallback; the WebGL artwork is loaded after hydration and
pauses when offscreen or hidden; fonts are subset per locale with Cyrillic preloaded for the default locale.

## Notes

`AGENTS.md` documents the invariants per area, the performance budget and the measurement rules. Read it before
changing the artwork, the video cards, the image pipeline or the fonts.

Content, photographs and artwork are personal work. The code is here to read.
