'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WorldProvider } from '@/context/WorldContext'
import CursorTrail from '@/components/effects/CursorTrail'
import PaintWipe from '@/components/effects/PaintWipe'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Register ScrollTrigger once on the client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

function SmoothScrollProvider({ children }) {
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) return

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    })

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    const tickerCallback = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tickerCallback)
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
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
      <SmoothScrollProvider>
        <CursorTrail />
        <PaintWipe />
        {children}
      </SmoothScrollProvider>
    </WorldProvider>
  )
}
