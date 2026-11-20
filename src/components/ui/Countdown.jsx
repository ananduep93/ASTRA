'use client'

import { useState, useEffect } from 'react'
import { FEST_TARGET_DATE } from '@/data/programs'

export default function Countdown({ targetDate = FEST_TARGET_DATE }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!targetDate) return

    const targetTime = new Date(targetDate).getTime()
    if (isNaN(targetTime)) return

    const updateCountdown = () => {
      const now = Date.now()
      const diff = Math.max(0, targetTime - now)

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  // When no official date is set, display "Dates to be announced" without fake numbers
  if (!targetDate || !timeLeft) {
    return (
      <div
        className="inline-flex items-center gap-2.5 px-4 py-2 border border-[var(--w-border)] text-xs font-mono shadow-sm transition-colors"
        style={{
          backgroundColor: 'var(--w-card-bg)',
          borderRadius: 'var(--w-button-radius)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--w-accent)' }}
        />
        <span className="text-[var(--w-text)] font-semibold tracking-wider uppercase">
          Dates to be announced
        </span>
        <span className="hidden sm:inline text-[var(--w-text-secondary)] opacity-60 text-[10px]">
          • Official countdown unlocks soon
        </span>
      </div>
    )
  }

  const timeUnits = [
    { label: 'DAYS', value: mounted ? String(timeLeft.days).padStart(2, '0') : '--' },
    { label: 'HRS', value: mounted ? String(timeLeft.hours).padStart(2, '0') : '--' },
    { label: 'MINS', value: mounted ? String(timeLeft.minutes).padStart(2, '0') : '--' },
    { label: 'SECS', value: mounted ? String(timeLeft.seconds).padStart(2, '0') : '--' },
  ]

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {timeUnits.map((unit, idx) => (
        <div key={unit.label} className="flex items-center">
          <div
            className="flex flex-col items-center justify-center px-2.5 py-1.5 sm:px-4 sm:py-2.5 min-w-[48px] sm:min-w-[68px] border border-[var(--w-border)] transition-colors shadow-sm"
            style={{
              backgroundColor: 'var(--w-card-bg)',
              borderRadius: 'var(--w-button-radius)',
            }}
          >
            <span
              className="text-base sm:text-2xl font-bold font-mono tracking-tight"
              style={{ color: 'var(--w-accent)' }}
            >
              {unit.value}
            </span>
            <span className="text-[8px] sm:text-[10px] font-mono tracking-widest text-[var(--w-text-secondary)] uppercase mt-0.5">
              {unit.label}
            </span>
          </div>
          {idx < timeUnits.length - 1 && (
            <span className="mx-0.5 sm:mx-1.5 text-sm sm:text-lg font-mono text-[var(--w-text-secondary)] opacity-40">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
