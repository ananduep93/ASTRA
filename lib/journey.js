/**
 * The scroll map for the whole page, shared by the DOM and the 3D scene.
 *
 * Everything is derived from the one shared smoothed scroll value. `s` below is
 * the scroll position in "story vh" (0 at the top), so all timings in
 * lib/motion.js read as plain scroll distances. No three.js in here.
 *
 * Page = hero, then per squad: intro + one segment per program + outro,
 * then the finale (the five squads come together into the logo).
 */
import { hero, journey as J, finale as FIN, identity as ID, ambient as AMB } from "./motion";
import { programs, SQUADS } from "@/data/programs";

const H = J.heroVh;
export const STOP_COUNT = SQUADS.length;

/** Programs of each squad, in data order. */
export const ROSTERS = SQUADS.map((squad) => programs.filter((p) => p.squad === squad));
export const PROGRAM_TOTAL = ROSTERS.reduce((n, r) => n + r.length, 0);

const stopLength = (i) => J.introVh + ROSTERS[i].length * J.programVh + J.outroVh;
const STOP_STARTS = ROSTERS.reduce((starts, _, i) => [...starts, i === 0 ? H : starts[i - 1] + stopLength(i - 1)], []);

/** Where the finale starts (story vh): right after the Fun stop's outro. */
export const FINALE_START_VH = STOP_STARTS[STOP_COUNT - 1] + stopLength(STOP_COUNT - 1);

/** Total scroll length in story vh (the page is this + one screen tall on desktop). */
export const TOTAL_SCROLL_VH = FINALE_START_VH + FIN.vh;

/** Every camera destination: the five squads, then the finale (index STOP_COUNT). */
const CENTERS = [...J.centers, FIN.center];
const TONES = [...J.tones, FIN.tone];

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => t * t * (3 - 2 * t);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lin = (s, [a, b]) => clamp01((s - a) / (b - a));
const sm = (s, ab) => smooth(lin(s, ab));

export const stopStartVh = (i) => STOP_STARTS[i];
const introAt = (i, f) => STOP_STARTS[i] + f * J.introVh;
const programAt = (i, j, f) => STOP_STARTS[i] + J.introVh + (j + f) * J.programVh;
const outroAt = (i, f) => STOP_STARTS[i] + J.introVh + ROSTERS[i].length * J.programVh + f * J.outroVh;
const finaleAtVh = (f) => FINALE_START_VH + f * FIN.vh;

/** Scroll position (story vh) of program j of squad i at the middle of its hold. */
export const programHoldVh = (i, j) => programAt(i, j, J.program.hold);

/** Position of program j of squad i in the whole list (0-based), for the "03 / 15" counter. */
export const programNumber = (i, j) => ROSTERS.slice(0, i).reduce((n, r) => n + r.length, 0) + j;

/** Glides: from stop i's outro to stop i+1's intro; the last one goes from Fun to the finale. */
export const TRANSITS = Array.from({ length: STOP_COUNT }, (_, i) => ({
  from: i,
  to: i + 1,
  s0: outroAt(i, J.outro.cameraLeaves),
  s1: i + 1 < STOP_COUNT ? introAt(i + 1, J.cameraArrives) : finaleAtVh(FIN.cameraArrives),
}));

const HERO_CAMERA = hero.timeline.camera.map((x) => x * H);

/** Background tone windows: whiteness goes from `from` to `to` across [s0, s1]. */
const TONE_WINDOWS = [
  { s0: hero.timeline.invert[0] * H, s1: hero.timeline.invert[1] * H, from: 0, to: J.tones[0] },
  ...TRANSITS.map((t) => {
    const len = t.s1 - t.s0;
    return {
      s0: t.s0 + J.toneSwap[0] * len,
      s1: t.s0 + J.toneSwap[1] * len,
      from: TONES[t.from],
      to: TONES[t.to],
    };
  }),
];

/** Convert shared progress (0..1) to story vh. */
export const toVh = (progress) => progress * TOTAL_SCROLL_VH;

/** Hero progress (0..1): reaches 1 when the camera arrives at Arts. */
export const heroProgress = (s) => clamp01(s / H);

/**
 * Background at s: { fromW, toW, mix }. Whiteness 0 = black, 1 = white;
 * `mix` opens `toW` from the centre of the screen outward.
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

/** Which squad stop s falls in (0..4), or -1 while still in the hero. */
export function stopIndexAt(s) {
  if (s < STOP_STARTS[0]) return -1;
  for (let i = STOP_COUNT - 1; i >= 0; i--) if (s >= STOP_STARTS[i]) return i;
  return -1;
}

/** Which squad the visitor is at for the HUD and menu (-1 until Arts' huge name rises). */
export function activeStopAt(s) {
  if (s < introAt(0, J.intro.name[0])) return -1;
  return stopIndexAt(s);
}

/** Scroll position (story vh) of squad i's arrival moment (emblem + huge name), for the menu. */
export const arrivalVh = (i) => introAt(i, J.intro.hold);

/** How visible squad i's huge arrival name is (0..1): rises, holds, falls away. */
export function arrivalNameAt(s, i) {
  const up = lin(s, [introAt(i, J.intro.name[0]), introAt(i, J.intro.name[1])]);
  const down = lin(s, [introAt(i, J.intro.nameOut[0]), introAt(i, J.intro.nameOut[1])]);
  return up * (1 - down);
}

/** How present squad i's ambient motion layer is (0..1): in during the glide in, out during the glide away. */
export function ambientPresenceAt(s, i) {
  const into = i === 0 ? null : TRANSITS[i - 1];
  const away = TRANSITS[i];
  const up =
    i === 0
      ? sm(heroProgress(s), hero.timeline.arrive)
      : sm(s, [into.s0 + (1 - AMB.fadeIn) * (into.s1 - into.s0), into.s1]);
  const down = sm(s, [away.s0, away.s0 + AMB.fadeOut * (away.s1 - away.s0)]);
  return up * (1 - down);
}

/** Transition strength (0..1) for the streaks: peaks in the middle of each glide between stops. */
export function warpAt(s) {
  for (const tr of TRANSITS) {
    if (s < tr.s0) return 0;
    if (s <= tr.s1) return Math.sin(Math.PI * lin(s, [tr.s0, tr.s1]));
  }
  return 0;
}

/** How visible squad i's name + briefing are (0..1). */
export function headTextAt(s, i) {
  const up = lin(s, [introAt(i, J.intro.head[0]), introAt(i, J.intro.head[1])]);
  const down = lin(s, [outroAt(i, J.outro.head[0]), outroAt(i, J.outro.head[1])]);
  return up * (1 - down);
}

/** How visible program j of squad i's name, counter and Details are (0..1). */
export function programTextAt(s, i, j) {
  const p = J.program;
  const up = lin(s, [programAt(i, j, p.reveal[0]), programAt(i, j, p.reveal[1])]);
  const down = lin(s, [programAt(i, j, p.hide[0]), programAt(i, j, p.hide[1])]);
  return up * (1 - down);
}

/** The program in focus at s (its segment contains s), or null. */
export function focusAt(s) {
  const i = stopIndexAt(s);
  if (i < 0) return null;
  const j = Math.floor((s - STOP_STARTS[i] - J.introVh) / J.programVh);
  if (j < 0 || j >= ROSTERS[i].length) return null;
  return { i, j };
}

/** How present squad i's shape field is (0..1): fades in on the intro, out on the outro. */
export function fieldPresenceAt(s, i) {
  const up = lin(s, [introAt(i, J.intro.field[0]), introAt(i, J.intro.field[1])]);
  const down = lin(s, [outroAt(i, J.outro.field[0]), outroAt(i, J.outro.field[1])]);
  return up * (1 - down);
}

/**
 * Which shapes squad i's dots are between at s: { from, to, t }.
 * from / to are program indices within the squad, or -1 for the loose cloud.
 * t is 0..1 (linear; the shader eases it per dot).
 */
export function morphAt(s, i) {
  const n = ROSTERS[i].length;
  const p = J.program;
  // Each entry: a morph from `from` to `to` over [a, b]. -1 = loose cloud, -2 = the squad emblem.
  const steps = [
    { from: -1, to: -2, a: introAt(i, J.intro.emblem[0]), b: introAt(i, J.intro.emblem[1]) },
    { from: -2, to: 0, a: introAt(i, J.intro.morph), b: programAt(i, 0, p.arriveEnd) },
  ];
  for (let j = 0; j < n - 1; j++) {
    steps.push({ from: j, to: j + 1, a: programAt(i, j, p.leaveStart), b: programAt(i, j + 1, p.arriveEnd) });
  }
  steps.push({ from: n - 1, to: -1, a: programAt(i, n - 1, p.leaveStart), b: outroAt(i, J.outro.morph) });

  if (s < steps[0].a) return { from: -1, to: -2, t: 0 };
  for (let k = 0; k < steps.length; k++) {
    const st = steps[k];
    if (s <= st.b) return { from: st.from, to: st.to, t: lin(s, [st.a, st.b]) };
    const next = steps[k + 1];
    if (next && s < next.a) return { from: st.from, to: st.to, t: 1 }; // holding a shape
  }
  const lastStep = steps[steps.length - 1];
  return { from: lastStep.from, to: lastStep.to, t: 1 };
}

/** How gathered squad i's haze is (0..1). Once visited it stays. */
export function clusterRevealAt(s, i) {
  if (i === 0) return sm(heroProgress(s), hero.timeline.arrive);
  const t = TRANSITS[i - 1];
  return sm(s, [t.s0, t.s1]);
}

/** How strongly squad i's haze glows red (only the squad you are at). */
export function clusterGlowAt(s, i) {
  const inn = clusterRevealAt(s, i);
  const t = TRANSITS[i]; // the glide away (Fun's is the glide to the finale)
  return inn * (1 - sm(s, [t.s0, (t.s0 + t.s1) / 2]));
}

/* ---------------------------------------------------------------- camera */

const C = CENTERS;
const D = J.viewDistance;
const RAD = Math.PI / 180;
/** Each destination's camera angle (degrees): the squads' identities, the finale straight on. */
const ANGLES = [...SQUADS.map((sq) => ID[sq].camera), { yaw: 0, pitch: 0, roll: 0 }];
const ROLLS = ANGLES.map((a) => a.roll * RAD);
/** Hold viewpoint: D away from the centre, in the direction given by yaw and pitch. */
const views = C.map(([x, y, z], i) => {
  const { yaw, pitch } = ANGLES[i];
  const cp = Math.cos(pitch * RAD);
  return [x + D * Math.sin(yaw * RAD) * cp, y + D * Math.sin(pitch * RAD), z + D * Math.cos(yaw * RAD) * cp];
});

/**
 * Hold camera of destination i (0..4 squads, 5 finale): eye, target, roll (radians).
 * The program shapes are turned to face exactly this camera.
 */
export const STOP_VIEWS = views.map((eye, i) => ({ eye, target: C[i], roll: ROLLS[i] }));

/**
 * Control points for the camera spline: start, then each stop's viewpoint
 * with a lifted midpoint between neighbours so glides arc gracefully.
 */
export const CAMERA_POINTS = [[0, 0, hero.camera.startZ]];
views.forEach((v, i) => {
  if (i > 0) {
    const a = views[i - 1];
    CAMERA_POINTS.push([(a[0] + v[0]) / 2, (a[1] + v[1]) / 2 + J.arcLift, (a[2] + v[2]) / 2]);
  }
  CAMERA_POINTS.push(v);
});

/** Spline parameter (0..1, by control point index) of stop i's viewpoint. */
const viewT = (i) => (1 + 2 * i) / (CAMERA_POINTS.length - 1);

/**
 * Camera at s:
 *  t      spline parameter (getPoint, by control point index)
 *  look   [x, y, z] to look at
 *  aim    0..1: how much to look at `look` (0 = straight ahead, -z; the hero flight)
 *  roll   tilt of the horizon (radians)
 */
export function cameraAt(s) {
  if (s <= HERO_CAMERA[1]) {
    const e = easeInOutCubic(lin(s, HERO_CAMERA));
    // The flight looks straight ahead, then turns to Arts' angle as it arrives.
    const aim = sm(heroProgress(s), [0.75, 1]);
    return { t: e * viewT(0), look: C[0], aim, roll: ROLLS[0] * aim };
  }
  for (const tr of TRANSITS) {
    if (s < tr.s0) return { t: viewT(tr.from), look: C[tr.from], aim: 1, roll: ROLLS[tr.from] };
    if (s <= tr.s1) {
      const e = easeInOutCubic(lin(s, [tr.s0, tr.s1]));
      const a = C[tr.from];
      const b = C[tr.to];
      return {
        t: viewT(tr.from) + (viewT(tr.to) - viewT(tr.from)) * e,
        look: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e],
        aim: 1,
        roll: ROLLS[tr.from] + (ROLLS[tr.to] - ROLLS[tr.from]) * e,
      };
    }
  }
  return { t: viewT(STOP_COUNT), look: C[STOP_COUNT], aim: 1, roll: ROLLS[STOP_COUNT] };
}

/* ---------------------------------------------------------------- finale */

/** Finale progress at s: 0 at its start, 1 at the bottom of the page (negative before). */
export const finaleProgress = (s) => (s - FINALE_START_VH) / FIN.vh;

/** Shared progress (0..1) for a finale progress f (tests, keyboard). */
export const finaleSharedProgress = (f) => finaleAtVh(f) / TOTAL_SCROLL_VH;

/**
 * The finale's dots at s, or null before they appear:
 *  presence 0..1, and the morph { from, to, t } between "cloud" (five loose
 *  clouds), "emblems" (the five squad emblems) and "logo".
 */
export function finaleAt(s) {
  const f = finaleProgress(s);
  if (f < FIN.field[0]) return null;
  const presence = lin(f, FIN.field);
  let morph;
  if (f < FIN.merge[0]) morph = { from: "cloud", to: "emblems", t: lin(f, FIN.emblems) };
  else morph = { from: "emblems", to: "logo", t: lin(f, FIN.merge) };
  return { f, presence, morph };
}

/** Finale text at s: { visible, line, cta, sweep } each 0..1. */
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
 * Screen pixel -> offset (world units) from a stop's cluster centre, on the
 * cluster plane, as seen from that stop's hold camera (the plane faces it).
 * The same for every stop, so shapes are sampled once and reused.
 */
export function screenToLocal(px, py, fovDeg) {
  const wpp = (2 * D * Math.tan(((fovDeg / 2) * Math.PI) / 180)) / window.innerHeight;
  return [(px - window.innerWidth / 2) * wpp, -(py - window.innerHeight / 2) * wpp];
}

/** Shared progress (0..1) for a story vh position (menu, keyboard). */
export const sharedProgressOf = (vh) => vh / TOTAL_SCROLL_VH;

/** Scroll the page so program j of squad i is in focus (keyboard access). */
export function scrollTargetFor(i, j) {
  return programHoldVh(i, j) / TOTAL_SCROLL_VH; // shared progress 0..1
}
