'use client'

import { useRef, useMemo } from 'react'
import { motion, useInView } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS, DURATIONS, STAGGERS } from '@/lib/motion'

/**
 * SplitHeading — Accessible, staggered character reveal for section headings.
 * - Splits heading into words (inline-block whitespace-nowrap) so lines never break mid-word.
 * - Screen-reader accessible: aria-label on parent heading, aria-hidden on letter spans.
 * - Animate transform and opacity only.
 * - Respects prefers-reduced-motion: simple opacity fade without movement.
 */
export default function SplitHeading({
  text = '',
  as: Component = 'h2',
  className = '',
  delay = 0,
  stagger = STAGGERS.letter,
  duration = DURATIONS.normal,
}) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-20px 0px' })
  const prefersReduced = useReducedMotion()

  // Tokenize text into words and letters while maintaining global character index
  const tokenizedWords = useMemo(() => {
    let globalIndex = 0
    const rawWords = (text || '').trim().split(/\s+/)

    return rawWords.map((word, wIdx) => {
      const letters = word.split('').map((char) => {
        const idx = globalIndex++
        return { char, idx }
      })
      return { word, letters, wIdx }
    })
  }, [text])

  // Reduced motion fallback: accessible heading with a clean CSS fade
  if (prefersReduced) {
    return (
      <Component
        ref={containerRef}
        className={`font-display ${className}`}
        style={{
          opacity: isInView ? 1 : 0,
          transition: `opacity ${duration}s ease`,
        }}
      >
        {text}
      </Component>
    )
  }

  return (
    <Component
      ref={containerRef}
      className={`font-display ${className}`}
      aria-label={text}
    >
      {tokenizedWords.map(({ letters, wIdx }) => (
        <span
          key={`w-${wIdx}`}
          className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0 align-baseline"
          aria-hidden="true"
        >
          {letters.map(({ char, idx }) => (
            <motion.span
              key={`c-${idx}`}
              className="inline-block will-change-transform"
              initial={{ y: '0.55em', opacity: 0 }}
              animate={isInView ? { y: '0em', opacity: 1 } : { y: '0.55em', opacity: 0 }}
              transition={{
                duration: duration,
                delay: delay + idx * stagger,
                ease: EASINGS.posterSnap,
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </Component>
  )
}
