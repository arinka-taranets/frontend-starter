/**
 * Per-page data passed into Handlebars templates.
 *
 * Keys are page paths relative to `src/`, exactly as the file sits on disk.
 * Lookup is forgiving about the leading slash, so '/index.html' works too.
 *
 * Every key here is available in any page or partial as {{key}}.
 */

/** Values shared by every page. Also used as the fallback for pages not listed below. */
export const defaults = {
  siteName: 'Frontend Starter',
  locale: 'en',
  year: new Date().getFullYear(),
  title: 'Frontend Starter',
  description: '',
  page: '',

  // CHANGE THIS FIRST on a new project. Social previews and the canonical URL
  // need absolute URLs, so they cannot be worked out from the page alone.
  // The build warns while it is still the placeholder below.
  siteUrl: 'https://example.com',

  // Link preview image, 1200x630. Override per page when a page deserves its own.
  ogImage: '/og.jpg',
  ogImageAlt: 'Frontend Starter',
}

export default {
  'index.html': {
    ...defaults,
    page: 'home',
    title: 'Frontend Starter — fast, accessible multi-page sites',
    description:
      'A reusable Vite starter for production marketing sites: semantic HTML, SCSS modules, responsive images and accessibility by default.',
  },

  'about/index.html': {
    ...defaults,
    page: 'about',
    title: 'About — Frontend Starter',
    description: 'What this starter includes and how it is meant to be used on client projects.',
  },
}
