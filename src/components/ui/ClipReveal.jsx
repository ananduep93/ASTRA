'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS, DURATIONS } from '@/lib/motion'

/**
 * ClipReveal — Cinematic container reveal with clip-path wipe and image zoom out.
 * Features an optional accent curtain that sweeps across as the content unmasks.
 * Uses useInView on the unclipped parent container to guarantee reliable triggering.
 */
export default function ClipReveal({
  src,
  alt = 'ASTRA showcase image',
  children,
  aspectRatio = '16/9',
  direction = 'up',
  className = '',
  imageClassName = '',
  showCurtain = true,
  curtainColor = 'var(--w-accent)',
  delay = 0,
  duration = DURATIONS.slow,
}) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '0px 0px -30px 0px' })
  const prefersReduced = useReducedMotion()

  const clipDirections = {
    up: {
      initial: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
      animate: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    },
    down: {
      initial: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
      animate: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    },
    right: {
      initial: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
      animate: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    },
  }

  const selectedClip = clipDirections[direction] || clipDirections.up

  if (prefersReduced) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={{ aspectRatio }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${imageClassName}`}
          />
        ) : (
          children
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Animated reveal container */}
      <motion.div
        className="relative w-full h-full overflow-hidden will-change-transform"
        initial={{ clipPath: selectedClip.initial }}
        animate={isInView ? { clipPath: selectedClip.animate } : { clipPath: selectedClip.initial }}
        transition={{
          duration,
          delay,
          ease: EASINGS.ink,
        }}
      >
        {/* Inner scaled image/content that zooms out to 1 */}
        <motion.div
          className="w-full h-full"
          initial={{ scale: 1.15 }}
          animate={isInView ? { scale: 1 } : { scale: 1.15 }}
          transition={{
            duration: duration * 1.2,
            delay,
            ease: EASINGS.ink,
          }}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className={`w-full h-full object-cover ${imageClassName}`}
            />
          ) : (
            children
          )}
        </motion.div>

        {/* Leading accent curtain sweep */}
        {showCurtain && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ backgroundColor: curtainColor }}
            initial={{ opacity: 0.85, y: '0%' }}
            animate={isInView ? { opacity: 0, y: '-100%' } : { opacity: 0.85, y: '0%' }}
            transition={{
              duration: duration * 0.75,
              delay: delay + 0.1,
              ease: EASINGS.smooth,
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
