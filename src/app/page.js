'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import TiltedBanner from '@/components/ui/TiltedBanner'
import IntroSequence from '@/components/effects/IntroSequence'
import { programs } from '@/data/programs'

// Clean label formatter for compact, wrap-free home rows
function formatProgramMeta(prog) {
  let displayName = prog.name
  if (prog.slug === 'fashion-show-group') displayName = 'Fashion Show · Group'
  if (prog.slug === 'fashion-show-single') displayName = 'Fashion Show · Solo'

  let dayLabel = prog.date
  if (dayLabel === 'Day 1 & Day 2') dayLabel = 'Day 1 & 2'

  let feeLabel = prog.fee
    .replace(' per team', ' / team')
    .replace('Varies by title', 'Varies')

  return { displayName, dayLabel, feeLabel }
}

const CATEGORY_SECTIONS = [
  {
    id: 'Arts',
    name: 'ARTS',
    index: '01',
    description: 'Visual narratives, runway couture, choreography, and magnetic stage exhibitions.',
    bg: '#FF4D8D',
    textColor: '#1A1A1A',
    dividerColor: 'divide-[#1A1A1A]/15',
    borderHeader: 'border-[#1A1A1A]',
    pillClass: 'bg-white text-[#1A1A1A]',
    headerAlign: 'left',
  },
  {
    id: 'Tech',
    name: 'TECH',
    index: '02',
    description: 'Algorithmic speed-runs, vector brand design sprints, and automated code evaluation.',
    bg: '#2F5BFF',
    textColor: '#FFFFFF',
    dividerColor: 'divide-white/20',
    borderHeader: 'border-white/25',
    pillClass: 'bg-white text-[#1A1A1A]',
    headerAlign: 'split',
  },
  {
    id: 'Gaming',
    name: 'GAMING',
    index: '03',
    description: 'High-stakes battle royale across custom Erangel lobbies and console football knockouts.',
    bg: '#B6FF3B',
    textColor: '#1A1A1A',
    dividerColor: 'divide-[#1A1A1A]/15',
    borderHeader: 'border-[#1A1A1A]',
    pillClass: 'bg-white text-[#1A1A1A]',
    headerAlign: 'center',
  },
  {
    id: 'Business',
    name: 'BUSINESS',
    index: '04',
    description: 'Corporate gauntlet testing crisis leadership, fiscal simulations, and stress interviews.',
    bg: '#FF7A1A',
    textColor: '#1A1A1A',
    dividerColor: 'divide-[#1A1A1A]/15',
    borderHeader: 'border-[#1A1A1A]',
    pillClass: 'bg-white text-[#1A1A1A]',
    headerAlign: 'compact',
  },
  {
    id: 'Fun',
    name: 'FUN',
    index: '05',
    description: 'Encrypted campus riddles, runway swagger, RJ banter, and high-energy carnival.',
    bg: '#FFD60A',
    textColor: '#1A1A1A',
    dividerColor: 'divide-[#1A1A1A]/15',
    borderHeader: 'border-[#1A1A1A]',
    pillClass: 'bg-white text-[#1A1A1A]',
    headerAlign: 'playful',
  },
]

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[var(--c-base)] text-[var(--c-ink)] relative overflow-x-hidden">
      {/* Intro Sequence (first visit only, skippable) */}
      <IntroSequence />

      {/* 1. Sticker Poster Navbar */}
      <Navbar />

      {/* Decorative Edge Visual Anchors: 5 Category Color Bars (aria-hidden, zero horizontal scroll) */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none select-none z-40"
        aria-hidden="true"
      >
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-r bg-[#FF4D8D]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-r bg-[#2F5BFF]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-r bg-[#B6FF3B]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-r bg-[#FF7A1A]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-r bg-[#FFD60A]" />
      </div>

      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none select-none z-40"
        aria-hidden="true"
      >
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-l bg-[#FFD60A]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-l bg-[#FF7A1A]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-l bg-[#B6FF3B]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-l bg-[#2F5BFF]" />
        <span className="w-1 sm:w-1.5 h-5 sm:h-7 rounded-l bg-[#FF4D8D]" />
      </div>

      <main className="flex-1 w-full overflow-hidden">
        {/* =========================================================================
            1. HERO SECTION (Visual Anchor + Tilted Banner Label + Clean Layout)
           ========================================================================= */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-14 sm:pb-18">
          <div className="flex flex-col items-start relative">
            
            {/* Campus & Dates Pills */}
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
              <span className="sticker-pill">
                <span className="w-2 h-2 rounded-full bg-[#B6FF3B] border border-[#1A1A1A]" />
                <span>Don Bosco College, Mampetta</span>
              </span>
              <span className="sticker-pill bg-[#FFD60A]">
                Dates TBA
              </span>
            </div>

            {/* Tilted Banner Label as Hero Visual Anchor */}
            <div className="mb-1 sm:mb-2">
              <span className="inline-block -rotate-2 bg-[#FFD60A] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] px-2.5 py-0.5 text-[10px] sm:text-xs font-display uppercase tracking-widest select-none">
                MARCH 2026 // ANNUAL EDITION
              </span>
            </div>

            {/* Giant Title (No Sun Mascot) */}
            <div className="w-full">
              <h1 className="font-display text-hero text-[#1A1A1A] tracking-tight leading-[0.88] select-none [text-wrap:balance]">
                ASTRA
              </h1>
            </div>

            {/* Subtitle */}
            <p className="font-medium text-lg sm:text-2xl lg:text-3xl text-[#1A1A1A]/90 mt-3 sm:mt-4 tracking-tight [text-wrap:balance] leading-snug max-w-3xl">
              INTER-COLLEGE ARTS & TECH FEST 2026
            </p>

            {/* Body Copy */}
            <p className="font-normal text-xs sm:text-base text-[#1A1A1A]/75 mt-3 max-w-xl [text-wrap:balance] leading-relaxed">
              The grand collision of raw human creativity and computational logic. Two days of stage spectacles, code sprints, esports, and cultural exhibitions.
            </p>

            {/* Action Buttons in Sticker Style */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/register"
                className="sticker-btn-primary px-8 py-3.5 sm:px-9 sm:py-4 text-xs sm:text-sm text-center"
              >
                <span>Register for Fest</span>
                <span className="text-base font-bold">→</span>
              </Link>

              <Link
                href="/programs"
                className="sticker-btn-secondary px-6 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm text-center"
              >
                Explore 15 Programs
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. TILTED BANNER STRIP (Rotated Marquee Tape)
           ========================================================================= */}
        <TiltedBanner />

        {/* =========================================================================
            3. FIVE CATEGORY BLOCKS (Polished Content Density + Varied Layouts)
           ========================================================================= */}
        <section className="w-full py-12 sm:py-18 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">
            {CATEGORY_SECTIONS.map((cat) => {
              const catPrograms = programs.filter((p) => p.category === cat.id)

              return (
                <div
                  key={cat.id}
                  id={`category-${cat.id.toLowerCase()}`}
                  className="sticker-card p-5 sm:p-9 relative overflow-hidden transition-transform duration-200"
                  style={{
                    backgroundColor: cat.bg,
                    color: cat.textColor,
                  }}
                >
                  {/* Giant Faint Category Number in Background */}
                  <span
                    className="absolute -top-3 sm:-top-8 right-2 sm:right-6 font-display text-[7.5rem] sm:text-[11.5rem] leading-none opacity-[0.08] select-none pointer-events-none tracking-tighter"
                    aria-hidden="true"
                  >
                    {cat.index}
                  </span>

                  {/* Varied Category Header Alignments */}
                  {cat.headerAlign === 'left' && (
                    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b-2 ${cat.borderHeader}`}>
                      <div>
                        <span className={`sticker-pill ${cat.pillClass} mb-2 inline-block`}>
                          {cat.index} // DISCIPLINE
                        </span>
                        <h2 className="font-display text-category leading-[0.88] tracking-tight [text-wrap:balance] mt-1">
                          {cat.name}
                        </h2>
                      </div>
                      <p className="font-medium text-xs sm:text-sm opacity-90 max-w-sm sm:text-right [text-wrap:balance]">
                        {cat.description}
                      </p>
                    </div>
                  )}

                  {cat.headerAlign === 'split' && (
                    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 ${cat.borderHeader}`}>
                      <div>
                        <h2 className="font-display text-category leading-[0.88] tracking-tight [text-wrap:balance]">
                          {cat.name}
                        </h2>
                        <p className="font-medium text-xs sm:text-sm opacity-90 mt-2 max-w-sm [text-wrap:balance]">
                          {cat.description}
                        </p>
                      </div>
                      <span className={`sticker-pill ${cat.pillClass} self-start shrink-0`}>
                        {cat.index} // COMPUTATION
                      </span>
                    </div>
                  )}

                  {cat.headerAlign === 'center' && (
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b-2 ${cat.borderHeader}`}>
                      <div className="flex items-center gap-3">
                        <span className={`sticker-pill ${cat.pillClass}`}>
                          {cat.index}
                        </span>
                        <h2 className="font-display text-category leading-[0.88] tracking-tight [text-wrap:balance]">
                          {cat.name}
                        </h2>
                      </div>
                      <p className="font-medium text-xs sm:text-sm opacity-90 max-w-xs sm:text-right [text-wrap:balance]">
                        {cat.description}
                      </p>
                    </div>
                  )}

                  {cat.headerAlign === 'compact' && (
                    <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-5 border-b-2 ${cat.borderHeader}`}>
                      <div className="flex items-baseline gap-3">
                        <h2 className="font-display text-category leading-[0.88] tracking-tight [text-wrap:balance]">
                          {cat.name}
                        </h2>
                        <span className="text-xs font-display uppercase tracking-widest opacity-60">
                          Gauntlet
                        </span>
                      </div>
                      <p className="font-medium text-xs opacity-85 max-w-sm sm:text-right [text-wrap:balance]">
                        {cat.description}
                      </p>
                    </div>
                  )}

                  {cat.headerAlign === 'playful' && (
                    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b-2 ${cat.borderHeader}`}>
                      <div>
                        <span className={`sticker-pill -rotate-1 ${cat.pillClass} mb-2 inline-block`}>
                          ★ {cat.index} ALL ACCESS
                        </span>
                        <h2 className="font-display text-category leading-[0.88] tracking-tight [text-wrap:balance] mt-1">
                          {cat.name}
                        </h2>
                      </div>
                      <p className="font-medium text-xs sm:text-sm opacity-90 max-w-xs sm:text-right [text-wrap:balance]">
                        {cat.description}
                      </p>
                    </div>
                  )}

                  {/* Polished Program Rows: Name, Day pill, Single Fee & Arrow only */}
                  <div className={`mt-4 divide-y-2 ${cat.dividerColor}`}>
                    {catPrograms.map((prog) => {
                      const { displayName, dayLabel, feeLabel } = formatProgramMeta(prog)

                      return (
                        <Link
                          key={prog.slug}
                          href={`/programs/${prog.slug}`}
                          className="group py-3.5 sm:py-4 px-1 flex items-center justify-between gap-3 transition-transform hover:translate-x-1 duration-150"
                        >
                          {/* Program Name & Day Pill */}
                          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight group-hover:underline [text-wrap:balance]">
                              {displayName}
                            </h3>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-current/30 bg-white/20 shrink-0">
                              {dayLabel}
                            </span>
                          </div>

                          {/* Fee (Shown Once) & Arrow */}
                          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            <span className="font-display text-xs sm:text-sm uppercase tracking-wider opacity-90 whitespace-nowrap">
                              {feeLabel}
                            </span>
                            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-current bg-white text-[#1A1A1A] flex items-center justify-center font-bold text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Category Footer Row */}
                  <div
                    className={`mt-6 pt-4 border-t-2 flex items-center justify-between ${
                      cat.id === 'Tech' ? 'border-white/20' : 'border-[#1A1A1A]'
                    }`}
                  >
                    <span className="text-xs font-display uppercase tracking-wider opacity-85">
                      {catPrograms.length} {cat.id} Events
                    </span>
                    <Link
                      href={`/programs?category=${cat.id}`}
                      className={`sticker-pill ${cat.pillClass} hover:opacity-90 transition-opacity`}
                    >
                      <span>Explore {cat.id}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* =========================================================================
                4. "VIEW ALL 15 PROGRAMS" CALL TO ACTION
               ========================================================================= */}
            <div className="pt-8 pb-4 flex flex-col items-center text-center">
              <span className="sticker-pill mb-3 bg-[#FFD60A]">
                Full Lineup Ready
              </span>
              <h3 className="font-display text-3xl sm:text-5xl uppercase tracking-tight text-[#1A1A1A] mb-3">
                All 15 Competitions
              </h3>
              <p className="font-normal text-xs sm:text-sm text-[#1A1A1A]/75 max-w-md mb-7 [text-wrap:balance]">
                Review the comprehensive rulebooks, schedule slots, eligibility, and cash prizes across all categories.
              </p>
              <Link
                href="/programs"
                className="sticker-btn-primary px-9 py-4 sm:px-11 sm:py-4.5 text-sm sm:text-base text-center inline-flex items-center gap-3"
              >
                <span>View all 15 programs</span>
                <span className="text-lg font-bold">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
