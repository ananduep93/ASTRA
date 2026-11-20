'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const WorldContext = createContext(null)

export const WORLDS = {
  INK: 'ink',
  CODE: 'code',
}

export function WorldProvider({ children }) {
  const [world, setWorld] = useState(WORLDS.INK)
  const [isWiping, setIsWiping] = useState(false)
  const [wipeTarget, setWipeTarget] = useState(null)

  // Apply data-world attribute to the html element
  useEffect(() => {
    document.documentElement.setAttribute('data-world', world)
  }, [world])

  const switchWorld = useCallback(
    (targetWorld) => {
      if (targetWorld !== WORLDS.INK && targetWorld !== WORLDS.CODE) return
      if (targetWorld === world && !isWiping) return

      // Respect prefers-reduced-motion: instant switch without visual sweep
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setWorld(targetWorld)
        return
      }

      setWipeTarget(targetWorld)
      setIsWiping(true)

      // Midpoint: switch the theme tokens exactly when overlay covers screen
      const midTimer = setTimeout(() => {
        setWorld(targetWorld)
      }, 280)

      // End of sweep animation
      const endTimer = setTimeout(() => {
        setIsWiping(false)
        setWipeTarget(null)
      }, 620)

      return () => {
        clearTimeout(midTimer)
        clearTimeout(endTimer)
      }
    },
    [world, isWiping]
  )

  const toggleWorld = useCallback(() => {
    const next = world === WORLDS.INK ? WORLDS.CODE : WORLDS.INK
    switchWorld(next)
  }, [world, switchWorld])

  return (
    <WorldContext.Provider
      value={{ world, isWiping, wipeTarget, toggleWorld, switchWorld }}
    >
      {children}
    </WorldContext.Provider>
  )
}

export function useWorld() {
  const context = useContext(WorldContext)
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider')
  }
  return context
}
