import { useContext, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import SignaturePad from './SignaturePad'
import FormShell from './form/FormShell'
import MultiFileUploader from './MultiFileUploader'
import StateSelect from './StateSelect'
import '../styles/MembershipForm.css'

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Business Info',  shortLabel: 'Business' },
  { id: 2, title: 'Owners',         shortLabel: 'Owners' },
  { id: 3, title: 'Permits',        shortLabel: 'Permits' },
  { id: 4, title: 'Purchasing',     shortLabel: 'Purchasing' },
  { id: 5, title: 'Resale Cert.',   shortLabel: 'Resale' },
  { id: 6, title: 'Sign',           shortLabel: 'Sign' },
]

const CATEGORIES = [
  'Tobacco & cigarettes', 'Candy & gum', 'Grocery & snacks', 'Beverages',
  'Dairy & meat', 'Frozen food', 'Automotive', 'General merchandise',
  'Health & beauty', 'Paper & janitorial', 'Pet care', 'Food service supplies',
]

const ENTITY_TYPES = [
  { value: 'sole-proprietor', label: 'Sole Proprietorship' },
  { value: 'partnership',     label: 'Partnership' },
  { value: 'llc',             label: 'LLC' },
  { value: 'c-corp',          label: 'C-Corp' },
  { value: 's-corp',          label: 'S-Corp' },
  { value: 'other',           label: 'Other' },
]

const BLANK_OWNER = { ownerName: '', ownerTitle: '', ownerPct: '', ownerPhone: '', ownerEmail: '', ownerAddr: '', ownerDl: '', photoIdUrl: '' }

// Uppercase allow-list — only these field names are uppercased when the user types.
// Never include: emails, phones, IDs (EIN, tax IDs, DL#), dates, numbers, selects.
const WAREHOUSE_TEXT_UPPERCASE = new Set([
  'legalName', 'entityTypeOther', 'dbaName',
  'primaryContact', 'storeAddress', 'storeCity',
  'mailingAddress', 'mailingCity',
  'rcName', 'rcItems', 'rcActivity',
  'signerName', 'signerTitle',
])

const WAREHOUSE_OWNER_TEXT_UPPERCASE = new Set(['ownerName', 'ownerTitle', 'ownerAddr'])

function blankForm() {
  return {
    // Section 1
    legalName: '', entityType: '', entityTypeOther: '', dbaName: '', ein: '',
    businessStarted: '', numLocations: '', businessPhone: '', businessEmail: '', primaryContact: '',
    storeAddress: '', storeCity: '', storeState: 'TX', storeZip: '',
    mailSame: true, mailingAddress: '', mailingCity: '', mailingState: 'TX', mailingZip: '',
    // Section 2
    owners: [{ ...BLANK_OWNER }],
    // Section 3
    salesTaxPermitNo: '', salesTaxPermitUrl: '',
    hasTobacco: false, tobaccoPermitNo: '', tobaccoPermitExpiry: '', tobaccoPermitUrl: '',
    // Section 4
    purchaseVolume: '', startDate: '', categories: [],
    // Section 5
    rcName: '', rcPermit: '', rcPhone: '', rcItems: '', rcActivity: '', rcAck: false,
    // Section 6
    signerName: '', signerTitle: '', signatureData: null, agreeTerms: false, esign: false,
    // Document slots (MultiFileUploader arrays)
    documents: { tax_permit: [], tobacco_permit: [] },
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function computeStepErrors(step, fd) {
  const errs = {}
  const req = (val) => !val || !String(val).trim()
  switch (step) {
    case 1:
      if (req(fd.legalName))       errs.legalName       = 'Legal name is required'
      if (req(fd.entityType))      errs.entityType      = 'Entity type is required'
      if (req(fd.dbaName))         errs.dbaName         = 'DBA name is required'
      if (req(fd.numLocations))    errs.numLocations    = 'Number of locations is required'
      if (req(fd.businessPhone))   errs.businessPhone   = 'Business phone is required'
      if (req(fd.businessEmail))   errs.businessEmail   = 'Business email is required'
      if (req(fd.primaryContact))  errs.primaryContact  = 'Primary contact is required'
      if (req(fd.storeAddress))    errs.storeAddress    = 'Store address is required'
      if (req(fd.storeCity))       errs.storeCity       = 'City is required'
      if (req(fd.storeState))      errs.storeState      = 'State is required'
      if (req(fd.storeZip))        errs.storeZip        = 'ZIP is required'
      if (!fd.mailSame) {
        if (req(fd.mailingAddress)) errs.mailingAddress = 'Mailing address is required'
        if (req(fd.mailingCity))    errs.mailingCity    = 'City is required'
        if (req(fd.mailingState))   errs.mailingState   = 'State is required'
        if (req(fd.mailingZip))     errs.mailingZip     = 'ZIP is required'
      }
      break
    case 2:
      ;(fd.owners || []).forEach((o, i) => {
        if (req(o.ownerName))  errs[`owner_${i}_name`]  = 'Name is required'
      })
      break
    case 3:
      if (req(fd.salesTaxPermitNo)) errs.salesTaxPermitNo = 'Sales tax permit number is required'
      break
    case 4:
      if (req(fd.purchaseVolume)) errs.purchaseVolume = 'Estimated purchase volume is required'
      if (!fd.categories || fd.categories.length === 0) errs.categories = 'Please select at least one product category'
      break
    case 5:
      if (req(fd.rcName))     errs.rcName     = 'Business name is required'
      if (req(fd.rcPermit))   errs.rcPermit   = 'Permit number is required'
      if (req(fd.rcPhone))    errs.rcPhone    = 'Phone is required'
      if (req(fd.rcItems))    errs.rcItems    = 'Items purchased is required'
      if (req(fd.rcActivity)) errs.rcActivity = 'Activity description is required'
      if (!fd.rcAck)          errs.rcAck      = 'You must check the acknowledgement'
      break
    case 6:
      if (req(fd.signerName))  errs.signerName  = 'Signer name is required'
      if (req(fd.signerTitle)) errs.signerTitle = 'Signer title is required'
      if (!fd.signatureData)   errs.signatureData = 'Signature is required'
      if (!fd.agreeTerms)      errs.agreeTerms  = 'You must agree to the terms and conditions'
      if (!fd.esign)           errs.esign       = 'You must consent to electronic signature'
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
      {hint && <span style={{ fontSize: 11, color: 'var(--ghra-muted)' }}>{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}

function Input({ value, onChange, error, ...rest }) {
  return (
    <input
      className={`form-input${error ? ' input-error' : ''}`}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      {...rest}
    />
  )
}

function Select({ value, onChange, options, placeholder, error, ...rest }) {
  return (
    <select
      className={`form-select${error ? ' input-error' : ''}`}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ── Step panels ───────────────────────────────────────────────────────────────

function Section1({ fd, set, errors, clearError }) {
  return (
    <fieldset className="form-section">
      <legend>Business Information</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Business Details</span>
        <div className="form-row">
          <Field label="Legal Business Name" required error={errors.legalName}>
            <Input
              value={fd.legalName}
              error={errors.legalName}
              onChange={v => { set('legalName', v); clearError('legalName') }}
            />
          </Field>
          <Field label="DBA Name" required error={errors.dbaName}>
            <Input
              value={fd.dbaName}
              error={errors.dbaName}
              onChange={v => { set('dbaName', v); clearError('dbaName') }}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Entity Type" required error={errors.entityType}>
            <Select
              value={fd.entityType}
              error={errors.entityType}
              onChange={v => { set('entityType', v); clearError('entityType') }}
              options={ENTITY_TYPES}
              placeholder="Select..."
            />
          </Field>
          {fd.entityType === 'other' && (
            <Field label="Specify Entity Type">
              <Input value={fd.entityTypeOther} onChange={v => set('entityTypeOther', v)} />
            </Field>
          )}
          <Field label="EIN">
            <Input value={fd.ein} onChange={v => set('ein', v)} placeholder="XX-XXXXXXX" />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Business Start Date">
            <Input type="date" value={fd.businessStarted} onChange={v => set('businessStarted', v)} />
          </Field>
          <Field label="Number of Locations" required error={errors.numLocations}>
            <Input
              type="number"
              min="1"
              value={fd.numLocations}
              error={errors.numLocations}
              onChange={v => { set('numLocations', v); clearError('numLocations') }}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Business Phone" required error={errors.businessPhone}>
            <Input
              type="tel"
              value={fd.businessPhone}
              error={errors.businessPhone}
              onChange={v => { set('businessPhone', v); clearError('businessPhone') }}
            />
          </Field>
          <Field label="Business Email" required error={errors.businessEmail}>
            <Input
              type="email"
              value={fd.businessEmail}
              error={errors.businessEmail}
              onChange={v => { set('businessEmail', v); clearError('businessEmail') }}
            />
          </Field>
          <Field label="Primary Contact" required error={errors.primaryContact}>
            <Input
              value={fd.primaryContact}
              error={errors.primaryContact}
              onChange={v => { set('primaryContact', v); clearError('primaryContact') }}
            />
          </Field>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Store Address</span>
        <Field label="Street Address" required error={errors.storeAddress}>
          <Input
            value={fd.storeAddress}
            error={errors.storeAddress}
            onChange={v => { set('storeAddress', v); clearError('storeAddress') }}
          />
        </Field>
        <div className="form-row">
          <Field label="City" required error={errors.storeCity}>
            <Input
              value={fd.storeCity}
              error={errors.storeCity}
              onChange={v => { set('storeCity', v); clearError('storeCity') }}
            />
          </Field>
          <Field label="State" required error={errors.storeState}>
            <StateSelect
              className={`form-select${errors.storeState ? ' input-error' : ''}`}
              value={fd.storeState}
              onChange={e => { set('storeState', e.target.value); clearError('storeState') }}
            />
          </Field>
          <Field label="ZIP" required error={errors.storeZip}>
            <Input
              value={fd.storeZip}
              error={errors.storeZip}
              onChange={v => { set('storeZip', v); clearError('storeZip') }}
            />
          </Field>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={fd.mailSame}
              onChange={e => set('mailSame', e.target.checked)}
            />
            Mailing address same as store address
          </label>
        </div>
      </div>

      {!fd.mailSame && (
        <div className="form-section-inner">
          <span className="inner-legend">Mailing Address</span>
          <Field label="Street Address" required error={errors.mailingAddress}>
            <Input
              value={fd.mailingAddress}
              error={errors.mailingAddress}
              onChange={v => { set('mailingAddress', v); clearError('mailingAddress') }}
            />
          </Field>
          <div className="form-row">
            <Field label="City" required error={errors.mailingCity}>
              <Input
                value={fd.mailingCity}
                error={errors.mailingCity}
                onChange={v => { set('mailingCity', v); clearError('mailingCity') }}
              />
            </Field>
            <Field label="State" required error={errors.mailingState}>
              <StateSelect
                className={`form-select${errors.mailingState ? ' input-error' : ''}`}
                value={fd.mailingState}
                onChange={e => { set('mailingState', e.target.value); clearError('mailingState') }}
              />
            </Field>
            <Field label="ZIP" required error={errors.mailingZip}>
              <Input
                value={fd.mailingZip}
                error={errors.mailingZip}
                onChange={v => { set('mailingZip', v); clearError('mailingZip') }}
              />
            </Field>
          </div>
        </div>
      )}
    </fieldset>
  )
}

function Section2({ fd, setOwner, addOwner, removeOwner, uploadDocument, handleDocFilesChange, applicationId, openDocument, downloadCombinedPdf, errors, clearError }) {

  return (
    <fieldset className="form-section">
      <legend>Owners / Officers</legend>
      {fd.owners.map((owner, idx) => (
        <div key={idx} className="form-section-inner">
          <div className="inner-section-header">
            <span className="inner-legend">Owner {idx + 1}</span>
            {fd.owners.length > 1 && (
              <button type="button" className="remove-button" onClick={() => removeOwner(idx)}>
                Remove
              </button>
            )}
          </div>
          <div className="form-row">
            <Field label="Full Name" required error={errors[`owner_${idx}_name`]}>
              <input
                className={`form-input${errors[`owner_${idx}_name`] ? ' input-error' : ''}`}
                value={owner.ownerName}
                onChange={e => { setOwner(idx, 'ownerName', e.target.value); clearError(`owner_${idx}_name`) }}
              />
            </Field>
            <Field label="Title" error={errors[`owner_${idx}_title`]}>
              <input
                className={`form-input${errors[`owner_${idx}_title`] ? ' input-error' : ''}`}
                value={owner.ownerTitle}
                onChange={e => { setOwner(idx, 'ownerTitle', e.target.value); clearError(`owner_${idx}_title`) }}
              />
            </Field>
            <Field label="Ownership %">
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                value={owner.ownerPct}
                onChange={e => setOwner(idx, 'ownerPct', e.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Phone">
              <input
                className="form-input"
                type="tel"
                value={owner.ownerPhone}
                onChange={e => setOwner(idx, 'ownerPhone', e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className="form-input"
                type="email"
                value={owner.ownerEmail}
                onChange={e => setOwner(idx, 'ownerEmail', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              className="form-input"
              value={owner.ownerAddr}
              onChange={e => setOwner(idx, 'ownerAddr', e.target.value)}
            />
          </Field>
          <Field label="Driver License #">
            <input
              className="form-input"
              value={owner.ownerDl}
              onChange={e => setOwner(idx, 'ownerDl', e.target.value)}
            />
          </Field>
          <MultiFileUploader
            slot={{ id: `owner_${idx}_photo`, title: 'Photo ID', required: false, description: "Upload a photo ID for this owner." }}
            files={(fd.documents?.[`owner_${idx}_photo`]) || []}
            applicationId={applicationId}
            onFilesChange={handleDocFilesChange}
            uploadDocument={uploadDocument}
            removeDocument={() => {}}
            openDocument={openDocument}
            downloadCombinedPdf={downloadCombinedPdf}
          />
        </div>
      ))}
      <button type="button" className="add-button" onClick={addOwner}>
        + Add Owner
      </button>
    </fieldset>
  )
}

function Section3({ fd, set, uploadDocument, handleDocFilesChange, applicationId, openDocument, downloadCombinedPdf, errors, clearError }) {

  return (
    <fieldset className="form-section">
      <legend>Permits</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Sales Tax Permit</span>
        <div className="form-row">
          <Field label="Sales Tax Permit No." required error={errors.salesTaxPermitNo}>
            <input
              className={`form-input${errors.salesTaxPermitNo ? ' input-error' : ''}`}
              value={fd.salesTaxPermitNo}
              onChange={e => { set('salesTaxPermitNo', e.target.value); clearError('salesTaxPermitNo') }}
            />
          </Field>
        </div>
        <MultiFileUploader
          slot={{ id: 'tax_permit', title: 'Sales Tax Permit', required: false, description: 'Upload a copy of your sales tax permit.' }}
          files={(fd.documents?.tax_permit) || []}
          applicationId={applicationId}
          onFilesChange={handleDocFilesChange}
          uploadDocument={uploadDocument}
          removeDocument={() => {}}
          openDocument={openDocument}
          downloadCombinedPdf={downloadCombinedPdf}
        />

        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={fd.hasTobacco} onChange={e => set('hasTobacco', e.target.checked)} />
            We sell tobacco products (tobacco permit required)
          </label>
        </div>

        {fd.hasTobacco && (
          <>
            <div className="form-row">
              <Field label="Tobacco Permit No.">
                <input className="form-input" value={fd.tobaccoPermitNo} onChange={e => set('tobaccoPermitNo', e.target.value)} />
              </Field>
              <Field label="Expiry Date">
                <input className="form-input" type="date" value={fd.tobaccoPermitExpiry} onChange={e => set('tobaccoPermitExpiry', e.target.value)} />
              </Field>
            </div>
            <MultiFileUploader
              slot={{ id: 'tobacco_permit', title: 'Tobacco Permit', required: false, description: 'Upload a copy of your tobacco permit.' }}
              files={(fd.documents?.tobacco_permit) || []}
              applicationId={applicationId}
              onFilesChange={handleDocFilesChange}
              uploadDocument={uploadDocument}
              removeDocument={() => {}}
              openDocument={openDocument}
              downloadCombinedPdf={downloadCombinedPdf}
            />
          </>
        )}
      </div>
    </fieldset>
  )
}

function Section4({ fd, set, errors, clearError }) {
  const toggleCat = useCallback((cat) => {
    const cats = fd.categories || []
    set('categories', cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat])
    clearError('categories')
  }, [fd.categories, set, clearError])

  return (
    <fieldset className="form-section">
      <legend>Purchasing Information</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Purchase Details</span>
        <div className="form-row">
          <Field label="Estimated Monthly Purchase Volume ($)" required error={errors.purchaseVolume}>
            <input
              className={`form-input${errors.purchaseVolume ? ' input-error' : ''}`}
              type="number"
              min="0"
              value={fd.purchaseVolume}
              onChange={e => { set('purchaseVolume', e.target.value); clearError('purchaseVolume') }}
            />
          </Field>
          <Field label="Desired Start Date">
            <input className="form-input" type="date" value={fd.startDate} onChange={e => set('startDate', e.target.value)} />
          </Field>
        </div>
        <Field label="Product Categories" required hint="Select all that apply">
          <div className="gf-categories">
            {CATEGORIES.map(cat => (
              <label key={cat} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(fd.categories || []).includes(cat)}
                  onChange={() => toggleCat(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </Field>
        {errors.categories && <span className="error-text">{errors.categories}</span>}
      </div>
    </fieldset>
  )
}

function Section5({ fd, set, errors, clearError }) {
  return (
    <fieldset className="form-section">
      <legend>Resale Certificate</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Resale Certificate</span>
        <p style={{ fontSize: 13, color: 'var(--ghra-muted)', margin: '0 0 16px 0' }}>
          This certificate is required by the Texas Comptroller for tax-exempt wholesale purchases.
        </p>
        <div className="form-row">
          <Field label="Business Name" required error={errors.rcName}>
            <input
              className={`form-input${errors.rcName ? ' input-error' : ''}`}
              value={fd.rcName}
              onChange={e => { set('rcName', e.target.value); clearError('rcName') }}
            />
          </Field>
          <Field label="Texas Sales Tax Permit No." required error={errors.rcPermit}>
            <input
              className={`form-input${errors.rcPermit ? ' input-error' : ''}`}
              value={fd.rcPermit}
              onChange={e => { set('rcPermit', e.target.value); clearError('rcPermit') }}
            />
          </Field>
          <Field label="Phone" required error={errors.rcPhone}>
            <input
              className={`form-input${errors.rcPhone ? ' input-error' : ''}`}
              type="tel"
              value={fd.rcPhone}
              onChange={e => { set('rcPhone', e.target.value); clearError('rcPhone') }}
            />
          </Field>
        </div>
        <Field label="Items to be Purchased for Resale" required error={errors.rcItems}>
          <input
            className={`form-input${errors.rcItems ? ' input-error' : ''}`}
            value={fd.rcItems}
            onChange={e => { set('rcItems', e.target.value); clearError('rcItems') }}
            placeholder="e.g. Tobacco, beverages, general merchandise"
          />
        </Field>
        <Field label="Type of Business / Activity" required error={errors.rcActivity}>
          <input
            className={`form-input${errors.rcActivity ? ' input-error' : ''}`}
            value={fd.rcActivity}
            onChange={e => { set('rcActivity', e.target.value); clearError('rcActivity') }}
            placeholder="e.g. Convenience store retail sales"
          />
        </Field>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={fd.rcAck}
              onChange={e => { set('rcAck', e.target.checked); clearError('rcAck') }}
            />
            I/We certify that all purchases made under this certificate are for resale in the normal course of business.
          </label>
          {errors.rcAck && <span className="error-text">{errors.rcAck}</span>}
        </div>
      </div>
    </fieldset>
  )
}

function Section6({ fd, set, errors, clearError }) {
  return (
    <fieldset className="form-section">
      <legend>Authorization &amp; Electronic Signature</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Authorization</span>
        <div className="form-row">
          <Field label="Signer Name" required error={errors.signerName}>
            <input
              className={`form-input${errors.signerName ? ' input-error' : ''}`}
              value={fd.signerName}
              onChange={e => { set('signerName', e.target.value); clearError('signerName') }}
            />
          </Field>
          <Field label="Title" required error={errors.signerTitle}>
            <input
              className={`form-input${errors.signerTitle ? ' input-error' : ''}`}
              value={fd.signerTitle}
              onChange={e => { set('signerTitle', e.target.value); clearError('signerTitle') }}
            />
          </Field>
        </div>
        <Field label="Signature" required hint="Draw your signature below">
          <SignaturePad
            value={fd.signatureData}
            onChange={v => { set('signatureData', v); if (v) clearError('signatureData') }}
          />
        </Field>
        {errors.signatureData && <span className="error-text">{errors.signatureData}</span>}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={fd.agreeTerms}
              onChange={e => { set('agreeTerms', e.target.checked); clearError('agreeTerms') }}
            />
            I agree to the GHRA warehouse membership terms and conditions.
          </label>
          {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={fd.esign}
              onChange={e => { set('esign', e.target.checked); clearError('esign') }}
            />
            I consent to the use of an electronic signature for this application.
          </label>
          {errors.esign && <span className="error-text">{errors.esign}</span>}
        </div>
      </div>
    </fieldset>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function WarehouseApplicationForm() {
  const { id: routeId }   = useParams()
  const navigate          = useNavigate()
  const {
    saveWarehouseDraft,
    submitWarehouseApplication,
    getWarehouseApplication,
    uploadWarehouseDocument,
    currentUser,
    openDocument,
    downloadCombinedPdf,
  } = useContext(AuthContext)

  const isNew = !routeId || routeId === 'new'

  const [formData,     setFormData]     = useState(blankForm)
  const [appId,        setAppId]        = useState(isNew ? null : routeId)
  const [currentStep,  setCurrentStep]  = useState(1)
  const [loading,      setLoading]      = useState(!isNew)
  const [saving,       setSaving]       = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [errors,       setErrors]       = useState({})
  const [toast,        setToast]        = useState('')
  const [saveError,    setSaveError]    = useState(null)
  const [submitted,    setSubmitted]    = useState(false)
  const [readOnly,     setReadOnly]     = useState(false)
  const [appStatus,    setAppStatus]    = useState('')
  const [appSubmittedAt, setAppSubmittedAt] = useState(null)
  const [appNotes,     setAppNotes]     = useState('')

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    getWarehouseApplication(routeId).then(data => {
      if (data?.formData) {
        const loaded = { ...blankForm(), ...data.formData }
        // Backfill documents from legacy single-URL fields
        const docs = { ...(loaded.documents || {}) }
        if (loaded.salesTaxPermitUrl && !(docs.tax_permit || []).length) {
          docs.tax_permit = [{ url: loaded.salesTaxPermitUrl, filename: 'tax_permit', originalName: 'tax_permit' }]
        }
        if (loaded.tobaccoPermitUrl && !(docs.tobacco_permit || []).length) {
          docs.tobacco_permit = [{ url: loaded.tobaccoPermitUrl, filename: 'tobacco_permit', originalName: 'tobacco_permit' }]
        }
        ;(loaded.owners || []).forEach((o, i) => {
          if (o.photoIdUrl && !(docs[`owner_${i}_photo`] || []).length) {
            docs[`owner_${i}_photo`] = [{ url: o.photoIdUrl, filename: `owner_${i}_photo`, originalName: `owner_${i}_photo` }]
          }
        })
        loaded.documents = docs
        setFormData(loaded)
      }
      if (data) {
        setReadOnly(data.Status !== 'draft')
        setAppStatus(data.Status || '')
        setAppSubmittedAt(data.SubmittedAt || null)
        setAppNotes(data.Notes || '')
      }
      setLoading(false)
    })
  }, [routeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const set = useCallback((key, value) => {
    const v = typeof value === 'string' && WAREHOUSE_TEXT_UPPERCASE.has(key) ? value.toUpperCase() : value
    setFormData(fd => ({ ...fd, [key]: v }))
  }, [])

  const clearError = useCallback((key) => {
    setErrors(prev => prev[key] ? { ...prev, [key]: '' } : prev)
  }, [])

  const setOwner = useCallback((idx, key, value) => {
    const v = typeof value === 'string' && WAREHOUSE_OWNER_TEXT_UPPERCASE.has(key) ? value.toUpperCase() : value
    setFormData(fd => {
      const owners = fd.owners.map((o, i) => i === idx ? { ...o, [key]: v } : o)
      return { ...fd, owners }
    })
  }, [])

  const addOwner = useCallback(() => {
    setFormData(fd => ({ ...fd, owners: [...fd.owners, { ...BLANK_OWNER }] }))
  }, [])

  const removeOwner = useCallback((idx) => {
    setFormData(fd => ({ ...fd, owners: fd.owners.filter((_, i) => i !== idx) }))
  }, [])

  const handleStepClick = useCallback((stepId) => {
    setCurrentStep(stepId)
    window.scrollTo(0, 0)
  }, [])

  const uploadDocumentFn = useCallback(async (currentAppId, slotId, file) => {
    const result = await uploadWarehouseDocument(currentAppId, slotId, file)
    if (!result.success) throw new Error(result.error || 'Upload failed')
    return { url: result.url, filename: result.filename, originalName: file.name }
  }, [uploadWarehouseDocument])

  const handleDocFilesChange = useCallback((slotId, newFiles) => {
    setFormData(prev => {
      const docs = { ...(prev.documents || {}), [slotId]: newFiles }
      const updates = { documents: docs }
      if (slotId === 'tax_permit') updates.salesTaxPermitUrl = newFiles[0]?.url || ''
      if (slotId === 'tobacco_permit') updates.tobaccoPermitUrl = newFiles[0]?.url || ''
      const ownerMatch = slotId.match(/^owner_(\d+)_photo$/)
      if (ownerMatch) {
        const idx = parseInt(ownerMatch[1], 10)
        updates.owners = prev.owners.map((o, i) => i === idx ? { ...o, photoIdUrl: newFiles[0]?.url || '' } : o)
      }
      return { ...prev, ...updates }
    })
  }, [])

  const ensureDraft = useCallback(async (fd) => {
    if (appId) return appId
    const result = await saveWarehouseDraft(null, fd)
    if (result.success) { setAppId(result.id); return result.id }
    return null
  }, [appId, saveWarehouseDraft])

  const handleSave = useCallback(async () => {
    const stepErrors = computeStepErrors(currentStep, formData)
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
    setSaving(true)
    try {
      const currentId = await ensureDraft(formData)
      const result = await saveWarehouseDraft(currentId, formData)
      if (!result.success) { setSaveError(result.error || 'Failed to save'); return }
      if (!appId && result.id) setAppId(result.id)
      if (currentStep < STEPS.length) setCurrentStep(s => s + 1)
    } finally {
      setSaving(false)
    }
  }, [currentStep, formData, ensureDraft, appId, saveWarehouseDraft])

  const handlePrev = useCallback(() => {
    setErrors({})
    setSaveError(null)
    setCurrentStep(s => s - 1)
  }, [])

  const handleSubmit = useCallback(async () => {
    const stepErrors = computeStepErrors(currentStep, formData)
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
      const currentId = appId || (await ensureDraft(formData))
      const result = await submitWarehouseApplication(currentId, formData)
      if (!result.success) { setSaveError(result.error || 'Submission failed'); return }
      setSubmitted(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    } finally {
      setSubmitting(false)
    }
  }, [currentStep, formData, appId, ensureDraft, submitWarehouseApplication, navigate])

  if (loading) {
    return (
      <div className="gf-container">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ghra-slate)' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="gf-container">
        <div className="gf-success-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2>Application Submitted</h2>
          <p>Your warehouse account application has been submitted. Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  const sectionProps = { fd: formData, set, errors, clearError }

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
          {currentStep > 1 && (
            <button
              type="button"
              className="nav-button prev-button"
              onClick={handlePrev}
              disabled={saving}
            >
              Previous
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
            {currentStep < STEPS.length ? (
              <button
                type="button"
                className="nav-button next-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            ) : (
              <button
                type="button"
                className="nav-button next-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
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
        title="GHRA Warehouse Account Application"
        steps={STEPS}
        currentStep={currentStep}
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
          {currentStep === 1 && <Section1 {...sectionProps} />}
          {currentStep === 2 && (
            <Section2
              fd={formData}
              setOwner={setOwner}
              addOwner={addOwner}
              removeOwner={removeOwner}
              uploadDocument={uploadDocumentFn}
              handleDocFilesChange={handleDocFilesChange}
              applicationId={appId}
              openDocument={openDocument}
              downloadCombinedPdf={downloadCombinedPdf}
              errors={errors}
              clearError={clearError}
            />
          )}
          {currentStep === 3 && (
            <Section3
              fd={formData}
              set={set}
              uploadDocument={uploadDocumentFn}
              handleDocFilesChange={handleDocFilesChange}
              applicationId={appId}
              openDocument={openDocument}
              downloadCombinedPdf={downloadCombinedPdf}
              errors={errors}
              clearError={clearError}
            />
          )}
          {currentStep === 4 && <Section4 {...sectionProps} />}
          {currentStep === 5 && <Section5 {...sectionProps} />}
          {currentStep === 6 && <Section6 {...sectionProps} />}
        </div>
      </FormShell>
    </>
  )
}

export default WarehouseApplicationForm
