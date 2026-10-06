/**
 * Scroll smoothing shared by the scrubbed sections.
 *
 * The raw scroll position moves in wheel-sized steps; driving the frames off it
 * directly makes the film advance in visible jumps. Instead each section keeps
 * its own progress value that chases the scroll target with exponential damping
 * - frame-rate independent, so a 120Hz display glides at the same speed as a
 * 60Hz one - and keeps easing for a moment after the wheel stops.
 */

/* time constant of the chase, in seconds: ~95% of the way in 3x this */
export const SMOOTH_TAU = 0.1

/* below this the value is snapped to the target so the loop can go idle */
const SETTLE = 0.00005

export function createSmoother(tau = SMOOTH_TAU) {
  let value = null
  let last = 0

  return {
    /** Advance toward `target`. `instant` skips the easing (reduced motion). */
    step(target, now, instant = false) {
      if (value === null || instant) {
        value = target
        last = now
        return value
      }
      // clamp dt so a backgrounded tab does not resume with a huge jump
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
      last = now
      value += (target - value) * (1 - Math.exp(-dt / tau))
      if (Math.abs(target - value) < SETTLE) value = target
      return value
    },
    /** Jump straight to `target`, e.g. when the section is re-entered. */
    snap(target, now) {
      value = target
      last = now
    },
  }
}

/**
 * Splits a fractional frame position into the two frames either side and the
 * blend between them, rounded to a 1/48th step so the canvas is only redrawn
 * when the blend changes visibly.
 */
export function splitFrame(exact, total) {
  const pos = Math.min(total - 1, Math.max(0, exact))
  const a = Math.floor(pos)
  const b = Math.min(total - 1, a + 1)
  const mix = Math.round((pos - a) * 48) / 48
  return { a, b, mix, key: a + mix }
}
