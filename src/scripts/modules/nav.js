/**
 * Accessible mobile navigation.
 *
 * Contract with the markup and CSS:
 *   - the toggle button carries aria-expanded and aria-controls
 *   - the nav carries data-open
 *   - collapsing only happens when <html data-js="true">, so the menu
 *     stays usable if this script never runs
 */

const DESKTOP = window.matchMedia('(min-width: 64rem)')

export function initNav() {
  const toggle = document.querySelector('.nav-toggle')
  const nav = document.getElementById(toggle?.getAttribute('aria-controls') ?? '')

  if (!toggle || !nav) return

  // The button is hidden in the markup so it never appears without a handler.
  toggle.removeAttribute('hidden')

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true'

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open))
    nav.dataset.open = String(open)
  }

  function close({ restoreFocus = false } = {}) {
    if (!isOpen()) return
    setOpen(false)
    if (restoreFocus) toggle.focus()
  }

  setOpen(false)

  toggle.addEventListener('click', () => setOpen(!isOpen()))

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close({ restoreFocus: true })
  })

  // Clicking anywhere outside the header closes the menu.
  document.addEventListener('click', (event) => {
    if (!isOpen()) return
    if (event.target.closest('.site-header')) return
    close()
  })

  // Following a link closes it, which matters for same-page anchors.
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close()
  })

  // Reaching the desktop layout resets state, so the menu is never
  // left "open" in a layout that has no toggle.
  DESKTOP.addEventListener('change', (event) => {
    if (event.matches) close()
  })
}
