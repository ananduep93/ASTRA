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

// 3D camera follow: how quickly the camera catches up to scroll (higher = snappier).
export const cameraDamping = 4;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
