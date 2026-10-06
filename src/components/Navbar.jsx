import { useEffect, useState } from 'react'
import { Menu, Close, Search, Bag } from './icons.jsx'
import './Navbar.css'

const LINKS = [
  { label: 'The Calibre', href: '#maisons' },
  { label: 'Maisons', href: '#maisons' },
  { label: 'New Collection', href: '#collection' },
  { label: 'Services', href: '#assurances' },
  { label: 'Geneva Salon', href: '#footer' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // a full-screen menu that scrolls the page behind it is a bug, not a feature
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className={'nav' + (lifted ? ' is-lifted' : '')}>
        <button
          className="nav__icon nav__menu"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="nav__glyph" />
        </button>

        <a className="nav__brand" href="#top">
          <span className="nav__mark">Ora Swiss</span>
          <span className="nav__city">Geneva</span>
        </a>

        <div className="nav__actions">
          <button className="nav__icon" aria-label="Search">
            <Search className="nav__glyph" />
          </button>
          <button className="nav__icon" aria-label="Shopping bag">
            <Bag className="nav__glyph" />
            <span className="nav__count" aria-hidden="true">
              0
            </span>
          </button>
        </div>
      </header>

      <div
        className={'menu' + (open ? ' is-open' : '')}
        // hidden from the tree entirely while closed so tab order stays sane
        {...(open ? {} : { inert: '' })}
      >
        <div className="menu__bar">
          <span className="eyebrow">Menu</span>
          <button
            className="nav__icon"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <Close className="nav__glyph" />
          </button>
        </div>

        <nav className="menu__links" aria-label="Main">
          {LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ '--i': i }}
            >
              <span className="menu__no">{String(i + 1).padStart(2, '0')}</span>
              <span className="menu__label">{link.label}</span>
            </a>
          ))}
        </nav>

        <footer className="menu__foot">
          <p className="eyebrow">Rue du Rhône 62, 1204 Genève</p>
          <p className="eyebrow">+41 22 000 00 00</p>
        </footer>
      </div>
    </>
  )
}
