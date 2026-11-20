'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true when the user prefers reduced motion.
 * All heavy animations (cursor trail, paint-wipe, hero split)
 * must check this and fall back to simple fades or no animation.
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mql.matches)

    const handler = (e) => setPrefersReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}
