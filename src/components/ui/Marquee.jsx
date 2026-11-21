'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Marquee — Infinite horizontal ticker where speed reacts to scroll velocity.
 * Seamlessly loops content. As the user scrolls fast, the ticker accelerates smoothly,
 * then gently decelerates back to its baseline velocity.
 */
export default function Marquee({
  items = [],
  children,
  baseSpeed = 50, // pixels per second
  direction = 'left',
  className = '',
  itemClassName = '',
  separator = '✦',
  pauseOnHover = true,
}) {
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const prefersReduced = useReducedMotion()

  // Track contents
  const contentList = items.length > 0 ? items : children ? [children] : []

  useEffect(() => {
    if (prefersReduced) return

    const track = trackRef.current
    if (!track) return

    let currentX = 0
    let velocityMultiplier = 1
    const dirFactor = direction === 'left' ? -1 : 1

    // ScrollTrigger to observe scroll velocity
    const trigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const vel = Math.abs(self.getVelocity())
        // Boost speed based on scroll velocity (capped to prevent blur)
        const boost = Math.min(vel / 200, 6)
        velocityMultiplier = 1 + boost
      },
    })

    let lastTime = performance.now()

    const tickerCallback = (time, deltaTime) => {
      // Smoothly decay velocityMultiplier back toward 1
      velocityMultiplier += (1 - velocityMultiplier) * 0.08

      const dt = deltaTime / 1000 // seconds
      const speed = isHovered && pauseOnHover ? 0 : baseSpeed * velocityMultiplier
      currentX += dirFactor * speed * dt

      // Total track contains two identical halves; width of half is half scrollWidth
      const halfWidth = track.scrollWidth / 2
      if (halfWidth > 0) {
        if (currentX <= -halfWidth) {
          currentX += halfWidth
        } else if (currentX >= 0) {
          currentX -= halfWidth
        }
        track.style.transform = `translate3d(${currentX}px, 0, 0)`
      }
    }

    gsap.ticker.add(tickerCallback)

    return () => {
      gsap.ticker.remove(tickerCallback)
      trigger.kill()
    }
  }, [baseSpeed, direction, isHovered, pauseOnHover, prefersReduced])

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full overflow-hidden select-none will-change-transform ${className}`}
      aria-label="Fest highlights marquee"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap will-change-transform py-2"
        style={{ width: 'max-content' }}
      >
        {/* Primary copy */}
        <div className="flex items-center gap-6 sm:gap-10 shrink-0">
          {contentList.map((item, idx) => (
            <div key={`c1-${idx}`} className={`flex items-center gap-6 sm:gap-10 ${itemClassName}`}>
              <span>{item}</span>
              {separator && <span className="opacity-40">{separator}</span>}
            </div>
          ))}
        </div>

        {/* Seamless duplicate copy for infinite loop */}
        <div
          className="flex items-center gap-6 sm:gap-10 shrink-0"
          aria-hidden="true"
        >
          {contentList.map((item, idx) => (
            <div key={`c2-${idx}`} className={`flex items-center gap-6 sm:gap-10 ${itemClassName}`}>
              <span>{item}</span>
              {separator && <span className="opacity-40">{separator}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
