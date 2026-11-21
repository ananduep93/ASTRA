'use client'

import { useRef, useMemo } from 'react'
import { motion, useInView } from 'motion/react'
import { useWorld, WORLDS } from '@/context/WorldContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS, DURATIONS, STAGGERS } from '@/lib/motion'

/**
 * SplitHeading — Accessible, staggered character reveal for section headings.
 * - Splits heading into words (inline-block whitespace-nowrap) so lines never break mid-word.
 * - Screen-reader accessible: aria-label on parent heading, aria-hidden on letter spans.
 * - Animate transform and opacity only.
 * - Optional prop `accentLetters=[indexes]`: those letters flip between Ink style (serif, gold)
 *   and Code style (mono, mint) once as they enter, then settle.
 * - Reduced motion: plain fade-in without transforms.
 */
export default function SplitHeading({
  text = '',
  as: Component = 'h2',
  className = '',
  accentLetters = [],
  delay = 0,
  stagger = 0.035,
  duration = DURATIONS.medium,
}) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '0px 0px -40px 0px' })
  const { world } = useWorld()
  const prefersReduced = useReducedMotion()

  const isCode = world === WORLDS.CODE

  // Tokenize text into words and letters while tracking global letter index
  const tokenizedWords = useMemo(() => {
    let globalIndex = 0
    const rawWords = text.split(' ')

    return rawWords.map((word, wIdx) => {
      const letters = word.split('').map((char) => {
        const idx = globalIndex++
        const isAccent = accentLetters.includes(idx)
        return { char, idx, isAccent }
      })
      return { word, letters, wIdx }
    })
  }, [text, accentLetters])

  // Reduced motion fallback: plain opacity fade
  if (prefersReduced) {
    return (
      <Component
        ref={containerRef}
        className={`font-display ${className}`}
        style={{
          opacity: isInView ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {text}
      </Component>
    )
  }

  return (
    <Component
      ref={containerRef}
      className={`font-display leading-tight ${className}`}
      aria-label={text}
    >
      {tokenizedWords.map(({ letters, wIdx }) => (
        <span
          key={`w-${wIdx}`}
          className="inline-block whitespace-nowrap mr-[0.28em] last:mr-0"
          aria-hidden="true"
        >
          {letters.map(({ char, idx, isAccent }) => {
            const letterDelay = delay + idx * stagger

            if (isAccent) {
              return (
                <span
                  key={`l-${idx}`}
                  className="relative inline-block [perspective:800px] will-change-transform align-top"
                >
                  <motion.span
                    className="inline-block relative [transform-style:preserve-3d] will-change-transform"
                    initial={{ y: '0.65em', opacity: 0, rotateY: 0 }}
                    animate={
                      isInView
                        ? {
                            y: '0em',
                            opacity: 1,
                            rotateY: 360,
                          }
                        : { y: '0.65em', opacity: 0, rotateY: 0 }
                    }
                    transition={{
                      duration: duration * 1.35,
                      delay: letterDelay,
                      ease: EASINGS.smooth,
                    }}
                  >
                    {/* Front Face: Active world accent */}
                    <span
                      className="inline-block [backface-visibility:hidden]"
                      style={{
                        fontFamily: isCode ? "'AstraMono', monospace" : "'AstraDisplay', serif",
                        color: isCode ? '#00FFB2' : '#C4841D',
                        textShadow: isCode
                          ? '0 0 16px rgba(0, 255, 178, 0.5)'
                          : '1px 2px 0px rgba(196, 132, 29, 0.3)',
                      }}
                    >
                      {char}
                    </span>

                    {/* Back Face (flips into view during entrance): Opposite world style */}
                    <span
                      className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
                      style={{
                        fontFamily: isCode ? "'AstraDisplay', serif" : "'AstraMono', monospace",
                        color: isCode ? '#C4841D' : '#00FFB2',
                        textShadow: isCode
                          ? '1px 2px 0px rgba(196, 132, 29, 0.3)'
                          : '0 0 16px rgba(0, 255, 178, 0.5)',
                      }}
                    >
                      {char}
                    </span>
                  </motion.span>
                </span>
              )
            }

            // Standard letter rise + fade in
            return (
              <span
                key={`l-${idx}`}
                className="inline-block overflow-hidden align-top"
              >
                <motion.span
                  className="inline-block will-change-transform"
                  initial={{ y: '0.7em', opacity: 0 }}
                  animate={
                    isInView
                      ? { y: '0em', opacity: 1 }
                      : { y: '0.7em', opacity: 0 }
                  }
                  transition={{
                    duration,
                    delay: letterDelay,
                    ease: EASINGS.ink,
                  }}
                >
                  {char}
                </motion.span>
              </span>
            )
          })}
        </span>
      ))}
    </Component>
  )
}
