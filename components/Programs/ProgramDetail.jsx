"use client";

/**
 * PROGRAM DETAIL: tapping a card expands it to full screen (GSAP Flip.fit:
 * the panel starts exactly on the card and grows to the screen). Then the
 * shared canvas is lifted above the page and the program's shape forms from
 * dots in the art area, arriving with its squad's signature (one shape at a
 * time: components/World/ProgramField.jsx via lib/detail.js). The name reveals
 * line by line (state-based), the details show TBA, Register says "Opens soon".
 *
 *  - Previous / next buttons, arrow keys and a horizontal swipe move through
 *    the programs of the current filter (the shape morphs straight across).
 *  - Close: the X, Escape, or the browser Back button. The panel shrinks back
 *    onto its card; the grid is exactly where it was; focus returns to the card.
 *  - While open: Lenis paused, page scroll locked, the page behind is inert,
 *    Tab stays inside.
 *  - Hash routing: #programs/photography opens it (also on reload), #programs
 *    scrolls to the section; Back closes.
 *  - No canvas (low tier, reduced motion, WebGL failure): the static halftone
 *    shape, and fades instead of the expand.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { programs } from "@/data/programs";
import { detailCopy as COPY } from "@/data/story";
import { ease, duration, stagger, detail as DET, prefersReducedMotion } from "@/lib/motion";
import { getLenis, startTrip } from "@/lib/scrollStore";
import { DETAIL_EVENT, showDetailShape, hideDetailShape } from "@/lib/detail";
import { toProgress, HERO_END } from "@/lib/journey";
import Emblem from "@/components/Story/Emblem";
import ShapeArt from "./ShapeArt";

if (typeof window !== "undefined") gsap.registerPlugin(Flip, SplitText);

const ALL = programs.map((p) => p.id);
const noSubscribe = () => () => {};
const pad = (n) => String(n).padStart(2, "0");
const liveCanvas = () => document.documentElement.dataset.world === "live" && !prefersReducedMotion();
const canvasEl = () => document.querySelector('[data-world="canvas"]');
const cardFor = (id) => document.querySelector(`.card[data-id="${id}"]`);
const hashId = () => {
  const m = window.location.hash.match(/^#programs\/([\w-]+)$/);
  return m && ALL.includes(m[1]) ? m[1] : null;
};

/** True when the programs section fills the screen (so the grid stays exactly where it is). */
function sectionOnScreen() {
  const r = document.getElementById("programs")?.getBoundingClientRect();
  return !!r && r.top <= 1 && r.bottom >= window.innerHeight - 1;
}

/** Scroll (instantly) so the programs section fills the screen: hash links and reloads. */
function jumpToPrograms() {
  const section = document.getElementById("programs");
  if (!section) return;
  const y = section.getBoundingClientRect().top + window.scrollY;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  startTrip(toProgress(HERO_END + 100), 0.01, (t) => t); // the scene is there on the next frame
}

export default function ProgramDetail() {
  const [view, setView] = useState({ id: null, list: ALL, switching: false });
  // <body> once on the client (null while server-rendering): the portal target below.
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  const host = onClient ? document.body : null;
  const panel = useRef(null);
  const returnTo = useRef(null);
  const pushed = useRef(false); // we added a history entry (so Close goes Back)
  const isOpen = useRef(false);
  const busy = useRef(false);
  const swipe = useRef(null);
  const split = useRef(null);

  const program = programs.find((p) => p.id === view.id);
  const index = view.id ? view.list.indexOf(view.id) : -1;

  /* ---------------------------------------------------------- lock page */
  const lock = useCallback((on) => {
    const main = document.querySelector("main");
    const menuButton = document.querySelector(".menu-button");
    if (main) main.inert = on;
    if (menuButton) menuButton.inert = on;
    document.documentElement.style.overflow = on ? "hidden" : "";
    const lenis = getLenis();
    if (lenis) on ? lenis.stop() : lenis.start();
  }, []);

  /* ------------------------------------------------------------ open */
  const openNow = useCallback((id, list, from) => {
    returnTo.current = from ?? cardFor(id);
    setView({ id, list: list?.length ? list : ALL, switching: false });
  }, []);

  // Runs after the panel shows the new program: the expand (first open) or the switch.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!view.id || !el) return;
    const art = el.querySelector(".detail-art");
    const squad = programs.find((p) => p.id === view.id).squad;

    // Name: lines rise out of a mask (re-split for each program).
    split.current?.revert();
    split.current = SplitText.create(el.querySelector(".detail-name"), { type: "lines", mask: "lines" });
    const nameIn = () =>
      gsap.fromTo(split.current.lines, { yPercent: 110 }, { yPercent: 0, duration: duration.slow, ease: ease.expo, stagger: stagger.base });

    if (isOpen.current) {
      // Next / previous: the shape morphs across, the text swaps.
      nameIn();
      gsap.fromTo(el.querySelectorAll(".detail-fade"), { opacity: 0 }, { opacity: 1, duration: duration.base, ease: ease.out, stagger: stagger.tight });
      if (liveCanvas()) showDetailShape({ programId: view.id, squad, rect: art.getBoundingClientRect(), switching: true });
      return;
    }

    // First open: lock the page, grow the panel from its card, then lift the canvas and form the shape.
    isOpen.current = true;
    busy.current = true;
    lock(true);
    el.hidden = false;
    const reduced = prefersReducedMotion();
    const card = returnTo.current;
    const inner = el.querySelector(".detail-inner");
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        el.querySelector(".detail-close")?.focus({ preventScroll: true });
      },
    });
    gsap.set(inner, { opacity: 0 });
    if (!reduced && card && card.getBoundingClientRect().width) {
      Flip.fit(el, card, { scale: true }); // start exactly on the card
      tl.to(el, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: DET.expand, ease: ease.inOut });
    } else {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: duration.base, ease: ease.out });
    }
    tl.call(() => {
      if (!liveCanvas()) return;
      const c = canvasEl();
      if (c) c.style.zIndex = "66"; // the canvas above the page, under the detail text
      el.classList.add("is-see-through");
      showDetailShape({ programId: view.id, squad, rect: art.getBoundingClientRect(), switching: false });
    });
    tl.to(inner, { opacity: 1, duration: duration.base, ease: ease.out });
    tl.call(nameIn, [], "<");
  }, [view, lock]);

  /* ----------------------------------------------------------- close */
  const closeNow = useCallback(() => {
    const el = panel.current;
    if (!isOpen.current || !el) return;
    isOpen.current = false;
    busy.current = true;
    hideDetailShape();
    const card = returnTo.current;
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline({
      onComplete: () => {
        el.hidden = true;
        gsap.set(el, { clearProps: "transform,opacity" });
        lock(false);
        busy.current = false;
        split.current?.revert();
        split.current = null;
        setView((v) => ({ ...v, id: null }));
        card?.focus({ preventScroll: true });
      },
    });
    tl.to(el.querySelector(".detail-inner"), { opacity: 0, duration: duration.fast, ease: ease.out });
    tl.call(() => {
      el.classList.remove("is-see-through"); // opaque again before the canvas drops back
      const c = canvasEl();
      if (c) c.style.zIndex = "";
    });
    if (!reduced && card && card.getBoundingClientRect().width) {
      tl.add(Flip.fit(el, card, { scale: true, duration: DET.collapse, ease: ease.inOut }));
    } else {
      tl.to(el, { opacity: 0, duration: duration.base, ease: ease.out });
    }
  }, [lock]);

  /** Close from the UI: go Back if we added the history entry (popstate closes it), else close here. */
  const requestClose = useCallback(() => {
    if (busy.current) return;
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(null, "", "#programs");
      closeNow();
    }
  }, [closeNow]);

  /* ------------------------------------------------------ next / previous */
  const step = useCallback(
    (dir) => {
      if (busy.current || !view.id || view.list.length < 2) return;
      const list = view.list;
      const next = list[(list.indexOf(view.id) + dir + list.length) % list.length];
      returnTo.current = cardFor(next);
      history.replaceState(null, "", `#programs/${next}`);
      setView({ id: next, list, switching: true });
    },
    [view]
  );

  /* ------------------------------------------------ events and routing */
  useEffect(() => {
    // A card asks to open.
    const onOpen = (e) => {
      const { programId, list, returnTo: from } = e.detail;
      if (isOpen.current || busy.current) return;
      history.pushState(null, "", `#programs/${programId}`);
      pushed.current = true;
      openNow(programId, list, from);
    };
    // Browser Back / Forward, or a #programs link followed while on the page.
    const onPop = () => {
      const id = hashId();
      if (id && !isOpen.current) {
        pushed.current = false;
        if (!sectionOnScreen()) jumpToPrograms(); // came from elsewhere in the story
        openNow(id, ALL, cardFor(id));
      } else if (!id && isOpen.current) {
        pushed.current = false;
        closeNow();
      } else if (window.location.hash === "#programs" && !sectionOnScreen()) {
        jumpToPrograms();
      }
    };
    window.addEventListener(DETAIL_EVENT, onOpen);
    window.addEventListener("popstate", onPop);

    // Reload / shared link: #programs or #programs/<id>.
    let cancelled = false;
    if (window.location.hash.startsWith("#programs")) {
      const go = () => {
        if (cancelled) return;
        jumpToPrograms();
        const id = hashId();
        if (id) setTimeout(() => !cancelled && openNow(id, ALL, cardFor(id)), 450);
      };
      // After the page has laid out and the scroll engine is running.
      setTimeout(go, 600);
    }
    return () => {
      cancelled = true;
      window.removeEventListener(DETAIL_EVENT, onOpen);
      window.removeEventListener("popstate", onPop);
    };
  }, [openNow, closeNow]);

  // Keyboard: Escape closes, arrows move, Tab stays inside.
  useEffect(() => {
    if (!view.id) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        const f = [...panel.current.querySelectorAll("button:not([disabled])")];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!panel.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view.id, requestClose, step]);

  // Swipe: a mostly horizontal drag of DET.swipe px moves to the next / previous program.
  const onPointerDown = (e) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > DET.swipe && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };

  const n = program ? programs.indexOf(program) + 1 : 0;
  // Rendered straight into <body> (a portal): the page wrapper is its own layer
  // (z-index 10), and the detail must sit above the lifted canvas (66).
  if (!host) return null;
  return createPortal(
    <div
      ref={panel}
      className="detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-name"
      hidden
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={program ? { "--squad": `var(--squad-${program.squad})` } : undefined}
    >
      {program && (
        <div className="detail-inner">
          <div className="detail-top">
            <p className="detail-label">
              {COPY.label} {pad(n)} / {pad(programs.length)}
            </p>
            <button type="button" className="detail-close" aria-label={COPY.close} onClick={requestClose}>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
          {/* The shape forms from dots here (canvas); the static halftone shape without a canvas. */}
          <div className="detail-art" aria-hidden="true">
            <ShapeArt programId={program.id} className="detail-static-art" />
          </div>
          <div className="detail-info">
            <h2 id="detail-name" className="detail-name" key={program.id}>
              {program.name}
            </h2>
            <p className="detail-squad detail-fade">
              <span className="badge">
                <Emblem squad={program.squad} />
              </span>
              {program.squad} squad
            </p>
            <dl className="detail-facts detail-fade">
              {COPY.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{program[f.key]}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="detail-register detail-fade" disabled aria-disabled="true">
              {COPY.register} <span>{COPY.registerSoon}</span>
            </button>
          </div>
          {view.list.length > 1 && (
            <div className="detail-nav">
              <button type="button" className="detail-step" aria-label={COPY.prev} onClick={() => step(-1)}>
                <span aria-hidden="true">←</span>
              </button>
              <p className="detail-count" aria-live="polite">
                {index + 1} / {view.list.length}
              </p>
              <button type="button" className="detail-step" aria-label={COPY.next} onClick={() => step(1)}>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
          <p className="detail-hint">{COPY.swipeHint}</p>
        </div>
      )}
    </div>,
    host
  );
}
