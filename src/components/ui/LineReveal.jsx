'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS, DURATIONS, STAGGERS } from '@/lib/motion'

/**
 * LineReveal — Masked text reveal.
 * Wraps lines in overflow-hidden containers and slides each line up into view.
 * Uses useInView on the parent container to reliably trigger even with overflow hidden.
 * Fully accessible: passes complete text to screen readers via aria-label.
 */
export default function LineReveal({
  lines,
  children,
  as: Component = 'div',
  className = '',
  lineClassName = '',
  delay = 0,
  stagger = STAGGERS.word,
  duration = DURATIONS.medium,
}) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '0px 0px -30px 0px' })
  const prefersReduced = useReducedMotion()

  // Normalize input into an array of lines
  let textLines = []
  if (Array.isArray(lines)) {
    textLines = lines
  } else if (typeof lines === 'string') {
    textLines = lines.split('\n')
  } else if (typeof children === 'string') {
    textLines = children.split('\n')
  } else {
    textLines = [children]
  }

  const fullText = textLines.filter((l) => typeof l === 'string').join(' ')

  if (prefersReduced) {
    return (
      <Component ref={containerRef} className={className}>
        {textLines.map((line, idx) => (
          <span key={idx} className={`block ${lineClassName}`}>
            {line}
          </span>
        ))}
      </Component>
    )
  }

  return (
    <Component ref={containerRef} className={className} aria-label={fullText || undefined}>
      {textLines.map((line, idx) => (
        <span
          key={idx}
          className="block overflow-hidden py-0.5"
          aria-hidden={Boolean(fullText)}
        >
          <motion.span
            className={`block will-change-transform ${lineClassName}`}
            initial={{ y: '110%', opacity: 0.1 }}
            animate={isInView ? { y: '0%', opacity: 1 } : { y: '110%', opacity: 0.1 }}
            transition={{
              duration,
              delay: delay + idx * stagger,
              ease: EASINGS.ink,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Component>
  )
}
