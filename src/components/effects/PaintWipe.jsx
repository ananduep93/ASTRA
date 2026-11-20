'use client'

import { useWorld } from '@/context/WorldContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * PaintWipe — Signature transition between INK and CODE worlds.
 * Creates an organic diagonal sweep with a distinct leading edge:
 * - Entering CODE: sharp matrix-style neon edge with cyber grid sweep
 * - Entering INK: fluid ink-wash black sweep with saffron leading stroke
 */
export default function PaintWipe() {
  const { isWiping, wipeTarget } = useWorld()
  const prefersReduced = useReducedMotion()

  if (prefersReduced || !isWiping) return null

  const isEnteringCode = wipeTarget === 'code'

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9990] overflow-hidden"
      aria-hidden="true"
    >
      {/* Wipe layer */}
      <div
        className={`absolute inset-0 transition-transform duration-600 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          isEnteringCode ? 'bg-[#0A0A0F]' : 'bg-[#1A1A1A]'
        }`}
        style={{
          animation: 'paintWipeSweep 600ms cubic-bezier(0.65, 0, 0.35, 1) forwards',
        }}
      >
        {/* Leading accent edge */}
        <div
          className={`absolute inset-y-0 w-8 blur-sm ${
            isEnteringCode ? 'bg-[#00FFB2] right-0 shadow-[0_0_20px_#00FFB2]' : 'bg-[#C4841D] right-0 shadow-[0_0_20px_#C4841D]'
          }`}
        />
        {/* Subtitle indicator during wipe */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-2xl font-bold tracking-widest uppercase ${
              isEnteringCode
                ? 'font-mono text-[#00FFB2]'
                : 'font-serif text-[#C4841D]'
            }`}
          >
            {isEnteringCode ? '< WORLD: CODE />' : '~ WORLD: INK ~'}
          </span>
        </div>
      </div>
    </div>
  )
}
