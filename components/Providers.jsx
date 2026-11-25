"use client";

/**
 * Client-side engine. Sets up:
 *  - GSAP + ScrollTrigger (registered once)
 *  - Lenis smooth scroll, driven by gsap.ticker (no extra requestAnimationFrame loop)
 *  - the shared scroll value in lib/scrollStore.js
 * With prefers-reduced-motion, Lenis is off and native scrolling is used.
 */
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { scrollConfig, REDUCED_MOTION_QUERY } from "@/lib/motion";
import { setLenis, writeScroll } from "@/lib/scrollStore";

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
      });
      setLenis(lenis);

      const onScroll = (l) => {
        ScrollTrigger.update();
        writeScroll(l.animatedScroll, l.limit, l.velocity);
      };
      lenis.on("scroll", onScroll);
      writeScroll(lenis.animatedScroll, lenis.limit, 0);

      // gsap.ticker gives seconds; Lenis wants milliseconds.
      const tick = (time) => lenis.raf(time * 1000);
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
      return () => {
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
