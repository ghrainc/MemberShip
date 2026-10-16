import { useState } from 'react'
import '../styles/ViewApplication.css'
import '../styles/MembershipForm.css'

const LOGO_URL =
  'https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800'

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null

// ── Primitives ────────────────────────────────────────────────────────────────

export function InfoField({ label, value }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className="info-field">
      <span className="info-field-label">{label}</span>
      <span
        className="info-field-value"
        style={isEmpty ? { color: 'var(--ghra-muted)', fontStyle: 'italic' } : undefined}
      >
        {isEmpty ? 'Not provided' : String(value)}
      </span>
    </div>
  )
}

export function InfoRow({ children }) {
  return <div className="info-row">{children}</div>
}

export function ReviewSection({ title, children }) {
  return (
    <div className="form-section-inner">
      {title && <span className="inner-legend">{title}</span>}
      {children}
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    draft:     { label: 'Draft',     cls: 'status-pending' },
    submitted: { label: 'Submitted', cls: 'status-submitted' },
    approved:  { label: 'Approved',  cls: 'status-approved' },
    rejected:  { label: 'Rejected',  cls: 'status-rejected' },
  }
  const info = map[status] || { label: status, cls: 'status-unknown' }
  return <span className={`status-badge ${info.cls}`}>{info.label}</span>
}

// ── Header card ───────────────────────────────────────────────────────────────

export function ReviewHeader({ id, type, status, userEmail, submittedAt, onBack }) {
  const typeLabel = type === 'fuels' ? 'Fuels Credit Application' : 'Warehouse Application'
  return (
    <>
      <button className="back-button" onClick={onBack}>← Back to Dashboard</button>
      <div className="membership-header">
        <img src={LOGO_URL} alt="GHRA Logo" className="membership-logo" />
        <h1>GHRA {typeLabel}</h1>
        <p className="header-subtitle">Application #{id}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <StatusBadge status={status} />
          <span className="submitted-info">{userEmail}</span>
          {submittedAt && <span className="submitted-info">Submitted {fmt(submittedAt)}</span>}
        </div>
      </div>
    </>
  )
}

// ── Reviewer status banner ────────────────────────────────────────────────────

export function ReviewerBanner({ status, notes, reviewedBy, reviewedAt }) {
  if (!status || status === 'submitted' || status === 'draft') return null
  const variant = status === 'approved' ? 'banner-approved' : status === 'rejected' ? 'banner-rejected' : 'banner-info'
  const icon    = status === 'approved' ? '✓' : status === 'rejected' ? '✗' : 'ℹ'
  const label   = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected — Needs Revision' : status
  return (
    <div className={`reviewer-comments-banner ${variant}`}>
      <div className="reviewer-comments-header">
        <span className="reviewer-comments-icon">{icon}</span>
        <strong>{label}</strong>
        {reviewedBy && (
          <span className="reviewer-meta">
            by {reviewedBy}{reviewedAt ? ` · ${fmt(reviewedAt)}` : ''}
          </span>
        )}
      </div>
      {notes && <p className="reviewer-comments-text">{notes}</p>}
    </div>
  )
}

// ── Approve / Reject decision panel ──────────────────────────────────────────
// onSubmit(status, notes) — notes are required for rejection

export function ReviewDecision({ onSubmit, loading, error }) {
  const [notes,     setNotes]     = useState('')
  const [rejectErr, setRejectErr] = useState('')

  const submit = (status) => {
    if (status === 'rejected' && !notes.trim()) {
      setRejectErr('Notes are required when rejecting.')
      return
    }
    setRejectErr('')
    onSubmit(status, notes)
  }

  return (
    <fieldset className="form-section">
      <legend>Review Decision</legend>
      <div className="form-section-inner">
        {(error || rejectErr) && (
          <p style={{ color: 'var(--ghra-red)', fontSize: 13, marginBottom: 12 }}>
            {error || rejectErr}
          </p>
        )}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 600, color: 'var(--ghra-slate)', fontSize: 13 }}>
            Notes&nbsp;
            <span style={{ color: 'var(--ghra-red)', fontSize: 11, fontWeight: 400 }}>
              (required for rejection)
            </span>
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={e => { setNotes(e.target.value); if (rejectErr) setRejectErr('') }}
            placeholder="Add reviewer notes..."
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="nav-button approve-action-button"
            onClick={() => submit('approved')}
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Approve'}
          </button>
          <button
            className="nav-button reject-action-button"
            onClick={() => submit('rejected')}
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Reject'}
          </button>
        </div>
      </div>
    </fieldset>
  )
}
