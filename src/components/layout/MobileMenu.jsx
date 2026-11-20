'use client'

import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import WorldToggle from './WorldToggle'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export default function MobileMenu({ isOpen, onClose }) {
  const prefersReduced = useReducedMotion()

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Schedule', href: '/#schedule' },
    { label: 'Memories', href: '/memories' },
    { label: 'About Fest', href: '/#about' },
  ]

  // Wipe transition variants
  const wipeVariants = {
    closed: {
      clipPath: prefersReduced
        ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        : 'polygon(0 0, 100% 0, 100% 0, 0 0)',
      opacity: prefersReduced ? 0 : 1,
      transition: {
        duration: prefersReduced ? 0.2 : 0.4,
        ease: [0.77, 0, 0.175, 1],
      },
    },
    open: {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      opacity: 1,
      transition: {
        duration: prefersReduced ? 0.2 : 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={wipeVariants}
          className="fixed inset-0 z-[9980] flex flex-col justify-between p-6 sm:p-8"
          style={{
            backgroundColor: 'var(--w-bg)',
            color: 'var(--w-text)',
          }}
          aria-modal="true"
          role="dialog"
        >
          {/* Top Bar inside Menu */}
          <div className="flex items-center justify-between border-b border-[var(--w-border)] pb-6">
            <Link
              href="/"
              onClick={onClose}
              className="heading-display text-2xl font-black tracking-tight"
            >
              ASTRA <span className="text-[var(--w-accent)] text-lg">2026</span>
            </Link>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 border border-[var(--w-border)] text-sm font-mono hover:text-[var(--w-accent)] cursor-pointer"
              style={{ borderRadius: 'var(--w-button-radius)' }}
            >
              [CLOSE ×]
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6 my-auto py-8">
            {navLinks.map((link, idx) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: prefersReduced ? 0 : 0.1 + idx * 0.05,
                  duration: 0.3,
                }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="heading-display text-3xl font-bold tracking-tight text-[var(--w-text)] hover:text-[var(--w-accent)] transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <span className="text-xs font-mono text-[var(--w-text-secondary)] opacity-50">
                    0{idx + 1}
                  </span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Bottom Actions inside Menu */}
          <div className="flex flex-col gap-4 border-t border-[var(--w-border)] pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--w-text-secondary)]">
                THEME ENGINE:
              </span>
              <WorldToggle />
            </div>

            <Link
              href="/register"
              onClick={onClose}
              className="w-full text-center py-3.5 text-sm font-bold tracking-wide uppercase transition-all shadow-md"
              style={{
                backgroundColor: 'var(--w-accent)',
                color: 'var(--w-bg)',
                borderRadius: 'var(--w-button-radius)',
              }}
            >
              Register For Events →
            </Link>

            <p className="text-[10px] text-center font-mono text-[var(--w-text-secondary)]">
              Don Bosco College, Mampetta • Sample content (TBA)
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
