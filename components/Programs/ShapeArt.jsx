/**
 * A program's shape as a static halftone SVG: the same paths the dots form
 * (data/shapes.js), filled with a dot pattern instead of particles. Server-safe.
 * Used on every program card, and in the detail view when there is no canvas
 * (low tier, reduced motion). The pattern lives once in <ShapeDefs/>.
 */
import { programs } from "@/data/programs";
import { SHAPES, shapeFor } from "@/data/shapes";

/** The halftone dot pattern, defined once on the page (its dots take the text colour of its <svg>). */
export function ShapeDefs() {
  return (
    <svg className="shape-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="ht-shape" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="1.7" cy="1.7" r="1.05" fill="currentColor" />
        </pattern>
      </defs>
    </svg>
  );
}

export default function ShapeArt({ programId, className = "" }) {
  const program = programs.find((p) => p.id === programId);
  const shape = program && SHAPES[shapeFor(program)];
  if (!shape) return null;
  return (
    <svg className={`shape-art ${className}`} viewBox="-4 -4 108 108" aria-hidden="true" focusable="false">
      {(shape.parts ?? [shape]).map((part, k) => (
        <path key={k} d={part.d} fill="url(#ht-shape)" fillRule={part.rule === "evenodd" ? "evenodd" : "nonzero"} />
      ))}
    </svg>
  );
}
