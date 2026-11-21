'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SEGMENTS = [
  { id: 'arts', name: 'Arts', color: '#FF4D8D' },
  { id: 'tech', name: 'Tech', color: '#2F5BFF' },
  { id: 'gaming', name: 'Gaming', color: '#B6FF3B' },
  { id: 'business', name: 'Business', color: '#FF7A1A' },
  { id: 'fun', name: 'Fun', color: '#FFD60A' },
]

/**
 * ScrollProgressBar — 5-segment festival category progress indicator at the viewport top.
 * - Tracks total scroll progress from 0 to 1.
 * - Strictly animates transform scaleX only with transform-origin: left.
 * - Updates DOM refs directly inside GSAP ScrollTrigger ticker to avoid React re-renders.
 */
export default function ScrollProgressBar() {
  const barRefs = useRef([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)

    const updateBars = (progress) => {
      for (let i = 0; i < SEGMENTS.length; i++) {
        const start = i * 0.2
        const segmentProgress = Math.max(0, Math.min(1, (progress - start) / 0.2))
        const bar = barRefs.current[i]
        if (bar) {
          bar.style.transform = `scaleX(${segmentProgress})`
        }
      }
    }

    // Initialize initial state at 0
    updateBars(0)

    const trigger = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        updateBars(self.progress)
      },
    })

    return () => {
      trigger.kill()
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 sm:h-1.5 flex pointer-events-none bg-[#1A1A1A]/10"
      role="progressbar"
      aria-label="Festival scroll progress across 5 categories"
      aria-hidden="true"
    >
      {SEGMENTS.map((seg, idx) => (
        <div
          key={seg.id}
          className="flex-1 h-full overflow-hidden bg-white/20 border-r border-[#1A1A1A]/15 last:border-r-0"
        >
          <div
            ref={(el) => (barRefs.current[idx] = el)}
            className="w-full h-full origin-left will-change-transform"
            style={{
              backgroundColor: seg.color,
              transform: 'scaleX(0)',
            }}
          />
        </div>
      ))}
    </div>
  )
}
