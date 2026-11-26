/**
 * Shared motion config. Every animation (GSAP tweens, CSS transitions, the 3D
 * camera) takes its easing, duration and stagger from here. Values come from
 * lib/theme.js so there is only one source.
 */
import { eases, durations, staggers, tones as TONE } from "./theme";
import { identities } from "@/data/story";
import { SQUADS } from "@/data/programs";

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
  // Max scene speed in progress per second: the whole journey takes at least 90s.
  maxPerSecond: 1 / 90,
  // Gap (progress) between the scroll position and the scene above which the HUD shows "syncing".
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
    replayDuration: 1.8, // seconds: menu Home forms the headline again (full brightness from the first frame)
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
 * STAR-IRIS: the hero's black -> white change (hero.timeline.invert) opens
 * through the ASTRA logo's silhouette instead of a circle: a small star at the
 * centre grows until white fills the screen, with a thin red edge glow and one
 * red shockwave ring. Values are shares of that invert range (0..1).
 */
export const iris = {
  startScale: 0.04, // logo height at the start, in screen heights
  endScale: 7, // ...and at the end (the screen is deep inside the logo by then)
  growPower: 1.7, // > 1: opens slowly, then rushes outward
  fill: [0.5, 0.9], // late in the transition the logo's inner gaps close as the star swells
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
 * BRIEFING: right after the screen turns white, the hero pauses (the camera
 * creeps) for a briefing in two beats: what ASTRA is, then the facts. Then the
 * flight to Arts resumes. Ranges are shares [start, end] of `vh`.
 */
export const briefing = {
  vh: 240, // scroll length of the briefing
  splitAt: 0.55, // hero progress where the hero pauses (as the white finishes filling)
  creep: 0.02, // hero progress the camera still creeps forward during the briefing
  // Beat 1 starts a little BEFORE the pause (negative), rising over the end of the star-iris.
  intro: { in: [-0.16, -0.04], out: [0.44, 0.52] }, // beat 1: headline, about, college + year
  facts: { in: [0.42, 0.56], count: [0.48, 0.68], out: [1.0, 1.14] }, // beat 2 overlaps beat 1 leaving, and the flight to Arts
  flyVh: 40, // after the briefing, the rest of the flight to Arts takes this much scroll (no empty stretch)
  drift: 6, // % sideways drift of alternate headline lines while beat 1 holds (kinetic type)
};

/**
 * SQUAD JOURNEY: after the hero, the same scroll travels through five stops
 * (Arts, Tech, Gaming, Business, Fun). Distances are in vh of scrolling
 * (desktop; touch screens multiply the page by touchScroll.lengthMultiplier).
 *
 * Each stop = intro (the ARRIVAL: the squad emblem forms from points, the
 * squad name rises huge, then the emblem dissolves into the first program
 * shape and the dossier appears) + one segment per program
 * (that program is "in focus") + outro (camera leaves). A stop with 6
 * programs is longer than one with 2. Ranges below are fractions [start, end]
 * of the intro, of ONE program segment, or of the outro.
 */
export const journey = {
  heroVh: 300, // scroll from the top until the camera arrives at Arts
  introVh: 100, // per stop: the arrival moment
  programVh: 120, // per program: arrive, hold, leave
  outroVh: 60, // per stop: last shape disperses, camera starts to leave

  intro: {
    field: [0.0, 0.12], // the dot cloud fades in (as the camera lands)
    emblem: [0.06, 0.32], // the cloud forms the squad emblem at the centre
    name: [0.14, 0.34], // the huge squad name rises (masked lines)...
    nameOut: [0.55, 0.68], // ...and falls away
    hold: 0.45, // middle of the arrival (the menu lands here)
    morph: 0.6, // the emblem starts dissolving into the first program's shape
    head: [0.64, 0.9], // the dossier (status, codename, mission) rises in
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
    cameraLeaves: 0.5, // the glide to the next stop starts here (30vh into the outro)...
  },
  cameraArrives: 0.1, // ...and lands here in the next intro (10vh): a ~40vh transition

  toneSwap: [0.3, 0.7], // part of each glide during which the next background tone opens
  // Background per stop as whiteness (0 black .. 1 white), from each squad's tone in data/story.js.
  tones: SQUADS.map((sq) => TONE[identities[sq].tone]),

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

/**
 * SQUAD IDENTITY: what makes each stop look different (the words for it are
 * in data/story.js `identities`).
 *  camera   approach angle in degrees: yaw (left/right around the squad),
 *           pitch (+ = from above, looking down), roll (tilt of the horizon).
 *           The program shapes always turn to face the camera, so they stay
 *           exactly where their text expects them.
 *  density  share of the shape dots that are shown (0..1)
 *  size     dot size range, as multiples of journey.field.size
 *  ambient  the squad's ambient motion layer (components/World/SquadAmbient.jsx):
 *           speed = how fast it moves, amount = how big the movement is
 */
export const identity = {
  Arts: { camera: { yaw: -14, pitch: 6, roll: -5 }, density: 0.85, size: [0.7, 1.6], ambient: { speed: 1, amount: 1 } },
  Tech: { camera: { yaw: 0, pitch: -16, roll: 0 }, density: 1, size: [0.8, 1.0], ambient: { speed: 1, amount: 1 } },
  Gaming: { camera: { yaw: 22, pitch: 0, roll: 8 }, density: 0.9, size: [1.1, 1.5], ambient: { speed: 1, amount: 1 } },
  Business: { camera: { yaw: -10, pitch: 18, roll: 0 }, density: 0.75, size: [0.8, 1.2], ambient: { speed: 1, amount: 1 } },
  Fun: { camera: { yaw: 16, pitch: -8, roll: -10 }, density: 0.95, size: [0.5, 2.0], ambient: { speed: 1, amount: 1 } },
};

/** The ambient layer around each squad (same for every squad; per-squad tuning is above). */
export const ambient = {
  size: 0.03, // world units per point
  redShare: 0.06, // share of ambient points in the red accent
  fadeIn: 0.5, // the layer fades in over the second half of the glide into a stop...
  fadeOut: 0.5, // ...and out over the first half of the glide away
};

/**
 * TRANSITION between squads (the ~40vh glide): a burst of streaks rushing past
 * the camera while the background inverts from the centre.
 */
export const streaks = {
  length: 7, // world units at full speed
  depth: 40, // streaks live between 1 and this many units in front of the camera
  spread: 7, // how far from the centre line they sit
  speed: 32, // world units per second they rush toward the camera
  redShare: 0.12, // share of red streaks
  peak: 0.9, // max opacity mid-glide
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
