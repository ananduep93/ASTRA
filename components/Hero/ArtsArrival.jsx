"use client";

/**
 * Arrival at the Arts squad (placeholder). Sits in the last screen of the page.
 *
 * Two stacked copies of the label: white (for black backgrounds) and black
 * (for the inverted white world). With the live canvas they crossfade with
 * the background inversion and fade in during "arrive"; without it, the
 * white copy simply shows. Opacity only, per the motion rules.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { hero } from "@/lib/motion";
import { scrollState, rangeSmooth } from "@/lib/scrollStore";

const isLive = () => document.documentElement.dataset.world === "live";

function Label({ tone, hidden }) {
  const Heading = hidden ? "p" : "h2";
  return (
    <div className={`arts-label ${tone === "dark" ? "text-ink" : "text-paper"}`} aria-hidden={hidden || undefined}>
      <Heading className="font-display text-h2 font-extrabold uppercase leading-none tracking-wide">
        Arts
      </Heading>
      <p className="mt-2xs text-body">Briefing TBA</p>
    </div>
  );
}

export default function ArtsArrival() {
  const light = useRef(null);
  const dark = useRef(null);

  useEffect(() => {
    const tick = () => {
      if (!light.current || !dark.current) return;
      if (!isLive()) {
        light.current.style.opacity = "1";
        dark.current.style.opacity = "0";
        return;
      }
      const p = scrollState.smooth;
      const reveal = rangeSmooth(p, hero.timeline.arrive);
      const inv = rangeSmooth(p, hero.timeline.invert);
      light.current.style.opacity = String(reveal * (1 - inv));
      dark.current.style.opacity = String(reveal * inv);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section aria-label="Arts squad" className="relative flex h-svh items-end justify-center px-gutter pb-xl text-center">
      <div className="relative">
        <div ref={light}>
          <Label tone="light" />
        </div>
        <div ref={dark} className="absolute inset-0" style={{ opacity: 0 }}>
          <Label tone="dark" hidden />
        </div>
      </div>
    </section>
  );
}
