import { ArrowLong } from './icons.jsx'
import './Footer.css'

const COLUMNS = [
  {
    title: 'Collections',
    links: ['The Sea Collection', 'Dress', 'Chronograph', 'Limited Editions'],
  },
  {
    title: 'The House',
    links: ['Our Story', 'The Atelier', 'Certification', 'Journal'],
  },
  {
    title: 'Client Care',
    links: ['Servicing', 'Shipping & Returns', 'Warranty', 'Contact'],
  },
]

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="shell">
        <div className="footer__top">
          <div className="footer__brand" data-reveal>
            <span className="footer__mark">Ora Swiss</span>
            <span className="footer__city">Geneva</span>
            <p className="footer__blurb">
              A curated house of exceptional timepieces, appraised and serviced
              in Geneva since 1926.
            </p>
          </div>

          <nav className="footer__cols" aria-label="Footer">
            {COLUMNS.map((col, i) => (
              <div key={col.title} data-reveal style={{ '--i': i + 1 }}>
                <h3 className="eyebrow">{col.title}</h3>
                <ul>
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#top">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <form
          className="footer__signup"
          data-reveal
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="eyebrow" htmlFor="newsletter">
            Private viewings & new arrivals
          </label>
          <div className="footer__field">
            <input
              id="newsletter"
              type="email"
              name="email"
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
            <button type="submit" aria-label="Subscribe">
              <ArrowLong className="footer__arrow" />
            </button>
          </div>
        </form>

        <div className="footer__legal">
          <p>© {new Date().getFullYear()} Ora Swiss SA · Rue du Rhône 62, Genève</p>
          <ul>
            <li>
              <a href="#top">Privacy</a>
            </li>
            <li>
              <a href="#top">Terms</a>
            </li>
            <li>
              <a href="#top">Cookies</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
