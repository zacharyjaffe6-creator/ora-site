import { useEffect, useRef } from 'react'
import {
  TOTAL_FRAMES,
  CHAPTER_FRAMES,
  FPS,
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
import {
  ArrowLong,
  WatchGlyph,
  Movement,
  SealCheck,
  Play,
} from './icons.jsx'
import './ScrollStage.css'

const CHAPTERS = TOTAL_FRAMES / CHAPTER_FRAMES // 4
const CHAPTER_VH = 185 // scroll distance per 2.5s chapter -> ~3vh per frame
const CLIP_SECONDS = TOTAL_FRAMES / FPS

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

/** Timecode for the HUD, e.g. 00:04.21 */
function timecode(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const cs = Math.floor((seconds * 100) % 100)
  const pad = (n) => String(n).padStart(2, '0')
  return pad(m) + ':' + pad(s) + '.' + pad(cs)
}

const CALIBRE_STATS = [
  { to: 240, unit: '', label: 'Components' },
  { to: 28800, unit: '', label: 'Vibrations / hour' },
  { to: 70, unit: 'h', label: 'Power reserve' },
  { to: 2, unit: 's', label: 'Deviation / day' },
]

export default function ScrollStage({ framesRef, hdRef, started }) {
  const reduced = usePrefersReducedMotion()

  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const chapterRefs = useRef([])
  const railFillRef = useRef(null)
  const railIndexRef = useRef(null)
  const timecodeRef = useRef(null)
  const frameReadoutRef = useRef(null)
  const progressBarRef = useRef(null)
  const countUpRefs = useRef([])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    let raf = 0
    let lastKey = -1
    let lastP = -1
    let lastChapter = -1
    let needsRedraw = true
    let hdOn = false
    let drawnHd = false
    let lastExact = 0
    let lastNow = 0
    let hdPaintPending = false
    const budget = createPaintBudget()
    const smoother = createSmoother()

    /* --- canvas sizing ---------------------------------------------------- */
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

    /* --- cover-fit draw --------------------------------------------------- */
    const paint = (img, alpha) => {
      const cw = canvas.width
      const ch = canvas.height
      // On narrow/portrait viewports bias the crop toward the watch, which sits
      // right of centre, instead of slicing it off.
      const focusX = cw / ch < 1.1 ? 0.6 : 0.5
      const scale = Math.max(cw / img.width, ch / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.globalAlpha = alpha
      // resizing a canvas resets its state, so this is set on every draw
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, (cw - w) * focusX, (ch - h) / 2, w, h)
      ctx.globalAlpha = 1
    }

    // the frame either side of the exact scroll position, cross-faded, so the
    // film never steps from one still to the next
    // each frame is taken from the HD set when it is decoded, else the
    // standard one - the two can be mixed within a single cross-fade
    const draw = ({ a, b, mix }, hd) => {
      const imgA = hd?.get(a) || resolveFrame(framesRef.current, a)
      if (!imgA) return false
      ctx.fillStyle = '#000a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      paint(imgA, 1)
      const imgB = mix > 0 ? hd?.get(b) || framesRef.current[b] : null
      if (imgB && imgB !== imgA) paint(imgB, mix)
      drawnHd = !!hd?.get(a) && (!imgB || !!hd.get(b))
      return true
    }

    /* --- the single scroll loop ------------------------------------------- */
    const render = (now) => {
      raf = requestAnimationFrame(render)

      const rect = stage.getBoundingClientRect()
      const travel = stage.offsetHeight - window.innerHeight
      const scrolled = clamp(-rect.top, 0, travel)
      const target = travel > 0 ? scrolled / travel : 0

      // off screen there is nothing to ease - park on the target so the film
      // is already in place when the section comes back into view
      const visible = rect.bottom > 0 && rect.top < window.innerHeight
      if (!visible) smoother.snap(target, now)
      const p = smoother.step(target, now, reduced || !visible)

      const hd = hdRef.current
      // the HD set switched on or off: re-size the backing store for it
      if (!!hd !== hdOn) {
        hdOn = !!hd
        sizeCanvas()
      }

      const exact = p * (TOTAL_FRAMES - 1)
      const frame = Math.min(TOTAL_FRAMES - 1, Math.round(exact))
      const split = splitFrame(exact, TOTAL_FRAMES)
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
      // the sharp version of what is on screen is available: swap it in
      if (sharp && !drawnHd && sharp.get(split.a)) needsRedraw = true

      // nothing moved and nothing was resized: leave the canvas and DOM alone
      if (p === lastP && !needsRedraw) return
      lastP = p

      if (split.key !== lastKey || needsRedraw) {
        // keep retrying until the first frames have decoded
        needsRedraw = !draw(split, sharp)
        hdPaintPending = drawnHd
        lastKey = split.key
      }

      // chapter visibility, written straight to the node so React stays out of
      // the scroll path entirely
      const scaled = p * CHAPTERS
      const active = Math.min(CHAPTERS - 1, Math.floor(scaled))

      chapterRefs.current.forEach((el, i) => {
        if (!el) return
        const lp = clamp(scaled - i, 0, 1)
        // chapter 01 is fully present at rest: it is the hero on first paint
        const fadeIn = i === 0 ? 1 : clamp(lp / 0.18, 0, 1)
        const fadeOut = clamp((1 - lp) / 0.2, 0, 1)
        const opacity = Math.min(fadeIn, fadeOut)
        el.style.opacity = opacity.toFixed(3)
        el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none'
        if (!reduced) {
          const rise = (1 - easeOut(fadeIn)) * 40 - (1 - easeOut(fadeOut)) * 40
          el.style.transform = 'translate3d(0,' + rise.toFixed(2) + 'px,0)'
        }
      })

      // chapter 04's counters tick up as the exploded view opens
      const ch4 = clamp(scaled - 3, 0, 1)
      countUpRefs.current.forEach((el) => {
        if (!el) return
        const target = Number(el.dataset.to)
        const value = Math.round(target * easeOut(clamp(ch4 / 0.7, 0, 1)))
        const next = value.toLocaleString('en-US')
        if (el.textContent !== next) el.textContent = next
      })

      /* HUD */
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = 'scaleX(' + p.toFixed(4) + ')'
      }
      if (railFillRef.current) {
        railFillRef.current.style.transform = 'scaleX(' + p.toFixed(4) + ')'
      }
      if (active !== lastChapter) {
        lastChapter = active
        if (railIndexRef.current) {
          railIndexRef.current.textContent = String(active + 1).padStart(2, '0')
        }
        stage.dataset.chapter = String(active + 1)
      }
      if (timecodeRef.current) {
        timecodeRef.current.textContent = timecode(p * CLIP_SECONDS)
      }
      if (frameReadoutRef.current) {
        frameReadoutRef.current.textContent = String(frame + 1).padStart(3, '0')
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

  // nudge a redraw once the curtain lifts, in case the loop ran before the
  // first frames finished decoding
  useEffect(() => {
    if (started) window.dispatchEvent(new Event('resize'))
  }, [started])

  const setChapter = (i) => (el) => {
    chapterRefs.current[i] = el
  }

  return (
    <section
      className="stage"
      ref={stageRef}
      data-chapter="1"
      style={{ height: CHAPTERS * CHAPTER_VH + 'vh' }}
      aria-label="The calibre, taken apart"
    >
      <div className="stage__pin">
        <canvas className="stage__canvas" ref={canvasRef} aria-hidden="true" />

        {/* overall progress through the clip */}
        <div className="stage__progress" aria-hidden="true">
          <span ref={progressBarRef} />
        </div>

        {/* ------------------------------ 01 - HERO ------------------------ */}
        <article className="chapter chapter--hero" ref={setChapter(0)}>
          <div className="chapter__inner">
            <p className="hero__eyebrow">
              <i className="hero__eyebrow-rule" aria-hidden="true" />
              <WatchGlyph className="hero__eyebrow-glyph" />
              <span>Featured Timepiece</span>
            </p>

            <h1 className="hero__title">
              <span>Time,</span>
              <span>Redefined.</span>
            </h1>

            <p className="hero__lede">
              Fifty references, appraised and serviced in Geneva. Each one
              opened, timed and certified before it ever reaches a wrist.
            </p>

            <ul className="hero__features">
              <li>
                <Movement className="hero__feature-icon" />
                <div>
                  <h2>Swiss Movement</h2>
                  <p>In-house calibre, 70-hour reserve, certified to −2/+2 sec.</p>
                </div>
              </li>
              <li>
                <SealCheck className="hero__feature-icon" />
                <div>
                  <h2>Certified Authentic</h2>
                  <p>Every piece bench-tested for 72 hours and papered.</p>
                </div>
              </li>
            </ul>

            <div className="hero__actions">
              <a className="solid-btn hero__cta" href="#featured">
                <span>Explore Collection</span>
                <ArrowLong className="solid-btn__arrow" />
              </a>
              <a className="hero__film" href="#atelier">
                <Play className="hero__film-icon" />
                <span>Inside the atelier</span>
              </a>
            </div>
          </div>

          <p className="hero__cue" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </p>
        </article>

        {/* --------------------------- 02 - CONSTRUCTION ------------------- */}
        <article className="chapter chapter--seal" ref={setChapter(1)}>
          <div className="chapter__inner">
            <p className="eyebrow">Chapter 02 — Construction</p>
            <h2 className="chapter__title">
              <span>Sealed against</span>
              <span>the deep.</span>
            </h2>
            <p className="chapter__body">
              Twenty-four screws, each torqued to 0.4 newton-metres. A caseback
              gasket of vulcanised nitrile. Three hundred metres of water held
              back by tolerances measured in microns.
            </p>
            <ul className="spec-chips">
              <li>300m water resistance</li>
              <li>904L steel</li>
              <li>24 screws</li>
            </ul>
          </div>
        </article>

        {/* --------------------------- 03 - ARCHITECTURE ------------------- */}
        <article className="chapter chapter--layers" ref={setChapter(2)}>
          <div className="chapter__inner">
            <p className="eyebrow">Chapter 03 — Architecture</p>
            <h2 className="chapter__title">
              <span>Every layer,</span>
              <span>deliberate.</span>
            </h2>
            <ol className="layer-list">
              <li>
                <span className="layer-list__no">01</span>
                <span className="layer-list__name">Sapphire crystal</span>
                <span className="layer-list__meta">
                  2.1mm, dual anti-reflective
                </span>
              </li>
              <li>
                <span className="layer-list__no">02</span>
                <span className="layer-list__name">Ceramic bezel</span>
                <span className="layer-list__meta">
                  60-click, unidirectional
                </span>
              </li>
              <li>
                <span className="layer-list__no">03</span>
                <span className="layer-list__name">Lacquered dial</span>
                <span className="layer-list__meta">
                  Seven coats, hand-polished
                </span>
              </li>
              <li>
                <span className="layer-list__no">04</span>
                <span className="layer-list__name">Oscillating weight</span>
                <span className="layer-list__meta">22k gold, skeletonised</span>
              </li>
            </ol>
          </div>
        </article>

        {/* ---------------------------- 04 - THE CALIBRE ------------------- */}
        <article className="chapter chapter--calibre" ref={setChapter(3)}>
          <div className="chapter__inner">
            <div className="calibre__head">
              <p className="eyebrow">Chapter 04 — The calibre</p>
              <h2 className="chapter__title">
                <span>Calibre V-240.</span>
              </h2>
            </div>
            <dl className="calibre__stats">
              {CALIBRE_STATS.map((stat, i) => (
                <div className="calibre__stat" key={stat.label}>
                  <dt>
                    <span
                      ref={(el) => {
                        countUpRefs.current[i] = el
                      }}
                      data-to={stat.to}
                    >
                      0
                    </span>
                    {stat.unit ? <em>{stat.unit}</em> : null}
                  </dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>

        {/* ------------------------------- HUD ----------------------------- */}
        <div className="rail" aria-hidden="true">
          <span className="rail__index" ref={railIndexRef}>
            01
          </span>
          <span className="rail__track">
            <span className="rail__fill" ref={railFillRef} />
          </span>
          <span className="rail__total">04</span>
        </div>

        <div className="readout" aria-hidden="true">
          <span className="readout__time" ref={timecodeRef}>
            00:00.00
          </span>
          <span className="readout__sep" />
          <span className="readout__frame" ref={frameReadoutRef}>
            001
          </span>
          <span className="readout__total">/ {TOTAL_FRAMES}</span>
        </div>
      </div>
    </section>
  )
}
