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

/** The pattern, in the shapes' grid units, and the SVG viewBox around the grid. */
export const HALFTONE = { cell: 3.4, radius: 1.05, angle: 30, viewBox: [-4, -4, 108, 108] };

const cache = new Map(); // shape key -> Float32Array of dot centres [x, y, ...] in grid units

/** Centres of the printed dots of `program`'s shape, in grid units (cached). */
export function halftoneDots(program) {
  const key = shapeFor(program);
  if (cache.has(key)) return cache.get(key);
  const shape = SHAPES[key];
  const ctx = document.createElement("canvas").getContext("2d");
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
      if (parts.some(([path, rule]) => ctx.isPointInPath(path, x, y, rule))) out.push(x, y);
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
