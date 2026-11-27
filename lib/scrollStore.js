/**
 * The ONE shared scroll value.
 *
 * Providers.jsx writes it on every tick; the DOM and the 3D canvas read it
 * inside gsap.ticker / useFrame. It is a plain mutable object (not React
 * state) on purpose: reading it never causes a React re-render, so it is free
 * to use 60+ times a second.
 *
 * Two values:
 *  - `progress` is the REAL scroll position (0..1 of the page). The page
 *    scrolls natively and instantly; nothing is hijacked.
 *  - `smooth` is the SCENE progress (0..1 of the story: hero + finale; the
 *    programs section is a hold, see lib/journey.js), what the canvas and the
 *    story text read. Each frame it follows a goal from lib/journey.js
 *    sceneGoal() with time-based damping and a speed cap, so a hard flick can
 *    never race through the story.
 * A menu jump plays a scripted, eased scene "trip" instead (startTrip), at a
 * higher speed for that move only.
 */
export const scrollState = {
  progress: 0, // real: 0 at the top of the page, 1 at the very bottom
  smooth: 0, // scene progress: damped, speed-capped copy of progress; what animations read
  velocity: 0, // pixels per frame, signed (+ = scrolling down)
  scroll: 0, // current scroll position in px
  limit: 0, // max scroll position in px
  target: 0, // scene progress the scene is heading to this frame (sceneGoal)
};

let lenisInstance = null;
let snapNext = true; // the first goal (e.g. page reloaded halfway down) is taken at once, no glide
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
}

/** Jump the scene to where it belongs (no glide) on the next step, e.g. when a reload skips the intro. */
export function snapSmooth() {
  trip = null;
  snapNext = true;
}

/**
 * Advance the scene by `dt` seconds. Called once per frame with the goal from
 * lib/journey.js sceneGoal(): { target, cap } (progress, progress per second),
 * or null while the page layout is not known yet (the scene waits).
 * Damped follow toward the target, the step capped to `cap * dt`: the scene
 * never moves faster than that whatever the scroll does. Time-based: the same
 * on 60 Hz and 120 Hz screens.
 */
export function stepSmooth(dt, damping, goal) {
  if (trip) {
    // A menu trip is playing: an eased move from where the scene was to the target.
    trip.elapsed += dt;
    const t = Math.min(1, trip.elapsed / trip.duration);
    scrollState.smooth = trip.from + (trip.to - trip.from) * trip.ease(t);
    if (t >= 1) trip = null;
    return;
  }
  if (!goal) return;
  scrollState.target = goal.target;
  if (snapNext) {
    snapNext = false;
    scrollState.smooth = goal.target;
    return;
  }
  // Frame-rate independent exponential damping (same maths as THREE.MathUtils.damp).
  const k = 1 - Math.exp(-damping * dt);
  let step = (goal.target - scrollState.smooth) * k;
  const cap = goal.cap * dt;
  if (step > cap) step = cap;
  else if (step < -cap) step = -cap;
  scrollState.smooth += step;
}

/**
 * Play the scene to `to` (progress 0..1) over `duration` seconds with `ease`
 * (a 0..1 -> 0..1 function, the shared ease). Used for menu / keyboard jumps,
 * together with lenis.scrollTo of the same duration, so the move feels like
 * travelling, not teleporting. Afterwards the normal paced follow resumes.
 */
export function startTrip(to, duration, ease) {
  trip = { from: scrollState.smooth, to, duration: Math.max(0.01, duration), elapsed: 0, ease };
}

/** True while a menu trip is playing (for tests / debug). */
export const tripActive = () => !!trip;

/** Smoothly map `v` from [a, b] to 0..1 (clamped, eased at both ends). */
export function rangeSmooth(v, [a, b]) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Linearly map `v` from [a, b] to 0..1 (clamped). */
export function rangeLinear(v, [a, b]) {
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}
