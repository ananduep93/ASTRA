'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import { EASINGS, DURATIONS, DISTANCES } from '@/lib/motion'

/**
 * Reveal — High-performance scroll reveal component for cards and list rows.
 * - Staggered fade + slide up on entering the viewport.
 * - Strictly animates transform and opacity only.
 * - Automatically reduces distances on mobile / low-end devices.
 * - Respects prefers-reduced-motion with an instant or simple fade.
 */
export default function Reveal({
  children,
  as: Component = 'div',
  className = '',
  delay = 0,
  index = 0,
  staggerStep = 0.07,
  duration = DURATIONS.normal,
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-30px 0px' })
  const prefersReduced = useReducedMotion()
  const { isMobile } = useDeviceCapability()

  const totalDelay = delay + index * staggerStep
  const travelDistance = isMobile ? DISTANCES.mobile : DISTANCES.desktop

  if (prefersReduced) {
    return (
      <Component
        ref={ref}
        className={className}
        style={{
          opacity: isInView ? 1 : 0,
          transition: `opacity ${duration}s ease`,
        }}
      >
        {children}
      </Component>
    )
  }

  const MotionComponent = motion[Component] || motion.div

  return (
    <MotionComponent
      ref={ref}
      className={`${className} will-change-transform`}
      initial={{ opacity: 0, y: travelDistance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: travelDistance }}
      transition={{
        duration: duration,
        delay: totalDelay,
        ease: EASINGS.posterSnap,
      }}
    >
      {children}
    </MotionComponent>
  )
}
