'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

function SmoothScrollProvider({ children }) {
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) {
      // Clean up triggers if reduced motion is enabled
      ScrollTrigger.getAll().forEach((t) => t.kill())
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      infinite: false,
    })

    // Sync Lenis scroll position → GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Single RAF loop driving both Lenis and GSAP
    const tickerCallback = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    // Expose lenis globally for interactive controls (e.g. mobile menu lock, scroll buttons)
    window.__lenis = lenis

    // Recalculate ScrollTrigger measurements once all self-hosted web fonts have finished loading
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh()
      })
    }

    return () => {
      gsap.ticker.remove(tickerCallback)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      lenis.destroy()
      delete window.__lenis
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
    <SmoothScrollProvider>
      {children}
    </SmoothScrollProvider>
  )
}
