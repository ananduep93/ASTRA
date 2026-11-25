"use client";

/**
 * The five squad stops (Arts, Tech, Gaming, Business, Fun).
 *
 * Live (canvas): each stop is a fixed overlay (not pinned). The squad name
 * rises in on arrival; then ONE program is in focus at a time as you scroll:
 * its dots form its shape (ProgramField, behind), its name rises line by line
 * (SplitText lines inside a mask), with an overall counter, a short squad rail
 * and a Details button. Every reveal is a paused GSAP timeline whose progress
 * is set from the shared scroll value, so scrolling back plays it in reverse.
 * Transform and opacity only.
 *
 * Static (low tier, reduced motion, no WebGL): stacked cards per program.
 * Programs come only from data/programs.js.
 */
import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { SQUADS } from "@/data/programs";
import { journey, ease, stagger, duration } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { ROSTERS, PROGRAM_TOTAL, programNumber, toVh, headTextAt, programTextAt, focusAt } from "@/lib/journey";
import { openProgram } from "@/lib/programDialog";

const isStatic = () => document.documentElement.dataset.world === "static";
const pad = (n) => String(n).padStart(2, "0");

function SquadStop({ squad, index }) {
  const roster = ROSTERS[index];
  const tone = journey.tones[index] === 1 ? "light" : "dark"; // light = white world, dark text
  const headingId = `squad-${squad.toLowerCase()}`;
  return (
    <section className="squad-stop" data-stop={index} data-tone={tone} aria-labelledby={headingId}>
      <header className="squad-head">
        <h2 id={headingId} className="squad-name">
          {squad}
        </h2>
        <p className="squad-brief">Briefing TBA</p>
      </header>

      {/* Where the dots draw the focused program's shape. Tapping it opens Details
          (the Details button below is the keyboard / screen-reader way in). */}
      <button
        type="button"
        className="program-shape"
        tabIndex={-1}
        aria-hidden="true"
        onClick={(e) => {
          const { programId, programIndex } = e.currentTarget.dataset;
          if (!programId) return;
          // On close, focus returns to that program's Details button (this area is hidden from assistive tech).
          const details = e.currentTarget.parentElement.querySelector(
            `.program-focus[data-program="${programIndex}"] .program-details`
          );
          openProgram(programId, details);
        }}
      />

      <div className="program-copy">
        {roster.map((p, j) => {
          const n = programNumber(index, j) + 1;
          return (
            <article key={p.id} className="program-focus" data-program={j} aria-labelledby={`program-${p.id}`}>
              <p className="program-count" aria-label={`Program ${n} of ${PROGRAM_TOTAL}`}>
                {pad(n)} / {pad(PROGRAM_TOTAL)}
              </p>
              <h3 id={`program-${p.id}`} className="program-name">
                {p.name}
              </h3>
              <p className="program-squad">{squad} squad</p>
              <button
                type="button"
                className="program-details"
                aria-haspopup="dialog"
                aria-label={`Details: ${p.name}`}
                onClick={(e) => openProgram(p.id, e.currentTarget)}
              >
                Details
              </button>
            </article>
          );
        })}
        {/* Neighbouring programs: only faint points, never text. */}
        <ol className="program-rail" aria-hidden="true">
          {roster.map((p) => (
            <li key={p.id} />
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function SquadJourney() {
  const root = useRef(null);

  useGSAP(
    () => {
      const stops = gsap.utils.toArray(".squad-stop", root.current);
      const splits = [];
      const heads = [];
      const programTls = []; // programTls[i][j] = latest timeline (replaced on re-split)

      stops.forEach((stop, i) => {
        // Squad name: characters rise out of a mask; briefing follows.
        const head = gsap.timeline({ paused: true, defaults: { ease: ease.out } });
        const name = SplitText.create(stop.querySelector(".squad-name"), { type: "chars", mask: "chars" });
        splits.push(name);
        head.from(name.chars, { yPercent: 110, duration: duration.base, stagger: stagger.tight });
        head.from(stop.querySelector(".squad-brief"), { opacity: 0, yPercent: 60, duration: duration.base }, duration.fast);
        heads.push(head);

        programTls[i] = [];
        stop.querySelectorAll(".program-focus").forEach((card, j) => {
          const extras = card.querySelectorAll(".program-count, .program-squad, .program-details");
          const split = SplitText.create(card.querySelector(".program-name"), {
            type: "lines",
            mask: "lines",
            autoSplit: true, // re-split on resize / font load; the timeline is rebuilt below
            onSplit(self) {
              const tl = gsap.timeline({ paused: true, defaults: { ease: ease.out } });
              tl.from(self.lines, { yPercent: 110, duration: duration.base, stagger: stagger.base });
              tl.from(extras, { opacity: 0, yPercent: 40, duration: duration.base, stagger: stagger.tight }, duration.fast);
              tl.progress(programTls[i][j]?.progress() ?? 0);
              programTls[i][j] = tl;
              return tl;
            },
          });
          splits.push(split);
        });
      });

      const last = new Map();
      const changed = (key, v) => {
        if (last.get(key) === v) return false;
        last.set(key, v);
        return true;
      };

      const tick = () => {
        const live = !isStatic();
        const s = toVh(scrollState.smooth);
        const focus = live ? focusAt(s) : null;

        stops.forEach((stop, i) => {
          const hv = live ? headTextAt(s, i) : 1;
          if (changed(`h${i}`, hv)) heads[i].progress(hv);
          let any = hv > 0.001;

          stop.querySelectorAll(".program-focus").forEach((card, j) => {
            const v = live ? programTextAt(s, i, j) : 1;
            if (v > 0.001) any = true;
            if (!changed(`p${i}.${j}`, v)) return;
            programTls[i][j]?.progress(v);
            card.style.visibility = v > 0.001 ? "visible" : "hidden"; // hidden = not tabbable
            card.style.pointerEvents = v > 0.9 ? "auto" : "none";
          });

          if (changed(`v${i}`, any)) stop.style.visibility = any ? "visible" : "hidden";

          // Shape area + rail follow the program in focus.
          const jFocus = focus && focus.i === i ? focus.j : -1;
          if (changed(`f${i}`, jFocus)) {
            const shape = stop.querySelector(".program-shape");
            shape.dataset.programId = jFocus >= 0 ? ROSTERS[i][jFocus].id : "";
            shape.dataset.programIndex = String(jFocus);
            stop.querySelectorAll(".program-rail li").forEach((dot, k) => dot.toggleAttribute("data-active", k === jFocus));
          }
          const tapReady = jFocus >= 0 && (live ? programTextAt(s, i, jFocus) : 0) > 0.9;
          if (changed(`t${i}`, tapReady)) stop.querySelector(".program-shape").style.pointerEvents = tapReady ? "auto" : "none";
        });
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className="squad-journey">
      {SQUADS.map((squad, i) => (
        <SquadStop key={squad} squad={squad} index={i} />
      ))}
    </div>
  );
}
