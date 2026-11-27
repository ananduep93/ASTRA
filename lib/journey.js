/**
 * The scroll map for the whole page, shared by the DOM and the 3D scene.
 *
 * Everything is derived from the one shared (paced) scene progress. `s` below
 * is the position in "story vh" (0 at the top), so the timings in
 * lib/motion.js read as plain scroll distances. No three.js in here.
 *
 * Page = three parts, in this order:
 *   1. hero + transmission + star-iris   fixed layers over the canvas, scroll
 *      length from a spacer (PROGRAMS_AT story vh)
 *   2. programs   a NORMAL page section (its real, measured height). It starts
 *      rising PROGRAMS_AT, during the last, almost white part of the star-iris;
 *      the hero ends (HERO_END) as the white settles, with the header on screen.
 *   3. finale     fixed layer over the canvas, from a spacer (finale.vh)
 * The programs section's height is measured (setLayout), so story vh always
 * lines up with the page whatever the screen size or the touch multiplier.
 */
import { hero, journey as J, finale as FIN, pacing } from "./motion";
import { rescaleScene, setFreeZone } from "./scrollStore";

const H = J.heroVh;

/** Story vh where the hero flight ends and the star-iris white has settled. */
export const HERO_END = H;
/** Story vh where the programs section starts rising (its top at the bottom of the screen). */
export const PROGRAMS_AT = H - J.programsOverlap;

/* ---------------------------------------------------------------- layout */

/**
 * Measured page layout in px (components/Programs/Programs.jsx keeps it up to date):
 *  a      scroll y where the programs section's top reaches the bottom of the screen
 *  b      scroll y where its bottom reaches the bottom of the screen
 *  limit  max scroll y
 *  vh     the screen height
 * Before the first measurement a default programs length is assumed.
 */
const layout = { ready: false, a: 0, b: 0, limit: 1, vh: 1 };
const DEFAULT_PROGRAMS_VH = 400;
const listeners = new Set();

export function setLayout(next) {
  // The page got longer or shorter (a filter change, a resize): keep the scene at
  // the same pixel position, so nothing jumps and the pacing has nothing to catch up.
  if (layout.ready && next.limit && next.limit !== layout.limit) rescaleScene(layout.limit / next.limit);
  Object.assign(layout, next, { ready: true });
  // The programs list scrolls like a normal page: from the moment it starts rising
  // until its bottom reaches the bottom of the screen, the scene keeps up with it.
  setFreeZone(
    layout.a / layout.limit,
    layout.b / layout.limit,
    (pacing.listScreensPerSecond * layout.vh) / layout.limit
  );
  listeners.forEach((fn) => fn());
}

/** Call `fn` whenever the layout changes; returns an unsubscribe function. */
export function onLayout(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Story length of the programs section (its real height, in screen heights x 100). */
export const programsVh = () => (layout.ready ? ((layout.b - layout.a) / layout.vh) * 100 : DEFAULT_PROGRAMS_VH);
/** Story vh where the programs section ends and the finale begins. */
export const finaleStartVh = () => PROGRAMS_AT + programsVh();
/** Total story length. */
export const totalVh = () => finaleStartVh() + FIN.vh;

/** Shared scene progress (0..1) -> story vh. Piecewise: hero, programs, finale. */
export function toVh(progress) {
  if (!layout.ready) return progress * totalVh();
  const y = progress * layout.limit;
  if (y <= layout.a) return (y / Math.max(1, layout.a)) * PROGRAMS_AT;
  if (y <= layout.b) return PROGRAMS_AT + ((y - layout.a) / Math.max(1, layout.b - layout.a)) * programsVh();
  return finaleStartVh() + ((y - layout.b) / Math.max(1, layout.limit - layout.b)) * FIN.vh;
}

/** Story vh -> shared progress (0..1): the inverse of toVh. */
export function toProgress(s) {
  if (!layout.ready) return s / totalVh();
  let y;
  if (s <= PROGRAMS_AT) y = (s / PROGRAMS_AT) * layout.a;
  else if (s <= finaleStartVh()) y = layout.a + ((s - PROGRAMS_AT) / programsVh()) * (layout.b - layout.a);
  else y = layout.b + ((s - finaleStartVh()) / FIN.vh) * (layout.limit - layout.b);
  return Math.min(1, Math.max(0, y / Math.max(1, layout.limit)));
}

/**
 * The scene's speed cap (shared progress per second) for pacing.maxVhPerSecond
 * story vh per second, from the measured page: the same story speed whatever
 * the page length, the screen or the touch multiplier.
 */
export function paceCap() {
  if (!layout.ready || PROGRAMS_AT <= 0) return pacing.maxVhPerSecond / totalVh();
  const pxPerStoryVh = layout.a / PROGRAMS_AT; // hero and finale share the same spacer scale
  return (pacing.maxVhPerSecond * pxPerStoryVh) / Math.max(1, layout.limit);
}

/** Story vh where the programs section fills the screen (its top at the top of the screen): menu, hash links. */
export const programsFullVh = () => PROGRAMS_AT + 100;

/** Which part of the page the scene is in: "hero" | "programs" | "finale". */
export function partAt(s) {
  if (s >= finaleStartVh()) return "finale";
  if (s >= PROGRAMS_AT) return "programs";
  return "hero";
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

/** Shared progress (0..1) for a finale progress f (tests, menu). */
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
