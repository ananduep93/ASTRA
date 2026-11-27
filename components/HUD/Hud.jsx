"use client";

/**
 * The HUD: a fixed, click-through frame over the whole story.
 *  - thin corner brackets
 *  - the logo mark top left (the opening comet lands here)
 *  - status top right: signal, then "Mission briefing", "Mission files" in the
 *    programs, "All squads: ..." in the finale
 *  - a slim progress line on the right edge, with one tick per part of the
 *    story (an ordered list for screen readers: "Programs, 2 of 3")
 *  - decorative coordinates bottom left (wide screens only), from scroll progress
 *  - a thin "syncing" line under the status while the scene is catching up
 *    with a fast scroll (guided pace, lib/motion.js `pacing`)
 * Colours flip with the background through data-tone + theme variables.
 * Everything updates from gsap.ticker; nothing re-renders. Hidden in static mode.
 */
import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { hudStatus, menu as LABELS } from "@/data/story";
import { brand } from "@/lib/theme";
import { ease, duration, finale as FIN, pacing } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { storyStatus } from "@/lib/storyStatus";
import { toVh, toProgress, whitenessAt, finaleProgress, partAt, onLayout, HERO_END, finaleStartVh } from "@/lib/journey";
import { briefing as BRF, journey as J } from "@/lib/motion";

/** The parts of the story marked on the progress line, and where each starts (story vh). */
const PARTS = [
  { id: "briefing", label: LABELS.briefing, at: () => BRF.splitAt * J.heroVh },
  { id: "programs", label: LABELS.programs, at: () => HERO_END },
  { id: "finale", label: LABELS.finale, at: () => finaleStartVh() },
];

const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, "0");

/** Decorative sky coordinates from progress (not real data). */
function coords(p) {
  const ra = p * 24; // hours
  const dec = -30 + p * 60; // degrees
  const m = (ra % 1) * 60;
  const dm = (Math.abs(dec) % 1) * 60;
  return `RA ${pad(ra)}h ${pad(m)}m · DEC ${dec < 0 ? "−" : "+"}${pad(Math.abs(dec))}° ${pad(dm)}′`;
}

function statusAt(s) {
  const part = partAt(s);
  if (part === "finale") return finaleProgress(s) >= FIN.merge[1] ? hudStatus.online : hudStatus.inbound;
  if (part === "programs") return hudStatus.programs;
  if (part === "briefing") return hudStatus.briefing;
  const t = storyStatus.transmission;
  return t === "waiting" || t === "typing" ? hudStatus.searching : hudStatus.detected;
}

export default function Hud() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const status = el.querySelector(".hud-status");
    const mark = el.querySelector(".hud-mark");
    const fill = el.querySelector(".hud-rail-fill");
    const rail = el.querySelector(".hud-rail");
    const ticks = [...el.querySelectorAll(".hud-tick")];
    const coordEl = el.querySelector(".hud-coords");
    const sync = el.querySelector(".hud-sync");
    let lastSync = -1;

    // Each part's tick sits where it starts on the progress line (moves when the programs section resizes).
    const placeTicks = () => ticks.forEach((t, i) => t.style.setProperty("--at", String(toProgress(PARTS[i].at()))));
    placeTicks();
    const offLayout = onLayout(placeTicks);

    let shown = false;
    let markShown = false;
    let lastStatus = "";
    let lastTone = "";
    let lastActive = -2;
    let lastCoords = "";
    let lastFill = -1;

    const tick = () => {
      const t = storyStatus.transmission;
      if (!shown && t !== "waiting" && t !== "typing") {
        shown = true; // the frame appears as the comet launches (or at once when skipped)
        gsap.to(el, { opacity: 1, duration: duration.base, ease: ease.out });
      }
      if (!markShown && (t === "done" || t === "skipped")) {
        markShown = true;
        gsap.to(mark, { opacity: 1, duration: t === "done" ? 0.01 : duration.base, ease: ease.out });
      }

      const s = toVh(scrollState.smooth);
      const text = statusAt(s);
      if (text !== lastStatus) {
        lastStatus = text;
        status.textContent = text;
        gsap.fromTo(status, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: duration.fast, ease: ease.out, overwrite: true });
      }

      const tone = whitenessAt(s) > 0.5 ? "light" : "dark";
      if (tone !== lastTone) el.dataset.tone = lastTone = tone;

      const part = partAt(s);
      // CSS: no sky readout over the program cards (from the moment the section starts sliding in).
      const cards = String(part === "programs" || (part === "briefing" && s >= HERO_END - 100));
      if (el.dataset.cards !== cards) el.dataset.cards = cards;
      const a = PARTS.findIndex((item) => item.id === part);
      if (a !== lastActive) {
        ticks.forEach((m, i) => (i === a ? m.setAttribute("aria-current", "step") : m.removeAttribute("aria-current")));
        lastActive = a;
      }

      const p = Math.round(scrollState.smooth * 1000) / 1000;
      if (p !== lastFill) {
        lastFill = p;
        fill.style.transform = `scaleY(${p})`;
        rail.style.opacity = a >= 0 ? "1" : "0.5";
      }
      // Syncing: how far the scene is behind the real scroll position.
      const gap = Math.abs(scrollState.progress - scrollState.smooth);
      const g = gap < pacing.syncFrom ? 0 : Math.min(1, gap / pacing.syncFull);
      const gr = Math.round(g * 200) / 200;
      if (gr !== lastSync) {
        lastSync = gr;
        sync.style.transform = `scaleX(${Math.max(gr, 0.001)})`;
        sync.style.opacity = gr > 0 ? "1" : "0";
      }

      const c = coords(scrollState.smooth);
      if (c !== lastCoords) coordEl.textContent = lastCoords = c;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      offLayout();
    };
  }, []);

  return (
    <div ref={root} className="hud" data-tone="dark">
      <span className="hud-corner" data-corner="tl" aria-hidden="true" />
      <span className="hud-corner" data-corner="tr" aria-hidden="true" />
      <span className="hud-corner" data-corner="bl" aria-hidden="true" />
      <span className="hud-corner" data-corner="br" aria-hidden="true" />
      <Image
        className="hud-mark"
        src={brand.mark}
        width={brand.markSize[0]}
        height={brand.markSize[1]}
        alt=""
        aria-hidden="true"
        unoptimized
        priority
      />
      <p className="hud-status" aria-hidden="true">
        {hudStatus.searching}
      </p>
      <span className="hud-sync" aria-hidden="true" />
      <div className="hud-rail">
        <span className="hud-rail-fill" aria-hidden="true" />
        <ol className="hud-ticks" aria-label="Story progress">
          {PARTS.map((part, i) => (
            <li key={part.id} className="hud-tick">
              <span className="sr-only">
                {part.label}, {i + 1} of {PARTS.length}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="hud-coords" aria-hidden="true">
        {coords(0)}
      </p>
    </div>
  );
}
