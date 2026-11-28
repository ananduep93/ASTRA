"use client";

/**
 * A program's shape as a halftone print: the same shape the dots form
 * (data/shapes.js), full, equal dots on a rotated grid (lib/halftone.js), about
 * 10% of them in the squad colour when `accent` is set.
 *
 * For speed it is ONE pre-rendered image (drawn once per program to an offscreen
 * canvas in idle time, then reused), never hundreds of SVG circles. Until the
 * image is ready (and on the server / without JavaScript) a faint silhouette
 * shows instead. Used on the rail cards, the flying print and the detail's
 * static shape (low tier, reduced motion).
 *   ink   "white" | "black"   colour of the dots
 *   size  px of the square image (the SVG viewBox), enough for its largest use
 */
import { useEffect, useState } from "react";
import { programs } from "@/data/programs";
import { SHAPES, shapeFor } from "@/data/shapes";
import { HALFTONE, printUrl } from "@/lib/halftone";
import { colors, squadAccent } from "@/lib/theme";

export default function ShapeArt({ programId, className = "", accent = false, ink = "white", size = 512 }) {
  const program = programs.find((p) => p.id === programId);
  const [print, setPrint] = useState(null); // { key, url } once the image is ready
  const key = `${programId}|${ink}|${accent}|${size}`;

  useEffect(() => {
    if (!program) return undefined;
    let live = true;
    printUrl(program, { ink: colors[ink] ?? ink, accent: accent ? squadAccent(program.squad) : null, size }).then(
      (url) => live && setPrint({ key, url })
    );
    return () => {
      live = false;
    };
  }, [program, ink, accent, size, key]);

  const shape = program && SHAPES[shapeFor(program)];
  if (!shape) return null;
  if (print?.key === key) {
    // eslint-disable-next-line @next/next/no-img-element -- a generated blob image, not a static asset
    return <img className={`shape-art ${className}`} src={print.url} alt="" aria-hidden="true" draggable={false} decoding="async" />;
  }
  return (
    <svg className={`shape-art ${className}`} viewBox={HALFTONE.viewBox.join(" ")} aria-hidden="true" focusable="false">
      {(shape.parts ?? [shape]).map((part, k) => (
        <path key={k} d={part.d} fill="currentColor" fillOpacity="0.18" fillRule={part.rule === "evenodd" ? "evenodd" : "nonzero"} />
      ))}
    </svg>
  );
}
