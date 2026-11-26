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
  // Page scroll length on touch vs desktop (1 = same as desktop). 1.2 = 20% more finger
  // travel for the same story. Was 1.6, which felt too slow on a real phone.
  lengthMultiplier: 1.2,
  // How fast the story catches up with the finger (higher = more responsive). Desktop is 8.
  // Was 4 (twice the desktop smoothing); 6 halves that extra smoothing so swipes feel responsive.
  damping: 6,
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
 * (Arts, Tech, Gaming, Business, Fun). Distances are in vh of scrolling
 * (desktop; touch screens multiply the page by touchScroll.lengthMultiplier).
 *
 * Each stop = intro (camera arrives, squad name) + one segment per program
 * (that program is "in focus") + outro (camera leaves). A stop with 6
 * programs is longer than one with 2. Ranges below are fractions [start, end]
 * of the intro, of ONE program segment, or of the outro.
 */
export const journey = {
  heroVh: 300, // scroll from the top until the camera arrives at Arts
  introVh: 80, // per stop: camera finishes arriving, squad name rises
  programVh: 120, // per program: arrive, hold, leave
  outroVh: 60, // per stop: last shape disperses, camera starts to leave

  intro: {
    head: [0.35, 0.75], // squad name + briefing rise in
    field: [0.3, 0.8], // the dot cloud fades in where the shapes will form
    morph: 0.45, // the cloud starts gathering into the first program's shape
  },
  program: {
    arriveEnd: 0.35, // the shape has fully formed by here...
    reveal: [0.2, 0.4], // name, counter and Details rise in (line by line)
    hold: 0.55, // ...the middle of the hold (used to scroll a program into focus)
    hide: [0.75, 0.9], // text falls away
    leaveStart: 0.75, // the shape starts morphing into the next one
  },
  outro: {
    head: [0.0, 0.3], // squad name falls away
    morph: 0.5, // the last shape has dispersed back into a cloud by here
    field: [0.3, 0.8], // the cloud fades out
    cameraLeaves: 0.3, // the glide to the next stop starts here
  },
  cameraArrives: 0.6, // ...and lands at this point of the next stop's intro

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
    hazeSize: 0.02, // loose points around each squad (glow red at the active squad)
    hazeRadius: 1.8, // how far the haze spreads
    drift: 0.015, // world units the haze floats (time-based, very small)
  },

  // The program shapes: one point cloud that morphs from shape to shape.
  field: {
    size: 0.024, // world units per dot
    redEvery: 25, // every 25th dot is the red accent (~4%)
    stagger: 0.3, // share of each morph used to stagger dots (so they don't all move at once)
    cloudRadius: 1.3, // the loose cloud the shapes gather from / disperse into
    framePadding: 0.06, // empty margin inside the shape area
  },

  // How the dots travel between shapes: one personality per squad.
  signatures: {
    Arts: { curl: 0.35, swirl: 5 }, // curling ink-like flow
    Tech: { grid: 0.14 }, // snap to a grid while a scan line sweeps across
    Gaming: { jitter: 0.5, pixel: 0.12, steps: 6 }, // blocky pixel glitch
    Business: { stagger: 0.5 }, // drop to a baseline, then rise like bars, left to right
    Fun: { burst: 1.2, fall: 0.9 }, // confetti bursts out, falls and settles
  },

  ambient: { spreadX: 18, spreadY: 11, nearZ: -24, farZ: -175 }, // background stars along the route (and the finale)
};

/**
 * OPENING TRANSMISSION: time-based, plays once per page load after the hero
 * stars have formed ASTRA 2027. A line types in under the headline, then the
 * logo crosses the screen as a comet and settles top left as the HUD mark.
 * Skipped (mark shown at once) when the page is reloaded mid-scroll.
 */
export const transmission = {
  delay: 0.25, // seconds after the headline has formed
  cometStart: 0.4, // seconds after the line finishes typing
  cometDuration: durations.epic * 1.2, // seconds for the crossing
  cometScale: 2.6, // the comet starts this many times the size of the HUD mark
  trailDots: 18, // points in the fading trail
  trailGap: 0.028, // path distance between trail points (0..1 of the crossing)
  trailRedEvery: 4, // every 4th trail point is the red accent
  lineFade: [0.03, 0.1], // hero progress over which the line fades as you scroll on
};

/**
 * FINALE: after the Fun stop. The camera glides to an open spot of sky; the
 * dots appear as five clouds, each forms its squad's emblem, then all of them
 * travel in and form the ASTRA logo. A comet streak sweeps through, the line
 * and the call to action rise. Ranges are fractions [start, end] of `vh`.
 */
export const finale = {
  vh: 300, // scroll length of the finale
  center: [0, 1, -150], // world position of the logo
  tone: 0, // background: black world
  cameraArrives: 0.12, // the glide from Fun lands here
  field: [0.03, 0.12], // the five clouds fade in
  emblems: [0.08, 0.2], // clouds -> five emblems (formed by 0.2, held until the merge)
  merge: [0.32, 0.6], // emblems -> logo
  sweep: [0.64, 0.78], // comet streak through the logo
  line: [0.7, 0.82], // "Five squads. One sky." rises
  cta: [0.78, 0.88], // call to action appears
  size: 0.026, // dot size (a touch bigger than program shapes, so the logo reads on phones)
  stagger: 0.35, // share of each morph used to stagger the dots
  emblemPath: [0.22, 4], // [curl, swirl] while the emblems form (same shader as the Arts signature)
  mergePath: [0.4, 6], // [curl, swirl] while everything travels into the logo
  cloudRadius: 0.35, // size of each squad's starting cloud, as a share of its emblem slot
};

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
