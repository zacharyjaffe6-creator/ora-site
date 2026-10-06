import { useEffect, useRef, useState } from 'react'
import {
  ATELIER_FRAMES,
  ATELIER_CHAPTER_FRAMES,
  useFrameSequence,
  resolveFrame,
} from '../hooks/useFrameSequence'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { createSmoother, splitFrame } from '../hooks/scrub'
import {
  HD_HEIGHT,
  HD_MAX_SPEED,
  SD_HEIGHT,
  createPaintBudget,
} from '../hooks/hdFrames'
import { ArrowLong } from './icons.jsx'
import './AtelierStage.css'

const CHAPTERS = ATELIER_FRAMES / ATELIER_CHAPTER_FRAMES // 2
/* Shorter than the hero stage per chapter: this clip is a slow push-in, so a
   long rail would read as nothing happening. */
const CHAPTER_VH = 160

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

const STEPS = [
  { no: '01', name: 'Appraisal', meta: 'Movement opened, logged, photographed' },
  { no: '02', name: 'Service', meta: 'Stripped, cleaned, re-lubricated by hand' },
  { no: '03', name: 'Certification', meta: '72 hours on the timing bench' },
]

export default function AtelierStage() {
  const reduced = usePrefersReducedMotion()
  const [armed, setArmed] = useState(false)

  const { framesRef, hdRef } = useFrameSequence({
    dir: 'atelier',
    hdDir: 'atelier-hd',
    total: ATELIER_FRAMES,
    enabled: armed,
  })

  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const chapterRefs = useRef([])
  const barRef = useRef(null)

  /* Don't pull 6MB of frames on first paint - start once the section is within
     roughly a viewport and a half of the fold. */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || armed) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true)
          io.disconnect()
        }
      },
      { rootMargin: '150% 0px' },
    )
    io.observe(stage)
    return () => io.disconnect()
  }, [armed])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    let raf = 0
    let lastKey = -1
    let lastP = -1
    let needsRedraw = true
    let hdOn = false
    let drawnHd = false
    let lastExact = 0
    let lastNow = 0
    let hdPaintPending = false
    const budget = createPaintBudget()
    const smoother = createSmoother()

    const sizeCanvas = () => {
      // a backing store much taller than the frames only adds pixels to push
      // every frame - cap it a little above the source height (900px, or
      // 1440px once the HD set is streaming)
      const sourceH = hdRef.current ? HD_HEIGHT : SD_HEIGHT
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.max(1, (sourceH * 1.15) / canvas.clientHeight),
      )
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        needsRedraw = true
      }
    }

    const paint = (img, alpha) => {
      const cw = canvas.width
      const ch = canvas.height
      // the movement sits centre-left and the hand enters top-right, so on
      // portrait viewports hold the left of frame rather than the centre
      const focusX = cw / ch < 1.1 ? 0.38 : 0.5
      const scale = Math.max(cw / img.width, ch / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.globalAlpha = alpha
      // resizing a canvas resets its state, so this is set on every draw
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, (cw - w) * focusX, (ch - h) / 2, w, h)
      ctx.globalAlpha = 1
    }

    const draw = ({ a, b, mix }, hd) => {
      const imgA = hd?.get(a) || resolveFrame(framesRef.current, a)
      if (!imgA) return false
      ctx.fillStyle = '#070604'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      paint(imgA, 1)
      const imgB = mix > 0 ? hd?.get(b) || framesRef.current[b] : null
      if (imgB && imgB !== imgA) paint(imgB, mix)
      drawnHd = !!hd?.get(a) && (!imgB || !!hd.get(b))
      return true
    }

    const render = (now) => {
      raf = requestAnimationFrame(render)

      const rect = stage.getBoundingClientRect()
      const travel = stage.offsetHeight - window.innerHeight
      const scrolled = clamp(-rect.top, 0, travel)
      const target = travel > 0 ? scrolled / travel : 0

      const visible = rect.bottom > 0 && rect.top < window.innerHeight
      if (!visible) smoother.snap(target, now)
      const p = smoother.step(target, now, reduced || !visible)

      const hd = hdRef.current
      // the HD set switched on or off: re-size the backing store for it
      if (!!hd !== hdOn) {
        hdOn = !!hd
        sizeCanvas()
      }

      const exact = p * (ATELIER_FRAMES - 1)
      const split = splitFrame(exact, ATELIER_FRAMES)
      // the frame after an HD paint shows what that paint really cost
      if (hdPaintPending) budget.record(now - lastNow)
      hdPaintPending = false

      // scrub speed in frames per second, so 60Hz and 120Hz screens agree
      const dt = Math.max(1, now - lastNow) / 1000
      const speed = Math.abs(exact - lastExact) / dt
      lastExact = exact
      lastNow = now
      const sharp = hd && !budget.tooSlow && speed < HD_MAX_SPEED ? hd : null
      if (hd) hd.focus(split.a)
      if (sharp && !drawnHd && sharp.get(split.a)) needsRedraw = true

      if (p === lastP && !needsRedraw) return
      lastP = p

      if (split.key !== lastKey || needsRedraw) {
        // keep retrying until the frames exist (the atelier loads lazily)
        needsRedraw = !draw(split, sharp)
        hdPaintPending = drawnHd
        lastKey = split.key
      }

      const scaled = p * CHAPTERS
      chapterRefs.current.forEach((el, i) => {
        if (!el) return
        const lp = clamp(scaled - i, 0, 1)
        // chapter 01 is already up when the section arrives
        const fadeIn = i === 0 ? 1 : clamp(lp / 0.22, 0, 1)
        const fadeOut = clamp((1 - lp) / 0.22, 0, 1)
        const opacity = Math.min(fadeIn, fadeOut)
        el.style.opacity = opacity.toFixed(3)
        el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none'
        if (!reduced) {
          const rise = (1 - easeOut(fadeIn)) * 34 - (1 - easeOut(fadeOut)) * 34
          el.style.transform = 'translate3d(0,' + rise.toFixed(2) + 'px,0)'
        }
      })

      if (barRef.current) {
        barRef.current.style.transform = 'scaleX(' + p.toFixed(4) + ')'
      }
    }

    const onResize = () => {
      sizeCanvas()
      needsRedraw = true
    }

    sizeCanvas()
    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [framesRef, hdRef, reduced])

  const setChapter = (i) => (el) => {
    chapterRefs.current[i] = el
  }

  return (
    <section
      className="atelier"
      id="atelier"
      ref={stageRef}
      style={{ height: CHAPTERS * CHAPTER_VH + 'vh' }}
      aria-label="Inside the atelier"
    >
      <div className="atelier__pin">
        <canvas className="atelier__canvas" ref={canvasRef} aria-hidden="true" />

        {/* ----------------------------- 01 - CREED ---------------------- */}
        <article className="a-chapter a-chapter--creed" ref={setChapter(0)}>
          <div className="a-chapter__inner">
            <h2 className="atelier__title">
              <span>Precision is</span>
              <span>not a feature.</span>
              <span>It is our</span>
              <span>foundation.</span>
            </h2>
            <a className="ghost-btn atelier__cta" href="#collection">
              <span>Discover more</span>
              <ArrowLong className="ghost-btn__arrow" />
            </a>
          </div>
        </article>

        {/* ----------------------------- 02 - THE BENCH ------------------ */}
        <article className="a-chapter a-chapter--bench" ref={setChapter(1)}>
          <div className="a-chapter__inner">
            <p className="eyebrow">The Atelier — Genève</p>
            <h2 className="atelier__title atelier__title--sm">
              <span>Every piece passes</span>
              <span>through these hands.</span>
            </h2>
            <ol className="bench-list">
              {STEPS.map((step) => (
                <li key={step.no}>
                  <span className="bench-list__no">{step.no}</span>
                  <span className="bench-list__text">
                    <strong>{step.name}</strong>
                    <small>{step.meta}</small>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </article>

        <div className="atelier__progress" aria-hidden="true">
          <span ref={barRef} />
        </div>
      </div>
    </section>
  )
}
