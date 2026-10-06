import { SealCheck, Shipping, Expert, SecureCard } from './icons.jsx'
import './Assurances.css'

const ITEMS = [
  {
    Icon: SealCheck,
    label: 'Authenticity',
    copy: ['100% authentic', 'guaranteed'],
  },
  {
    Icon: Shipping,
    label: 'Global Delivery',
    copy: ['Insured shipping', 'worldwide'],
  },
  {
    Icon: Expert,
    label: 'Watch Experts',
    copy: ['Personalised', 'advice'],
  },
  {
    Icon: SecureCard,
    label: 'Secure Payment',
    copy: ['Safe & encrypted', 'transactions'],
  },
]

export default function Assurances() {
  return (
    <section className="assurances" id="assurances">
      <div className="shell">
        <ul className="assurances__row">
          {ITEMS.map(({ Icon, label, copy }, i) => (
            <li key={label} data-reveal style={{ '--i': i }}>
              <Icon className="assurances__icon" />
              <h3 className="assurances__label">{label}</h3>
              <p className="assurances__copy">
                {copy[0]}
                <br />
                {copy[1]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
