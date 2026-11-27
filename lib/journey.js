/**
 * The scroll map for the whole page, shared by the DOM and the 3D scene.
 *
 * `s` below is the position in "story vh". The STORY is only what the canvas
 * plays: the hero (stars, flight, star-iris) and the finale. The programs
 * section in between takes NO story time: while it is on screen the scene
 * holds at the end of the star-iris (white, nothing moving). No three.js here.
 *
 * Page = three strict sections, in this order:
 *   1. hero + transmission + star-iris  scroll y 0 .. a       story 0 .. HERO_END
 *   2. programs (a normal page section) scroll y a .. b       story HERO_END (hold)
 *   3. finale                           scroll y b .. limit   story HERO_END .. STORY_VH
 * a = the programs section's top reaches the bottom of the screen
 * b = its bottom reaches the bottom of the screen
 * Both come from a ScrollTrigger bound to the section element
 * (components/Programs/Programs.jsx), never from fixed numbers.
 *
 * scrollState.smooth is the scene progress (0..1 of the story). It follows the
 * real scroll through sceneGoal(): capped speed in the hero and finale, and a
 * quick catch-up whenever the page is already on the other side of the hold,
 * so the order on screen is always hero -> programs -> finale.
 */
import { hero, journey as J, finale as FIN, pacing } from "./motion";
import { scrollState } from "./scrollStore";

const H = J.heroVh;

/** Story vh where the hero flight ends and the star-iris white has settled (= where the programs start). */
export const HERO_END = H;
/** Total story length: hero + finale (the programs section takes no story time). */
export const STORY_VH = H + FIN.vh;
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
const EPS = 0.5 / STORY_VH; // half a story vh: "at the hold"

/* ---------------------------------------------------------------- layout */

/**
 * Section boundaries in px, from the programs section's ScrollTrigger:
 *  a      scroll y where its top reaches the bottom of the screen (transition ends)
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

/** Real scroll y (px) -> the story vh the scene belongs at. The whole programs section maps to the hold. */
export function storyAtScroll(y) {
  if (y <= layout.a) return (y / Math.max(1, layout.a)) * HERO_END;
  if (y <= layout.b) return HERO_END;
  return HERO_END + ((y - layout.b) / Math.max(1, layout.limit - layout.b)) * FIN.vh;
}

/** Story vh -> real scroll y (px) where the scene is there (menu, tests). The hold itself -> the section's start. */
export function scrollAtStory(s) {
  if (s <= HERO_END) return (s / HERO_END) * layout.a;
  return layout.b + ((s - HERO_END) / FIN.vh) * (layout.limit - layout.b);
}

/** Scroll y (px) where the programs section fills the screen (its top at the top): menu, hash links. */
export const programsScrollY = () => Math.min(layout.b, layout.a + layout.vh);

/** Where each section starts as a share of the page (0..1): HUD ticks. */
export const pageStarts = () => ({ programs: layout.a / layout.limit, finale: layout.b / layout.limit });

/**
 * Where the scene should go this frame and how fast (progress per second).
 * null until the section boundaries are known (nothing moves before that).
 *  - normal: toward the real position, at most pacing.maxVhPerSecond story vh/s
 *  - the page is already past the transition but the scene is not (or back in
 *    the programs while the scene is still in the finale): go to the hold at
 *    pacing.catchUpVhPerSecond, then continue at the normal pace.
 */
export function sceneGoal() {
  if (!layout.ready) return null;
  const target = toProgress(storyAtScroll(scrollState.scroll));
  const s = scrollState.smooth;
  const behind = (target >= HOLD_P - EPS && s < HOLD_P - EPS) || (target <= HOLD_P + EPS && s > HOLD_P + EPS);
  if (behind) return { target: HOLD_P, cap: pacing.catchUpVhPerSecond / STORY_VH };
  return { target, cap: pacing.maxVhPerSecond / STORY_VH };
}

/** True once the scene has finished the star-iris (it is at the hold or in the finale). */
export const transitionDone = () => scrollState.smooth >= HOLD_P - EPS;

/** Which part of the page the scene is in: "hero" | "programs" | "finale". */
export function partAt(s) {
  if (s < HERO_END - 0.5) return "hero";
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
  return [
    // The hero's change opens through the star-iris; the white settles as the hero ends.
    { s0: hero.timeline.invert[0] * H, s1: hero.timeline.invert[1] * H, from: 0, to: J.programsTone, iris: true },
    // Into the finale: back to the black world, opening from the centre.
    { s0: f0 + J.toneSwap[0] * glide, s1: f0 + J.toneSwap[1] * glide, from: J.programsTone, to: FIN.tone },
  ];
}

/**
 * Background at s: { fromW, toW, mix, iris }. Whiteness 0 = black, 1 = white;
 * `mix` opens `toW` from the centre of the screen outward (through the logo
 * silhouette when `iris` is true, otherwise a circle).
 */
export function toneAt(s) {
  let w = 0;
  for (const win of toneWindows()) {
    if (s < win.s0) break;
    if (s <= win.s1) return { fromW: win.from, toW: win.to, mix: smooth(lin(s, [win.s0, win.s1])), iris: !!win.iris };
    w = win.to;
  }
  return { fromW: w, toW: w, mix: 0, iris: false };
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
