/**
 * Device tier: "low" | "full". Browser-only (call after mount).
 *
 * Low-end devices get THE SAME issue with fewer animations (fades instead of
 * skewed wipes and zooms), never a different design.
 * Override for testing with ?quality=low|full in the URL.
 */
export const TIERS = {
  low: { wipes: false, zoom: false },
  full: { wipes: true, zoom: true },
};

export function detectQuality() {
  if (typeof window === "undefined") return "full";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced && forced in TIERS) return forced;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4; // GB, Chrome only
  return cores <= 4 || memory <= 2 ? "low" : "full";
}
