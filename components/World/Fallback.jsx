"use client";

// Static stand-in for the 3D canvas (reduced motion or WebGL failure).
// Black field with a sparse, static white dot pattern. No animation.
// It also marks the page as static so the real <h1> becomes visible.
import { useEffect } from "react";

export default function Fallback() {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.world = "static";
    return () => {
      if (html.dataset.world === "static") delete html.dataset.world;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-world="fallback"
      className="pointer-events-none fixed inset-0 z-0 bg-ink"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--astra-white) 70%, transparent) 0 1px, transparent 1.5px)," +
          "radial-gradient(circle at 70% 80%, color-mix(in srgb, var(--astra-white) 45%, transparent) 0 1px, transparent 1.5px)," +
          "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--astra-white) 25%, transparent) 0 0.8px, transparent 1.2px)",
        backgroundSize: "140px 140px, 220px 220px, 90px 90px",
      }}
    />
  );
}
