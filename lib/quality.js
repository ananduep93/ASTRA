/**
 * Quality tier detection: "low" | "mid" | "high", or "none" when WebGL is
 * unavailable. Browser-only (call it from client components after mount).
 *
 * particles = the hero dots AND the program-shape dots (each).
 * squadAmbient = points per squad in the ambient motion layer; streaks = transition lines.
 * "low" and "none" get the static page (no WebGL): plain stacked sections.
 * Override for testing with ?quality=low|mid|high in the URL.
 */

export const TIERS = {
  low: { webgl: false }, // static page
  mid: { webgl: true, dpr: [1, 1.5], antialias: false, particles: 7000, ambient: 900, haze: 90, squadAmbient: 700, streaks: 140 },
  high: { webgl: true, dpr: [1, 2], antialias: false, particles: 14000, ambient: 1800, haze: 160, squadAmbient: 1400, streaks: 240 },
};

function webglInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the test context
    return { renderer };
  } catch {
    return null;
  }
}

export function detectQuality() {
  if (typeof window === "undefined") return "mid";

  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced && forced in TIERS) return forced;

  const gl = webglInfo();
  if (!gl) return "none";

  // Software renderers draw WebGL on the CPU: treat them as low-end.
  if (/swiftshader|llvmpipe|software/i.test(gl.renderer)) return "low";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4; // GB, Chrome only
  const isMobile =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

  if (cores <= 4 || memory <= 2) return "low";
  if (isMobile) return "mid";
  return "high";
}
