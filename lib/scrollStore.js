/**
 * The ONE shared scroll value.
 *
 * Providers.jsx writes it on every tick; every animation reads it inside
 * gsap.ticker. A plain mutable object (not React state): reading it never
 * causes a React re-render.
 *
 *  - `progress` is the REAL scroll position (0..1). The page scrolls natively.
 *  - `smooth` is the SCENE progress, what every animation reads. It follows
 *    `progress` with time-based damping and a speed cap (lib/motion.js
 *    pacing), so a hard flick never races through the issue.
 * A menu jump plays a scripted, eased scene trip instead (startTrip).
 */
export const scrollState = {
  progress: 0, // real scroll: 0 at the top, 1 at the very bottom
  smooth: 0, // scene progress: what animations read
  velocity: 0,
  scroll: 0, // px
  limit: 0, // px
};

let lenisInstance = null;
let smoothReady = false;
let trip = null; // { from, to, duration, elapsed, ease } while a menu trip plays

export function setLenis(lenis) {
  lenisInstance = lenis;
}

/** The active Lenis instance, or null (reduced motion / not mounted yet). */
export function getLenis() {
  return lenisInstance;
}

/** Update the real value. Guards against a page shorter than the screen. */
export function writeScroll(scroll, limit, velocity = 0) {
  scrollState.scroll = scroll;
  scrollState.limit = limit;
  scrollState.velocity = velocity;
  scrollState.progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
  if (!smoothReady) {
    scrollState.smooth = scrollState.progress; // first reading: start there, no glide
    smoothReady = true;
  }
}

/** Jump the scene to the real position (reload mid-page, tests). */
export function snapSmooth() {
  trip = null;
  scrollState.smooth = scrollState.progress;
}

/**
 * Advance the scene by `dt` seconds: damped follow, then the step is capped
 * at `maxPerSecond * dt` (progress units). Time-based.
 */
export function stepSmooth(dt, damping, maxPerSecond = Infinity) {
  if (trip) {
    trip.elapsed += dt;
    const t = Math.min(1, trip.elapsed / trip.duration);
    scrollState.smooth = trip.from + (trip.to - trip.from) * trip.ease(t);
    if (t >= 1) trip = null;
    return;
  }
  const k = 1 - Math.exp(-damping * dt);
  let step = (scrollState.progress - scrollState.smooth) * k;
  const cap = maxPerSecond * dt;
  if (step > cap) step = cap;
  else if (step < -cap) step = -cap;
  scrollState.smooth += step;
}

/** Play the scene to `to` (0..1) over `duration` s with `ease` (0..1 -> 0..1). Menu jumps. */
export function startTrip(to, duration, ease) {
  trip = { from: scrollState.smooth, to, duration: Math.max(0.01, duration), elapsed: 0, ease };
}

/** True while a menu trip is playing. */
export const tripActive = () => !!trip;
