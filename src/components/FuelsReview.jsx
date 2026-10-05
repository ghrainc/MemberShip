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

function FuelsReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getFuelsApplication, updateFuelsStatus } = useContext(AuthContext)

  const [app,       setApp]      = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [notes,     setNotes]    = useState('')
  const [updating,  setUpdating] = useState(false)
  const [updateErr, setUpdateErr] = useState(null)

  const load = () => {
    setLoading(true)
    getFuelsApplication(id).then(data => {
      setApp(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const handleStatus = async (newStatus) => {
    setUpdateErr(null)
    setUpdating(true)
    const result = await updateFuelsStatus(id, newStatus, notes)
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
        <button className="back-button" onClick={() => navigate('/employee')}>Back</button>
        <div className="error-message">Application not found.</div>
      </div>
    )
  }

  const fd = app.formData || {}
  const principals = Array.isArray(fd.principals) ? fd.principals : []

  return (
    <div className="view-application-container">
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="back-button" onClick={() => navigate('/employee')}>Back</button>
        <div>
          <h2 style={{ color: 'var(--ghra-navy)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            Fuels Credit Application #{app.Id}
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

      {/* ── Section 1: Business Info ── */}
      <fieldset className="form-section">
        <legend>Applicant / Business Information</legend>
        <Section>
          <InfoField label="GHRA #"               value={fd.ghraNumber} />
          <InfoField label="Business Type"        value={fd.businessType} />
          <InfoField label="Business / Entity Name" value={fd.businessEntityName} />
          <InfoField label="DBA"                  value={fd.dba} />
          <InfoField label="Billing Address"      value={[fd.billingAddress, fd.billingCity, fd.billingState, fd.billingZip].filter(Boolean).join(', ')} />
          <InfoField label="Delivery Address"     value={[fd.deliveryAddress, fd.deliveryCity, fd.deliveryState, fd.deliveryZip].filter(Boolean).join(', ')} />
          <InfoField label="Property Owned"       value={fd.propertyOwnedByApplicant} />
          {fd.propertyOwnedByApplicant === 'Yes' && (
            <InfoField label="Ownership Entity"   value={fd.ownershipEntityName} />
          )}
          {fd.propertyOwnedByApplicant === 'No' && (
            <>
              <InfoField label="Lease Expiry Year"  value={fd.leasedExpirationYear} />
              <InfoField label="Property Owner Info" value={fd.propertyOwnerInfo} />
            </>
          )}
          <InfoField label="Business Phone"   value={fd.businessPhone} />
          <InfoField label="Business Fax"     value={fd.businessFax} />
          <InfoField label="Business Email"   value={fd.businessEmail} />
          <InfoField label="Year Established" value={fd.yearEstablished} />
          <InfoField label="EIN"              value={fd.ein} />
          <InfoField label="Credit Requested" value={fd.creditRequested ? `$${fd.creditRequested}` : null} />
        </Section>
        <Section title="Delivery Certificate">
          <InfoField label="TECQ Number"         value={fd.tecqNumber} />
          <InfoField label="Facility Number"     value={fd.facilityNumber} />
          <InfoField label="Cert Expiration"     value={fd.certExpirationDate} />
        </Section>
        <Section title="Primary Fuel Contact">
          <InfoField label="Name"  value={fd.primaryFuelContactName} />
          <InfoField label="Title" value={fd.primaryFuelContactTitle} />
          <InfoField label="Phone" value={fd.primaryFuelContactPhone} />
          <InfoField label="Email" value={fd.primaryFuelContactEmail} />
          <InfoField label="Fax"   value={fd.primaryFuelContactFax} />
        </Section>
        <Section title="AP Contact">
          <InfoField label="Name"  value={fd.apContactName} />
          <InfoField label="Title" value={fd.apContactTitle} />
          <InfoField label="Phone" value={fd.apContactPhone} />
          <InfoField label="Email" value={fd.apContactEmail} />
          <InfoField label="Fax"   value={fd.apContactFax} />
        </Section>
      </fieldset>

      {/* ── Section 2: Principals ── */}
      <fieldset className="form-section">
        <legend>Principal Officers / Owners</legend>
        {principals.map((p, i) => (
          <Section key={i} title={`Principal ${i + 1}`}>
            <InfoField label="Name"    value={p.name} />
            <InfoField label="Title"   value={p.title} />
            <InfoField label="Address" value={[p.homeAddress, p.city, p.state, p.zip].filter(Boolean).join(', ')} />
            <InfoField label="Phone"   value={p.phone} />
            <InfoField label="DL #"    value={p.dlEncrypted ? '(encrypted)' : p.dlNumber} />
            <InfoField label="DL State" value={p.dlState} />
            <InfoField label="SSN"     value={p.ssnEncrypted ? '***-**-****' : (p.ssn ? '***-**-****' : null)} />
            <InfoField label="DOB"     value={p.dob} />
          </Section>
        ))}
      </fieldset>

      {/* ── Section 3: Tank, Bank, References ── */}
      <fieldset className="form-section">
        <legend>Tank Information</legend>
        <Section>
          <InfoField label="# Tanks"         value={fd.numTanks} />
          <InfoField label="Tank Sizes"       value={fd.tankSizes} />
          <InfoField label="Tanks Locked"     value={fd.tanksLocked} />
          <InfoField label="Monthly Volume"   value={fd.monthlyVolume ? `${fd.monthlyVolume} gal` : null} />
        </Section>
      </fieldset>

      <fieldset className="form-section">
        <legend>Bank Information</legend>
        <Section>
          <InfoField label="Bank Name"       value={fd.bankName} />
          <InfoField label="Branch Address"  value={fd.bankBranchAddress} />
          <InfoField label="Bank Officer"    value={fd.bankOfficer} />
          <InfoField label="Bank Phone"      value={fd.bankPhone} />
          <InfoField label="Bank Email"      value={fd.bankEmail} />
          <InfoField label="Account Type"    value={fd.accountType} />
          <InfoField label="Routing Number"  value={fd.routingNumber ? `****${String(fd.routingNumber).slice(-4)}` : null} />
          <InfoField label="Account Number"  value={fd.accountNumber ? `****${String(fd.accountNumber).slice(-4)}` : null} />
        </Section>
      </fieldset>

      <fieldset className="form-section">
        <legend>References</legend>
        <Section title="Trade Reference">
          <InfoField label="Business" value={fd.tradeRefBusiness} />
          <InfoField label="Contact"  value={fd.tradeRefContact} />
          <InfoField label="Phone"    value={fd.tradeRefPhone} />
          <InfoField label="Email"    value={fd.tradeRefEmail} />
        </Section>
        <Section title="Fuel Supplier">
          <InfoField label="Name"    value={fd.fuelSupplierName} />
          <InfoField label="Contact" value={fd.fuelSupplierContact} />
          <InfoField label="Phone"   value={fd.fuelSupplierPhone} />
          <InfoField label="Email"   value={fd.fuelSupplierEmail} />
        </Section>
        <Section title="Personal Reference">
          <InfoField label="Name"         value={fd.personalRefName} />
          <InfoField label="Relationship" value={fd.personalRefRelationship} />
          <InfoField label="Phone"        value={fd.personalRefPhone} />
          <InfoField label="Email"        value={fd.personalRefEmail} />
        </Section>
      </fieldset>

      {/* ── Section 4: Agreements ── */}
      <fieldset className="form-section">
        <legend>Agreements &amp; Acknowledgments</legend>
        <Section>
          <InfoField label="Bank Info Release Auth"    value={fd.infoReleaseAck ? 'Yes' : 'No'} />
          <InfoField label="Credit Report Consent"     value={fd.creditReportConsent ? 'Yes' : 'No'} />
          <InfoField label="Agreed Terms"              value={fd.agreeTerms ? 'Yes' : 'No'} />
          <InfoField label="EFT Authorization"         value={fd.eftAck ? 'Yes' : 'No'} />
          <InfoField label="Voided Check Uploaded"     value={fd.voidedCheckUrl ? 'Yes' : 'No'} />
        </Section>
        {principals.filter(p => p.name).length > 0 && (
          <Section title="Personal Guaranty">
            {principals.map((p, i) => !p.name ? null : (
              <InfoField key={i} label={p.name} value={p.acknowledged ? 'Acknowledged' : 'Not acknowledged'} />
            ))}
          </Section>
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

export default FuelsReview
