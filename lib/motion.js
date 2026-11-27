/**
 * Shared motion config. Every animation (GSAP tweens, CSS transitions, the 3D
 * camera) takes its easing, duration and stagger from here. Values come from
 * lib/theme.js so there is only one source.
 */
import { eases, durations, staggers, tones as TONE } from "./theme";

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
 * GUIDED PACE. The page scrolls freely, but the SCENE (canvas, text reveals,
 * HUD, menu state: everything that reads scrollState.smooth) plays back at
 * most this fast, so a hard flick can't race through the story unseen. It
 * catches up smoothly; the HUD shows a thin "syncing" line while it is behind.
 * Desktop and touch alike. Reduced motion: no pacing.
 */
export const pacing = {
  // Max scene speed in STORY vh per second (hero and finale). Given in vh, not as a
  // share of the page, so it stays the same whatever the page length: the hero
  // (journey.heroVh) takes at least ~9s, the finale (finale.vh) at least ~13s.
  maxVhPerSecond: 20,
  // The page is already past the star-iris (or back in the programs from the finale)
  // while the scene is not: it finishes the rest this fast (story vh/s; the whole
  // hero would take ~0.6s), so the programs never show over an unfinished transition.
  // The programs section itself is never paced: the scene holds there.
  catchUpVhPerSecond: 300,
  // Gap (scene progress) between where the scene is and where it belongs, above which the HUD shows "syncing".
  syncFrom: 0.004,
  syncFull: 0.08, // gap at which the syncing line is full width
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
  // (The scene speed cap is the same as desktop now: see `pacing` above.)
};

/**
 * HERO: on load the stars assemble "ASTRA 2027" by themselves (time-based
 * intro). Scroll then takes over from the assembled state: hold, camera flies
 * through, the star-iris turns the world white, and the flight ends exactly as
 * the white settles (the programs section is already rising by then).
 * Timeline ranges are [start, end] in HERO progress: 0 at the top of the page,
 * 1 when the hero flight ends (after journey.heroVh of scrolling).
 * Speeds are per SECOND (time-based: 60Hz and 120Hz screens look the same).
 */
export const hero = {
  intro: {
    duration: 2.5, // seconds for the stars to assemble ASTRA 2027 on load
    fadeIn: 0.8, // seconds for the stars to fade in at the start of the intro
    skipFadeIn: 0.35, // reloaded mid-page: no intro, dots just fade in at the right state
    skipAbove: 0.01, // scroll progress above which a reload skips the intro
    replayDuration: 1.8, // seconds: menu Home forms the headline again (full brightness from the first frame)
    redIn: [0.7, 1.0], // share of the intro over which the red accents appear
    shimmerIn: [0.75, 1.0], // share of the intro over which the shimmer starts
  },

  timeline: {
    hold: [0.0, 0.18], // assembled letters hold (scrolling here also finishes the intro)
    shimmerOut: [0.11, 0.29], // shimmer stops as the camera starts to push
    camera: [0.18, 1.0], // one eased camera move: through the letters, to where the camera rests
    stream: [0.18, 1.0], // letters dissolve and stream past the camera
    invert: [0.71, 0.86], // background black -> white: the star-iris opens (a bright flash)...
    fade: [0.86, 1.0], // ...then the white fades evenly back to black; black again exactly at the hero's end
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
 * STAR-IRIS: the hero's black -> white change (hero.timeline.invert) opens
 * through the ASTRA logo's silhouette instead of a circle: a small star at the
 * centre grows until white fills the screen, with a thin red edge glow and one
 * red shockwave ring. Values are shares of that invert range (0..1).
 */
export const iris = {
  startScale: 0.04, // logo height at the start, in screen heights
  endScale: 3.2, // ...and at the end: the logo just covers the whole screen (the flash peak), then the fade to black
  // < 1: the star's AREA grows evenly (area ~ scale^2), so the screen brightens smoothly
  // with no sudden jump (handoff.maxLumaStepPerFrame).
  growPower: 0.6,
  fill: [0.3, 0.95], // the logo's inner gaps close gradually as the star swells
  // (the aperture edge is cut at mask level 0.5, about one screen pixel wide, in the shader)
  glow: 0.9, // strength of the thin red edge line
  glowPx: 2.5, // its width in screen pixels (the same at every scale)
  glowFade: 0.75, // the line rises and fades over this first part of the transition
  ring: [0.12, 0.7], // the shockwave ring travels across this part of the transition
  ringWidth: 0.005, // in screen heights (thin)
  ringStrength: 0.75,
  ringReach: 1.3, // how far it travels (screen heights from the centre)
};

/**
 * HANDOFF hero -> programs: the star-iris is a short white flash (hero.timeline
 * invert, then fade) that settles into the black programs section.
 * Checked by the Playwright luminance scan (scripts in the verification notes):
 */
export const handoff = {
  // Max change of the screen's mean brightness (0..1) between two frames when the
  // scene moves at its normal pace (pacing.maxVhPerSecond at 60 fps): no hard cut.
  maxLumaStepPerFrame: 0.04,
  maxPlainWhiteVh: 15, // longest stretch of plain white (no shape, no text) allowed at the peak
  // The programs section starts rising this many story vh before the flash has faded to
  // black (scroll 1:1). It stays see-through and empty until then, so the flash plays
  // undisturbed behind it, and its header is already in place as the screen settles black.
  overlapVh: 62,
  revealAt: 0.5, // share of the fade after which the (white) header and rows may reveal
};

/**
 * WORLD after the hero: the camera rests where the hero flight ends while the
 * programs section (a normal page section) is read, then glides to the finale.
 */
export const journey = {
  heroVh: 170, // scroll from the top until the end of the hero flight (= the white has settled, the programs start)
  holdCenter: [0, 0, -22], // the point the camera faces when the hero flight ends
  viewDistance: 6, // the camera holds this far in front of what it faces (also the detail shape plane)
  arcLift: 2.5, // the glide to the finale bows upward by this much at its midpoint
  programsTone: TONE.black, // background after the star-iris flash: the programs (and the detail) are black
  toneSwap: [0.3, 0.7], // part of the glide into the finale during which it turns black again

  // The shape dots (one point cloud: the finale logo and the program detail shapes).
  field: {
    size: 0.024, // world units per dot
    stagger: 0.3, // share of each morph used to stagger dots (so they don't all move at once)
    cloudRadius: 1.3, // the loose cloud a detail shape gathers from
    framePadding: 0.06, // empty margin inside the shape area
  },

  // How the dots arrive in the program detail: one personality per squad.
  signatures: {
    Arts: { curl: 0.35, swirl: 5 }, // curling ink-like flow
    Tech: { grid: 0.14 }, // snap to a grid while a scan line sweeps across
    Gaming: { jitter: 0.5, pixel: 0.12, steps: 6 }, // blocky pixel glitch (square dots)
    Business: { stagger: 0.5 }, // drop to a baseline, then rise like bars, left to right
    Fun: { burst: 1.2, fall: 0.9 }, // confetti bursts out, falls and settles
  },
};

/**
 * PROGRAMS: the section right after the star-iris, one horizontal rail per
 * squad. Normal page scrolling; the header and rows reveal from the REAL screen
 * position once the star-iris has finished.
 */
export const programs = {
  headAt: 0.95, // the header reveals once its top is this far down the screen (share of the height)
  revealAt: 0.88, // a squad row reveals once its top is this far down the screen
  cardStagger: staggers.base, // between the cards of a row as it reveals
  sideScale: 0.1, // cards away from the rail's centre shrink by this much (1 -> 0.9)
  sideOpacity: 0.55, // ...and fade to this opacity
  parallax: 8, // % of its width a card's shape drifts per card away from the centre
};

/**
 * PROGRAM DETAIL: a card expands to full screen (GSAP Flip); the program's
 * shape forms from dots in the shared canvas with its squad's signature.
 */
export const detail = {
  expand: durations.base, // seconds for the card to grow to full screen
  collapse: durations.base * 0.8,
  form: durations.epic, // seconds for the dots to form the shape
  switchForm: durations.slow * 1.2, // seconds to morph to the next / previous program's shape
  accentShare: 0.04, // share of dots in the squad accent (the rest white on black)
  glow: 0.35, // a faint soft halo around each dot (additive blending on black, detail only)
  swipe: 50, // px of horizontal swipe that moves to the next / previous program
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
  lineFade: [0.05, 0.18], // hero progress over which the line fades as you scroll on
};

/**
 * FINALE: after the programs. The camera glides to an open spot of sky; the
 * dots appear scattered across the view and gather into the ASTRA logo. A comet
 * streak sweeps through, the line and the call to action rise.
 * Ranges are fractions [start, end] of `vh`.
 */
export const finale = {
  vh: 260, // scroll length of the finale
  center: [0, 0, -52], // world position of the logo
  tone: 0, // background: black world
  cameraArrives: 0.14, // the glide from the programs lands here
  field: [0.04, 0.16], // the scattered dots fade in
  merge: [0.12, 0.52], // scattered dots -> logo
  sweep: [0.56, 0.7], // comet streak through the logo
  line: [0.62, 0.74], // "Five squads. One sky." rises
  cta: [0.72, 0.84], // call to action appears
  size: 0.026, // dot size (a touch bigger than program shapes, so the logo reads on phones)
  stagger: 0.35, // share of the morph used to stagger the dots
  mergePath: [0.4, 6], // [curl, swirl] while the dots travel into the logo
  scatter: 1.15, // how far the scattered dots spread, as a share of the view
  redShare: 0.04, // share of dots in the red accent
};

/** MENU: overlay timings and the scroll trip when an item is chosen. */
export const menuMotion = {
  open: durations.base, // seconds for the circle to grow over the screen
  close: durations.fast * 1.4,
  homeFade: durations.base, // Home: the menu fades away while the stars form ASTRA 2027 again
  itemStagger: staggers.base,
  // Scroll trip: grows with distance (story vh), between min and max seconds.
  tripMin: 0.9,
  tripPerVh: 0.0009, // seconds per story vh travelled
  tripMax: 2.6,
};

/** Seconds for a menu / keyboard trip of `distanceVh` story vh (grows with distance, capped). */
export const tripDuration = (distanceVh) =>
  Math.min(menuMotion.tripMax, menuMotion.tripMin + Math.abs(distanceVh) * menuMotion.tripPerVh);

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
