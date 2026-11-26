/**
 * The five squad emblems. Original marks built on the ASTRA star + comet idea
 * (no existing brand, team or hero marks). Each is drawn on a 100 x 100 grid,
 * bold and filled so it reads at 24px. The same format as data/shapes.js:
 *   { parts: [{ d, rule }, ...] }   several filled paths (their union)
 *
 * They are used twice: as small SVGs on the squad dossiers, and in the finale,
 * where the dots form all five before they merge into the logo.
 * scripts/check-shapes.mjs fails the build if a squad has no emblem or two match.
 */

const f = (n) => +n.toFixed(2);
const polygon = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")} Z`;
const rect = (x, y, w, h) => polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

/** Star with `n` points: outer radius R, inner radius r, first point straight up. */
const star = (cx, cy, R, r, n) =>
  polygon(
    Array.from({ length: n * 2 }, (_, k) => {
      const a = -Math.PI / 2 + (k * Math.PI) / n;
      const rr = k % 2 ? r : R;
      return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    })
  );

/** A straight bar of width w from (x1, y1) to (x2, y2). */
const bar = (x1, y1, x2, y2, w) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / len) * (w / 2);
  const ny = ((x2 - x1) / len) * (w / 2);
  return polygon([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]);
};

/** Pixel grid: `rows` of "#" / "." drawn as square cells of `size` from (x, y). */
const pixels = (x, y, size, rows) =>
  rows.flatMap((row, r) =>
    [...row].flatMap((ch, c) => (ch === "#" ? [{ d: rect(x + c * size, y + r * size, size, size) }] : []))
  );

export const EMBLEMS = {
  // Arts: a five-point star trailing one curved brush stroke.
  Arts: {
    parts: [
      { d: star(64, 36, 30, 13, 5) },
      { d: "M50 50 C34 56 16 72 6 95 C24 80 40 72 60 66 Z" },
    ],
  },
  // Tech: a four-point spark trailing two straight circuit traces with square nodes.
  Tech: {
    parts: [
      { d: star(66, 34, 31, 9, 4) },
      { d: bar(60, 48, 24, 84, 8) },
      { d: rect(14, 78, 14, 14) },
      { d: bar(46, 36, 22, 60, 7) },
      { d: rect(12, 54, 12, 12) },
    ],
  },
  // Gaming: a blocky pixel star trailing stepped pixels.
  Gaming: {
    parts: [
      ...pixels(35, 4, 7, [
        "....#....",
        "...###...",
        "#########",
        ".#######.",
        "..#####..",
        ".##...##.",
        "##.....##",
      ]),
      { d: rect(18, 58, 14, 14) },
      { d: rect(4, 78, 11, 11) },
    ],
  },
  // Business: a star rising over three climbing bars.
  Business: {
    parts: [
      { d: star(76, 24, 22, 9, 5) },
      { d: rect(8, 72, 17, 24) },
      { d: rect(31, 58, 17, 38) },
      { d: rect(54, 44, 17, 52) },
    ],
  },
  // Fun: an eight-point burst throwing confetti.
  Fun: {
    parts: [
      { d: star(60, 40, 36, 16, 8) },
      { d: circle(20, 80, 8) },
      { d: polygon([[8, 50], [14, 58], [8, 66], [2, 58]]) },
      { d: circle(38, 92, 6) },
    ],
  },
};

export default EMBLEMS;
