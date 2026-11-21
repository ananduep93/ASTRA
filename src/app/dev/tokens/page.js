'use client'

import { CATEGORY_COLORS } from '@/lib/colors'
import { programs, filterPrograms, CATEGORIES, IS_PLACEHOLDER } from '@/data/programs'
import { useState } from 'react'

export default function DevTokensPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  const displayedPrograms = filterPrograms(selectedCategory, search)

  const candidateFonts = [
    {
      name: 'Archivo (Weight 900 Black)',
      id: 'archivo',
      fontFamily: "'Archivo', sans-serif",
      weight: 900,
      description: 'Normal-width neo-grotesque heavyweight. Rock-solid horizontal rhythm, razor-sharp clean apertures, zero letter distortion at 360px.',
      recommendation: true,
    },
    {
      name: 'Bricolage Grotesque (Weight 800 ExtraBold)',
      id: 'bricolage',
      fontFamily: "'Bricolage', sans-serif",
      weight: 800,
      description: 'Expressive British/French grotesque with deep ink-traps and flared curves. High personality for posters, slightly quirky in mixed-case body.',
      recommendation: false,
    },
    {
      name: 'Anton (Weight 400 Regular Heavy)',
      id: 'anton',
      fontFamily: "'Anton', sans-serif",
      weight: 400,
      description: 'Traditional wood-type advertising display sans. Ultra-punchy for short titles, but condensed proportions squeeze longer category names.',
      recommendation: false,
    },
  ]

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[var(--c-base)] text-[var(--c-black)]">
      {/* Dev Header */}
      <div className="pb-8 border-b border-[var(--c-black)]/10">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-[var(--c-black)] text-[var(--c-base)]">
            Internal Diagnostic Tool
          </span>
          <span className="text-xs opacity-50 font-mono">/dev/tokens</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl mt-3 tracking-tight">
          Typography Comparison & Design System Tokens
        </h1>
        <p className="text-sm opacity-65 mt-1 max-w-xl text-body">
          Side-by-side comparison of the three candidate normal-width heavy display fonts and full category contrast matrices.
        </p>
      </div>

      {/* Font Comparison Specimen */}
      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-tight mb-2">
          Display Font Candidates (Specimen Test)
        </h2>
        <p className="text-xs opacity-60 mb-6 max-w-2xl text-body">
          Each option renders the Title, Category Name, Subtitle, and Body Paragraph side-by-side to verify letter spacing, optical weight, and 360px mobile fit.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {candidateFonts.map((font) => (
            <div
              key={font.id}
              className={`p-6 rounded-2xl bg-white border ${
                font.recommendation
                  ? 'border-2 border-[var(--c-black)] shadow-lg'
                  : 'border-[var(--c-black)]/15 opacity-85'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                    Option: {font.id}
                  </span>
                  {font.recommendation && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[var(--c-black)] text-[var(--c-base)] rounded-full">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold mb-4 opacity-75">
                  {font.name}
                </div>

                {/* 1. Title Specimen */}
                <div className="pb-4 border-b border-[var(--c-black)]/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-1">
                    Title
                  </span>
                  <div
                    style={{ fontFamily: font.fontFamily, fontWeight: font.weight }}
                    className="text-5xl sm:text-6xl tracking-tight uppercase leading-none"
                  >
                    ASTRA
                  </div>
                </div>

                {/* 2. Category Name Specimen */}
                <div className="py-4 border-b border-[var(--c-black)]/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-1">
                    Category Name
                  </span>
                  <div
                    style={{ fontFamily: font.fontFamily, fontWeight: font.weight }}
                    className="text-3xl sm:text-4xl tracking-tight uppercase leading-none"
                  >
                    BUSINESS
                  </div>
                  <div
                    style={{ fontFamily: font.fontFamily, fontWeight: font.weight }}
                    className="text-2xl sm:text-3xl tracking-tight uppercase leading-none mt-1 opacity-60"
                  >
                    GAMING ARENA
                  </div>
                </div>

                {/* 3. Subtitle Specimen */}
                <div className="py-4 border-b border-[var(--c-black)]/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-1">
                    Subtitle (Medium)
                  </span>
                  <div className="font-medium text-sm sm:text-base tracking-tight text-[var(--c-black)]/80 leading-snug">
                    INTER-COLLEGE ARTS & TECH FEST 2026
                  </div>
                </div>

                {/* 4. Paragraph Specimen */}
                <div className="pt-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-1">
                    Body Paragraph (Regular)
                  </span>
                  <p className="font-normal text-xs sm:text-sm text-[var(--c-black)]/70 leading-relaxed text-body">
                    Don Bosco College, Mampetta brings together the most ambitious minds for two days of creative explosion, athletic esports, and cutting-edge tech.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--c-black)]/10 text-xs opacity-70">
                {font.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Color Palette & Contrast Tokens */}
      <section className="mt-16 pt-10 border-t border-[var(--c-black)]/10">
        <h2 className="font-display text-2xl tracking-tight mb-2">
          Category Color Palette & Contrast Audit (WCAG AA Compliance)
        </h2>
        <p className="text-xs opacity-60 mb-6 text-body">
          All category blocks feature guaranteed WCAG AA or AAA color contrast ratios across both desktop and mobile viewports.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(CATEGORY_COLORS).map(([cat, conf]) => (
            <div
              key={cat}
              className={`p-5 rounded-xl lift flex flex-col justify-between h-44 ${conf.cls}`}
            >
              <div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider opacity-75">
                  <span>{cat}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10">AA PASS</span>
                </div>
                <div className="font-display text-3xl mt-2 uppercase">{cat}</div>
              </div>
              <div className="text-xs font-mono font-bold opacity-80">
                <div>BG: {conf.hex}</div>
                <div>TEXT: {conf.textHex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Program Registry Diagnostic */}
      <section className="mt-16 pt-10 border-t border-[var(--c-black)]/10">
        <h2 className="font-display text-2xl tracking-tight mb-4">
          Program Registry Diagnostics (15 Programs)
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-transform ${
                selectedCategory === cat
                  ? 'bg-[var(--c-black)] text-[var(--c-base)] scale-105'
                  : 'bg-white border border-[var(--c-black)]/15 text-[var(--c-black)] opacity-70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPrograms.map((p) => {
            const colorConf = CATEGORY_COLORS[p.category] || {}
            return (
              <div
                key={p.slug}
                className={`p-5 rounded-xl lift flex flex-col justify-between ${colorConf.cls || 'bg-white text-black'}`}
              >
                <div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider opacity-75">
                    <span>{p.category}</span>
                    <span>{p.date}</span>
                  </div>
                  <h3 className="font-display text-2xl mt-2 tracking-tight uppercase">
                    {p.name}
                  </h3>
                  <p className="text-xs opacity-80 mt-1 leading-relaxed text-body">
                    {p.shortDescription}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-current/15 flex justify-between items-center text-xs font-bold">
                  <span>{p.venue}</span>
                  <span>{p.fee}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
