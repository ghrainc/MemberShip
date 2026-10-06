import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import '../styles/ViewApplication.css'
import '../styles/MembershipForm.css'
import '../styles/Dashboard.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoField({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="info-field">
      <span className="info-field-label">{label}</span>
      <span className="info-field-value">{String(value)}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="form-section-inner" style={{ marginBottom: 16 }}>
      {title && <span className="inner-legend">{title}</span>}
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    draft:     { label: 'Draft',     cls: 'status-pending' },
    submitted: { label: 'Submitted', cls: 'status-submitted' },
    approved:  { label: 'Approved',  cls: 'status-approved' },
    rejected:  { label: 'Rejected',  cls: 'status-rejected' },
  }
  const info = map[status] || { label: status, cls: 'status-unknown' }
  return <span className={`status-badge ${info.cls}`}>{info.label}</span>
}

// ── Main component ────────────────────────────────────────────────────────────

function WarehouseReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getWarehouseApplication, updateWarehouseStatus } = useContext(AuthContext)

  const [app,       setApp]      = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [notes,     setNotes]    = useState('')
  const [updating,  setUpdating] = useState(false)
  const [updateErr, setUpdateErr] = useState(null)

  const load = () => {
    setLoading(true)
    getWarehouseApplication(id)
      .then(data => { setApp(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatus = async (newStatus) => {
    setUpdateErr(null)
    setUpdating(true)
    const result = await updateWarehouseStatus(id, newStatus, notes)
    setUpdating(false)
    if (!result.success) { setUpdateErr(result.error || 'Update failed'); return }
    load()
  }

  if (loading) {
    return (
      <div className="view-application-container">
        <div className="empty-state"><p>Loading application...</p></div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="view-application-container">
        <button className="back-button" onClick={() => navigate('/employee')}>← Back</button>
        <div className="error-message">Application not found.</div>
      </div>
    )
  }

  const fd = app.formData || {}

  return (
    <div className="view-application-container">
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="back-button" onClick={() => navigate('/employee')}>← Back</button>
        <div>
          <h2 style={{ color: 'var(--ghra-navy)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            Warehouse Application #{app.Id}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <StatusBadge status={app.Status} />
            <span style={{ fontSize: 12, color: 'var(--ghra-muted)' }}>Member: {app.UserEmail}</span>
            {app.SubmittedAt && (
              <span style={{ fontSize: 12, color: 'var(--ghra-muted)' }}>
                Submitted {new Date(app.SubmittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 1: Business ── */}
      <fieldset className="form-section">
        <legend>Business Information</legend>
        <Section>
          <InfoField label="Legal Name"       value={fd.legalName} />
          <InfoField label="DBA Name"         value={fd.dbaName} />
          <InfoField label="Entity Type"      value={fd.entityType === 'other' ? fd.entityTypeOther : fd.entityType} />
          <InfoField label="EIN"              value={fd.ein} />
          <InfoField label="Business Started" value={fd.businessStarted} />
          <InfoField label="# Locations"      value={fd.numLocations} />
          <InfoField label="Business Phone"   value={fd.businessPhone} />
          <InfoField label="Business Email"   value={fd.businessEmail} />
          <InfoField label="Primary Contact"  value={fd.primaryContact} />
          <InfoField label="Store Address"    value={[fd.storeAddress, fd.storeCity, fd.storeState, fd.storeZip].filter(Boolean).join(', ')} />
          {!fd.mailSame && (
            <InfoField label="Mailing Address" value={[fd.mailingAddress, fd.mailingCity, fd.mailingState, fd.mailingZip].filter(Boolean).join(', ')} />
          )}
        </Section>
      </fieldset>

      {/* ── Section 2: Owners ── */}
      <fieldset className="form-section">
        <legend>Owners / Officers</legend>
        {(fd.owners || []).map((o, i) => (
          <Section key={i} title={`Owner ${i + 1}`}>
            <InfoField label="Name"       value={o.ownerName} />
            <InfoField label="Title"      value={o.ownerTitle} />
            <InfoField label="Ownership%" value={o.ownerPct ? `${o.ownerPct}%` : null} />
            <InfoField label="Phone"      value={o.ownerPhone} />
            <InfoField label="Email"      value={o.ownerEmail} />
            <InfoField label="Address"    value={o.ownerAddr} />
            <InfoField label="DL#"        value={o.ownerDl} />
          </Section>
        ))}
      </fieldset>

      {/* ── Section 3: Permits ── */}
      <fieldset className="form-section">
        <legend>Permits</legend>
        <Section>
          <InfoField label="Sales Tax Permit No." value={fd.salesTaxPermitNo} />
          <InfoField label="Tobacco Products"     value={fd.hasTobacco ? 'Yes' : 'No'} />
          {fd.hasTobacco && (
            <>
              <InfoField label="Tobacco Permit No."    value={fd.tobaccoPermitNo} />
              <InfoField label="Tobacco Permit Expiry" value={fd.tobaccoPermitExpiry} />
            </>
          )}
        </Section>
      </fieldset>

      {/* ── Section 4: Purchasing ── */}
      <fieldset className="form-section">
        <legend>Purchasing</legend>
        <Section>
          <InfoField label="Monthly Volume" value={fd.purchaseVolume ? `$${fd.purchaseVolume}` : null} />
          <InfoField label="Start Date"     value={fd.startDate} />
          <InfoField label="Categories"     value={(fd.categories || []).join(', ') || null} />
        </Section>
      </fieldset>

      {/* ── Section 5: Resale Cert ── */}
      <fieldset className="form-section">
        <legend>Resale Certificate</legend>
        <Section>
          <InfoField label="Business Name"  value={fd.rcName} />
          <InfoField label="Permit No."     value={fd.rcPermit} />
          <InfoField label="Phone"          value={fd.rcPhone} />
          <InfoField label="Items"          value={fd.rcItems} />
          <InfoField label="Activity"       value={fd.rcActivity} />
          <InfoField label="Acknowledged"   value={fd.rcAck ? 'Yes' : 'No'} />
        </Section>
      </fieldset>

      {/* ── Section 6: Signature ── */}
      <fieldset className="form-section">
        <legend>Signature</legend>
        <Section>
          <InfoField label="Signer"       value={[fd.signerName, fd.signerTitle].filter(Boolean).join(', ')} />
          <InfoField label="Agreed Terms" value={fd.agreeTerms ? 'Yes' : 'No'} />
          <InfoField label="E-Sign"       value={fd.esign ? 'Yes' : 'No'} />
        </Section>
        {fd.signatureData && (
          <div className="form-section-inner">
            <span className="inner-legend">Signature Image</span>
            <img
              src={fd.signatureData}
              alt="Applicant signature"
              style={{ border: '1px solid var(--ghra-line)', borderRadius: 6, maxWidth: 500, background: '#fff', display: 'block' }}
            />
          </div>
        )}
      </fieldset>

      {/* ── Approve / Reject ── */}
      {app.Status === 'submitted' && (
        <fieldset className="form-section">
          <legend>Review Decision</legend>
          <div className="form-section-inner">
            {updateErr && (
              <p style={{ color: 'var(--ghra-red)', fontSize: 13, marginBottom: 12 }}>{updateErr}</p>
            )}
            <div className="form-group">
              <label style={{ fontWeight: 600, color: 'var(--ghra-slate)', fontSize: 13 }}>
                Notes (optional)
              </label>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add reviewer notes..."
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                className="nav-button approve-action-button"
                onClick={() => handleStatus('approved')}
                disabled={updating}
              >
                {updating ? 'Processing...' : 'Approve'}
              </button>
              <button
                className="nav-button reject-action-button"
                onClick={() => handleStatus('rejected')}
                disabled={updating}
              >
                {updating ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </fieldset>
      )}

      {/* ── Existing reviewer notes ── */}
      {app.Notes && app.Status !== 'submitted' && (
        <fieldset className="form-section">
          <legend>Reviewer Notes</legend>
          <div className="form-section-inner">
            <p style={{ fontSize: 14, color: 'var(--ghra-slate)', lineHeight: 1.6, margin: 0 }}>{app.Notes}</p>
          </div>
        </fieldset>
      )}
    </div>
  )
}

export default WarehouseReview
