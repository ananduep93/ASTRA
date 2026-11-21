'use client'

import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * TiltedBanner — Rotated high-contrast sticker tape marquee between sections.
 * Features 2px ink borders, vibrant background, and zero horizontal scroll.
 */
export default function TiltedBanner({
  text = 'ASTRA 2026 ✦ DON BOSCO COLLEGE MAMPETTA ✦ ARTS ✦ TECH ✦ GAMING ✦ BUSINESS ✦ FUN ✦ DATES TBA ✦',
  bgColor = '#FFD60A',
  textColor = '#1A1A1A',
  rotate = '-rotate-2',
}) {
  const prefersReduced = useReducedMotion()

  return (
    <div className="relative w-full overflow-hidden py-6 sm:py-8 select-none my-4">
      <div
        className={`w-[110%] -ml-[5%] py-3 sm:py-4 border-y-2 border-[#1A1A1A] shadow-[0_4px_0_#1A1A1A] flex whitespace-nowrap ${
          prefersReduced ? '' : rotate
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="flex animate-[marquee_20s_linear_infinite] shrink-0 font-display text-sm sm:text-base font-bold tracking-widest uppercase">
          <span className="mr-8">{text}</span>
          <span className="mr-8">{text}</span>
        </div>
        <div
          className="flex animate-[marquee_20s_linear_infinite] shrink-0 font-display text-sm sm:text-base font-bold tracking-widest uppercase"
          aria-hidden="true"
        >
          <span className="mr-8">{text}</span>
          <span className="mr-8">{text}</span>
        </div>
      </div>
    </div>
  )
}
