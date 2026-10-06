/* Inline SVG only - no icon dependency. Everything is drawn on a 24-unit grid
   with 1px hairlines to match the reference's thin-line iconography. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function ArrowLong({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 12" {...base}>
      <path d="M0 6h45" />
      <path d="M39.5 1.5 45 6l-5.5 4.5" />
    </svg>
  )
}

export function Menu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  )
}

export function Close({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

export function Search({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function Bag({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}

/* --- assurance row ------------------------------------------------------- */

export function SealCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" {...base}>
      <circle cx="16" cy="16" r="11" />
      <path d="m11 16.2 3.4 3.3L21 12.8" />
    </svg>
  )
}

export function Shipping({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" {...base}>
      <path d="M3 9h13v12H3z" />
      <path d="M16 13h6l4 4.2V21h-10z" />
      <circle cx="9" cy="23" r="2.2" />
      <circle cx="22" cy="23" r="2.2" />
    </svg>
  )
}

export function Expert({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" {...base}>
      <circle cx="14" cy="11" r="4.5" />
      <path d="M5.5 25c1.4-4.6 4.6-7 8.5-7 1.6 0 3 .4 4.3 1.2" />
      <path d="M21 22.5h6M24 19.5l3 3-3 3" />
    </svg>
  )
}

export function SecureCard({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" {...base}>
      <rect x="3.5" y="8" width="25" height="16" rx="2.5" />
      <path d="M3.5 13.5h25" />
      <path d="M7.5 19h5" />
    </svg>
  )
}

/* --- hero left column ---------------------------------------------------- */

export function WatchGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="5.6" />
      <path d="M12 9.4V12l1.8 1.2" />
      <path d="M9.4 6.7 9.8 3h4.4l.4 3.7M9.4 17.3 9.8 21h4.4l.4-3.7" />
    </svg>
  )
}

export function Movement({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.6v2.8M12 18.6v2.8M2.6 12h2.8M18.6 12h2.8" />
      <path d="M5.3 5.3 7.3 7.3M16.7 16.7l2 2M18.7 5.3l-2 2M7.3 16.7l-2 2" />
    </svg>
  )
}

export function Play({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M10 8.6 15.6 12 10 15.4Z" />
    </svg>
  )
}
