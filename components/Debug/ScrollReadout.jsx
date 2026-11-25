"use client";

/**
 * Debug aid: shows the shared scroll progress in the corner, ONLY when the URL
 * has ?debug=1. Updates the text directly from gsap.ticker (no re-renders).
 */
import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { scrollState } from "@/lib/scrollStore";

const subscribe = () => () => {}; // the URL query does not change while viewing
const isDebug = () => new URLSearchParams(window.location.search).get("debug") === "1";
const notDebugOnServer = () => false; // server HTML never includes it: no hydration mismatch

export default function ScrollReadout() {
  const enabled = useSyncExternalStore(subscribe, isDebug, notDebugOnServer);
  const el = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (el.current) el.current.textContent = `scroll ${scrollState.progress.toFixed(3)}`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [enabled]);

  if (!enabled) return null;
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
