"use client";

/**
 * The real <h1>ASTRA 2027</h1>. Always in the DOM (screen readers, SEO).
 *
 * - Static (no canvas): plain centred text in the first screen.
 * - Live canvas (html[data-world="live"]): it becomes fixed and fades to
 *   opacity 0 over "headlineFade" while the stars take over. It is never
 *   display:none, so it stays readable to assistive tech.
 *
 * The particle letters are sampled from these exact word boxes
 * ([data-hero-word]), so the stars assemble where the text was.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { hero } from "@/lib/motion";
import { scrollState, rangeSmooth } from "@/lib/scrollStore";

const isLive = () => document.documentElement.dataset.world === "live";

export default function HeroTitle() {
  const title = useRef(null);

  useEffect(() => {
    const tick = () => {
      if (!title.current) return;
      const fade = isLive() ? rangeSmooth(scrollState.smooth, hero.timeline.headlineFade) : 0;
      title.current.style.opacity = String(1 - fade);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section className="hero-stage h-svh">
      <div className="hero-title-wrap">
        <h1 ref={title} className="hero-title">
          <span className="hero-line">
            <span data-hero-word>ASTRA</span>
          </span>{" "}
          <span className="hero-line">
            <span data-hero-word>2027</span>
          </span>
        </h1>
      </div>
    </section>
  );
}
