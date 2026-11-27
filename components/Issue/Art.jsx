/**
 * Placeholder comic drawings: bold ink line art with halftone shading and a
 * red spot, all original and generic. Server-safe SVG (no client code).
 *
 * Lines use vector-effect="non-scaling-stroke", so every outline stays the
 * same thick ink weight whatever the panel size. Halftone fills reference
 * the patterns in <HalftoneDefs/> (rendered once on the page).
 * Each program gets its own drawing (keyed by program id); a generic star
 * stands in for programs without one yet.
 */
const INK = "var(--ink)";
const PAPER = "var(--paper)";
const RED = "var(--red)";
const line = { fill: "none", stroke: INK, strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" };
const shape = (fill) => ({ ...line, fill });

/** Halftone patterns, defined once (ids are referenced by every drawing). */
export function HalftoneDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <pattern id="ht-ink" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="3.5" cy="3.5" r="1.7" fill={INK} />
        </pattern>
        <pattern id="ht-ink-fine" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="2.5" cy="2.5" r="0.9" fill={INK} />
        </pattern>
        <pattern id="ht-red" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="3.5" cy="3.5" r="2" fill={RED} />
        </pattern>
      </defs>
    </svg>
  );
}

/** Jagged burst polygon around (cx, cy). */
const burst = (cx, cy, r1, r2, n = 14, rot = 0) =>
  Array.from({ length: n * 2 }, (_, k) => {
    const a = rot + (k * Math.PI) / n;
    const r = k % 2 ? r2 : r1;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const DRAWINGS = {
  /* ------------------------------------------------------- opening page */
  radar: (
    <>
      <rect x="0" y="0" width="200" height="150" fill="url(#ht-ink-fine)" opacity="0.5" />
      <path d="M40 120 L60 92 L80 120" {...line} />
      <path d="M28 96 A44 44 0 0 1 96 50 Z" {...shape(PAPER)} />
      <path d="M62 73 L104 40" {...line} />
      <circle cx="106" cy="38" r="5" {...shape(RED)} />
      <path d="M124 34 A26 26 0 0 1 130 64" {...line} />
      <path d="M138 24 A42 42 0 0 1 146 74" {...line} />
      <path d="M152 14 A58 58 0 0 1 162 84" {...line} />
      <path d="M10 128 H190" {...line} />
    </>
  ),
  screen: (
    <>
      <rect x="34" y="22" width="132" height="90" rx="6" {...shape(PAPER)} />
      <rect x="46" y="34" width="108" height="66" fill="url(#ht-ink)" />
      <rect x="46" y="34" width="108" height="66" {...line} />
      <polygon points={burst(100, 67, 22, 10, 5, -Math.PI / 2)} {...shape(RED)} />
      <path d="M100 112 V128 M72 130 H128" {...line} />
      <path d="M150 22 L168 6 M50 22 L36 8" {...line} />
    </>
  ),
  burst: (
    <>
      <polygon points={burst(100, 75, 70, 40, 16)} fill="url(#ht-red)" />
      <polygon points={burst(100, 75, 70, 40, 16)} {...line} />
      <polygon points={burst(100, 75, 42, 26, 12, 0.3)} {...shape(PAPER)} />
    </>
  ),

  /* ------------------------------------------------------------- programs */
  photography: (
    <>
      <rect x="36" y="44" width="128" height="80" rx="8" fill="url(#ht-ink)" />
      <rect x="36" y="44" width="128" height="80" rx="8" {...line} />
      <path d="M66 44 L76 28 H112 L122 44" {...shape(PAPER)} />
      <circle cx="100" cy="84" r="30" {...shape(PAPER)} />
      <circle cx="100" cy="84" r="17" {...shape(INK)} />
      <circle cx="94" cy="78" r="4" fill={PAPER} />
      <circle cx="146" cy="58" r="6" {...shape(RED)} />
    </>
  ),
  "face-painting": (
    <>
      <circle cx="92" cy="76" r="52" {...shape(PAPER)} />
      <path d="M56 98 Q70 116 92 118 Q114 116 128 98 Z" fill="url(#ht-ink-fine)" />
      <circle cx="74" cy="66" r="6" fill={INK} />
      <circle cx="110" cy="66" r="6" fill={INK} />
      <path d="M74 96 Q92 110 110 96" {...line} />
      <path d="M116 80 l14 -6 M118 90 l14 -6" stroke={RED} strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx="92" cy="76" r="52" {...line} />
      <path d="M150 24 L178 128" {...line} />
      <path d="M146 14 L158 12 L156 30 Z" {...shape(RED)} />
    </>
  ),
  "theme-dance": (
    <>
      <circle cx="104" cy="30" r="13" {...shape(PAPER)} />
      <path d="M102 44 L96 86 M100 56 L64 40 M100 58 L144 70 M96 86 L70 124 M96 86 L128 112 L146 128" {...line} />
      <path d="M40 120 Q70 60 110 92 T180 60" stroke={RED} strokeWidth="6" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M30 40 l12 6 M26 58 l14 2 M158 40 l12 -6" {...line} />
      <ellipse cx="100" cy="132" rx="60" ry="8" fill="url(#ht-ink)" />
    </>
  ),
  "fashion-show-group": (
    <>
      {[50, 100, 150].map((x, k) => (
        <g key={x}>
          <circle cx={x} cy="38" r="11" {...shape(PAPER)} />
          <path d={`M${x} 50 L${x - 22} 118 H${x + 22} Z`} {...shape(k === 1 ? "url(#ht-ink)" : PAPER)} />
          <path d={`M${x - 8} 118 V134 M${x + 8} 118 V134`} {...line} />
        </g>
      ))}
      <circle cx="100" cy="38" r="11" {...shape(RED)} />
    </>
  ),
  "fashion-show-single": (
    <>
      <path d="M70 140 L88 60 H112 L130 140 Z" fill="url(#ht-ink-fine)" />
      <path d="M70 140 L88 60 H112 L130 140" {...line} />
      <path d="M100 0 L60 140 H140 Z" fill={RED} opacity="0.18" />
      <circle cx="100" cy="40" r="11" {...shape(PAPER)} />
      <path d="M100 52 L80 112 H120 Z" {...shape(PAPER)} />
      <path d="M92 112 V128 M108 112 V128" {...line} />
      <path d="M30 140 H170" {...line} />
    </>
  ),
  "reel-making": (
    <>
      <rect x="70" y="14" width="60" height="122" rx="10" {...shape(PAPER)} />
      <rect x="78" y="28" width="44" height="92" fill="url(#ht-ink)" />
      <polygon points="92,58 92,90 116,74" {...shape(RED)} />
      <path d="M20 44 H62 M20 104 H62 M138 44 H180 M138 104 H180" {...line} />
      {[28, 44, 60].map((x) => (
        <rect key={x} x={x - 4} y="52" width="8" height="10" {...line} />
      ))}
      {[146, 162, 178].map((x) => (
        <rect key={x} x={x - 4} y="86" width="8" height="10" {...line} />
      ))}
    </>
  ),
  generic: (
    <>
      <polygon points={burst(100, 75, 58, 26, 5, -Math.PI / 2)} fill="url(#ht-ink)" />
      <polygon points={burst(100, 75, 58, 26, 5, -Math.PI / 2)} {...line} />
    </>
  ),
};

/** A drawing by name or program id; generic star if there is none yet. */
export default function Art({ name, className = "" }) {
  return (
    <svg className={`art ${className}`} viewBox="0 0 200 150" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {DRAWINGS[name] ?? DRAWINGS.generic}
    </svg>
  );
}
