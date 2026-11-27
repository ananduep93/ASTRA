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
  // #EC3A3F (was #E5252A): black ink on it reads at 4.94:1 (the Arts poster card).
  red: "#EC3A3F",
  // Background tones between black and white.
  nearBlack: "#181818",
  offWhite: "#EEEEEE",
};

/* ---------------------------------------------------------- squad colours */
/**
 * One colour per squad, behind a switch: the poster cards (the centre card is
 * filled with it, with BLACK ink: every value reads at 4.5:1 or more with
 * black), squad badges and emblems, rail dots, and 15% of the dots in a program
 * detail. Refined, slightly softened hues (premium, not neon). Never as body
 * text on black.
 * SQUAD_COLOURS = false: every squad falls back to the single red.
 */
export const SQUAD_COLOURS = true;
export const squadAccents = {
  Arts: colors.red, // black ink 4.94:1
  Tech: "#4F7BFF", // electric blue, black ink 5.29:1
  Gaming: "#9AE05A", // acid green, black ink 12.4:1
  Business: "#F2B03E", // amber, black ink 10.4:1
  Fun: "#F2609B", // hot pink, black ink 6.53:1
};

/**
 * Card tones of a squad colour, mixed onto black (sRGB): the inactive card's
 * fill (tint), its 1px border (line) and its shape (dim).
 */
export const cardMix = { tint: 0.15, line: 0.3, dim: 0.55 };
export function mixOnBlack(hex, amount) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(colors.black.slice(1), 16);
  const ch = (sh) => Math.round(((a >> sh) & 255) * amount + ((b >> sh) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("")}`;
}

/** The accent for a squad (the single red when the switch is off). */
export const squadAccent = (squad) => (SQUAD_COLOURS ? (squadAccents[squad] ?? colors.red) : colors.red);

/** WCAG relative luminance and contrast ratio (for picking readable text on an accent). */
const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** Ink or white: whichever reads better on `hex` (text on a selected chip). */
export const onAccent = (hex) => (contrast(hex, colors.black) >= contrast(hex, colors.white) ? colors.black : colors.white);

/**
 * The four background tones as "whiteness" (0 = black, 1 = white), derived
 * from the colours above, so the 3D background (a mix of black and white) and
 * the dots that take the opposite tone agree with these exact colours.
 */
// The 3D background mixes black and white in LINEAR light (three.js colour
// management), so the levels are computed in linear light too.
const linear = (hex) => {
  const c = parseInt(hex.slice(1, 3), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const whiteness = (hex) => (linear(hex) - linear(colors.black)) / (linear(colors.white) - linear(colors.black));
export const tones = {
  black: 0,
  nearBlack: whiteness(colors.nearBlack),
  offWhite: whiteness(colors.offWhite),
  white: 1,
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
  type: { gsap: "steps(1)", css: "step-end" }, // typewriter: each character snaps on
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
  type: 0.035, // seconds between typed characters
};

/* ------------------------------------------------------------------- brand */
// The logo files (built from public/brand/astra-logo-white.png by
// scripts/make-brand.py) and how the white logo is shown on white sections.
export const brand = {
  mark: "/brand/astra-mark.webp", // cropped white logo, 512 x 412
  markSize: [512, 412],
  sample: "/brand/astra-logo-1024.png", // the finale dots sample its transparency
  iris: "/brand/astra-iris.png", // soft logo mask: the star-iris transition after the headline
  irisSize: [384, 309],
  // White logo -> #0A0A0A on white backgrounds (255 x 0.04 = 10 = 0x0A). No second file.
  onLight: "brightness(0.04)",
};

/* --------------------------------------------------------------------- hud */
export const hud = {
  inset: "10px", // corner brackets sit this far from the screen edge (or the safe area)
  lineOpacity: 0.35, // thin HUD lines and the progress track
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
    "--astra-logo-on-light": brand.onLight,
    "--astra-offwhite": colors.offWhite,
    "--astra-hud-inset": hud.inset,
    "--astra-hud-line": hud.lineOpacity,
  };
  for (const sq of Object.keys(squadAccents)) {
    vars[`--squad-${sq}`] = squadAccent(sq);
    vars[`--squad-on-${sq}`] = onAccent(squadAccent(sq));
    for (const [k, amount] of Object.entries(cardMix)) vars[`--squad-${k}-${sq}`] = mixOnBlack(squadAccent(sq), amount);
  }
  for (const [k, v] of Object.entries(typeScale)) vars[`--astra-text-${k}`] = v;
  for (const [k, v] of Object.entries(space)) vars[`--astra-space-${k}`] = v;
  for (const [k, v] of Object.entries(eases)) vars[`--astra-ease-${k}`] = v.css;
  for (const [k, v] of Object.entries(durations)) vars[`--astra-dur-${k}`] = `${v}s`;

  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `:root{${body}}`;
}

const theme = { colors, tones, fonts, typeScale, lineHeights, space, eases, durations, staggers, brand, hud };
export default theme;
