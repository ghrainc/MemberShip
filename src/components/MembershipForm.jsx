import { useState, useContext, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'

const PHONE_FIELDS = new Set(['storePhone', 'faxPhone', 'officePhone', 'storeManagerMobile'])
const OWNER_PHONE_FIELDS = new Set(['mobilePhone'])

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length > 6) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length > 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return digits
}
import '../styles/MembershipForm.css'
import ProgressIndicator from './ProgressIndicator'
import QualifyingBusinessStep from './steps/QualifyingBusinessStep'
import BusinessInformationStep from './steps/BusinessInformationStep'
import StoreInformationStep from './steps/StoreInformationStep'
import OwnersManagementStep from './steps/OwnersManagementStep'
import ReferencesStep from './steps/ReferencesStep'
import AchAuthorizationStep from './steps/AchAuthorizationStep'
import WarehouseApplicationStep from './steps/WarehouseApplicationStep'
import DonationsStep from './steps/DonationsStep'
import DocumentUploadStep from './steps/DocumentUploadStep'
import AgreementsStep from './steps/AgreementsStep'

const STEPS = [
  { id: 1, title: 'Qualifying Business', component: QualifyingBusinessStep },
  { id: 2, title: 'Business Information', component: BusinessInformationStep },
  { id: 3, title: 'Store Information', component: StoreInformationStep },
  { id: 4, title: 'Owners & Management', component: OwnersManagementStep },
  { id: 5, title: 'References', component: ReferencesStep },
  { id: 6, title: 'ACH Authorization', component: AchAuthorizationStep },
  { id: 7, title: 'Warehouse Application', component: WarehouseApplicationStep },
  { id: 8, title: 'Donations', component: DonationsStep },
  { id: 9, title: 'Documents', component: DocumentUploadStep },
  { id: 10, title: 'Agreements', component: AgreementsStep }
]

const EMPTY_FORM_DATA = {
  hardLiquor: 'no',
  ageRequirement: 'no',
  closedSundayAfter9pm: 'no',
  storeProductCategories: [],
  storeNameCertification: '',
  storeAddressCertification: '',
  storeCityCertification: '',
  storeZipCertification: '',
  authorizedRepFirstNameCertification: '',
  authorizedRepMiddleInitialCertification: '',
  authorizedRepLastNameCertification: '',
  driverLicenseCopies: '',
  salesTaxPermit: '',
  articlesOfIncorporation: '',
  irsDocument: '',
  tobaccoPermit: '',
  beerLicense: '',
  ownershipType: 'sole-proprietor',
  businessType: 'with-fuel',
  storeCondition: 'existing',
  memberName: '',
  dbaName: '',
  storeAddress: '',
  storeCity: '',
  storeState: '',
  storeZip: '',
  storeCounty: '',
  mailingAddress: '',
  mailingCity: '',
  mailingState: '',
  mailingZip: '',
  mailingCounty: '',
  storePhone: '',
  faxPhone: '',
  officePhone: '',
  emailAddress: '',
  previousMember: false,
  previousGhraNumber: '',
  ein: '',
  salesTaxId: '',
  businessProperty: 'leased',
  storeSize: '',
  fuelAvailable: '',
  ghraFuelOptIn: true,
  brandName: '',
  numberOfTanks: '',
  tankCapacity: '',
  estimatedFuelSales: '',
  currentFuelSupplier: '',
  tceqNumber: '',
  scanPOS: '',
  backOfficeProvider: '',
  posSystem: '',
  foodServiceAvailable: '',
  foodConcept: '',
  foodServiceBranded: '',
  foodBrandName: '',
  bigMardKudosGameday: '',
  walkInCooler: '',
  coolerDoors: '',
  walkInFreezer: '',
  freezerDoors: '',
  beerCave: '',
  storeSpannerBoard: '',
  owners: [{ firstName: '', middleInitial: '', lastName: '', title: '', ownershipPercent: '', mobilePhone: '', driverLicense: '', stateIssued: '' }],
  authorizedRepFirstName: '',
  authorizedRepMiddleInitial: '',
  authorizedRepLastName: '',
  authorizedRepTitle: '',
  reference1Email: '',
  reference1Company: '',
  reference1GhraNumber: '',
  reference1RepName: '',
  reference2Email: '',
  reference2Company: '',
  reference2GhraNumber: '',
  reference2RepName: '',
  storeManagerFirstName: '',
  storeManagerLastName: '',
  storeManagerTitle: '',
  storeManagerDriverLicense: '',
  storeManagerMobile: '',
  achInfoFor: {
    corporate: false,
    warehouse: false,
    fuels: false
  },
  bankAccounts: [
    {
      id: 'bank_1',
      bankName: '',
      bankAddress: '',
      bankCity: '',
      bankState: '',
      bankZip: '',
      transitAbaNumber: '',
      accountNumber: ''
    }
  ],
  achToBankMapping: {
    corporate: 'bank_1',
    warehouse: 'bank_1',
    fuels: 'bank_1'
  },
  akdnContribute: '',
  akdnAmount: '',
  hfbContribute: '',
  hfbAmount: '',
  donationAuthRepFirstName: '',
  donationAuthRepLastName: '',
  voidCheck: '',
  membershipAgreement: false,
  memberRequirements: false,
  rebateConsent: false,
  membershipFeeAgreement: false,
  acknowledgement: false,
  authorizationConsent: false,
  indemnificationConsent: false,
  warehouseDelivery: false,
  authorizedCardHolders: [{ firstName: '', lastName: '', drivingLicense: '' }]
}

function computeStepErrors(step, data) {
  const errs = {}
  switch (step) {
    case 1:
      if (!data.hardLiquor) errs.hardLiquor = 'Please answer this question'
      if (!data.ageRequirement) errs.ageRequirement = 'Please answer this question'
      if (!data.closedSundayAfter9pm) errs.closedSundayAfter9pm = 'Please answer this question'
      if ((data.storeProductCategories || []).length < 7) errs.storeProductCategories = 'Must select minimum 7 product categories'
      break

    case 2:
      if (!(data.memberName || '').trim()) errs.memberName = 'Member Name is required'
      if (!(data.ein || '').trim()) errs.ein = 'EIN is required'
      if (!(data.salesTaxId || '').trim()) errs.salesTaxId = 'Sales Tax ID is required'
      if (!(data.authorizedRepFirstName || '').trim()) errs.authorizedRepFirstName = 'Authorized Representative First Name is required'
      if (!(data.authorizedRepLastName || '').trim()) errs.authorizedRepLastName = 'Authorized Representative Last Name is required'
      break

    case 3:
      if (!(data.storeAddress || '').trim()) errs.storeAddress = 'Store Address is required'
      if (!(data.storeCity || '').trim()) errs.storeCity = 'City is required'
      if (!(data.storeState || '').trim()) errs.storeState = 'State is required'
      if (!(data.storeZip || '').trim()) errs.storeZip = 'Zip Code is required'
      if (!(data.storeCounty || '').trim()) errs.storeCounty = 'County is required'
      if (!(data.mailingAddress || '').trim()) errs.mailingAddress = 'Mailing Address is required'
      if (!(data.mailingCity || '').trim()) errs.mailingCity = 'City is required'
      if (!(data.mailingState || '').trim()) errs.mailingState = 'State is required'
      if (!(data.mailingZip || '').trim()) errs.mailingZip = 'Zip Code is required'
      if (!(data.mailingCounty || '').trim()) errs.mailingCounty = 'County is required'
      if (!(data.emailAddress || '').trim()) errs.emailAddress = 'Email Address is required'
      if (data.businessType !== 'without-fuel') {
        if (!data.fuelAvailable) errs.fuelAvailable = 'Please select an option'
        if (data.fuelAvailable === 'branded' && !(data.brandName || '').trim()) errs.brandName = 'Brand Name is required'
        if (!(data.numberOfTanks || '').toString().trim()) errs.numberOfTanks = 'Number of Tanks is required'
        if (!(data.tankCapacity || '').toString().trim()) errs.tankCapacity = 'Tank Capacity is required'
        if (!(data.estimatedFuelSales || '').toString().trim()) errs.estimatedFuelSales = 'Estimated Fuel Sales is required'
        if (!(data.currentFuelSupplier || '').trim()) errs.currentFuelSupplier = 'Current Fuel Supplier is required'
        if (!(data.tceqNumber || '').trim()) errs.tceqNumber = 'TCEQ Number is required'
      }
      if (!data.scanPOS) errs.scanPOS = 'Please select an option'
      if (!(data.backOfficeProvider || '').trim()) errs.backOfficeProvider = 'Back Office Provider is required'
      if (!data.posSystem) errs.posSystem = 'Please select a POS system'
      if (!data.foodServiceAvailable) errs.foodServiceAvailable = 'Please select an option'
      if (data.foodServiceAvailable === 'yes') {
        if (!data.foodConcept) errs.foodConcept = 'Food Concept is required'
        if (!data.foodServiceBranded) errs.foodServiceBranded = 'Please select an option'
        if (!data.bigMardKudosGameday) errs.bigMardKudosGameday = 'Please select an option'
        if (data.foodServiceBranded === 'yes' && !(data.foodBrandName || '').trim()) errs.foodBrandName = 'Brand Name is required'
      }
      if (!data.walkInCooler) errs.walkInCooler = 'Please select an option'
      if (data.walkInCooler === 'yes' && !(data.coolerDoors || '').toString().trim()) errs.coolerDoors = 'Number of cooler doors is required'
      if (!data.walkInFreezer) errs.walkInFreezer = 'Please select an option'
      if (data.walkInFreezer === 'yes' && !(data.freezerDoors || '').toString().trim()) errs.freezerDoors = 'Number of freezer doors is required'
      if (!data.beerCave) errs.beerCave = 'Please select an option'
      break

    case 4: {
      if (!(data.storeManagerFirstName || '').trim()) errs.storeManagerFirstName = 'Store Manager First Name is required'
      if (!(data.storeManagerLastName || '').trim()) errs.storeManagerLastName = 'Store Manager Last Name is required'
      const totalOwnership = (data.owners || []).reduce((sum, o) => sum + (parseFloat(o.ownershipPercent) || 0), 0)
      if (Math.round(totalOwnership) !== 100) errs.ownershipTotal = `Total ownership must equal 100%. Current total: ${totalOwnership}%`
      break
    }

    case 5:
      if (!(data.reference1Email || '').trim()) errs.reference1Email = 'Email is required'
      if (!(data.reference1Company || '').trim()) errs.reference1Company = 'Company Name is required'
      if (!(data.reference1GhraNumber || '').toString().trim()) errs.reference1GhraNumber = 'GHRA Membership # is required'
      if (!(data.reference1RepName || '').trim()) errs.reference1RepName = 'Authorized Representative Name is required'
      if (!(data.reference2Email || '').trim()) errs.reference2Email = 'Email is required'
      if (!(data.reference2Company || '').trim()) errs.reference2Company = 'Company Name is required'
      if (!(data.reference2GhraNumber || '').toString().trim()) errs.reference2GhraNumber = 'GHRA Membership # is required'
      if (!(data.reference2RepName || '').trim()) errs.reference2RepName = 'Authorized Representative Name is required'
      break

    case 6: {
      const selectedTypes = Object.keys(data.achInfoFor || {}).filter(k => data.achInfoFor[k])
      if (selectedTypes.length > 0) {
        const usedIds = new Set(selectedTypes.map(t => (data.achToBankMapping || {})[t]).filter(id => id && id !== 'new'))
        ;(data.bankAccounts || []).filter(a => usedIds.has(a.id)).forEach(acc => {
          if (!(acc.bankName || '').trim()) errs[`bankName_${acc.id}`] = 'Bank Name is required'
          if (!(acc.transitAbaNumber || '').trim()) errs[`transitAbaNumber_${acc.id}`] = 'Routing Number is required'
          if (!(acc.accountNumber || '').trim()) errs[`accountNumber_${acc.id}`] = 'Account Number is required'
        })
      }
      break
    }

    case 9:
      if ((data.owners || []).length > 1) {
        ;(data.owners || []).forEach((_, index) => {
          if (!data[`driverLicense_owner_${index}`]) errs[`driverLicense_owner_${index}`] = 'Driver License is required'
        })
      } else {
        if (!data.driverLicenseCopies) errs.driverLicenseCopies = 'Driver License Copies are required'
      }
      if (!data.salesTaxPermit) errs.salesTaxPermit = 'Sales Tax Permit is required'
      if (!data.articlesOfIncorporation) errs.articlesOfIncorporation = 'Articles of Incorporation/Certificate of Formation is required'
      if (!data.irsDocument) errs.irsDocument = 'IRS Document is required'
      if (!data.voidCheck) errs.voidCheck = 'Void Check is required'
      break

    case 10:
      if (!data.membershipAgreement) errs.membershipAgreement = 'You must check Membership Agreement'
      if (!data.memberRequirements) errs.memberRequirements = 'You must check Requirements to be a Member'
      if (!data.rebateConsent) errs.rebateConsent = 'You must check Financial Information & Rebate Consent'
      if (!data.membershipFeeAgreement) errs.membershipFeeAgreement = 'You must agree to the annual membership fee'
      if (!data.acknowledgement) errs.acknowledgement = 'You must check this acknowledgement'
      if (!data.authorizationConsent) errs.authorizationConsent = 'You must check this authorization'
      if (!data.indemnificationConsent) errs.indemnificationConsent = 'You must check this indemnification'
      break

    default:
      break
  }
  return errs
}

function formatReviewerName(email) {
  if (!email) return ''
  const local = email.split('@')[0]
  return local.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function MembershipForm({ isEmployeeEdit = false }) {
  const { id, step } = useParams()
  const navigate = useNavigate()
  const { currentUser, saveDraft, saveApplication, getApplicationById, employeeUpdateApplication, uploadDocument, removeDocument } = useContext(AuthContext)

  const isNew = id === 'new'
  const currentStep = Math.max(1, Math.min(parseInt(step) || 1, STEPS.length))

  const [applicationId, setApplicationId] = useState(isNew ? null : Number(id))
  const [formData, setFormData] = useState(EMPTY_FORM_DATA)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)

  const [initialNotes, setInitialNotes] = useState(null)
  const [initialReviewedBy, setInitialReviewedBy] = useState(null)
  const [initialReviewedAt, setInitialReviewedAt] = useState(null)
  const [initialCommentsHistory, setInitialCommentsHistory] = useState([])

  const hasLoaded = useRef(isNew)
  const scrollAfterNav = useRef(false)

  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    getApplicationById(id).then(app => {
      if (!app) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setFormData(app.FormData || EMPTY_FORM_DATA)
      setApplicationId(app.Id)
      setInitialNotes(app.Notes)
      setInitialReviewedBy(app.ReviewedBy)
      setInitialReviewedAt(app.ReviewedAt)
      setInitialCommentsHistory(app.CommentsHistory || [])

      if (!isEmployeeEdit) {
        const savedStep = Math.max(1, Math.min(app.CurrentStep || 1, STEPS.length))
        const urlStep = parseInt(step) || 1
        if (savedStep !== urlStep) {
          navigate(`/application/${app.Id}/step/${savedStep}`, { replace: true })
        }
      }

      setLoading(false)
    })
  }, []) // run once on mount only

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 6000)
    return () => clearTimeout(t)
  }, [toast])

  // Scroll to first error after step navigation (when handleSubmit redirects to a failing step)
  useEffect(() => {
    if (!scrollAfterNav.current) return
    scrollAfterNav.current = false
    setTimeout(() => {
      const el = document.querySelector('.input-error, .error-text')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [currentStep])

  const CurrentStepComponent = STEPS[currentStep - 1].component

  const appIdForNav = applicationId || id
  const baseRoute = isEmployeeEdit
    ? `/employee/application/${appIdForNav}/edit`
    : `/application/${appIdForNav}`

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const finalValue = type === 'checkbox' ? checked : PHONE_FIELDS.has(name) ? formatPhone(value) : value
    setFormData(prev => ({ ...prev, [name]: finalValue }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const copyStoreToMailing = () => {
    setFormData(prev => ({
      ...prev,
      mailingAddress: prev.storeAddress,
      mailingCity: prev.storeCity,
      mailingState: prev.storeState,
      mailingZip: prev.storeZip,
      mailingCounty: prev.storeCounty,
    }))
  }

  const handleAchInfoChange = (achType) => {
    setFormData(prev => ({
      ...prev,
      achInfoFor: { ...prev.achInfoFor, [achType]: !prev.achInfoFor[achType] }
    }))
  }

  const handleAchToBankMapping = (achType, bankId) => {
    setFormData(prev => ({
      ...prev,
      achToBankMapping: { ...prev.achToBankMapping, [achType]: bankId }
    }))
  }

  const handleBankInfoChange = (bankId, field, value) => {
    setFormData(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(account =>
        account.id === bankId ? { ...account, [field]: value } : account
      )
    }))
    const errKey = `${field}_${bankId}`
    if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: '' }))
  }

  const addBankAccount = (achTypeToAssign = null) => {
    if (formData.bankAccounts.length >= 3) return
    const newBankId = `bank_${Date.now()}`
    setFormData(prev => {
      const updated = {
        ...prev,
        bankAccounts: [...prev.bankAccounts, { id: newBankId, bankName: '', bankAddress: '', bankCity: '', bankState: '', bankZip: '', transitAbaNumber: '', accountNumber: '' }]
      }
      if (achTypeToAssign) {
        updated.achToBankMapping = { ...prev.achToBankMapping, [achTypeToAssign]: newBankId }
      }
      return updated
    })
  }

  const handleOwnerChange = (index, field, value) => {
    const updatedOwners = [...formData.owners]
    updatedOwners[index][field] = OWNER_PHONE_FIELDS.has(field) ? formatPhone(value) : value
    setFormData(prev => ({ ...prev, owners: updatedOwners }))
  }

  const addOwner = () => {
    setFormData(prev => ({
      ...prev,
      owners: [...prev.owners, { firstName: '', middleInitial: '', lastName: '', title: '', ownershipPercent: '', mobilePhone: '', driverLicense: '', stateIssued: '' }]
    }))
  }

  const removeOwner = (index) => {
    if (formData.owners.length > 1) {
      setFormData(prev => ({ ...prev, owners: prev.owners.filter((_, i) => i !== index) }))
    }
  }

  const handleCardHolderChange = (index, field, value) => {
    const updatedCardHolders = [...formData.authorizedCardHolders]
    updatedCardHolders[index][field] = value
    setFormData(prev => ({ ...prev, authorizedCardHolders: updatedCardHolders }))
  }

  const addCardHolder = () => {
    setFormData(prev => ({
      ...prev,
      authorizedCardHolders: [...prev.authorizedCardHolders, { firstName: '', lastName: '', drivingLicense: '' }]
    }))
  }

  const removeCardHolder = (index) => {
    if (formData.authorizedCardHolders.length > 1) {
      setFormData(prev => ({ ...prev, authorizedCardHolders: prev.authorizedCardHolders.filter((_, i) => i !== index) }))
    }
  }

  const handleNext = async () => {
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
    if (currentStep >= STEPS.length) return

    if (!isEmployeeEdit) {
      const savedId = await saveDraft(applicationId, currentStep, formData)
      const nextAppId = savedId || applicationId
      if (savedId && !applicationId) setApplicationId(savedId)
      navigate(`/application/${nextAppId}/step/${currentStep + 1}`, { replace: isNew })
    } else {
      navigate(`/employee/application/${applicationId}/edit/step/${currentStep + 1}`)
    }
    window.scrollTo(0, 0)
  }

  const handlePrevious = () => {
    if (currentStep <= 1) return
    navigate(`${baseRoute}/step/${currentStep - 1}`)
    window.scrollTo(0, 0)
  }

  const handleStepClick = (stepId) => {
    if (!applicationId && !isNew) return
    navigate(`${baseRoute}/step/${stepId}`)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all steps to find the first failing one
    let firstFailStep = null
    let firstFailErrors = {}
    for (let s = 1; s <= STEPS.length; s++) {
      const errs = computeStepErrors(s, formData)
      if (Object.keys(errs).length > 0 && firstFailStep === null) {
        firstFailStep = s
        firstFailErrors = errs
      }
    }

    if (firstFailStep !== null) {
      setErrors(firstFailErrors)
      setToast(`Step ${firstFailStep} (${STEPS[firstFailStep - 1].title}) has required fields that must be completed.`)
      if (firstFailStep !== currentStep) {
        scrollAfterNav.current = true
        navigate(`${baseRoute}/step/${firstFailStep}`)
      } else {
        setTimeout(() => {
          const el = document.querySelector('.input-error, .error-text')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
      }
      return
    }

    if (isEmployeeEdit) {
      await employeeUpdateApplication(applicationId, formData)
      navigate(`/employee/application/${applicationId}`)
    } else {
      await saveApplication(applicationId, formData)
      navigate('/dashboard')
    }
  }

  const handleCancel = () => {
    navigate(isEmployeeEdit ? '/employee' : '/dashboard')
  }

  if (loading) {
    return (
      <div className="membership-container">
        <div className="empty-state"><p>Loading application...</p></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="membership-container">
        <button className="nav-button cancel-button" onClick={handleCancel}>← Dashboard</button>
        <div className="error-message" style={{ padding: 24 }}>Application not found.</div>
      </div>
    )
  }

  return (
    <div className="membership-container">
      {toast && (
        <div className="validation-toast">
          <span>{toast}</span>
          <button className="validation-toast-close" onClick={() => setToast('')}>✕</button>
        </div>
      )}

      <div className="membership-header">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
          alt="GHRA Logo"
          className="membership-logo"
        />
        <h1>GHRA Membership Application</h1>
        <p className="header-subtitle">Greater Houston Retailers Cooperative Association, Inc.</p>
        <p className="applicant-email">Applicant Email: {currentUser?.email}</p>
      </div>

      {initialNotes && (
        <div className="reviewer-comments-banner banner-rejected">
          <div className="reviewer-comments-header">
            <span className="reviewer-comments-icon">✕</span>
            <strong>Reviewer Comments</strong>
            {initialReviewedBy && (
              <span className="reviewer-meta">
                by {formatReviewerName(initialReviewedBy)}
                {initialReviewedAt && ` on ${new Date(initialReviewedAt).toLocaleDateString()}`}
              </span>
            )}
          </div>
          <p className="reviewer-comments-text">{initialNotes}</p>
        </div>
      )}

      {initialCommentsHistory.length > 0 && (
        <div className="review-history-panel">
          <button className="review-history-toggle" onClick={() => setHistoryOpen(o => !o)}>
            <span>Review History ({initialCommentsHistory.length})</span>
            <span className="toggle-arrow">{historyOpen ? '▲' : '▼'}</span>
          </button>
          {historyOpen && (
            <div className="comments-history-list">
              {initialCommentsHistory.map((entry, idx) => (
                <div key={idx} className={`history-entry ${entry.status === 'rejected' ? 'entry-rejected' : 'entry-approved'}`}>
                  <div className="history-entry-header">
                    <span className={`history-status-badge ${entry.status === 'rejected' ? 'badge-rejected' : 'badge-approved'}`}>
                      {entry.status === 'rejected' ? '✕ Rejected' : '✓ Approved'}
                    </span>
                    <span className="history-entry-num">#{idx + 1}</span>
                  </div>
                  <p className="history-comment">{entry.comment}</p>
                  <div className="history-entry-meta">
                    <span>{formatReviewerName(entry.reviewedBy)}</span>
                    <span>{new Date(entry.reviewedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ProgressIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} onStepClick={handleStepClick} />

      <form onSubmit={handleSubmit} className="membership-form step-form">
        <div className="step-content">
          <CurrentStepComponent
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            copyStoreToMailing={copyStoreToMailing}
            handleOwnerChange={handleOwnerChange}
            addOwner={addOwner}
            removeOwner={removeOwner}
            handleCardHolderChange={handleCardHolderChange}
            addCardHolder={addCardHolder}
            removeCardHolder={removeCardHolder}
            handleAchInfoChange={handleAchInfoChange}
            handleAchToBankMapping={handleAchToBankMapping}
            handleBankInfoChange={handleBankInfoChange}
            addBankAccount={addBankAccount}
            applicationId={applicationId}
            uploadDocument={uploadDocument}
            removeDocument={removeDocument}
          />
        </div>

        <div className="form-navigation">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="nav-button prev-button"
          >
            ← Previous
          </button>

          {currentStep === STEPS.length ? (
            <button type="submit" className="nav-button submit-button">
              {isEmployeeEdit ? 'Save Changes' : 'Submit Application'}
            </button>
          ) : (
            <button type="button" onClick={handleNext} className="nav-button next-button">
              Next →
            </button>
          )}

          <button type="button" onClick={handleCancel} className="nav-button cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default MembershipForm
