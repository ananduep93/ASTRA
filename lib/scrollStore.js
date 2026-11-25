/**
 * The ONE shared scroll value.
 *
 * Providers.jsx writes it on every scroll tick; the DOM and the 3D canvas read
 * it inside gsap.ticker / useFrame. It is a plain mutable object (not React
 * state) on purpose: reading it never causes a React re-render, so it is free
 * to use 60 times a second.
 */
export const scrollState = {
  progress: 0, // 0 at the top of the page, 1 at the very bottom
  velocity: 0, // pixels per frame, signed (+ = scrolling down)
  scroll: 0, // current scroll position in px
  limit: 0, // max scroll position in px
};

let lenisInstance = null;

export function setLenis(lenis) {
  lenisInstance = lenis;
}

/** The active Lenis instance, or null (reduced motion / not mounted yet). */
export function getLenis() {
  return lenisInstance;
}

/** Update the shared value. Guards against a page shorter than the screen. */
export function writeScroll(scroll, limit, velocity = 0) {
  scrollState.scroll = scroll;
  scrollState.limit = limit;
  scrollState.velocity = velocity;
  scrollState.progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
}
