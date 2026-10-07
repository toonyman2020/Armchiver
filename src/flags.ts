/**
 * Compile-time build flags.
 *
 * __COMMERCIAL__ is replaced by Vite at build time (see vite.config.ts). When a
 * build is produced for distribution, the value is true and the developer-only
 * code is removed from the bundle rather than hidden behind a condition that
 * could be flipped from devtools.
 */
declare const __COMMERCIAL__: boolean;

export const IS_COMMERCIAL: boolean =
  typeof __COMMERCIAL__ !== "undefined" ? __COMMERCIAL__ : false;