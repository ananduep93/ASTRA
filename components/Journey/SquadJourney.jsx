"use client";

/**
 * The five squad stops (Arts, Tech, Gaming, Business, Fun).
 *
 * Live (canvas): each stop is a fixed overlay (not pinned). The squad's
 * dossier (emblem, status line, codename, mission, briefing) rises in on
 * arrival; then ONE program is in focus at a time as you scroll:
 * its dots form its shape (ProgramField, behind), its name rises line by line
 * (SplitText lines inside a mask), with an overall counter, a short squad rail
 * and a Details button. Every reveal is a paused GSAP timeline; the shared
 * scroll value decides whether it is shown or hidden and the timeline plays
 * that out (lib/reveal.js), so no text ever rests half-clipped. Scrolling
 * back plays it in reverse.
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
import {
  ROSTERS,
  PROGRAM_TOTAL,
  programNumber,
  toVh,
  headTextAt,
  programTextAt,
  focusAt,
  arrivalNameAt,
} from "@/lib/journey";
import { openProgram } from "@/lib/programDialog";
import { stateReveal, isJump } from "@/lib/reveal";
import { dossiers, squadStatus, briefing, missionFileLabel } from "@/data/story";
import Emblem from "@/components/Story/Emblem";

const isStatic = () => document.documentElement.dataset.world === "static";
const pad = (n) => String(n).padStart(2, "0");

function SquadStop({ squad, index }) {
  const roster = ROSTERS[index];
  const tone = journey.tones[index] > 0.5 ? "light" : "dark"; // light = white / off-white world, dark text
  const headingId = `squad-${squad.toLowerCase()}`;
  return (
    <section className="squad-stop" data-stop={index} data-tone={tone} aria-labelledby={headingId}>
      {/* Arrival: the dots form the emblem in this box (sampled), the name rises huge under it.
          Decorative: the dossier heading below carries the same words for screen readers. */}
      <div className="squad-arrival" aria-hidden="true">
        <div className="squad-arrival-emblem" />
        <p className="squad-arrival-name" style={{ "--len": squad.length }}>
          {squad}
        </p>
      </div>
      <header className="squad-head">
        <p className="squad-status">
          <Emblem squad={squad} className="squad-emblem" />
          <span>{squadStatus(squad)}</span>
        </p>
        {/* The codename is the big title; screen readers hear the squad first. */}
        <h2 id={headingId} className="squad-title">
          <span className="sr-only">{squad} squad, codename </span>
          <span className="squad-name">{dossiers[squad].codename}</span>
        </h2>
        <p className="squad-brief">
          <span className="squad-mission">{dossiers[squad].mission}</span> <span className="squad-briefing">{briefing}</span>
        </p>
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
                <span className="program-file">{missionFileLabel}</span> {pad(n)} / {pad(PROGRAM_TOTAL)}
              </p>
              <h3 id={`program-${p.id}`} className="program-name">
                {p.name}
              </h3>
              <p className="program-squad">
                <Emblem squad={squad} className="program-badge" />
                <span>{squad} squad</span>
              </p>
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
      const arrivals = []; // arrivals[i] = latest huge-name timeline (replaced on re-split)
      const programTls = []; // programTls[i][j] = latest timeline (replaced on re-split)
      // State-based reveals (lib/reveal.js): scroll decides shown / hidden, the timeline plays it out.
      const headR = stops.map((_, i) => stateReveal(() => heads[i]));
      const arrR = stops.map((_, i) => stateReveal(() => arrivals[i]));
      const progR = stops.map((_, i) => ROSTERS[i].map((__, j) => stateReveal(() => programTls[i]?.[j])));

      stops.forEach((stop, i) => {
        // Dossier: status line first, then the codename's characters rise out of a mask, then the mission.
        const head = gsap.timeline({ paused: true, defaults: { ease: ease.out } });
        // aria "none": the heading already has its own screen-reader text (sr-only squad name).
        const name = SplitText.create(stop.querySelector(".squad-name"), { type: "chars", mask: "chars", aria: "none" });
        splits.push(name);
        head.from(stop.querySelector(".squad-status"), { opacity: 0, xPercent: -6, duration: duration.base });
        head.from(name.chars, { yPercent: 110, duration: duration.base, stagger: stagger.tight }, duration.fast * 0.5);
        head.from(stop.querySelector(".squad-brief"), { opacity: 0, yPercent: 30, duration: duration.base }, duration.fast * 1.5);
        heads.push(head);

        // Huge arrival name: lines rise out of a mask (re-split on resize, like program names).
        splits.push(
          SplitText.create(stop.querySelector(".squad-arrival-name"), {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            aria: "none",
            onSplit(self) {
              const tl = gsap.timeline({ paused: true });
              tl.from(self.lines, { yPercent: 105, duration: duration.slow, ease: ease.expo, stagger: stagger.base });
              tl.progress(arrR[i].target); // a rebuilt timeline starts in the current state
              arrivals[i] = tl;
              return tl;
            },
          })
        );

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
              tl.progress(progR[i][j].target);
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

      let prevS = 0;
      const tick = () => {
        const live = !isStatic();
        const s = toVh(scrollState.smooth);
        const jumped = isJump(prevS, s);
        prevS = s;
        const focus = live ? focusAt(s) : null;
        // Live: ask for the state, the timeline plays it out (or snaps after a jump). Static: final state.
        const sync = (r, on, key) => {
          if (live) r.set(on, jumped);
          else if (changed(key, on)) r.snap(on);
        };

        stops.forEach((stop, i) => {
          // Shown once past the middle of its reveal range, hidden past the middle of its exit range.
          sync(headR[i], live ? headTextAt(s, i) > 0.5 : true, `h${i}`);
          sync(arrR[i], live ? arrivalNameAt(s, i) > 0.5 : false, `a${i}`);
          let any = headR[i].visible() || arrR[i].visible();

          stop.querySelectorAll(".program-focus").forEach((card, j) => {
            const r = progR[i][j];
            sync(r, live ? programTextAt(s, i, j) > 0.5 : true, `p${i}.${j}`);
            const vis = r.visible();
            if (vis) any = true;
            if (changed(`pv${i}.${j}`, vis)) card.style.visibility = vis ? "visible" : "hidden"; // hidden = not tabbable
            const ready = live ? r.settled() : true;
            if (changed(`pe${i}.${j}`, ready)) card.style.pointerEvents = ready ? "auto" : "none";
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
          const tapReady = live && jFocus >= 0 && progR[i][jFocus].settled();
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
