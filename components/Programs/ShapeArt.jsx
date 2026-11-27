"use client";

/**
 * A program's shape as a static halftone print: the same shape the dots form
 * (data/shapes.js), drawn as full, equal dots on a rotated grid (lib/halftone.js).
 * A dot prints when its centre is inside the shape, so outlines never get
 * half-cut "bites", and the detail's particles start exactly on these dots.
 * The ink is `currentColor` (set it with CSS `color`).
 *
 * Server render / first paint: the plain silhouette (also the no-JavaScript
 * fallback); right after hydration it becomes the dot print (the dot test needs
 * a browser canvas). Used on the rail cards, the flying print and the detail's
 * static shape (low tier, reduced motion).
 */
import { useSyncExternalStore } from "react";
import { programs } from "@/data/programs";
import { SHAPES, shapeFor } from "@/data/shapes";
import { HALFTONE, dotsPath } from "@/lib/halftone";

const noSubscribe = () => () => {};

export default function ShapeArt({ programId, className = "" }) {
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  const program = programs.find((p) => p.id === programId);
  const shape = program && SHAPES[shapeFor(program)];
  if (!shape) return null;
  return (
    <svg className={`shape-art ${className}`} viewBox={HALFTONE.viewBox.join(" ")} aria-hidden="true" focusable="false">
      {onClient ? (
        <path d={dotsPath(program)} fill="currentColor" />
      ) : (
        (shape.parts ?? [shape]).map((part, k) => (
          <path key={k} d={part.d} fill="currentColor" fillRule={part.rule === "evenodd" ? "evenodd" : "nonzero"} />
        ))
      )}
    </svg>
  );
}
