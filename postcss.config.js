import autoprefixer from 'autoprefixer'

/**
 * Autoprefixer reads .browserslistrc.
 * Vite picks this file up automatically and applies it to all CSS.
 */
export default {
  plugins: [autoprefixer()],
}
