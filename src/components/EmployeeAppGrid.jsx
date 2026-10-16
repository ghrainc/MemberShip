import { Fragment, useState } from 'react'
import '../styles/EmployeeDashboard.css'

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null

const STATUS_MAP = {
  draft:     { label: 'Draft',     cls: 'status-pending' },
  submitted: { label: 'Submitted', cls: 'status-submitted' },
  approved:  { label: 'Approved',  cls: 'status-approved' },
  rejected:  { label: 'Rejected',  cls: 'status-rejected' },
}

function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status, cls: 'status-unknown' }
  return <span className={`status-badge ${info.cls}`}>{info.label}</span>
}

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved',  label: 'Approved' },
  { key: 'rejected',  label: 'Rejected' },
]

// ── EmployeeAppGrid ───────────────────────────────────────────────────────────
// Props:
//   apps       — array of applications from the server
//   loading    — boolean
//   title      — section heading (e.g. "Warehouse Applications")
//   onRefresh  — callback → reload apps from parent
//   onView(id) — callback → navigate to detail page
//   onReview(id, status, notes) → Promise<{ success, error? }>

export default function EmployeeAppGrid({ apps, loading, title, onRefresh, onView, onReview }) {
  const [activeFilter, setActiveFilter] = useState('submitted')
  const [emailSearch,  setEmailSearch]  = useState('')
  const [expandedId,   setExpandedId]   = useState(null)
  const [revStatus,    setRevStatus]    = useState('')
  const [revNotes,     setRevNotes]     = useState('')
  const [revLoading,   setRevLoading]   = useState(false)
  const [revError,     setRevError]     = useState('')
  const [revRejectErr, setRevRejectErr] = useState('')

  const openReview = (id) => {
    setExpandedId(id)
    setRevStatus('')
    setRevNotes('')
    setRevError('')
    setRevRejectErr('')
  }

  const closeReview = () => {
    setExpandedId(null)
    setRevStatus('')
    setRevNotes('')
    setRevError('')
    setRevRejectErr('')
  }

  const submitReview = async (id) => {
    if (revStatus === 'rejected' && !revNotes.trim()) {
      setRevRejectErr('Notes are required when rejecting.')
      return
    }
    setRevRejectErr('')
    setRevLoading(true)
    setRevError('')
    try {
      const result = await onReview(id, revStatus, revNotes)
      if (!result.success) { setRevError(result.error || 'Review failed.'); return }
      closeReview()
      onRefresh()
    } finally {
      setRevLoading(false)
    }
  }

  const counts = {
    all:       apps.length,
    submitted: apps.filter(a => a.Status === 'submitted').length,
    approved:  apps.filter(a => a.Status === 'approved').length,
    rejected:  apps.filter(a => a.Status === 'rejected').length,
  }

  const visible = apps
    .filter(a => activeFilter === 'all' || a.Status === activeFilter)
    .filter(a => !emailSearch || a.UserEmail.toLowerCase().includes(emailSearch.toLowerCase()))

  return (
    <>
      <div className="content-header">
        <h2>{title}</h2>
        <div className="content-header-right">
          <p className="application-count">
            {loading ? 'Loading…' : `${apps.length} application${apps.length !== 1 ? 's' : ''}`}
          </p>
          <button className="refresh-button" onClick={onRefresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <nav className="inner-tab-nav">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`inner-tab-button${activeFilter === t.key ? ' inner-tab-button--active' : ''}`}
            onClick={() => setActiveFilter(t.key)}
          >
            {t.label}
            <span className="inner-tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </nav>

      <div className="filter-row">
        <div className="filter-input">
          <input
            type="text"
            placeholder="Filter by email…"
            value={emailSearch}
            onChange={e => setEmailSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading applications…</p></div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p>
            {emailSearch || activeFilter !== 'all'
              ? 'No applications match your filter.'
              : `No ${title.toLowerCase()} found.`}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th><span className="th-label">ID</span></th>
                <th><span className="th-label">Applicant</span></th>
                <th><span className="th-label">Submitted</span></th>
                <th><span className="th-label">Status</span></th>
                <th className="action-column"><span className="th-label">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(app => (
                <Fragment key={app.Id}>
                  <tr>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{app.Id}</td>
                    <td className="email-cell">{app.UserEmail}</td>
                    <td>
                      {app.SubmittedAt
                        ? fmt(app.SubmittedAt)
                        : <span style={{ color: 'var(--ghra-muted)' }}>—</span>}
                    </td>
                    <td><StatusBadge status={app.Status} /></td>
                    <td className="action-cell">
                      <button className="view-button" onClick={() => onView(app.Id)}>View</button>
                      {app.Status === 'submitted' && (
                        <button
                          className="reset-pwd-button"
                          onClick={() => expandedId === app.Id ? closeReview() : openReview(app.Id)}
                        >
                          {expandedId === app.Id ? 'Cancel' : 'Review'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {expandedId === app.Id && (
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--ghra-mist)', padding: '16px 20px', borderBottom: '1px solid var(--ghra-line)' }}>
                        <div style={{ maxWidth: 520 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 14px', color: 'var(--ghra-navy)' }}>
                            Review Application #{app.Id}
                          </p>
                          <div style={{ display: 'flex', gap: 28, marginBottom: 14 }}>
                            {['approved', 'rejected'].map(s => (
                              <label key={s} style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name={`review-${app.Id}`}
                                  value={s}
                                  checked={revStatus === s}
                                  onChange={() => { setRevStatus(s); setRevRejectErr('') }}
                                />
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </label>
                            ))}
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ghra-muted)', display: 'block', marginBottom: 4 }}>
                              Notes{revStatus === 'rejected' && <span style={{ color: 'var(--ghra-red)' }}> (required)</span>}
                            </label>
                            <textarea
                              value={revNotes}
                              onChange={e => { setRevNotes(e.target.value); if (revRejectErr) setRevRejectErr('') }}
                              rows={2}
                              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--ghra-line)', borderRadius: 4, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                              placeholder="Add reviewer notes…"
                            />
                          </div>
                          {(revError || revRejectErr) && (
                            <p style={{ fontSize: 12, color: 'var(--ghra-red)', margin: '0 0 10px' }}>
                              {revError || revRejectErr}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="modal-submit-button"
                              disabled={revLoading || !revStatus}
                              onClick={() => submitReview(app.Id)}
                              style={{ fontSize: 13, padding: '6px 18px' }}
                            >
                              {revLoading ? 'Submitting…' : 'Submit Review'}
                            </button>
                            <button
                              className="delete-button"
                              onClick={closeReview}
                              style={{ fontSize: 13, padding: '6px 14px', background: 'var(--ghra-muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
