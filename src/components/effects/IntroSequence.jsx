'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const BARS = [
  { color: '#FF4D8D', name: 'Arts' },     // Col 1: Arts pink
  { color: '#2F5BFF', name: 'Tech' },     // Col 2: Tech blue
  { color: '#B6FF3B', name: 'Gaming' },   // Col 3: Gaming lime
  { color: '#FF7A1A', name: 'Business' }, // Col 4: Business orange
  { color: '#FFD60A', name: 'Fun' },      // Col 5: Fun yellow
]

export default function IntroSequence({ onComplete }) {
  const [active, setActive] = useState(false)
  const prefersReduced = useReducedMotion()

  const containerRef = useRef(null)
  const introAstraRef = useRef(null)
  const counterRef = useRef(null)
  const counterPillRef = useRef(null)
  const timelineRef = useRef(null)
  const isFinishedRef = useRef(false)

  const cleanupPendingClass = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('astra-intro-pending')
    }
  }, [])

  const finish = useCallback(() => {
    if (isFinishedRef.current) return
    isFinishedRef.current = true

    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    try {
      sessionStorage.setItem('astra_intro_seen', 'true')
    } catch (e) {
      // Ignore private browsing storage restrictions
    }

    cleanupPendingClass()
    document.body.style.overflow = ''

    // Ensure real hero title & elements are completely visible
    const heroEl = document.getElementById('hero-astra')
    if (heroEl) {
      heroEl.style.visibility = 'visible'
      heroEl.style.opacity = '1'
    }
    const heroItems = document.querySelectorAll('.hero-anim-item')
    heroItems.forEach((el) => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
    const navHeader = document.querySelector('header')
    if (navHeader) {
      navHeader.style.opacity = '1'
      navHeader.style.transform = 'none'
    }

    // Clean up will-change on animation targets
    if (containerRef.current) {
      const bars = containerRef.current.querySelectorAll('.curtain-bar')
      const chars = containerRef.current.querySelectorAll('.intro-char')
      gsap.set([bars, chars, introAstraRef.current], { clearProps: 'willChange' })
    }

    // Resume Lenis smooth scroll & refresh ScrollTrigger
    if (window.__lenis) {
      window.__lenis.start()
    }
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh()
    }

    setActive(false)
    if (onComplete) onComplete()
  }, [cleanupPendingClass, onComplete])

  // Phase 1: Check session and user preferences on mount
  useEffect(() => {
    const isForced = typeof window !== 'undefined' && window.location.search.includes('intro')

    // Reduced motion or already seen: skip intro entirely
    if (!isForced) {
      if (prefersReduced) {
        cleanupPendingClass()
        return
      }

      try {
        const seen = sessionStorage.getItem('astra_intro_seen')
        if (seen === 'true') {
          cleanupPendingClass()
          return
        }
      } catch (e) {
        cleanupPendingClass()
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

    // Activate overlay & freeze scrolling
    isFinishedRef.current = false
    setActive(true)
    document.body.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    if (window.__lenis) {
      window.__lenis.stop()
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      cleanupPendingClass()
      document.body.style.overflow = ''
      if (window.__lenis) {
        window.__lenis.start()
      }
    }
  }, [prefersReduced, finish, cleanupPendingClass])

  // Phase 2: When active becomes true and DOM is rendered, construct the GSAP timeline
  useEffect(() => {
    if (!active) return

    const heroEl = document.getElementById('hero-astra')
    const introAstraEl = introAstraRef.current
    if (!containerRef.current || !introAstraEl) return

    const bars = containerRef.current.querySelectorAll('.curtain-bar')
    const chars = introAstraEl.querySelectorAll('.intro-char')

    // Set will-change only during animation
    gsap.set(bars, { willChange: 'transform' })
    gsap.set(chars, { willChange: 'transform, opacity' })
    gsap.set(introAstraEl, { willChange: 'transform' })

    // Initial states
    gsap.set(bars, { yPercent: 100 })
    gsap.set(chars, { yPercent: 120, opacity: 0 })
    gsap.set(introAstraEl, { x: 0, y: 0, scale: 1 })

    // Hide hero title during intro so it never appears twice
    if (heroEl) {
      heroEl.style.visibility = 'hidden'
    }

    // Build master GSAP timeline (duration ~2.8s)
    const tl = gsap.timeline({
      onComplete: () => {
        finish()
      },
    })
    timelineRef.current = tl
    if (typeof window !== 'undefined') {
      window.__introTimeline = tl
    }

    // Small counter 00 to 100 driven by timeline progress
    tl.eventCallback('onUpdate', () => {
      if (counterRef.current) {
        const p = Math.min(100, Math.max(0, Math.round(tl.progress() * 100)))
        counterRef.current.textContent = String(p).padStart(2, '0')
      }
    })

    // 0.0 - 0.8s: Five full-height bars rise from the bottom to fill the screen
    // Stagger 0.08s, ease "expo.out"
    tl.to(
      bars,
      {
        yPercent: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'expo.out',
      },
      0.0
    )

    // 0.4 - 1.6s: Giant "ASTRA" centered in ink color, letters rising
    // Stagger 0.05s, ease "power4.out"
    tl.to(
      chars,
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.05,
        ease: 'power4.out',
      },
      0.4
    )

    // 1.6 - 2.4s: Bars slide up and off the top, revealing the hero
    // Stagger 0.07s, ease "expo.inOut"
    tl.to(
      bars,
      {
        yPercent: -100,
        duration: 0.65,
        stagger: 0.07,
        ease: 'expo.inOut',
      },
      1.6
    )

    // Fade out counter pill smoothly as curtains lift
    if (counterPillRef.current) {
      tl.to(counterPillRef.current, { opacity: 0, duration: 0.35 }, 1.9)
    }

    // Measure geometry for shared-element handoff
    const heroRect = heroEl ? heroEl.getBoundingClientRect() : { left: 16, top: 200, width: 300 }
    const introRect = introAstraEl.getBoundingClientRect()

    const scale = introRect.width > 0 ? heroRect.width / introRect.width : 1
    const dx = heroRect.left - introRect.left
    const dy = heroRect.top - introRect.top

    // 2.0 - 2.6s: Shared-element handoff (ASTRA scales & translates to hero title)
    tl.to(
      introAstraEl,
      {
        x: dx,
        y: dy,
        scale: scale,
        duration: 0.6,
        ease: 'power3.inOut',
      },
      2.0
    )

    // At 2.6s: Swap visibility from intro ASTRA to real hero title
    if (heroEl) {
      tl.set(heroEl, { visibility: 'visible', opacity: 1 }, 2.6)
    }
    tl.set(introAstraEl, { visibility: 'hidden' }, 2.6)

    // 2.4 - 2.8s: Hero elements (navbar, pill, subtitle, buttons) fade & rise in
    const navHeader = document.querySelector('header')
    const heroItems = document.querySelectorAll('.hero-anim-item')

    if (navHeader) {
      tl.fromTo(
        navHeader,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' },
        2.4
      )
    }

    if (heroItems.length > 0) {
      tl.fromTo(
        heroItems,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.42, stagger: 0.06, ease: 'power2.out' },
        2.45
      )
    }

    return () => {
      tl.kill()
    }
  }, [active, finish])

  if (!active) return null

  return (
    <aside
      ref={containerRef}
      role="dialog"
      aria-label="Welcome intro"
      aria-modal="true"
      onClick={finish}
      className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto select-none cursor-pointer"
    >
      {/* 5 Full-Height Curtain Bars (20% width each) */}
      <div className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
        {BARS.map((bar) => (
          <div
            key={bar.name}
            className="curtain-bar h-full flex-1 relative border-r border-[#1A1A1A]/10 last:border-r-0"
            style={{ backgroundColor: bar.color }}
          />
        ))}
      </div>

      {/* Center Intro ASTRA (Shared-Element) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4">
        <div
          ref={introAstraRef}
          className="inline-block font-display text-hero text-[#1A1A1A] tracking-tight leading-[0.88] select-none text-center"
          style={{ transformOrigin: 'top left' }}
        >
          {['A', 'S', 'T', 'R', 'A'].map((char, i) => (
            <span key={i} className="inline-block overflow-hidden align-top">
              <span className="intro-char inline-block">
                {char}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Small Counter 00-100 in corner */}
      <div
        ref={counterPillRef}
        className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-20 pointer-events-none sticker-pill bg-white text-[#1A1A1A] font-mono text-xs sm:text-sm font-bold tracking-wider select-none shadow-[2px_2px_0px_#1A1A1A]"
        aria-hidden="true"
      >
        <span className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
        <span ref={counterRef} className="tabular-nums">
          00
        </span>
        <span className="text-[#1A1A1A]/40 text-[10px]">%</span>
      </div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          finish()
        }}
        className="absolute top-5 left-5 sm:top-8 sm:left-8 z-30 sticker-pill bg-white text-[#1A1A1A] text-[11px] font-bold uppercase tracking-wider hover:bg-[#FFD60A] transition-colors cursor-pointer"
        aria-label="Skip intro sequence"
      >
        <span>Skip</span>
        <span className="font-bold">→</span>
      </button>
    </aside>
  )
}
