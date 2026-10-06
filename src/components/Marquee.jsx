import './Marquee.css'

const WORDS = [
  'Swiss Made',
  'Since 1926',
  'Genève',
  'In-House Calibre',
  'Certified Chronometer',
  'Lifetime Servicing',
]

/* A quiet transition strip between the pinned stage and the page proper, so
   the scroll does not slam from full-bleed footage straight into a grid. */
export default function Marquee() {
  const run = [...WORDS, ...WORDS]

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <span className="marquee__run" key={copy}>
            {run.map((word, i) => (
              <span className="marquee__word" key={copy + '-' + i}>
                {word}
                <i />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
