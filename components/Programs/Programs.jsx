"use client";

/**
 * PROGRAMS: right after the star-iris, a normal page section (it scrolls like
 * any page). Every reveal follows the REAL scroll position, never the paced
 * scene, so the section is complete and clickable the moment it is on screen.
 *  - a kinetic header (SplitText lines, state-based reveal: never half-clipped)
 *    and one short line about the fest under it
 *  - squad filter chips (All + five squads), stuck below the HUD while the
 *    section is on screen
 *  - a grid of poster cards for all 15 programs (1 / 2 / 3 columns), the first
 *    card of each filter wide. Each card is a real button: static halftone
 *    shape, number "03 / 15", name, squad badge. It opens the program detail.
 *  - cards wipe in (clip-path + transform) with a stagger as they come on
 *    screen; a filter change moves the cards with GSAP Flip and re-staggers
 *    the ones that enter.
 * It also measures itself for the scroll map (lib/journey.js setLayout), so the
 * fixed hero / finale layers line up with real scrolling.
 * The grid is a list of buttons: the accessible list of every program.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { programs, SQUADS } from "@/data/programs";
import { programsCopy as COPY } from "@/data/story";
import { ease, duration, stagger, programs as PGM, prefersReducedMotion } from "@/lib/motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLayout, transitionDone } from "@/lib/journey";
import { stateReveal } from "@/lib/reveal";
import { openDetail } from "@/lib/detail";
import Emblem from "@/components/Story/Emblem";
import ShapeArt, { ShapeDefs } from "./ShapeArt";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

const FILTERS = ["All", ...SQUADS];
const pad = (n) => String(n).padStart(2, "0");
const isStatic = () => document.documentElement.dataset.world === "static";

export default function Programs() {
  const root = useRef(null);
  const [filter, setFilter] = useState("All");
  const flip = useRef(null); // Flip state captured just before a filter change
  const reveals = useRef(new Map()); // program id -> state reveal of its card
  const fresh = useRef(new Set()); // ids that just became visible: re-stagger them

  const shown = filter === "All" ? programs : programs.filter((p) => p.squad === filter);
  const shownIds = shown.map((p) => p.id);

  /*
   * The section's boundaries for the scroll map (lib/journey.js), from a
   * ScrollTrigger bound to this element: it starts when the top reaches the
   * bottom of the screen (the star-iris ends there) and ends when the bottom
   * reaches the bottom of the screen (the finale starts there). Refreshed on
   * resize and whenever the section changes height.
   */
  useEffect(() => {
    const el = root.current;
    const publish = (st) =>
      setLayout({ a: st.start, b: st.end, limit: Math.max(1, ScrollTrigger.maxScroll(window)), vh: window.innerHeight });
    const st = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom bottom", onRefresh: publish });
    publish(st);
    let lastH = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      if (el.offsetHeight === lastH) return;
      lastH = el.offsetHeight;
      ScrollTrigger.refresh();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      st.kill();
    };
  }, []);

  /* Header + card reveals, driven by the shared scene progress. */
  useGSAP(
    () => {
      const el = root.current;
      const reduced = prefersReducedMotion();
      let headTl = null;
      const headR = stateReveal(() => headTl);
      const split = SplitText.create(el.querySelector(".programs-title"), {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          const tl = gsap.timeline({ paused: true });
          tl.from(el.querySelector(".programs-label"), { opacity: 0, yPercent: 40, duration: duration.base, ease: ease.out });
          tl.from(self.lines, { yPercent: 110, duration: duration.slow, ease: ease.expo, stagger: stagger.loose }, 0.1);
          tl.from(el.querySelector(".programs-sub"), { opacity: 0, yPercent: 40, duration: duration.base, ease: ease.out }, 0.3);
          tl.from(el.querySelectorAll(".chip"), { opacity: 0, yPercent: 30, duration: duration.base, ease: ease.out, stagger: stagger.tight }, 0.35);
          tl.progress(headR.target);
          headTl = tl;
          return tl;
        },
      });

      // One reveal timeline per card: a wipe up through a clip-path, the card rising a little.
      const cards = [...el.querySelectorAll(".card")];
      cards.forEach((card) => {
        const tl = gsap.timeline({ paused: true });
        if (reduced) tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: duration.base, ease: ease.out });
        else
          tl.fromTo(
            card,
            { clipPath: "inset(100% 0% 0% 0%)", yPercent: 8 },
            { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0, duration: duration.slow, ease: ease.expo, clearProps: "clipPath" }
          );
        reveals.current.set(card.dataset.id, { r: stateReveal(() => tl), card });
      });

      const tick = () => {
        if (isStatic()) {
          el.dataset.ready = "true";
          headR.snap(true);
          reveals.current.forEach(({ r }) => r.snap(true));
          return;
        }
        const vh = window.innerHeight;
        // Nothing of the section shows before the star-iris has finished (the scene may
        // still be catching up after a fast flick); then real screen positions decide.
        const ready = transitionDone();
        if (el.dataset.ready !== String(ready)) el.dataset.ready = String(ready);
        headR.set(ready && el.querySelector(".programs-head").getBoundingClientRect().top < vh * PGM.headAt);

        // Cards: shown once their top is on screen (by the scene's position), a short stagger per column.
        const cols = Math.max(1, getComputedStyle(el.querySelector(".cards")).gridTemplateColumns.split(" ").length);
        let k = 0;
        reveals.current.forEach((entry, id) => {
          const { r, card } = entry;
          if (card.parentElement.hidden) return;
          const col = k % cols;
          const row = Math.floor(k / cols);
          k++;
          if (fresh.current.has(id)) {
            fresh.current.delete(id);
            r.snap(false); // entering after a filter change: start hidden, then stagger in
            entry.wait = null;
            entry.afterFilter = true;
          }
          const on = ready && card.getBoundingClientRect().top < vh * PGM.revealAt;
          if (!on) {
            entry.wait?.kill();
            entry.wait = null;
            r.set(false);
            return;
          }
          if (r.target === 1 || entry.wait) return; // shown, or its turn in the stagger is coming
          // Its turn: one step per column (and per row after a filter change).
          const delay = col * PGM.cardStagger + (entry.afterFilter ? row * PGM.filterStagger : 0);
          entry.afterFilter = false;
          entry.wait = gsap.delayedCall(delay, () => {
            entry.wait = null;
            r.set(true);
          });
        });
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        split.revert();
      };
    },
    { scope: root }
  );

  /* Filter change: Flip the cards that stay, re-stagger the ones that enter. */
  const choose = (next) => {
    if (next === filter) return;
    flip.current = Flip.getState(root.current.querySelectorAll(".card-cell"));
    const before = new Set(shownIds);
    const after = next === "All" ? programs : programs.filter((p) => p.squad === next);
    fresh.current = new Set(after.map((p) => p.id).filter((id) => !before.has(id)));
    setFilter(next);
  };

  useLayoutEffect(() => {
    if (!flip.current) return;
    const state = flip.current;
    flip.current = null;
    if (prefersReducedMotion()) return;
    Flip.from(state, {
      duration: duration.base,
      ease: ease.inOut,
      absolute: true,
      targets: root.current.querySelectorAll(".card-cell:not([hidden])"),
    });
  }, [filter]);

  return (
    <section id="programs" ref={root} className="programs" aria-labelledby="programs-title">
      <div className="programs-cover" aria-hidden="true" />
      <ShapeDefs />
      <header className="programs-head">
        <p className="programs-label">
          <span className="programs-dot" aria-hidden="true" />
          {COPY.label}
        </p>
        <h2 id="programs-title" className="programs-title">
          {COPY.headline(programs.length).map((line) => (
            <span key={line} className="programs-line">
              {line}
            </span>
          ))}
        </h2>
        <p className="programs-sub">{COPY.subline}</p>
      </header>

      <div className="chips" role="group" aria-label={COPY.filterLabel}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="chip"
            aria-pressed={filter === f}
            style={f === "All" ? undefined : { "--squad": `var(--squad-${f})` }}
            onClick={() => choose(f)}
          >
            {f !== "All" && <span className="chip-mark" aria-hidden="true" />}
            {f === "All" ? COPY.all : f}
          </button>
        ))}
      </div>

      <ul className="cards">
        {programs.map((p, k) => {
          const visible = shownIds.includes(p.id);
          return (
            <li
              key={p.id}
              className="card-cell"
              hidden={!visible}
              data-flip-id={p.id}
              data-featured={visible && shownIds[0] === p.id ? "" : undefined}
            >
              <button
                type="button"
                className="card"
                data-id={p.id}
                aria-haspopup="dialog"
                aria-label={`${p.name}, ${p.squad} squad, mission ${k + 1} of ${programs.length}. ${COPY.open}`}
                style={{ "--squad": `var(--squad-${p.squad})` }}
                onClick={(e) => openDetail(p.id, shownIds, e.currentTarget)}
              >
                <span className="card-num">
                  {pad(k + 1)} / {pad(programs.length)}
                </span>
                <ShapeArt programId={p.id} className="card-art" />
                <span className="card-name">{p.name}</span>
                <span className="card-squad">
                  <span className="badge">
                    <Emblem squad={p.squad} />
                  </span>
                  {p.squad} squad
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
