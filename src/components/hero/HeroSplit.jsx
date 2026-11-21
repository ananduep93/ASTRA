'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Countdown from '@/components/ui/Countdown'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import gsap from 'gsap'

const LETTERS = ['A', 'S', 'T', 'R', 'A']

export default function HeroSplit() {
  const DEFAULT_SPLIT = 50
  const [splitPos, setSplitPos] = useState(DEFAULT_SPLIT)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const containerRef = useRef(null)
  const handleRef = useRef(null)
  const prefersReduced = useReducedMotion()

  // Intro sweep and idle nudge animation:
  // Sequenced after letter load (~0.75s), sweeps and settles before 2.2s.
  useEffect(() => {
    if (prefersReduced) {
      setSplitPos(DEFAULT_SPLIT)
      return
    }

    const state = { pos: 18 }
    setSplitPos(18)

    const tl = gsap.timeline({ delay: 0.75 })
    tl.to(state, {
      pos: 68,
      duration: 0.65,
      ease: 'power2.inOut',
      onUpdate: () => setSplitPos(state.pos),
    })
      .to(state, {
        pos: DEFAULT_SPLIT,
        duration: 0.55,
        ease: 'power3.out',
        onUpdate: () => setSplitPos(state.pos),
      })
      // Subtle idle nudge: left-right hint 800ms after settling if user hasn't interacted
      .to(
        state,
        {
          pos: DEFAULT_SPLIT - 3,
          duration: 0.35,
          ease: 'power1.inOut',
          onUpdate: () => {
            if (!hasInteracted) setSplitPos(state.pos)
          },
        },
        '+=0.8'
      )
      .to(state, {
        pos: DEFAULT_SPLIT + 3,
        duration: 0.45,
        ease: 'power1.inOut',
        onUpdate: () => {
          if (!hasInteracted) setSplitPos(state.pos)
        },
      })
      .to(state, {
        pos: DEFAULT_SPLIT,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: () => {
          if (!hasInteracted) setSplitPos(state.pos)
        },
      })

    return () => {
      tl.kill()
    }
  }, [prefersReduced, hasInteracted])

  const calculateSplit = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percent = (relativeX / rect.width) * 100
    const clamped = Math.max(12, Math.min(88, percent))
    setSplitPos(clamped)
  }, [])

  // Universal pointer down (handle or anywhere on hero container)
  const handlePointerDown = (e) => {
    setIsDragging(true)
    setHasInteracted(true)
    calculateSplit(e.clientX)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {}
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    calculateSplit(e.clientX)
  }

  const handlePointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {}
    setIsDragging(false)
  }

  // Global window listeners while dragging ensures 100% smooth touch/pointer tracking
  useEffect(() => {
    if (!isDragging) return

    const onWindowPointerMove = (e) => {
      calculateSplit(e.clientX)
    }

    const onWindowPointerUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('pointermove', onWindowPointerMove, { passive: true })
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerUp)
      window.removeEventListener('pointercancel', onWindowPointerUp)
    }
  }, [isDragging, calculateSplit])

  // Mouse hover interaction on desktop
  const handleContainerMouseMove = (e) => {
    if (prefersReduced || isDragging) return
    calculateSplit(e.clientX)
  }

  // Common title styles shared across both layers to guarantee 100% identical metrics
  const titleStyle = {
    fontFamily: "'AstraDisplay', Georgia, serif",
    fontWeight: 700,
    fontSize: 'clamp(3.4rem, 16.5vw, 11.5rem)',
    letterSpacing: 'clamp(0.06em, 2vw, 0.16em)',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    margin: 0,
    padding: 0,
    userSelect: 'none',
  }

  return (
    <section className="relative w-full overflow-hidden pt-6 pb-16 sm:py-16 lg:py-20 border-b border-[var(--w-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        {/* Fest Origin Pill */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1 mb-3 text-[11px] sm:text-xs font-mono tracking-wider border border-[var(--w-border)] bg-[var(--w-card-bg)] text-[var(--w-text-secondary)] shadow-sm"
          style={{ borderRadius: 'var(--w-button-radius)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--w-accent)]" />
          <span>DON BOSCO COLLEGE, MAMPETTA</span>
          <span className="opacity-40">•</span>
          <span className="text-[var(--w-accent)] font-semibold">ANNUAL FEST</span>
        </div>

        {/* Drag Hint: Placed above title, fades out after first interaction */}
        <div
          className={`transition-opacity duration-500 mb-4 pointer-events-none select-none ${
            hasInteracted ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden={hasInteracted}
        >
          <span
            className="text-[10px] sm:text-xs font-mono px-3.5 py-1 bg-[var(--w-card-bg)] border border-[var(--w-border)] text-[var(--w-text-secondary)] shadow-sm inline-flex items-center gap-2"
            style={{ borderRadius: 'var(--w-button-radius)' }}
          >
            <span className="text-[var(--w-accent)] animate-pulse">◀ ▶</span>
            <span>Drag handle or slide anywhere horizontally</span>
          </span>
        </div>

        {/* =========================================================================
            STRUCTURAL ASTRA SPLIT STAGE
            - touch-action: pan-y (preserves natural vertical scrolling)
            - data-lenis-prevent (prevents smooth scroll hijacking on drag)
            - Layer 1 (Bottom): Full-width INK layer
            - Layer 2 (Top): Full-width CODE layer, clipped via clip-path
            - Titles in both layers share 100% identical metrics, font, size & positioning
           ========================================================================= */}
        <div
          ref={containerRef}
          data-lenis-prevent
          onPointerDown={handlePointerDown}
          onPointerMove={handleContainerMouseMove}
          style={{ touchAction: 'pan-y' }}
          className="relative w-full max-w-5xl h-[220px] sm:h-[300px] md:h-[360px] lg:h-[400px] rounded-lg overflow-hidden select-none cursor-ew-resize shadow-2xl border border-[var(--w-border)] transition-all duration-300"
          aria-label="Interactive ASTRA title split: drag left or right to explore INK and CODE worlds"
        >
          {/* ----------------- LAYER 1 (BOTTOM): INK WORLD ----------------- */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none select-none"
            style={{
              backgroundColor: '#F5F0E8',
              color: '#1A1A1A',
            }}
          >
            {/* Ink Paper Texture */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Ink Header (top-left, no truncation) */}
            <div className="absolute top-3 sm:top-5 left-3 sm:left-6 text-left pointer-events-none">
              <span className="text-[11px] sm:text-sm font-serif italic tracking-wide text-[#C4841D] font-bold block">
                ~ INK: Arts ~
              </span>
            </div>

            {/* Ink Tagline (bottom-left) */}
            <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-6 text-left max-w-[42%] pointer-events-none">
              <p className="text-[10px] sm:text-xs font-serif italic text-[#5A5A5A] leading-tight">
                Stories bleed through paper and craft
              </p>
            </div>

            {/* INK Title */}
            <h1
              className="select-none flex items-center justify-center m-0 p-0"
              style={{
                ...titleStyle,
                color: '#1A1A1A',
                textShadow: '2px 4px 0px rgba(196, 132, 29, 0.3)',
              }}
              aria-label="ASTRA"
            >
              {LETTERS.map((char, idx) => (
                <span
                  key={idx}
                  className="inline-block will-change-transform"
                  style={
                    prefersReduced
                      ? {}
                      : {
                          animation: `inkLetterBleed 650ms cubic-bezier(0.25, 1, 0.5, 1) ${0.1 + idx * 0.1}s both`,
                        }
                  }
                  aria-hidden="true"
                >
                  {char}
                </span>
              ))}
            </h1>
          </div>

          {/* ----------------- LAYER 2 (TOP): CODE WORLD ----------------- */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none select-none"
            style={{
              clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`,
              backgroundColor: '#0A0A0F',
              color: '#E0E0E0',
            }}
          >
            {/* Cyber Grid Background */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0, 255, 178, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 178, 0.15) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Code Header (top-right, no truncation) */}
            <div className="absolute top-3 sm:top-5 right-3 sm:right-6 text-right pointer-events-none">
              <span className="text-[11px] sm:text-sm font-mono tracking-wider text-[#00FFB2] font-semibold block">
                &lt; CODE: Tech /&gt;
              </span>
            </div>

            {/* Code Tagline (bottom-right) */}
            <div className="absolute bottom-3 sm:bottom-5 right-3 sm:right-6 text-right max-w-[42%] pointer-events-none">
              <p className="text-[10px] sm:text-xs font-mono text-[#888898] leading-tight">
                01000001 // Algorithmic futures
              </p>
            </div>

            {/* CODE Title (Identical metrics, zero gap, seamless split) */}
            <h1
              className="select-none flex items-center justify-center m-0 p-0"
              style={{
                ...titleStyle,
                color: '#E0E0E0',
                textShadow: '0 0 32px rgba(0, 255, 178, 0.6), 2px 0px 0px #00FFB2',
              }}
              aria-label="ASTRA"
            >
              {LETTERS.map((char, idx) => (
                <span
                  key={idx}
                  className="inline-block will-change-transform"
                  style={
                    prefersReduced
                      ? {}
                      : {
                          animation: `codeLetterGlitch 500ms steps(4, jump-end) ${0.15 + idx * 0.1}s both`,
                        }
                  }
                  aria-hidden="true"
                >
                  {char}
                </span>
              ))}
            </h1>
          </div>

          {/* ----------------- SPLIT DIVIDER & TOUCH HANDLE ----------------- */}
          <div
            className="absolute top-0 bottom-0 w-1 pointer-events-none z-30 transition-transform duration-75"
            style={{
              left: `${splitPos}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--w-accent)',
              boxShadow: '0 0 16px var(--w-accent)',
            }}
          >
            {/* Mobile-friendly Touch Handle: 48x48px hit area with touch-action: none */}
            <div
              ref={handleRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                touchAction: 'none',
                borderRadius: 'var(--w-button-radius)',
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 min-w-[48px] min-h-[48px] p-2 flex items-center justify-center cursor-ew-resize pointer-events-auto active:scale-110 transition-transform z-40"
              title="Drag horizontally to adjust world split"
              aria-label="Drag handle to slide split"
            >
              <div
                className="w-8 h-12 sm:w-10 sm:h-14 bg-[var(--w-card-bg)] border-2 border-[var(--w-accent)] shadow-xl flex items-center justify-center"
                style={{ borderRadius: 'var(--w-button-radius)' }}
              >
                <svg
                  className="w-4 h-4 text-[var(--w-accent)] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            HERO NARRATIVE, CLEAN DATES TBA & COUNTDOWN
           ========================================================================= */}
        <div className="mt-7 sm:mt-11 max-w-2xl flex flex-col items-center">
          <p className="text-sm sm:text-lg font-medium text-[var(--w-text)] leading-relaxed px-2">
            The grand collision of raw human creativity and computational logic.
            Two days of stage spectacles, code sprints, esports, and cultural exhibitions.
          </p>

          {/* Single clean Dates TBA marker */}
          <div className="mt-3.5 flex items-center gap-2 text-xs font-mono text-[var(--w-text-secondary)]">
            <span>Don Bosco College Campus, Mampetta</span>
            <span className="opacity-40">•</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--w-border)] text-[var(--w-accent)] font-semibold">
              Dates TBA
            </span>
          </div>

          {/* Festival Countdown / TBA Announcement */}
          <div className="mt-7 flex flex-col items-center">
            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[var(--w-text-secondary)] mb-2">
              FESTIVAL COUNTDOWN
            </div>
            <Countdown />
          </div>

          {/* Action CTAs: Primary larger, secondary smaller, strict theme typography */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto px-4 sm:px-0">
            {/* PRIMARY ACTION: Register */}
            <Link
              href="/register"
              className="w-full sm:w-auto px-9 py-4 text-sm sm:text-base font-extrabold tracking-wide uppercase transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--w-accent)',
                color: 'var(--w-bg)',
                borderRadius: 'var(--w-button-radius)',
                fontFamily: 'var(--w-font-display), serif',
                boxShadow: '0 4px 20px var(--w-accent-glow)',
              }}
            >
              <span>Register For Fest</span>
              <span className="font-mono text-lg">→</span>
            </Link>

            {/* SECONDARY ACTION: Explore Programs */}
            <Link
              href="/programs"
              className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase border border-[var(--w-border)] hover:border-[var(--w-accent)] hover:text-[var(--w-accent)] transition-all duration-200 text-center"
              style={{
                backgroundColor: 'var(--w-card-bg)',
                color: 'var(--w-text-secondary)',
                borderRadius: 'var(--w-button-radius)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              Explore 15 Programs
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
