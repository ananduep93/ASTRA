'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { programs, CATEGORIES, filterPrograms } from '@/data/programs'
import { CATEGORY_COLORS } from '@/lib/colors'
import Link from 'next/link'

export default function ProgramsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
  }

  const filtered = useMemo(() => {
    return filterPrograms(selectedCategory, searchQuery)
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--c-base)] text-[var(--c-black)]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--c-black)]/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-[11px] font-bold tracking-widest uppercase bg-[var(--c-black)] text-[var(--c-base)] rounded-full">
              <span>Festival Programs • 15 Events</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-display tracking-tight leading-none">
              Explore All Programs
            </h1>
            <p className="text-sm sm:text-base opacity-70 mt-3 max-w-xl">
              15 competitive arenas spanning fine arts, couture runways, algorithmic challenges, and esports tournaments.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                  selectedCategory === cat
                    ? 'bg-[var(--c-black)] text-[var(--c-base)] scale-105'
                    : 'bg-white border border-[var(--c-black)]/15 text-[var(--c-black)] opacity-70 hover:opacity-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              id="program-search"
              name="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="w-full px-4 py-2 text-xs font-bold bg-white border border-[var(--c-black)]/15 rounded-full text-[var(--c-black)] placeholder:opacity-40 focus:outline-none focus:border-[var(--c-black)]"
            />
          </div>
        </div>

        {/* Programs Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const colorConf = CATEGORY_COLORS[p.category] || {}
            return (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className={`p-6 rounded-2xl lift flex flex-col justify-between block ${colorConf.cls || 'bg-white text-black'}`}
              >
                <div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider opacity-80">
                    <span>{p.category}</span>
                    <span>{p.date}</span>
                  </div>
                  <h2 className="font-display text-3xl mt-3 tracking-tight leading-none">
                    {p.name}
                  </h2>
                  <p className="text-xs opacity-80 mt-2 leading-relaxed">
                    {p.shortDescription}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-current/15 flex justify-between items-center text-xs font-bold font-mono">
                  <span>{p.venue}</span>
                  <span>{p.fee}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}
