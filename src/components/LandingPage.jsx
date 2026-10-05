import { Link } from 'react-router'
import '../styles/LandingPage.css'

const LOGO_URL =
  'https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800'

const FEATURES = [
  {
    title: 'Wholesale Purchasing',
    description:
      'Access competitive wholesale pricing on a broad range of grocery and convenience items sourced through the cooperative.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    title: 'Fuels Program',
    description:
      'Members with unbranded fuel operations can participate in the GHRA Fuels Program for supply agreements and ACH billing.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 22V8l9-6 9 6v14" />
        <path d="M9 22V12h6v10" />
        <path d="M13 2l7 4" />
        <polyline points="17 8 17 18 21 18 21 8" />
      </svg>
    ),
  },
  {
    title: 'Warehouse Membership',
    description:
      'Gain access to warehouse ordering with authorised card holders, scheduled deliveries, and streamlined account management.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
  },
  {
    title: 'Member Support',
    description:
      'Our dedicated team reviews every application, keeps you informed at each stage, and supports your business long after approval.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  return (
    <div className="lp-root">
      {/* Header */}
      <header className="lp-header">
        <img src={LOGO_URL} alt="GHRA" className="lp-header-logo" />
        <Link to="/login" className="lp-header-signin">
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-hero-eyebrow">Greater Houston Retailers Association</span>
          <h1 className="lp-hero-title">
            GHRA <span>Membership</span>
          </h1>
          <p className="lp-hero-tagline">
            Join the cooperative that serves independent Houston-area retailers. Access wholesale
            purchasing, fuels programs, warehouse services, and more — all under one membership.
          </p>
          <div className="lp-hero-actions">
            <Link to="/signup" className="lp-btn-primary">
              Apply for Membership
            </Link>
            <Link to="/login" className="lp-btn-outline">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-features">
        <div className="lp-section-header">
          <h2>What Membership Includes</h2>
          <p>
            GHRA members gain access to a suite of cooperative programs designed for independent
            retailers.
          </p>
        </div>
        <div className="lp-cards">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-card">
              <div className="lp-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2>Ready to Join?</h2>
          <p>
            Complete our online membership application. A GHRA staff member will review your
            submission and guide you through the next steps.
          </p>
          <div className="lp-cta-actions">
            <Link to="/signup" className="lp-btn-primary">
              Apply for Membership
            </Link>
            <Link to="/login" className="lp-btn-secondary">
              Sign In
            </Link>
          </div>
          <p className="lp-cta-note">
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <p>
          &copy; {new Date().getFullYear()} Greater Houston Retailers Association. All rights
          reserved.
        </p>
      </footer>
    </div>
  )
}
