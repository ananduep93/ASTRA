'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Programs', href: '/programs' },
  { label: 'Schedule', href: '/#schedule' },
  { label: 'About', href: '/#about' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const prefersReduced = useReducedMotion()

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[var(--c-base)]/95 backdrop-blur-sm border-b border-[var(--c-black)]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-display text-xl sm:text-3xl tracking-tight">
              ASTRA
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 border border-[var(--c-black)]/15 rounded-sm">
              2026
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs font-bold tracking-wider uppercase transition-opacity hover:opacity-100 ${
                  pathname === link.href ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Register button */}
            <Link
              href="/register"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold tracking-wider uppercase bg-[var(--c-black)] text-[var(--c-base)] rounded-full transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Register
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-2 text-[var(--c-black)] cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <FullscreenMenu
            onClose={() => setMenuOpen(false)}
            prefersReduced={prefersReduced}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/* ======================================================================== */

function FullscreenMenu({ onClose, prefersReduced }) {
  const menuRef = useRef(null)
  const closeBtnRef = useRef(null)
  const previousFocus = useRef(null)

  // Lock scroll, trap focus, close on Escape
  useEffect(() => {
    previousFocus.current = document.activeElement

    // Lock scroll
    document.body.style.overflow = 'hidden'
    if (window.__lenis) window.__lenis.stop()

    // Focus the close button
    closeBtnRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      if (window.__lenis) window.__lenis.start()
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [onClose])

  const wipeColors = ['#FF4D8D', '#2F5BFF', '#B6FF3B', '#FF7A1A', '#FFD60A']
  const bgColor = wipeColors[Math.floor(Math.random() * wipeColors.length)]

  return (
    <motion.div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: bgColor }}
      initial={{ clipPath: 'circle(0% at calc(100% - 48px) 32px)' }}
      animate={{ clipPath: 'circle(150% at calc(100% - 48px) 32px)' }}
      exit={{ clipPath: 'circle(0% at calc(100% - 48px) 32px)' }}
      transition={{ duration: prefersReduced ? 0 : 0.5, ease: [0.65, 0, 0.35, 1] }}
    >
      {/* Close button */}
      <button
        ref={closeBtnRef}
        onClick={onClose}
        aria-label="Close menu"
        className="absolute top-4 right-4 p-3 text-[var(--c-black)]"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Nav links */}
      <nav className="flex flex-col items-center gap-6 sm:gap-8">
        {NAV_LINKS.map((link, i) => (
          <motion.div
            key={link.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: prefersReduced ? 0 : 0.35,
              delay: prefersReduced ? 0 : 0.15 + i * 0.06,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <Link
              href={link.href}
              onClick={onClose}
              className="font-display text-4xl sm:text-5xl tracking-tight text-[var(--c-black)] hover:opacity-70 transition-opacity"
            >
              {link.label}
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* Register button inside menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: prefersReduced ? 0 : 0.35,
          delay: prefersReduced ? 0 : 0.5,
        }}
        className="mt-10"
      >
        <Link
          href="/register"
          onClick={onClose}
          className="px-8 py-3.5 text-sm font-bold tracking-wider uppercase bg-[var(--c-black)] text-[var(--c-base)] rounded-full"
        >
          Register Now
        </Link>
      </motion.div>
    </motion.div>
  )
}
