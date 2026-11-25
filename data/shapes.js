/**
 * Program silhouettes for the dot morph: ONE unique shape per program.
 * Original, generic icon-style forms (no logos, no brand marks, no
 * characters), each on a 100 x 100 grid. They are filled and then sampled
 * into dots by lib/textTargets.js, like the ASTRA headline. Everything is
 * bold and filled: thin details vanish when drawn as dots.
 *
 * A shape is either
 *   { d, rule }          one SVG path; rule "evenodd" lets inner sub-paths cut holes
 *   { parts: [{ d, rule }, ...] }   several paths, filled one after another (their union)
 *
 * The squad (from data/programs.js) only decides HOW the dots move between
 * shapes; the program decides WHICH shape. scripts/check-shapes.mjs fails the
 * build if any program has no shape or two programs share one.
 */

const f = (n) => +n.toFixed(2);
const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const ellipse = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const polygon = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")} Z`;
const rect = (x, y, w, h) => polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
const regular = (cx, cy, r, n, rot = 0) =>
  polygon(Array.from({ length: n }, (_, k) => {
    const a = rot + (k / n) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }));
/** Rotated ellipse as a polygon (for tilted note heads). */
const tiltedEllipse = (cx, cy, rx, ry, rotDeg, n = 36) => {
  const r = (rotDeg * Math.PI) / 180;
  return polygon(Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    return [cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)];
  }));
};
/** A thick arc (ring sector) between radii r1 < r2, from angle a0 to a1 in degrees (0 = right, 90 = down). */
const arcBand = (cx, cy, r1, r2, a0, a1, n = 28) => {
  const pt = (r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const outer = Array.from({ length: n + 1 }, (_, k) => pt(r2, a0 + ((a1 - a0) * k) / n));
  const inner = Array.from({ length: n + 1 }, (_, k) => pt(r1, a1 - ((a1 - a0) * k) / n));
  return polygon([...outer, ...inner]);
};
/** A thick wavy band across x0..x1, centred on y, with amplitude and thickness. */
const waveBand = (x0, x1, y, amp, thick, waves, n = 48) => {
  const top = Array.from({ length: n + 1 }, (_, k) => {
    const x = x0 + ((x1 - x0) * k) / n;
    return [x, y + amp * Math.sin(((x - x0) / (x1 - x0)) * Math.PI * 2 * waves)];
  });
  const bottom = top.map(([x, yy]) => [x, yy + thick]).reverse();
  return polygon([...top, ...bottom]);
};
const join = (...ds) => ds.join(" ");
/** Points of an n-point star (outer radius rOut, inner rIn), pointing up. */
const starPoints = (cx, cy, rOut, rIn, n) =>
  Array.from({ length: n * 2 }, (_, k) => {
    const r = k % 2 ? rIn : rOut;
    const a = -Math.PI / 2 + (k / (n * 2)) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

/** A plain T-shirt silhouette, top centre at (cx, top), scaled by s (about 44 x 40 units at s = 1). */
const tShirt = (cx, top, s) =>
  polygon(
    [[-5, 0], [-14, 3], [-22, 12], [-17, 18], [-12, 14], [-12, 40], [12, 40], [12, 14], [17, 18], [22, 12], [14, 3], [5, 0], [0, 6]].map(
      ([x, y]) => [cx + x * s, top + y * s]
    )
  );

export const SHAPES = {
  /* ------------------------------------------- the 5 original hero shapes */

  // Photography: camera lens. Outer barrel ring, glass with a six-blade aperture, a glint.
  lens: {
    rule: "evenodd",
    d: [circle(50, 50, 46), circle(50, 50, 39), circle(50, 50, 32), regular(50, 50, 13, 6, Math.PI / 6), circle(38, 38, 4)].join(" "),
  },

  // Coding Competition: angle brackets with a slash.
  brackets: {
    rule: "nonzero",
    d: [
      polygon([[32, 18], [8, 50], [32, 82], [41, 75], [22, 50], [41, 25]]),
      polygon([[68, 18], [92, 50], [68, 82], [59, 75], [78, 50], [59, 25]]),
      polygon([[56, 14], [65, 17], [44, 86], [35, 83]]),
    ].join(" "),
  },

  // E-Sports: generic game controller; d-pad and buttons cut out.
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

  // Business Quiz: question mark cut out of a speech bubble.
  questionBubble: {
    rule: "evenodd",
    d: [
      "M20 10 L80 10 Q92 10 92 22 L92 60 Q92 72 80 72 L42 72 L22 90 L26 72 L20 72 Q8 72 8 60 L8 22 Q8 10 20 10 Z",
      "M37 32 Q37 18 50 18 Q63 18 63 30 Q63 39 55 43 Q52 45 52 49 L52 53 L45 53 L45 48 Q45 40 52 36 Q56 34 56 30 Q56 25 50 25 Q44 25 44 32 Z",
      circle(48.5, 62, 4.5),
    ].join(" "),
  },

  // Scavenger Hunt: map pin with a round hole.
  mapPin: {
    rule: "evenodd",
    d: ["M50 94 C40 78 20 62 20 40 A30 30 0 1 1 80 40 C80 62 60 78 50 94 Z", circle(50, 39, 12)].join(" "),
  },

  /* ------------------------------------------------------ 10 new shapes */

  // Face Painting: a face outline (eyes, smile) with paint on both cheeks:
  // a star on one, a short brush swoosh on the other (kept clear of the mouth).
  faceBrush: {
    parts: [
      { d: join(ellipse(50, 50, 34, 42), ellipse(50, 50, 26.5, 34.5)), rule: "evenodd" },
      { d: join(circle(39, 36, 4.6), circle(61, 36, 4.6)), rule: "nonzero" },
      { d: arcBand(50, 52, 14, 19.5, 30, 150), rule: "nonzero" },
      { d: polygon(starPoints(67, 52, 9, 4, 5)), rule: "nonzero" },
      { d: "M25 54 C28 48 34 46 41 47 L41 52 C35 51 31 53 28 57 Z", rule: "nonzero" },
    ],
  },

  // Theme Dance: two beamed music notes riding a flowing wave.
  noteWave: {
    parts: [
      { d: join(tiltedEllipse(30, 60, 10.5, 7.5, -22), tiltedEllipse(68, 52, 10.5, 7.5, -22)), rule: "nonzero" },
      { d: join(rect(36.5, 16, 5, 44), rect(74.5, 8, 5, 44)), rule: "nonzero" },
      { d: polygon([[36.5, 16], [79.5, 8], [79.5, 19], [36.5, 27]]), rule: "nonzero" },
      { d: waveBand(4, 96, 82, 5, 7, 1.5), rule: "nonzero" },
    ],
  },

  // Fashion Show Group: three T-shirts side by side, the middle one larger (a group of outfits).
  // (Replaced three hangers: thin hooks vanished as dots and the row read as triangles.)
  threeShirts: {
    rule: "nonzero",
    d: join(tShirt(18, 36, 0.66), tShirt(50, 29, 0.75), tShirt(82, 36, 0.66)),
  },

  // Fashion Show Single: one dress on a hanger.
  dressOnHanger: {
    parts: [
      { d: arcBand(50, 12, 3.5, 7.5, 180, 360), rule: "nonzero" },
      { d: rect(48, 12, 4, 8), rule: "nonzero" },
      { d: polygon([[50, 19], [78, 32], [74, 36], [50, 25], [26, 36], [22, 32]]), rule: "nonzero" },
      { d: "M37 32 L63 32 L60 48 L62 53 L84 92 L16 92 L38 53 L40 48 Z", rule: "nonzero" },
    ],
  },

  // Reel Making: a film reel (disc with six round windows and a hub).
  filmReel: {
    rule: "evenodd",
    d: join(
      circle(50, 50, 45),
      ...Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
        return circle(f(50 + 26 * Math.cos(a)), f(50 + 26 * Math.sin(a)), 10);
      }),
      circle(50, 50, 6)
    ),
  },

  // RJ Hunt: a microphone on a stand with sound waves on both sides.
  micWaves: {
    parts: [
      { d: "M40 22 A10 10 0 0 1 60 22 L60 46 A10 10 0 0 1 40 46 Z", rule: "nonzero" },
      { d: arcBand(50, 44, 15, 20, 0, 180), rule: "nonzero" },
      { d: join(rect(47.5, 63, 5, 15), rect(35, 78, 30, 5)), rule: "nonzero" },
      {
        d: join(
          arcBand(50, 34, 26, 31, -38, 38),
          arcBand(50, 34, 37, 42, -32, 32),
          arcBand(50, 34, 26, 31, 142, 218),
          arcBand(50, 34, 37, 42, 148, 212)
        ),
        rule: "nonzero",
      },
    ],
  },

  // Logo Design: a pen-tool nib drawing a curve that carries three anchor points.
  penCurve: {
    parts: [
      { d: join("M50 6 L67 32 L59 58 L50 66 L41 58 L33 32 Z", rect(48, 30, 4, 22), circle(50, 30, 4.5)), rule: "evenodd" },
      { d: "M6 86 C24 66 40 62 50 72 C60 82 76 78 94 62 L96 70 C78 88 60 92 48 80 C38 70 26 74 10 92 Z", rule: "nonzero" },
      { d: join(rect(2, 81, 11, 11), rect(44.5, 70, 11, 11), rect(87, 59, 11, 11)), rule: "nonzero" },
    ],
  },

  // Mini Militia: a generic crosshair (ring, four ticks, centre dot).
  crosshair: {
    parts: [
      { d: join(circle(50, 50, 38), circle(50, 50, 30)), rule: "evenodd" },
      { d: join(rect(46.5, 4, 7, 30), rect(46.5, 66, 7, 30), rect(4, 46.5, 30, 7), rect(66, 46.5, 30, 7)), rule: "nonzero" },
      { d: circle(50, 50, 5), rule: "nonzero" },
    ],
  },

  // Best Manager: a trophy cup with handles on a two-step base.
  trophy: {
    parts: [
      { d: "M27 12 L73 12 L71 38 Q69 58 50 60 Q31 58 29 38 Z", rule: "nonzero" },
      { d: join(arcBand(27, 28, 8, 14, 90, 270), arcBand(73, 28, 8, 14, -90, 90)), rule: "nonzero" },
      { d: join(rect(45, 60, 10, 14), rect(33, 74, 34, 7), rect(27, 82, 46, 9)), rule: "nonzero" },
    ],
  },

  // Corporate Walk: a briefcase with a handle, a seam and a clasp.
  briefcase: {
    parts: [
      { d: arcBand(50, 30, 9, 15, 180, 360), rule: "nonzero" },
      {
        d: join(
          "M14 28 L86 28 Q94 28 94 36 L94 80 Q94 88 86 88 L14 88 Q6 88 6 80 L6 36 Q6 28 14 28 Z",
          rect(6, 50, 88, 6)
        ),
        rule: "evenodd",
      },
      { d: rect(42, 45, 16, 16), rule: "nonzero" },
    ],
  },
};

/** The shape of every program, by program id from data/programs.js. No defaults. */
export const PROGRAM_SHAPES = {
  photography: "lens",
  "face-painting": "faceBrush",
  "theme-dance": "noteWave",
  "fashion-show-group": "threeShirts",
  "fashion-show-single": "dressOnHanger",
  "reel-making": "filmReel",
  "logo-design": "penCurve",
  "coding-competition": "brackets",
  "e-sports": "controller",
  "mini-militia": "crosshair",
  "best-manager": "trophy",
  "business-quiz": "questionBubble",
  "corporate-walk": "briefcase",
  "rj-hunt": "micWaves",
  "scavenger-hunt": "mapPin",
};

/** The shape key for a program. Every program has its own (checked at build time). */
export const shapeFor = (program) => PROGRAM_SHAPES[program.id];
