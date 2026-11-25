/**
 * Static mode: low tier, reduced motion, WebGL failure or no JavaScript.
 * Everything is plain, stacked, black and white: the headline as text, each
 * squad as a section, each program as a card (name, squad, Details button).
 *
 * The rules are written ONCE here and emitted three ways by app/layout.js:
 *  1. html[data-world="static"]   set by JS (low tier, WebGL failure)
 *  2. @media (prefers-reduced-motion: reduce)   before any JS has run
 *  3. <noscript>                   when JavaScript is off
 * `:root:root` raises specificity so these beat the live layout rules.
 */
const RULES = [
  [".hero-h1", "position:static;width:auto;height:auto;margin:0;overflow:visible;clip-path:none"],
  [".journey-spacer", "height:0"],
  [
    ".squad-stop",
    "position:relative;inset:auto;visibility:visible;pointer-events:auto;--stop-fg:var(--astra-white);" +
      "padding:var(--astra-space-xl) var(--astra-space-gutter)",
  ],
  [".squad-head", "position:static;width:auto"],
  [".squad-name", "font-size:var(--astra-text-h2)"],
  [".program-shape, .program-rail, .program-index, .progress-marks", "display:none"],
  [".program-copy", "position:static;width:auto;margin-top:var(--astra-space-md)"],
  [
    ".program-focus",
    "position:static;visibility:visible;pointer-events:auto;padding:var(--astra-space-md) 0;" +
      "border-top:1px solid color-mix(in srgb, currentColor 25%, transparent)",
  ],
  [".program-name", "font-size:var(--astra-text-h3)"],
];

const prefixed = (prefix) =>
  RULES.map(([sel, decl]) => `${sel.split(",").map((s) => `${prefix} ${s.trim()}`).join(",")}{${decl}}`).join("");

/** For the page <head>: the JS-flag version and the reduced-motion version. */
export const staticCss = () =>
  prefixed(':root:root[data-world="static"]') + `@media (prefers-reduced-motion: reduce){${prefixed(":root:root")}}`;

/** For <noscript>: always on. */
export const noscriptCss = () => prefixed(":root:root");
