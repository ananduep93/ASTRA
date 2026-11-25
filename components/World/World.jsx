"use client";

/**
 * Picks the quality tier, then shows either the WebGL scene or the static
 * fallback. three.js is only downloaded when the scene is actually used.
 *
 * Static (no canvas) when WebGL is missing/crashes or the visitor prefers
 * reduced motion: the DOM headline then stays visible as plain text.
 */
import { Component, Suspense, lazy, useState } from "react";
import { detectQuality } from "@/lib/quality";
import { prefersReducedMotion } from "@/lib/motion";
import Fallback from "./Fallback";

const Scene = lazy(() => import("./Scene"));

// If WebGL crashes mid-session (driver issue, context lost), show the fallback.
class SceneErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

const readDebug = () => new URLSearchParams(window.location.search).get("debug") === "1";

export default function World() {
  // This file never renders on the server, so reading the browser here is safe.
  const [tier] = useState(() => (prefersReducedMotion() ? "none" : detectQuality()));
  const [debug] = useState(readDebug);

  if (tier === "none") return <Fallback />;

  return (
    <SceneErrorBoundary>
      <Suspense fallback={null}>
        <Scene tier={tier} debug={debug} />
      </Suspense>
    </SceneErrorBoundary>
  );
}
