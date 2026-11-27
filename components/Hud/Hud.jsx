"use client";

/**
 * The HUD: only a small logo mark top left and the menu button top right.
 *
 * Menu: two lines that turn into an X; the contents overlay opens as a circle
 * growing out of the button (clip-path), items stagger in. Items are real
 * links (#cover, #opening, #chapter-arts), so they work without JavaScript;
 * with the live issue a tap closes the menu and travels there (Lenis + an
 * eased scene trip, timed by distance). Chapters not built yet are listed but
 * disabled. While open: Lenis paused, page scroll locked, <main> inert, Tab
 * stays inside, Escape or the X closes, focus returns to the button.
 * Reduced motion: fade, and the trip is an instant jump.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SQUADS } from "@/data/programs";
import { menu as COPY } from "@/data/issue";
import { brand } from "@/lib/theme";
import { ease, menuMotion as M, tripDuration, prefersReducedMotion } from "@/lib/motion";
import { scrollState, getLenis, startTrip } from "@/lib/scrollStore";
import { TARGETS, toVh, toProgress, SCENES } from "@/lib/issue";

const ITEMS = [
  { id: "cover", label: COPY.cover, href: "#cover", vh: TARGETS.cover },
  { id: "opening", label: COPY.opening, href: "#opening", vh: TARGETS.opening },
  ...SQUADS.map((sq, i) =>
    sq === "Arts"
      ? { id: "arts", label: `Chapter ${i + 1} · ${sq}`, href: "#chapter-arts", vh: TARGETS.arts }
      : { id: sq, label: `Chapter ${i + 1} · ${sq}`, soon: true }
  ),
];

/** Where the reader is now (for the marker in the contents). */
function currentItem() {
  const s = toVh(scrollState.smooth);
  if (s >= SCENES.zoom2.start + SCENES.zoom2.len * 0.8) return "arts";
  if (s >= SCENES.zoom1.start + SCENES.zoom1.len * 0.8) return "opening";
  return "cover";
}

function travelTo(item) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const live = !document.documentElement.classList.contains("no-js");
  const y = toProgress(item.vh) * max;
  const lenis = getLenis();
  if (!lenis || prefersReducedMotion() || !live) {
    window.scrollTo(0, y);
    return;
  }
  const d = tripDuration(item.vh - toVh(scrollState.smooth));
  const easing = gsap.parseEase(ease.inOut); // the shared ease, as a function
  startTrip(toProgress(item.vh), d, easing); // the scene travels with the page
  lenis.scrollTo(y, { duration: d, easing, force: true });
}

export default function Hud() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("cover");
  const button = useRef(null);
  const overlay = useRef(null);
  const anim = useRef(null);
  const pending = useRef(null);

  const lock = useCallback((on) => {
    const main = document.querySelector("main");
    if (main) main.inert = on;
    document.documentElement.style.overflow = on ? "hidden" : "";
    const lenis = getLenis();
    if (lenis) on ? lenis.stop() : lenis.start();
  }, []);

  useEffect(() => {
    const el = overlay.current;
    const btn = button.current;
    if (!el || !btn) return;
    const items = el.querySelectorAll(".menu-item");
    const reduced = prefersReducedMotion();
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const circle = (rad) => `circle(${rad}px at ${cx}px ${cy}px)`;
    anim.current?.kill();

    if (open) {
      lock(true);
      el.style.visibility = "visible";
      const tl = gsap.timeline();
      if (reduced) tl.fromTo(el, { opacity: 0, clipPath: "none" }, { opacity: 1, duration: M.open, ease: ease.out });
      else {
        tl.fromTo(el, { opacity: 1, clipPath: circle(0) }, { clipPath: circle(radius), duration: M.open, ease: ease.inOut });
        tl.set(el, { clipPath: "none" }); // fully open: a screen that grows later never shows the page behind
        tl.fromTo(items, { opacity: 0, xPercent: -6 }, { opacity: 1, xPercent: 0, duration: M.open, ease: ease.out, stagger: M.itemStagger }, M.open * 0.35);
      }
      tl.call(() => (el.querySelector('.menu-item[aria-current="true"]') ?? items[0])?.focus(), [], 0.05);
      anim.current = tl;
    } else if (el.style.visibility === "visible") {
      const trip = pending.current;
      pending.current = null;
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.visibility = "hidden";
          lock(false);
          if (trip) travelTo(trip);
        },
      });
      if (reduced) tl.to(el, { opacity: 0, duration: M.close, ease: ease.out });
      else tl.fromTo(el, { clipPath: circle(radius) }, { clipPath: circle(0), duration: M.close, ease: ease.inOut });
      btn.focus({ preventScroll: true });
      anim.current = tl;
    }
  }, [open, lock]);

  // Escape closes; Tab stays inside (the button + the live items).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = [button.current, ...overlay.current.querySelectorAll("a.menu-item")];
      const first = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      } else if (!focusables.includes(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    if (!open) setCurrent(currentItem());
    setOpen((v) => !v);
  };

  return (
    <>
      <a href="#cover" className="hud-mark" aria-label="ASTRA #2027, back to the cover" onClick={(e) => { e.preventDefault(); travelTo(ITEMS[0]); }}>
        <Image src={brand.ink} width={brand.inkSize[0]} height={brand.inkSize[1]} alt="" unoptimized priority />
      </a>
      <button
        ref={button}
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-controls="contents"
        aria-label={open ? COPY.close : COPY.open}
        onClick={toggle}
      >
        <span className="menu-line" aria-hidden="true" />
        <span className="menu-line" aria-hidden="true" />
      </button>
      <div ref={overlay} id="contents" className="menu-overlay" role="dialog" aria-modal="true" aria-label={COPY.title}>
        <nav aria-label={COPY.title}>
          <p className="caption menu-title">{COPY.title}</p>
          <ol className="menu-list">
            {ITEMS.map((item, k) => (
              <li key={item.id}>
                {item.soon ? (
                  <span className="menu-item menu-item-soon" aria-disabled="true">
                    <span className="menu-num">{String(k).padStart(2, "0")}</span>
                    <span className="menu-label">{item.label}</span>
                    <span className="caption menu-soon">{COPY.soon}</span>
                  </span>
                ) : (
                  <a
                    className="menu-item"
                    href={item.href}
                    aria-current={current === item.id ? "true" : undefined}
                    tabIndex={open ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      pending.current = item;
                      setOpen(false);
                    }}
                  >
                    <span className="menu-num">{String(k).padStart(2, "0")}</span>
                    <span className="menu-label">{item.label}</span>
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </>
  );
}
