/**
 * ASTRA 2027 theme: the ONE place where colours, fonts, type, spacing and
 * motion values are defined. Everything else reads from here.
 *
 * - CSS gets these values as custom properties (see `themeCssVars`, injected
 *   by app/layout.js), and Tailwind maps them to utilities in globals.css.
 * - JS (GSAP, three.js) imports this file directly.
 */

/* ------------------------------------------------------------------ colour */
export const colors = {
  black: "#0A0A0A",
  white: "#FAFAFA",
  // The single red accent. Glows and shapes only, never body text on black.
  red: "#E5252A",
};

/* ------------------------------------------------------------------- fonts */
// The font files are loaded with next/font in app/layout.js; these are the
// CSS variables next/font exposes. Display: Big Shoulders (tall, condensed,
// bold). Body: Instrument Sans (calm, readable at small sizes).
export const fonts = {
  display: "var(--font-big-shoulders)",
  body: "var(--font-instrument-sans)",
};

/* ------------------------------------------------------------- type scale */
// Fluid sizes: grow linearly from a 360px screen to a 1440px screen.
const VW_MIN = 360;
const VW_MAX = 1440;
const rem = (px) => `${+(px / 16).toFixed(4)}rem`;

/** clamp() that goes from `minPx` at 360px wide to `maxPx` at 1440px wide. */
export function fluid(minPx, maxPx) {
  const slope = (maxPx - minPx) / (VW_MAX - VW_MIN);
  const base = minPx - slope * VW_MIN;
  return `clamp(${rem(minPx)}, ${rem(base)} + ${+(slope * 100).toFixed(4)}vw, ${rem(maxPx)})`;
}

export const typeScale = {
  small: fluid(13, 14),
  body: fluid(16, 18),
  lead: fluid(19, 24),
  h3: fluid(26, 40),
  h2: fluid(40, 80),
  h1: fluid(64, 160),
  display: fluid(88, 280),
};

export const lineHeights = {
  display: 0.86,
  heading: 0.95,
  body: 1.55,
};

/* ----------------------------------------------------------------- spacing */
export const space = {
  "3xs": fluid(4, 4),
  "2xs": fluid(8, 8),
  xs: fluid(12, 14),
  sm: fluid(16, 20),
  md: fluid(24, 32),
  lg: fluid(40, 64),
  xl: fluid(64, 112),
  "2xl": fluid(96, 192),
  gutter: fluid(16, 48), // page side padding (16px on a 360px phone)
};

/* ------------------------------------------------------------------ motion */
// Each ease has a GSAP name and its CSS cubic-bezier twin, so DOM transitions
// and GSAP tweens feel identical.
export const eases = {
  out: { gsap: "power3.out", css: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
  inOut: { gsap: "power2.inOut", css: "cubic-bezier(0.455, 0.03, 0.515, 0.955)" },
  expo: { gsap: "expo.out", css: "cubic-bezier(0.19, 1, 0.22, 1)" },
  scrub: { gsap: "none", css: "linear" }, // scroll-scrubbed motion
};

// Seconds (GSAP uses seconds; CSS vars get "s" added).
export const durations = {
  fast: 0.3,
  base: 0.6,
  slow: 1.0,
  epic: 1.6,
};

export const staggers = {
  tight: 0.04,
  base: 0.08,
  loose: 0.14,
};

/* ------------------------------------------------------ CSS variable dump */
/** All tokens as a `:root { ... }` CSS string. Injected once by layout.js. */
export function themeCssVars() {
  const vars = {
    "--astra-black": colors.black,
    "--astra-white": colors.white,
    "--astra-red": colors.red,
    "--astra-font-display": fonts.display,
    "--astra-font-body": fonts.body,
    "--astra-lh-display": lineHeights.display,
    "--astra-lh-heading": lineHeights.heading,
    "--astra-lh-body": lineHeights.body,
  };
  for (const [k, v] of Object.entries(typeScale)) vars[`--astra-text-${k}`] = v;
  for (const [k, v] of Object.entries(space)) vars[`--astra-space-${k}`] = v;
  for (const [k, v] of Object.entries(eases)) vars[`--astra-ease-${k}`] = v.css;
  for (const [k, v] of Object.entries(durations)) vars[`--astra-dur-${k}`] = `${v}s`;

  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `:root{${body}}`;
}

const theme = { colors, fonts, typeScale, lineHeights, space, eases, durations, staggers };
export default theme;
