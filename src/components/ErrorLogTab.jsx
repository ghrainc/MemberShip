import { useState, useEffect, Fragment } from 'react'

const ERROR_TYPE_LABELS = {
  api_failure:        'API Failure',
  auth_failure:       'Auth Failure',
  blocked_navigation: 'Blocked Navigation',
  validation_block:   'Validation Block',
  upload_failure:     'Upload Failure',
  upload_validation:  'Upload Validation',
  js_error:           'JS Error',
  render_error:       'Render Error',
  unknown:            'Unknown',
}

const TYPE_BADGE_COLOURS = {
  api_failure:        { background: '#f8d7da', color: '#721c24' },
  auth_failure:       { background: '#f8d7da', color: '#721c24' },
  blocked_navigation: { background: '#fff3cd', color: '#856404' },
  validation_block:   { background: '#d1ecf1', color: '#0c5460' },
  upload_failure:     { background: '#f8d7da', color: '#721c24' },
  upload_validation:  { background: '#fff3cd', color: '#856404' },
  js_error:           { background: '#f8d7da', color: '#721c24' },
  render_error:       { background: '#f8d7da', color: '#721c24' },
  unknown:            { background: '#e2e3e5', color: '#383d41' },
}

function TypeBadge({ type }) {
  const style = { ...(TYPE_BADGE_COLOURS[type] || TYPE_BADGE_COLOURS.unknown), padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }
  return <span style={style}>{ERROR_TYPE_LABELS[type] || type}</span>
}

function prettyJson(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
}

export default function ErrorLogTab({ getClientErrorLogs }) {
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [page, setPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState(null)

  const [filterEmail, setFilterEmail] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStep, setFilterStep] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const fetchData = async (filters, pg) => {
    setLoading(true)
    setLoadError(false)
    const result = await getClientErrorLogs({
      ...(filters.email    ? { email:     filters.email    } : {}),
      ...(filters.errorType? { errorType: filters.errorType} : {}),
      ...(filters.step     ? { step:      filters.step     } : {}),
      ...(filters.from     ? { from:      filters.from     } : {}),
      ...(filters.to       ? { to:        filters.to       } : {}),
      page: pg,
    })
    if (!result) { setLoadError(true); setLoading(false); return }
    setEntries(result.entries || [])
    if (pg === 1) setSummary(result.summary || null)
    setLoading(false)
  }

  useEffect(() => {
    fetchData({ email: '', errorType: '', step: '', from: '', to: '' }, 1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentFilters = () => ({ email: filterEmail, errorType: filterType, step: filterStep, from: filterFrom, to: filterTo })

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchData(currentFilters(), 1) }

  const handleReset = () => {
    setFilterEmail(''); setFilterType(''); setFilterStep(''); setFilterFrom(''); setFilterTo('')
    setPage(1)
    fetchData({ email: '', errorType: '', step: '', from: '', to: '' }, 1)
  }

  const handlePrev = () => { if (page <= 1) return; const np = page - 1; setPage(np); fetchData(currentFilters(), np) }
  const handleNextPage = () => { const np = page + 1; setPage(np); fetchData(currentFilters(), np) }

  return (
    <div>
      <div className="content-header">
        <h2>Client Error Log</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ghra-muted)' }}>
          Errors members encounter in their browser — auto-logged, newest first.
        </p>
      </div>

      {/* ── Last 24h summary ── */}
      {summary && (
        <div style={{ background: 'var(--ghra-mist)', border: '1px solid var(--ghra-line)', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            Last 24 hours — {summary.total24h === 0 ? 'no errors' : `${summary.total24h} error${summary.total24h !== 1 ? 's' : ''}`}
          </div>
          {summary.total24h > 0 && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: summary.byStep.length > 0 ? 8 : 0 }}>
                {summary.byType.map(t => (
                  <span key={t.errorType} style={{ fontSize: 12 }}>
                    <TypeBadge type={t.errorType} /> <strong style={{ fontSize: 13 }}>{t.cnt}</strong>
                  </span>
                ))}
              </div>
              {summary.byStep.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {summary.byStep.map(s => (
                    <span key={s.step} style={{ background: 'var(--ghra-white)', border: '1px solid var(--ghra-line)', borderRadius: 10, padding: '2px 8px', fontSize: 11, color: 'var(--ghra-slate)' }}>
                      Step {s.step}: <strong>{s.cnt}</strong>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Member email"
          value={filterEmail}
          onChange={e => setFilterEmail(e.target.value)}
          className="form-input"
          style={{ width: 200 }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-input" style={{ width: 160 }}>
          <option value="">All types</option>
          {Object.entries(ERROR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterStep} onChange={e => setFilterStep(e.target.value)} className="form-input" style={{ width: 90 }}>
          <option value="">All steps</option>
          {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>Step {s}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="form-input" style={{ width: 140 }} title="From date" />
        <input type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)}   className="form-input" style={{ width: 140 }} title="To date" />
        <button type="submit" className="action-button">Search</button>
        <button type="button" onClick={handleReset} className="action-button" style={{ background: 'var(--ghra-mist)', color: 'var(--ghra-slate)', border: '1px solid var(--ghra-line)' }}>Reset</button>
      </form>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ghra-muted)' }}>Loading…</div>
      ) : loadError ? (
        <div style={{ padding: 24, color: '#721c24' }}>Failed to load error log.</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ghra-muted)' }}>No errors matching these filters.</div>
      ) : (
        <>
          <div className="applications-table-wrapper">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Step</th>
                  <th>Action</th>
                  <th>Message</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <Fragment key={entry.Id}>
                    <tr style={{ cursor: entry.TechnicalDetail ? 'pointer' : 'default' }} onClick={() => entry.TechnicalDetail && setExpandedRow(expandedRow === entry.Id ? null : entry.Id)}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(entry.CreatedAt).toLocaleString()}</td>
                      <td style={{ fontSize: 13 }}>{entry.UserEmail || <span style={{ color: 'var(--ghra-muted)' }}>—</span>}</td>
                      <td><TypeBadge type={entry.ErrorType} /></td>
                      <td style={{ fontSize: 13 }}>{entry.Step != null ? `Step ${entry.Step}` : <span style={{ color: 'var(--ghra-muted)' }}>—</span>}</td>
                      <td style={{ fontSize: 12, color: 'var(--ghra-muted)' }}>{entry.Action || '—'}</td>
                      <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.Message}>{entry.Message}</td>
                      <td style={{ width: 60, textAlign: 'center' }}>
                        {entry.TechnicalDetail && (
                          <button type="button" className="ds-ev-expand" onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === entry.Id ? null : entry.Id) }}>
                            {expandedRow === entry.Id ? 'Hide' : 'Detail'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedRow === entry.Id && (
                      <tr>
                        <td colSpan={7} style={{ background: '#f8f9fa', padding: '12px 20px', borderBottom: '2px solid var(--ghra-line)' }}>
                          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 260, overflow: 'auto', fontFamily: 'monospace' }}>
                            {prettyJson(entry.TechnicalDetail)}
                          </pre>
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 11, color: 'var(--ghra-muted)' }}>
                            {entry.ApplicationId != null && <span>App ID: {entry.ApplicationId}</span>}
                            {entry.SessionAgeMinutes != null && <span>Session age: {entry.SessionAgeMinutes} min</span>}
                            {entry.Url && <span style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>URL: {entry.Url}</span>}
                            {entry.UserAgent && <span style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.UserAgent}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', fontSize: 14 }}>
            <button type="button" onClick={handlePrev} disabled={page <= 1} className="action-button" style={{ padding: '6px 14px' }}>← Prev</button>
            <span style={{ color: 'var(--ghra-muted)' }}>Page {page}</span>
            <button type="button" onClick={handleNextPage} disabled={entries.length < 100} className="action-button" style={{ padding: '6px 14px' }}>Next →</button>
          </div>
        </>
      )}
    </div>
  )
}
