"use client";

/**
 * TEMPORARY (phase 1 only): shows the shared scroll progress in the corner,
 * proving the DOM reads the same value as the 3D camera. Delete in phase 2.
 * Updates the text directly from gsap.ticker: no React re-renders.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { scrollState } from "@/lib/scrollStore";

export default function ScrollReadout() {
  const el = useRef(null);
  useEffect(() => {
    const tick = () => {
      if (el.current) el.current.textContent = `scroll ${scrollState.progress.toFixed(3)}`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <div
      ref={el}
      data-testid="scroll-readout"
      className="fixed bottom-sm right-gutter z-20 font-body text-small tabular-nums text-paper/70"
    >
      scroll 0.000
    </div>
  );
}
