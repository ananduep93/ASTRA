/**
 * Program silhouettes for the dot morph. Original, generic shapes (no logos,
 * no brand marks), each an SVG path on a 100 x 100 grid. They are filled and
 * then sampled into dots by lib/textTargets.js, like the ASTRA headline.
 *
 * `rule: "evenodd"` lets inner sub-paths cut holes (lens glass, controller
 * buttons, the question mark inside the bubble, the hole in the map pin).
 *
 * Phase 4: 5 custom "hero" shapes; every other program uses its squad's
 * default shape until more custom shapes are approved.
 */

const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const polygon = (pts) => `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
const rect = (x, y, w, h) => polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
const regular = (cx, cy, r, n, rot = 0) =>
  polygon(Array.from({ length: n }, (_, k) => {
    const a = rot + (k / n) * Math.PI * 2;
    return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
  }));
const star = (cx, cy, rOut, rIn, n) =>
  polygon(Array.from({ length: n * 2 }, (_, k) => {
    const r = k % 2 ? rIn : rOut;
    const a = -Math.PI / 2 + (k / (n * 2)) * Math.PI * 2;
    return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
  }));

export const SHAPES = {
  /* ---------------- hero shapes (5) ---------------- */

  // Camera lens: outer barrel ring, glass with a six-blade aperture opening, a glint.
  lens: {
    rule: "evenodd",
    d: [circle(50, 50, 46), circle(50, 50, 39), circle(50, 50, 32), regular(50, 50, 13, 6, Math.PI / 6), circle(38, 38, 4)].join(" "),
  },

  // Angle brackets with a slash: < / >
  brackets: {
    rule: "nonzero",
    d: [
      polygon([[32, 18], [8, 50], [32, 82], [41, 75], [22, 50], [41, 25]]),
      polygon([[68, 18], [92, 50], [68, 82], [59, 75], [78, 50], [59, 25]]),
      polygon([[56, 14], [65, 17], [44, 86], [35, 83]]),
    ].join(" "),
  },

  // Generic game controller: body with two grips; d-pad and buttons cut out.
  controller: {
    rule: "evenodd",
    d: [
      "M24 28 Q16 28 13 38 L5 66 Q2 80 13 84 Q22 87 29 76 L35 66 L65 66 L71 76 Q78 87 87 84 Q98 80 95 66 L87 38 Q84 28 76 28 Z",
      polygon([[25, 40], [31, 40], [31, 34], [37, 34], [37, 40], [43, 40], [43, 46], [37, 46], [37, 52], [31, 52], [31, 46], [25, 46]]),
      circle(66, 38, 4),
      circle(75, 45, 4),
      circle(66, 52, 4),
      circle(57, 45, 4),
    ].join(" "),
  },

  // Question mark inside a speech bubble (the mark is cut out of the bubble).
  questionBubble: {
    rule: "evenodd",
    d: [
      "M20 10 L80 10 Q92 10 92 22 L92 60 Q92 72 80 72 L42 72 L22 90 L26 72 L20 72 Q8 72 8 60 L8 22 Q8 10 20 10 Z",
      "M37 32 Q37 18 50 18 Q63 18 63 30 Q63 39 55 43 Q52 45 52 49 L52 53 L45 53 L45 48 Q45 40 52 36 Q56 34 56 30 Q56 25 50 25 Q44 25 44 32 Z",
      circle(48.5, 62, 4.5),
    ].join(" "),
  },

  // Map pin: teardrop with a round hole.
  mapPin: {
    rule: "evenodd",
    d: ["M50 94 C40 78 20 62 20 40 A30 30 0 1 1 80 40 C80 62 60 78 50 94 Z", circle(50, 39, 12)].join(" "),
  },

  /* ---------------- squad defaults (5) ---------------- */

  // Arts: one thick, wavy brush stroke with a tapered end.
  brush: {
    rule: "nonzero",
    d: "M6 64 C18 36 36 30 48 48 C58 63 72 66 86 36 L95 30 L92 44 C80 76 58 78 44 60 C34 47 24 48 14 70 Z",
  },

  // Tech: a chip (with a window) wired to four pads.
  circuitNode: {
    rule: "evenodd",
    d: [
      rect(34, 34, 32, 32),
      rect(43, 43, 14, 14),
      rect(10, 47, 24, 6),
      rect(66, 47, 24, 6),
      rect(47, 10, 6, 24),
      rect(47, 66, 6, 24),
      circle(9, 50, 6),
      circle(91, 50, 6),
      circle(50, 9, 6),
      circle(50, 91, 6),
    ].join(" "),
  },

  // Gaming: a chunky block made of square pixels.
  pixelBlock: {
    rule: "nonzero",
    d: [rect(14, 30, 22, 22), rect(39, 30, 22, 22), rect(64, 30, 22, 22), rect(39, 55, 22, 22), rect(39, 5, 22, 22)].join(" "),
  },

  // Business: four rising bars on a baseline.
  risingBars: {
    rule: "nonzero",
    d: [rect(12, 64, 15, 24), rect(32, 50, 15, 38), rect(52, 34, 15, 54), rect(72, 14, 15, 74), rect(6, 90, 88, 5)].join(" "),
  },

  // Fun: an eight-point star burst.
  starBurst: {
    rule: "nonzero",
    d: star(50, 50, 47, 20, 8),
  },
};

/** Custom shapes for specific programs (by program id from data/programs.js). */
export const PROGRAM_SHAPES = {
  photography: "lens",
  "coding-competition": "brackets",
  "e-sports": "controller",
  "business-quiz": "questionBubble",
  "scavenger-hunt": "mapPin",
};

/** Default shape for every other program of a squad. */
export const SQUAD_DEFAULT_SHAPES = {
  Arts: "brush",
  Tech: "circuitNode",
  Gaming: "pixelBlock",
  Business: "risingBars",
  Fun: "starBurst",
};

/** The shape key for a program. */
export const shapeFor = (program) => PROGRAM_SHAPES[program.id] ?? SQUAD_DEFAULT_SHAPES[program.squad];
