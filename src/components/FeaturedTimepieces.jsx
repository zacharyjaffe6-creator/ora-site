import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { createSmoother } from '../hooks/scrub'
import { ArrowLong } from './icons.jsx'
import { hiRes } from './hiRes.js'
import './FeaturedTimepieces.css'

/* Drop the generated art into /public/products as 01.webp … 08.webp, or point
   `image` somewhere else. See IMAGE-PROMPTS.md at the project root for the
   prompts these plates were specified against. */
const PRODUCTS = [
  {
    image: './products/01.webp',
    brand: 'Marchand',
    model: 'Abysse Date',
    ref: 'MA-1266',
    price: '€15,900',
    status: 'Available',
    tone: 'ok',
  },
  {
    image: './products/02.webp',
    brand: 'Aubert & Fils',
    model: 'Promenade',
    ref: 'AF-0571',
    price: '€129,000',
    status: 'Reserved',
    tone: 'warn',
  },
  {
    image: './products/03.webp',
    brand: 'Delacourt Genève',
    model: 'Octave',
    ref: 'DC-1551.OO.0132',
    price: '€28,900',
    status: 'Available',
    tone: 'ok',
  },
  {
    image: './products/04.webp',
    brand: 'Verreaux',
    model: 'Lunaris Chronographe',
    ref: 'VX-310.42.50.01',
    price: '€7,250',
    status: 'Available',
    tone: 'ok',
  },
  {
    image: './products/05.webp',
    brand: 'Belmont',
    model: 'Carré Belmont',
    ref: 'BL-0029',
    price: '€8,400',
    status: 'Available',
    tone: 'ok',
  },
  {
    image: './products/06.webp',
    brand: 'Havre',
    model: 'Gulfline 58',
    ref: 'HV-7930-0001',
    price: '€3,950',
    status: 'Available',
    tone: 'ok',
  },
  {
    image: './products/07.webp',
    brand: 'Steinach',
    model: 'Portolan Chronograph',
    ref: 'ST-3716',
    price: '€9,100',
    status: 'Last one',
    tone: 'warn',
  },
  {
    image: './products/08.webp',
    brand: 'Sarnen',
    model: 'Overland',
    ref: 'SA-0450/110A',
    price: '€31,500',
    status: 'On enquiry',
    tone: 'mute',
  },
]

const PIN_VH = 300
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

export default function FeaturedTimepieces() {
  const reduced = usePrefersReducedMotion()
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const viewportRef = useRef(null)
  const washRef = useRef(null)
  const barRef = useRef(null)
  const cardRefs = useRef([])

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!section || !track || !viewport) return

    // below 900px, and whenever motion is reduced, the row becomes an ordinary
    // swipeable scroller instead of a pinned rail
    const narrow = window.matchMedia('(max-width: 900px)')
    let raf = 0
    let lastX = null
    const smoother = createSmoother()

    const isStatic = () => narrow.matches || reduced

    const clearTransforms = () => {
      track.style.transform = ''
      if (washRef.current) washRef.current.style.transform = ''
      cardRefs.current.forEach((el) => {
        if (el) el.style.transform = ''
      })
      lastX = null
    }

    const render = (now) => {
      raf = requestAnimationFrame(render)

      if (isStatic()) {
        if (lastX !== null) clearTransforms()
        return
      }

      const rect = section.getBoundingClientRect()
      const travel = section.offsetHeight - window.innerHeight
      const scrolled = clamp(-rect.top, 0, travel)
      const target = travel > 0 ? scrolled / travel : 0

      // the rail eases toward the scroll position like the film does, and
      // parks on it while the section is off screen
      const visible = rect.bottom > 0 && rect.top < window.innerHeight
      if (!visible) smoother.snap(target, now)
      const p = smoother.step(target, now, !visible)

      // how far the rail has to slide for the last card to reach the left edge
      const distance = Math.max(0, track.scrollWidth - viewport.clientWidth)
      const x = Math.round(-p * distance * 100) / 100
      if (x !== lastX) {
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'

        // parallax: the watermark drifts at a third of the rail's speed, and
        // alternating cards lag slightly so the row has depth rather than
        // sliding as one flat plane
        if (washRef.current) {
          washRef.current.style.transform =
            'translate3d(' + (x * 0.28).toFixed(2) + 'px,0,0)'
        }
        cardRefs.current.forEach((el, i) => {
          if (!el) return
          const lag = (i % 3) * 18 * (1 - p)
          el.style.transform = 'translate3d(0,' + lag.toFixed(2) + 'px,0)'
        })
        if (barRef.current) {
          barRef.current.style.transform = 'scaleX(' + p.toFixed(4) + ')'
        }
        lastX = x
      }
    }

    const onChange = () => clearTransforms()
    narrow.addEventListener('change', onChange)
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      narrow.removeEventListener('change', onChange)
    }
  }, [reduced])

  return (
    <section
      className="featured"
      id="featured"
      ref={sectionRef}
      style={{ height: PIN_VH + 'vh' }}
      data-static={reduced ? '' : undefined}
      aria-label="Featured timepieces"
    >
      <div className="featured__pin">
        <span className="featured__wash" ref={washRef} aria-hidden="true">
          Timepieces
        </span>

        <div className="shell featured__head">
          <h2 className="featured__title">Featured Timepieces</h2>
          <a className="featured__all" href="#maisons">
            <span>View all</span>
            <ArrowLong className="featured__all-arrow" />
          </a>
        </div>

        <div className="featured__viewport" ref={viewportRef}>
          <ul className="featured__track" ref={trackRef}>
            {PRODUCTS.map((p, i) => (
              <li
                className="p-card"
                key={p.ref}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
              >
                <div className="p-card__plate">
                  <img
                    {...hiRes(p.image)}
                    sizes="(max-width: 900px) 74vw, 21vw"
                    alt={p.brand + ' ' + p.model}
                    loading="lazy"
                  />
                  <span className="p-card__index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="p-card__body">
                  <h3 className="p-card__brand">{p.brand}</h3>
                  <p className="p-card__model">{p.model}</p>
                  <p className="p-card__ref">{p.ref}</p>
                  <p className="p-card__price">{p.price}</p>
                </div>

                <div className="p-card__foot">
                  <span className={'p-card__status is-' + p.tone}>
                    {p.status}
                    <i aria-hidden="true" />
                  </span>
                  <button
                    className="p-card__go"
                    aria-label={'View ' + p.brand + ' ' + p.model}
                  >
                    <ArrowLong className="p-card__go-arrow" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="shell">
          <div className="featured__progress" aria-hidden="true">
            <span ref={barRef} />
          </div>
        </div>
      </div>
    </section>
  )
}
