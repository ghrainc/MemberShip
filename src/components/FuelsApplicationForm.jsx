import { useContext, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import FormShell from './form/FormShell'
import MultiFileUploader from './MultiFileUploader'
import StateSelect from './StateSelect'
import '../styles/MembershipForm.css'

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Business Info',  shortLabel: 'Business' },
  { id: 2, title: 'Principals',     shortLabel: 'Principals' },
  { id: 3, title: 'Tank & Bank',    shortLabel: 'Tank & Bank' },
  { id: 4, title: 'Agreements',     shortLabel: 'Agreements' },
]

const BUSINESS_TYPES = [
  { value: 'corporation',         label: 'Corporation' },
  { value: 'llc',                 label: 'LLC' },
  { value: 'partnership',         label: 'Partnership' },
  { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
  { value: 'other-lp-llp',        label: 'Other LP/LLP' },
]

const BLANK_PRINCIPAL = {
  name: '', title: '', homeAddress: '', city: '', state: '', zip: '', phone: '',
  dlNumber: '', dlState: '', ssn: '', dob: '', dlFileUrl: '',
  acknowledged: false,
}

// Uppercase allow-list — only these field names are uppercased when the user types.
// Never include: emails, phones, IDs (EIN, SSN, DL#, routing/account#, tax IDs), dates, numbers, selects.
const FUELS_TEXT_UPPERCASE = new Set([
  'businessEntityName', 'dba',
  'billingAddress', 'billingCity',
  'deliveryAddress', 'deliveryCity',
  'ownershipEntityName', 'propertyOwnerInfo',
  'primaryFuelContactName', 'primaryFuelContactTitle',
  'apContactName', 'apContactTitle',
  'bankName', 'bankBranchAddress', 'bankOfficer',
  'tradeRefBusiness', 'tradeRefContact',
  'fuelSupplierName', 'fuelSupplierContact',
  'personalRefName', 'personalRefRelationship',
  'tankSizes',
])

const FUELS_PRINCIPAL_TEXT_UPPERCASE = new Set(['name', 'title', 'homeAddress', 'city'])

function blankForm() {
  return {
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
    principals: [{ ...BLANK_PRINCIPAL }],
    numTanks: '', tankSizes: '', tanksLocked: '', monthlyVolume: '',
    bankName: '', bankBranchAddress: '', bankOfficer: '', bankPhone: '', bankEmail: '',
    accountType: '', accountNumber: '', routingNumber: '',
    tradeRefBusiness: '', tradeRefContact: '', tradeRefPhone: '', tradeRefEmail: '',
    fuelSupplierName: '', fuelSupplierContact: '', fuelSupplierPhone: '', fuelSupplierEmail: '',
    personalRefName: '', personalRefRelationship: '', personalRefPhone: '', personalRefEmail: '',
    infoReleaseAck: false, creditReportConsent: false, agreeTerms: false, eftAck: false,
    voidedCheckUrl: '',
    documents: { voided_check: [] },
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function computeStepErrors(step, fd) {
  const errs = {}
  const req = (val) => !val || !String(val).trim()
  switch (step) {
    case 1:
      if (req(fd.businessEntityName)) errs.businessEntityName = 'Business / Entity Name is required'
      if (req(fd.billingAddress))     errs.billingAddress     = 'Billing address is required'
      if (req(fd.billingCity))        errs.billingCity        = 'City is required'
      if (req(fd.billingState))       errs.billingState       = 'State is required'
      if (req(fd.billingZip))         errs.billingZip         = 'ZIP is required'
      if (req(fd.deliveryAddress))    errs.deliveryAddress    = 'Delivery address is required'
      if (req(fd.deliveryCity))       errs.deliveryCity       = 'City is required'
      if (req(fd.deliveryState))      errs.deliveryState      = 'State is required'
      if (req(fd.deliveryZip))        errs.deliveryZip        = 'ZIP is required'
      if (req(fd.businessPhone))      errs.businessPhone      = 'Business phone is required'
      if (req(fd.businessEmail))      errs.businessEmail      = 'Business email is required'
      break
    case 2:
      ;(fd.principals || []).forEach((p, i) => {
        if (req(p.name))  errs[`principal_${i}_name`]  = 'Name is required'
      })
      break
    case 3:
      if (req(fd.bankName))      errs.bankName      = 'Bank name is required'
      if (req(fd.routingNumber)) errs.routingNumber = 'Routing number is required'
      if (req(fd.accountNumber)) errs.accountNumber = 'Account number is required'
      break
    case 4:
      if (!fd.infoReleaseAck)      errs.infoReleaseAck      = 'You must authorize the bank information release'
      if (!fd.creditReportConsent) errs.creditReportConsent = 'You must consent to credit report authorization'
      if (!fd.agreeTerms)          errs.agreeTerms          = 'You must agree to the terms'
      if (!fd.eftAck)              errs.eftAck              = 'You must authorize EFT debits'
      if (!(fd.documents?.voided_check || []).length) errs.voidedCheckUrl = 'A voided check upload is required for EFT authorization'
      ;(fd.principals || []).forEach((p, i) => {
        if (p.name && !p.acknowledged) errs[`principal_${i}_ack`] = `${p.name} must personally acknowledge the guaranty`
      })
      break
    default: break
  }
  return errs
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, required, children, hint, error }) {
  return (
    <div className="form-group">
      <label>
        {label}{required && <span className="required-star">*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--ghra-muted)', marginTop: 2, display: 'block' }}>{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}

function UploadField({ label, required, fieldKey, currentUrl, onUpload, error }) {
  const [status, setStatus] = useState(null)
  const [msg, setMsg] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setStatus('uploading')
    setMsg('Uploading...')
    const result = await onUpload(fieldKey, file)
    if (result.success) { setStatus('ok'); setMsg('Uploaded') }
    else { setStatus('error'); setMsg(result.error || 'Upload failed') }
    e.target.value = ''
  }

  return (
    <div className="form-group">
      <label>{label}{required && <span className="required-star">*</span>}</label>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="form-input"
        style={{ padding: '6px 10px' }} />
      {currentUrl && status === null && <span className="gf-upload-status ok">File on record</span>}
      {status && (
        <span className={`gf-upload-status${status === 'ok' ? ' ok' : status === 'error' ? ' error' : ''}`}>
          {msg}
        </span>
      )}
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}

function SensitiveField({ label, value, onChange, isEncrypted, placeholder }) {
  const [editing, setEditing] = useState(false)

  if (isEncrypted && !editing) {
    return (
      <div className="form-group">
        <label>{label}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="form-input" readOnly value="***-**-****" style={{ flex: 1 }} />
          <button type="button" className="gf-outline-btn"
            onClick={() => { onChange(''); setEditing(true) }}>
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <input className="form-input" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete="off" />
    </div>
  )
}

// ── Step panels ───────────────────────────────────────────────────────────────

function Section1({ fd, set, errors, clearError }) {
  return (
    <fieldset className="form-section">
      <legend>Applicant / Business Information</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Business Details</span>
        <div className="form-row">
          <Field label="GHRA #">
            <input className="form-input" value={fd.ghraNumber}
              onChange={e => set('ghraNumber', e.target.value)} />
          </Field>
          <Field label="Business / Entity Name" required error={errors.businessEntityName}>
            <input
              className={`form-input${errors.businessEntityName ? ' input-error' : ''}`}
              value={fd.businessEntityName}
              onChange={e => { set('businessEntityName', e.target.value); clearError('businessEntityName') }}
            />
          </Field>
          <Field label="DBA">
            <input className="form-input" value={fd.dba}
              onChange={e => set('dba', e.target.value)} />
          </Field>
        </div>
        <Field label="Business Type">
          <div className="radio-group radio-group-row">
            {BUSINESS_TYPES.map(bt => (
              <label key={bt.value} className="radio-label">
                <input type="radio" name="businessType" value={bt.value}
                  checked={fd.businessType === bt.value}
                  onChange={() => set('businessType', bt.value)} />
                {bt.label}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Billing Address</span>
        <div className="form-row">
          <Field label="Address" required error={errors.billingAddress}>
            <input
              className={`form-input${errors.billingAddress ? ' input-error' : ''}`}
              value={fd.billingAddress}
              onChange={e => { set('billingAddress', e.target.value); clearError('billingAddress') }}
            />
          </Field>
          <Field label="City" required error={errors.billingCity}>
            <input
              className={`form-input${errors.billingCity ? ' input-error' : ''}`}
              value={fd.billingCity}
              onChange={e => { set('billingCity', e.target.value); clearError('billingCity') }}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="State" required error={errors.billingState}>
            <StateSelect
              className={`form-select${errors.billingState ? ' input-error' : ''}`}
              value={fd.billingState}
              onChange={e => { set('billingState', e.target.value); clearError('billingState') }}
            />
          </Field>
          <Field label="ZIP" required error={errors.billingZip}>
            <input
              className={`form-input${errors.billingZip ? ' input-error' : ''}`}
              value={fd.billingZip}
              onChange={e => { set('billingZip', e.target.value); clearError('billingZip') }}
            />
          </Field>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Delivery Address</span>
        <div className="form-row">
          <Field label="Address" required error={errors.deliveryAddress}>
            <input
              className={`form-input${errors.deliveryAddress ? ' input-error' : ''}`}
              value={fd.deliveryAddress}
              onChange={e => { set('deliveryAddress', e.target.value); clearError('deliveryAddress') }}
            />
          </Field>
          <Field label="City" required error={errors.deliveryCity}>
            <input
              className={`form-input${errors.deliveryCity ? ' input-error' : ''}`}
              value={fd.deliveryCity}
              onChange={e => { set('deliveryCity', e.target.value); clearError('deliveryCity') }}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="State" required error={errors.deliveryState}>
            <StateSelect
              className={`form-select${errors.deliveryState ? ' input-error' : ''}`}
              value={fd.deliveryState}
              onChange={e => { set('deliveryState', e.target.value); clearError('deliveryState') }}
            />
          </Field>
          <Field label="ZIP" required error={errors.deliveryZip}>
            <input
              className={`form-input${errors.deliveryZip ? ' input-error' : ''}`}
              value={fd.deliveryZip}
              onChange={e => { set('deliveryZip', e.target.value); clearError('deliveryZip') }}
            />
          </Field>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Property</span>
        <Field label="Property owned by applicant?">
          <div className="radio-group radio-group-row">
            {['Yes', 'No'].map(v => (
              <label key={v} className="radio-label">
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
          <div className="form-row">
            <Field label="Lease Expiration Year">
              <input className="form-input" value={fd.leasedExpirationYear}
                onChange={e => set('leasedExpirationYear', e.target.value)} />
            </Field>
            <Field label="Property Owner Info">
              <input className="form-input" value={fd.propertyOwnerInfo}
                onChange={e => set('propertyOwnerInfo', e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Contact &amp; Business Details</span>
        <div className="form-row">
          <Field label="Business Phone" required error={errors.businessPhone}>
            <input
              className={`form-input${errors.businessPhone ? ' input-error' : ''}`}
              type="tel"
              value={fd.businessPhone}
              onChange={e => { set('businessPhone', e.target.value); clearError('businessPhone') }}
            />
          </Field>
          <Field label="Business Fax">
            <input className="form-input" type="tel" value={fd.businessFax}
              onChange={e => set('businessFax', e.target.value)} />
          </Field>
          <Field label="Business Email" required error={errors.businessEmail}>
            <input
              className={`form-input${errors.businessEmail ? ' input-error' : ''}`}
              type="email"
              value={fd.businessEmail}
              onChange={e => { set('businessEmail', e.target.value); clearError('businessEmail') }}
            />
          </Field>
        </div>
        <div className="form-row">
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
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Delivery Certificate</span>
        <div className="form-row">
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
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Primary Fuel Contact</span>
        <div className="form-row">
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
        <div className="form-row">
          <Field label="Email">
            <input className="form-input" type="email" value={fd.primaryFuelContactEmail}
              onChange={e => set('primaryFuelContactEmail', e.target.value)} />
          </Field>
          <Field label="Fax">
            <input className="form-input" type="tel" value={fd.primaryFuelContactFax}
              onChange={e => set('primaryFuelContactFax', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">AP Contact</span>
        <div className="form-row">
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
        <div className="form-row">
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
    </fieldset>
  )
}

function Section2({ fd, set, uploadDocument, handleDocFilesChange, applicationId, openDocument, downloadCombinedPdf, errors, clearError }) {
  const updatePrincipal = (idx, field, val) => {
    const v = typeof val === 'string' && FUELS_PRINCIPAL_TEXT_UPPERCASE.has(field) ? val.toUpperCase() : val
    const updated = fd.principals.map((p, i) => i === idx ? { ...p, [field]: v } : p)
    set('principals', updated)
    clearError(`principal_${idx}_${field}`)
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
    <fieldset className="form-section">
      <legend>Principal Officers / Owners</legend>
      <p className="section-note">Copy of current driver's license required for each officer.</p>

      {fd.principals.map((p, idx) => (
        <div key={idx} className="form-section-inner">
          <div className="inner-section-header">
            <span className="inner-legend">Principal {idx + 1}</span>
            {fd.principals.length > 1 && (
              <button type="button" className="remove-button" onClick={() => removePrincipal(idx)}>
                Remove
              </button>
            )}
          </div>

          <div className="form-row">
            <Field label="Name" required error={errors[`principal_${idx}_name`]}>
              <input
                className={`form-input${errors[`principal_${idx}_name`] ? ' input-error' : ''}`}
                value={p.name}
                onChange={e => updatePrincipal(idx, 'name', e.target.value)}
              />
            </Field>
            <Field label="Title" error={errors[`principal_${idx}_title`]}>
              <input
                className={`form-input${errors[`principal_${idx}_title`] ? ' input-error' : ''}`}
                value={p.title}
                onChange={e => updatePrincipal(idx, 'title', e.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Home Address">
              <input className="form-input" value={p.homeAddress}
                onChange={e => updatePrincipal(idx, 'homeAddress', e.target.value)} />
            </Field>
            <Field label="City">
              <input className="form-input" value={p.city}
                onChange={e => updatePrincipal(idx, 'city', e.target.value)} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="State">
              <StateSelect
                className="form-select"
                value={p.state}
                onChange={e => updatePrincipal(idx, 'state', e.target.value)}
              />
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
          <div className="form-row">
            <SensitiveField
              label="Driver's License #"
              value={p.dlNumber}
              onChange={val => updatePrincipal(idx, 'dlNumber', val)}
              isEncrypted={!!p.dlEncrypted}
              placeholder="DL number"
            />
            <Field label="DL State">
              <StateSelect
                className="form-select"
                value={p.dlState}
                onChange={e => updatePrincipal(idx, 'dlState', e.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
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
          <MultiFileUploader
            slot={{ id: `principal_dl_${idx}`, title: "Driver's License Copy", required: false, description: "Upload a clear copy of the driver's license." }}
            files={(fd.documents?.[`principal_dl_${idx}`]) || []}
            applicationId={applicationId}
            onFilesChange={handleDocFilesChange}
            uploadDocument={uploadDocument}
            removeDocument={() => {}}
            openDocument={openDocument}
            downloadCombinedPdf={downloadCombinedPdf}
          />
        </div>
      ))}

      {fd.principals.length < 3 && (
        <button type="button" className="add-button" onClick={addPrincipal}>
          + Add Principal
        </button>
      )}
    </fieldset>
  )
}

function Section3({ fd, set, errors, clearError }) {
  return (
    <fieldset className="form-section">
      <legend>Tank &amp; Bank Information</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Tank Information</span>
        <div className="form-row">
          <Field label="Number of Tanks">
            <input className="form-input" type="number" value={fd.numTanks}
              onChange={e => set('numTanks', e.target.value)} />
          </Field>
          <Field label="Tank Sizes">
            <input className="form-input" value={fd.tankSizes}
              onChange={e => set('tankSizes', e.target.value)} placeholder="e.g. 10,000 gal" />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Tanks Locked?">
            <div className="radio-group radio-group-row">
              {['Yes', 'No'].map(v => (
                <label key={v} className="radio-label">
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
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Bank Information</span>
        <div className="form-row">
          <Field label="Bank Name" required error={errors.bankName}>
            <input
              className={`form-input${errors.bankName ? ' input-error' : ''}`}
              value={fd.bankName}
              onChange={e => { set('bankName', e.target.value); clearError('bankName') }}
            />
          </Field>
          <Field label="Branch Address">
            <input className="form-input" value={fd.bankBranchAddress}
              onChange={e => set('bankBranchAddress', e.target.value)} />
          </Field>
        </div>
        <div className="form-row">
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
          <div className="radio-group radio-group-row">
            {['Checking', 'Savings'].map(v => (
              <label key={v} className="radio-label">
                <input type="radio" name="accountType" value={v}
                  checked={fd.accountType === v}
                  onChange={() => set('accountType', v)} />
                {v}
              </label>
            ))}
          </div>
        </Field>
        <div className="form-row">
          <Field label="Routing Number" required error={errors.routingNumber}>
            <input
              className={`form-input${errors.routingNumber ? ' input-error' : ''}`}
              value={fd.routingNumber}
              autoComplete="off"
              onChange={e => { set('routingNumber', e.target.value); clearError('routingNumber') }}
            />
          </Field>
          <Field label="Account Number" required error={errors.accountNumber}>
            <input
              className={`form-input${errors.accountNumber ? ' input-error' : ''}`}
              value={fd.accountNumber}
              autoComplete="off"
              onChange={e => { set('accountNumber', e.target.value); clearError('accountNumber') }}
            />
          </Field>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Trade Reference</span>
        <div className="form-row">
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
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Fuel Supplier</span>
        <div className="form-row">
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
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Personal Reference</span>
        <div className="form-row">
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
    </fieldset>
  )
}

function Section4({ fd, set, uploadDocument, handleDocFilesChange, applicationId, openDocument, downloadCombinedPdf, errors, clearError }) {
  const updatePrincipalAck = (idx, val) => {
    const updated = fd.principals.map((p, i) => i === idx ? { ...p, acknowledged: val } : p)
    set('principals', updated)
    clearError(`principal_${idx}_ack`)
  }

  return (
    <fieldset className="form-section">
      <legend>Agreements &amp; Acknowledgments</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Authorization</span>
        <div className="checkbox-group">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={fd.infoReleaseAck}
                onChange={e => { set('infoReleaseAck', e.target.checked); clearError('infoReleaseAck') }} />
              I authorize the bank named above to release all information requested by GHRA FUELS.
            </label>
            {errors.infoReleaseAck && <span className="error-text">{errors.infoReleaseAck}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={fd.creditReportConsent}
                onChange={e => { set('creditReportConsent', e.target.checked); clearError('creditReportConsent') }} />
              I consent to GHRA FUELS obtaining consumer and business credit reports.
            </label>
            {errors.creditReportConsent && <span className="error-text">{errors.creditReportConsent}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={fd.agreeTerms}
                onChange={e => { set('agreeTerms', e.target.checked); clearError('agreeTerms') }} />
              I have read and agree to the Credit Application terms, Security Agreement, and Guaranty.
            </label>
            {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={fd.eftAck}
                onChange={e => { set('eftAck', e.target.checked); clearError('eftAck') }} />
              I authorize GHRA FUELS to initiate EFT debits from the bank account provided.
            </label>
            {errors.eftAck && <span className="error-text">{errors.eftAck}</span>}
          </div>
        </div>
        <MultiFileUploader
          slot={{ id: 'voided_check', title: 'Voided Check', required: true, description: 'Upload a voided check for EFT authorization.' }}
          files={(fd.documents?.voided_check) || []}
          applicationId={applicationId}
          onFilesChange={handleDocFilesChange}
          uploadDocument={uploadDocument}
          removeDocument={() => {}}
          openDocument={openDocument}
          downloadCombinedPdf={downloadCombinedPdf}
          error={errors.voidedCheckUrl}
        />
      </div>

      {fd.principals.filter(p => p.name).length > 0 && (
        <div className="form-section-inner">
          <span className="inner-legend">Personal Guaranty — Each Principal</span>
          <div className="checkbox-group">
            {fd.principals.map((p, idx) => !p.name ? null : (
              <div key={idx} className="form-group" style={{ marginBottom: 0 }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={!!p.acknowledged}
                    onChange={e => updatePrincipalAck(idx, e.target.checked)} />
                  I, <strong>{p.name}</strong>, agree to personally guarantee all obligations of this credit application.
                </label>
                {errors[`principal_${idx}_ack`] && (
                  <span className="error-text">{errors[`principal_${idx}_ack`]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="section-note">
        Your application will be reviewed by the GHRA Fuels team. DS signing will be enabled in a future update.
      </p>
    </fieldset>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function FuelsApplicationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    saveFuelsDraft, submitFuelsApplication, getFuelsApplication, uploadFuelsDocument, currentUser,
    openDocument, downloadCombinedPdf,
  } = useContext(AuthContext)

  const [step, setStep]           = useState(1)
  const [formData, setFormData]   = useState(blankForm())
  const [draftId, setDraftId]     = useState(null)
  const [loading, setLoading]     = useState(!!id)
  const [saving, setSaving]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]       = useState({})
  const [toast, setToast]         = useState('')
  const [saveError, setSaveError] = useState(null)
  const [readOnly, setReadOnly]   = useState(false)
  const [appStatus, setAppStatus]         = useState('')
  const [appSubmittedAt, setAppSubmittedAt] = useState(null)
  const [appNotes, setAppNotes]           = useState('')

  useEffect(() => {
    if (!id) return
    getFuelsApplication(id).then(data => {
      if (!data) { setLoading(false); return }
      const loaded = { ...blankForm(), ...(data.formData || {}) }
      if (loaded.principals && Array.isArray(loaded.principals)) {
        loaded.principals = loaded.principals.map(p => ({
          ...p,
          ssn: p.ssnEncrypted ? '***-**-****' : (p.ssn || ''),
          dlNumber: p.dlEncrypted ? '***masked***' : (p.dlNumber || ''),
        }))
      }
      // Backfill documents object from legacy single-URL fields for existing applications
      const docs = { ...(loaded.documents || {}) }
      if (loaded.voidedCheckUrl && !(docs.voided_check || []).length) {
        docs.voided_check = [{ url: loaded.voidedCheckUrl, filename: 'voided_check', originalName: 'voided_check' }]
      }
      if (loaded.principals) {
        loaded.principals.forEach((p, i) => {
          if (p.dlFileUrl && !(docs[`principal_dl_${i}`] || []).length) {
            docs[`principal_dl_${i}`] = [{ url: p.dlFileUrl, filename: `principal_dl_${i}`, originalName: `principal_dl_${i}` }]
          }
        })
      }
      loaded.documents = docs
      setFormData(loaded)
      setDraftId(data.Id)
      setReadOnly(data.Status !== 'draft')
      setAppStatus(data.Status || '')
      setAppSubmittedAt(data.SubmittedAt || null)
      setAppNotes(data.Notes || '')
      setLoading(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const setField = useCallback((field, value) => {
    const v = typeof value === 'string' && FUELS_TEXT_UPPERCASE.has(field) ? value.toUpperCase() : value
    setFormData(prev => ({ ...prev, [field]: v }))
  }, [])

  const clearError = useCallback((key) => {
    setErrors(prev => prev[key] ? { ...prev, [key]: '' } : prev)
  }, [])

  const handleStepClick = useCallback((stepId) => {
    setStep(stepId)
    window.scrollTo(0, 0)
  }, [])

  const uploadDocumentFn = useCallback(async (appId, slotId, file) => {
    const result = await uploadFuelsDocument(appId, slotId, file)
    if (!result.success) throw new Error(result.error || 'Upload failed')
    return { url: result.url, filename: result.filename, originalName: file.name }
  }, [uploadFuelsDocument])

  const handleDocFilesChange = useCallback((slotId, newFiles) => {
    setFormData(prev => {
      const docs = { ...(prev.documents || {}), [slotId]: newFiles }
      const updates = { documents: docs }
      if (slotId === 'voided_check') updates.voidedCheckUrl = newFiles[0]?.url || ''
      const dlMatch = slotId.match(/^principal_dl_(\d+)$/)
      if (dlMatch) {
        const idx = parseInt(dlMatch[1], 10)
        updates.principals = prev.principals.map((p, i) => i === idx ? { ...p, dlFileUrl: newFiles[0]?.url || '' } : p)
      }
      return { ...prev, ...updates }
    })
  }, [])

  const saveDraft = useCallback(async (fd) => {
    setSaving(true)
    try {
      const result = await saveFuelsDraft(draftId, fd)
      if (result.success && result.id && !draftId) setDraftId(result.id)
      return result
    } finally {
      setSaving(false)
    }
  }, [draftId, saveFuelsDraft])

  const handleUpload = useCallback(async (fieldKey, file, onSuccess) => {
    let appId = draftId
    if (!appId) {
      const draftResult = await saveFuelsDraft(null, formData)
      if (!draftResult.success) return { success: false, error: draftResult.error || 'Could not create draft' }
      appId = draftResult.id
      setDraftId(appId)
    }
    const result = await uploadFuelsDocument(appId, fieldKey, file)
    if (result.success) onSuccess(result.url, result.filename)
    return result
  }, [draftId, formData, saveFuelsDraft, uploadFuelsDocument])

  const handleNext = async () => {
    const stepErrors = computeStepErrors(step, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      setToast('Please fill in all required fields before continuing.')
      setTimeout(() => {
        const el = document.querySelector('.input-error, .error-text')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setErrors({})
    setSaveError(null)
    const result = await saveDraft(formData)
    if (!result.success) { setSaveError(result.error || 'Save failed'); return }
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setErrors({})
    setSaveError(null)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    const stepErrors = computeStepErrors(4, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      setToast('Please fill in all required fields before continuing.')
      setTimeout(() => {
        const el = document.querySelector('.input-error, .error-text')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setErrors({})
    setSaveError(null)
    setSubmitting(true)
    try {
      let id = draftId
      if (!id) {
        const r = await saveDraft(formData)
        if (!r.success) {
          setToast(r.error || 'Could not save your application. Please try again.')
          return
        }
        id = r.id
      }
      const result = await submitFuelsApplication(id, formData)
      if (!result.success) {
        setToast(result.error || 'Submission failed. Please try again.')
        return
      }
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="gf-container">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ghra-slate)' }}>
          Loading application...
        </div>
      </div>
    )
  }

  const sectionProps = { fd: formData, set: setField, errors, clearError }

  const nav = readOnly
    ? (
      <div className="gf-nav-right">
        <button type="button" className="nav-button cancel-button"
          onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    )
    : (
      <>
        <div>
          {step > 1 && (
            <button type="button" className="nav-button prev-button"
              onClick={handleBack} disabled={saving || submitting}>
              Back
            </button>
          )}
        </div>
        <div className="gf-nav-right">
          {saveError && <span className="error-text">{saveError}</span>}
          {saving && <span className="gf-saving-text">Saving...</span>}
          <div className="gf-nav-actions">
            <button type="button" className="nav-button cancel-button"
              onClick={() => navigate('/dashboard')} disabled={saving || submitting}>
              Save &amp; Exit
            </button>
            {step < STEPS.length ? (
              <button type="button" className="nav-button next-button"
                onClick={handleNext} disabled={saving}>
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            ) : (
              <button type="button" className="nav-button next-button"
                onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </>
    )

  return (
    <>
      {toast && (
        <div className="validation-toast">
          <span>{toast}</span>
          <button className="validation-toast-close" onClick={() => setToast('')}>✕</button>
        </div>
      )}
      <FormShell
        title="GHRA Fuels Credit Application"
        steps={STEPS}
        currentStep={step}
        email={currentUser?.email}
        nav={nav}
        onStepClick={handleStepClick}
      >
        {readOnly && appStatus && (
          <div className={`gf-status-banner gf-status-banner--${appStatus}`}>
            <p className="gf-status-banner__title">
              {appStatus === 'submitted' && 'This application has been submitted and is awaiting review.'}
              {appStatus === 'approved'  && 'This application has been approved.'}
              {appStatus === 'rejected'  && 'This application has been rejected.'}
            </p>
            <p className="gf-status-banner__body">
              {appSubmittedAt && <>Submitted: {new Date(appSubmittedAt).toLocaleDateString()}</>}
              {appNotes && <><br />Reviewer notes: {appNotes}</>}
            </p>
          </div>
        )}
        <div className={readOnly ? 'gf-readonly-content' : ''}>
          {step === 1 && <Section1 {...sectionProps} />}
          {step === 2 && <Section2 fd={formData} set={setField} uploadDocument={uploadDocumentFn} handleDocFilesChange={handleDocFilesChange} applicationId={draftId} openDocument={openDocument} downloadCombinedPdf={downloadCombinedPdf} errors={errors} clearError={clearError} />}
          {step === 3 && <Section3 {...sectionProps} />}
          {step === 4 && <Section4 fd={formData} set={setField} uploadDocument={uploadDocumentFn} handleDocFilesChange={handleDocFilesChange} applicationId={draftId} openDocument={openDocument} downloadCombinedPdf={downloadCombinedPdf} errors={errors} clearError={clearError} />}
        </div>
      </FormShell>
    </>
  )
}

export default FuelsApplicationForm
