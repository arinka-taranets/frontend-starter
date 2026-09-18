/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', 'node_modules/**'],
  rules: {
    // BEM-style class names: block, block__element, block--modifier
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Expected class to be kebab-case BEM: block__element--modifier' },
    ],

    // Design tokens live in CSS custom properties; keep their names consistent.
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',

    // This project uses @use / @forward, never @import.
    'scss/load-no-partial-leading-underscore': true,

    // Fights BEM constantly and catches almost no real bugs. Widely disabled.
    'no-descending-specificity': null,

    // Nesting deeper than this is a sign the markup needs a new class.
    'max-nesting-depth': [2, { ignoreAtRules: ['media', 'supports', 'include'] }],
  },
}
