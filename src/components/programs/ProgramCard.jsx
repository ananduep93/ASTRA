'use client'

import Link from 'next/link'
import { useWorld, WORLDS } from '@/context/WorldContext'
import { PLACEHOLDER_LABEL } from '@/data/programs'

export default function ProgramCard({ program, index }) {
  const { world } = useWorld()
  const isCode = world === WORLDS.CODE

  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group block relative h-full transition-all duration-300"
    >
      <div
        className="world-card h-full p-6 flex flex-col justify-between group-hover:-translate-y-1.5 transition-all duration-300"
        style={{
          boxShadow: isCode
            ? '0 0 16px rgba(0, 255, 178, 0.06)'
            : '0 2px 8px rgba(26, 26, 26, 0.06)',
          borderColor: isCode ? 'rgba(0, 255, 178, 0.2)' : 'rgba(26, 26, 26, 0.12)',
        }}
      >
        <div>
          {/* Card Top Meta Bar */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Category Badge */}
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 border"
              style={{
                borderRadius: 'var(--w-button-radius)',
                backgroundColor: 'var(--w-bg-secondary)',
                color: 'var(--w-accent)',
                borderColor: 'var(--w-border)',
              }}
            >
              {isCode ? `<${program.category}/>` : `~ ${program.category} ~`}
            </span>

            {/* Subtle TBA / Index Indicator */}
            <span className="text-[10px] font-mono text-[var(--w-text-secondary)] opacity-60">
              {isCode ? `ID:0${index + 1}` : `No. ${index + 1}`}
            </span>
          </div>

          {/* Program Title */}
          <h3
            className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--w-text)] group-hover:text-[var(--w-accent)] transition-colors leading-snug"
            style={{ fontFamily: 'var(--w-font-display), serif' }}
          >
            {program.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-[var(--w-text-secondary)] mt-2.5 leading-relaxed line-clamp-3">
            {program.shortDescription}
          </p>

          {/* Sub-games indicator for esports */}
          {program.subGames && (
            <div className="mt-3 flex items-center gap-1.5">
              {program.subGames.map((sub) => (
                <span
                  key={sub.name}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--w-border)] text-[var(--w-accent)]"
                >
                  {sub.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Info */}
        <div className="mt-6 pt-4 border-t border-[var(--w-border)] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--w-text-secondary)]">
            <span>{program.teamSize}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--w-accent)]">{program.fee}</span>
            {PLACEHOLDER_LABEL && (
              <span className="text-[9px] text-[var(--w-text-secondary)] opacity-60">
                ({PLACEHOLDER_LABEL})
              </span>
            )}
          </div>
        </div>

        {/* Hover Arrow Indicator */}
        <div
          className="absolute top-4 right-4 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--w-accent)' }}
        >
          {isCode ? 'VIEW_SPEC →' : 'View details →'}
        </div>
      </div>
    </Link>
  )
}
