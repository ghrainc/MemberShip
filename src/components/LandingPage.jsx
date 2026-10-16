import { Link } from 'react-router'
import { PROGRAMS } from '../utils/programOptions'
import '../styles/LandingPage.css'

const LOGO_URL =
  'https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800'

const PROGRAM_ICONS = {
  membership: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  fuels: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 22V8l6-6h6l3 3v3h2v10" />
      <path d="M3 22h18" />
      <rect x="7" y="13" width="4" height="5" />
      <path d="M17 9h2a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  warehouse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
}

export default function LandingPage() {
  return (
    <div className="lp-root">

      {/* ── Header ── */}
      <header className="lp-header">
        <div className="lp-header-brand">
          <img src={LOGO_URL} alt="GHRA" className="lp-header-logo" />
          <span className="lp-header-org">Greater Houston Retailers Association</span>
        </div>
        <Link to="/login" className="lp-header-signin">
          Sign In
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <p className="lp-hero-eyebrow">Member Applications</p>
          <h1 className="lp-hero-title">Apply for a GHRA Program</h1>
          <p className="lp-hero-tagline">
            Choose the program that fits your business. One account covers all three —
            create an account or sign in to begin.
          </p>
        </div>
      </section>

      {/* ── Program cards ── */}
      <section className="lp-programs" aria-labelledby="lp-programs-heading">
        <h2 id="lp-programs-heading" className="lp-visually-hidden">Programs</h2>
        <div className="lp-prog-cards">
          {PROGRAMS.map((prog) => (
            <article key={prog.id} className="lp-prog-card">
              <div className="lp-prog-card-icon" aria-hidden="true">
                {PROGRAM_ICONS[prog.id]}
              </div>
              <div className="lp-prog-card-header">
                <h3 className="lp-prog-card-label">{prog.label}</h3>
                <span className="lp-prog-card-tagline">{prog.tagline}</span>
              </div>
              <p className="lp-prog-card-desc">{prog.landingDescription}</p>
              {prog.note && (
                <p className="lp-prog-card-note">{prog.note}</p>
              )}
              <div className="lp-prog-card-footer">
                <Link to={prog.signupPath} className="lp-btn-prog">
                  {prog.applyLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <p className="lp-footer-copy">
          &copy; {new Date().getFullYear()} Greater Houston Retailers Association. All rights reserved.
        </p>
        <p className="lp-footer-support">
          Questions about your application?{' '}
          Contact GHRA Member Services for assistance.
        </p>
      </footer>

    </div>
  )
}
