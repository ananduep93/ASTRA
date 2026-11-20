'use client'

import { useState } from 'react'
import Link from 'next/link'
import WorldToggle from './WorldToggle'
import MobileMenu from './MobileMenu'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Schedule', href: '/#schedule' },
    { label: 'Memories', href: '/memories' },
    { label: 'About', href: '/#about' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[var(--w-bg)]/90 border-b border-[var(--w-border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="heading-display text-2xl sm:text-3xl font-black tracking-tight text-[var(--w-text)] transition-transform duration-200 group-hover:scale-105">
              ASTRA
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-semibold border border-[var(--w-border)]"
              style={{
                backgroundColor: 'var(--w-card-bg)',
                color: 'var(--w-accent)',
                borderRadius: 'var(--w-button-radius)',
              }}
            >
              INK × CODE
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs uppercase font-mono font-medium tracking-wider text-[var(--w-text-secondary)] hover:text-[var(--w-accent)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* World Toggle (Desktop + Tablet) */}
            <div className="hidden sm:block">
              <WorldToggle />
            </div>

            {/* Always-visible Register button */}
            <Link
              href="/register"
              className="px-4 sm:px-5 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-sm hover:opacity-90 active:scale-95 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--w-accent)',
                color: 'var(--w-bg)',
                borderRadius: 'var(--w-button-radius)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              Register
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              className="md:hidden p-2 text-sm font-mono border border-[var(--w-border)] bg-[var(--w-card-bg)] text-[var(--w-text)] cursor-pointer"
              style={{ borderRadius: 'var(--w-button-radius)' }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen Mobile Menu with wipe */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  )
}
