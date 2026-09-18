// Styles are loaded by a <link> in src/partials/head.html, not imported here:
// a stylesheet in <head> is applied before the first paint, while a CSS import
// inside a deferred module arrives after it — which shows one unstyled frame
// on every page load.
import { initNav } from './modules/nav.js'

initNav()
