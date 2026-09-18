/**
 * Image pipeline configuration.
 *
 * Source images live in  src/assets/images/   (committed to git)
 * Output is written to   public/img/          (generated, git-ignored)
 *
 * Tune this per client project — it is the only file you normally touch.
 */
export default {
  /** Widths to generate, in CSS pixels. Widths larger than the source are skipped. */
  widths: [640, 1024, 1600, 2000],

  /**
   * Modern formats to generate, best first.
   * A fallback in the source format (jpeg/png) is always produced as well.
   */
  formats: ['avif', 'webp'],

  /** Encoder quality per format. Lower = smaller file. */
  quality: {
    avif: 55,
    webp: 78,
    jpeg: 82,
    png: 90,
  },

  /** Per-file overrides, keyed by the source file name. */
  overrides: {
    // 'logo.png': { widths: [240] },
  },
}
