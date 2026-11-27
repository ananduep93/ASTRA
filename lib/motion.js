/**
 * Shared motion config. Every animation (GSAP tweens, CSS transitions, the
 * page moves and zooms) takes its easing, duration, stagger and pacing from
 * here. Values come from lib/theme.js so there is only one source.
 */
import { eases, durations, staggers, comic } from "./theme";

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
  touchMultiplier: 1, // touch stays native on phones (Lenis does not take it over)
};

/** Scene progress smoothing (time-based, the same on 60 Hz and 120 Hz screens). */
export const scrollSmoothing = {
  damping: 8, // how fast the scene catches the scroll position (higher = snappier)
  maxDelta: 0.1, // cap per-frame time (s) so a tab switch never causes a jump
  settleOnLoad: 0.6, // seconds after load during which the scene snaps to the scroll (reload mid-page)
};

/**
 * SPEED LIMITER (guided pace). The page scrolls natively and instantly; the
 * scene (page moves, wipes, zooms, text) follows at most this fast, so a hard
 * flick can't race through the issue unseen. In story vh per second, so it
 * stays the same as more chapters are added. Reduced motion: no pacing.
 */
export const pacing = {
  maxVhPerSecond: 38,
};

/** Touch devices: same story over more finger travel. Same query as globals.css. */
export const TOUCH_QUERY = "(pointer: coarse)";
export const touchScroll = {
  lengthMultiplier: 1.2, // page scroll length on touch vs desktop
  damping: 6, // a touch calmer than desktop
};

/** Panel wipes: skewed clip-path from the gutter. */
export const wipe = {
  skew: comic.skew, // % slant of the leading edge
  duration: durations.slow * 0.9,
  stagger: staggers.loose, // between panels that reveal together
};

/** Menu and detail sheet. */
export const menuMotion = {
  open: durations.base,
  close: durations.fast * 1.4,
  itemStagger: staggers.base,
  // Scroll trip when an item is chosen: grows with distance (story vh), capped.
  tripMin: 0.9,
  tripPerVh: 0.0012,
  tripMax: 2.4,
};

/** Seconds for a menu trip of `distanceVh` story vh. */
export const tripDuration = (distanceVh) =>
  Math.min(menuMotion.tripMax, menuMotion.tripMin + Math.abs(distanceVh) * menuMotion.tripPerVh);

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
