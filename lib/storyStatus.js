/**
 * Small shared state for the story beats that are TIME-based (not scroll-based).
 * Plain mutable object, like lib/scrollStore.js: written and read inside
 * gsap.ticker callbacks, never causes a React re-render. No three.js in here,
 * so DOM components can import it without pulling in the 3D bundle.
 */
export const storyStatus = {
  heroForm: 0, // 0..1 how formed the ASTRA 2027 headline is (HeroParticles writes it)
  heroRunning: false, // the hero intro has started (letters sampled)
  heroSkipped: false, // reloaded mid-page: the hero intro (and the transmission) are skipped
  // Opening transmission: "waiting" -> "typing" -> "comet" -> "done" (or "skipped")
  transmission: "waiting",
  replayHero: false, // set by the menu's Home: HeroParticles forms ASTRA 2027 again, then clears it
};
