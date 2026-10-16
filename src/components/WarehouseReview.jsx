import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import {
  InfoField, InfoRow, ReviewSection, ReviewHeader, ReviewerBanner, ReviewDecision,
} from './ReviewKit'

function WarehouseReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getWarehouseApplication, updateWarehouseStatus } = useContext(AuthContext)

  const [app,       setApp]      = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [updating,  setUpdating] = useState(false)
  const [updateErr, setUpdateErr] = useState(null)

  const load = () => {
    setLoading(true)
    getWarehouseApplication(id)
      .then(data => setApp(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDecision = async (status, notes) => {
    setUpdateErr(null)
    setUpdating(true)
    try {
      const result = await updateWarehouseStatus(id, status, notes)
      if (!result.success) { setUpdateErr(result.error || 'Update failed'); return }
      load()
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="membership-container view-app-mode">
        <div className="empty-state"><p>Loading application…</p></div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="membership-container view-app-mode">
        <ReviewHeader id={id} type="warehouse" status="unknown" onBack={() => navigate('/employee')} />
        <p style={{ color: 'var(--ghra-red)', marginTop: 16 }}>Application not found.</p>
      </div>
    )
  }

  const fd = app.formData || {}

  return (
    <div className="membership-container view-app-mode">
      <ReviewHeader
        id={app.Id}
        type="warehouse"
        status={app.Status}
        userEmail={app.UserEmail}
        submittedAt={app.SubmittedAt}
        onBack={() => navigate('/employee')}
      />

      <ReviewerBanner
        status={app.Status}
        notes={app.Notes}
        reviewedBy={app.ReviewedBy}
        reviewedAt={app.ReviewedAt}
      />

      {/* ── Section 1: Business Information ── */}
      <fieldset className="form-section">
        <legend>Business Information</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Legal Name" value={fd.legalName} />
            <InfoField label="DBA Name"   value={fd.dbaName} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Entity Type"
              value={fd.entityType === 'other' ? fd.entityTypeOther : fd.entityType} />
            <InfoField label="EIN"          value={fd.ein} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Business Started" value={fd.businessStarted} />
            <InfoField label="# Locations"      value={fd.numLocations} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Business Phone" value={fd.businessPhone} />
            <InfoField label="Business Email" value={fd.businessEmail} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Primary Contact" value={fd.primaryContact} />
            <InfoField label="Store Address"
              value={[fd.storeAddress, fd.storeCity, fd.storeState, fd.storeZip].filter(Boolean).join(', ')} />
          </InfoRow>
          {!fd.mailSame && (
            <InfoRow>
              <InfoField label="Mailing Address"
                value={[fd.mailingAddress, fd.mailingCity, fd.mailingState, fd.mailingZip].filter(Boolean).join(', ')} />
            </InfoRow>
          )}
        </ReviewSection>
      </fieldset>

      {/* ── Section 2: Owners / Officers ── */}
      <fieldset className="form-section">
        <legend>Owners / Officers</legend>
        {(fd.owners || []).map((o, i) => (
          <ReviewSection key={i} title={`Owner ${i + 1}`}>
            <InfoRow>
              <InfoField label="Name"       value={o.ownerName} />
              <InfoField label="Title"      value={o.ownerTitle} />
            </InfoRow>
            <InfoRow>
              <InfoField label="Ownership %" value={o.ownerPct ? `${o.ownerPct}%` : null} />
              <InfoField label="Phone"        value={o.ownerPhone} />
            </InfoRow>
            <InfoRow>
              <InfoField label="Email"    value={o.ownerEmail} />
              <InfoField label="Address"  value={o.ownerAddr} />
            </InfoRow>
            <InfoRow>
              <InfoField label="DL #"     value={o.ownerDl} />
            </InfoRow>
          </ReviewSection>
        ))}
      </fieldset>

      {/* ── Section 3: Permits ── */}
      <fieldset className="form-section">
        <legend>Permits</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Sales Tax Permit No." value={fd.salesTaxPermitNo} />
            <InfoField label="Tobacco Products"     value={fd.hasTobacco ? 'Yes' : 'No'} />
          </InfoRow>
          {fd.hasTobacco && (
            <InfoRow>
              <InfoField label="Tobacco Permit No."    value={fd.tobaccoPermitNo} />
              <InfoField label="Tobacco Permit Expiry" value={fd.tobaccoPermitExpiry} />
            </InfoRow>
          )}
        </ReviewSection>
      </fieldset>

      {/* ── Section 4: Purchasing ── */}
      <fieldset className="form-section">
        <legend>Purchasing</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Monthly Volume" value={fd.purchaseVolume ? `$${fd.purchaseVolume}` : null} />
            <InfoField label="Start Date"     value={fd.startDate} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Categories" value={(fd.categories || []).join(', ') || null} />
          </InfoRow>
        </ReviewSection>
      </fieldset>

      {/* ── Section 5: Resale Certificate ── */}
      <fieldset className="form-section">
        <legend>Resale Certificate</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Business Name" value={fd.rcName} />
            <InfoField label="Permit No."    value={fd.rcPermit} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone"    value={fd.rcPhone} />
            <InfoField label="Items"    value={fd.rcItems} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Activity"     value={fd.rcActivity} />
            <InfoField label="Acknowledged" value={fd.rcAck ? 'Yes' : 'No'} />
          </InfoRow>
        </ReviewSection>
      </fieldset>

      {/* ── Section 6: Signature ── */}
      <fieldset className="form-section">
        <legend>Signature</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Signer"
              value={[fd.signerName, fd.signerTitle].filter(Boolean).join(', ')} />
            <InfoField label="Agreed Terms" value={fd.agreeTerms ? 'Yes' : 'No'} />
          </InfoRow>
          <InfoRow>
            <InfoField label="E-Sign" value={fd.esign ? 'Yes' : 'No'} />
          </InfoRow>
        </ReviewSection>
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

      {/* ── Review Decision (submitted only) ── */}
      {app.Status === 'submitted' && (
        <ReviewDecision onSubmit={handleDecision} loading={updating} error={updateErr} />
      )}
    </div>
  )
}

export default WarehouseReview
