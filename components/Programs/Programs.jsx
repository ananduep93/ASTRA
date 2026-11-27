"use client";

/**
 * PROGRAMS: right after the star-iris, a normal page section (it scrolls like
 * any page; the canvas holds white behind it, see lib/journey.js).
 *  - a kinetic header (SplitText lines, state-based reveal) and one short line
 *  - five rows, one per squad (Arts, Tech, Gaming, Business, Fun): a row header
 *    (emblem, squad, "6 programs", arrow buttons) and a horizontal RAIL of
 *    poster cards with progress dots under it.
 *
 * Rails: native horizontal overflow with CSS scroll-snap (centre). Touch swipes
 * natively; the mouse can drag; arrow buttons and the left / right keys step
 * one card. Vertical scrolling is never taken over: a vertical wheel or swipe
 * over a rail still scrolls the page (touch-action: pan-x pan-y; Lenis skips
 * only horizontal gestures over a rail: data-lenis-prevent-horizontal).
 * The card nearest the centre is full size, the others smaller and dimmer, and
 * each shape drifts a little with the rail (transform + opacity, one rAF).
 *
 * Every reveal is state-based (never resting half-clipped) and waits for the
 * star-iris to finish (transitionDone), then follows real screen positions.
 * Each card is a real button: it opens the program detail (prev / next stay
 * within its squad). The section also publishes its scroll boundaries
 * (a ScrollTrigger on this element) for the scroll map.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { programs, SQUADS, programsBySquad } from "@/data/programs";
import { programsCopy as COPY } from "@/data/story";
import { ease, duration, stagger, programs as PGM, prefersReducedMotion } from "@/lib/motion";
import { setLayout, transitionDone } from "@/lib/journey";
import { stateReveal } from "@/lib/reveal";
import { openDetail } from "@/lib/detail";
import { numberOf, TOTAL } from "@/lib/programOrder";
import Emblem from "@/components/Story/Emblem";
import ShapeArt, { ShapeDefs } from "./ShapeArt";

const pad = (n) => String(n).padStart(2, "0");
const isStatic = () => document.documentElement.dataset.world === "static";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const ROWS = SQUADS.map((squad) => ({ squad, items: programsBySquad(squad) }));

/* ------------------------------------------------------------------ rails */

/** Index of the card whose centre is nearest the rail's centre. */
function centreIndex(rail) {
  const mid = rail.scrollLeft + rail.clientWidth / 2;
  let best = 0;
  let bestD = Infinity;
  [...rail.children].forEach((cell, i) => {
    const d = Math.abs(cell.offsetLeft + cell.offsetWidth / 2 - mid);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Scroll a rail so card `i` sits in the centre. */
function goTo(rail, i, smooth = true) {
  const cells = rail.children;
  const cell = cells[clamp(i, 0, cells.length - 1)];
  if (!cell) return;
  const left = cell.offsetLeft + cell.offsetWidth / 2 - rail.clientWidth / 2;
  rail.scrollTo({ left, behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
}

/**
 * One rail's live behaviour: centre scale + parallax, dots, arrow states,
 * mouse drag (touch stays native). Returns a cleanup function.
 */
function wireRail(row) {
  const rail = row.querySelector(".rail");
  const cells = [...rail.children];
  const cards = cells.map((c) => c.querySelector(".card"));
  const arts = cells.map((c) => c.querySelector(".card-art"));
  const dots = [...row.querySelectorAll(".rail-dot")];
  const [prevBtn, nextBtn] = row.querySelectorAll(".rail-arrow");
  const reduced = prefersReducedMotion() || isStatic();
  let frame = 0;
  let active = -1;

  const update = () => {
    frame = 0;
    const mid = rail.scrollLeft + rail.clientWidth / 2;
    const step = cells.length > 1 ? cells[1].offsetLeft - cells[0].offsetLeft : rail.clientWidth;
    cells.forEach((cell, i) => {
      const d = (cell.offsetLeft + cell.offsetWidth / 2 - mid) / Math.max(1, step); // cards from the centre
      const t = Math.min(1, Math.abs(d));
      if (!reduced) {
        cards[i].style.transform = `scale(${1 - PGM.sideScale * t})`;
        arts[i].style.transform = `translate3d(${clamp(-d, -1.5, 1.5) * PGM.parallax}%, 0, 0)`;
      }
      cards[i].style.opacity = String(1 - (1 - PGM.sideOpacity) * t);
    });
    const i = centreIndex(rail);
    if (i !== active) {
      active = i;
      dots.forEach((d, k) => (k === i ? d.setAttribute("data-on", "") : d.removeAttribute("data-on")));
    }
    const max = rail.scrollWidth - rail.clientWidth - 2;
    prevBtn.disabled = rail.scrollLeft <= 2;
    nextBtn.disabled = rail.scrollLeft >= max;
  };
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  // Mouse drag (touch and pen scroll natively). Snapping is paused while dragging,
  // then the nearest card settles in the centre. A drag never counts as a click.
  let drag = null;
  let dragged = false;
  const onDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: rail.scrollLeft, id: e.pointerId };
    dragged = false;
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) < 6) return;
    if (!dragged) {
      dragged = true;
      rail.setPointerCapture(drag.id);
      rail.dataset.dragging = "";
    }
    rail.scrollLeft = drag.left - dx;
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    if (!dragged) return;
    delete rail.dataset.dragging;
    goTo(rail, centreIndex(rail));
  };
  const onClick = (e) => {
    if (dragged) {
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    }
  };
  // Keyboard: left / right step to the neighbouring card (and focus it).
  const onKey = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const from = cards.indexOf(document.activeElement);
    const i = clamp((from >= 0 ? from : centreIndex(rail)) + (e.key === "ArrowRight" ? 1 : -1), 0, cards.length - 1);
    e.preventDefault();
    cards[i].focus({ preventScroll: true });
    goTo(rail, i);
  };
  // Tabbing onto a card brings it to the centre.
  const onFocus = (e) => {
    const i = cards.indexOf(e.target);
    if (i >= 0 && i !== centreIndex(rail)) goTo(rail, i);
  };
  const onPrev = () => goTo(rail, centreIndex(rail) - 1);
  const onNext = () => goTo(rail, centreIndex(rail) + 1);

  rail.addEventListener("scroll", queue, { passive: true });
  rail.addEventListener("pointerdown", onDown);
  rail.addEventListener("pointermove", onMove);
  rail.addEventListener("pointerup", onUp);
  rail.addEventListener("pointercancel", onUp);
  rail.addEventListener("click", onClick, true);
  rail.addEventListener("keydown", onKey);
  rail.addEventListener("focusin", onFocus);
  prevBtn.addEventListener("click", onPrev);
  nextBtn.addEventListener("click", onNext);
  window.addEventListener("resize", queue);
  update();
  return () => {
    cancelAnimationFrame(frame);
    rail.removeEventListener("scroll", queue);
    rail.removeEventListener("pointerdown", onDown);
    rail.removeEventListener("pointermove", onMove);
    rail.removeEventListener("pointerup", onUp);
    rail.removeEventListener("pointercancel", onUp);
    rail.removeEventListener("click", onClick, true);
    rail.removeEventListener("keydown", onKey);
    rail.removeEventListener("focusin", onFocus);
    prevBtn.removeEventListener("click", onPrev);
    nextBtn.removeEventListener("click", onNext);
    window.removeEventListener("resize", queue);
  };
}

/* ---------------------------------------------------------------- section */

export default function Programs() {
  const root = useRef(null);

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

  /* Rails: centre scale, parallax, dots, arrows, drag, keys. */
  useEffect(() => {
    const offs = [...root.current.querySelectorAll(".rail-row")].map(wireRail);
    return () => offs.forEach((off) => off());
  }, []);

  /* Header + row reveals: state-based, after the star-iris, from real screen positions. */
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
          if (reduced) tl.from(self.lines, { opacity: 0, duration: duration.base, ease: ease.out }, 0.1);
          else tl.from(self.lines, { yPercent: 110, duration: duration.slow, ease: ease.expo, stagger: stagger.loose }, 0.1);
          tl.from(el.querySelector(".programs-sub"), { opacity: 0, yPercent: 40, duration: duration.base, ease: ease.out }, 0.3);
          tl.progress(headR.target);
          headTl = tl;
          return tl;
        },
      });

      // One reveal per row: its header rises, the cards wipe up in turn, then the dots.
      const rows = [...el.querySelectorAll(".rail-row")].map((row) => {
        const tl = gsap.timeline({ paused: true });
        const head = row.querySelector(".rail-head");
        const cells = row.querySelectorAll(".rail-cell");
        const dots = row.querySelector(".rail-dots");
        if (reduced) {
          tl.from([head, ...cells, dots], { opacity: 0, duration: duration.base, ease: ease.out });
        } else {
          tl.from(head, { opacity: 0, yPercent: 30, duration: duration.base, ease: ease.out });
          tl.fromTo(
            cells,
            { clipPath: "inset(100% 0% 0% 0%)", yPercent: 8 },
            { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0, duration: duration.slow, ease: ease.expo, stagger: PGM.cardStagger },
            duration.fast
          );
          tl.from(dots, { opacity: 0, duration: duration.base, ease: ease.out }, "<0.2");
        }
        return { row, r: stateReveal(() => tl) };
      });

      const tick = () => {
        if (isStatic()) {
          el.dataset.ready = "true";
          headR.snap(true);
          rows.forEach(({ r }) => r.snap(true));
          return;
        }
        const vh = window.innerHeight;
        // Nothing of the section shows before the star-iris has finished (the scene may
        // still be catching up after a fast flick); then real screen positions decide.
        const ready = transitionDone();
        if (el.dataset.ready !== String(ready)) el.dataset.ready = String(ready);
        headR.set(ready && el.querySelector(".programs-head").getBoundingClientRect().top < vh * PGM.headAt);
        rows.forEach(({ row, r }) => r.set(ready && row.getBoundingClientRect().top < vh * PGM.revealAt));
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        split.revert();
      };
    },
    { scope: root }
  );

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

      {ROWS.map(({ squad, items }) => {
        const ids = items.map((p) => p.id);
        return (
          <section
            key={squad}
            className="rail-row"
            aria-labelledby={`rail-${squad}`}
            style={{ "--squad": `var(--squad-${squad})` }}
          >
            <header className="rail-head">
              <span className="badge rail-badge">
                <Emblem squad={squad} />
              </span>
              <h3 id={`rail-${squad}`} className="rail-title">
                {COPY.squadTitle(squad)}
              </h3>
              <p className="rail-count">{COPY.count(items.length)}</p>
              <div className="rail-arrows">
                <button type="button" className="rail-arrow" aria-label={COPY.prev(squad)}>
                  <span aria-hidden="true">←</span>
                </button>
                <button type="button" className="rail-arrow" aria-label={COPY.next(squad)}>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </header>

            <ul className="rail" aria-label={COPY.railLabel(squad)} data-lenis-prevent-horizontal="">
              {items.map((p) => (
                <li key={p.id} className="rail-cell">
                  <button
                    type="button"
                    className="card"
                    data-id={p.id}
                    aria-haspopup="dialog"
                    aria-label={`${p.name}, ${p.squad} squad, mission ${numberOf(p.id)} of ${TOTAL}. ${COPY.open}`}
                    style={{ "--squad": `var(--squad-${p.squad})` }}
                    onClick={(e) => openDetail(p.id, ids, e.currentTarget)}
                  >
                    <span className="card-num">
                      {pad(numberOf(p.id))} / {pad(TOTAL)}
                    </span>
                    <span className="card-frame">
                      <ShapeArt programId={p.id} className="card-art" />
                    </span>
                    <span className="card-name">{p.name}</span>
                    <span className="card-squad">
                      <span className="badge">
                        <Emblem squad={p.squad} />
                      </span>
                      {p.squad} squad
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="rail-dots" aria-hidden="true">
              {items.map((p) => (
                <span key={p.id} className="rail-dot" />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
