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
 * Touch devices (phones, tablets). Touch scrolling stays native (Lenis does
 * not take it over); we only make the page longer and the shared value calmer.
 * Detected with TOUCH_QUERY, the same media query used in globals.css.
 */
export const TOUCH_QUERY = "(pointer: coarse)";
export const touchScroll = {
  lengthMultiplier: 1.6, // page scroll length vs desktop (same story, more finger travel)
  damping: 4, // smoother than desktop's 8: the sequence trails the finger a little
  maxProgressPerSecond: 0.1, // a hard fling can't move the story more than 10% per second
};

/**
 * HERO: on load the stars assemble "ASTRA 2027" by themselves (time-based
 * intro). Scroll then takes over from the assembled state: hold, camera flies
 * through, background inverts, arrive at Arts.
 * Timeline ranges are [start, end] in HERO progress: 0 at the top of the page,
 * 1 when the camera arrives at Arts (after journey.heroVh of scrolling).
 * Speeds are per SECOND (time-based: 60Hz and 120Hz screens look the same).
 */
export const hero = {
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
    arrive: [0.55, 0.9], // Arts cluster gathers in the distance as the camera approaches
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

  camera: { fov: 50, startZ: 10 },
  fog: { near: 12, far: 55 }, // points fade out between these distances

  resampleDebounceMs: 200, // re-sample letter / roster positions this long after a resize
};

/**
 * SQUAD JOURNEY: after the hero, the same scroll travels through five stops
 * (Arts, Tech, Gaming, Business, Fun). Distances are in vh of scrolling.
 * Phase ranges are fractions [start, end] of ONE stop's scroll length.
 */
export const journey = {
  heroVh: 300, // scroll from the top until the camera arrives at Arts
  stopVh: 250, // scroll length of each squad stop

  phases: {
    arrive: [0.0, 0.3], // camera finishes gliding in from the previous stop
    reveal: [0.3, 0.5], // squad name, briefing and roster rise in (staggered)
    hide: [0.72, 0.8], // ...and fall away before the camera moves on
    leave: [0.8, 1.0], // camera starts gliding to the next stop
  },
  // Arts: the camera has already arrived at the end of the hero, so reveal at once.
  firstStop: { reveal: [0.0, 0.2] },

  toneSwap: [0.3, 0.7], // part of each glide during which the next background tone opens
  tones: [1, 0, 1, 0, 1], // background per stop: 1 = white world, 0 = black world

  // Cluster centres (world units). Arts sits where the hero flight ends.
  centers: [
    [0, 0, -22],
    [9, 3, -46],
    [-9, -2, -70],
    [8, -4, -94],
    [-6, 3, -118],
  ],
  viewDistance: 6, // the camera holds this far in front of each cluster
  arcLift: 2.5, // glides between stops bow upward by this much at their midpoint

  cluster: {
    starSize: 0.075, // program stars (world units)
    dustSize: 0.022, // small points swarming around each program star
    hazeSize: 0.02, // looser points around the whole roster
    swarmRadius: 0.22, // how far dust strays from its program star
    hazeRadius: 1.8, // how far the haze spreads around the roster
    drift: 0.015, // world units the dust floats (time-based, very small)
  },

  ambient: { spreadX: 18, spreadY: 11, nearZ: -24, farZ: -132 }, // background stars along the route
};

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
