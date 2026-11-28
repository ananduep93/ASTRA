/**
 * Live numbers for the ?perf=1 overlay (components/Debug/PerfOverlay.jsx). The
 * scene writes them; nothing else reads them. Plain object: no re-renders.
 */
export const perfStats = { tier: "-", particles: 0, drawn: 0 };

/** True when the page was opened with ?perf=1. Safe on the server. */
export const perfEnabled = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).get("perf") === "1";
