/**
 * ASTRA — Motion System Configuration
 * =====================================
 * Shared easings, durations, staggers, and distance values across all animations.
 * Strictly adheres to performance guidelines: transform & opacity only.
 */

export const EASINGS = {
  // Snappy poster spring & grotesque display transitions
  posterSnap: [0.16, 1, 0.3, 1],
  posterSnapGSAP: 'power3.out',

  // Sticker bounce for badges and pills
  stickerBounce: 'back.out(1.4)',

  // Smooth UI ease for fades and scroll reveals
  smooth: [0.25, 1, 0.5, 1],
  smoothGSAP: 'power2.out',

  // Exponential deceleration for high-velocity reveals
  expoOut: 'expo.out',
  expoInOut: 'expo.inOut',
  power4Out: 'power4.out',
}

export const DURATIONS = {
  instant: 0.1,
  fast: 0.25,
  normal: 0.5,
  reveal: 0.6,
  slow: 0.85,
}

export const STAGGERS = {
  letter: 0.025,
  word: 0.06,
  card: 0.1,
  row: 0.07,
}

export const DISTANCES = {
  desktop: 20,
  mobile: 10,
}
