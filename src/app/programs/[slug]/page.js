import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { programs, IS_PLACEHOLDER, PLACEHOLDER_DISCLAIMER } from '@/data/programs'
import { CATEGORY_COLORS } from '@/lib/colors'

export function generateStaticParams() {
  return programs.map((p) => ({
    slug: p.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const prog = programs.find((p) => p.slug === slug)
  if (!prog) return { title: 'Program Not Found | ASTRA 2026' }
  return {
    title: `${prog.name} — ${prog.category} | ASTRA 2026`,
    description: prog.shortDescription,
  }
}

export default async function ProgramDetailPage({ params }) {
  const { slug } = await params
  const prog = programs.find((p) => p.slug === slug)
  if (!prog) notFound()

  const currentIndex = programs.findIndex((p) => p.slug === slug)
  const prevProg = programs[(currentIndex - 1 + programs.length) % programs.length]
  const nextProg = programs[(currentIndex + 1) % programs.length]

  const catColor = CATEGORY_COLORS[prog.category] || {
    bg: '#FF4D8D',
    textColor: '#1A1A1A',
    hex: '#FF4D8D',
    textHex: '#1A1A1A',
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[var(--c-base)] text-[var(--c-ink)]">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/programs"
            className="sticker-pill inline-flex items-center gap-2 hover:bg-neutral-100 transition-colors"
          >
            <span>←</span>
            <span>All 15 Programs</span>
          </Link>
        </div>

        {/* Main Program Hero Card in Category Color */}
        <div
          className="sticker-card p-6 sm:p-10 mb-8 sm:mb-12"
          style={{
            backgroundColor: catColor.hex,
            color: catColor.textHex,
          }}
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="sticker-pill bg-white text-[#1A1A1A]">
                {prog.category}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-current/30 bg-black/10">
                {prog.date}
              </span>
            </div>

            {IS_PLACEHOLDER && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-current/40 bg-white/20">
                Provisional Schedule · TBA
              </span>
            )}
          </div>

          {/* Program Title */}
          <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-tight leading-[0.92] [text-wrap:balance]">
            {prog.name}
          </h1>

          {/* Short Description */}
          <p className="font-medium text-sm sm:text-base opacity-90 mt-4 max-w-2xl [text-wrap:balance] leading-relaxed">
            {prog.shortDescription}
          </p>

          {/* Metadata Grid with Subtle TBA Markers */}
          <div className="mt-8 pt-6 border-t-2 border-current/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Team Size */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">
                Format
              </span>
              <span className="font-display text-sm sm:text-base mt-1 block">
                {prog.teamSize}
              </span>
            </div>

            {/* Time Slot */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">
                Time Slot
              </span>
              <span className="font-display text-sm sm:text-base mt-1 block">
                {prog.time}
              </span>
            </div>

            {/* Venue with Subtle TBA Marker */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">
                Venue
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-display text-sm sm:text-base">
                  {prog.venue}
                </span>
                <span
                  title="Subject to final campus scheduling"
                  className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border border-current/30 bg-black/10"
                >
                  TBA
                </span>
              </div>
            </div>

            {/* Fee with Subtle TBA Marker */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">
                Registration Fee
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-display text-sm sm:text-base">
                  {prog.fee}
                </span>
                <span
                  title="Official handbook fee"
                  className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border border-current/30 bg-black/10"
                >
                  TBA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Description & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Rules & Overview (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="sticker-card bg-white p-6 sm:p-8">
              <h2 className="font-display text-2xl uppercase tracking-tight text-[#1A1A1A] mb-3">
                Competition Brief
              </h2>
              <p className="font-normal text-xs sm:text-sm text-[#1A1A1A]/80 leading-relaxed [text-wrap:balance]">
                {prog.description}
              </p>
            </div>

            <div className="sticker-card bg-white p-6 sm:p-8">
              <h2 className="font-display text-2xl uppercase tracking-tight text-[#1A1A1A] mb-4">
                Official Rules & Regulations
              </h2>
              <ul className="space-y-3">
                {prog.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#1A1A1A]/85">
                    <span className="w-5 h-5 rounded-full border-2 border-[#1A1A1A] bg-[#B6FF3B] text-[#1A1A1A] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t-2 border-[#1A1A1A]/10 text-[11px] text-[#1A1A1A]/60">
                * {PLACEHOLDER_DISCLAIMER} Final rule amendments will be presented at the morning briefing.
              </div>
            </div>
          </div>

          {/* Sidebar: Coordinators & Registration (1 col) */}
          <div className="space-y-6">
            <div className="sticker-card bg-white p-6">
              <h3 className="font-display text-xl uppercase tracking-tight text-[#1A1A1A] mb-4">
                Student Coordinators
              </h3>
              <div className="space-y-3">
                {prog.coordinators.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border-2 border-[#1A1A1A] bg-[#F7F1E5] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-display text-sm text-[#1A1A1A]">{c.name}</div>
                      <div className="text-[10px] opacity-60">Desk Coordinator</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1A1A1A]/80">
                      {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="sticker-card bg-[#FFD60A] p-6 text-[#1A1A1A]">
              <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75 mb-1">
                Collegiate Entry
              </span>
              <h4 className="font-display text-2xl uppercase tracking-tight leading-tight">
                Register for {prog.name}
              </h4>
              <p className="text-xs opacity-80 mt-2 mb-6 [text-wrap:balance]">
                Secure your team slot before entries close. College ID mandatory upon entry.
              </p>
              <Link
                href="/register"
                className="sticker-btn-primary w-full py-3 text-xs uppercase tracking-wider text-center block"
              >
                Register Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Prev & Next Navigation Footer */}
        <div className="border-t-2 border-[#1A1A1A]/10 pt-8 flex items-center justify-between gap-4">
          <Link
            href={`/programs/${prevProg.slug}`}
            className="sticker-pill hover:bg-neutral-100 transition-colors"
          >
            ← {prevProg.name}
          </Link>

          <Link
            href={`/programs/${nextProg.slug}`}
            className="sticker-pill hover:bg-neutral-100 transition-colors"
          >
            {nextProg.name} →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
