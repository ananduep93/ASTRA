"use client";

/**
 * The HUD: a fixed, click-through frame over the whole story.
 *  - thin corner brackets
 *  - the logo mark top left (the opening comet lands here)
 *  - status top right: signal before the squads, "Squad Arts: online" at each
 *    stop, "All squads: ..." in the finale
 *  - a slim progress line on the right edge, with one tick per squad
 *    (an ordered list for screen readers: "Arts, 1 of 5")
 *  - decorative coordinates bottom left (wide screens only), from scroll progress
 *  - a thin "syncing" line under the status while the scene is catching up
 *    with a fast scroll (guided pace, lib/motion.js `pacing`)
 * Colours flip with the background through data-tone + theme variables.
 * Everything updates from gsap.ticker; nothing re-renders. Hidden in static mode.
 */
import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SQUADS } from "@/data/programs";
import { squadStatus, hudStatus } from "@/data/story";
import { brand } from "@/lib/theme";
import { ease, duration, finale as FIN, pacing } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { storyStatus } from "@/lib/storyStatus";
import { toVh, activeStopAt, whitenessAt, stopStartVh, finaleProgress, TOTAL_SCROLL_VH } from "@/lib/journey";

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
  const f = finaleProgress(s);
  if (f >= 0) return f >= FIN.merge[1] ? hudStatus.online : hudStatus.inbound;
  const stop = activeStopAt(s);
  if (stop >= 0) return squadStatus(SQUADS[stop]);
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

    // Each squad's tick sits where its stop starts on the progress line.
    ticks.forEach((t, i) => t.style.setProperty("--at", String(stopStartVh(i) / TOTAL_SCROLL_VH)));

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

      const active = activeStopAt(s);
      const inFinale = finaleProgress(s) >= 0;
      const a = inFinale ? -1 : active;
      if (a !== lastActive) {
        ticks.forEach((m, i) => (i === a ? m.setAttribute("aria-current", "step") : m.removeAttribute("aria-current")));
        lastActive = a;
      }

      const p = Math.round(scrollState.smooth * 1000) / 1000;
      if (p !== lastFill) {
        lastFill = p;
        fill.style.transform = `scaleY(${p})`;
        rail.style.opacity = active >= 0 || inFinale ? "1" : "0.5";
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
    return () => gsap.ticker.remove(tick);
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
        <ol className="hud-ticks" aria-label="Squad progress">
          {SQUADS.map((squad, i) => (
            <li key={squad} className="hud-tick">
              <span className="sr-only">
                {squad}, {i + 1} of {SQUADS.length}
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
