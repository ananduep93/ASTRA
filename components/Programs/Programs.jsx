"use client";

/**
 * PROGRAMS: right after the star-iris flash, a normal black page section (it
 * scrolls like any page; the canvas holds black behind it, see lib/journey.js).
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
 * Cards are "poster pages" (3:4, no frame): a giant outlined number behind a
 * large white halftone print (about 10% of its dots in the squad colour), the
 * name in large white type at the bottom, a static squad-colour gradient and a
 * thin line at the bottom edge. The centre card lifts and its number brightens;
 * the others sit smaller and dimmer.
 * Shapes drift with the rail; cards tilt slightly with the swipe speed.
 *
 * Every reveal is state-based (never resting half-clipped) and waits for the
 * star-iris flash to fade half way (programsRevealed), then follows real screen positions.
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
import { setLayout, transitionDone, programsRevealed } from "@/lib/journey";
import { stateReveal } from "@/lib/reveal";
import { openDetail, detailUi } from "@/lib/detail";
import { numberOf, TOTAL } from "@/lib/programOrder";
import Emblem from "@/components/Story/Emblem";
import ShapeArt from "./ShapeArt";

const pad = (n) => String(n).padStart(2, "0");
const isStatic = () => document.documentElement.dataset.world === "static";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const ROWS = SQUADS.map((squad) => ({ squad, items: programsBySquad(squad) }));
/** A squad's colour (lib/theme.js) as a local CSS variable. */
const squadVars = (squad) => ({ "--squad": `var(--squad-${squad})` });

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
 * One rail's live behaviour, driven from ONE gsap.ticker loop (only while the
 * rail is on screen and no detail is open): the card nearest the centre lifts and
 * is full size, the others sit smaller; its number and print brighten through
 * `--on` (opacity only); the shape drifts with the rail (parallax); every card
 * tilts slightly with the swipe speed and settles back. Transforms only, no layout reads per frame (card centres are
 * measured on resize). Also: dots, arrow states, mouse drag (touch stays
 * native), left / right keys, arrows. Returns a cleanup function.
 */
function wireRail(row) {
  const rail = row.querySelector(".rail");
  const cells = [...rail.children];
  const cards = cells.map((c) => c.querySelector(".card"));
  const frames = cells.map((c) => c.querySelector(".card-frame"));
  const dots = [...row.querySelectorAll(".rail-dot")];
  const [prevBtn, nextBtn] = row.querySelectorAll(".rail-arrow");
  const calm = prefersReducedMotion() || isStatic(); // no float, no tilt, no parallax
  const F = PGM.focus;
  let centres = [];
  let step = 1;
  let half = 1;
  let maxLeft = 0;
  const measure = () => {
    centres = cells.map((c) => c.offsetLeft + c.offsetWidth / 2);
    step = cells.length > 1 ? centres[1] - centres[0] : rail.clientWidth;
    half = rail.clientWidth / 2;
    maxLeft = rail.scrollWidth - rail.clientWidth - 2;
  };
  measure();

  const last = cells.map(() => ({ tf: "", on: "", px: "" })); // last written styles per card
  let active = -1;
  let lastLeft = rail.scrollLeft;
  let vel = 0; // px per second, smoothed
  let tilt = 0;
  let visible = false;
  let lastT = 0;

  let moving = false;
  const frame = (time) => {
    if (!visible || detailUi.open) return; // off screen, or a detail covers the page

    const dt = Math.min(0.1, lastT ? time - lastT : 1 / 60);
    lastT = time;
    const left = rail.scrollLeft;
    const v = (left - lastLeft) / Math.max(dt, 1e-3);
    lastLeft = left;
    vel += (v - vel) * (1 - Math.exp(-12 * dt));
    const targetTilt = calm ? 0 : clamp(-vel * F.tiltPerPxPerSecond, -F.tiltMax, F.tiltMax);
    tilt += (targetTilt - tilt) * (1 - Math.exp(-F.tiltSettle * dt));
    // Compositor layers (will-change, in CSS) only while the rail is actually moving.
    const nowMoving = Math.abs(vel) > 20 || Math.abs(tilt) > 0.02 || !!drag;
    if (nowMoving !== moving) {
      moving = nowMoving;
      if (moving) rail.dataset.moving = "";
      else delete rail.dataset.moving;
    }
    const mid = left + half;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < cells.length; i++) {
      const d = (centres[i] - mid) / Math.max(1, step); // cards from the centre (signed)
      const ad = Math.abs(d);
      if (ad < bestD) {
        bestD = ad;
        best = i;
      }
      const on = 1 - Math.min(1, ad); // 1 = the centre card
      const scale = F.sideScale + (1 - F.sideScale) * on;
      const y = F.lift * on;
      // Write only what changed (a still rail costs no style work; only the centre card floats).
      const tf = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      if (tf !== last[i].tf) cards[i].style.transform = last[i].tf = tf;
      const o = on.toFixed(2);
      if (o !== last[i].on) cards[i].style.setProperty("--on", (last[i].on = o));
      if (!calm) {
        const px = `translate3d(${(clamp(-d, -1.5, 1.5) * PGM.parallax).toFixed(1)}%, 0, 0)`;
        if (px !== last[i].px) frames[i].style.transform = last[i].px = px;
      }
    }
    if (best !== active) {
      active = best;
      dots.forEach((dot, k) => (k === best ? dot.setAttribute("data-on", "") : dot.removeAttribute("data-on")));
    }
    if (prevBtn && prevBtn.disabled !== left <= 2) prevBtn.disabled = left <= 2;
    if (nextBtn && nextBtn.disabled !== left >= maxLeft) nextBtn.disabled = left >= maxLeft;
  };

  // Only while the row is on screen.
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    lastT = 0;
  });
  io.observe(row);
  const tick = (time) => frame(time);
  gsap.ticker.add(tick);

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
  const ro = new ResizeObserver(measure);
  ro.observe(rail);

  rail.addEventListener("pointerdown", onDown);
  rail.addEventListener("pointermove", onMove);
  rail.addEventListener("pointerup", onUp);
  rail.addEventListener("pointercancel", onUp);
  rail.addEventListener("click", onClick, true);
  rail.addEventListener("keydown", onKey);
  rail.addEventListener("focusin", onFocus);
  prevBtn?.addEventListener("click", onPrev);
  nextBtn?.addEventListener("click", onNext);
  visible = true;
  frame(performance.now() / 1000); // first state before the first tick
  visible = false;
  return () => {
    gsap.ticker.remove(tick);
    io.disconnect();
    ro.disconnect();
    rail.removeEventListener("pointerdown", onDown);
    rail.removeEventListener("pointermove", onMove);
    rail.removeEventListener("pointerup", onUp);
    rail.removeEventListener("pointercancel", onUp);
    rail.removeEventListener("click", onClick, true);
    rail.removeEventListener("keydown", onKey);
    rail.removeEventListener("focusin", onFocus);
    prevBtn?.removeEventListener("click", onPrev);
    nextBtn?.removeEventListener("click", onNext);
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
            { clipPath: "inset(100% -20% -10% -20%)", yPercent: 8 },
            { clipPath: "inset(-30% -20% -10% -20%)", yPercent: 0, duration: duration.slow, ease: ease.expo, stagger: PGM.cardStagger },
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
        // The section is see-through until the flash has faded to black (the fade shows
        // behind it), and nothing in it reveals before the fade is half way (white type
        // on a dark enough background); then real screen positions decide.
        const black = transitionDone();
        if (el.dataset.ready !== String(black)) el.dataset.ready = String(black);
        const ready = programsRevealed();
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
            style={squadVars(squad)}
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
                    style={squadVars(p.squad)}
                    onClick={(e) => openDetail(p.id, ids, e.currentTarget)}
                  >
                    {/* A poster page: a giant outlined number behind the print, the print (one image),
                        the name, and a static squad-colour gradient + thin line at the bottom edge. */}
                    <span className="card-foot" aria-hidden="true" />
                    <span className="card-big" aria-hidden="true">
                      {pad(numberOf(p.id))}
                    </span>
                    <span className="card-frame" aria-hidden="true">
                      <ShapeArt programId={p.id} className="card-art" accent />
                    </span>
                    <span className="card-name" aria-hidden="true">
                      {p.name}
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
