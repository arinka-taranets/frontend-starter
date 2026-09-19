# Frontend Starter

A production starter for multi-page marketing sites, built to be cloned at the
start of a client project rather than admired in a repository.

It covers the parts that are the same on every project — build setup, CSS
architecture, shared markup, responsive images, accessibility defaults, linting —
so a new project begins at the part that is actually different.

**What it demonstrates:** Vite · multi-page HTML · Handlebars partials · semantic
markup · responsive SCSS with modern Sass modules · CSS custom properties as design
tokens · vanilla JavaScript ES modules · automated responsive images (AVIF / WebP)
· accessibility · Core Web Vitals basics · linting and formatting.

**What it deliberately leaves out:** TypeScript, a test runner, Storybook, Docker,
CI pipelines, component generators. Each is a cost paid forever; none of them earn
their place on a typical marketing site. Add them to a project that needs them.

---

## Requirements

- **Node.js 24 LTS or newer.** The repo ships an `.nvmrc`, so `nvm use` picks the
  right version. Node 20 is end-of-life and below the minimum for Vite 8 and ESLint 10.

## Install

```bash
nvm use          # optional, reads .nvmrc
npm install
```

## Run

```bash
npm run dev      # dev server with hot reload, opens the browser
npm run build    # production build into dist/
npm run preview  # serve dist/ locally to check the real build
```

Images are generated automatically before `dev` and `build`, so a fresh clone works
with nothing else to remember.

## Commands

| Command            | What it does                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `npm run dev`      | Dev server, hot reload. Runs `images` first.                                                   |
| `npm run build`    | Production build into `dist/`. Runs `images` first.                                            |
| `npm run preview`  | Serves the built `dist/` — always check here before delivery.                                  |
| `npm run images`   | Regenerates responsive images. Run it manually after adding a file while the dev server is up. |
| `npm run lint`     | ESLint + Stylelint.                                                                            |
| `npm run lint:fix` | Same, fixing what can be fixed.                                                                |
| `npm run format`   | Prettier, write.                                                                               |
| `npm run check`    | Lint + format check. **Run this before handing work to a client.**                             |

---

## Project structure

```
.
├── image.config.js         Image pipeline settings — widths, formats, quality
├── pages.config.js         Per-page title, description, active nav key
├── vite.config.js          Build config: root, page discovery, Handlebars
├── scripts/
│   ├── generate-images.mjs Responsive image pipeline (sharp + svgo)
│   └── helpers.mjs         Handlebars helpers: {{picture}}, {{svg}}, {{eq}}
├── .image-manifest.json    Generated image index — git-ignored, never shipped
├── public/                 Copied to dist/ as-is (favicon, og.jpg, robots.txt)
│   └── img/                GENERATED images — git-ignored
└── src/
    ├── index.html          Home page
    ├── about/index.html    Nested page — proves paths work at any depth
    ├── partials/           head, header, footer — shared markup
    ├── assets/images/      Image SOURCES — committed
    ├── scripts/
    │   ├── main.js         Entry point: imports styles, starts modules
    │   └── modules/nav.js  Accessible mobile navigation
    └── styles/
        ├── abstracts/      Breakpoints + mixins. Emits no CSS.
        ├── base/           Tokens, reset, typography
        ├── layout/         Container, header, footer
        ├── components/     Button, hero, features, prose
        ├── utilities/      Accessibility helpers
        └── main.scss       The single entry point
```

---

## Adding a page

1. Create the file, for example `src/contact/index.html`.
2. Add its data to `pages.config.js`:

```js
'contact/index.html': {
  ...defaults,
  page: 'contact',
  title: 'Contact — Client Name',
  description: 'How to reach us.',
},
```

3. Add the link to `src/partials/header.html`.

That is all. `vite.config.js` discovers every `.html` file under `src/` automatically
and never needs editing. If you forget step 2 the page still builds — the terminal
tells you it is missing a title.

`src/contact/index.html` is served at `/contact/`.

---

## Handlebars partials

Shared markup lives in `src/partials/`. Include one with `{{> name}}`:

```html
<body>
  {{> header}}
  <main id="main">…</main>
  {{> footer}}
</body>
```

Anything defined in `pages.config.js` is available as `{{title}}`, `{{description}}`,
and so on, inside both pages and partials.

### What is in `head.html`

1. Title, description, favicon, theme colour.
2. `rel="canonical"` and the Open Graph / Twitter tags — see below.
3. `<link rel="stylesheet">` — in `<head>`, so it blocks the first paint and the
   page is never shown unstyled.
4. A two-line inline script setting `data-js` on `<html>`, before the first paint.
   The mobile menu only collapses when that flag is present, so the navigation
   stays usable if scripts fail.
5. `<script type="module">` — deferred by default, so it never blocks rendering.

Keep comments out of the partials: everything here ships to the client on every
page. Explanations belong in this README.

### Social previews and canonical URLs

Every page ships Open Graph and Twitter Card tags, so a link pasted into Slack,
LinkedIn, Telegram or iMessage shows a proper card instead of a bare URL. Clients
never ask for this and always notice it.

You write nothing per page. `canonical` and the absolute image URL are derived in
`vite.config.js` from `siteUrl` plus the page's own path:

| File on disk           | URL used in the tags        |
| ---------------------- | --------------------------- |
| `src/index.html`       | `https://client.com/`       |
| `src/about/index.html` | `https://client.com/about/` |

**Two things to change on a new project:**

1. `siteUrl` in `pages.config.js` — social tags need absolute URLs, so this cannot
   be worked out from the page. The build prints a warning while it is still
   `https://example.com`.
2. `public/og.jpg` — replace with the client's 1200×630 card, and set `ogImageAlt`.

A page that deserves its own card sets `ogImage: '/img/whatever.jpg'` in its own
entry in `pages.config.js`.

**Three rules that keep partials working at any page depth:**

1. In a partial, use **root-absolute paths** — `/scripts/main.js`, not `./scripts/main.js`.
   A relative path is correct on `/index.html` and broken on `/about/index.html`.
2. Truly global files — favicon, `robots.txt`, Open Graph image — go in `public/`.
   They are copied as-is and their URL never changes.
3. Content images belong in the page, not in a partial. They differ per page anyway.

Editing a partial reloads the page in dev. That is expected: HTML has no hot
replacement. CSS still updates without a reload.

Handlebars is here for partials and page data. Resist turning it into a template
framework — if a page needs real logic, it probably needs a CMS.

---

## Styles

SCSS with `@use` / `@forward`. There is no `@import` anywhere: it has been deprecated
since Dart Sass 1.80.

Every partial loads the shared layer under a namespace:

```scss
@use '../abstracts' as a;

.card {
  padding: var(--space-md);

  @include a.respond-to('lg') {
    padding: var(--space-lg);
  }
}
```

`as a` rather than `as *` on purpose: the namespace is the whole point of `@use`,
and it keeps the origin of every mixin visible.

**`@extend` and placeholder selectors are not used.** They do not work across
namespaces and are the classic trap when migrating from `@import`. Use a mixin.

### Tokens: CSS custom properties, not Sass variables

All design tokens — colours, type scale, spacing, radii, shadows — are CSS custom
properties in `src/styles/base/_tokens.scss`. They can be re-themed at runtime,
overridden per section, and re-branded for a client in one block.

Sass variables are used for exactly one thing: **breakpoints**, in
`abstracts/_breakpoints.scss`. A media query cannot read a `var()`, so they have no
choice but to be compile-time values.

Colour shades come from `color-mix()`, which is why no Sass colour functions appear
anywhere — the deprecated `darken()` / `lighten()` problem simply does not arise.

### Adding a component

1. Create `src/styles/components/_card.scss`.
2. Add `@use 'components/card';` to `main.scss`, keeping the layer order.

Layer order in `main.scss` is deliberate: base → layout → components → utilities,
so a utility can win without `!important`.

### Fonts

The starter uses the system font stack: zero requests, zero layout shift, excellent
performance. To self-host a webfont on a client project:

1. Put the `.woff2` in `src/assets/fonts/`.
2. Declare it in `base/_typography.scss` with `font-display: swap`.
3. Preload only the one weight used above the fold, in `src/partials/head.html`.
4. Point `--font-body` at it in `base/_tokens.scss`.

---

## JavaScript

Plain ES modules, no framework, no bundled runtime.

`src/scripts/main.js` is the only entry point. It starts the modules — the
stylesheet is loaded by a `<link>` in `head.html`, not imported here:

```js
import { initNav } from './modules/nav.js'

initNav()
```

A CSS import inside a deferred module arrives _after_ the first paint, so every
page load shows one unstyled frame. A `<link>` in `<head>` blocks that paint
until the CSS is ready. On a multi-page site, where each click is a full page
load, the difference is visible on every navigation.

To add a module, create `src/scripts/modules/thing.js`, export an `initThing()`
function that returns early if its markup is absent, and call it from `main.js`.
That last part matters: on a multi-page site every module runs on every page.

The mobile navigation is progressive enhancement. Without JavaScript the menu is
simply always visible; the collapsing behaviour only applies once `<html data-js="true">`
is set, which a tiny inline script in `head.html` does before the first paint.

---

## Images

One tool, one command. Sources in, production-ready responsive images out.

```
src/assets/images/          sources — committed to git
        |
        |  npm run images   (sharp for raster, svgo for svg)
        v
public/img/                 generated — git-ignored, content-hashed
        |
        |  npm run build
        v
dist/img/                   copied as-is
```

### Adding or replacing an image

1. Drop the file into `src/assets/images/`.
2. Run `npm run images` (or just restart `npm run dev`).
3. Use it:

```html
{{picture src="hero.jpg" alt="Description of the image" sizes="(min-width: 60rem) 50vw, 100vw"
class="hero__image" priority=true }}
```

This produces a full `<picture>`: AVIF and WebP sources at every width, a JPEG or PNG
fallback, plus `width` and `height` so the page never shifts as images load.

- `alt` is **required**. Use `alt=""` for a decorative image — it is how you tell a
  screen reader to skip it.
- `sizes` describes how wide the image is _rendered_, not its file size. Getting this
  right is most of the download saving.
- `priority=true` marks the largest above-the-fold image: no lazy loading,
  `fetchpriority="high"`. **Use it on exactly one image per page** — usually the one
  Lighthouse reports as the LCP element. Everything else is lazy-loaded automatically.

For an SVG, `{{svg "logo.svg"}}` returns its hashed URL.

### Tuning

`image.config.js` holds widths, formats, quality and per-file overrides. It is the
only file you normally change per client project.

### What is generated and what is committed

| Path                 | Git           | Notes                                      |
| -------------------- | ------------- | ------------------------------------------ |
| `src/assets/images/` | **committed** | Your originals. The source of truth.       |
| `public/img/`        | ignored       | Regenerated on demand. Never edit by hand. |
| `dist/`              | ignored       | Build output.                              |
| `node_modules/`      | ignored       | —                                          |

Unchanged files are skipped, so repeat runs cost almost nothing. Change
`image.config.js` and everything is rebuilt and stale files are removed.

`npm run images` before `npm run build` is **not** required — npm runs it through the
`prebuild` hook. The same applies on a host like Netlify, which only runs `npm run build`.

---

## Accessibility

Present from the first commit, not added at the end:

- skip link to `#main`, visible on keyboard focus
- real landmarks: `header`, `nav[aria-label]`, `main`, `footer`
- `aria-current="page"` on the active navigation item, styled from that attribute
- visible focus rings everywhere via `:focus-visible`
- mobile menu with `aria-expanded` / `aria-controls`, Escape to close, focus returned
  to the button
- `prefers-reduced-motion` honoured globally
- `.visually-hidden` utility and matching mixin — one implementation, two ways to use it
- every `<section>` named with `aria-labelledby` pointing at its own heading, so
  screen-reader landmark navigation announces "Features", not "region"
- `width` and `height` on every generated image

**Before delivery, check by hand.** Automated tools catch roughly a third of real
accessibility problems, so a green score is the floor, not the finish line:

- tab through the whole page and confirm you can always see where focus is;
- reach every interactive element with the keyboard, and operate it;
- Lighthouse's accessibility category runs axe-core internally, so a 100 there
  already covers axe's core automated rules. The **axe DevTools** extension
  (Deque, free, Chrome Web Store) runs a wider rule set — worth adding for
  client work.

## Performance

- module scripts, deferred by default — never render-blocking
- stylesheet in `<head>`, so no unstyled frame on any page load
- one extracted, minified stylesheet in production
- system fonts: no font requests, no FOUT
- AVIF / WebP with correct `srcset` and `sizes`
- lazy loading everywhere except the one `priority` image
- `width` / `height` on images to keep CLS at 0
- no source maps in `dist/` — a shipped map is public and exposes the original
  source. For a one-off debug build: `npm run build -- --sourcemap`

**Target for a client site:** Lighthouse ≥95 on all four metrics, tested on the
built output via `npm run preview`, not on the dev server.

---

## Using this starter for a new client project

On GitHub, click **Use this template → Create a new repository**, or from the
command line:

```bash
gh repo create client-name --template arinka-taranets/frontend-starter --private --clone
cd client-name
npm install
```

The new repository starts from a single commit with its own history. It is not a
fork, and nothing from this repository's history comes along.

If the client's code lives on another host (GitLab, Bitbucket), copy the files and
start a fresh history instead:

```bash
git clone --depth 1 https://github.com/arinka-taranets/frontend-starter.git client-name
cd client-name
rm -rf .git && git init
npm install
```

Then:

1. `package.json` — change `name` and `description`.
2. `pages.config.js` — set **`siteUrl`** (the build warns until you do), then
   replace `siteName` and the page list.
3. `src/styles/base/_tokens.scss` — set the client's colours and type scale.
   This is usually the entire re-brand.
4. `src/assets/images/` — delete the demo images, add the client's.
5. `src/index.html` and `src/about/index.html` — delete the demo sections, keep the
   page shell.
6. `src/partials/header.html` and `footer.html` — real navigation, real footer.
7. `public/favicon.svg` — the client's icon, and `public/og.jpg` — their 1200×630
   link-preview card.
8. `.browserslistrc` — adjust if the client has specific browser requirements, and
   agree it with them in writing.
9. `LICENSE` — remove it, or replace it with the client's terms.

Everything else — build config, SCSS architecture, image pipeline, accessibility
utilities, linting — stays as is. That is the point.

## Before you deliver

- [ ] `npm run check` passes
- [ ] `npm run build` then `npm run preview` — test the built site, not the dev server
- [ ] No `.map` files in `dist/` — a debug build with `--sourcemap` was not deployed
- [ ] Lighthouse ≥95 on performance, accessibility, best practices, SEO
- [ ] axe DevTools: 0 violations
- [ ] Keyboard-only pass over every page
- [ ] Checked at 360px, 768px and 1440px
- [ ] Checked in Safari, not only Chrome
- [ ] Checked on a real phone
- [ ] Every image has a meaningful `alt`, or `alt=""` if decorative
- [ ] Exactly one `priority=true` image per page, and it is the LCP element
- [ ] Titles and meta descriptions written for every page in `pages.config.js`
- [ ] `siteUrl` set to the real domain — no build warning
- [ ] `public/og.jpg` replaced, and the link preview checked by pasting the URL
      into Slack or a private message

## License

MIT
