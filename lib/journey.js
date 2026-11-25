/**
 * The scroll map for the whole page, shared by the DOM and the 3D scene.
 *
 * Everything is derived from the one shared smoothed scroll value. `s` below is
 * the scroll position in vh (0 at the top), so all timings in lib/motion.js
 * read in plain scroll distances. No three.js in here (the DOM imports it).
 */
import { hero, journey } from "./motion";
import { SQUADS } from "@/data/programs";

const H = journey.heroVh;
const V = journey.stopVh;
export const STOP_COUNT = SQUADS.length;

/** Total scroll length in vh (the page is this + one screen tall). */
export const TOTAL_SCROLL_VH = H + STOP_COUNT * V;

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => t * t * (3 - 2 * t);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lin = (s, [a, b]) => clamp01((s - a) / (b - a));
const sm = (s, ab) => smooth(lin(s, ab));

export const stopStartVh = (i) => H + i * V;

/** A phase of stop i as an absolute [start, end] in vh. */
export function phaseVh(i, name) {
  const f = (i === 0 && journey.firstStop[name]) || journey.phases[name];
  return [stopStartVh(i) + f[0] * V, stopStartVh(i) + f[1] * V];
}

/** Glides between stops: stop i's "leave" plus stop i+1's "arrive". */
export const TRANSITS = Array.from({ length: STOP_COUNT - 1 }, (_, i) => ({
  from: i,
  to: i + 1,
  s0: phaseVh(i, "leave")[0],
  s1: phaseVh(i + 1, "arrive")[1],
}));

const HERO_CAMERA = hero.timeline.camera.map((x) => x * H);

/** Background tone windows: whiteness goes from `from` to `to` across [s0, s1]. */
const TONE_WINDOWS = [
  { s0: hero.timeline.invert[0] * H, s1: hero.timeline.invert[1] * H, from: 0, to: journey.tones[0] },
  ...TRANSITS.map((t) => {
    const len = t.s1 - t.s0;
    return {
      s0: t.s0 + journey.toneSwap[0] * len,
      s1: t.s0 + journey.toneSwap[1] * len,
      from: journey.tones[t.from],
      to: journey.tones[t.to],
    };
  }),
];

/** Convert shared progress (0..1) to scroll position in vh. */
export const toVh = (progress) => progress * TOTAL_SCROLL_VH;

/** Hero progress (0..1): reaches 1 when the camera arrives at Arts. */
export const heroProgress = (s) => clamp01(s / H);

/**
 * Background at scroll position s: { fromW, toW, mix }. Whiteness 0 = black,
 * 1 = white; `mix` opens `toW` from the centre of the screen outward.
 */
export function toneAt(s) {
  let w = 0;
  for (const win of TONE_WINDOWS) {
    if (s < win.s0) break;
    if (s <= win.s1) return { fromW: win.from, toW: win.to, mix: smooth(lin(s, [win.s0, win.s1])) };
    w = win.to;
  }
  return { fromW: w, toW: w, mix: 0 };
}

/** Whiteness of the background right now as one number (for DOM decisions). */
export function whitenessAt(s) {
  const t = toneAt(s);
  return t.fromW + (t.toW - t.fromW) * t.mix;
}

/** How visible stop i's text is (0..1): rises on "reveal", falls on "hide". */
export function stopTextAt(s, i) {
  const up = lin(s, phaseVh(i, "reveal"));
  const down = i < STOP_COUNT - 1 ? lin(s, phaseVh(i, "hide")) : 0; // last stop stays
  return up * (1 - down);
}

/** How gathered cluster i is (0..1). Once visited it stays gathered. */
export function clusterRevealAt(s, i) {
  if (i === 0) return sm(heroProgress(s), hero.timeline.arrive);
  const t = TRANSITS[i - 1];
  return sm(s, [t.s0, t.s1]);
}

/** How strongly cluster i glows red (only the squad you are at). */
export function clusterGlowAt(s, i) {
  const inn = clusterRevealAt(s, i);
  if (i === STOP_COUNT - 1) return inn;
  const t = TRANSITS[i];
  return inn * (1 - sm(s, [t.s0, (t.s0 + t.s1) / 2]));
}

/** Which squad the visitor is at (0..4), or -1 while still in the hero. */
export function activeStopAt(s) {
  if (s < phaseVh(0, "reveal")[0] - 1e-6) return -1;
  return Math.min(STOP_COUNT - 1, Math.max(0, Math.floor((s - H) / V)));
}

/* ---------------------------------------------------------------- camera */

const C = journey.centers;
const D = journey.viewDistance;
const views = C.map(([x, y, z]) => [x, y, z + D]);

/**
 * Control points for the camera spline: start, then each stop's viewpoint
 * with a lifted midpoint between neighbours so glides arc gracefully.
 */
export const CAMERA_POINTS = [[0, 0, hero.camera.startZ]];
views.forEach((v, i) => {
  if (i > 0) {
    const a = views[i - 1];
    CAMERA_POINTS.push([(a[0] + v[0]) / 2, (a[1] + v[1]) / 2 + journey.arcLift, (a[2] + v[2]) / 2]);
  }
  CAMERA_POINTS.push(v);
});

/** Spline parameter (0..1, by control point index) of stop i's viewpoint. */
const viewT = (i) => (1 + 2 * i) / (CAMERA_POINTS.length - 1);

/**
 * Camera at scroll position s:
 *  t      spline parameter (getPoint, by control point index)
 *  look   null = look straight ahead (-z); otherwise [x, y, z] to look at
 */
export function cameraAt(s) {
  if (s <= HERO_CAMERA[1]) {
    const e = easeInOutCubic(lin(s, HERO_CAMERA));
    return { t: e * viewT(0), look: null };
  }
  for (const tr of TRANSITS) {
    if (s < tr.s0) return { t: viewT(tr.from), look: C[tr.from] };
    if (s <= tr.s1) {
      const e = easeInOutCubic(lin(s, [tr.s0, tr.s1]));
      const a = C[tr.from];
      const b = C[tr.to];
      return {
        t: viewT(tr.from) + (viewT(tr.to) - viewT(tr.from)) * e,
        look: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e],
      };
    }
  }
  return { t: viewT(STOP_COUNT - 1), look: C[STOP_COUNT - 1] };
}

/**
 * Screen pixel -> world point on stop i's cluster plane, as seen from that
 * stop's hold camera (which looks straight down -z at the cluster centre).
 */
export function screenToStopWorld(i, px, py, fovDeg) {
  const [cx, cy, cz] = C[i];
  const wpp = (2 * D * Math.tan(((fovDeg / 2) * Math.PI) / 180)) / window.innerHeight;
  return [cx + (px - window.innerWidth / 2) * wpp, cy - (py - window.innerHeight / 2) * wpp, cz];
}
