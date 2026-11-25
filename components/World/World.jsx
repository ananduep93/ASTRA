"use client";

/**
 * Picks the quality tier, then shows either the WebGL scene or the plain CSS
 * fallback. three.js is only downloaded when the scene is actually used.
 */
import { Component, Suspense, lazy, useState } from "react";
import { detectQuality } from "@/lib/quality";
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

export default function World() {
  // This file never renders on the server, so reading the browser here is safe.
  const [tier] = useState(detectQuality);

  if (tier === "none" || tier === "low") return <Fallback />;

  return (
    <SceneErrorBoundary>
      <Suspense fallback={null}>
        <Scene tier={tier} />
      </Suspense>
    </SceneErrorBoundary>
  );
}
