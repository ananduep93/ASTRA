/**
 * A squad emblem from data/emblems.js as a small inline SVG. Server-safe (no
 * client code). Decorative: the squad name is always next to it as text.
 * Fill comes from CSS (.emblem), the red accent by default.
 */
import { EMBLEMS } from "@/data/emblems";

export default function Emblem({ squad, className = "" }) {
  const emblem = EMBLEMS[squad];
  if (!emblem) return null;
  return (
    <svg className={`emblem ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {(emblem.parts ?? [emblem]).map((part, k) => (
        <path key={k} d={part.d} fillRule={part.rule === "evenodd" ? "evenodd" : "nonzero"} />
      ))}
    </svg>
  );
}
