import { useEffect } from 'react'

/**
 * Inertial page scrolling for wheels and trackpads, without a library.
 *
 * The wheel is intercepted and turned into a scroll target; the page then
 * glides toward it with exponential damping each frame. Everything scroll-
 * driven on the page - both frame sequences, the pinned rail, the chapter
 * text - reads window.scrollY, so it all inherits the same glide.
 *
 * Left native on purpose: touch screens (their own momentum is already
 * smooth), reduced motion, pinch-zoom, horizontal swipes, keyboard and
 * scrollbar drags, and anything while the page is locked (preloader, menu).
 */

/* seconds; larger glides longer after the wheel stops */
const TAU = 0.2

export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const root = document.documentElement
    let target = window.scrollY
    let current = target
    let raf = 0
    let last = 0

    const maxScroll = () => root.scrollHeight - window.innerHeight
    const locked = () => document.body.style.overflow === 'hidden'

    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      current += (target - current) * (1 - Math.exp(-dt / TAU))
      if (Math.abs(target - current) < 0.5) current = target
      window.scrollTo({ top: current, behavior: 'instant' })
      raf = current === target ? 0 : requestAnimationFrame(tick)
    }

    const onWheel = (e) => {
      if (e.ctrlKey || e.defaultPrevented || locked()) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()

      // idle: pick up wherever anchors, keys or the scrollbar left the page
      if (!raf) {
        current = window.scrollY
        target = current
      }
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
      target = Math.min(maxScroll(), Math.max(0, target + e.deltaY * unit))

      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    // any other kind of scroll takes over from the glide immediately
    const onKey = () => stop()
    const onPointer = () => stop()

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)

    return () => {
      stop()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [enabled])
}
