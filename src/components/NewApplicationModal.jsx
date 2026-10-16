import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { PROGRAMS } from '../utils/programOptions'
import '../styles/NewApplicationModal.css'

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

export default function NewApplicationModal({ onClose }) {
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const firstCardRef = useRef(null)

  useEffect(() => {
    firstCardRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleSelect = (prog) => {
    onClose()
    navigate(prog.newPath)
  }

  return (
    <div
      className="nam-overlay"
      ref={overlayRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nam-title"
    >
      <div className="nam-panel">
        <div className="nam-panel-header">
          <h2 id="nam-title" className="nam-title">Start a New Application</h2>
          <button className="nam-close" onClick={onClose} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="nam-subtitle">
          Choose the program you want to apply for. You can hold multiple programs on one account.
        </p>

        <div className="nam-cards">
          {PROGRAMS.map((prog, i) => (
            <button
              key={prog.id}
              className="nam-card"
              onClick={() => handleSelect(prog)}
              ref={i === 0 ? firstCardRef : null}
            >
              <div className="nam-card-icon">
                {PROGRAM_ICONS[prog.id]}
              </div>
              <div className="nam-card-body">
                <div className="nam-card-label-row">
                  <span className="nam-card-label">{prog.label}</span>
                  <span className="nam-card-tagline">{prog.tagline}</span>
                </div>
                <p className="nam-card-desc">{prog.dashboardDescription}</p>
                {prog.note && (
                  <span className="nam-card-note">{prog.note}</span>
                )}
              </div>
              <div className="nam-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
