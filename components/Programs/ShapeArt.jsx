/**
 * A program's shape as a static halftone SVG: the same paths the dots form
 * (data/shapes.js), filled with a dot pattern instead of particles. Server-safe.
 * Used on every program card, and in the detail view when there is no canvas
 * (low tier, reduced motion). The pattern lives once in <ShapeDefs/>.
 */
import { programs } from "@/data/programs";
import { SHAPES, shapeFor } from "@/data/shapes";
import { colors } from "@/lib/theme";

/**
 * The halftone dot pattern, defined once on the page, in two inks: "ink"
 * (black, for the white paper cards) and "light" (white, on black: the detail).
 * Both use the same grid (lib/halftone.js reads these numbers too).
 */
export const HALFTONE = { cell: 3.4, radius: 1.05, angle: 30, viewBox: [-4, -4, 108, 108] };
export function ShapeDefs() {
  return (
    <svg className="shape-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {[
          ["ht-shape", colors.black],
          ["ht-shape-light", colors.white],
        ].map(([id, fill]) => (
          <pattern
            key={id}
            id={id}
            width={HALFTONE.cell}
            height={HALFTONE.cell}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${HALFTONE.angle})`}
          >
            <circle cx={HALFTONE.cell / 2} cy={HALFTONE.cell / 2} r={HALFTONE.radius} fill={fill} />
          </pattern>
        ))}
      </defs>
    </svg>
  );
}

export default function ShapeArt({ programId, className = "", light = false }) {
  const program = programs.find((p) => p.id === programId);
  const shape = program && SHAPES[shapeFor(program)];
  if (!shape) return null;
  return (
    <svg className={`shape-art ${className}`} viewBox={HALFTONE.viewBox.join(" ")} aria-hidden="true" focusable="false">
      {(shape.parts ?? [shape]).map((part, k) => (
        <path
          key={k}
          d={part.d}
          fill={light ? "url(#ht-shape-light)" : "url(#ht-shape)"}
          fillRule={part.rule === "evenodd" ? "evenodd" : "nonzero"}
        />
      ))}
    </svg>
  );
}
