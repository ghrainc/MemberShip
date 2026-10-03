import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import { generateApplicationPDF } from '../utils/pdfExport'
import { ghraFuelsApplies } from '../utils/fuelUtils'
import { US_STATES } from '../utils/usStates'
import { getAllSlots, normaliseDocuments } from '../utils/documentSlots'
import { AuthenticatedThumbnail, DocIcon } from './MultiFileUploader'
import ProgressIndicator from './ProgressIndicator'
import ApprovalDialog from './ApprovalDialog'
import '../styles/ViewApplication.css'
import '../styles/MultiFileUploader.css'

// ── Value → Display label lookup maps ────────────────────────────────────────

const OWNERSHIP_TYPE = {
  'sole-proprietor':    'Sole Proprietorship',
  'partnership':        'Partnership',
  'c-corp':             'C-Corp',
  's-corp':             'S-Corp',
  'llc':                'LLC',
  // legacy values — kept so existing saved applications still display correctly
  'corporation':        'Corporation',
  'limited-partnership': 'Limited Partnership',
}
const BUSINESS_TYPE = {
  'with-fuel':    'Convenience Store with Fuel',
  'without-fuel': 'Convenience Store without Fuel'
}
const STORE_CONDITION = {
  'existing':  'Existing Store',
  'remodeled': 'Remodeled',
  'brand-new': 'Brand New'
}
const BUSINESS_PROPERTY = { 'owned': 'Owned', 'leased': 'Leased' }
const FUEL_AVAILABLE    = { 'branded': 'Branded', 'unbranded': 'Unbranded' }
const POS_SYSTEM = {
  'gilbarco-passport': 'Gilbarco passport',
  'verifone': 'Verifone',
  'ruby':     'Ruby',
  'other':    'Other'
}
const FOOD_CONCEPT = {
  'chicken': 'Chicken', 'pizza': 'Pizza', 'mexican': 'Mexican',
  'burger':  'Burger',  'bbq':   'BBQ',   'other':   'Other'
}
const PRODUCT_CATEGORY_LABELS = {
  gasoline:         'Gasoline',
  beverages:        'Beverages',
  tobaccoProducts:  'Tobacco Products',
  snackFoods:       'Snack Foods',
  candy:            'Candy',
  groceryItems:     'Grocery Items',
  bakeryItems:      'Bakery Items',
  dairyProducts:    'Dairy Products',
  preparedFoods:    'Prepared Foods',
  freshPackagedMeats: 'Fresh/Packaged Meats',
  produce:          'Produce',
  healthBeautyAids: 'Health and Beauty Aids'
}
const YES_NO       = { 'yes': 'Yes', 'no': 'No' }
const YES_NO_UPPER = { 'yes': 'YES', 'no': 'NO' }

function lbl(map, value) {
  if (!value) return null
  return map[value] || value
}

const STATE_CODE_MAP = Object.fromEntries(US_STATES.map(s => [s.code, s.name]))
function stateName(value) {
  if (!value) return null
  return STATE_CODE_MAP[value] || value
}

// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 1,  title: 'Qualifying Business' },
  { id: 2,  title: 'Business Information' },
  { id: 3,  title: 'Store Information' },
  { id: 4,  title: 'Owners & Management' },
  { id: 5,  title: 'References' },
  { id: 6,  title: 'ACH Authorization' },
  { id: 7,  title: 'Warehouse Application' },
  { id: 8,  title: 'Donations' },
  { id: 9,  title: 'Documents' },
  { id: 10, title: 'Agreements' }
]

function formatReviewerName(email) {
  if (!email) return ''
  const local = email.split('@')[0]
  return local.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ViewApplication() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, getApplicationById, updateApplicationStatus, getLastBoardSigners, openDocument, updateGhraNumber, downloadAllDocuments, fetchDocumentBlobUrl, downloadCombinedPdf, unarchiveApplications, getDsEvents, getAuditLog } = useContext(AuthContext)
  const isEmployee = currentUser?.role === 'employee'

  const [application, setApplication]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [currentSection, setCurrentSection] = useState(1)
  const [approvalDialog, setApprovalDialog] = useState(null)
  const [lastBoardSigners, setLastBoardSigners] = useState(null)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [approvalError, setApprovalError] = useState(null)

  // GHRA # inline editing (employee only)
  const [editingGhra, setEditingGhra] = useState(null) // null = viewing; string = editing
  const [editGhraLoading, setEditGhraLoading] = useState(false)
  const [editGhraError, setEditGhraError] = useState('')
  const [approving, setApproving]       = useState(false)
  const [lightboxSrc, setLightboxSrc]   = useState(null)

  const [dsActivityOpen, setDsActivityOpen]     = useState(false)
  const [dsEvents, setDsEvents]                 = useState(null)
  const [dsEventsLoading, setDsEventsLoading]   = useState(false)
  const [dsEventsError, setDsEventsError]       = useState(null)
  const [expandedDsRow, setExpandedDsRow]       = useState(null)

  const [auditOpen, setAuditOpen]               = useState(false)
  const [auditEntries, setAuditEntries]          = useState(null)
  const [auditLoading, setAuditLoading]          = useState(false)
  const [auditError, setAuditError]              = useState(null)
  const [expandedAuditRow, setExpandedAuditRow]  = useState(null)

  const [unarchiving, setUnarchiving] = useState(false)
  const [unarchiveError, setUnarchiveError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getApplicationById(id).then(data => {
      setApplication(data)
      setLoading(false)
    })
  }, [id])

  const handleSectionClick = (sectionId) => { setCurrentSection(sectionId); window.scrollTo(0, 0) }
  const handleApproveClick = () => {
    setApprovalError(null)
    setLastBoardSigners(null)   // clear stale values from any previous open
    setPrefillLoading(true)
    setApprovalDialog({ action: 'approve' })
    getLastBoardSigners()
      .then(signers => setLastBoardSigners(signers))
      .catch(() => {})
      .finally(() => setPrefillLoading(false))
  }
  const handleRejectClick  = () => { setApprovalError(null); setApprovalDialog({ action: 'reject' }) }

  const handleApprovalConfirm = async (comments, boardSigners) => {
    const newStatus = approvalDialog.action === 'approve' ? 'approved' : 'rejected'
    setApproving(true)
    let result
    try {
      result = await updateApplicationStatus(id, newStatus, comments, boardSigners)
    } finally {
      setApproving(false)
    }
    setApprovalDialog(null)
    if (!result.success) {
      setApprovalError(result.error || 'Something went wrong.')
      return
    }
    navigate('/employee')
  }

  const handleBack = () => {
    navigate(isEmployee ? '/employee' : '/dashboard')
  }

  const handleDsActivityOpen = async () => {
    if (!dsActivityOpen && dsEvents === null && !dsEventsLoading) {
      setDsEventsLoading(true)
      try {
        const result = await getDsEvents(id)
        setDsEvents(result.events || [])
      } catch (err) {
        setDsEventsError(err.message)
      } finally {
        setDsEventsLoading(false)
      }
    }
    setDsActivityOpen(v => !v)
  }

  const handleAuditOpen = async () => {
    if (!auditOpen && auditEntries === null && !auditLoading) {
      setAuditLoading(true)
      try {
        const result = await getAuditLog(id)
        setAuditEntries(result.entries || [])
      } catch (err) {
        setAuditError(err.message)
      } finally {
        setAuditLoading(false)
      }
    }
    setAuditOpen(v => !v)
  }

  const handleSaveGhraNumber = async () => {
    setEditGhraLoading(true)
    let result
    try {
      result = await updateGhraNumber(application.Id, { ghraNumber: editingGhra?.trim() || null })
    } finally {
      setEditGhraLoading(false)
    }
    if (result.success) {
      setApplication(prev => ({ ...prev, GhraNumber: editingGhra?.trim() || null }))
      setEditingGhra(null)
      setEditGhraError('')
    } else {
      setEditGhraError(result.error || 'Failed to save')
    }
  }

  const handleEdit = () => {
    navigate(`/employee/application/${id}/edit/step/1`)
  }

  const closeLightbox = () => {
    setLightboxSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null })
  }

  const IMAGE_EXTS_VA = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'])
  const isImageFile = (name) => {
    const i = (name || '').lastIndexOf('.')
    const ext = i >= 0 ? name.slice(i).toLowerCase() : ''
    return IMAGE_EXTS_VA.has(ext)
  }

  if (loading) {
    return <div className="view-application-container"><div className="empty-state"><p>Loading application...</p></div></div>
  }
  if (!application) {
    return (
      <div className="view-application-container">
        <button className="back-button" onClick={handleBack}>← Back to Dashboard</button>
        <div className="error-message">Application not found</div>
      </div>
    )
  }

  const data = application.FormData || {}

  // ── Shared components ────────────────────────────────────────────────────

  const InfoField = ({ label: fieldLabel, value }) => (
    <div className="info-field">
      <span className="info-field-label">{fieldLabel}</span>
      <span className="info-field-value">{value || 'Not provided'}</span>
    </div>
  )
  const InfoRow = ({ children }) => <div className="info-row">{children}</div>

  const Section = ({ title, children }) => (
    <div className="form-section-inner">
      {title && <span className="inner-legend">{title}</span>}
      {children}
    </div>
  )

  // ── Section renderers ────────────────────────────────────────────────────

  const renderSection = () => {
    switch (currentSection) {

      case 1:
        return (
          <fieldset className="form-section">
            <legend>Qualifying Business</legend>
            <Section title="Certification Questions">
              <InfoRow>
                <InfoField label="Does your store sell hard liquor (18% or more alcohol content)?" value={lbl(YES_NO_UPPER, data.hardLiquor)} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Is there an age requirement to allow patrons into your store?" value={lbl(YES_NO_UPPER, data.ageRequirement)} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Is your store required to be closed on Sunday and after 9:00 PM Monday - Saturday?" value={lbl(YES_NO_UPPER, data.closedSundayAfter9pm)} />
              </InfoRow>
            </Section>
            {data.storeProductCategories?.length > 0 && (
              <Section title={`Product Mix — Total Criteria Met: ${data.storeProductCategories.length}`}>
                <div className="category-list">
                  {data.storeProductCategories.map((cat, i) => (
                    <span key={i} className="category-tag">{PRODUCT_CATEGORY_LABELS[cat] || cat}</span>
                  ))}
                </div>
              </Section>
            )}
          </fieldset>
        )

      case 2:
        return (
          <fieldset className="form-section">
            <legend>Business Information</legend>
            <Section title="Type of Ownership">
              <InfoRow><InfoField label="Ownership Type" value={lbl(OWNERSHIP_TYPE, data.ownershipType)} /></InfoRow>
            </Section>
            <Section title="Business Type">
              <InfoRow><InfoField label="Business Type" value={lbl(BUSINESS_TYPE, data.businessType)} /></InfoRow>
            </Section>
            <Section title="Business Details">
              <InfoRow>
                <InfoField label="Member Name (Company Name)" value={data.memberName} />
                <InfoField label="DBA/Assumed Name" value={data.dbaName} />
              </InfoRow>
              <InfoRow>
                <InfoField label={data.ownershipType === 'sole-proprietor' ? 'SSN' : 'EIN (Fed Tax ID #)'} value={data.ein} />
                <InfoField label="Sales Tax ID #" value={data.salesTaxId} />
              </InfoRow>
            </Section>
            <Section title="Authorized Representative">
              <InfoRow>
                <InfoField label="First Name" value={data.authorizedRepFirstName} />
                <InfoField label="Middle Initial" value={data.authorizedRepMiddleInitial} />
                <InfoField label="Last Name" value={data.authorizedRepLastName} />
              </InfoRow>
              {data.authorizedRepAddress && (
                <InfoRow><InfoField label="Home Street Address" value={data.authorizedRepAddress} /></InfoRow>
              )}
              <InfoRow>
                <InfoField label="City" value={data.authorizedRepCity} />
                <InfoField label="State" value={stateName(data.authorizedRepState)} />
                <InfoField label="Zip Code" value={data.authorizedRepZip} />
                <InfoField label="County" value={data.authorizedRepCounty} />
              </InfoRow>
            </Section>
            <Section title="Previous Membership">
              <InfoRow>
                <InfoField label="Was the store previously a member store of GHRA?" value={data.previousMember ? 'Yes' : 'No'} />
                {data.previousMember && <InfoField label="Previous GHRA #" value={data.previousGhraNumber} />}
              </InfoRow>
            </Section>
          </fieldset>
        )

      case 3:
        return (
          <fieldset className="form-section">
            <legend>Store Information</legend>
            <Section title="Store Condition">
              <InfoRow><InfoField label="Store Condition" value={lbl(STORE_CONDITION, data.storeCondition)} /></InfoRow>
            </Section>
            <Section title="Business Property">
              <InfoRow>
                <InfoField label="Business Property" value={lbl(BUSINESS_PROPERTY, data.businessProperty)} />
                <InfoField label="Store Size" value={data.storeSize} />
              </InfoRow>
            </Section>
            {data.businessType !== 'without-fuel' && (
              <Section title="Fuel">
                <InfoRow>
                  <InfoField label="If with fuel" value={lbl(FUEL_AVAILABLE, data.fuelAvailable)} />
                  {data.fuelAvailable === 'branded' && <InfoField label="Brand Name" value={data.brandName} />}
                  <InfoField label="Number of Tanks" value={data.numberOfTanks} />
                </InfoRow>
                <InfoRow>
                  <InfoField label="Tank Capacity" value={data.tankCapacity} />
                  <InfoField label="Current Fuel Supplier(s)" value={data.currentFuelSupplier} />
                </InfoRow>
                <InfoRow><InfoField label="TCEQ number" value={data.tceqNumber} /></InfoRow>
                <InfoRow><InfoField label="GHRA Fuel Opt-In" value={data.ghraFuelOptIn !== false ? 'Yes — opted in' : 'No — opted out'} /></InfoRow>
              </Section>
            )}
            <Section title="POS System">
              <InfoRow>
                <InfoField label="Do you scan your products at the POS?" value={lbl(YES_NO, data.scanPOS)} />
                <InfoField label="Who is back office provider?" value={data.backOfficeProvider} />
              </InfoRow>
              <InfoRow><InfoField label="What register system (POS) is being used?" value={lbl(POS_SYSTEM, data.posSystem)} /></InfoRow>
            </Section>
            <Section title="Food Service">
              <InfoRow><InfoField label="Do you have food service at store" value={lbl(YES_NO, data.foodServiceAvailable)} /></InfoRow>
              {data.foodServiceAvailable === 'yes' && (
                <>
                  <InfoRow>
                    <InfoField label="Food Concept" value={lbl(FOOD_CONCEPT, data.foodConcept)} />
                    <InfoField label="Is your food service branded" value={lbl(YES_NO, data.foodServiceBranded)} />
                    {data.foodServiceBranded === 'yes' && <InfoField label="Brand Name" value={data.foodBrandName} />}
                  </InfoRow>
                  <InfoRow>
                    <InfoField label="Are you interested in receiving more information on BIG MARD, KUDOS and GAMEDAY CHICKEN?" value={lbl(YES_NO, data.bigMardKudosGameday)} />
                  </InfoRow>
                </>
              )}
            </Section>
            <Section title="Cooler">
              <InfoRow>
                <InfoField label="Does your store have a walk-in cooler?" value={lbl(YES_NO, data.walkInCooler)} />
                {data.walkInCooler === 'yes' && <InfoField label="If yes, how many doors" value={data.coolerDoors} />}
              </InfoRow>
              <InfoRow>
                <InfoField label="Does your store have a walk-in Freezer?" value={lbl(YES_NO, data.walkInFreezer)} />
                {data.walkInFreezer === 'yes' && <InfoField label="If yes, how many doors" value={data.freezerDoors} />}
              </InfoRow>
              <InfoRow><InfoField label="Does your store have a beer cave?" value={lbl(YES_NO, data.beerCave)} /></InfoRow>
            </Section>
            <Section title="Spanner Board">
              <InfoRow><InfoField label="Spanner Board" value={
                data.storeSpannerBoard === 'yes'        ? 'I do have permission to install a 15ft spanner board.' :
                data.storeSpannerBoard === 'no'         ? 'I do not have permission from city, landlord or authority to install GHRA spanner frame. (Provide documentation)' :
                data.storeSpannerBoard === 'prevMember' ? 'I have a spanner board from previous member in good condition (provide current photograph).' :
                '-'
              } /></InfoRow>
            </Section>
            <Section title="Store Address">
              <InfoRow><InfoField label="Store Address" value={data.storeAddress} /></InfoRow>
              <InfoRow>
                <InfoField label="City" value={data.storeCity} />
                <InfoField label="State" value={stateName(data.storeState)} />
                <InfoField label="Zip Code" value={data.storeZip} />
                <InfoField label="County" value={data.storeCounty} />
              </InfoRow>
            </Section>
            <Section title="Mailing Address">
              <InfoRow><InfoField label="Mailing Address" value={data.mailingAddress} /></InfoRow>
              <InfoRow>
                <InfoField label="City" value={data.mailingCity} />
                <InfoField label="State" value={stateName(data.mailingState)} />
                <InfoField label="Zip Code" value={data.mailingZip} />
                <InfoField label="County" value={data.mailingCounty} />
              </InfoRow>
            </Section>
            <Section title="Contact Information">
              <InfoRow>
                <InfoField label="Store Phone" value={data.storePhone} />
                <InfoField label="Fax Phone" value={data.faxPhone} />
                <InfoField label="Office Phone" value={data.officePhone} />
              </InfoRow>
              <InfoRow><InfoField label="Email Address" value={data.emailAddress} /></InfoRow>
            </Section>
          </fieldset>
        )

      case 4:
        return (
          <fieldset className="form-section">
            <legend>Owners & Management</legend>
            {(data.owners || []).map((owner, idx) => (
              <Section key={idx} title={idx === 0 ? 'Owner / Partner / Authorized Representative 1' : `Owner / Partner / Authorized Representative ${idx + 1}`}>
                <InfoRow>
                  <InfoField label="First Name" value={owner.firstName} />
                  <InfoField label="Middle Initial" value={owner.middleInitial} />
                  <InfoField label="Last Name" value={owner.lastName} />
                </InfoRow>
                <InfoRow>
                  <InfoField label="Title" value={owner.title} />
                  <InfoField label="Ownership %" value={owner.ownershipPercent} />
                  <InfoField label="Mobile Phone" value={owner.mobilePhone} />
                </InfoRow>
                <InfoRow>
                  <InfoField label="Driver License #" value={owner.driverLicense} />
                  <InfoField label="State Issued" value={stateName(owner.stateIssued)} />
                  {ghraFuelsApplies(data) && owner.ssn && (
                    <InfoField label="SSN" value={owner.ssn} />
                  )}
                </InfoRow>
              </Section>
            ))}
            <Section title="Store Manager">
              <InfoRow>
                <InfoField label="First Name" value={data.storeManagerFirstName} />
                <InfoField label="Last Name" value={data.storeManagerLastName} />
                <InfoField label="Title" value={data.storeManagerTitle} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Mobile Phone" value={data.storeManagerMobile} />
                <InfoField label="Driver License #" value={data.storeManagerDriverLicense} />
              </InfoRow>
            </Section>
          </fieldset>
        )

      case 5:
        return (
          <fieldset className="form-section">
            <legend>References</legend>
            <Section title="Reference 1">
              <InfoRow>
                <InfoField label="Company Name" value={data.reference1Company} />
                <InfoField label="GHRA Membership #" value={data.reference1GhraNumber} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Email" value={data.reference1Email} />
                <InfoField label="Representative Name" value={data.reference1RepName} />
              </InfoRow>
            </Section>
            <Section title="Reference 2">
              <InfoRow>
                <InfoField label="Company Name" value={data.reference2Company} />
                <InfoField label="GHRA Membership #" value={data.reference2GhraNumber} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Email" value={data.reference2Email} />
                <InfoField label="Representative Name" value={data.reference2RepName} />
              </InfoRow>
            </Section>
          </fieldset>
        )

      case 6: {
        const achOptions = [
          { id: 'corporate', label: 'GHRA Corporate' },
          { id: 'warehouse', label: 'GHRA Warehouse' },
          ...(ghraFuelsApplies(data) ? [{ id: 'fuels', label: 'GHRA Fuels' }] : [])
        ]
        const achInfoFor   = data.achInfoFor || {}
        const bankAccounts = data.bankAccounts || []
        return (
          <fieldset className="form-section">
            <legend>ACH Authorization</legend>
            <Section title="ACH Information">
              <InfoRow>
                {achOptions.map(opt => (
                  <InfoField key={opt.id} label={opt.label} value={achInfoFor[opt.id] ? 'Yes' : 'No'} />
                ))}
              </InfoRow>
            </Section>
            {bankAccounts.length > 0
              ? bankAccounts.map((account, idx) => (
                  <Section key={account.id || idx} title={`Bank Account ${idx + 1}`}>
                    <InfoRow>
                      <InfoField label="Bank Name" value={account.bankName} />
                      <InfoField label="Branch Address" value={account.bankAddress} />
                    </InfoRow>
                    <InfoRow>
                      <InfoField label="City" value={account.bankCity} />
                      <InfoField label="State" value={account.bankState} />
                      <InfoField label="Zip Code" value={account.bankZip} />
                    </InfoRow>
                    <InfoRow>
                      <InfoField label="Transit/ABA Number (Routing Number)" value={account.transitAbaNumber} />
                      <InfoField label="Account Number" value={account.accountNumber} />
                    </InfoRow>
                  </Section>
                ))
              : <Section><span className="info-field-value">No bank accounts provided</span></Section>
            }
          </fieldset>
        )
      }

      case 7:
        return (
          <fieldset className="form-section">
            <legend>Warehouse Application</legend>
            <Section title="Warehouse Information">
              <InfoRow>
                <InfoField label="Would you like to set up your account for delivery?" value={data.warehouseDelivery ? 'Yes' : 'No'} />
              </InfoRow>
            </Section>
            {data.warehouseDelivery && (data.authorizedCardHolders || []).map((holder, idx) => (
              <Section key={idx} title={`Authorized Card Holder ${idx + 1}`}>
                <InfoRow>
                  <InfoField label="First Name" value={holder.firstName} />
                  <InfoField label="Last Name" value={holder.lastName} />
                  <InfoField label="Driver License #" value={holder.drivingLicense} />
                </InfoRow>
              </Section>
            ))}
          </fieldset>
        )

      case 8:
        return (
          <fieldset className="form-section">
            <legend>Donations</legend>
            <Section title="AGA KHAN DEVELOPMENT NETWORK (AKDN)">
              <InfoRow>
                <InfoField
                  label="Contribution"
                  value={data.akdnContribute === 'yes' ? `Yes — $${data.akdnAmount}` : 'No, I do not wish to contribute'}
                />
              </InfoRow>
            </Section>
            <Section title="HOUSTON FOOD BANK (HFB)">
              <InfoRow>
                <InfoField
                  label="Contribution"
                  value={data.hfbContribute === 'yes' ? `Yes — $${data.hfbAmount}` : 'No, I do not wish to contribute'}
                />
              </InfoRow>
            </Section>
            <Section title="Authorized Representative">
              <InfoRow>
                <InfoField label="First Name" value={data.donationAuthRepFirstName || data.authorizedRepFirstName} />
                <InfoField label="Last Name" value={data.donationAuthRepLastName || data.authorizedRepLastName} />
              </InfoRow>
            </Section>
          </fieldset>
        )

      case 9: {
        const docs = normaliseDocuments(data)
        const slots = getAllSlots(data.owners || [])
        return (
          <fieldset className="form-section">
            <legend>Documents</legend>
            {slots.map(slot => {
              const slotFiles = docs[slot.id] || []
              return (
                <div key={slot.id} style={{ marginBottom: 20 }}>
                  <div className="mfu-slot-header" style={{ marginBottom: 8 }}>
                    <div className="mfu-title-row">
                      <h3 className="mfu-title">{slot.title}</h3>
                      {slot.required
                        ? <span className="required-badge">Required</span>
                        : <span className="optional-badge">Optional</span>
                      }
                      {slotFiles.length > 0 && (
                        <span className="mfu-count">{slotFiles.length} file{slotFiles.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  {slotFiles.length === 0 ? (
                    <p style={{ color: '#95a5a6', fontSize: 13, margin: 0 }}>No files uploaded</p>
                  ) : (
                    <>
                      <div className="mfu-grid">
                        {slotFiles.map((f, index) => {
                          const name = f.originalName || f.filename || ''
                          return (
                            <div key={f.filename || index} className="mfu-card">
                              <div
                                className="mfu-card-thumb"
                                onClick={async () => {
                                  if (!f.url) return
                                  if (isImageFile(name)) {
                                    const url = await fetchDocumentBlobUrl(f.url)
                                    if (url) setLightboxSrc(prev => { if (prev) URL.revokeObjectURL(prev); return url })
                                  } else {
                                    openDocument(f.url)
                                  }
                                }}
                                title="Click to preview"
                              >
                                {isImageFile(name) && f.url
                                  ? <AuthenticatedThumbnail storedUrl={f.url} altText={name} />
                                  : <DocIcon filename={name} />
                                }
                              </div>
                              <div className="mfu-card-footer">
                                <span className="mfu-card-name" title={name}>{name}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {slotFiles.length >= 2 && (
                        <button type="button" className="mfu-combined-btn" onClick={() => downloadCombinedPdf(application.Id, slot.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download combined PDF
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </fieldset>
        )
      }

      case 10:
        return (
          <fieldset className="form-section">
            <legend>Agreements</legend>
            <Section title="Membership Agreement & Requirements">
              <InfoRow>
                <InfoField label="Membership Agreement" value={data.membershipAgreement ? 'Agreed' : 'Not agreed'} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Requirements to be a Member" value={data.memberRequirements ? 'Agreed' : 'Not agreed'} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Financial Information & Rebate Consent" value={data.rebateConsent ? 'Agreed' : 'Not agreed'} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Annual membership fee of $400.00" value={data.membershipFeeAgreement ? 'Agreed' : 'Not agreed'} />
              </InfoRow>
            </Section>
            <Section title="Final Acknowledgement">
              <InfoRow>
                <InfoField
                  label="I certify that I have read and understand the GHRA Membership Agreement, Requirements, and all other documents provided"
                  value={data.acknowledgement ? 'Acknowledged' : 'Not acknowledged'}
                />
              </InfoRow>
              <InfoRow>
                <InfoField
                  label="Authorization to share business information with vendors and access POS data"
                  value={data.authorizationConsent ? 'Agreed' : 'Not agreed'}
                />
              </InfoRow>
              <InfoRow>
                <InfoField
                  label="Indemnification and hold harmless agreement"
                  value={data.indemnificationConsent ? 'Agreed' : 'Not agreed'}
                />
              </InfoRow>
            </Section>
          </fieldset>
        )

      default:
        return null
    }
  }

  // If CommentsHistory is empty but Notes exists (pre-migration record), synthesise one entry
  let commentsHistory = Array.isArray(application.CommentsHistory) ? application.CommentsHistory : []
  if (commentsHistory.length === 0 && application.Notes && application.ReviewedBy) {
    commentsHistory = [{
      status: application.Status,
      comment: application.Notes,
      reviewedBy: application.ReviewedBy,
      reviewedAt: application.ReviewedAt
    }]
  }

  const submittedDate = application.UpdatedAt || application.CreatedAt
  const formattedDate = submittedDate ? new Date(submittedDate).toLocaleDateString() : '—'

  return (
    <div className="membership-container view-app-mode">
      <div className="membership-header">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
          alt="GHRA Logo"
          className="membership-logo"
        />
        <h1>Application Review</h1>
        <p className="header-subtitle">{application.StoreName || 'Unnamed Application'}</p>
        <p className="submitted-info">
          {application.Status === 'submitted' ? 'Submitted' : 'Last Updated'}: {formattedDate}
          &nbsp;|&nbsp; ID: {application.Id}
          &nbsp;|&nbsp; Status: <strong>{application.Status}</strong>
        </p>
        {isEmployee && application.AdminSignatureId && (
          <div className="ghra-number-header-row" style={{ fontSize: 13, color: '#555' }}>
            <span className="ghra-number-header-label">Admin Sign:</span>
            <span className="ghra-number-header-value">
              {application.AdminSignedAt
                ? <span style={{ color: '#27ae60', fontWeight: 600 }}>✓ Signed {new Date(application.AdminSignedAt).toLocaleDateString()}</span>
                : <span style={{ color: '#e67e22' }}>Awaiting signature</span>}
              {application.AdminSignerFirstName && (
                <span style={{ marginLeft: 8, color: '#888' }}>
                  ({application.AdminSignerFirstName} {application.AdminSignerLastName})
                </span>
              )}
            </span>
          </div>
        )}
        {(application.GhraNumber || isEmployee) && (
          <div className="ghra-number-header-row">
            <span className="ghra-number-header-label">GHRA #:</span>
            {isEmployee && editingGhra !== null ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={editingGhra}
                  onChange={e => setEditingGhra(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveGhraNumber(); if (e.key === 'Escape') { setEditingGhra(null); setEditGhraError('') } }}
                  placeholder="e.g. 12345"
                  maxLength={50}
                  autoFocus
                  style={{ padding: '3px 8px', fontSize: 14, border: '1px solid #ced4da', borderRadius: 4, width: 120 }}
                />
                <button type="button" onClick={handleSaveGhraNumber} disabled={editGhraLoading} className="nav-button approve-action-button" style={{ padding: '4px 10px', fontSize: 12 }}>
                  {editGhraLoading ? '…' : 'Save'}
                </button>
                <button type="button" onClick={() => { setEditingGhra(null); setEditGhraError('') }} disabled={editGhraLoading} className="nav-button cancel-button" style={{ padding: '4px 10px', fontSize: 12 }}>
                  Cancel
                </button>
                {editGhraError && <span style={{ color: '#e74c3c', fontSize: 12 }}>{editGhraError}</span>}
              </div>
            ) : (
              <span className="ghra-number-header-value">
                {application.GhraNumber || <em style={{ color: '#aaa' }}>Not yet assigned</em>}
                {isEmployee && (
                  <button
                    type="button"
                    onClick={() => { setEditingGhra(application.GhraNumber || ''); setEditGhraError('') }}
                    style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ghra-navy)', fontSize: 13 }}
                  >
                    {application.GhraNumber ? '✎ Edit' : '+ Assign'}
                  </button>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {application.IsArchived && isEmployee && (
        <div className="archived-banner">
          <span className="archived-banner-icon">🗄</span>
          <span className="archived-banner-text">
            Archived
            {application.ArchivedAt && ` on ${new Date(application.ArchivedAt).toLocaleDateString()}`}
            {application.ArchivedBy && ` by ${application.ArchivedBy}`}
          </span>
          {unarchiveError && (
            <span style={{ color: '#721c24', fontSize: 12, marginLeft: 8 }}>{unarchiveError}</span>
          )}
          <button
            type="button"
            className="archived-banner-unarchive"
            disabled={unarchiving}
            onClick={async () => {
              setUnarchiving(true)
              setUnarchiveError(null)
              let result
              try {
                result = await unarchiveApplications([application.Id])
              } finally {
                setUnarchiving(false)
              }
              if (result.success) {
                try {
                  const updated = await getApplicationById(id)
                  if (updated) setApplication(updated)
                } catch {}
              } else {
                setUnarchiveError(result.error || 'Restore failed')
              }
            }}
          >
            {unarchiving ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      )}

      {application.Notes && (
        <div className={`reviewer-comments-banner ${application.Status === 'rejected' ? 'banner-rejected' : application.Status === 'approved' ? 'banner-approved' : 'banner-info'}`}>
          <div className="reviewer-comments-header">
            <span className="reviewer-comments-icon">
              {application.Status === 'rejected' ? '✕' : application.Status === 'approved' ? '✓' : '💬'}
            </span>
            <strong>Reviewer Comments</strong>
            {application.ReviewedBy && (
              <span className="reviewer-meta">
                by {formatReviewerName(application.ReviewedBy)}
                {application.ReviewedAt && ` on ${new Date(application.ReviewedAt).toLocaleDateString()}`}
              </span>
            )}
          </div>
          <p className="reviewer-comments-text">{application.Notes}</p>
        </div>
      )}

      <ProgressIndicator
        currentStep={currentSection}
        totalSteps={SECTIONS.length}
        steps={SECTIONS}
        onStepClick={handleSectionClick}
      />

      {commentsHistory.length > 0 && (
        <div className="review-history-panel">
          <button className="review-history-toggle" onClick={() => setHistoryOpen(o => !o)}>
            <span>Review History ({commentsHistory.length})</span>
            <span className="toggle-arrow">{historyOpen ? '▲' : '▼'}</span>
          </button>
          {historyOpen && (
            <div className="comments-history-list">
              {commentsHistory.map((entry, idx) => (
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

      <div className="membership-form view-app-form">
        <div className="step-content">
          {renderSection()}
        </div>

        <div className="form-navigation">
          <button type="button" onClick={handleBack} className="nav-button cancel-button">
            ← Dashboard
          </button>
          <button
            type="button"
            onClick={() => currentSection > 1 && handleSectionClick(currentSection - 1)}
            disabled={currentSection === 1}
            className="nav-button prev-button"
          >
            ← Previous
          </button>
          {currentSection < SECTIONS.length && (
            <button
              type="button"
              onClick={() => handleSectionClick(currentSection + 1)}
              className="nav-button next-button"
            >
              Next →
            </button>
          )}
          {isEmployee && (
            <>
              <button type="button" onClick={handleEdit} className="nav-button edit-action-button">
                ✎ Edit
              </button>
              {(() => {
                const alreadySent = application.Status === 'pending_signature' || application.Status === 'signed' || !!application.SignatureRequestId
                const approveDisabled = application.Status !== 'submitted' || !!application.SignatureRequestId || approving
                const rejectDisabled  = application.Status !== 'submitted' || !!application.SignatureRequestId || approving
                const sentTip = 'This application has already been approved and sent for signature.'
                return (
                  <>
                    <button
                      type="button"
                      onClick={handleApproveClick}
                      disabled={approveDisabled}
                      title={alreadySent ? sentTip : undefined}
                      className="nav-button approve-action-button"
                    >
                      {approving ? 'Approving…' : '✓ Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectClick}
                      disabled={rejectDisabled}
                      title={alreadySent ? sentTip : undefined}
                      className="nav-button reject-action-button"
                    >
                      ✕ Reject
                    </button>
                  </>
                )
              })()}
            </>
          )}
          <button type="button" onClick={() => generateApplicationPDF(application)} className="nav-button download-button">
            📥 Download PDF
          </button>
          {isEmployee && (
            <button type="button" onClick={() => downloadAllDocuments(application.Id, application.StoreName)} className="nav-button download-button" style={{ background: '#17a2b8' }}>
              📦 Download All Docs
            </button>
          )}
        </div>

        {isEmployee && application?.Status === 'rejected' && application?.SignatureRequestId && (
          <div className="rejected-sig-warning">
            <strong>Warning:</strong> This application was rejected but a Dropbox Sign request exists
            ({application.SignatureRequestId.slice(0, 12)}…). The member may still hold a live signing link.
            Verify in Dropbox Sign that the request was cancelled.
          </div>
        )}

        {approvalError && (
          <div className="approval-error-banner">
            <strong>Approval failed:</strong> {approvalError}
            <button className="approval-error-dismiss" onClick={() => setApprovalError(null)}>✕</button>
          </div>
        )}
      </div>

      {isEmployee && (
        <div className="ds-activity-panel">
          <button className="ds-activity-toggle" onClick={handleDsActivityOpen}>
            <span>Signature Activity</span>
            <span className="ds-activity-chevron">{dsActivityOpen ? '▲' : '▼'}</span>
          </button>
          {dsActivityOpen && (
            <div className="ds-activity-body">
              {dsEventsLoading ? (
                <p className="ds-activity-loading">Loading…</p>
              ) : dsEventsError ? (
                <p className="ds-activity-error">Error: {dsEventsError}</p>
              ) : !dsEvents?.length ? (
                <p className="ds-activity-empty">No Dropbox Sign activity recorded for this application yet.</p>
              ) : (
                <table className="ds-activity-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Operation</th>
                      <th>Direction</th>
                      <th>Result</th>
                      <th>Error</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dsEvents.map(ev => (
                      <tr key={ev.Id}>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr className={`ds-ev-row ${ev.Success ? 'ds-ev-ok' : 'ds-ev-fail'}`}>
                                <td className="ds-ev-time">{new Date(ev.CreatedAt).toLocaleString()}</td>
                                <td className="ds-ev-op">{ev.Operation}</td>
                                <td className="ds-ev-dir">{ev.Direction}</td>
                                <td className="ds-ev-status">{ev.Success ? '✓' : '✗'}</td>
                                <td className="ds-ev-err">{ev.ErrorCode ? `${ev.ErrorCode}: ${ev.ErrorMessage || ''}` : (ev.ErrorMessage || '')}</td>
                                <td className="ds-ev-actions">
                                  <button className="ds-ev-expand" onClick={() => setExpandedDsRow(expandedDsRow === ev.Id ? null : ev.Id)}>
                                    {expandedDsRow === ev.Id ? 'Hide' : 'Details'}
                                  </button>
                                </td>
                              </tr>
                              {expandedDsRow === ev.Id && (
                                <tr className="ds-ev-detail-row">
                                  <td colSpan={6}>
                                    <div className="ds-ev-detail">
                                      {ev.RequestSummary && (
                                        <div><strong>Request:</strong><pre className="ds-ev-json">{ev.RequestSummary}</pre></div>
                                      )}
                                      {ev.ResponseSummary && (
                                        <div><strong>Response:</strong><pre className="ds-ev-json">{ev.ResponseSummary}</pre></div>
                                      )}
                                      {!ev.RequestSummary && !ev.ResponseSummary && (
                                        <p>No detail captured.</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {isEmployee && (
        <div className="ds-activity-panel">
          <button className="ds-activity-toggle" onClick={handleAuditOpen}>
            <span>Activity Log</span>
            <span className="ds-activity-chevron">{auditOpen ? '▲' : '▼'}</span>
          </button>
          {auditOpen && (
            <div className="ds-activity-body">
              {auditLoading ? (
                <p className="ds-activity-loading">Loading…</p>
              ) : auditError ? (
                <p className="ds-activity-error">Error: {auditError}</p>
              ) : !auditEntries?.length ? (
                <p className="ds-activity-empty">No activity recorded for this application yet.</p>
              ) : (
                <table className="ds-activity-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>By</th>
                      <th>Status change</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEntries.map(ev => (
                      <tr key={ev.Id}>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr className={`ds-ev-row ${ev.Action === 'rejected' ? 'ds-ev-fail' : ev.Action === 'approved' ? 'ds-ev-ok' : ''}`}>
                                <td className="ds-ev-time">{new Date(ev.CreatedAt).toLocaleString()}</td>
                                <td className="ds-ev-op">{ev.Action.replace(/_/g, ' ')}</td>
                                <td className="ds-ev-dir" style={{ fontSize: 11 }}>{ev.PerformedBy}</td>
                                <td className="ds-ev-dir" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                  {ev.PreviousStatus && ev.NewStatus ? `${ev.PreviousStatus} → ${ev.NewStatus}` : (ev.NewStatus || '')}
                                </td>
                                <td className="ds-ev-actions">
                                  {ev.Details && (
                                    <button className="ds-ev-expand" onClick={() => setExpandedAuditRow(expandedAuditRow === ev.Id ? null : ev.Id)}>
                                      {expandedAuditRow === ev.Id ? 'Hide' : 'Details'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {expandedAuditRow === ev.Id && ev.Details && (
                                <tr className="ds-ev-detail-row">
                                  <td colSpan={5}>
                                    <div className="ds-ev-detail">
                                      <pre className="ds-ev-json">{ev.Details}</pre>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="view-app-footer">
        <p>This is a read-only view of your submitted application. To make changes, please create a new application.</p>
      </footer>

      {approvalDialog && (
        <ApprovalDialog
          application={application}
          action={approvalDialog.action}
          onConfirm={handleApprovalConfirm}
          onCancel={() => { setApprovalDialog(null); setPrefillLoading(false) }}
          initialBoardSigners={approvalDialog.action === 'approve' ? lastBoardSigners : null}
          prefillLoading={approvalDialog.action === 'approve' ? prefillLoading : false}
          currentUser={currentUser}
        />
      )}

      {lightboxSrc && (
        <div className="mfu-lightbox" onClick={closeLightbox}>
          <button type="button" className="mfu-lightbox-close" onClick={closeLightbox}>×</button>
          <img
            src={lightboxSrc}
            className="mfu-lightbox-img"
            alt="Preview"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default ViewApplication
