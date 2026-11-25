"use client";

/**
 * The five squad stops (Arts, Tech, Gaming, Business, Fun).
 *
 * Live (canvas): each stop is a fixed overlay, hidden until the camera has
 * arrived. Its text reveal is a GSAP timeline (SplitText words/chars rising
 * out of a mask) whose progress is set from the shared scroll value, so
 * scrolling back plays it in reverse. Transform and opacity only.
 * Static (low tier, reduced motion, no WebGL): plain stacked sections.
 *
 * Programs come only from data/programs.js. Each is a real button; its dot
 * ([data-star]) is where the 3D program star is placed.
 */
import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { programs, SQUADS } from "@/data/programs";
import { journey, ease, stagger, duration } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { toVh, stopTextAt } from "@/lib/journey";
import { openProgram } from "@/lib/programDialog";

const isStatic = () => document.documentElement.dataset.world === "static";

function SquadStop({ squad, index }) {
  const roster = programs.filter((p) => p.squad === squad);
  const tone = journey.tones[index] === 1 ? "light" : "dark"; // light = white world, dark text
  const headingId = `squad-${squad.toLowerCase()}`;
  return (
    <section className="squad-stop" data-stop={index} data-tone={tone} aria-labelledby={headingId}>
      <div className="squad-head">
        <h2 id={headingId} className="squad-name">
          {squad}
        </h2>
        <p className="squad-brief">Briefing TBA</p>
      </div>
      <ul className="roster" aria-label={`${squad} roster`}>
        {roster.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="roster-item"
              aria-haspopup="dialog"
              aria-label={`${p.name}: open details`}
              onClick={(e) => openProgram(p.id, e.currentTarget)}
            >
              <span className="roster-dot" data-star aria-hidden="true" />
              <span className="roster-name">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SquadJourney() {
  const root = useRef(null);

  useGSAP(
    () => {
      const stops = gsap.utils.toArray(".squad-stop", root.current);
      const splits = [];

      // One paused timeline per stop; scroll sets its progress.
      const timelines = stops.map((stop) => {
        const tl = gsap.timeline({ paused: true, defaults: { ease: ease.out } });
        const name = SplitText.create(stop.querySelector(".squad-name"), { type: "chars", mask: "chars" });
        splits.push(name);
        tl.from(name.chars, { yPercent: 110, duration: duration.base, stagger: stagger.tight });
        tl.from(stop.querySelector(".squad-brief"), { opacity: 0, yPercent: 60, duration: duration.base }, duration.fast);

        stop.querySelectorAll(".roster-item").forEach((item, j) => {
          const label = SplitText.create(item.querySelector(".roster-name"), {
            type: "words",
            mask: "words",
            aria: "hidden", // the button's aria-label carries the name
          });
          splits.push(label);
          const at = duration.fast + duration.fast * 0.5 + j * stagger.base;
          tl.from(item.querySelector(".roster-dot"), { scale: 0, duration: duration.fast }, at);
          tl.from(label.words, { yPercent: 110, duration: duration.base, stagger: stagger.tight }, at + 0.05);
        });
        return tl;
      });

      const last = new Array(stops.length).fill(-1);
      const tick = () => {
        const fixed = !isStatic();
        const s = toVh(scrollState.smooth);
        stops.forEach((stop, i) => {
          const v = fixed ? stopTextAt(s, i) : 1;
          if (v === last[i]) return;
          last[i] = v;
          timelines[i].progress(v);
          // Hidden stops can't be seen, tabbed to or clicked; half-revealed ones can't be clicked.
          stop.style.visibility = v > 0.001 ? "visible" : "hidden";
          stop.style.pointerEvents = v > 0.9 ? "auto" : "none";
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
