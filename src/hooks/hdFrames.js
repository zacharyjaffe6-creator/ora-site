/**
 * High-definition layer for the frame sequences.
 *
 * The standard frames (1600x900) stay the base: they load behind the preloader
 * and are always there to draw. On screens that can show more detail, a 2560x1440
 * copy of each frame then streams in afterwards and is drawn instead wherever
 * it is ready.
 *
 * The HD frames ship packed 20 to a file (pack-NN.bin, the WebP files back to
 * back, with offsets in index.json) - 18 requests instead of 360. Packs are
 * fetched nearest to the current scroll position first.
 *
 * A decoded 2560x1440 frame is ~15MB of pixels, so holding all 240 decoded would
 * cost gigabytes. Instead the compressed files are kept (~0.2MB each) and only
 * the frames around the current scroll position are decoded into ImageBitmaps,
 * ahead in the direction of travel. createImageBitmap decodes off the main
 * thread, so filling the window never stalls a scrub; frames that fall out of
 * the window are released.
 */

export const HD_HEIGHT = 1440
export const SD_HEIGHT = 900

/* Above this scrub speed (frames per second of scroll) the standard frames are
   drawn instead: in fast motion the extra detail is invisible, and pushing a
   fresh 2560x1440 bitmap every tick is what would cost smoothness. The sharp
   frame swaps back in as soon as the scrub slows. */
export const HD_MAX_SPEED = 72

/* The browser defers the real raster work, so timing drawImage itself says
   nothing. What is measured instead is the gap to the next animation frame
   after an HD paint: a machine where that averages above this (ms) - under
   ~30fps, typically CPU rasterisation - goes back to the standard frames for
   the rest of the visit rather than being made to stutter. */
const HD_SLOW_PAINT = 34

/** Collects frame gaps after HD paints and reports when they are too slow. */
export function createPaintBudget() {
  let avg = 0
  let samples = 0
  let tooSlow = false
  return {
    record(ms) {
      // a hidden tab or a debugger pause is not a slow paint
      if (document.hidden || ms > 1000) return
      samples += 1
      avg += (ms - avg) / Math.min(samples, 8)
      if (samples >= 6 && avg > HD_SLOW_PAINT) tooSlow = true
    },
    get tooSlow() {
      return tooSlow
    },
  }
}

/* decoded frames kept at once: ~15MB each, so ~470MB at most */
const CAPACITY = 32
const AHEAD = 14
const BEHIND = 5
const FETCH_POOL = 2
const DECODE_POOL = 3

/**
 * Worth it only where the canvas is drawn larger than the standard frames:
 * a Retina laptop or a large monitor. Phones and tablets keep the standard set
 * - their screens are small enough that 1600x900 is already sharp, and they
 * should not pay for the download.
 */
export function wantsHD() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(pointer: coarse)').matches) return false
  if (typeof createImageBitmap !== 'function') return false
  const dpr = window.devicePixelRatio || 1
  const longSide = Math.max(window.screen.width, window.screen.height) * dpr
  return longSide > 1800
}

/* Packs are raw bytes, except on hosts that only serve text - there index.json
   says "encoding": "base64". Going through a data: URL keeps the base64
   decode off the main thread. */
function readPack(res, encoding) {
  if (encoding !== 'base64') return res.arrayBuffer()
  return res
    .text()
    .then((b64) =>
      fetch('data:application/octet-stream;base64,' + b64.trim()),
    )
    .then((data) => data.arrayBuffer())
}

export function createHdCache(dir, total) {
  const blobs = new Array(total).fill(null)
  let index = null
  let fetched = []
  const bitmaps = new Map()
  const decoding = new Set()
  const controller = new AbortController()
  let center = 0
  let heading = 1
  let fetching = 0
  let decodingCount = 0
  let disposed = false
  let version = 0

  // nearest-first, leaning forward: the order frames are about to be needed
  const windowOrder = () => {
    const order = [center]
    const ahead = heading > 0 ? AHEAD : BEHIND
    const behind = heading > 0 ? BEHIND : AHEAD
    for (let d = 1; d <= Math.max(ahead, behind); d += 1) {
      if (d <= ahead && center + d < total) order.push(center + d)
      if (d <= behind && center - d >= 0) order.push(center - d)
    }
    return order
  }

  const evict = () => {
    while (bitmaps.size > CAPACITY) {
      let worst = -1
      let worstDist = -1
      for (const i of bitmaps.keys()) {
        const dist = Math.abs(i - center)
        if (dist > worstDist) {
          worst = i
          worstDist = dist
        }
      }
      bitmaps.get(worst).close()
      bitmaps.delete(worst)
    }
  }

  const pumpDecode = () => {
    if (disposed) return
    for (const i of windowOrder()) {
      if (decodingCount >= DECODE_POOL) return
      if (!blobs[i] || bitmaps.has(i) || decoding.has(i)) continue
      decoding.add(i)
      decodingCount += 1
      createImageBitmap(blobs[i])
        .then((bm) => {
          if (disposed) {
            bm.close()
            return
          }
          bitmaps.set(i, bm)
          evict()
          version += 1
        })
        .catch(() => {})
        .finally(() => {
          decoding.delete(i)
          decodingCount -= 1
          pumpDecode()
        })
    }
  }

  // downloads every pack once, the one holding the current frame first
  const nextToFetch = () => {
    const here = index.frames[Math.min(center, index.frames.length - 1)][0]
    let best = -1
    let bestDist = Infinity
    for (let p = 0; p < index.packs.length; p += 1) {
      if (fetched[p]) continue
      const dist = Math.abs(p - here)
      if (dist < bestDist) {
        best = p
        bestDist = dist
      }
    }
    return best
  }

  // split a downloaded pack back into one WebP blob per frame
  const unpack = (pack, buffer) => {
    index.frames.forEach(([p, offset, length], i) => {
      if (p !== pack || i >= total) return
      blobs[i] = new Blob([new Uint8Array(buffer, offset, length)], {
        type: 'image/webp',
      })
    })
  }

  const pumpFetch = () => {
    while (!disposed && fetching < FETCH_POOL) {
      const p = nextToFetch()
      if (p < 0) return
      fetched[p] = true
      fetching += 1
      fetch(dir + '/' + index.packs[p], { signal: controller.signal })
        .then((res) => (res.ok ? readPack(res, index.encoding) : null))
        .then((buffer) => {
          if (buffer && !disposed) {
            unpack(p, buffer)
            pumpDecode()
          }
        })
        .catch(() => {})
        .finally(() => {
          fetching -= 1
          pumpFetch()
        })
    }
  }

  fetch(dir + '/index.json', { signal: controller.signal })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (!json || disposed) return
      index = json
      fetched = new Array(json.packs.length).fill(false)
      pumpFetch()
    })
    .catch(() => {})

  return {
    /** Decoded HD frame, or null if it is not ready yet. */
    get(i) {
      return bitmaps.get(i) || null
    },
    /** Tell the cache where the scrub is, so it decodes around it. */
    focus(i) {
      if (i === center) return
      heading = i > center ? 1 : -1
      center = i
      pumpDecode()
    },
    /** Bumps whenever a new frame becomes drawable - a cue to redraw. */
    get version() {
      return version
    },
    dispose() {
      disposed = true
      controller.abort()
      bitmaps.forEach((bm) => bm.close())
      bitmaps.clear()
    },
  }
}
