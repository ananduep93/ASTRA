"use client";

/**
 * ?perf=1 only: a small live readout in the bottom-left corner.
 *   fps      frames in the last second
 *   worst    the longest frame of the last 2 seconds (ms)
 *   dots     dots drawn now / the tier's dot budget
 *   tier     the quality tier
 * Written straight to the DOM from one rAF loop (no React re-renders).
 */
import { useEffect, useRef, useSyncExternalStore } from "react";
import { perfStats, perfEnabled } from "@/lib/perf";

const noSubscribe = () => () => {};

export default function PerfOverlay() {
  const on = useSyncExternalStore(noSubscribe, perfEnabled, () => false);
  const el = useRef(null);

  useEffect(() => {
    if (!on) return undefined;
    const frames = []; // [time, delta]
    let last = performance.now();
    let raf = 0;
    let shown = 0;
    const loop = (t) => {
      frames.push([t, t - last]);
      last = t;
      while (frames.length && t - frames[0][0] > 2000) frames.shift();
      if (t - shown > 250 && el.current) {
        shown = t;
        const fps = frames.filter(([ft]) => t - ft <= 1000).length;
        const worst = Math.max(0, ...frames.map(([, d]) => d));
        el.current.textContent = `${fps} fps · worst ${Math.round(worst)} ms · dots ${perfStats.drawn}/${perfStats.particles} · ${perfStats.tier}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  return <div ref={el} className="perf-overlay" aria-hidden="true" />;
}
