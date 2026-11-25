/**
 * Shared motion config. Every animation (GSAP tweens, CSS transitions, the 3D
 * camera) takes its easing, duration and stagger from here. Values come from
 * lib/theme.js so there is only one source.
 */
import { eases, durations, staggers } from "./theme";

// GSAP-ready names: gsap.to(el, { ease: ease.out, duration: duration.base })
export const ease = Object.fromEntries(Object.entries(eases).map(([k, v]) => [k, v.gsap]));
export const cssEase = Object.fromEntries(Object.entries(eases).map(([k, v]) => [k, v.css]));
export const duration = durations;
export const stagger = staggers;

// Smooth-scroll feel (Lenis). lerp = how much of the remaining distance is
// covered each frame: lower is smoother and floatier.
export const scrollConfig = {
  lerp: 0.1,
  wheelMultiplier: 1,
  touchMultiplier: 1, // touch stays native on phones (Lenis default)
};

// Shared scroll value smoothing (used by both the DOM and the 3D scene).
export const scrollSmoothing = {
  damping: 8, // how fast the smoothed value catches the real one (higher = snappier)
  maxDelta: 0.1, // cap per-frame time (s) so a tab switch never causes a jump
};

/**
 * HERO: on load the stars assemble "ASTRA 2027" by themselves (time-based
 * intro). Scroll then takes over from the assembled state: hold, camera flies
 * through, background inverts, arrive at Arts.
 * Timeline ranges are [start, end] in shared scroll progress (0 = top, 1 = bottom).
 * Speeds are per SECOND (time-based: 60Hz and 120Hz screens look the same).
 */
export const hero = {
  scrollLengthVh: 400, // total page length for the hero sequence

  intro: {
    duration: 2.5, // seconds for the stars to assemble ASTRA 2027 on load
    fadeIn: 0.8, // seconds for the stars to fade in at the start of the intro
    skipFadeIn: 0.35, // reloaded mid-page: no intro, dots just fade in at the right state
    skipAbove: 0.01, // scroll progress above which a reload skips the intro
    redIn: [0.7, 1.0], // share of the intro over which the red accents appear
    shimmerIn: [0.75, 1.0], // share of the intro over which the shimmer starts
  },

  timeline: {
    hold: [0.0, 0.1], // assembled letters hold (scrolling here also finishes the intro)
    shimmerOut: [0.06, 0.16], // shimmer stops as the camera starts to push
    camera: [0.1, 1.0], // one eased camera move: through the letters, on to Arts
    stream: [0.1, 0.55], // letters dissolve and stream past the camera
    invert: [0.28, 0.55], // background black -> white, opening from the centre
    arrive: [0.55, 0.9], // Arts cluster gathers in the distance as the camera approaches; label fades in
  },

  particles: {
    ambientEvery: 8, // every 8th particle stays a background star (~12%)
    redEvery: 25, // every 25th letter particle turns red (~4%)
    size: 0.03, // world units; letters
    starSize: 0.024, // world units; background stars
    redSize: 0.05, // world units; red accents read a touch bigger
    maxPointPx: 24, // cap for points very close to the camera
  },

  scatter: {
    near: 5, // closest scattered star to the start camera (world units)
    far: 40, // furthest
    letterSize: 0.55, // letter particles are this much smaller while scattered...
    letterAlpha: 0.5, // ...and this much dimmer, so the opening sky stays calm
  },

  path: {
    stagger: 0.35, // share of the form range used to stagger particle departures
    curl: 0.9, // sideways bow on the way to the letter (world units)
    swirl: 1.4, // radians of spiral on the way in
  },

  idle: {
    driftAmp: 0.05, // world units the scattered stars float
    driftSpeed: 0.12, // radians per second of that float (one cycle ~ 52s)
    shimmerAmp: 0.012, // world units the assembled letters shimmer
    shimmerSpeed: 1.6, // radians per second of the shimmer
  },

  stream: {
    spread: 5, // how far letters scatter outward as the camera passes
    depth: 16, // how far they rush toward / past the camera
  },

  camera: { fov: 50, startZ: 10, endZ: -16 },
  fog: { near: 12, far: 55 }, // points fade out between these distances

  arts: {
    z: -22, // where the Arts cluster sits (camera ends 6 units in front)
    radius: 1.2,
    size: 0.1,
    spin: 0.02, // radians per second, very slow
  },

  resampleDebounceMs: 200, // re-sample letter shapes this long after a resize
};

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
