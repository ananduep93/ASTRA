'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * CountUp — Animated numeric counter driven by ScrollTrigger viewport entry.
 * Uses integer formatting, optional prefix/suffix, and full cleanup on unmount.
 */
export default function CountUp({
  to = 0,
  from = 0,
  duration = 1.6,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(from)
  const elementRef = useRef(null)
  const prefersReduced = useReducedMotion()

  const formatNumber = (val) => {
    const rounded = Math.round(val)
    if (!separator) return `${prefix}${rounded}${suffix}`
    return `${prefix}${rounded.toLocaleString()}${suffix}`
  }

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(to)
      return
    }

    const el = elementRef.current
    if (!el) return

    const counterObj = { val: from }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counterObj, {
          val: to,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            setDisplayValue(counterObj.val)
          },
        })
      },
    })

    return () => {
      trigger.kill()
    }
  }, [to, from, duration, prefersReduced])

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {formatNumber(displayValue)}
    </span>
  )
}
