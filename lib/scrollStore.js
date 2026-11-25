/**
 * The ONE shared scroll value.
 *
 * Providers.jsx writes it on every tick; the DOM and the 3D canvas read it
 * inside gsap.ticker / useFrame. It is a plain mutable object (not React
 * state) on purpose: reading it never causes a React re-render, so it is free
 * to use 60+ times a second.
 *
 * Use `smooth` for anything visual: it is `progress` with time-based damping,
 * so DOM and 3D move together and never jerk (even with native touch scroll).
 */
export const scrollState = {
  progress: 0, // raw: 0 at the top of the page, 1 at the very bottom
  smooth: 0, // damped copy of progress; what animations read
  velocity: 0, // pixels per frame, signed (+ = scrolling down)
  scroll: 0, // current scroll position in px
  limit: 0, // max scroll position in px
};

let lenisInstance = null;
let smoothReady = false;

export function setLenis(lenis) {
  lenisInstance = lenis;
}

/** The active Lenis instance, or null (reduced motion / not mounted yet). */
export function getLenis() {
  return lenisInstance;
}

/** Update the raw value. Guards against a page shorter than the screen. */
export function writeScroll(scroll, limit, velocity = 0) {
  scrollState.scroll = scroll;
  scrollState.limit = limit;
  scrollState.velocity = velocity;
  scrollState.progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
  if (!smoothReady) {
    // First reading (e.g. page reloaded halfway down): start there, no glide.
    scrollState.smooth = scrollState.progress;
    smoothReady = true;
  }
}

/** Jump the smoothed value to the real one (no glide), e.g. when skipping the intro. */
export function snapSmooth() {
  scrollState.smooth = scrollState.progress;
}

/**
 * Advance the smoothed value by `dt` seconds. Called once per frame.
 * `maxPerSecond` caps how fast it may move (progress per second), so a hard
 * fling can never jump the sequence; it just catches up calmly.
 */
export function stepSmooth(dt, damping, maxPerSecond = Infinity) {
  // Frame-rate independent exponential damping (same maths as THREE.MathUtils.damp).
  const k = 1 - Math.exp(-damping * dt);
  let step = (scrollState.progress - scrollState.smooth) * k;
  const cap = maxPerSecond * dt;
  if (step > cap) step = cap;
  else if (step < -cap) step = -cap;
  scrollState.smooth += step;
}

/** Smoothly map `v` from [a, b] to 0..1 (clamped, eased at both ends). */
export function rangeSmooth(v, [a, b]) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Linearly map `v` from [a, b] to 0..1 (clamped). */
export function rangeLinear(v, [a, b]) {
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}
