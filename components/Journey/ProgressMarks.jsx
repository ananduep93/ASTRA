"use client";

/**
 * Five small marks showing which squad you are at ("Arts, 1 of 5" for screen
 * readers). Not links, not a menu. Fades in once the journey starts; its tone
 * follows the background. Hidden in static mode (the sections stack there).
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SQUADS } from "@/data/programs";
import { scrollState } from "@/lib/scrollStore";
import { toVh, activeStopAt, whitenessAt, phaseVh } from "@/lib/journey";

export default function ProgressMarks() {
  const list = useRef(null);

  useEffect(() => {
    const el = list.current;
    const marks = [...el.querySelectorAll("li")];
    const [a, b] = phaseVh(0, "reveal");
    let lastActive = -2;
    let lastTone = "";
    const tick = () => {
      const s = toVh(scrollState.smooth);
      el.style.opacity = String(Math.min(1, Math.max(0, (s - a) / (b - a))));
      const active = activeStopAt(s);
      if (active !== lastActive) {
        marks.forEach((m, i) => (i === active ? m.setAttribute("aria-current", "step") : m.removeAttribute("aria-current")));
        lastActive = active;
      }
      const tone = whitenessAt(s) > 0.5 ? "light" : "dark";
      if (tone !== lastTone) {
        el.dataset.tone = tone;
        lastTone = tone;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <ol ref={list} className="progress-marks" aria-label="Squad progress" data-tone="dark">
      {SQUADS.map((squad, i) => (
        <li key={squad} className="progress-mark">
          <span className="sr-only">
            {squad}, {i + 1} of {SQUADS.length}
          </span>
        </li>
      ))}
    </ol>
  );
}
