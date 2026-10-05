import { useContext, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import SignaturePad from './SignaturePad'
import '../styles/WarehouseApplicationForm.css'
import '../styles/MembershipForm.css'
import '../styles/ProgressIndicator.css'

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Business Info' },
  { id: 2, title: 'Owners' },
  { id: 3, title: 'Permits' },
  { id: 4, title: 'Purchasing' },
  { id: 5, title: 'Resale Cert.' },
  { id: 6, title: 'Sign' },
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

function blankForm() {
  return {
    // Section 1
    legalName: '', entityType: '', entityTypeOther: '', dbaName: '', ein: '',
    businessStarted: '', numLocations: '', businessPhone: '', businessEmail: '', primaryContact: '',
    storeAddress: '', storeCity: '', storeState: 'TX', storeZip: '',
    mailSame: true, mailingAddress: '', mailingCity: '', mailingState: '', mailingZip: '',
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
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateStep(step, fd) {
  const req = (val) => !val || !String(val).trim()
  switch (step) {
    case 1: {
      const missing = []
      if (req(fd.legalName))       missing.push('Legal name')
      if (req(fd.entityType))      missing.push('Entity type')
      if (req(fd.dbaName))         missing.push('DBA name')
      if (req(fd.numLocations))    missing.push('Number of locations')
      if (req(fd.businessPhone))   missing.push('Business phone')
      if (req(fd.businessEmail))   missing.push('Business email')
      if (req(fd.primaryContact))  missing.push('Primary contact')
      if (req(fd.storeAddress))    missing.push('Store address')
      if (req(fd.storeCity))       missing.push('City')
      if (req(fd.storeState))      missing.push('State')
      if (req(fd.storeZip))        missing.push('ZIP')
      if (!fd.mailSame) {
        if (req(fd.mailingAddress)) missing.push('Mailing address')
        if (req(fd.mailingCity))    missing.push('Mailing city')
        if (req(fd.mailingState))   missing.push('Mailing state')
        if (req(fd.mailingZip))     missing.push('Mailing ZIP')
      }
      return missing.length ? `Required: ${missing.join(', ')}` : null
    }
    case 2: {
      const bad = fd.owners.findIndex(o => req(o.ownerName) || req(o.ownerTitle))
      return bad !== -1 ? `Owner ${bad + 1}: name and title are required` : null
    }
    case 3:
      return req(fd.salesTaxPermitNo) ? 'Sales tax permit number is required' : null
    case 4:
      if (req(fd.purchaseVolume)) return 'Estimated purchase volume is required'
      if (!fd.categories || fd.categories.length === 0) return 'Select at least one product category'
      return null
    case 5: {
      const m5 = []
      if (req(fd.rcName))     m5.push('Business name')
      if (req(fd.rcPermit))   m5.push('Permit number')
      if (req(fd.rcPhone))    m5.push('Phone')
      if (req(fd.rcItems))    m5.push('Items purchased')
      if (req(fd.rcActivity)) m5.push('Activity description')
      if (!fd.rcAck)          m5.push('Acknowledgement checkbox')
      return m5.length ? `Required: ${m5.join(', ')}` : null
    }
    case 6: {
      if (req(fd.signerName))     return 'Signer name is required'
      if (req(fd.signerTitle))    return 'Signer title is required'
      if (!fd.signatureData)      return 'Signature is required'
      if (!fd.agreeTerms)         return 'You must agree to the terms'
      if (!fd.esign)              return 'You must consent to electronic signature'
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
        {label}{required && <span style={{ color: 'var(--ghra-red)' }}> *</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--ghra-muted)' }}>{hint}</span>}
    </div>
  )
}

function Input({ value, onChange, ...rest }) {
  return (
    <input
      className="form-input"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      {...rest}
    />
  )
}

function Select({ value, onChange, options, placeholder, ...rest }) {
  return (
    <select
      className="form-select"
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

function Section1({ fd, set }) {
  return (
    <>
      <p className="wh-section-title">Business Information</p>
      <div className="wh-row">
        <Field label="Legal Business Name" required>
          <Input value={fd.legalName} onChange={v => set('legalName', v)} />
        </Field>
        <Field label="DBA Name" required>
          <Input value={fd.dbaName} onChange={v => set('dbaName', v)} />
        </Field>
      </div>
      <div className="wh-row">
        <Field label="Entity Type" required>
          <Select
            value={fd.entityType}
            onChange={v => set('entityType', v)}
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
      <div className="wh-row">
        <Field label="Business Start Date">
          <Input type="date" value={fd.businessStarted} onChange={v => set('businessStarted', v)} />
        </Field>
        <Field label="Number of Locations" required>
          <Input type="number" min="1" value={fd.numLocations} onChange={v => set('numLocations', v)} />
        </Field>
      </div>
      <div className="wh-row">
        <Field label="Business Phone" required>
          <Input type="tel" value={fd.businessPhone} onChange={v => set('businessPhone', v)} />
        </Field>
        <Field label="Business Email" required>
          <Input type="email" value={fd.businessEmail} onChange={v => set('businessEmail', v)} />
        </Field>
        <Field label="Primary Contact" required>
          <Input value={fd.primaryContact} onChange={v => set('primaryContact', v)} />
        </Field>
      </div>

      <p className="wh-section-title" style={{ marginTop: 24 }}>Store Address</p>
      <Field label="Street Address" required>
        <Input value={fd.storeAddress} onChange={v => set('storeAddress', v)} />
      </Field>
      <div className="wh-row">
        <Field label="City" required>
          <Input value={fd.storeCity} onChange={v => set('storeCity', v)} />
        </Field>
        <Field label="State" required>
          <Input value={fd.storeState} onChange={v => set('storeState', v)} maxLength={2} />
        </Field>
        <Field label="ZIP" required>
          <Input value={fd.storeZip} onChange={v => set('storeZip', v)} />
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

      {!fd.mailSame && (
        <>
          <p className="wh-section-title" style={{ marginTop: 16 }}>Mailing Address</p>
          <Field label="Street Address" required>
            <Input value={fd.mailingAddress} onChange={v => set('mailingAddress', v)} />
          </Field>
          <div className="wh-row">
            <Field label="City" required>
              <Input value={fd.mailingCity} onChange={v => set('mailingCity', v)} />
            </Field>
            <Field label="State" required>
              <Input value={fd.mailingState} onChange={v => set('mailingState', v)} maxLength={2} />
            </Field>
            <Field label="ZIP" required>
              <Input value={fd.mailingZip} onChange={v => set('mailingZip', v)} />
            </Field>
          </div>
        </>
      )}
    </>
  )
}

function Section2({ fd, setOwner, addOwner, removeOwner, appId, uploadWarehouseDocument }) {
  const [uploadStatus, setUploadStatus] = useState({})

  const handlePhotoUpload = async (idx, file) => {
    if (!file) return
    if (!appId) { setUploadStatus(s => ({ ...s, [`owner_${idx}`]: { state: 'error', msg: 'Save draft first to enable uploads' } })); return }
    setUploadStatus(s => ({ ...s, [`owner_${idx}`]: { state: 'uploading' } }))
    const result = await uploadWarehouseDocument(appId, `owner_${idx}_photo`, file)
    if (result.success) {
      setOwner(idx, 'photoIdUrl', result.url)
      setUploadStatus(s => ({ ...s, [`owner_${idx}`]: { state: 'ok', msg: `Uploaded: ${result.filename}` } }))
    } else {
      setUploadStatus(s => ({ ...s, [`owner_${idx}`]: { state: 'error', msg: result.error || 'Upload failed' } }))
    }
  }

  return (
    <>
      <p className="wh-section-title">Owners / Officers</p>
      {fd.owners.map((owner, idx) => (
        <div key={idx} className="wh-owner-card">
          <div className="wh-owner-header">
            <span className="wh-owner-label">Owner {idx + 1}</span>
            {fd.owners.length > 1 && (
              <button type="button" className="wh-btn wh-btn-danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => removeOwner(idx)}>
                Remove
              </button>
            )}
          </div>
          <div className="wh-row">
            <Field label="Full Name" required>
              <Input value={owner.ownerName} onChange={v => setOwner(idx, 'ownerName', v)} />
            </Field>
            <Field label="Title" required>
              <Input value={owner.ownerTitle} onChange={v => setOwner(idx, 'ownerTitle', v)} />
            </Field>
            <Field label="Ownership %">
              <Input type="number" min="0" max="100" value={owner.ownerPct} onChange={v => setOwner(idx, 'ownerPct', v)} />
            </Field>
          </div>
          <div className="wh-row">
            <Field label="Phone">
              <Input type="tel" value={owner.ownerPhone} onChange={v => setOwner(idx, 'ownerPhone', v)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={owner.ownerEmail} onChange={v => setOwner(idx, 'ownerEmail', v)} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={owner.ownerAddr} onChange={v => setOwner(idx, 'ownerAddr', v)} />
          </Field>
          <Field label="Driver License #">
            <Input value={owner.ownerDl} onChange={v => setOwner(idx, 'ownerDl', v)} />
          </Field>
          <Field label="Photo ID Upload">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handlePhotoUpload(idx, e.target.files[0])} />
            {uploadStatus[`owner_${idx}`] && (
              <div className={`wh-upload-status ${uploadStatus[`owner_${idx}`].state}`}>
                {uploadStatus[`owner_${idx}`].state === 'uploading' ? 'Uploading...' : uploadStatus[`owner_${idx}`].msg}
              </div>
            )}
          </Field>
        </div>
      ))}
      <button type="button" className="wh-btn wh-btn-secondary" onClick={addOwner}>
        + Add Owner
      </button>
    </>
  )
}

function Section3({ fd, set, appId, uploadWarehouseDocument }) {
  const [taxStatus,   setTaxStatus]   = useState(null)
  const [tobacStatus, setTobacStatus] = useState(null)

  const handleTaxUpload = async (file) => {
    if (!file) return
    if (!appId) { setTaxStatus({ state: 'error', msg: 'Save draft first to enable uploads' }); return }
    setTaxStatus({ state: 'uploading' })
    const r = await uploadWarehouseDocument(appId, 'tax_permit', file)
    if (r.success) { set('salesTaxPermitUrl', r.url); setTaxStatus({ state: 'ok', msg: `Uploaded: ${r.filename}` }) }
    else setTaxStatus({ state: 'error', msg: r.error || 'Upload failed' })
  }

  const handleTobacUpload = async (file) => {
    if (!file) return
    if (!appId) { setTobacStatus({ state: 'error', msg: 'Save draft first to enable uploads' }); return }
    setTobacStatus({ state: 'uploading' })
    const r = await uploadWarehouseDocument(appId, 'tobacco_permit', file)
    if (r.success) { set('tobaccoPermitUrl', r.url); setTobacStatus({ state: 'ok', msg: `Uploaded: ${r.filename}` }) }
    else setTobacStatus({ state: 'error', msg: r.error || 'Upload failed' })
  }

  return (
    <>
      <p className="wh-section-title">Permits</p>
      <div className="wh-row">
        <Field label="Sales Tax Permit No." required>
          <Input value={fd.salesTaxPermitNo} onChange={v => set('salesTaxPermitNo', v)} />
        </Field>
      </div>
      <Field label="Sales Tax Permit (upload)">
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleTaxUpload(e.target.files[0])} />
        {taxStatus && (
          <div className={`wh-upload-status ${taxStatus.state}`}>
            {taxStatus.state === 'uploading' ? 'Uploading...' : taxStatus.msg}
          </div>
        )}
      </Field>

      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.hasTobacco} onChange={e => set('hasTobacco', e.target.checked)} />
          We sell tobacco products (tobacco permit required)
        </label>
      </div>

      {fd.hasTobacco && (
        <>
          <div className="wh-row">
            <Field label="Tobacco Permit No.">
              <Input value={fd.tobaccoPermitNo} onChange={v => set('tobaccoPermitNo', v)} />
            </Field>
            <Field label="Expiry Date">
              <Input type="date" value={fd.tobaccoPermitExpiry} onChange={v => set('tobaccoPermitExpiry', v)} />
            </Field>
          </div>
          <Field label="Tobacco Permit (upload)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleTobacUpload(e.target.files[0])} />
            {tobacStatus && (
              <div className={`wh-upload-status ${tobacStatus.state}`}>
                {tobacStatus.state === 'uploading' ? 'Uploading...' : tobacStatus.msg}
              </div>
            )}
          </Field>
        </>
      )}
    </>
  )
}

function Section4({ fd, set }) {
  const toggleCat = useCallback((cat) => {
    const cats = fd.categories || []
    set('categories', cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat])
  }, [fd.categories, set])

  return (
    <>
      <p className="wh-section-title">Purchasing Information</p>
      <div className="wh-row">
        <Field label="Estimated Monthly Purchase Volume ($)" required>
          <Input type="number" min="0" value={fd.purchaseVolume} onChange={v => set('purchaseVolume', v)} />
        </Field>
        <Field label="Desired Start Date">
          <Input type="date" value={fd.startDate} onChange={v => set('startDate', v)} />
        </Field>
      </div>
      <Field label="Product Categories" required hint="Select all that apply">
        <div className="wh-categories">
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
    </>
  )
}

function Section5({ fd, set }) {
  return (
    <>
      <p className="wh-section-title">Resale Certificate</p>
      <p style={{ fontSize: 13, color: 'var(--ghra-muted)', marginBottom: 16 }}>
        This certificate is required by the Texas Comptroller for tax-exempt wholesale purchases.
      </p>
      <div className="wh-row">
        <Field label="Business Name" required>
          <Input value={fd.rcName} onChange={v => set('rcName', v)} />
        </Field>
        <Field label="Texas Sales Tax Permit No." required>
          <Input value={fd.rcPermit} onChange={v => set('rcPermit', v)} />
        </Field>
        <Field label="Phone" required>
          <Input type="tel" value={fd.rcPhone} onChange={v => set('rcPhone', v)} />
        </Field>
      </div>
      <Field label="Items to be Purchased for Resale" required>
        <Input value={fd.rcItems} onChange={v => set('rcItems', v)} placeholder="e.g. Tobacco, beverages, general merchandise" />
      </Field>
      <Field label="Type of Business / Activity" required>
        <Input value={fd.rcActivity} onChange={v => set('rcActivity', v)} placeholder="e.g. Convenience store retail sales" />
      </Field>
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.rcAck} onChange={e => set('rcAck', e.target.checked)} />
          I/We certify that all purchases made under this certificate are for resale in the normal course of business.
        </label>
      </div>
    </>
  )
}

function Section6({ fd, set }) {
  return (
    <>
      <p className="wh-section-title">Authorization &amp; Electronic Signature</p>
      <div className="wh-row">
        <Field label="Signer Name" required>
          <Input value={fd.signerName} onChange={v => set('signerName', v)} />
        </Field>
        <Field label="Title" required>
          <Input value={fd.signerTitle} onChange={v => set('signerTitle', v)} />
        </Field>
      </div>
      <Field label="Signature" required hint="Draw your signature below">
        <SignaturePad
          value={fd.signatureData}
          onChange={v => set('signatureData', v)}
        />
      </Field>
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} />
          I agree to the GHRA warehouse membership terms and conditions.
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={fd.esign} onChange={e => set('esign', e.target.checked)} />
          I consent to the use of an electronic signature for this application.
        </label>
      </div>
    </>
  )
}

// ── Step indicator (inlined, mirrors ProgressIndicator) ───────────────────────

function StepBar({ currentStep }) {
  return (
    <div className="progress-container">
      <div className="step-summary">Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.title}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
      </div>
      <div className="steps-indicator">
        {STEPS.map(s => (
          <div
            key={s.id}
            className={`step-indicator ${s.id === currentStep ? 'active' : ''} ${s.id < currentStep ? 'completed' : ''}`}
          >
            <div className="step-circle">{s.id < currentStep ? '✓' : s.id}</div>
            <p className="step-title">
              <span className="step-title-full">{s.title}</span>
              <span className="step-title-short">{s.title}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
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
  } = useContext(AuthContext)

  const isNew = !routeId || routeId === 'new'

  const [formData,    setFormData]    = useState(blankForm)
  const [appId,       setAppId]       = useState(isNew ? null : routeId)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading,     setLoading]     = useState(!isNew)
  const [saving,      setSaving]      = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [stepError,   setStepError]   = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitted,   setSubmitted]   = useState(false)

  // Load existing draft
  useEffect(() => {
    if (isNew) return
    setLoading(true)
    getWarehouseApplication(routeId).then(data => {
      if (data?.formData) setFormData(fd => ({ ...blankForm(), ...data.formData }))
      setLoading(false)
    })
  }, [routeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((key, value) => {
    setFormData(fd => ({ ...fd, [key]: value }))
  }, [])

  const setOwner = useCallback((idx, key, value) => {
    setFormData(fd => {
      const owners = fd.owners.map((o, i) => i === idx ? { ...o, [key]: value } : o)
      return { ...fd, owners }
    })
  }, [])

  const addOwner = useCallback(() => {
    setFormData(fd => ({ ...fd, owners: [...fd.owners, { ...BLANK_OWNER }] }))
  }, [])

  const removeOwner = useCallback((idx) => {
    setFormData(fd => ({ ...fd, owners: fd.owners.filter((_, i) => i !== idx) }))
  }, [])

  // Ensure draft exists before file uploads (returns current appId or newly created one)
  const ensureDraft = useCallback(async (fd) => {
    if (appId) return appId
    const result = await saveWarehouseDraft(null, fd)
    if (result.success) { setAppId(result.id); return result.id }
    return null
  }, [appId, saveWarehouseDraft])

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const err = validateStep(currentStep, formData)
    if (err) { setStepError(err); return }
    setStepError(null)
    setSaving(true)
    const currentId = await ensureDraft(formData)
    const result = await saveWarehouseDraft(currentId, formData)
    setSaving(false)
    if (!result.success) { setStepError(result.error || 'Failed to save'); return }
    if (!appId && result.id) setAppId(result.id)
    if (currentStep < STEPS.length) setCurrentStep(s => s + 1)
  }, [currentStep, formData, ensureDraft, appId, saveWarehouseDraft])

  const handlePrev = useCallback(() => {
    setStepError(null)
    setCurrentStep(s => s - 1)
  }, [])

  const handleSubmit = useCallback(async () => {
    const err = validateStep(currentStep, formData)
    if (err) { setStepError(err); return }
    setStepError(null)
    setSubmitting(true)
    setSubmitError(null)
    const currentId = appId || (await ensureDraft(formData))
    const result = await submitWarehouseApplication(currentId, formData)
    setSubmitting(false)
    if (!result.success) { setSubmitError(result.error || 'Submission failed'); return }
    setSubmitted(true)
    setTimeout(() => navigate('/dashboard'), 2500)
  }, [currentStep, formData, appId, ensureDraft, submitWarehouseApplication, navigate])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ghra-slate)' }}>Loading...</div>

  if (submitted) {
    return (
      <div className="wh-container">
        <div className="wh-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ color: '#27ae60', marginBottom: 12 }}>Application Submitted</h2>
          <p style={{ color: 'var(--ghra-muted)', fontSize: 14 }}>
            Your warehouse account application has been submitted. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  const sectionProps = { fd: formData, set }

  return (
    <div className="wh-container">
      <div className="wh-header">
        <h1>Warehouse Account Application</h1>
        <p>Logged in as {currentUser?.email}</p>
      </div>

      <StepBar currentStep={currentStep} />

      <div className="wh-card">
        <div className="wh-section-body">
          {currentStep === 1 && <Section1 {...sectionProps} />}
          {currentStep === 2 && (
            <Section2
              fd={formData}
              setOwner={setOwner}
              addOwner={addOwner}
              removeOwner={removeOwner}
              appId={appId}
              uploadWarehouseDocument={uploadWarehouseDocument}
            />
          )}
          {currentStep === 3 && (
            <Section3
              fd={formData}
              set={set}
              appId={appId}
              uploadWarehouseDocument={uploadWarehouseDocument}
            />
          )}
          {currentStep === 4 && <Section4 {...sectionProps} />}
          {currentStep === 5 && <Section5 {...sectionProps} />}
          {currentStep === 6 && <Section6 {...sectionProps} />}

          {stepError && <p className="wh-error-msg">{stepError}</p>}
          {submitError && <p className="wh-error-msg">{submitError}</p>}
        </div>

        <div className="wh-nav">
          <button
            type="button"
            className="wh-btn wh-btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 1 || saving}
          >
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              className="wh-btn wh-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          ) : (
            <button
              type="button"
              className="wh-btn wh-btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default WarehouseApplicationForm
