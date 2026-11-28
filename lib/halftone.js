/**
 * The halftone print of a program shape, as numbers.
 *
 * The cards draw each shape (data/shapes.js, a 100 x 100 grid) filled with a
 * dot pattern: a square grid of `cell` units, rotated by `angle`, dots of
 * `radius` (components/Programs/ShapeArt.jsx uses these same numbers). This
 * file finds the centres of the dots that print inside the shape, so the
 * detail's particles can start (and end) EXACTLY on the printed dots.
 * Browser-only (uses a canvas context for the point-in-path test).
 */
import { SHAPES, shapeFor } from "@/data/shapes";

/**
 * The pattern, in the shapes' grid units, and the SVG viewBox around the grid.
 * `bold`: every shape is thickened by an outline this wide before the dots are
 * chosen, so thin rings and lines print as solid bands (no gaps or bites). The
 * particle shapes use the same boldening (lib/textTargets.js sampleShape).
 */
export const HALFTONE = { cell: 2.8, radius: 0.9, angle: 30, bold: 3.2, viewBox: [-4, -4, 108, 108] };

const cache = new Map(); // shape key -> Float32Array of dot centres [x, y, ...] in grid units

/** Centres of the printed dots of `program`'s shape, in grid units (cached). */
export function halftoneDots(program) {
  const key = shapeFor(program);
  if (cache.has(key)) return cache.get(key);
  const shape = SHAPES[key];
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.lineWidth = HALFTONE.bold;
  ctx.lineJoin = "round";
  const parts = (shape.parts ?? [shape]).map((p) => [new Path2D(p.d), p.rule === "evenodd" ? "evenodd" : "nonzero"]);
  const { cell, angle, viewBox } = HALFTONE;
  const [x0, y0, w, h] = viewBox;
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const reach = Math.hypot(x0 + w, y0 + h) + cell; // pattern space that covers the whole box once rotated
  const out = [];
  for (let u = -reach; u <= reach; u += cell) {
    for (let v = -reach; v <= reach; v += cell) {
      // Dot centre in pattern space, rotated into the SVG's user space (patternTransform="rotate(angle)").
      const pu = u + cell / 2;
      const pv = v + cell / 2;
      const x = pu * cos - pv * sin;
      const y = pu * sin + pv * cos;
      if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) continue;
      if (parts.some(([path, rule]) => ctx.isPointInPath(path, x, y, rule) || ctx.isPointInStroke(path, x, y))) out.push(x, y);
    }
  }
  const dots = new Float32Array(out);
  cache.set(key, dots);
  return dots;
}

/**
 * Where those dots are on screen for an SVG drawn into `rect` (a DOMRect of the
 * <svg>, viewBox kept square, "meet"): { xy: Float32Array of screen px, r: dot radius px }.
 */
export function dotsOnScreen(program, rect) {
  const dots = halftoneDots(program);
  const [x0, y0, w] = HALFTONE.viewBox;
  const side = Math.min(rect.width, rect.height);
  const k = side / w;
  const left = rect.left + (rect.width - side) / 2;
  const top = rect.top + (rect.height - side) / 2;
  const xy = new Float32Array(dots.length);
  for (let i = 0; i < dots.length; i += 2) {
    xy[i] = left + (dots[i] - x0) * k;
    xy[i + 1] = top + (dots[i + 1] - y0) * k;
  }
  return { xy, r: HALFTONE.radius * k };
}

/** The square box (screen px) an SVG with a square viewBox really draws in, inside `rect`. */
export function contentSquare(rect) {
  const side = Math.min(rect.width, rect.height);
  return { left: rect.left + (rect.width - side) / 2, top: rect.top + (rect.height - side) / 2, width: side, height: side };
}

/** Every this-many printed dots one is in the squad colour (about 10%), always the same ones. */
export const ACCENT_EVERY = 10;

const printCache = new Map(); // "program|ink|accent|size" -> Promise<image URL>
const idle = (fn) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 300 }) : setTimeout(fn, 16));

/**
 * The print as a pre-rendered IMAGE (one <img> instead of hundreds of SVG circles):
 * drawn once to an offscreen canvas (`size` px square, the SVG viewBox), then reused.
 * `ink` colours the dots, `accent` (or ink) every ACCENT_EVERY-th dot. Prints are made
 * in idle time, one at a time, so they never block a frame. Resolves to a URL.
 */
export function printUrl(program, { ink, accent = null, size = 512 }) {
  const key = `${program.id}|${ink}|${accent}|${size}`;
  if (printCache.has(key)) return printCache.get(key);
  const job = new Promise((resolve) => {
    idle(() => {
      const dots = halftoneDots(program);
      const [x0, y0, w] = HALFTONE.viewBox;
      const k = size / w;
      const r = HALFTONE.radius * k;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const g = canvas.getContext("2d");
      for (const isAccent of [false, true]) {
        g.fillStyle = isAccent ? (accent ?? ink) : ink;
        g.beginPath();
        for (let i = 0, n = 0; i < dots.length; i += 2, n++) {
          if ((n % ACCENT_EVERY === ACCENT_EVERY - 1) !== isAccent) continue;
          const x = (dots[i] - x0) * k;
          const y = (dots[i + 1] - y0) * k;
          g.moveTo(x + r, y);
          g.arc(x, y, r, 0, Math.PI * 2);
        }
        g.fill();
      }
      canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL()), "image/webp", 0.92);
    });
  });
  printCache.set(key, job);
  return job;
}
