'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProgramCard from '@/components/programs/ProgramCard'
import { programs, CATEGORIES, filterPrograms } from '@/data/programs'
import { useWorld, WORLDS } from '@/context/WorldContext'

export default function ProgramsPage() {
  const { world, switchWorld } = useWorld()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    // Concept requirement: Choosing Arts switches to Ink, Tech/Gaming to Code
    if (category === 'Arts') {
      switchWorld(WORLDS.INK)
    } else if (category === 'Tech' || category === 'Gaming') {
      switchWorld(WORLDS.CODE)
    }
  }

  const filtered = useMemo(() => {
    return filterPrograms(selectedCategory, searchQuery)
  }, [selectedCategory, searchQuery])

  const isCode = world === WORLDS.CODE

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--w-border)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-[11px] font-mono tracking-wider border border-[var(--w-border)] bg-[var(--w-card-bg)] text-[var(--w-accent)] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--w-accent)]" />
              <span>{isCode ? '< EVENT_DIRECTORY />' : '~ Festival Programs ~'}</span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--w-text)] leading-tight"
              style={{ fontFamily: 'var(--w-font-display), serif' }}
            >
              Explore All Programs
            </h1>
            <p className="text-sm sm:text-base text-[var(--w-text-secondary)] mt-2 max-w-xl">
              15 competitive arenas spanning fine arts, couture runways, algorithmic challenges, and esports tournaments.
            </p>
          </div>

          {/* Quick World Switch Note */}
          <div className="text-xs font-mono text-[var(--w-text-secondary)] flex items-center gap-2">
            <span>Filter auto-aligns theme:</span>
            <span className="font-bold text-[var(--w-accent)] uppercase">
              {isCode ? '[CODE ACTIVE]' : '[INK ACTIVE]'}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="my-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'border-[var(--w-accent)] bg-[var(--w-accent)] text-[var(--w-bg)] shadow-md font-bold'
                      : 'border-[var(--w-border)] bg-[var(--w-card-bg)] text-[var(--w-text-secondary)] hover:border-[var(--w-accent)] hover:text-[var(--w-text)]'
                  }`}
                  style={{
                    borderRadius: 'var(--w-button-radius)',
                    fontFamily: isCode
                      ? 'var(--font-jetbrains-mono), monospace'
                      : 'var(--w-font-display), serif',
                  }}
                >
                  {cat === 'All'
                    ? 'All Events'
                    : isCode
                    ? `<${cat}/>`
                    : cat}
                </button>
              )
            })}
          </div>

          {/* Real-time Search Box */}
          <div className="relative w-full lg:w-80">
            <input
              id="program-search"
              name="search"
              type="text"
              aria-label="Search festival programs, rules, or tags"
              placeholder="Search programs, rules, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-mono bg-[var(--w-card-bg)] border border-[var(--w-border)] text-[var(--w-text)] placeholder-[var(--w-text-secondary)] focus:border-[var(--w-accent)] focus:outline-none transition-colors shadow-sm"
              style={{ borderRadius: 'var(--w-button-radius)' }}
            />
            {/* Search Icon */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--w-text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--w-text-secondary)] hover:text-[var(--w-text)]"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6 flex items-center justify-between text-xs font-mono text-[var(--w-text-secondary)]">
          <span>
            Showing <strong className="text-[var(--w-text)]">{filtered.length}</strong> of{' '}
            {programs.length} programs
          </span>
          {searchQuery && (
            <span>
              Query: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Programs Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((prog, idx) => (
              <ProgramCard key={prog.slug} program={prog} index={idx} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div
            className="world-card p-12 text-center my-12 border border-dashed border-[var(--w-border)]"
            style={{ borderRadius: 'var(--w-button-radius)' }}
          >
            <p className="text-base font-bold text-[var(--w-text)]" style={{ fontFamily: 'var(--w-font-display)' }}>
              No matching events found
            </p>
            <p className="text-xs text-[var(--w-text-secondary)] mt-1 font-mono">
              Try adjusting your query or switching category filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All')
                setSearchQuery('')
              }}
              className="mt-4 px-4 py-2 text-xs font-mono text-[var(--w-accent)] border border-[var(--w-accent)] hover:bg-[var(--w-accent)] hover:text-[var(--w-bg)] transition-colors"
              style={{ borderRadius: 'var(--w-button-radius)' }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
