/**
 * The scroll map for the whole page, shared by the DOM and the 3D scene.
 *
 * `s` below is the position in "story vh". The STORY is only what the canvas
 * plays: the hero (stars, flight, star-iris flash and its fade to black) and
 * the finale. Most of the programs section takes NO story time: while it is
 * read, the scene holds black and still. No three.js here.
 *
 * Page = three strict sections, in this order:
 *   1. hero + transmission + star-iris  scroll y 0 .. a     story 0 .. PROGRAMS_AT
 *   2. programs (a normal page section) scroll y a .. a+F   story PROGRAMS_AT .. HERO_END: the end of
 *        the flash plays while the section rises, SEE-THROUGH and EMPTY (the flash shows
 *        behind it); its header reveals half way through the fade to black, so it is in
 *        place as the screen settles black
 *                                       scroll y a+F .. b   story HERO_END (hold, black)
 *   3. finale                           scroll y b .. limit story HERO_END .. STORY_VH
 * a = the programs section's top reaches the bottom of the screen
 * b = its bottom reaches the bottom of the screen
 * F = handoff.overlapVh of scroll (1:1 with the story, times the touch multiplier like the spacer)
 * a and b come from a ScrollTrigger bound to the section element
 * (components/Programs/Programs.jsx), never from fixed numbers.
 *
 * scrollState.smooth is the scene progress (0..1 of the story). It follows the
 * real scroll through sceneGoal(): capped speed in the transition and finale,
 * and a quick catch-up whenever the page is already on the other side of the
 * hold, so the order on screen is always hero -> programs -> finale.
 */
import { hero, journey as J, finale as FIN, pacing, handoff } from "./motion";
import { scrollState } from "./scrollStore";

const H = J.heroVh;

/** Story vh of the white flash peak (the fade to black starts here). */
const PEAK = hero.timeline.fade[0] * H;
/** Story vh where the flash has faded to black: the programs header is in place, the scene holds. */
export const HERO_END = hero.timeline.fade[1] * H;
/** Story vh where the (still see-through, empty) programs section starts rising: the hero spacer's length. */
export const PROGRAMS_AT = HERO_END - handoff.overlapVh;
/** Total story length: hero (with the fade) + finale. */
export const STORY_VH = HERO_END + FIN.vh;
/** Story vh where the finale begins (right where the hold ends). */
export const finaleStartVh = () => HERO_END;
/** Total story length (kept as a function for existing callers). */
export const totalVh = () => STORY_VH;

const clampP = (v) => Math.min(1, Math.max(0, v));
/** Scene progress (0..1) -> story vh. */
export const toVh = (progress) => progress * STORY_VH;
/** Story vh -> scene progress (0..1). */
export const toProgress = (s) => clampP(s / STORY_VH);

const HOLD_P = HERO_END / STORY_VH;
const IRIS_P = (hero.timeline.invert[0] * H) / STORY_VH; // where the star-iris starts
const EPS = 0.5 / STORY_VH; // half a story vh: "at the hold"

/* ---------------------------------------------------------------- layout */

/**
 * Section boundaries in px, from the programs section's ScrollTrigger:
 *  a      scroll y where its top reaches the bottom of the screen (the flash peak)
 *  b      scroll y where its bottom reaches the bottom of the screen (finale begins)
 *  limit  max scroll y
 *  vh     the screen height
 */
const layout = { ready: false, a: 1, b: 1, limit: 1, vh: 1 };
const listeners = new Set();

export function setLayout(next) {
  Object.assign(layout, next, { ready: true });
  listeners.forEach((fn) => fn());
}

/** Call `fn` whenever the layout changes; returns an unsubscribe function. */
export function onLayout(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Scroll px of the overlap (F): handoff.overlapVh, scaled like the hero spacer (touch multiplier). */
const fadePx = () => {
  const spacerScale = layout.a / Math.max(1, (PROGRAMS_AT / 100) * layout.vh); // 1 on desktop, 1.2 on touch
  return Math.min(Math.max(0, layout.b - layout.a), (handoff.overlapVh / 100) * layout.vh * spacerScale);
};

/** Real scroll y (px) -> the story vh the scene belongs at. Past the fade the programs map to the hold. */
export function storyAtScroll(y) {
  const { a, b, limit } = layout;
  if (y <= a) return (y / Math.max(1, a)) * PROGRAMS_AT;
  const F = fadePx();
  if (y <= a + F) return PROGRAMS_AT + ((y - a) / Math.max(1, F)) * (HERO_END - PROGRAMS_AT);
  if (y <= b) return HERO_END;
  return HERO_END + ((y - b) / Math.max(1, limit - b)) * FIN.vh;
}

/** Story vh -> real scroll y (px) where the scene is there (menu, tests). The hold itself -> the fade's end. */
export function scrollAtStory(s) {
  const { a, b, limit } = layout;
  if (s <= PROGRAMS_AT) return (s / PROGRAMS_AT) * a;
  if (s <= HERO_END) return a + ((s - PROGRAMS_AT) / (HERO_END - PROGRAMS_AT)) * fadePx();
  return b + ((s - HERO_END) / FIN.vh) * (limit - b);
}

/** Scroll y (px) where the programs section fills the screen (its top at the top): menu, hash links. */
export const programsScrollY = () => Math.min(layout.b, Math.max(layout.a + fadePx(), layout.a + layout.vh));

/** Where each section starts as a share of the page (0..1): HUD ticks. */
export const pageStarts = () => ({ programs: layout.a / layout.limit, finale: layout.b / layout.limit });

/**
 * Where the scene should go this frame and how fast (progress per second).
 * null until the section boundaries are known (nothing moves before that).
 *  - normal: toward the real position, at most pacing.maxVhPerSecond story vh/s
 *  - the page is already past the transition but the scene is not: the stars
 *    before the star-iris go by at pacing.catchUpVhPerSecond, the flash itself
 *    at the normal pace; back in the programs from the finale: a quick return.
 */
export function sceneGoal() {
  if (!layout.ready) return null;
  const target = toProgress(storyAtScroll(scrollState.scroll));
  const s = scrollState.smooth;
  const cap = pacing.maxVhPerSecond / STORY_VH;
  const fast = pacing.catchUpVhPerSecond / STORY_VH;
  // Page past the transition, scene not: rush only through the star field before the
  // star-iris; the flash (iris + fade) always plays at the normal pace, forwards and
  // backwards alike (it read as a 0.1s blink when it was rushed too).
  if (target >= HOLD_P - EPS && s < HOLD_P - EPS) return s < IRIS_P - EPS ? { target: IRIS_P, cap: fast } : { target: HOLD_P, cap };
  // Back in the programs while the scene is still in the finale: return to the hold quickly.
  if (target <= HOLD_P + EPS && s > HOLD_P + EPS) return { target: HOLD_P, cap: fast };
  return { target, cap };
}

/**
 * The LEASH: the furthest the real page may be scrolled right now (px). At most
 * handoff.leashVh ahead of where the paced scene is; while the scene holds in the
 * programs, the whole section (plus the allowance) is free. Infinity before layout.
 */
export function maxScrollNow() {
  if (!layout.ready) return Infinity;
  const s = toVh(scrollState.smooth);
  const spacerScale = layout.a / Math.max(1, (PROGRAMS_AT / 100) * layout.vh); // touch multiplier
  const allowance = (handoff.leashVh / 100) * layout.vh * spacerScale;
  if (Math.abs(s - HERO_END) <= 0.5) return layout.b + allowance;
  return scrollAtStory(s) + allowance;
}

/** True once the flash has fully faded to black (the scene is at the hold or in the finale). */
export const transitionDone = () => scrollState.smooth >= HOLD_P - EPS;

/** True once the fade is far enough (handoff.revealAt) for the white programs header to read on it. */
export const programsRevealed = () => toVh(scrollState.smooth) >= PEAK + handoff.revealAt * (HERO_END - PEAK) - 0.5;

/** Which part of the page the scene is in: "hero" | "programs" | "finale". */
export function partAt(s) {
  if (s < PEAK - 0.5) return "hero";
  if (s > HERO_END + 0.5) return "finale";
  return "programs";
}

/* ----------------------------------------------------------------- hero */

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => t * t * (3 - 2 * t);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lin = (s, [a, b]) => clamp01((s - a) / (b - a));
const sm = (s, ab) => smooth(lin(s, ab));

/** Hero progress (0..1): reaches 1 at the end of the flight, as the star-iris white settles. */
export const heroProgress = (s) => clamp01(s / H);

/* ---------------------------------------------------------- background */

/** Background tone windows: whiteness goes from `from` to `to` across [s0, s1]. */
function toneWindows() {
  const f0 = finaleStartVh();
  const glide = FIN.cameraArrives * FIN.vh;
  const wins = [
    // The star-iris flash: white opens through the logo...
    { s0: hero.timeline.invert[0] * H, s1: hero.timeline.invert[1] * H, from: 0, to: 1, iris: true },
    // ...then fades evenly into the programs' tone, done exactly where the programs start.
    { s0: hero.timeline.fade[0] * H, s1: hero.timeline.fade[1] * H, from: 1, to: J.programsTone, fade: true },
  ];
  // Into the finale (only if its tone differs from the programs'), opening from the centre.
  if (FIN.tone !== J.programsTone)
    wins.push({ s0: f0 + J.toneSwap[0] * glide, s1: f0 + J.toneSwap[1] * glide, from: J.programsTone, to: FIN.tone });
  return wins;
}

/**
 * Background at s: { fromW, toW, mix, iris, fade }. Whiteness 0 = black, 1 = white;
 * `mix` opens `toW` from the centre of the screen outward (through the logo
 * silhouette when `iris` is true, otherwise a circle), or blends the whole
 * screen evenly when `fade` is true.
 */
export function toneAt(s) {
  let w = 0;
  for (const win of toneWindows()) {
    if (s < win.s0) break;
    if (s <= win.s1) {
      // The star-iris eases through its own growth curve (motion.js iris.growPower), so its
      // window is linear; a plain extra smoothstep would make the middle 1.5x steeper.
      const t = lin(s, [win.s0, win.s1]);
      return { fromW: win.from, toW: win.to, mix: win.iris ? t : smooth(t), iris: !!win.iris, fade: !!win.fade };
    }
    w = win.to;
  }
  return { fromW: w, toW: w, mix: 0, iris: false, fade: false };
}

/** Whiteness of the background right now as one number (for DOM decisions). */
export function whitenessAt(s) {
  const t = toneAt(s);
  return t.fromW + (t.toW - t.fromW) * t.mix;
}

/* ---------------------------------------------------------------- camera */

const D = J.viewDistance;
const HOLD = J.holdCenter; // where the hero flight ends; the camera rests here through the programs
const views = [
  [HOLD[0], HOLD[1], HOLD[2] + D],
  [FIN.center[0], FIN.center[1], FIN.center[2] + D],
];

/** Control points for the camera spline: start, the hold view, a lifted midpoint, the finale view. */
export const CAMERA_POINTS = [
  [0, 0, hero.camera.startZ],
  views[0],
  [(views[0][0] + views[1][0]) / 2, (views[0][1] + views[1][1]) / 2 + J.arcLift, (views[0][2] + views[1][2]) / 2],
  views[1],
];
const T_HOLD = 1 / 3; // spline parameter of the hold view (by control point index)

/**
 * Camera at s:
 *  t      spline parameter (getPoint, by control point index)
 *  look   [x, y, z] to look at
 *  aim    0..1: how much to look at `look` (0 = straight ahead, -z; the hero flight)
 */
export function cameraAt(s) {
  if (s < HERO_END) {
    const e = easeInOutCubic(lin(s, hero.timeline.camera.map((x) => x * H)));
    return { t: e * T_HOLD, look: HOLD, aim: sm(heroProgress(s), [0.75, 1]) };
  }
  const f0 = finaleStartVh();
  if (s < f0) return { t: T_HOLD, look: HOLD, aim: 1 };
  const e = easeInOutCubic(lin(s, [f0, f0 + FIN.cameraArrives * FIN.vh]));
  const look = HOLD.map((v, k) => v + (FIN.center[k] - v) * e);
  return { t: T_HOLD + (1 - T_HOLD) * e, look, aim: 1 };
}

/* ---------------------------------------------------------------- finale */

/** Finale progress at s: 0 at its start, 1 at the bottom of the page (negative before). */
export const finaleProgress = (s) => (s - finaleStartVh()) / FIN.vh;

/** Scene progress (0..1) for a finale progress f (menu). */
export const finaleSharedProgress = (f) => toProgress(finaleStartVh() + f * FIN.vh);

/**
 * The finale's dots at s, or null before they appear: presence 0..1 and the
 * morph progress t (0..1) from scattered points into the logo.
 */
export function finaleAt(s) {
  const f = finaleProgress(s);
  if (f < FIN.field[0]) return null;
  return { f, presence: lin(f, FIN.field), t: lin(f, FIN.merge) };
}

/** Finale text at s: { visible, line, cta, sweep, formed }. */
export function finaleTextAt(s) {
  const f = finaleProgress(s);
  return {
    visible: f >= FIN.field[0],
    line: lin(f, FIN.line),
    cta: lin(f, FIN.cta),
    sweep: lin(f, FIN.sweep),
    formed: f >= FIN.merge[1],
  };
}

/**
 * Screen pixel -> offset (world units) from the centre of a plane D in front of
 * the camera and facing it square-on (finale, program detail).
 */
export function screenToLocal(px, py, fovDeg) {
  const wpp = (2 * D * Math.tan(((fovDeg / 2) * Math.PI) / 180)) / window.innerHeight;
  return [(px - window.innerWidth / 2) * wpp, -(py - window.innerHeight / 2) * wpp];
}
