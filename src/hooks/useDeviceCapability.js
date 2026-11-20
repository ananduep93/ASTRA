'use client'

import { useState, useEffect } from 'react'

/**
 * Detects whether the device is "low-end" based on:
 *  - hardwareConcurrency <= 4
 *  - deviceMemory <= 4 (if available)
 *  - touch-only device with small screen
 *
 * Used to disable heavy effects (cursor trail particles, etc.)
 */
export function useDeviceCapability() {
  const [isLowEnd, setIsLowEnd] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4
    const memory = navigator.deviceMemory || 8 // default to 8 if unsupported
    const touchOnly = 'ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches

    setIsTouch('ontouchstart' in window)
    setIsLowEnd(cores <= 4 || memory <= 4 || (touchOnly && window.innerWidth < 768))
  }, [])

  return { isLowEnd, isTouch }
}
