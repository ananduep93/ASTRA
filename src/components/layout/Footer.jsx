'use client'

import Link from 'next/link'
import { PLACEHOLDER_DISCLAIMER } from '@/data/programs'

export default function Footer() {
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Register', href: '/register' },
  ]

  return (
    <footer className="w-full border-t border-[var(--c-black)]/10 bg-[var(--c-black)] text-[var(--c-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Link href="/" className="font-display text-3xl tracking-tight">
              ASTRA
            </Link>
            <p className="text-sm opacity-50 mt-1">
              Don Bosco College, Mampetta
            </p>
            <p className="text-xs opacity-35 mt-0.5">
              Inter-College Arts & Tech Fest
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-bold tracking-wider uppercase opacity-50 hover:opacity-100 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="mt-10 pt-6 border-t border-[var(--c-base)]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-50">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <p>{PLACEHOLDER_DISCLAIMER}</p>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('astra_intro_seen')
                } catch (e) {}
                window.location.href = '/?intro=1'
              }}
              className="hover:underline text-[11px] opacity-75 hover:opacity-100 transition-opacity"
            >
              Replay Intro ↺
            </button>
          </div>
          <p>© 2026 Don Bosco College, Mampetta</p>
        </div>
      </div>
    </footer>
  )
}
