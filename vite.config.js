import { readdirSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import pages, { defaults as pageDefaults } from './pages.config.js'
import { createHelpers } from './scripts/helpers.mjs'

const ROOT = import.meta.dirname
const SRC = resolve(ROOT, 'src')
const PARTIALS = resolve(SRC, 'partials')

/**
 * Every .html file under src/ is a page, except the partials.
 * Adding a page means creating a file — this config never needs editing.
 *
 * src/index.html        ->  /
 * src/about/index.html  ->  /about/
 */
function findPages() {
  const files = readdirSync(SRC, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => !file.startsWith(PARTIALS + sep))

  if (files.length === 0) {
    throw new Error('No .html pages found in src/. At least src/index.html is required.')
  }

  return Object.fromEntries(
    files.map((file) => [
      relative(SRC, file)
        .replaceAll(sep, '/')
        .replace(/\.html$/, ''),
      file,
    ]),
  )
}

const warned = new Set()

/** File path on disk -> the URL the page is served at. */
function pageUrl(key) {
  if (key === 'index.html') return '/'
  if (key.endsWith('/index.html')) return `/${key.slice(0, -'index.html'.length)}`
  return `/${key}`
}

/**
 * vite-plugin-handlebars hands us the page path. Normalise it and look the
 * page up in pages.config.js. A page that is not listed still builds — it just
 * falls back to the shared defaults, and says so once in the terminal.
 */
function contextFor(pagePath) {
  const key = String(pagePath).replaceAll('\\', '/').replace(/^\/+/, '')
  const data = pages[key] ?? pages[`/${key}`]

  if (!data && !warned.has(key)) {
    warned.add(key)
    console.warn(
      `[pages] "${key}" is not in pages.config.js — using defaults (no title, no description).`,
    )
  }

  const merged = { ...pageDefaults, ...data }
  const origin = String(merged.siteUrl ?? '').replace(/\/+$/, '')

  if (origin.includes('example.com') && !warned.has('siteUrl')) {
    warned.add('siteUrl')
    console.warn(
      '[pages] siteUrl is still the placeholder — set it in pages.config.js before going live.',
    )
  }

  // Social tags and rel=canonical require absolute URLs, so they are built here
  // rather than repeated by hand on every page.
  return {
    ...merged,
    canonical: origin + pageUrl(key),
    ogImageUrl: origin + merged.ogImage,
  }
}

export default defineConfig({
  // `root` is resolved from the current working directory.
  root: SRC,

  // `publicDir`, `input` and `build.outDir` are all resolved from `root`,
  // so they are given as absolute paths to keep them unambiguous.
  publicDir: resolve(ROOT, 'public'),
  input: findPages(),

  resolve: {
    alias: {
      '@': SRC,
    },
  },

  css: {
    devSourcemap: true,
  },

  build: {
    outDir: resolve(ROOT, 'dist'),
    // Required: outDir sits outside root, so Vite will not clear it by default.
    emptyOutDir: true,
    // Off: a map in dist/ is public and exposes the original source.
    // For a one-off debug build: npm run build -- --sourcemap
    sourcemap: false,
    // Warn early if a page ships an oversized bundle.
    chunkSizeWarningLimit: 300,
  },

  server: {
    open: true,
  },

  plugins: [
    handlebars({
      partialDirectory: PARTIALS,
      context: contextFor,
      helpers: createHelpers(ROOT),
    }),
  ],
})
