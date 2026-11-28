"use client";

/**
 * PROGRAM DETAIL: a small cinematic moment, time-based (GSAP timelines with the
 * shared eases and lib/motion.js `detail` timings), never left half-played,
 * interruptible at any point.
 *
 * OPEN (about 1.5s, lib/motion.js `detail`)
 *   0 - 0.35    the other cards of the rail slide out sideways; the tapped card lifts
 *   0.15 - 0.5  its squad colour floods the screen (Flip from the card, its chamfered
 *               cut opening up); its print flies to the art area
 *   0.5 - 0.8   the colour drains to black, the print turns white
 *   0.8 - 1.35  the shared canvas is lifted; the dots appear EXACTLY on the printed
 *               dots (lib/halftone.js), burst a little, then converge into the shape
 *               with the squad's signature, a soft squad-colour glow behind it
 *   1.1 - 1.55  the name reveals line by line (mask), then the badge, the TBA
 *               rows, the disabled Register button
 * PREV / NEXT (arrows, swipe, keys): a short turbulence melting into the next
 *   shape while the old name slides out and the new one slides in. Rapid presses
 *   overwrite each other (the dots continue from where they are).
 * CLOSE (X, Escape, browser Back), about 0.6s: the dots fall back onto the
 *   card's print, the black shrinks into the card's slot turning back into its
 *   squad colour, the other cards slide back in. Closing before the canvas has
 *   taken over plays the open back in reverse.
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
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { programs } from "@/data/programs";
import { detailCopy as COPY } from "@/data/story";
import { ease, duration, detail as DET, prefersReducedMotion } from "@/lib/motion";
import { getLenis, startTrip } from "@/lib/scrollStore";
import { DETAIL_EVENT, detailUi, detailState, showDetailShape, collapseDetailShape, hideDetailShape } from "@/lib/detail";
import { dotsOnScreen, contentSquare } from "@/lib/halftone";
import { numberOf, squadIdsOf } from "@/lib/programOrder";
import { toProgress, programsScrollY, HERO_END } from "@/lib/journey";
import Emblem from "@/components/Story/Emblem";
import ShapeArt from "./ShapeArt";

if (typeof window !== "undefined") gsap.registerPlugin(Flip, SplitText);

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
/** The other cards of `card`'s rail: those before it and those after it (they slide out / back in). */
function siblings(card) {
  const cell = card?.closest(".rail-cell");
  const cells = cell ? [...cell.parentElement.children] : [];
  const k = cells.indexOf(cell);
  return { cell, before: cells.slice(0, Math.max(0, k)), after: cells.slice(k + 1), all: cells };
}
/**
 * The card's chamfered cut (CSS .card --cut: tab at the top left, chamfer top right)
 * as a px polygon for the full-screen sheet while it is scaled down onto the card
 * by sx, sy (so on screen it matches the card exactly). `open` = 1: the full rectangle
 * (same 7 points, so GSAP can tween between them).
 */
const CUT = { tabH: 26, tabW: 76, cham: 30 };
function cutPolygon(sx, sy, open = 0) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const k = 1 - open;
  const th = (CUT.tabH / sy) * k;
  const tw = (CUT.tabW / sx) * k;
  const cx = (CUT.cham / sx) * k;
  const cy = (CUT.cham / sy) * k;
  const pt = (x, y) => `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  return `polygon(${[pt(0, 0), pt(tw, 0), pt(tw + (CUT.tabH / sx) * k, th), pt(W - cx, th), pt(W, th + cy), pt(W, H), pt(0, H)].join(", ")})`;
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
    black: el.querySelector(".detail-sheet-black"),
    paper: el.querySelector(".detail-sheet-card"),
    fly: el.querySelector(".detail-fly"),
    ink: el.querySelector(".fly-ink"),
    light: el.querySelector(".fly-light"),
    inner: el.querySelector(".detail-inner"),
    art: el.querySelector(".detail-art"),
  });
  /** Put the flying print exactly over a square screen box (no transform). */
  const placeFly = (fly, box) =>
    gsap.set(fly, { left: box.left, top: box.top, width: box.width, height: box.height, x: 0, y: 0, scaleX: 1, scaleY: 1 });

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
    const { sheet, black, paper, fly, ink, light, inner, art } = parts(el);

    split.current?.revert();
    split.current = SplitText.create(el.querySelector(".detail-name"), { type: "lines", mask: "lines" });
    const lines = split.current.lines;

    if (!view.first) {
      // Prev / next: the new name slides in from below (the old one is sliding out as a ghost).
      if (reduced) gsap.fromTo(lines, { opacity: 0 }, { opacity: 1, duration: DET.nameSlide, ease: ease.out });
      else gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: DET.nameSlide, ease: ease.expo, stagger: 0.04 });
      return;
    }

    // First open.
    setPhase("opening");
    lock(true);
    el.hidden = false;
    const live = liveCanvas();
    const card = returnTo.current;
    const cardArt = card?.querySelector(".card-frame");
    const fromCard = !reduced && onScreen(card) && onScreen(cardArt);
    const artSq = contentSquare(art.getBoundingClientRect());

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
    placeFly(fly, artSq);

    const tl = gsap.timeline({
      onComplete: () => {
        el.querySelector(".detail-close")?.focus({ preventScroll: true });
      },
    });
    openTl.current = tl;
    if (fromCard) {
      const cr = card.getBoundingClientRect();
      const sx = cr.width / window.innerWidth;
      const sy = cr.height / window.innerHeight;
      const sib = siblings(card);
      // 0: the other cards slide out sideways and fade; the tapped card lifts.
      tl.to(sib.before, { xPercent: -60, opacity: 0, duration: DET.slide, ease: ease.inOut }, 0);
      tl.to(sib.after, { xPercent: 60, opacity: 0, duration: DET.slide, ease: ease.inOut }, 0);
      Flip.fit(sheet, card, { scale: true }); // the sheet sits exactly on the card: its surface, its cut
      gsap.set(sheet, { opacity: 0, clipPath: cutPolygon(sx, sy) });
      gsap.set(black, { opacity: 0 });
      gsap.set(paper, { opacity: 1 }); // the dark card surface, over the squad colour
      Flip.fit(fly, cardArt, { scale: true }); // the card's white print
      gsap.set(fly, { opacity: 1 });
      gsap.set(ink, { opacity: 0 });
      gsap.set(light, { opacity: 1 });
      tl.to(sheet, { opacity: 1, duration: 0.06, ease: "none" }, 0); // the card's own type gives way
      tl.to([sheet, fly], { y: "-=14", duration: DET.lift, ease: ease.out }, 0);
      // Then the squad colour floods the screen (the cut opens up, the dark surface gives
      // way to the colour), the print flies to the art area and turns to ink on the colour...
      tl.to(sheet, { x: 0, y: 0, scaleX: 1, scaleY: 1, clipPath: cutPolygon(1, 1, 1), duration: DET.expand, ease: ease.inOut }, DET.lift);
      tl.to(paper, { opacity: 0, duration: DET.expand, ease: ease.inOut }, DET.lift);
      tl.to(fly, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: DET.expand, ease: ease.inOut }, DET.lift);
      tl.to(light, { opacity: 0, duration: DET.expand * 0.6, ease: ease.inOut }, DET.lift);
      tl.to(ink, { opacity: 1, duration: DET.expand * 0.6, ease: ease.inOut }, DET.lift);
      // ...then the colour drains to black while the print turns white again.
      const drainAt = DET.lift + DET.expand;
      tl.to(black, { opacity: 1, duration: DET.drain, ease: ease.inOut }, drainAt);
      tl.to(ink, { opacity: 0, duration: DET.drain, ease: ease.inOut }, drainAt);
      tl.to(light, { opacity: 1, duration: DET.drain, ease: ease.inOut }, drainAt);
      liftAt.current = drainAt + DET.drain;
    } else {
      // No card on screen (a link) or reduced motion: the black simply fades in.
      gsap.set(sheet, { clearProps: "transform" });
      gsap.set(black, { opacity: 1 });
      gsap.set(fly, { opacity: 0 });
      tl.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: duration.fast, ease: ease.out }, 0);
      liftAt.current = duration.fast;
    }

    // The canvas takes over: the dots start on the printed dots, burst and converge.
    tl.call(
      () => {
        setPhase("open");
        if (!live) {
          gsap.set(fly, { opacity: 0 }); // the static shape (same place) shows instead
          return;
        }
        lift(true);
        showDetailShape({
          programId: prog.id,
          squad: prog.squad,
          rect: art.getBoundingClientRect(),
          phase: fromCard ? "open" : "cloud",
          from: fromCard ? dotsOnScreen(prog, artSq) : null,
        });
        const v = detailState.version;
        stopWait.current = whenShown(v, () => {
          gsap.set(sheet, { opacity: 0 }); // the lifted canvas is the same black behind
          gsap.set(fly, { opacity: 0 });
        });
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
      const { sheet, black, paper, fly, ink, light, inner } = parts(el);
      stopWait.current?.();
      el.hidden = true;
      gsap.set([sheet, black, paper, fly, ink, light, inner], { clearProps: "all" });
      const { all } = siblings(card);
      if (all.length) gsap.set(all, { xPercent: 0, clearProps: "opacity" });
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
    const { sheet, black, paper, fly, ink, light, inner } = parts(el);
    const card = returnTo.current;
    const prog = programs.find((p) => p.id === card?.dataset.id) ?? program;
    const tl0 = openTl.current;

    // Still expanding (the canvas has not taken over): play the expand back, faster.
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
    const cardArt = card?.querySelector(".card-frame");
    const toCard = !prefersReducedMotion() && onScreen(card) && onScreen(cardArt);
    const sib = siblings(card);
    if (sib.cell) gsap.set(sib.cell, { xPercent: 0, clearProps: "opacity" }); // the card itself is back in its slot (under the sheet)
    const tl = gsap.timeline({ onComplete: () => finish(card) });
    tl.to(inner, { opacity: 0, duration: 0.15, ease: ease.out }, 0);

    if (toCard) {
      const box = cardArt.getBoundingClientRect();
      const dotsUp = liveCanvas() && detailState.open;
      placeFly(fly, box);
      gsap.set(ink, { opacity: 0 });
      gsap.set(light, { opacity: 1 });
      const swapAt = dotsUp ? DET.collapseDots : 0;
      if (dotsUp) {
        // The dots fall back onto the card's printed dots (white on black)...
        collapseDetailShape(dotsOnScreen(prog, box));
        gsap.set(fly, { opacity: 0 });
      } else gsap.set(fly, { opacity: 1 });
      // ...then the print and the paper take over: the black sheet (identical to the canvas
      // behind) shrinks onto the card and turns back to paper, the print back to ink.
      tl.call(
        () => {
          gsap.set(fly, { opacity: 1 });
          gsap.set(sheet, { opacity: 1 });
          gsap.set(black, { opacity: 1 });
          gsap.set(paper, { opacity: 0 });
          hideDetailShape();
          lift(false);
        },
        null,
        swapAt
      );
      const rest = Math.max(0.12, DET.collapse - swapAt);
      // The black sheet shrinks into the card's slot, its cut closing again: black -> the squad
      // colour -> the dark card surface; the print stays white; the other cards slide back in.
      const cr = card.getBoundingClientRect();
      gsap.set(sheet, { clipPath: cutPolygon(1, 1, 1) });
      tl.add(Flip.fit(sheet, card, { scale: true, duration: rest, ease: ease.inOut }), swapAt);
      tl.to(sheet, { clipPath: cutPolygon(cr.width / window.innerWidth, cr.height / window.innerHeight), duration: rest, ease: ease.inOut }, swapAt);
      tl.to(black, { opacity: 0, duration: rest * 0.5, ease: ease.inOut }, swapAt);
      tl.to(paper, { opacity: 1, duration: rest * 0.5, ease: ease.inOut }, swapAt + rest * 0.5);
      tl.to([...sib.before, ...sib.after], { xPercent: 0, opacity: 1, duration: rest, ease: ease.inOut }, swapAt);
      tl.to(sheet, { opacity: 0, duration: 0.06, ease: "none" }, swapAt + rest - 0.06); // the card's own type returns
    } else {
      // Nothing to land on (reduced motion, card off screen): everything fades.
      if (detailState.open) hideDetailShape({ fade: true });
      gsap.set(fly, { opacity: 0 });
      tl.to(sheet, { opacity: 0, duration: duration.base * 0.6, ease: ease.out }, 0);
      tl.to([...sib.before, ...sib.after], { xPercent: 0, opacity: 1, duration: duration.base * 0.6, ease: ease.out }, 0);
    }
  }, [finish, program, setPhase]);

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
  // The print in flight is always the current program: the one opened, or the one closed on.
  const flyId = view.id;
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
      {/* The card's paper, grown to the screen; it turns black (and steps aside for the canvas). */}
      <div className="detail-sheet" aria-hidden="true">
        <div className="detail-sheet-card" />
        <div className="detail-sheet-black" />
      </div>
      {/* The card's printed shape in flight: ink on paper, white on black. */}
      <div className="detail-fly" aria-hidden="true">
        {flyId && <ShapeArt programId={flyId} className="fly-ink" ink="black" />}
        {flyId && <ShapeArt programId={flyId} className="fly-light" accent />}
      </div>
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
