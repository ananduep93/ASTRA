/**
 * ASTRA — Shared Motion System Configuration
 * ==========================================
 * Consistent easings, durations, and stagger values across all animations.
 * Strictly adheres to performance guidelines: transform & opacity only.
 */

export const EASINGS = {
  // Ink World: organic, deceleration, fluid calligraphic curves
  ink: [0.25, 1, 0.5, 1],
  inkDecel: 'power3.out',
  inkElastic: 'elastic.out(1, 0.75)',

  // Code World: cyber, sharp, snappy mechanical transitions
  code: [0.16, 1, 0.3, 1],
  codeSnappy: 'power4.out',
  codeSteps: 'steps(5, jump-end)',

  // Neutral smooth UI easings
  smooth: [0.65, 0, 0.35, 1],
  expoOut: 'expo.out',
}

export const DURATIONS = {
  instant: 0.15,
  fast: 0.3,
  medium: 0.55,
  slow: 0.85,
  heroSequence: 2.2, // total hero entrance cap < 2.5s
}

export const STAGGERS = {
  char: 0.08,
  word: 0.12,
  card: 0.14,
  list: 0.08,
}

// Framer Motion / Motion preset variants
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: DURATIONS.fast },
  },
  fadeSlideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATIONS.medium, ease: EASINGS.smooth },
  },
  inkBleed: {
    initial: { opacity: 0, scale: 1.15, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { duration: 0.6, ease: EASINGS.ink },
  },
  codeGlitch: {
    initial: { opacity: 0, x: -6, filter: 'drop-shadow(2px 0 0 #00FFB2)' },
    animate: { opacity: 1, x: 0, filter: 'drop-shadow(0 0 0 transparent)' },
    transition: { duration: 0.45, ease: EASINGS.code },
  },
}
