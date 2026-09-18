import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import Handlebars from 'handlebars'

/**
 * Handlebars helpers available in every page and partial.
 *
 * Keep this file small. Handlebars is here for partials and page data,
 * not to become a template framework.
 */
export function createHelpers(root) {
  const manifestPath = resolve(root, '.image-manifest.json')

  /** Read the image manifest fresh on every call so `npm run images` is picked up live. */
  function manifest() {
    if (!existsSync(manifestPath)) {
      throw new Error(
        '.image-manifest.json is missing. Run `npm run images` ' +
          '(npm normally does this for you via the predev / prebuild hooks).',
      )
    }
    return JSON.parse(readFileSync(manifestPath, 'utf8'))
  }

  /** Skips empty values — used for optional attributes. */
  function attr(name, value) {
    if (value === undefined || value === null || value === false || value === '') return ''
    return always(name, value)
  }

  /** Always emitted. `alt=""` must survive: it is how a decorative image is marked. */
  function always(name, value) {
    return ` ${name}="${Handlebars.escapeExpression(String(value))}"`
  }

  return {
    /** {{#if (eq page 'about')}} — the only comparison helper we need. */
    eq: (a, b) => a === b,

    /**
     * Responsive <picture> built from the generated image manifest.
     *
     *   {{picture src="hero.jpg" alt="..." sizes="(min-width: 64rem) 50vw, 100vw" priority=true}}
     *
     * priority=true marks the LCP image: no lazy loading, high fetch priority.
     * Everything else is lazy by default.
     */
    picture(options) {
      const { src, alt, sizes, class: className, priority = false } = options.hash

      if (!src) throw new Error('{{picture}} requires a "src" argument.')
      if (alt === undefined) {
        throw new Error(
          `{{picture src="${src}"}} requires an "alt" argument (use alt="" if decorative).`,
        )
      }

      const image = manifest().images?.[src]
      if (!image) {
        throw new Error(
          `{{picture src="${src}"}}: no generated variants found. ` +
            `Put the source file in src/assets/images/ and run \`npm run images\`.`,
        )
      }

      const sizesAttr = attr('sizes', sizes || '100vw')

      const sources = Object.entries(image.sources)
        .map(([type, set]) => {
          const srcset = set.map((v) => `${v.src} ${v.w}w`).join(', ')
          return `  <source type="${type}" srcset="${srcset}"${sizesAttr}>`
        })
        .join('\n')

      const fallback = image.fallback.at(-1)
      const loading = priority ? '' : attr('loading', 'lazy')
      const fetchPriority = priority ? attr('fetchpriority', 'high') : ''

      const html = [
        '<picture>',
        sources,
        `  <img src="${fallback.src}"` +
          attr('srcset', image.fallback.map((v) => `${v.src} ${v.w}w`).join(', ')) +
          sizesAttr +
          attr('width', image.width) +
          attr('height', image.height) +
          always('alt', alt) +
          attr('class', className) +
          attr('decoding', 'async') +
          loading +
          fetchPriority +
          '>',
        '</picture>',
      ].join('\n')

      return new Handlebars.SafeString(html)
    },

    /** Hashed URL of a generated SVG, e.g. {{svg "logo.svg"}} */
    svg(name) {
      const url = manifest().svg?.[name]
      if (!url) {
        throw new Error(
          `{{svg "${name}"}}: not found. Put it in src/assets/images/ and run \`npm run images\`.`,
        )
      }
      return url
    },
  }
}
