"use client";

/**
 * PROGRAM DETAIL: a small cinematic moment, time-based (GSAP timelines with the
 * shared eases and lib/motion.js `detail` timings), never left half-played,
 * interruptible at any point.
 *
 * OPEN (about 1.1s, lib/motion.js `detail`), one step after the other:
 *   0 - 0.3     a copy of the tapped card scales up to fill the screen (transforms
 *               only) while its contents fade and the screen goes black; the other
 *               cards fade out
 *   0.3 - 0.8   the shared canvas is lifted; the dots start on the card's printed
 *               dots (lib/halftone.js, cached per shape), burst a little, then
 *               converge into the shape with the squad's signature
 *   0.8 - 1.1   the name reveals line by line (mask), then the badge, the TBA
 *               rows, the disabled Register button
 * PREV / NEXT (arrows, swipe, keys): a short turbulence melting into the next
 *   shape while the old name slides out and the new one slides in. Rapid presses
 *   overwrite each other (the dots continue from where they are).
 * CLOSE (X, Escape, browser Back), about 0.35s: the dots fade and contract toward
 *   the card, then the card copy scales back down into its slot with its contents,
 *   the black fades and the list returns. The copy looks exactly like the card, so
 *   the card is never missing (no frame with only its print). Closing before the
 *   canvas has taken over plays the open back in reverse.
 *
 * While open: Lenis locked (no page scroll), the page behind aria-hidden, Tab
 * stays inside. Hash routing: #programs/photography opens it (also on reload),
 * #programs scrolls to the section; Back closes.
 * No canvas (low tier) or reduced motion: the static halftone shape; reduced
 * motion gets simple fades only.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { programs } from "@/data/programs";
import { detailCopy as COPY } from "@/data/story";
import { ease, duration, detail as DET, prefersReducedMotion } from "@/lib/motion";
import { getLenis, startTrip } from "@/lib/scrollStore";
import { DETAIL_EVENT, detailUi, detailState, showDetailShape, shrinkDetailShape, hideDetailShape } from "@/lib/detail";
import { dotsOnScreen } from "@/lib/halftone";
import { numberOf, squadIdsOf } from "@/lib/programOrder";
import { toProgress, programsScrollY, HERO_END } from "@/lib/journey";
import Emblem from "@/components/Story/Emblem";
import ShapeArt from "./ShapeArt";

if (typeof window !== "undefined") gsap.registerPlugin(SplitText);

const ALL = programs.map((p) => p.id);
const TOTAL = programs.length;
const noSubscribe = () => () => {};
const pad = (n) => String(n).padStart(2, "0");
const liveCanvas = () => document.documentElement.dataset.world === "live" && !prefersReducedMotion();
const canvasEl = () => document.querySelector('[data-world="canvas"]');
const cardFor = (id) => document.querySelector(`.card[data-id="${id}"]`);
const hashId = () => {
  const m = window.location.hash.match(/^#programs\/([\w-]+)$/);
  return m && ALL.includes(m[1]) ? m[1] : null;
};
const onScreen = (el) => {
  const r = el?.getBoundingClientRect();
  return !!r && r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
};
/** Bring a card to the centre of its rail at once (so it is where the detail grows from / returns to). */
function centreCard(card) {
  const rail = card?.closest(".rail");
  const cell = card?.closest(".rail-cell");
  if (rail && cell) rail.scrollLeft = cell.offsetLeft + cell.offsetWidth / 2 - rail.clientWidth / 2;
}
/** The other cards of `card`'s rail (they fade out while a card is open, and back in). */
function others(card) {
  const cell = card?.closest(".rail-cell");
  return cell ? [...cell.parentElement.children].filter((c) => c !== cell) : [];
}
/** Every card of `card`'s rail (after prev / next the card closed on may itself have been faded). */
function railCells(card) {
  const cell = card?.closest(".rail-cell");
  return cell ? [...cell.parentElement.children] : [];
}
/**
 * A copy of the card (same look, no interaction) placed exactly over it inside the
 * detail layer: the open scales it up to fill the screen, the close scales it back
 * down into the slot. Because it looks exactly like the card, the card is never
 * missing on screen while it moves.
 */
function cardCopy(card, host) {
  const r = card.getBoundingClientRect();
  const copy = card.cloneNode(true);
  copy.removeAttribute("data-id");
  copy.removeAttribute("aria-label");
  copy.removeAttribute("aria-haspopup");
  copy.setAttribute("aria-hidden", "true");
  copy.setAttribute("tabindex", "-1");
  copy.classList.add("detail-copy");
  copy.style.cssText += `;position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;transform:none;--on:1;pointer-events:none`;
  host.querySelector(".detail-sheet").after(copy); // above the black, under the text
  // The transform that makes it cover the screen (uniform, from its centre: never distorted).
  const W = window.innerWidth;
  const H = window.innerHeight;
  const cover = { x: W / 2 - (r.left + r.width / 2), y: H / 2 - (r.top + r.height / 2), scale: Math.max(W / r.width, H / r.height) * 1.04 };
  return { el: copy, parts: [...copy.children], cover };
}

/** Call `fn` once the canvas has drawn detail change `version` (or after a short timeout). */
function whenShown(version, fn) {
  const t0 = performance.now();
  const tick = () => {
    if (detailState.shown >= version || performance.now() - t0 > 300) {
      gsap.ticker.remove(tick);
      fn();
    }
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}

/** True when the programs section fills the screen (so the rails stay exactly where they are). */
function sectionOnScreen() {
  const r = document.getElementById("programs")?.getBoundingClientRect();
  return !!r && r.top <= 1 && r.bottom >= window.innerHeight - 1;
}

/** Scroll (instantly) to the programs section (or to a card's row): hash links and reloads. */
function jumpToPrograms(card) {
  const section = document.getElementById("programs");
  if (!section) return;
  const live = document.documentElement.dataset.world === "live";
  const row = card?.closest(".rail-row");
  let y = live ? programsScrollY() : section.getBoundingClientRect().top + window.scrollY;
  if (row) y = Math.max(y, row.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12);
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  startTrip(toProgress(HERO_END), 0.01, (t) => t); // the scene is at the hold on the next frame
}

export default function ProgramDetail() {
  const [view, setView] = useState({ id: null, list: ALL });
  // <body> once on the client (null while server-rendering): the portal target below.
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  const host = onClient ? document.body : null;
  const panel = useRef(null);
  const returnTo = useRef(null);
  const pushed = useRef(false); // we added a history entry (so Close goes Back)
  const phase = useRef(null); // null | "opening" | "open" | "closing"
  const openTl = useRef(null);
  const liftAt = useRef(0); // time in openTl where the canvas takes over
  const stopWait = useRef(null);
  const split = useRef(null);
  const swipe = useRef(null);
  const linkTimer = useRef(0); // a pending open from a #programs/<id> link
  const copyRef = useRef(null); // the card copy while the detail is up

  const program = programs.find((p) => p.id === view.id);
  const index = view.id ? view.list.indexOf(view.id) : -1;
  /** The detail's phase, mirrored on the panel as data-phase (CSS hooks, tests). */
  const setPhase = useCallback((v) => {
    phase.current = v;
    detailUi.open = !!v;
    if (panel.current) panel.current.dataset.phase = v ?? "";
  }, []);

  /* ---------------------------------------------------------- lock page */
  /*
   * While open: Lenis is LOCKED (it cancels every wheel and touch scroll, so the page
   * cannot move), the page behind is hidden from assistive tech (aria-hidden) and Tab
   * is trapped inside. Deliberately no `inert` and no overflow change on <html>: both
   * force a full restyle and relayout of the long page (a 100-200ms stall on a phone).
   */
  const lock = useCallback((on) => {
    const main = document.querySelector("main");
    const menuButton = document.querySelector(".menu-button");
    for (const el of [main, menuButton]) {
      if (!el) continue;
      if (on) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
    }
    const lenis = getLenis();
    if (lenis) lenis.isLocked = on;
    else document.documentElement.style.overflow = on ? "hidden" : ""; // reduced motion: no Lenis, native scroll
  }, []);

  const lift = (on) => {
    const c = canvasEl();
    if (c) c.style.zIndex = on ? "66" : ""; // the canvas above the page, under the detail
  };
  const parts = (el) => ({
    sheet: el.querySelector(".detail-sheet"),
    inner: el.querySelector(".detail-inner"),
    art: el.querySelector(".detail-art"),
  });

  /* ------------------------------------------------------------ open */
  const openNow = useCallback((id, list, from) => {
    returnTo.current = from ?? cardFor(id);
    setView({ id, list: list?.length ? list : squadIdsOf(id), first: true });
  }, []);

  // After React shows the program: the first open (the full sequence) or a switch (the text part).
  useLayoutEffect(() => {
    const el = panel.current;
    if (!view.id || !el) return;
    const prog = programs.find((p) => p.id === view.id);
    const reduced = prefersReducedMotion();
    const { sheet, inner, art } = parts(el);

    split.current?.revert();
    split.current = SplitText.create(el.querySelector(".detail-name"), { type: "lines", mask: "lines" });
    const lines = split.current.lines;

    if (!view.first) {
      // Prev / next: the new name slides in from below (the old one is sliding out as a ghost).
      if (reduced) gsap.fromTo(lines, { opacity: 0 }, { opacity: 1, duration: DET.nameSlide, ease: ease.out });
      else gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: DET.nameSlide, ease: ease.expo, stagger: 0.04 });
      return;
    }

    // First open. Measure everything first, then write (no forced layout in between).
    const live = liveCanvas();
    const card = returnTo.current;
    const cardArt = card?.querySelector(".card-art");
    const fromCard = !reduced && onScreen(card) && onScreen(cardArt);
    const printDots = fromCard ? dotsOnScreen(prog, cardArt.getBoundingClientRect()) : null;
    setPhase("opening");
    lock(true);
    el.hidden = false;

    // Text parts start hidden; they come in at DET.textAt.
    const texts = [
      el.querySelector(".detail-rule"),
      el.querySelector(".detail-squad"),
      ...el.querySelectorAll(".detail-facts > div"),
      el.querySelector(".detail-register"),
      el.querySelector(".detail-nav"),
      el.querySelector(".detail-hint"),
      el.querySelector(".detail-top"),
    ].filter(Boolean);
    gsap.set(inner, { opacity: 1 });
    gsap.set(texts, { opacity: 0 });
    gsap.set(lines, reduced ? { opacity: 0 } : { yPercent: 110 });

    const tl = gsap.timeline({
      onComplete: () => {
        el.querySelector(".detail-close")?.focus({ preventScroll: true });
      },
    });
    openTl.current = tl;
    if (fromCard) {
      // 0 - 0.3: the card copy scales up to cover the screen as its contents fade,
      // the black comes in under it, the other cards fade out.
      const copy = cardCopy(card, el);
      copyRef.current = copy;
      gsap.set(sheet, { opacity: 0 });
      tl.to(others(card), { opacity: 0, duration: DET.expand, ease: ease.out }, 0);
      tl.to(copy.el, { ...copy.cover, duration: DET.expand, ease: ease.inOut }, 0);
      tl.to(copy.parts, { opacity: 0, duration: DET.expand * 0.7, ease: ease.out }, 0);
      tl.to(sheet, { opacity: 1, duration: DET.expand * 0.8, ease: ease.out }, DET.expand * 0.2);
      liftAt.current = DET.expand;
    } else {
      // No card on screen (a link) or reduced motion: the black simply fades in.
      tl.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: duration.fast, ease: ease.out }, 0);
      liftAt.current = duration.fast;
    }

    // The canvas takes over: the dots start on the printed dots, burst and converge.
    tl.call(
      () => {
        setPhase("open");
        if (copyRef.current) gsap.set(copyRef.current.el, { opacity: 0 }); // the black sheet is all there is now
        if (!live) return; // the static shape (in the art area) shows instead
        lift(true);
        showDetailShape({
          programId: prog.id,
          squad: prog.squad,
          rect: art.getBoundingClientRect(),
          phase: fromCard ? "open" : "cloud",
          from: printDots,
        });
        const v = detailState.version;
        stopWait.current = whenShown(v, () => gsap.set(sheet, { opacity: 0 })); // the lifted canvas is the same black
      },
      null,
      liftAt.current
    );

    // Text: name lines, then the badge, the rows, Register, the rest.
    const at = fromCard ? DET.textAt : liftAt.current + (live ? DET.form * 0.6 : 0.1);
    if (reduced) {
      tl.to(lines, { opacity: 1, duration: duration.base, ease: ease.out }, at);
      tl.to(texts, { opacity: 1, duration: duration.base, ease: ease.out }, at);
    } else {
      tl.to(lines, { yPercent: 0, duration: 0.3, ease: ease.expo, stagger: 0.05 }, at);
      tl.to(texts, { opacity: 1, duration: 0.25, ease: ease.out, stagger: DET.textStagger * 0.5 }, at + DET.textStagger * 1.5);
    }
  }, [view, lock, setPhase]);

  /* ----------------------------------------------------------- close */
  const finish = useCallback(
    (card) => {
      const el = panel.current;
      const { sheet, inner } = parts(el);
      stopWait.current?.();
      el.hidden = true;
      gsap.set([sheet, inner], { clearProps: "all" });
      copyRef.current?.el.remove();
      copyRef.current = null;
      const cells = railCells(card);
      if (cells.length) gsap.set(cells, { clearProps: "opacity" });
      lift(false);
      lock(false);
      split.current?.revert();
      split.current = null;
      el.querySelectorAll(".detail-ghost").forEach((g) => g.remove());
      setPhase(null);
      openTl.current = null;
      setView((v) => ({ ...v, id: null }));
      card?.focus({ preventScroll: true });
    },
    [lock, setPhase]
  );

  const closeNow = useCallback(() => {
    const el = panel.current;
    if (!el || !phase.current || phase.current === "closing") return;
    const was = phase.current;
    clearTimeout(linkTimer.current);
    setPhase("closing");
    stopWait.current?.();
    const { sheet, inner } = parts(el);
    const card = returnTo.current;
    const tl0 = openTl.current;

    // Still expanding (the canvas has not taken over): play the open back, faster.
    if (was === "opening" && tl0 && tl0.time() < liftAt.current) {
      gsap.to(inner, { opacity: 0, duration: duration.fast * 0.5 });
      tl0.eventCallback("onReverseComplete", () => finish(card));
      tl0.eventCallback("onComplete", null);
      tl0.timeScale(2).reverse();
      return;
    }
    tl0?.kill();
    openTl.current = null;
    gsap.killTweensOf(el.querySelectorAll(".detail-name *, .detail-inner > *"));

    centreCard(card);
    const cardArt = card?.querySelector(".card-art");
    const toCard = !prefersReducedMotion() && onScreen(card) && onScreen(cardArt);
    const rest = others(card);
    const own = card?.closest(".rail-cell");
    if (own) gsap.set(own, { clearProps: "opacity" }); // the card closed on is in its slot (under the copy)
    const tl = gsap.timeline({ onComplete: () => finish(card) });
    tl.to(inner, { opacity: 0, duration: 0.12, ease: ease.out }, 0);

    if (toCard) {
      // The copy of the card it returns to (after prev / next it is another card), covering
      // the screen with its contents hidden, ready to scale back down into the slot.
      copyRef.current?.el.remove();
      const copy = cardCopy(card, el);
      copyRef.current = copy;
      gsap.set(copy.el, { ...copy.cover, opacity: 0 });
      gsap.set(copy.parts, { opacity: 0 });
      const dotsUp = liveCanvas() && detailState.open;
      const swapAt = dotsUp ? DET.shrink : 0;
      if (dotsUp) {
        // 0 - 0.15: the dots fade and contract toward the card...
        const a = cardArt.getBoundingClientRect();
        shrinkDetailShape({ x: a.left + a.width / 2, y: a.top + a.height / 2 });
      }
      // ...then the black sheet and the copy take over from the (now empty) canvas, and the
      // copy scales back into the slot as its contents return; the black and the list fade back.
      tl.call(
        () => {
          gsap.set(sheet, { opacity: 1 });
          gsap.set(copy.el, { opacity: 1 });
          hideDetailShape();
          lift(false);
        },
        null,
        swapAt
      );
      const back = Math.max(0.12, DET.collapse - swapAt);
      tl.to(copy.el, { x: 0, y: 0, scale: 1, duration: back, ease: ease.inOut }, swapAt);
      tl.to(copy.parts, { opacity: 1, duration: back * 0.5, ease: ease.out }, swapAt + back * 0.5); // only once it is nearly card-sized
      tl.to(sheet, { opacity: 0, duration: back, ease: ease.inOut }, swapAt);
      tl.to(rest, { opacity: 1, duration: back, ease: ease.out }, swapAt);
    } else {
      // Nothing to land on (reduced motion, card off screen): everything fades.
      if (detailState.open) hideDetailShape({ fade: true });
      tl.to(sheet, { opacity: 0, duration: duration.base * 0.6, ease: ease.out }, 0);
      tl.to(rest, { opacity: 1, duration: duration.base * 0.6, ease: ease.out }, 0);
    }
  }, [finish, setPhase]);

  /** Close from the UI: go Back if we added the history entry (popstate closes it), else close here. */
  const requestClose = useCallback(() => {
    if (!phase.current || phase.current === "closing") return;
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
      const el = panel.current;
      if (phase.current !== "open" || !view.id || view.list.length < 2) return;
      const list = view.list;
      const next = list[(list.indexOf(view.id) + dir + list.length) % list.length];
      const prog = programs.find((p) => p.id === next);

      // The current name slides out (a ghost copy), whatever it was doing; earlier ghosts go at once.
      el.querySelectorAll(".detail-ghost").forEach((g) => g.remove());
      const old = el.querySelector(".detail-name");
      if (old) {
        gsap.killTweensOf(old.querySelectorAll("*"));
        const ghost = old.cloneNode(true);
        ghost.removeAttribute("id");
        ghost.classList.add("detail-ghost");
        ghost.setAttribute("aria-hidden", "true");
        gsap.set(ghost, { position: "absolute", left: old.offsetLeft, top: old.offsetTop, width: old.offsetWidth, margin: 0 });
        old.parentElement.appendChild(ghost);
        const reduced = prefersReducedMotion();
        gsap.to(ghost, {
          ...(reduced ? {} : { yPercent: -70 }),
          opacity: 0,
          duration: DET.nameSlide * 0.7,
          ease: ease.inOut,
          onComplete: () => ghost.remove(),
        });
      }
      // The shape: turbulence, then the next shape (from wherever the dots are now).
      if (liveCanvas() && detailState.open) {
        showDetailShape({
          programId: next,
          squad: prog.squad,
          rect: el.querySelector(".detail-art").getBoundingClientRect(),
          phase: "switch",
        });
      }
      returnTo.current = cardFor(next);
      history.replaceState(null, "", `#programs/${next}`);
      setView({ id: next, list, first: false });
    },
    [view]
  );

  /* ------------------------------------------------ events and routing */
  // A link opens a program after a short delay (the scroll lands first). Any newer
  // open or close cancels that pending open, so it can never reopen a closed detail.
  const cancelLink = () => clearTimeout(linkTimer.current);
  const openFromLink = useCallback(
    (id) => {
      const card = cardFor(id);
      centreCard(card);
      jumpToPrograms(card);
      cancelLink();
      linkTimer.current = setTimeout(() => !phase.current && openNow(id, squadIdsOf(id), card), 450);
    },
    [openNow]
  );

  useEffect(() => {
    // A card asks to open.
    const onOpen = (e) => {
      const { programId, list, returnTo: from } = e.detail;
      if (phase.current) return;
      cancelLink();
      history.pushState(null, "", `#programs/${programId}`);
      pushed.current = true;
      openNow(programId, list, from);
    };
    // Browser Back / Forward, or a #programs link followed while on the page.
    const onPop = () => {
      const id = hashId();
      cancelLink();
      if (id && !phase.current) {
        pushed.current = false;
        if (!sectionOnScreen()) openFromLink(id);
        else openNow(id, squadIdsOf(id), cardFor(id));
      } else if (!id && phase.current) {
        pushed.current = false;
        closeNow();
      } else if (window.location.hash === "#programs" && !sectionOnScreen()) {
        jumpToPrograms();
      }
    };
    window.addEventListener(DETAIL_EVENT, onOpen);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener(DETAIL_EVENT, onOpen);
      window.removeEventListener("popstate", onPop);
    };
  }, [openNow, closeNow, openFromLink]);

  // Reload / shared link (#programs or #programs/<id>): once, when the page has laid out.
  useEffect(() => {
    if (!window.location.hash.startsWith("#programs")) return;
    const timer = setTimeout(() => {
      const id = hashId();
      if (id) openFromLink(id);
      else jumpToPrograms();
    }, 600);
    return () => {
      clearTimeout(timer);
      cancelLink();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only (openFromLink is stable)
  }, []);

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

  const n = program ? numberOf(program.id) : 0;
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
      {/* The black behind the detail (it steps aside for the lifted canvas, same black). */}
      <div className="detail-sheet" aria-hidden="true" />
      {program && (
        <div className="detail-inner">
          <div className="detail-top">
            <p className="detail-label">
              {COPY.label} {pad(n)} / {pad(TOTAL)}
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
            <span className="detail-rule" aria-hidden="true" />
            <p className="detail-squad">
              <span className="badge">
                <Emblem squad={program.squad} />
              </span>
              {program.squad} squad
            </p>
            <dl className="detail-facts">
              {COPY.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{program[f.key]}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="detail-register" disabled aria-disabled="true">
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
