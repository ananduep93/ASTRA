'use client'

import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS, DURATIONS } from '@/lib/motion'

/**
 * BrushUnderline — Animated SVG underline with a stroke-dashoffset draw effect.
 * Renders an organic hand-drawn stroke with non-scaling stroke weight.
 * Triggers cleanly when entering viewport.
 */
export default function BrushUnderline({
  className = '',
  color = 'var(--w-accent)',
  height = 12,
  strokeWidth = 3,
  delay = 0.2,
  duration = DURATIONS.slow,
}) {
  const prefersReduced = useReducedMotion()

  // Organic calligraphic brush path with subtle taper and wave
  const pathD =
    'M 2 8 C 30 2, 80 12, 140 6 C 200 1, 260 11, 318 6 C 350 3, 380 9, 398 7'

  if (prefersReduced) {
    return (
      <svg
        className={`block w-full overflow-visible ${className}`}
        viewBox="0 0 400 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ height }}
        aria-hidden="true"
      >
        <path
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <svg
      className={`block w-full overflow-visible ${className}`}
      viewBox="0 0 400 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden="true"
    >
      <motion.path
        d={pathD}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration,
          delay,
          ease: EASINGS.ink,
        }}
      />
    </svg>
  )
}
