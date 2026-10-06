import { ArrowLong } from './icons.jsx'
import { hiRes } from './hiRes.js'
import './NewCollection.css'

/* Reference screenshot four: the page inverts to paper here. A full-bleed
   watch fills the left, and the paper panel curves into it with a large
   half-ellipse rather than a straight edge. */
export default function NewCollection() {
  return (
    <section className="collection" id="collection">
      <div className="collection__media" data-reveal>
        <img
          {...hiRes('./stills/collection-main.webp')}
          sizes="(max-width: 900px) 100vw, 48vw"
          alt="A dive calibre shown open, with the movement exposed"
          loading="lazy"
        />
      </div>

      <div className="collection__body">
        <div className="collection__inner">
          <h2 className="collection__title" data-reveal>
            New Collection
          </h2>

          <blockquote className="collection__note" data-reveal style={{ '--i': 1 }}>
            <p>
              A wide assortment of dive and dress references to suit any wrist.
              Discover the full selection across every maison we carry, and find the
              combination of style and function that belongs to you.
            </p>
          </blockquote>

          <div className="collection__cards">
            <figure data-reveal style={{ '--i': 2 }}>
              <img
                {...hiRes('./stills/collection-a.webp')}
                sizes="(max-width: 900px) 50vw, 18vw"
                alt="Bezel and dial assembly held in the light"
                loading="lazy"
              />
              <figcaption>The Bezel — 60-click ceramic</figcaption>
            </figure>
            <figure data-reveal style={{ '--i': 3 }}>
              <img
                {...hiRes('./stills/collection-b.webp')}
                sizes="(max-width: 900px) 50vw, 18vw"
                alt="The movement resting on its case back"
                loading="lazy"
              />
              <figcaption>The Movement — V-240 automatic</figcaption>
            </figure>
          </div>

          <a
            className="ghost-btn collection__cta"
            href="#maisons"
            data-reveal
            style={{ '--i': 4 }}
          >
            <span>Discover the Range</span>
            <ArrowLong className="ghost-btn__arrow" />
          </a>
        </div>
      </div>
    </section>
  )
}
