'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const BARS = [
  { color: '#FF4D8D', name: 'Arts' },
  { color: '#2F5BFF', name: 'Tech' },
  { color: '#B6FF3B', name: 'Gaming' },
  { color: '#FF7A1A', name: 'Business' },
  { color: '#FFD60A', name: 'Fun' },
]

const WORDS = [
  { text: 'Hi.', delay: 0.1, duration: 0.55 },
  { text: 'We are...', delay: 0.75, duration: 0.55 },
  { text: 'ASTRA 2026', delay: 1.4, duration: 0.65, isFinal: true },
]

export default function IntroSequence({ onComplete }) {
  const [active, setActive] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const prefersReduced = useReducedMotion()
  const timerRef = useRef([])

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem('astra_intro_seen', 'true')
    } catch (e) {
      // Ignore storage errors in private browsing
    }
    document.body.style.overflow = ''
    if (window.__lenis) {
      window.__lenis.start()
    }
    setActive(false)
    if (onComplete) onComplete()
  }, [onComplete])

  useEffect(() => {
    // Allow URL override (?intro=1 or ?intro=true) for easy testing across page reloads
    const isForced = typeof window !== 'undefined' && window.location.search.includes('intro')

    if (!isForced) {
      if (prefersReduced) {
        return
      }

      try {
        const seen = sessionStorage.getItem('astra_intro_seen')
        if (seen === 'true') {
          return
        }
      } catch (e) {
        return
      }
    }

    // Expose global replay function for developer testing
    if (typeof window !== 'undefined') {
      window.__replayIntro = () => {
        try {
          sessionStorage.removeItem('astra_intro_seen')
        } catch (e) {}
        window.location.href = '/?intro=1'
      }
    }

    // Reset sequence state
    setWordIndex(0)
    setActive(true)
    document.body.style.overflow = 'hidden'
    if (window.__lenis) {
      window.__lenis.stop()
    }

    // Sequence word transitions (total sequence under 2.6s)
    const t1 = setTimeout(() => setWordIndex(1), 650)
    const t2 = setTimeout(() => setWordIndex(2), 1400)
    const tEnd = setTimeout(() => finish(), 2450)

    timerRef.current = [t1, t2, tEnd]

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      timerRef.current.forEach(clearTimeout)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      if (window.__lenis) window.__lenis.start()
    }
  }, [prefersReduced, finish])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          role="dialog"
          aria-label="Welcome intro"
          aria-modal="true"
          onClick={finish}
          initial={{ opacity: 1 }}
          exit={{
            y: '-100%',
            transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] },
          }}
          className="fixed inset-0 z-[100] bg-[#F7F1E5] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
        >
          {/* Decorative 5 category-color bars sliding in from left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none" aria-hidden="true">
            {BARS.map((bar, i) => (
              <motion.div
                key={`left-${bar.name}`}
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '0%', opacity: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.05 + i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="w-8 sm:w-16 h-2 sm:h-3 rounded-r-full shadow-[2px_2px_0px_#1A1A1A] border-y-2 border-r-2 border-[#1A1A1A]"
                style={{ backgroundColor: bar.color }}
              />
            ))}
          </div>

          {/* Decorative 5 category-color bars sliding in from right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none" aria-hidden="true">
            {BARS.map((bar, i) => (
              <motion.div
                key={`right-${bar.name}`}
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: '0%', opacity: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.05 + i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="w-8 sm:w-16 h-2 sm:h-3 rounded-l-full shadow-[-2px_2px_0px_#1A1A1A] border-y-2 border-l-2 border-[#1A1A1A]"
                style={{ backgroundColor: bar.color }}
              />
            ))}
          </div>

          {/* Cycling Center Words */}
          <div className="relative h-20 sm:h-28 flex items-center justify-center text-center px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={wordIndex}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 1.05 }}
                transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                className="flex flex-col items-center"
              >
                {WORDS[wordIndex].isFinal ? (
                  <div className="flex flex-col items-center">
                    <span className="sticker-pill -rotate-2 bg-[#FFD60A] text-[#1A1A1A] text-[10px] sm:text-xs mb-2">
                      FESTIVAL 2026
                    </span>
                    <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl text-[#1A1A1A] uppercase tracking-tight leading-none">
                      {WORDS[wordIndex].text}
                    </h1>
                  </div>
                ) : (
                  <h2 className="font-display text-4xl sm:text-6xl text-[#1A1A1A] tracking-tight">
                    {WORDS[wordIndex].text}
                  </h2>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tap to skip hint */}
          <div className="absolute bottom-8 text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 flex items-center gap-1.5">
            <span>Tap anywhere to enter</span>
            <span>→</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
