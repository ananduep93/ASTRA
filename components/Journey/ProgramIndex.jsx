"use client";

/**
 * Keyboard and screen-reader way to every program: a visually hidden list of
 * real buttons, one per program, grouped by squad. It sits in a fixed spot,
 * so tabbing to it never jumps the page by itself.
 *
 * - Focusing a button scrolls the story to that program and shows the
 *   button as a small visible chip (so sighted keyboard users see where focus is).
 * - Enter / Space opens the program's detail panel.
 * Hidden in static mode, where every program is already a visible card.
 */
import { SQUADS } from "@/data/programs";
import { ROSTERS, scrollTargetFor } from "@/lib/journey";
import { getLenis } from "@/lib/scrollStore";
import { openProgram } from "@/lib/programDialog";

function bringIntoFocus(i, j) {
  const target = scrollTargetFor(i, j); // shared progress 0..1
  const y = target * (document.documentElement.scrollHeight - window.innerHeight);
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 1.1 });
  else window.scrollTo(0, y);
}

export default function ProgramIndex() {
  return (
    <nav className="program-index" aria-label="All programs">
      {ROSTERS.map((roster, i) => (
        <ul key={SQUADS[i]} aria-label={`${SQUADS[i]} programs`}>
          {roster.map((p, j) => (
            <li key={p.id}>
              <button
                type="button"
                className="program-index__item"
                aria-haspopup="dialog"
                onFocus={() => bringIntoFocus(i, j)}
                onClick={(e) => openProgram(p.id, e.currentTarget)}
              >
                {p.name}
                <span className="sr-only">, {SQUADS[i]} squad</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </nav>
  );
}
