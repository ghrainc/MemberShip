import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import {
  InfoField, InfoRow, ReviewSection, ReviewHeader, ReviewerBanner, ReviewDecision,
} from './ReviewKit'

function FuelsReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getFuelsApplication, updateFuelsStatus } = useContext(AuthContext)

  const [app,      setApp]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updateErr, setUpdateErr] = useState(null)

  const load = () => {
    setLoading(true)
    getFuelsApplication(id)
      .then(data => setApp(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDecision = async (status, notes) => {
    setUpdateErr(null)
    setUpdating(true)
    try {
      const result = await updateFuelsStatus(id, status, notes)
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
        <ReviewHeader id={id} type="fuels" status="unknown" onBack={() => navigate('/employee')} />
        <p style={{ color: 'var(--ghra-red)', marginTop: 16 }}>Application not found.</p>
      </div>
    )
  }

  const fd = app.formData || {}
  const principals = Array.isArray(fd.principals) ? fd.principals : []

  return (
    <div className="membership-container view-app-mode">
      <ReviewHeader
        id={app.Id}
        type="fuels"
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
        <legend>Applicant / Business Information</legend>

        <ReviewSection>
          <InfoRow>
            <InfoField label="GHRA #"             value={fd.ghraNumber} />
            <InfoField label="Business Type"      value={fd.businessType} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Business / Entity Name" value={fd.businessEntityName} />
            <InfoField label="DBA"                value={fd.dba} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Billing Address"
              value={[fd.billingAddress, fd.billingCity, fd.billingState, fd.billingZip].filter(Boolean).join(', ')} />
            <InfoField label="Delivery Address"
              value={[fd.deliveryAddress, fd.deliveryCity, fd.deliveryState, fd.deliveryZip].filter(Boolean).join(', ')} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Property Owned by Applicant" value={fd.propertyOwnedByApplicant} />
            {fd.propertyOwnedByApplicant === 'Yes'
              ? <InfoField label="Ownership Entity"    value={fd.ownershipEntityName} />
              : <InfoField label="Lease Expiry Year"   value={fd.leasedExpirationYear} />}
          </InfoRow>
          {fd.propertyOwnedByApplicant === 'No' && (
            <InfoRow>
              <InfoField label="Property Owner Info" value={fd.propertyOwnerInfo} />
            </InfoRow>
          )}
          <InfoRow>
            <InfoField label="Business Phone"   value={fd.businessPhone} />
            <InfoField label="Business Fax"     value={fd.businessFax} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Business Email"   value={fd.businessEmail} />
            <InfoField label="Year Established" value={fd.yearEstablished} />
          </InfoRow>
          <InfoRow>
            <InfoField label="EIN"              value={fd.ein} />
            <InfoField label="Credit Requested" value={fd.creditRequested ? `$${fd.creditRequested}` : null} />
          </InfoRow>
        </ReviewSection>

        <ReviewSection title="Delivery Certificate">
          <InfoRow>
            <InfoField label="TECQ Number"     value={fd.tecqNumber} />
            <InfoField label="Facility Number" value={fd.facilityNumber} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Cert Expiration" value={fd.certExpirationDate} />
          </InfoRow>
        </ReviewSection>

        <ReviewSection title="Primary Fuel Contact">
          <InfoRow>
            <InfoField label="Name"  value={fd.primaryFuelContactName} />
            <InfoField label="Title" value={fd.primaryFuelContactTitle} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone" value={fd.primaryFuelContactPhone} />
            <InfoField label="Email" value={fd.primaryFuelContactEmail} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Fax"   value={fd.primaryFuelContactFax} />
          </InfoRow>
        </ReviewSection>

        <ReviewSection title="AP Contact">
          <InfoRow>
            <InfoField label="Name"  value={fd.apContactName} />
            <InfoField label="Title" value={fd.apContactTitle} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone" value={fd.apContactPhone} />
            <InfoField label="Email" value={fd.apContactEmail} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Fax"   value={fd.apContactFax} />
          </InfoRow>
        </ReviewSection>
      </fieldset>

      {/* ── Section 2: Principals ── */}
      <fieldset className="form-section">
        <legend>Principal Officers / Owners</legend>
        {principals.map((p, i) => (
          <ReviewSection key={i} title={`Principal ${i + 1}`}>
            <InfoRow>
              <InfoField label="Name"  value={p.name} />
              <InfoField label="Title" value={p.title} />
            </InfoRow>
            <InfoRow>
              <InfoField label="Address"
                value={[p.homeAddress, p.city, p.state, p.zip].filter(Boolean).join(', ')} />
              <InfoField label="Phone" value={p.phone} />
            </InfoRow>
            <InfoRow>
              <InfoField label="DL #"    value={p.dlEncrypted ? '(encrypted)' : p.dlNumber} />
              <InfoField label="DL State" value={p.dlState} />
            </InfoRow>
            <InfoRow>
              <InfoField label="DOB" value={p.dob} />
              <InfoField label="SSN" value={p.ssnEncrypted || p.ssn ? '***-**-****' : null} />
            </InfoRow>
          </ReviewSection>
        ))}
      </fieldset>

      {/* ── Section 3: Tank, Bank, References ── */}
      <fieldset className="form-section">
        <legend>Tank Information</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="# Tanks"       value={fd.numTanks} />
            <InfoField label="Tank Sizes"    value={fd.tankSizes} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Tanks Locked"  value={fd.tanksLocked} />
            <InfoField label="Monthly Volume" value={fd.monthlyVolume ? `${fd.monthlyVolume} gal` : null} />
          </InfoRow>
        </ReviewSection>
      </fieldset>

      <fieldset className="form-section">
        <legend>Bank Information</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Bank Name"      value={fd.bankName} />
            <InfoField label="Branch Address" value={fd.bankBranchAddress} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Bank Officer"   value={fd.bankOfficer} />
            <InfoField label="Bank Phone"     value={fd.bankPhone} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Bank Email"     value={fd.bankEmail} />
            <InfoField label="Account Type"   value={fd.accountType} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Routing Number"
              value={fd.routingNumber ? `****${String(fd.routingNumber).slice(-4)}` : null} />
            <InfoField label="Account Number"
              value={fd.accountNumber ? `****${String(fd.accountNumber).slice(-4)}` : null} />
          </InfoRow>
        </ReviewSection>
      </fieldset>

      <fieldset className="form-section">
        <legend>References</legend>
        <ReviewSection title="Trade Reference">
          <InfoRow>
            <InfoField label="Business" value={fd.tradeRefBusiness} />
            <InfoField label="Contact"  value={fd.tradeRefContact} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone"    value={fd.tradeRefPhone} />
            <InfoField label="Email"    value={fd.tradeRefEmail} />
          </InfoRow>
        </ReviewSection>
        <ReviewSection title="Fuel Supplier">
          <InfoRow>
            <InfoField label="Name"    value={fd.fuelSupplierName} />
            <InfoField label="Contact" value={fd.fuelSupplierContact} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone"   value={fd.fuelSupplierPhone} />
            <InfoField label="Email"   value={fd.fuelSupplierEmail} />
          </InfoRow>
        </ReviewSection>
        <ReviewSection title="Personal Reference">
          <InfoRow>
            <InfoField label="Name"         value={fd.personalRefName} />
            <InfoField label="Relationship" value={fd.personalRefRelationship} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone"        value={fd.personalRefPhone} />
            <InfoField label="Email"        value={fd.personalRefEmail} />
          </InfoRow>
        </ReviewSection>
      </fieldset>

      {/* ── Section 4: Agreements ── */}
      <fieldset className="form-section">
        <legend>Agreements &amp; Acknowledgments</legend>
        <ReviewSection>
          <InfoRow>
            <InfoField label="Bank Info Release Auth" value={fd.infoReleaseAck ? 'Yes' : 'No'} />
            <InfoField label="Credit Report Consent"  value={fd.creditReportConsent ? 'Yes' : 'No'} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Agreed Terms"       value={fd.agreeTerms ? 'Yes' : 'No'} />
            <InfoField label="EFT Authorization"  value={fd.eftAck ? 'Yes' : 'No'} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Voided Check Uploaded" value={fd.voidedCheckUrl ? 'Yes' : 'No'} />
          </InfoRow>
        </ReviewSection>
        {principals.filter(p => p.name).length > 0 && (
          <ReviewSection title="Personal Guaranty">
            {principals.map((p, i) => !p.name ? null : (
              <InfoRow key={i}>
                <InfoField label={p.name} value={p.acknowledged ? 'Acknowledged' : 'Not acknowledged'} />
              </InfoRow>
            ))}
          </ReviewSection>
        )}
      </fieldset>

      {/* ── Review Decision (submitted only) ── */}
      {app.Status === 'submitted' && (
        <ReviewDecision onSubmit={handleDecision} loading={updating} error={updateErr} />
      )}
    </div>
  )
}

export default FuelsReview
