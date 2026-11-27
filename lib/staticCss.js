/**
 * Static mode: low tier, reduced motion, WebGL failure or no JavaScript.
 * Everything is plain, stacked, black and white: the headline as text, the
 * briefing and the finale as sections. The programs section is a normal page
 * section anyway (it works the same in every mode).
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
  // Story: logo image + headline + transmission line on top, the finale as a plain section. No HUD, no comet.
  [".hud, .transmission-trail, .transmission-comet, .finale-stage", "display:none"],
  [".hero-stage", "display:flex;flex-direction:column;justify-content:center;height:auto;min-height:70svh"],
  [".hero-title-wrap", "height:auto"],
  [".hero-static-logo", "display:block;width:min(36vw,150px);height:auto;margin:0 auto var(--astra-space-md)"],
  [".transmission", "position:static;inset:auto;padding:0 var(--astra-space-gutter) var(--astra-space-lg)"],
  [".transmission-line", "position:static;opacity:1;transform:none"],
  [
    ".finale",
    "position:relative;inset:auto;visibility:visible;pointer-events:auto;" +
      "padding:var(--astra-space-xl) var(--astra-space-gutter);text-align:center",
  ],
  [".finale-static-logo", "display:block;width:min(60vw,320px);height:auto;margin:0 auto var(--astra-space-md)"],
  [".finale-copy", "position:static"],
  // Briefing: a plain white section (JS adds a cross-fade in globals.css).
  [
    ".briefing",
    "position:relative;inset:auto;visibility:visible;pointer-events:auto;background:var(--astra-white);" +
      "padding:var(--astra-space-xl) var(--astra-space-gutter)",
  ],
  [".briefing-intro, .briefing-facts", "position:static;visibility:visible"],
  [".briefing-facts", "margin-top:var(--astra-space-xl)"],
];

const prefixed = (prefix) =>
  RULES.map(([sel, decl]) => `${sel.split(",").map((s) => `${prefix} ${s.trim()}`).join(",")}{${decl}}`).join("");

/** For the page <head>: the JS-flag version and the reduced-motion version. */
export const staticCss = () =>
  prefixed(':root:root[data-world="static"]') + `@media (prefers-reduced-motion: reduce){${prefixed(":root:root")}}`;

/** For <noscript>: always on. */
export const noscriptCss = () => prefixed(":root:root");
