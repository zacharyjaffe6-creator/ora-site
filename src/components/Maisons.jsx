import { ArrowLong } from './icons.jsx'
import { hiRes } from './hiRes.js'
import './Maisons.css'

/* Reference layout: six portrait cards in a row, alternating a centred
   wordmark card with a photographic one.

   The wordmark cards carry their maison's own piece behind the type, dimmed
   and cooled so the name still reads first - which keeps the reference's
   alternating rhythm instead of turning the row into six photographs. */
const CARDS = [
  {
    type: 'mark',
    name: 'Marchand',
    note: 'Genève · 1911',
    image: './products/01.webp',
  },
  {
    type: 'image',
    src: './products/02.webp',
    name: 'Aubert & Fils — Promenade',
  },
  {
    type: 'mark',
    name: 'Delacourt Genève',
    note: 'Vallorbe · 1879',
    image: './products/03.webp',
  },
  {
    type: 'mark',
    name: 'Verreaux',
    note: 'Neuchâtel · 1852',
    image: './products/04.webp',
  },
  {
    type: 'mark',
    name: 'Belmont',
    note: 'Paris · 1861',
    image: './products/05.webp',
  },
  {
    type: 'image',
    src: './stills/maison-4.webp',
    name: 'Inside the Atelier',
  },
]

/* one card's rendered width at each breakpoint in Maisons.css */
const SIZES = '(max-width: 560px) 50vw, (max-width: 1100px) 33vw, 16vw'

export default function Maisons() {
  return (
    <section className="maisons" id="maisons">
      <div className="shell">
        <header className="maisons__head" data-reveal>
          <h2 className="maisons__title">The World of Ora Swiss</h2>
          <p className="maisons__sub">Curated. Authentic. Timeless.</p>
        </header>

        <ul className="maisons__grid">
          {CARDS.map((card, i) => (
            <li
              className={'m-card m-card--' + card.type}
              key={card.name}
              data-reveal
              style={{ '--i': i }}
            >
              {card.type === 'image' ? (
                <>
                  <img
                    {...hiRes(card.src)}
                    sizes={SIZES}
                    alt={card.name}
                    loading="lazy"
                  />
                  <span className="m-card__caption">{card.name}</span>
                </>
              ) : (
                <>
                  <img
                    className="m-card__bg"
                    {...hiRes(card.image)}
                    sizes={SIZES}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                  <span className="m-card__mark">
                    <em>{card.name}</em>
                    <small>{card.note}</small>
                  </span>
                  <span className="m-card__hover">
                    View <ArrowLong className="m-card__arrow" />
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>

        <a className="ghost-btn maisons__cta" href="#collection" data-reveal>
          <span>All Maisons</span>
          <ArrowLong className="ghost-btn__arrow" />
        </a>
      </div>
    </section>
  )
}
