'use client'

/**
 * CursorTrail — placeholder component.
 * Architecture is in place: canvas overlay, reduced-motion check, low-end device check.
 * Full particle implementation (ink drops → pixel breakup) comes last.
 */

import { useRef, useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'

export default function CursorTrail() {
  const canvasRef = useRef(null)
  const prefersReduced = useReducedMotion()
  const { isLowEnd } = useDeviceCapability()

  // Disable entirely for reduced motion or low-end devices
  if (prefersReduced || isLowEnd) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
