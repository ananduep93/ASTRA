/**
 * Quality tier detection: "low" | "mid" | "high", or "none" when WebGL is
 * unavailable. Browser-only (call it from client components after mount).
 *
 * Override for testing with ?quality=low|mid|high in the URL.
 */

export const TIERS = {
  low: { dpr: 1, antialias: false, particles: 2500, arts: 160 },
  mid: { dpr: [1, 1.5], antialias: false, particles: 7000, arts: 220 }, // phones: DPR max 1.5
  high: { dpr: [1, 2], antialias: false, particles: 14000, arts: 300 }, // points need no MSAA
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
