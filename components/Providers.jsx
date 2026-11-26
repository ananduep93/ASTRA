"use client";

/**
 * Client-side engine. Sets up:
 *  - GSAP + ScrollTrigger (registered once)
 *  - Lenis smooth scroll, driven by gsap.ticker (no extra requestAnimationFrame loop)
 *  - the shared scroll value in lib/scrollStore.js (real scroll + paced scene progress)
 * With prefers-reduced-motion, Lenis is off and native scrolling is used.
 */
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { scrollConfig, scrollSmoothing, touchScroll, pacing, REDUCED_MOTION_QUERY, TOUCH_QUERY } from "@/lib/motion";
import { setLenis, writeScroll, stepSmooth } from "@/lib/scrollStore";

// Register once per page load. Guarded so it never runs on the server.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export default function Providers({ children }) {
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    let teardown = () => {};

    function startSmooth() {
      const lenis = new Lenis({
        autoRaf: false, // gsap.ticker drives it below
        lerp: scrollConfig.lerp,
        wheelMultiplier: scrollConfig.wheelMultiplier,
        touchMultiplier: scrollConfig.touchMultiplier,
        syncTouch: false, // never take over touch: phones keep their own native scrolling
      });
      setLenis(lenis);

      lenis.on("scroll", ScrollTrigger.update);
      writeScroll(lenis.animatedScroll, lenis.limit, 0);

      // Guided pace: the scene follows the real scroll, capped at pacing.maxPerSecond
      // (wheel and touch alike). Touch keeps its slightly calmer damping.
      const touch = window.matchMedia(TOUCH_QUERY);
      const tick = (time, deltaMs) => {
        lenis.raf(time * 1000); // gsap.ticker gives seconds; Lenis wants milliseconds
        // Read every frame (not only on scroll) so a page-height change is picked up too.
        writeScroll(lenis.animatedScroll, lenis.limit, lenis.velocity);
        const dt = Math.min(deltaMs / 1000, scrollSmoothing.maxDelta);
        stepSmooth(dt, touch.matches ? touchScroll.damping : scrollSmoothing.damping, pacing.maxPerSecond);
      };
      // prioritize = true: Lenis runs first each frame, so the 3D scene and
      // DOM read this frame's scroll value, not last frame's.
      gsap.ticker.add(tick, false, true);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33); // GSAP default
        lenis.destroy();
        setLenis(null);
      };
    }

    function startNative() {
      const read = () => {
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        writeScroll(window.scrollY, limit, 0);
      };
      read();
      window.addEventListener("scroll", read, { passive: true });
      window.addEventListener("resize", read);
      // Reduced motion: no glide and no pacing, the scene just equals the real scroll.
      const tick = () => {
        read();
        stepSmooth(1, 1e6);
      };
      gsap.ticker.add(tick, false, true);
      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("scroll", read);
        window.removeEventListener("resize", read);
      };
    }

    function start() {
      teardown();
      teardown = mq.matches ? startNative() : startSmooth();
      ScrollTrigger.refresh();
    }

    start();
    mq.addEventListener("change", start); // user toggles the OS setting live

    // Runs on unmount, and between React strict mode's double mount in dev,
    // so there is never more than one Lenis or ticker callback alive.
    return () => {
      mq.removeEventListener("change", start);
      teardown();
    };
  }, []);

  return children;
}
