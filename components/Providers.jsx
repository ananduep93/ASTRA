"use client";

/**
 * Client-side engine. Sets up:
 *  - GSAP + ScrollTrigger (registered once)
 *  - Lenis smooth scroll, driven by gsap.ticker (no extra requestAnimationFrame loop)
 *  - the shared scroll value (lib/scrollStore.js): the real scroll position and
 *    the PACED scene progress every animation reads (speed limiter in lib/motion.js)
 * With prefers-reduced-motion, Lenis is off, native scrolling is used and there is no pacing.
 */
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { scrollConfig, scrollSmoothing, touchScroll, pacing, REDUCED_MOTION_QUERY, TOUCH_QUERY } from "@/lib/motion";
import { setLenis, writeScroll, stepSmooth, snapSmooth } from "@/lib/scrollStore";
import { TOTAL_VH } from "@/lib/issue";

// Register once per page load. Guarded so it never runs on the server.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
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
        syncTouch: false, // phones keep their own native scrolling
      });
      setLenis(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      writeScroll(lenis.animatedScroll, lenis.limit, 0);

      const touch = window.matchMedia(TOUCH_QUERY);
      const started = performance.now();
      const tick = (time, deltaMs) => {
        lenis.raf(time * 1000); // gsap.ticker gives seconds; Lenis wants milliseconds
        writeScroll(lenis.animatedScroll, lenis.limit, lenis.velocity);
        // Reloaded mid-page: the browser restores the scroll a moment after load; follow it at once.
        if (performance.now() - started < scrollSmoothing.settleOnLoad * 1000) {
          snapSmooth();
          return;
        }
        const dt = Math.min(deltaMs / 1000, scrollSmoothing.maxDelta);
        // Speed limiter: story vh per second -> progress per second.
        const cap = pacing.maxVhPerSecond / TOTAL_VH;
        stepSmooth(dt, touch.matches ? touchScroll.damping : scrollSmoothing.damping, cap);
      };
      // prioritize = true: runs first each frame, so every animation reads this frame's value.
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
      // Reduced motion: no glide and no pacing, the scene equals the real scroll.
      const tick = () => {
        read();
        snapSmooth();
      };
      gsap.ticker.add(tick, false, true);
      return () => gsap.ticker.remove(tick);
    }

    function start() {
      teardown();
      teardown = mq.matches ? startNative() : startSmooth();
      ScrollTrigger.refresh();
    }

    start();
    mq.addEventListener("change", start); // user toggles the OS setting live

    // Runs on unmount, and between React strict mode's double mount in dev.
    return () => {
      mq.removeEventListener("change", start);
      teardown();
    };
  }, []);

  return children;
}
