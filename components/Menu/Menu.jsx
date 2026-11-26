"use client";

/**
 * The menu: a fixed button top right (two lines that turn into an X) and a
 * full-screen overlay that opens as a circle growing out of the button.
 *
 * - Items are real links (#top, #squad-arts ... #finale-title), so they work
 *   without JavaScript and in static mode. With the live story, a tap closes
 *   the menu and travels there with Lenis: shared ease, duration from the
 *   distance (capped), passing through the journey. Targets come from the
 *   shared timeline (lib/journey.js), never pixel values.
 * - While open: Lenis paused, page scroll locked, the page behind is `inert`
 *   (not clickable or focusable), Tab stays inside, Escape or the X closes it,
 *   and focus returns to the button.
 * - Reduced motion: fade only, and the trip is an instant jump.
 * Transform, opacity and clip-path only.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SQUADS } from "@/data/programs";
import { menu as copy } from "@/data/story";
import { brand } from "@/lib/theme";
import { ease, menuMotion as M, prefersReducedMotion } from "@/lib/motion";
import { scrollState, getLenis } from "@/lib/scrollStore";
import {
  toVh,
  activeStopAt,
  whitenessAt,
  finaleProgress,
  arrivalVh,
  finaleSharedProgress,
  sharedProgressOf,
  TOTAL_SCROLL_VH,
} from "@/lib/journey";
import Emblem from "@/components/Story/Emblem";

const pad = (n) => String(n).padStart(2, "0");

/** Menu entries: where each goes in the story (shared progress) and in the static page (element). */
const ITEMS = [
  { id: "home", label: copy.home, href: "#top", progress: () => 0, el: () => document.getElementById("top") },
  ...SQUADS.map((squad, i) => ({
    id: squad,
    label: squad,
    squad,
    href: `#squad-${squad.toLowerCase()}`,
    progress: () => sharedProgressOf(arrivalVh(i)),
    el: () => document.querySelector(`.squad-stop[data-stop="${i}"]`),
  })),
  {
    id: "finale",
    label: copy.finale,
    href: "#finale-title",
    progress: () => finaleSharedProgress(0.9),
    el: () => document.querySelector(".finale"),
  },
];

/** Which item is "where you are" right now. */
function currentItem() {
  const s = toVh(scrollState.smooth);
  if (finaleProgress(s) >= 0) return "finale";
  const i = activeStopAt(s);
  return i >= 0 ? SQUADS[i] : "home";
}

/** Scroll to an item: through the story (live) or to its section (static). */
function travelTo(item) {
  const html = document.documentElement;
  const max = html.scrollHeight - window.innerHeight;
  const live = html.dataset.world === "live";
  const el = item.el();
  const y = live ? item.progress() * max : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  const lenis = getLenis();
  if (!lenis || prefersReducedMotion()) {
    window.scrollTo(0, y); // reduced motion: instant
    return;
  }
  const fromVh = toVh(scrollState.progress);
  const toVhTarget = live ? item.progress() * TOTAL_SCROLL_VH : (y / Math.max(1, max)) * TOTAL_SCROLL_VH;
  const duration = Math.min(M.tripMax, Math.max(M.tripMin, M.tripMin + Math.abs(toVhTarget - fromVh) * M.tripPerVh));
  scrollState.travel = true;
  lenis.scrollTo(y, {
    duration,
    easing: gsap.parseEase(ease.inOut), // the shared ease, as a function
    force: true,
    onComplete: () => (scrollState.travel = false),
  });
}

export default function Menu() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("home");
  const button = useRef(null);
  const overlay = useRef(null);
  const anim = useRef(null);
  const pendingTrip = useRef(null);

  // Button tone follows the background (like the HUD) while the menu is closed.
  useEffect(() => {
    let last = "";
    const tick = () => {
      const s = toVh(scrollState.smooth);
      const live = document.documentElement.dataset.world === "live";
      const tone = live && whitenessAt(s) > 0.5 ? "light" : "dark";
      if (tone !== last && button.current) button.current.dataset.tone = last = tone;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const lock = useCallback((on) => {
    const html = document.documentElement;
    const main = document.querySelector("main");
    const lenis = getLenis();
    if (main) main.inert = on; // page behind: not clickable, not focusable
    html.style.overflow = on ? "hidden" : "";
    if (lenis) on ? lenis.stop() : lenis.start();
  }, []);

  // Open / close animation.
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
      if (reduced) {
        tl.fromTo(el, { opacity: 0, clipPath: "none" }, { opacity: 1, duration: M.open, ease: ease.out });
      } else {
        tl.fromTo(el, { opacity: 1, clipPath: circle(0) }, { clipPath: circle(radius), duration: M.open, ease: ease.inOut });
        tl.fromTo(
          items,
          { opacity: 0, yPercent: 60 },
          { opacity: 1, yPercent: 0, duration: M.open, ease: ease.out, stagger: M.itemStagger },
          M.open * 0.35
        );
      }
      // Focus the current item (or the first) once it is on screen.
      tl.call(() => (el.querySelector('.menu-item[aria-current="true"]') ?? items[0])?.focus(), [], 0.05);
      anim.current = tl;
    } else if (el.style.visibility === "visible") {
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.visibility = "hidden";
          lock(false);
          const trip = pendingTrip.current;
          pendingTrip.current = null;
          if (trip) travelTo(trip);
        },
      });
      if (reduced) tl.to(el, { opacity: 0, duration: M.close, ease: ease.out });
      else tl.to(el, { clipPath: circle(0), duration: M.close, ease: ease.inOut });
      btn.focus({ preventScroll: true }); // focus goes back to the button
      anim.current = tl;
    }
  }, [open, lock]);

  // Escape closes; Tab stays inside (the button + the items).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = [button.current, ...overlay.current.querySelectorAll(".menu-item")];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
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

  const choose = (e, item) => {
    e.preventDefault(); // we travel through the story instead of jumping to the anchor
    pendingTrip.current = item;
    setOpen(false);
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className="menu-button"
        data-tone="dark"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? copy.close : copy.open}
        onClick={toggle}
      >
        <span className="menu-line" aria-hidden="true" />
        <span className="menu-line" aria-hidden="true" />
      </button>
      <div
        ref={overlay}
        id="site-menu"
        className="menu-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
      >
        <nav aria-label={copy.title}>
          <ol className="menu-list">
            {ITEMS.map((item, k) => (
              <li key={item.id}>
                <a
                  className="menu-item"
                  href={item.href}
                  aria-current={current === item.id ? "true" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={(e) => choose(e, item)}
                >
                  <span className="menu-num" aria-hidden="true">
                    {pad(k)}
                  </span>
                  {item.squad ? (
                    <Emblem squad={item.squad} className="menu-emblem" />
                  ) : (
                    <Image
                      className="menu-emblem menu-mark"
                      src={brand.mark}
                      width={brand.markSize[0]}
                      height={brand.markSize[1]}
                      alt=""
                      aria-hidden="true"
                      unoptimized
                    />
                  )}
                  <span className="menu-label">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </>
  );
}
