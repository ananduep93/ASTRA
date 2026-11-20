'use client'

import { useWorld, WORLDS } from '@/context/WorldContext'
import { programs, filterPrograms, CATEGORIES, IS_PLACEHOLDER } from '@/data/programs'
import { useState } from 'react'

export default function DevTokensPage() {
  const { world, toggleWorld, switchWorld, isWiping } = useWorld()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat)
    if (cat === 'Arts') {
      switchWorld(WORLDS.INK)
    } else if (cat === 'Tech' || cat === 'Gaming') {
      switchWorld(WORLDS.CODE)
    }
  }

  const displayedPrograms = filterPrograms(selectedCategory, search)
  const isCode = world === WORLDS.CODE

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-400">
      {/* Dev Tokens Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--w-border)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest font-mono text-[var(--w-accent)] font-semibold">
              Developer Sandbox • Internal Diagnostic Tool
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--w-border)] text-[var(--w-text-secondary)]">
              Unlinked Route (/dev/tokens)
            </span>
          </div>
          <h1 className="heading-display text-4xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            ASTRA Design Tokens & Layout Verification
          </h1>
          <p className="text-sm text-[var(--w-text-secondary)] mt-1 max-w-xl">
            Live inspector for CSS custom properties, responsive font metrics, and world theme switches.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-xs font-mono text-[var(--w-text-secondary)]">
            Active World: <span className="font-bold text-[var(--w-accent)] uppercase">{world}</span>
          </div>
          <button
            onClick={toggleWorld}
            disabled={isWiping}
            className="px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-sm border border-[var(--w-border)] flex items-center gap-2"
            style={{
              backgroundColor: 'var(--w-card-bg)',
              color: 'var(--w-accent)',
              borderRadius: 'var(--w-button-radius)',
            }}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--w-accent)] animate-pulse" />
            Switch to {isCode ? 'INK' : 'CODE'} World
          </button>
        </div>
      </div>

      {/* Tokens Matrix */}
      <section className="my-10 p-6 world-card">
        <h2 className="heading-display text-2xl font-bold mb-3">Active CSS Token Mapping</h2>
        <p className="text-xs text-[var(--w-text-secondary)] mb-6">
          Controlled via <code>[data-world=&quot;{world}&quot;]</code> attributes in globals.css.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded border border-[var(--w-border)] bg-[var(--w-bg-secondary)]">
            <span className="text-xs font-mono block text-[var(--w-text-secondary)]">--w-bg (Background)</span>
            <span className="font-semibold text-sm">{isCode ? '#0A0A0F' : '#F5F0E8'}</span>
          </div>
          <div className="p-4 rounded border border-[var(--w-border)] bg-[var(--w-bg-secondary)]">
            <span className="text-xs font-mono block text-[var(--w-text-secondary)]">--w-accent (Primary Accent)</span>
            <span className="font-semibold text-sm text-[var(--w-accent)]">
              {isCode ? '#00FFB2 (Neon Mint)' : '#C4841D (Saffron Gold)'}
            </span>
          </div>
          <div className="p-4 rounded border border-[var(--w-border)] bg-[var(--w-bg-secondary)]">
            <span className="text-xs font-mono block text-[var(--w-text-secondary)]">--w-font-display</span>
            <span className="font-semibold text-sm">
              {isCode ? 'JetBrains Mono' : 'Fraunces'}
            </span>
          </div>
          <div className="p-4 rounded border border-[var(--w-border)] bg-[var(--w-bg-secondary)]">
            <span className="text-xs font-mono block text-[var(--w-text-secondary)]">--w-card-radius</span>
            <span className="font-semibold text-sm">
              {isCode ? '0px (Sharp Cyber)' : '4px (Organic Paper)'}
            </span>
          </div>
        </div>
      </section>

      {/* Program Filter Smoke Test */}
      <section className="my-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="heading-display text-2xl font-bold">
            Raw Registry Inspector ({programs.length} Events)
          </h2>
          <div className="w-full sm:w-64">
            <input
              id="dev-tokens-search"
              name="tokens-search"
              aria-label="Search data"
              type="text"
              placeholder="Search data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--w-card-bg)] border border-[var(--w-border)] text-[var(--w-text)] focus:border-[var(--w-accent)] transition-colors"
              style={{ borderRadius: 'var(--w-button-radius)' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1 text-xs font-mono border ${
                selectedCategory === cat
                  ? 'border-[var(--w-accent)] bg-[var(--w-accent)] text-[var(--w-bg)] font-bold'
                  : 'border-[var(--w-border)] bg-[var(--w-card-bg)] text-[var(--w-text-secondary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPrograms.map((p) => (
            <div key={p.slug} className="world-card p-4 text-xs font-mono">
              <div className="flex justify-between font-bold text-[var(--w-accent)]">
                <span>{p.name}</span>
                <span>{p.category}</span>
              </div>
              <div className="text-[var(--w-text-secondary)] mt-1">{p.shortDescription}</div>
              <div className="mt-2 text-[10px] text-[var(--w-text-secondary)]">
                {p.date} • {p.venue} • {p.fee}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
