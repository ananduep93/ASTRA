/**
 * The scroll map of the issue, shared by every animation. No DOM in here.
 *
 * The issue is a row of scenes, each a stretch of scroll measured in "story
 * vh" (desktop; touch screens scroll lengthMultiplier times further for the
 * same story). The scene progress (lib/scrollStore.js `smooth`, paced) is
 * turned into a story vh position `s`, and each scene reads its own 0..1.
 *
 *   cover    the cover holds
 *   zoom1    zoom into the cover's inset panel; it becomes the opening page
 *   opening  the opening page: four panels wipe in, the page moves up on phones
 *   zoom2    zoom into the opening's last panel; it becomes the Arts splash
 *   splash   Chapter 1 splash page
 *   slide    the Arts mission-files page slides up over the splash
 *   arts     Arts program panels wipe in as the page moves up
 *   end      "to be continued" holds
 */
const SCENE_LENGTHS = [
  ["cover", 50],
  ["zoom1", 110],
  ["opening", 380],
  ["zoom2", 110],
  ["splash", 150],
  ["slide", 70],
  ["arts", 380],
  ["end", 40],
];

let at = 0;
export const SCENES = Object.fromEntries(
  SCENE_LENGTHS.map(([id, len]) => {
    const scene = { id, start: at, len, end: at + len };
    at += len;
    return [id, scene];
  })
);

/** Total story length in vh (the page is this + one screen tall on desktop). */
export const TOTAL_VH = at;

export const clamp01 = (t) => Math.min(1, Math.max(0, t));
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Shared progress (0..1) -> story vh. */
export const toVh = (progress) => progress * TOTAL_VH;

/** Story vh -> shared progress (0..1). */
export const toProgress = (vh) => vh / TOTAL_VH;

/** 0..1 through scene `id` at story vh `s` (clamped). */
export const sceneT = (s, id) => clamp01((s - SCENES[id].start) / SCENES[id].len);

/** Story vh of a point `f` (0..1) inside scene `id`. */
export const vhIn = (id, f) => SCENES[id].start + f * SCENES[id].len;

/* Opening page: when each panel wipes in (share of the opening scene). */
export const OPENING_PANELS = [0.02, 0.2, 0.38, 0.56];
/* Opening and Arts pages move up between these shares of their scene (phones: taller than the screen). */
export const PAGE_MOVE = { opening: [0.08, 0.8], arts: [0.04, 0.92] };
/* Splash text appears after this share of the splash scene. */
export const SPLASH_SHOW = 0.04;

/** Menu targets (story vh): where each contents entry lands. */
export const TARGETS = {
  cover: 0,
  opening: vhIn("opening", 0.12),
  arts: vhIn("splash", 0.45),
};
