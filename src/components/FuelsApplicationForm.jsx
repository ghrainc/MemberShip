import { useContext, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import '../styles/FuelsApplicationForm.css'
import '../styles/MembershipForm.css'
import '../styles/ProgressIndicator.css'

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Business Info' },
  { id: 2, title: 'Principals' },
  { id: 3, title: 'Tank & Bank' },
  { id: 4, title: 'Agreements' },
]

const BUSINESS_TYPES = [
  'Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Other LP/LLP',
]

const BLANK_PRINCIPAL = {
  name: '', title: '', homeAddress: '', city: '', state: '', zip: '', phone: '',
  dlNumber: '', dlState: '', ssn: '', dob: '', dlFileUrl: '',
  acknowledged: false,
}

function blankForm() {
  return {
    // Section 1
    ghraNumber: '', businessType: '', businessEntityName: '', dba: '',
    billingAddress: '', billingCity: '', billingState: 'TX', billingZip: '',
    deliveryAddress: '', deliveryCity: '', deliveryState: 'TX', deliveryZip: '',
    propertyOwnedByApplicant: '', ownershipEntityName: '', leasedExpirationYear: '', propertyOwnerInfo: '',
    businessPhone: '', businessFax: '', businessEmail: '',
    yearEstablished: '', ein: '', creditRequested: '',
    tecqNumber: '', facilityNumber: '', certExpirationDate: '', deliveryCertUrl: '',
    primaryFuelContactName: '', primaryFuelContactTitle: '', primaryFuelContactPhone: '',
    primaryFuelContactEmail: '', primaryFuelContactFax: '',
    apContactName: '', apContactTitle: '', apContactPhone: '', apContactEmail: '', apContactFax: '',
    // Section 2
    principals: [{ ...BLANK_PRINCIPAL }],
    // Section 3
    numTanks: '', tankSizes: '', tanksLocked: '', monthlyVolume: '',
    bankName: '', bankBranchAddress: '', bankOfficer: '', bankPhone: '', bankEmail: '',
    accountType: '', accountNumber: '', routingNumber: '',
    tradeRefBusiness: '', tradeRefContact: '', tradeRefPhone: '', tradeRefEmail: '',
    fuelSupplierName: '', fuelSupplierContact: '', fuelSupplierPhone: '', fuelSupplierEmail: '',
    personalRefName: '', personalRefRelationship: '', personalRefPhone: '', personalRefEmail: '',
    // Section 4
    infoReleaseAck: false, creditReportConsent: false, agreeTerms: false, eftAck: false,
    voidedCheckUrl: '',
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateStep(step, fd) {
  const req = (val) => !val || !String(val).trim()
  switch (step) {
    case 1: {
      const missing = []
      if (req(fd.businessEntityName))  missing.push('Business entity name')
      if (req(fd.billingAddress))      missing.push('Billing address')
      if (req(fd.billingCity))         missing.push('Billing city')
      if (req(fd.billingState))        missing.push('Billing state')
      if (req(fd.billingZip))          missing.push('Billing ZIP')
      if (req(fd.deliveryAddress))     missing.push('Delivery address')
      if (req(fd.deliveryCity))        missing.push('Delivery city')
      if (req(fd.deliveryState))       missing.push('Delivery state')
      if (req(fd.deliveryZip))         missing.push('Delivery ZIP')
      if (req(fd.businessPhone))       missing.push('Business phone')
      if (req(fd.businessEmail))       missing.push('Business email')
      return missing.length ? `Required: ${missing.join(', ')}` : null
    }
    case 2: {
      const bad = fd.principals.findIndex(p => req(p.name) || req(p.title))
      return bad !== -1 ? `Principal ${bad + 1}: name and title are required` : null
    }
    case 3: {
      const missing = []
      if (req(fd.bankName))      missing.push('Bank name')
      if (req(fd.routingNumber)) missing.push('Routing number')
      if (req(fd.accountNumber)) missing.push('Account number')
      return missing.length ? `Required: ${missing.join(', ')}` : null
    }
    case 4: {
      if (!fd.infoReleaseAck)      return 'You must authorize the bank information release'
      if (!fd.creditReportConsent) return 'You must consent to credit report authorization'
      if (!fd.agreeTerms)          return 'You must agree to the terms'
      if (!fd.eftAck)              return 'You must authorize EFT debits'
      if (!fd.voidedCheckUrl)      return 'A voided check upload is required for EFT authorization'
      const unacknowledged = fd.principals.findIndex((p) => p.name && !p.acknowledged)
      if (unacknowledged !== -1) return `Principal ${unacknowledged + 1} must personally acknowledge the guaranty`
      return null
    }
    default: return null
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, required, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{ color: 'var(--ghra-red)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--ghra-muted)', marginTop: 2, display: 'block' }}>{hint}</span>}
    </div>
  )
}

function UploadField({ label, required, fieldKey, currentUrl, onUpload }) {
  const [status, setStatus] = useState(null) // null | 'uploading' | 'ok' | 'error'
  const [msg, setMsg] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setStatus('uploading')
    setMsg('Uploading...')
    const result = await onUpload(fieldKey, file)
    if (result.success) {
      setStatus('ok')
      setMsg('Uploaded')
    } else {
      setStatus('error')
      setMsg(result.error || 'Upload failed')
    }
    e.target.value = ''
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{ color: 'var(--ghra-red)', marginLeft: 3 }}>*</span>}
      </label>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="form-input"
        style={{ padding: '6px 10px' }} />
      {currentUrl && status === null && (
        <span className="fuels-upload-status ok">File on record</span>
      )}
      {status && (
        <span className={`fuels-upload-status${status === 'ok' ? ' ok' : status === 'error' ? ' error' : ''}`}>
          {msg}
        </span>
      )}
    </div>
  )
}

// ── SSN / DL masked input ─────────────────────────────────────────────────────

function SensitiveField({ label, value, onChange, isEncrypted, placeholder }) {
  const [editing, setEditing] = useState(false)
  const masked = '***-**-****'

  if (isEncrypted && !editing) {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="form-input" readOnly value={masked} style={{ flex: 1 }} />
          <button type="button" className="fuels-btn fuels-btn-secondary"
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => { onChange(''); setEditing(true) }}>
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  )
}

// ── Step components ────────────────────────────────────────────────────────────

function Section1({ fd, set }) {
  return (
    <div className="fuels-section-body">
      <p className="fuels-section-title">Applicant / Business Information</p>

      <div className="fuels-row">
        <Field label="GHRA #">
          <input className="form-input" value={fd.ghraNumber}
            onChange={e => set('ghraNumber', e.target.value)} />
        </Field>
        <Field label="Business Type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            {BUSINESS_TYPES.map(bt => (
              <label key={bt} className="checkbox-label">
                <input type="radio" name="businessType" value={bt}
                  checked={fd.businessType === bt}
                  onChange={() => set('businessType', bt)} />
                {bt}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="fuels-row">
        <Field label="Business / Entity Name" required>
          <input className="form-input" value={fd.businessEntityName}
            onChange={e => set('businessEntityName', e.target.value)} />
        </Field>
        <Field label="DBA">
          <input className="form-input" value={fd.dba}
            onChange={e => set('dba', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Billing Address</p>
      <div className="fuels-row">
        <Field label="Address" required>
          <input className="form-input" value={fd.billingAddress}
            onChange={e => set('billingAddress', e.target.value)} />
        </Field>
        <Field label="City" required>
          <input className="form-input" value={fd.billingCity}
            onChange={e => set('billingCity', e.target.value)} />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="State" required>
          <input className="form-input" value={fd.billingState}
            onChange={e => set('billingState', e.target.value)} />
        </Field>
        <Field label="ZIP" required>
          <input className="form-input" value={fd.billingZip}
            onChange={e => set('billingZip', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Delivery Address</p>
      <div className="fuels-row">
        <Field label="Address" required>
          <input className="form-input" value={fd.deliveryAddress}
            onChange={e => set('deliveryAddress', e.target.value)} />
        </Field>
        <Field label="City" required>
          <input className="form-input" value={fd.deliveryCity}
            onChange={e => set('deliveryCity', e.target.value)} />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="State" required>
          <input className="form-input" value={fd.deliveryState}
            onChange={e => set('deliveryState', e.target.value)} />
        </Field>
        <Field label="ZIP" required>
          <input className="form-input" value={fd.deliveryZip}
            onChange={e => set('deliveryZip', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Property</p>
      <Field label="Property owned by applicant?">
        <div style={{ display: 'flex', gap: 24 }}>
          {['Yes', 'No'].map(v => (
            <label key={v} className="checkbox-label">
              <input type="radio" name="propertyOwned" value={v}
                checked={fd.propertyOwnedByApplicant === v}
                onChange={() => set('propertyOwnedByApplicant', v)} />
              {v}
            </label>
          ))}
        </div>
      </Field>
      {fd.propertyOwnedByApplicant === 'Yes' && (
        <Field label="Ownership Entity Name">
          <input className="form-input" value={fd.ownershipEntityName}
            onChange={e => set('ownershipEntityName', e.target.value)} />
        </Field>
      )}
      {fd.propertyOwnedByApplicant === 'No' && (
        <>
          <div className="fuels-row">
            <Field label="Lease Expiration Year">
              <input className="form-input" value={fd.leasedExpirationYear}
                onChange={e => set('leasedExpirationYear', e.target.value)} />
            </Field>
            <Field label="Property Owner Info">
              <input className="form-input" value={fd.propertyOwnerInfo}
                onChange={e => set('propertyOwnerInfo', e.target.value)} />
            </Field>
          </div>
        </>
      )}

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Contact & Business Details</p>
      <div className="fuels-row">
        <Field label="Business Phone" required>
          <input className="form-input" type="tel" value={fd.businessPhone}
            onChange={e => set('businessPhone', e.target.value)} />
        </Field>
        <Field label="Business Fax">
          <input className="form-input" type="tel" value={fd.businessFax}
            onChange={e => set('businessFax', e.target.value)} />
        </Field>
        <Field label="Business Email" required>
          <input className="form-input" type="email" value={fd.businessEmail}
            onChange={e => set('businessEmail', e.target.value)} />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="Year Established">
          <input className="form-input" value={fd.yearEstablished}
            onChange={e => set('yearEstablished', e.target.value)} />
        </Field>
        <Field label="EIN">
          <input className="form-input" value={fd.ein}
            onChange={e => set('ein', e.target.value)} />
        </Field>
        <Field label="Credit Requested ($)">
          <input className="form-input" value={fd.creditRequested}
            onChange={e => set('creditRequested', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Delivery Certificate</p>
      <div className="fuels-row">
        <Field label="TECQ Number">
          <input className="form-input" value={fd.tecqNumber}
            onChange={e => set('tecqNumber', e.target.value)} />
        </Field>
        <Field label="Facility Number">
          <input className="form-input" value={fd.facilityNumber}
            onChange={e => set('facilityNumber', e.target.value)} />
        </Field>
        <Field label="Certificate Expiration Date">
          <input className="form-input" type="date" value={fd.certExpirationDate}
            onChange={e => set('certExpirationDate', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Primary Fuel Contact</p>
      <div className="fuels-row">
        <Field label="Name">
          <input className="form-input" value={fd.primaryFuelContactName}
            onChange={e => set('primaryFuelContactName', e.target.value)} />
        </Field>
        <Field label="Title">
          <input className="form-input" value={fd.primaryFuelContactTitle}
            onChange={e => set('primaryFuelContactTitle', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="form-input" type="tel" value={fd.primaryFuelContactPhone}
            onChange={e => set('primaryFuelContactPhone', e.target.value)} />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="Email">
          <input className="form-input" type="email" value={fd.primaryFuelContactEmail}
            onChange={e => set('primaryFuelContactEmail', e.target.value)} />
        </Field>
        <Field label="Fax">
          <input className="form-input" type="tel" value={fd.primaryFuelContactFax}
            onChange={e => set('primaryFuelContactFax', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>AP Contact</p>
      <div className="fuels-row">
        <Field label="Name">
          <input className="form-input" value={fd.apContactName}
            onChange={e => set('apContactName', e.target.value)} />
        </Field>
        <Field label="Title">
          <input className="form-input" value={fd.apContactTitle}
            onChange={e => set('apContactTitle', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="form-input" type="tel" value={fd.apContactPhone}
            onChange={e => set('apContactPhone', e.target.value)} />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="Email">
          <input className="form-input" type="email" value={fd.apContactEmail}
            onChange={e => set('apContactEmail', e.target.value)} />
        </Field>
        <Field label="Fax">
          <input className="form-input" type="tel" value={fd.apContactFax}
            onChange={e => set('apContactFax', e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

function Section2({ fd, set, handleUpload }) {
  const updatePrincipal = (idx, field, val) => {
    const updated = fd.principals.map((p, i) => i === idx ? { ...p, [field]: val } : p)
    set('principals', updated)
  }

  const addPrincipal = () => {
    if (fd.principals.length >= 3) return
    set('principals', [...fd.principals, { ...BLANK_PRINCIPAL }])
  }

  const removePrincipal = (idx) => {
    if (fd.principals.length <= 1) return
    set('principals', fd.principals.filter((_, i) => i !== idx))
  }

  return (
    <div className="fuels-section-body">
      <p className="fuels-section-title">Principal Officers / Owners</p>
      <p style={{ fontSize: 13, color: 'var(--ghra-muted)', marginBottom: 16 }}>
        Copy of current driver's license required for each officer.
      </p>

      {fd.principals.map((p, idx) => (
        <div key={idx} className="fuels-principal-card">
          <div className="fuels-principal-header">
            <span className="fuels-principal-label">Principal {idx + 1}</span>
            {fd.principals.length > 1 && (
              <button type="button" className="fuels-btn fuels-btn-danger"
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={() => removePrincipal(idx)}>
                Remove
              </button>
            )}
          </div>

          <div className="fuels-row">
            <Field label="Name" required>
              <input className="form-input" value={p.name}
                onChange={e => updatePrincipal(idx, 'name', e.target.value)} />
            </Field>
            <Field label="Title" required>
              <input className="form-input" value={p.title}
                onChange={e => updatePrincipal(idx, 'title', e.target.value)} />
            </Field>
          </div>
          <div className="fuels-row">
            <Field label="Home Address">
              <input className="form-input" value={p.homeAddress}
                onChange={e => updatePrincipal(idx, 'homeAddress', e.target.value)} />
            </Field>
            <Field label="City">
              <input className="form-input" value={p.city}
                onChange={e => updatePrincipal(idx, 'city', e.target.value)} />
            </Field>
          </div>
          <div className="fuels-row">
            <Field label="State">
              <input className="form-input" value={p.state}
                onChange={e => updatePrincipal(idx, 'state', e.target.value)} />
            </Field>
            <Field label="ZIP">
              <input className="form-input" value={p.zip}
                onChange={e => updatePrincipal(idx, 'zip', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="form-input" type="tel" value={p.phone}
                onChange={e => updatePrincipal(idx, 'phone', e.target.value)} />
            </Field>
          </div>
          <div className="fuels-row">
            <SensitiveField
              label="Driver's License #"
              value={p.dlNumber}
              onChange={val => updatePrincipal(idx, 'dlNumber', val)}
              isEncrypted={!!p.dlEncrypted}
              placeholder="DL number"
            />
            <Field label="DL State">
              <input className="form-input" value={p.dlState}
                onChange={e => updatePrincipal(idx, 'dlState', e.target.value)} maxLength={2} />
            </Field>
          </div>
          <div className="fuels-row">
            <SensitiveField
              label="SSN"
              value={p.ssn}
              onChange={val => updatePrincipal(idx, 'ssn', val)}
              isEncrypted={!!p.ssnEncrypted || (p.ssn && p.ssn.startsWith('*'))}
              placeholder="###-##-####"
            />
            <Field label="Date of Birth">
              <input className="form-input" type="date" value={p.dob}
                onChange={e => updatePrincipal(idx, 'dob', e.target.value)} />
            </Field>
          </div>

          <UploadField
            label="Driver's License Copy"
            fieldKey={`principal_dl_${idx}`}
            currentUrl={p.dlFileUrl}
            onUpload={(key, file) => handleUpload(key, file, (url) =>
              updatePrincipal(idx, 'dlFileUrl', url)
            )}
          />
        </div>
      ))}

      {fd.principals.length < 3 && (
        <button type="button" className="fuels-btn fuels-btn-secondary" onClick={addPrincipal}>
          + Add Principal
        </button>
      )}
    </div>
  )
}

function Section3({ fd, set }) {
  return (
    <div className="fuels-section-body">
      <p className="fuels-section-title">Tank Information</p>
      <div className="fuels-row">
        <Field label="Number of Tanks">
          <input className="form-input" type="number" value={fd.numTanks}
            onChange={e => set('numTanks', e.target.value)} />
        </Field>
        <Field label="Tank Sizes">
          <input className="form-input" value={fd.tankSizes}
            onChange={e => set('tankSizes', e.target.value)} placeholder="e.g. 10,000 gal" />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="Tanks Locked?">
          <div style={{ display: 'flex', gap: 24 }}>
            {['Yes', 'No'].map(v => (
              <label key={v} className="checkbox-label">
                <input type="radio" name="tanksLocked" value={v}
                  checked={fd.tanksLocked === v}
                  onChange={() => set('tanksLocked', v)} />
                {v}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Estimated Monthly Volume (gallons)">
          <input className="form-input" value={fd.monthlyVolume}
            onChange={e => set('monthlyVolume', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Bank Information</p>
      <div className="fuels-row">
        <Field label="Bank Name" required>
          <input className="form-input" value={fd.bankName}
            onChange={e => set('bankName', e.target.value)} />
        </Field>
        <Field label="Branch Address">
          <input className="form-input" value={fd.bankBranchAddress}
            onChange={e => set('bankBranchAddress', e.target.value)} />
        </Field>
      </div>
      <div className="fuels-row">
        <Field label="Bank Officer">
          <input className="form-input" value={fd.bankOfficer}
            onChange={e => set('bankOfficer', e.target.value)} />
        </Field>
        <Field label="Bank Phone">
          <input className="form-input" type="tel" value={fd.bankPhone}
            onChange={e => set('bankPhone', e.target.value)} />
        </Field>
        <Field label="Bank Email">
          <input className="form-input" type="email" value={fd.bankEmail}
            onChange={e => set('bankEmail', e.target.value)} />
        </Field>
      </div>
      <Field label="Account Type">
        <div style={{ display: 'flex', gap: 24 }}>
          {['Checking', 'Savings'].map(v => (
            <label key={v} className="checkbox-label">
              <input type="radio" name="accountType" value={v}
                checked={fd.accountType === v}
                onChange={() => set('accountType', v)} />
              {v}
            </label>
          ))}
        </div>
      </Field>
      <div className="fuels-row">
        <Field label="Routing Number" required>
          <input className="form-input" value={fd.routingNumber} autoComplete="off"
            onChange={e => set('routingNumber', e.target.value)} />
        </Field>
        <Field label="Account Number" required>
          <input className="form-input" value={fd.accountNumber} autoComplete="off"
            onChange={e => set('accountNumber', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Trade Reference</p>
      <div className="fuels-row">
        <Field label="Business Name">
          <input className="form-input" value={fd.tradeRefBusiness}
            onChange={e => set('tradeRefBusiness', e.target.value)} />
        </Field>
        <Field label="Contact">
          <input className="form-input" value={fd.tradeRefContact}
            onChange={e => set('tradeRefContact', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="form-input" type="tel" value={fd.tradeRefPhone}
            onChange={e => set('tradeRefPhone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="form-input" type="email" value={fd.tradeRefEmail}
            onChange={e => set('tradeRefEmail', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Fuel Supplier</p>
      <div className="fuels-row">
        <Field label="Supplier Name">
          <input className="form-input" value={fd.fuelSupplierName}
            onChange={e => set('fuelSupplierName', e.target.value)} />
        </Field>
        <Field label="Contact">
          <input className="form-input" value={fd.fuelSupplierContact}
            onChange={e => set('fuelSupplierContact', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="form-input" type="tel" value={fd.fuelSupplierPhone}
            onChange={e => set('fuelSupplierPhone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="form-input" type="email" value={fd.fuelSupplierEmail}
            onChange={e => set('fuelSupplierEmail', e.target.value)} />
        </Field>
      </div>

      <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 20 }}>Personal Reference</p>
      <div className="fuels-row">
        <Field label="Name">
          <input className="form-input" value={fd.personalRefName}
            onChange={e => set('personalRefName', e.target.value)} />
        </Field>
        <Field label="Relationship">
          <input className="form-input" value={fd.personalRefRelationship}
            onChange={e => set('personalRefRelationship', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="form-input" type="tel" value={fd.personalRefPhone}
            onChange={e => set('personalRefPhone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="form-input" type="email" value={fd.personalRefEmail}
            onChange={e => set('personalRefEmail', e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

function Section4({ fd, set, draftId, handleUpload }) {
  const updatePrincipalAck = (idx, val) => {
    const updated = fd.principals.map((p, i) => i === idx ? { ...p, acknowledged: val } : p)
    set('principals', updated)
  }

  return (
    <div className="fuels-section-body">
      <p className="fuels-section-title">Agreements &amp; Acknowledgments</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.infoReleaseAck}
            onChange={e => set('infoReleaseAck', e.target.checked)} />
          I authorize the bank named above to release all information requested by GHRA FUELS.
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.creditReportConsent}
            onChange={e => set('creditReportConsent', e.target.checked)} />
          I consent to GHRA FUELS obtaining consumer and business credit reports.
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.agreeTerms}
            onChange={e => set('agreeTerms', e.target.checked)} />
          I have read and agree to the Credit Application terms, Security Agreement, and Guaranty.
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.eftAck}
            onChange={e => set('eftAck', e.target.checked)} />
          I authorize GHRA FUELS to initiate EFT debits from the bank account provided.
        </label>
      </div>

      <UploadField
        label="Voided Check (required for EFT)"
        required
        fieldKey="voided_check"
        draftId={draftId}
        currentUrl={fd.voidedCheckUrl}
        onUpload={(key, file) => handleUpload(key, file, (url) => set('voidedCheckUrl', url))}
      />

      {fd.principals.filter(p => p.name).length > 0 && (
        <>
          <p className="fuels-section-title" style={{ fontSize: 14, marginTop: 24 }}>
            Personal Guaranty — Each Principal
          </p>
          {fd.principals.map((p, idx) => !p.name ? null : (
            <div key={idx} style={{ marginBottom: 12 }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={!!p.acknowledged}
                  onChange={e => updatePrincipalAck(idx, e.target.checked)} />
                I, <strong>{p.name}</strong>, agree to personally guarantee all obligations of this credit application.
              </label>
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: 20, padding: 14, background: '#f8f9fb',
        borderRadius: 6, border: '1px solid var(--ghra-line)', fontSize: 13, color: 'var(--ghra-muted)' }}>
        Your application will be reviewed by the GHRA Fuels team. DS signing will be enabled in a future update.
      </div>
    </div>
  )
}

// ── Progress indicator ────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps, steps }) {
  return (
    <div className="progress-indicator">
      {steps.map((step, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        return (
          <div key={step.id} className={`progress-step${isCompleted ? ' completed' : ''}${isActive ? ' active' : ''}`}>
            <div className="step-circle">
              {isCompleted ? <span>&#10003;</span> : <span>{stepNum}</span>}
            </div>
            <div className="step-label">{step.title}</div>
            {i < totalSteps - 1 && <div className="step-connector" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function FuelsApplicationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    saveFuelsDraft, submitFuelsApplication, getFuelsApplication, uploadFuelsDocument,
  } = useContext(AuthContext)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(blankForm())
  const [draftId, setDraftId] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [readOnly, setReadOnly] = useState(false)

  // Load existing draft/application
  useEffect(() => {
    if (!id) return
    getFuelsApplication(id).then(data => {
      if (!data) { setLoading(false); return }
      const loaded = { ...blankForm(), ...(data.formData || {}) }
      // Pre-mask principals with encrypted SSN/DL
      if (loaded.principals && Array.isArray(loaded.principals)) {
        loaded.principals = loaded.principals.map(p => ({
          ...p,
          ssn: p.ssnEncrypted ? '***-**-****' : (p.ssn || ''),
          dlNumber: p.dlEncrypted ? '***masked***' : (p.dlNumber || ''),
        }))
      }
      setFormData(loaded)
      setDraftId(data.Id)
      setReadOnly(data.Status !== 'draft')
      setLoading(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Save draft — creates on first save (draftId=null), updates thereafter
  const saveDraft = useCallback(async (fd) => {
    setSaving(true)
    const result = await saveFuelsDraft(draftId, fd)
    setSaving(false)
    if (result.success && result.id && !draftId) {
      setDraftId(result.id)
    }
    return result
  }, [draftId, saveFuelsDraft])

  // File upload: save draft first if no draftId, then upload
  const handleUpload = useCallback(async (fieldKey, file, onSuccess) => {
    let appId = draftId
    if (!appId) {
      const draftResult = await saveFuelsDraft(null, formData)
      if (!draftResult.success) return { success: false, error: draftResult.error || 'Could not create draft' }
      appId = draftResult.id
      setDraftId(appId)
    }
    const result = await uploadFuelsDocument(appId, fieldKey, file)
    if (result.success) {
      onSuccess(result.url, result.filename)
    }
    return result
  }, [draftId, formData, saveFuelsDraft, uploadFuelsDocument])

  const handleNext = async () => {
    const err = validateStep(step, formData)
    if (err) { setError(err); return }
    setError(null)
    const result = await saveDraft(formData)
    if (!result.success) { setError(result.error || 'Save failed'); return }
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    const err = validateStep(4, formData)
    if (err) { setError(err); return }
    setError(null)
    setSubmitting(true)
    const result = await submitFuelsApplication(draftId, formData)
    setSubmitting(false)
    if (!result.success) { setError(result.error || 'Submission failed'); return }
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="fuels-container">
        <div className="wh-header"><p>Loading application...</p></div>
      </div>
    )
  }

  return (
    <div className="fuels-container">
      <div className="fuels-header">
        <h1>GHRA Fuels Credit Application</h1>
        <p>Complete all sections. Your progress is saved automatically.</p>
      </div>

      <StepIndicator currentStep={step} totalSteps={STEPS.length} steps={STEPS} />

      <div className="fuels-card">
        {step === 1 && (
          <Section1 fd={formData} set={setField} />
        )}
        {step === 2 && (
          <Section2 fd={formData} set={setField} handleUpload={handleUpload} />
        )}
        {step === 3 && (
          <Section3 fd={formData} set={setField} />
        )}
        {step === 4 && (
          <Section4 fd={formData} set={setField} draftId={draftId} handleUpload={handleUpload} />
        )}

        <div className="fuels-nav">
          <div>
            {step > 1 && (
              <button type="button" className="fuels-btn fuels-btn-secondary"
                onClick={handleBack} disabled={saving || submitting}>
                Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {error && <span className="fuels-error-msg">{error}</span>}
            {saving && <span style={{ fontSize: 12, color: 'var(--ghra-muted)' }}>Saving...</span>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="fuels-btn fuels-btn-ghost"
                onClick={() => navigate('/dashboard')} disabled={saving || submitting}>
                Save &amp; Exit
              </button>
              {step < STEPS.length ? (
                <button type="button" className="fuels-btn fuels-btn-primary"
                  onClick={handleNext} disabled={saving || readOnly}>
                  {saving ? 'Saving...' : 'Save & Continue'}
                </button>
              ) : (
                <button type="button" className="fuels-btn fuels-btn-primary"
                  onClick={handleSubmit} disabled={submitting || readOnly}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FuelsApplicationForm
