'use client'

import Link from 'next/link'
import WorldToggle from './WorldToggle'
import { PLACEHOLDER_DISCLAIMER } from '@/data/programs'

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--w-border)] bg-[var(--w-card-bg)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[var(--w-border)]">
          {/* Brand & College */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="heading-display text-2xl font-black tracking-tight text-[var(--w-text)]">
              ASTRA <span className="text-[var(--w-accent)] text-lg">2026</span>
            </Link>
            <p className="text-xs text-[var(--w-text-secondary)] mt-1 font-mono">
              Don Bosco College, Mampetta • Inter-College Arts & Tech Fest
            </p>
          </div>

          {/* Quick links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono uppercase tracking-wider text-[var(--w-text-secondary)]">
            <Link href="/" className="hover:text-[var(--w-accent)] transition-colors">
              Home
            </Link>
            <Link href="/programs" className="hover:text-[var(--w-accent)] transition-colors">
              Programs
            </Link>
            <Link href="/register" className="hover:text-[var(--w-accent)] transition-colors">
              Register
            </Link>
            <Link href="/memories" className="hover:text-[var(--w-accent)] transition-colors">
              Memories
            </Link>
          </nav>

          {/* World toggle in footer */}
          <div className="flex items-center gap-3">
            <WorldToggle compact />
          </div>
        </div>

        {/* Global Disclaimer & Copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--w-text-secondary)] text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--w-accent)] animate-pulse" />
            <span className="text-[11px] opacity-80">
              {PLACEHOLDER_DISCLAIMER}
            </span>
          </div>

          <p className="text-[11px] opacity-60">
            © 2026 Don Bosco College, Mampetta. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
