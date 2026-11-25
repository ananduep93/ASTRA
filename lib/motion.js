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

// 3D world motion. All speeds are per SECOND (time-based, so 60Hz and 120Hz
// screens move identically). Tune here, nowhere else.
export const world = {
  cameraDamping: 3, // how fast the camera catches up to scroll (higher = snappier)
  idleDrift: 0.006, // radians per second the star field turns on its own (keep <= 0.01)
  idleBobAmplitude: 0.05, // world units the field floats up/down when idle
  idleBobSpeed: 0.1, // radians per second of that float cycle (one cycle ~ 63s)
  scrollTwist: 0.25, // extra radians the field turns from top to bottom of the page
  twistDamping: 2.5, // how smoothly that turn settles after you stop scrolling
  maxDelta: 0.1, // cap per-frame time (s) so a tab switch never causes a jump
};

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
