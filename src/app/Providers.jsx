'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { WorldProvider } from '@/context/WorldContext'
import CursorTrail from '@/components/effects/CursorTrail'
import PaintWipe from '@/components/effects/PaintWipe'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function LenisProvider({ children }) {
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    // Skip smooth scrolling if user prefers reduced motion
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [prefersReduced])

  return children
}

/**
 * Client-side providers wrapper.
 * layout.js stays a server component; all client-side context lives here.
 */
export default function Providers({ children }) {
  return (
    <WorldProvider>
      <LenisProvider>
        <CursorTrail />
        <PaintWipe />
        {children}
      </LenisProvider>
    </WorldProvider>
  )
}
