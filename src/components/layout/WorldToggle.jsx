'use client'

import { useWorld, WORLDS } from '@/context/WorldContext'

export default function WorldToggle({ className = '', compact = false }) {
  const { world, toggleWorld, isWiping } = useWorld()
  const isCode = world === WORLDS.CODE

  return (
    <button
      onClick={toggleWorld}
      disabled={isWiping}
      aria-label={`Switch to ${isCode ? 'INK' : 'CODE'} world`}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer border border-[var(--w-border)] hover:border-[var(--w-accent)] active:scale-95 ${className}`}
      style={{
        backgroundColor: 'var(--w-card-bg)',
        color: 'var(--w-text)',
        borderRadius: 'var(--w-button-radius)',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
      }}
    >
      {/* Dynamic indicator pill */}
      <span
        className="relative flex h-2 w-2 items-center justify-center"
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ backgroundColor: 'var(--w-accent)' }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: 'var(--w-accent)' }}
        />
      </span>

      {!compact ? (
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--w-text-secondary)] font-normal">MODE:</span>
          <span className="text-[var(--w-accent)] font-bold uppercase">{world}</span>
        </span>
      ) : (
        <span className="text-[var(--w-accent)] font-bold uppercase">{world}</span>
      )}
    </button>
  )
}
