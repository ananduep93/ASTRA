/**
 * ASTRA 2027, Design B ("The Issue"): the ONE place where colours, fonts,
 * type, spacing, comic devices and motion values are defined.
 *
 * - CSS gets these values as custom properties (see `themeCssVars`, injected
 *   by app/layout.js), and Tailwind maps them to utilities in globals.css.
 * - JS (GSAP) imports this file directly.
 */

/* ------------------------------------------------------------------ colour */
// Three colours only. Red is for spot highlights (bursts, one word, a marker),
// never for body text.
export const colors = {
  paper: "#F6F4EF",
  ink: "#0A0A0A",
  red: "#E5252A",
};

/* ------------------------------------------------------------------- fonts */
// Loaded with next/font in app/layout.js; these are the CSS variables it exposes.
// Display: Bricolage Grotesque, heavy, wide-shouldered grotesque with character
//   (punchy like a comic masthead, but not a cartoon face and not condensed).
// Mono: Courier Prime, a clean typewriter face for captions and labels,
//   readable at 14px on a phone.
export const fonts = {
  display: "var(--font-bricolage)",
  mono: "var(--font-courier-prime)",
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
  caption: fluid(14, 16), // mono captions: never under 14px
  body: fluid(16, 18),
  lead: fluid(18, 24),
  h3: fluid(24, 40),
  h2: fluid(36, 72),
  h1: fluid(56, 150),
  masthead: fluid(92, 260), // the cover title
};

export const lineHeights = {
  display: 0.88,
  heading: 0.95,
  body: 1.5,
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
  gutter: fluid(14, 40), // page side padding
};

/* ----------------------------------------------------------- comic devices */
export const comic = {
  outline: fluid(3, 4), // thick ink outline of panels, bubbles, captions
  panelGap: fluid(10, 16), // the gutter between panels
  halftone: fluid(6, 9), // halftone dot grid size
  halftoneDot: "32%", // dot radius share of the grid cell
  grain: 0.06, // paper grain strength (0..1)
  radius: "2px", // panels are square-cornered; bubbles round themselves
  skew: 14, // % slant of the leading edge of a panel wipe
};

/* ------------------------------------------------------------------ motion */
// Each ease has a GSAP name and its CSS cubic-bezier twin, so DOM transitions
// and GSAP tweens feel identical.
export const eases = {
  out: { gsap: "power3.out", css: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
  inOut: { gsap: "power2.inOut", css: "cubic-bezier(0.455, 0.03, 0.515, 0.955)" },
  expo: { gsap: "expo.out", css: "cubic-bezier(0.19, 1, 0.22, 1)" },
  pop: { gsap: "back.out(1.7)", css: "cubic-bezier(0.34, 1.56, 0.64, 1)" }, // bubbles, sound words
  wipe: { gsap: "power4.inOut", css: "cubic-bezier(0.77, 0, 0.175, 1)" }, // panel wipes
  scrub: { gsap: "none", css: "linear" },
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

/* ------------------------------------------------------------------- brand */
export const brand = {
  ink: "/brand/astra-ink.webp", // ink logo, built by scripts/make-brand.py
  inkSize: [640, 515],
};

/** Paper grain: a tiny tile of SVG noise in ink at the theme's grain strength. */
function grainImage() {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
    "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
    `<feColorMatrix values='0 0 0 0 0.04 0 0 0 0 0.04 0 0 0 0 0.04 0 0 0 ${comic.grain * 2.2} 0'/></filter>` +
    "<rect width='100%' height='100%' filter='url(#n)'/></svg>";
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ------------------------------------------------------ CSS variable dump */
/** All tokens as a `:root { ... }` CSS string. Injected once by layout.js. */
export function themeCssVars() {
  const vars = {
    "--paper": colors.paper,
    "--ink": colors.ink,
    "--red": colors.red,
    "--font-display-face": fonts.display,
    "--font-mono-face": fonts.mono,
    "--lh-display": lineHeights.display,
    "--lh-heading": lineHeights.heading,
    "--lh-body": lineHeights.body,
    "--outline": comic.outline,
    "--panel-gap": comic.panelGap,
    "--halftone": comic.halftone,
    "--halftone-dot": comic.halftoneDot,
    "--grain": comic.grain,
    "--radius": comic.radius,
    "--grain-image": grainImage(),
  };
  for (const [k, v] of Object.entries(typeScale)) vars[`--text-${k}-size`] = v;
  for (const [k, v] of Object.entries(space)) vars[`--space-${k}`] = v;
  for (const [k, v] of Object.entries(eases)) vars[`--ease-${k}-fn`] = v.css;
  for (const [k, v] of Object.entries(durations)) vars[`--dur-${k}`] = `${v}s`;

  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `:root{${body}}`;
}

const theme = { colors, fonts, typeScale, lineHeights, space, comic, eases, durations, staggers, brand };
export default theme;
