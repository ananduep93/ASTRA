"use client";

/**
 * PROGRAM DETAIL: a small cinematic moment, time-based (GSAP timelines with the
 * shared eases and lib/motion.js `detail` timings), never left half-played,
 * interruptible at any point.
 *
 * OPEN (about 1.1s, lib/motion.js `detail`), never a blank frame:
 *   0 - 0.3     the tapped card's SURFACE scales from the card to fill the screen
 *               (it becomes the background), its PRINT flies to the art area, the
 *               other cards fade out, all at once
 *   0.3 - 0.8   the dots take over exactly on the print's dots (same frame), burst a
 *               little and converge into the shape with the squad's signature
 *   0.35 - 1.1  the name reveals line by line, the badge, the TBA rows and the
 *               disabled Register button come in alongside the dots
 * PREV / NEXT (arrows, swipe, keys): a short turbulence melting into the next
 *   shape while the old name slides out and the new one slides in. Rapid presses
 *   overwrite each other (the dots continue from where they are).
 * CLOSE (X, Escape, browser Back), about 0.35s, the open in reverse: the other
 *   cards fade back from the first frame, the surface shrinks back into the card's
 *   slot (the rail shows around it all along), the dots fall back onto the card's
 *   printed dots, and for the last 0.1s surface and dots cross-fade into the real
 *   card underneath. No copy of the title or print, so nothing doubles or ghosts.
 *   Closing before the dots have taken over plays the open back in reverse.
 *
 * LAYERS (bottom to top): the page < the under-layer (z 64: the card surface and
 * its flying print) < the canvas when lifted (z 66, transparent: only the dots)
 * < the detail text and controls (z 70).
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
import { DETAIL_EVENT, detailUi, detailState, showDetailShape, collapseDetailShape, hideDetailShape, warmDetailShape } from "@/lib/detail";
import { dotsOnScreen, contentSquare } from "@/lib/halftone";
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
 * Place an element exactly over a screen box (layout box; transforms cleared). The box
 * is written straight to style: gsap.set would first read the computed left / width
 * etc., and such a read right after a write forces a layout of the whole page.
 */
function place(node, r) {
  const st = node.style;
  st.left = `${r.left}px`;
  st.top = `${r.top}px`;
  st.width = `${r.width}px`;
  st.height = `${r.height}px`;
  st.opacity = "1";
  gsap.set(node, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
}
/** The transform that makes a box placed at `r` (origin top left) cover the whole screen. */
const fullScreenFrom = (r) => ({ x: -r.left, y: -r.top, scaleX: window.innerWidth / r.width, scaleY: window.innerHeight / r.height });
/** The transform that moves a square box placed at `a` onto the square box `b` (uniform). */
const squareOnto = (a, b) => ({ x: b.left - a.left, y: b.top - a.top, scaleX: b.width / a.width, scaleY: b.width / a.width });

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
  const under = useRef(null); // the under-layer: the card surface and its flying print
  const tapped = useRef(null); // the card's boxes, measured at the tap (before React changes anything)
  const artRect = useRef(null); // the detail's art area, measured once per open

  const program = programs.find((p) => p.id === view.id);
  // While closed the panel keeps a program rendered (hidden): the last one shown, or the
  // first, rendered once the page is idle. Opening then only updates text, instead of
  // mounting the whole panel in the tap's frame.
  const [shell, setShell] = useState(null);
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const h = idle(() => setShell(ALL[0]), { timeout: 5000 });
    return () => cancel(h);
  }, []);
  const shown = program ?? programs.find((p) => p.id === (view.last ?? shell));
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
    if (c) c.style.zIndex = on ? "66" : ""; // the canvas above the page and the surface, under the detail
    detailUi.lifted = on; // the canvas draws no backdrop while lifted (transparent)
  };
  const parts = (el) => ({
    surface: under.current.querySelector(".detail-surface"),
    print: under.current.querySelector(".detail-print"),
    inner: el.querySelector(".detail-inner"),
    art: el.querySelector(".detail-art"),
  });

  /* ------------------------------------------------------------ open */
  const openNow = useCallback((id, list, from) => {
    returnTo.current = from ?? cardFor(id);
    // Measure the card now, while the page layout is clean (reads after React's commit
    // and our own writes would force a layout of the whole page).
    const card = returnTo.current;
    const cardArt = card?.querySelector(".card-art");
    tapped.current =
      onScreen(card) && onScreen(cardArt)
        ? { card: card.getBoundingClientRect(), art: contentSquare(cardArt.getBoundingClientRect()) }
        : null;
    setView({ id, list: list?.length ? list : squadIdsOf(id), first: true });
  }, []);

  // After React shows the program: the first open (the full sequence) or a switch (the text part).
  useLayoutEffect(() => {
    const el = panel.current;
    if (!view.id || !el) return;
    const prog = programs.find((p) => p.id === view.id);
    const reduced = prefersReducedMotion();
    const { surface, print, inner, art } = parts(el);

    const splitName = () => {
      split.current?.revert();
      split.current = SplitText.create(el.querySelector(".detail-name"), { type: "lines", mask: "lines" });
      return split.current.lines;
    };

    if (!view.first) {
      const lines = splitName();
      // Prev / next: the new name slides in from below (the old one is sliding out as a ghost).
      if (reduced) gsap.fromTo(lines, { opacity: 0 }, { opacity: 1, duration: DET.nameSlide, ease: ease.out });
      else gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: DET.nameSlide, ease: ease.expo, stagger: 0.04 });
      return;
    }

    // First open. The card was measured at the tap. Show the panel (it is contained, so
    // laying it out never touches the page), split the name into its real lines and
    // measure the art area: one small layout. Every other write comes after.
    const live = liveCanvas();
    const card = returnTo.current;
    const cardArt = card?.querySelector(".card-art");
    const fromCard = !reduced && !!tapped.current;
    const cardBox = fromCard ? tapped.current.card : null;
    const artBox = fromCard ? tapped.current.art : null;
    el.hidden = false;
    under.current.hidden = false;
    const lines = splitName();
    artRect.current = art.getBoundingClientRect();
    const target = contentSquare(artRect.current); // where the print lands (the detail's art area)
    setPhase("opening");
    lock(true);
    under.current.style.setProperty("--squad", `var(--squad-${prog.squad})`);
    const printDots = fromCard ? dotsOnScreen(prog, target) : null; // the dots start on the landed print

    // Text parts start hidden; they come in alongside the dots.
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
      // 0 - 0.3, all at once: the card's surface grows from the card to fill the screen (it
      // fades in over the card's own type), its print flies to the art area, the others fade.
      place(surface, cardBox);
      gsap.set(surface, { opacity: 0 });
      print.src = cardArt.currentSrc || cardArt.src || "";
      place(print, artBox);
      tl.to(surface, { opacity: 1, duration: DET.expand * 0.4, ease: "none" }, 0);
      tl.to(surface, { ...fullScreenFrom(cardBox), duration: DET.expand, ease: ease.inOut }, 0);
      tl.to(print, { ...squareOnto(artBox, target), duration: DET.expand, ease: ease.inOut }, 0);
      tl.to(others(card), { opacity: 0, duration: DET.expand, ease: ease.out }, 0);
      if (live) tl.call(() => warmDetailShape(prog.id, artRect.current), null, DET.expand * 0.4); // a quiet frame
      liftAt.current = DET.expand;
    } else {
      // No card on screen (a link) or reduced motion: the surface simply fades in, full screen.
      place(surface, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
      gsap.set(print, { opacity: 0 });
      tl.fromTo(surface, { opacity: 0 }, { opacity: 1, duration: duration.fast, ease: ease.out }, 0);
      liftAt.current = duration.fast;
    }

    // The canvas takes over: the dots start on the printed dots, burst and converge.
    tl.call(
      () => {
        setPhase("open");
        if (!live) {
          gsap.set(print, { opacity: 0 }); // the static shape (same place) shows instead
          return;
        }
        lift(true);
        showDetailShape({
          programId: prog.id,
          squad: prog.squad,
          rect: artRect.current, // measured at the open (nothing moved since)
          phase: fromCard ? "open" : "cloud",
          from: printDots,
        });
        const v = detailState.version;
        stopWait.current = whenShown(v, () => gsap.set(print, { opacity: 0 })); // the dots are on the print now
      },
      null,
      liftAt.current
    );

    // Text: name lines, then the badge, the rows, Register, the rest.
    const at = fromCard ? DET.textAt : liftAt.current + 0.05;
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
      const { surface, print, inner } = parts(el);
      stopWait.current?.();
      el.hidden = true;
      under.current.hidden = true;
      // Inline styles are cleared directly: GSAP's clearProps reads the computed transform
      // first, which forces a layout of the whole page (a ~100ms frame on a slow phone).
      for (const node of [surface, print, inner]) node.removeAttribute("style");
      print.removeAttribute("src");
      for (const cell of railCells(card)) cell.style.opacity = "";
      lift(false);
      lock(false);
      split.current?.revert();
      split.current = null;
      el.querySelectorAll(".detail-ghost").forEach((g) => g.remove());
      setPhase(null);
      openTl.current = null;
      setView((v) => ({ ...v, id: null, last: v.id ?? v.last }));
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
    const { surface, print, inner } = parts(el);
    const card = returnTo.current;
    const prog = programs.find((p) => p.id === card?.dataset.id) ?? program;
    const tl0 = openTl.current;

    // Still growing (the dots have not taken over): play the open back, faster.
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
    gsap.killTweensOf([surface, print]);
    stopWait.current?.();
    gsap.set(print, { opacity: 0 });

    centreCard(card);
    const cardArt = card?.querySelector(".card-art");
    const toCard = !prefersReducedMotion() && onScreen(card) && onScreen(cardArt);
    const rest = others(card);
    const own = card?.closest(".rail-cell");
    if (own) own.style.opacity = ""; // the card closed on is in its slot, under the surface
    const tl = gsap.timeline({ onComplete: () => finish(card) });
    tl.to(inner, { opacity: 0, duration: 0.12, ease: ease.out }, 0);
    tl.to(rest, { opacity: 1, duration: DET.collapse, ease: ease.out }, 0); // the rail is back from frame one

    if (toCard) {
      // The surface (full screen) shrinks back into this card's slot; it hands over to the
      // real card in the last part. (After prev / next it is another card: re-placed first.)
      const cardBox = card.getBoundingClientRect();
      place(surface, cardBox);
      gsap.set(surface, fullScreenFrom(cardBox));
      tl.to(surface, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: DET.collapse, ease: ease.inOut }, 0);
      tl.to(surface, { opacity: 0, duration: DET.handover, ease: "none" }, DET.collapse - DET.handover);
      if (liveCanvas() && detailState.open) {
        // The dots fall back onto the card's own printed dots, then fade into the real print.
        collapseDetailShape(dotsOnScreen(prog, contentSquare(cardArt.getBoundingClientRect())));
        tl.call(() => hideDetailShape({ fade: true }), null, DET.collapse - DET.handover);
      }
    } else {
      // Nothing to land on (reduced motion, card off screen): everything fades.
      if (detailState.open) hideDetailShape({ fade: true });
      tl.to(surface, { opacity: 0, duration: duration.base * 0.6, ease: ease.out }, 0);
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

  const n = shown ? numberOf(shown.id) : 0;
  // Rendered straight into <body> (a portal): the page wrapper is its own layer
  // (z-index 10), and the detail must sit above the lifted canvas (66).
  if (!host) return null;
  return createPortal(
    <>
      {/* Under the lifted canvas: the card's surface (it grows into the background) and its
          print (it flies to the art area, where the dots take over). */}
      <div ref={under} className="detail-under" hidden aria-hidden="true">
        <div className="detail-surface" />
        {/* eslint-disable-next-line @next/next/no-img-element -- the card's generated print, reused */}
        <img className="detail-print" alt="" draggable={false} />
      </div>
    <div
      ref={panel}
      className="detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-name"
      hidden
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={shown ? { "--squad": `var(--squad-${shown.squad})` } : undefined}
    >
      {shown && (
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
            <ShapeArt shownId={shown.id} className="detail-static-art" />
          </div>
          <div className="detail-info">
            <h2 id="detail-name" className="detail-name" key={shown.id}>
              {shown.name}
            </h2>
            <span className="detail-rule" aria-hidden="true" />
            <p className="detail-squad">
              <span className="badge">
                <Emblem squad={shown.squad} />
              </span>
              {shown.squad} squad
            </p>
            <dl className="detail-facts">
              {COPY.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{shown[f.key]}</dd>
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
    </div>
    </>,
    host
  );
}
