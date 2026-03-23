import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { generateApplicationPDF } from '../utils/pdfExport'
import ProgressIndicator from './ProgressIndicator'
import ApprovalDialog from './ApprovalDialog'
import '../styles/ViewApplication.css'

// ── Value → Display label lookup maps ────────────────────────────────────────

const OWNERSHIP_TYPE = {
  'sole-proprietor':   'Sole Proprietorship',
  'partnership':       'Partnership',
  'limited-partnership': 'Limited Partnership',
  'corporation':       'Corporation',
  'llc':               'LLC'
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

function ViewApplication({ applicationId, onBack, onEdit }) {
  const { currentUser, getApplicationById, updateApplicationStatus } = useContext(AuthContext)
  const isEmployee = currentUser?.role === 'employee'

  const [application, setApplication]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [currentSection, setCurrentSection] = useState(1)
  const [approvalDialog, setApprovalDialog] = useState(null)

  useEffect(() => {
    setLoading(true)
    getApplicationById(applicationId).then(data => {
      setApplication(data)
      setLoading(false)
    })
  }, [applicationId])

  const handleSectionClick = (id) => { setCurrentSection(id); window.scrollTo(0, 0) }
  const handleApproveClick = () => setApprovalDialog({ action: 'approve' })
  const handleRejectClick  = () => setApprovalDialog({ action: 'reject' })

  const handleApprovalConfirm = async (comments) => {
    const newStatus = approvalDialog.action === 'approve' ? 'approved' : 'rejected'
    await updateApplicationStatus(applicationId, newStatus, comments)
    setApprovalDialog(null)
    onBack()
  }

  if (loading) {
    return <div className="view-application-container"><div className="empty-state"><p>Loading application...</p></div></div>
  }
  if (!application) {
    return (
      <div className="view-application-container">
        <button className="back-button" onClick={onBack}>← Back to Dashboard</button>
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

  // Gray sub-section box — matches the References style exactly
  const Section = ({ title, children }) => (
    <div className="form-section-inner">
      {title && <span className="inner-legend">{title}</span>}
      {children}
    </div>
  )

  // ── Section renderers ────────────────────────────────────────────────────

  const renderSection = () => {
    switch (currentSection) {

      // ── 1: Qualifying Business ───────────────────────────────────────────
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

      // ── 2: Business Information ──────────────────────────────────────────
      case 2:
        return (
          <fieldset className="form-section">
            <legend>Business Information</legend>

            <Section title="Type of Ownership">
              <InfoRow>
                <InfoField label="Ownership Type" value={lbl(OWNERSHIP_TYPE, data.ownershipType)} />
              </InfoRow>
            </Section>

            <Section title="Business Type">
              <InfoRow>
                <InfoField label="Business Type" value={lbl(BUSINESS_TYPE, data.businessType)} />
              </InfoRow>
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
            </Section>

            <Section title="Previous Membership">
              <InfoRow>
                <InfoField label="Was the store previously a member store of GHRA?" value={data.previousMember ? 'Yes' : 'No'} />
                {data.previousMember && <InfoField label="Previous GHRA #" value={data.previousGhraNumber} />}
              </InfoRow>
            </Section>
          </fieldset>
        )

      // ── 3: Store Information ─────────────────────────────────────────────
      case 3:
        return (
          <fieldset className="form-section">
            <legend>Store Information</legend>

            <Section title="Store Condition">
              <InfoRow>
                <InfoField label="Store Condition" value={lbl(STORE_CONDITION, data.storeCondition)} />
              </InfoRow>
            </Section>

            <Section title="Business Property">
              <InfoRow>
                <InfoField label="Business Property" value={lbl(BUSINESS_PROPERTY, data.businessProperty)} />
                <InfoField label="Store Size" value={data.storeSize} />
              </InfoRow>
            </Section>

            <Section title="Fuel">
              <InfoRow>
                <InfoField label="If with fuel" value={lbl(FUEL_AVAILABLE, data.fuelAvailable)} />
                {data.fuelAvailable === 'branded' && <InfoField label="Brand Name" value={data.brandName} />}
                <InfoField label="Number of Tanks" value={data.numberOfTanks} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Tank Capacity" value={data.tankCapacity} />
                <InfoField label="Estimated Fuels Sales per month" value={data.estimatedFuelSales} />
                <InfoField label="Current Fuel Supplier(s)" value={data.currentFuelSupplier} />
              </InfoRow>
              <InfoRow>
                <InfoField label="TCEQ number" value={data.tceqNumber} />
              </InfoRow>
            </Section>

            <Section title="POS System">
              <InfoRow>
                <InfoField label="Do you scan your products at the POS?" value={lbl(YES_NO, data.scanPOS)} />
                <InfoField label="Who is back office provider?" value={data.backOfficeProvider} />
              </InfoRow>
              <InfoRow>
                <InfoField label="What register system (POS) is being used?" value={lbl(POS_SYSTEM, data.posSystem)} />
              </InfoRow>
            </Section>

            <Section title="Food Service">
              <InfoRow>
                <InfoField label="Do you have food service at store" value={lbl(YES_NO, data.foodServiceAvailable)} />
              </InfoRow>
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
              <InfoRow>
                <InfoField label="Does your store have a beer cave?" value={lbl(YES_NO, data.beerCave)} />
              </InfoRow>
            </Section>

            <Section title="Spanner Board">
              <InfoRow>
                <InfoField label="Spanner Board Available" value={data.storeSpannerBoard ? 'Yes' : 'No'} />
              </InfoRow>
            </Section>

            <Section title="Store Address">
              <InfoRow>
                <InfoField label="Store Address" value={data.storeAddress} />
              </InfoRow>
              <InfoRow>
                <InfoField label="City" value={data.storeCity} />
                <InfoField label="State" value="TX" />
                <InfoField label="Zip Code" value={data.storeZip} />
                <InfoField label="County" value={data.storeCounty} />
              </InfoRow>
            </Section>

            <Section title="Mailing Address">
              <InfoRow>
                <InfoField label="Mailing Address" value={data.mailingAddress} />
              </InfoRow>
              <InfoRow>
                <InfoField label="City" value={data.mailingCity} />
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
              <InfoRow>
                <InfoField label="Email Address" value={data.emailAddress} />
              </InfoRow>
            </Section>
          </fieldset>
        )

      // ── 4: Owners & Management ───────────────────────────────────────────
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
                  <InfoField label="State Issued" value={owner.stateIssued} />
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

      // ── 5: References ────────────────────────────────────────────────────
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

      // ── 6: ACH Authorization ─────────────────────────────────────────────
      case 6: {
        const achOptions = [
          { id: 'corporate', label: 'GHRA Corporate' },
          { id: 'warehouse', label: 'GHRA Warehouse' },
          { id: 'fuels',     label: 'GHRA Fuels' }
        ]
        const achInfoFor    = data.achInfoFor || {}
        const bankAccounts  = data.bankAccounts || []
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

      // ── 7: Warehouse Application ─────────────────────────────────────────
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

      // ── 8: Donations ─────────────────────────────────────────────────────
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

      // ── 9: Documents ─────────────────────────────────────────────────────
      case 9: {
        const owners = data.owners || []
        const multipleOwners = owners.length > 1
        const docFields = [
          ...(multipleOwners
            ? owners.map((o, i) => ({
                key: `driverLicense_owner_${i}`,
                label: `Driver License — ${[o.firstName, o.lastName].filter(Boolean).join(' ') || `Owner ${i + 1}`}`
              }))
            : [{ key: 'driverLicenseCopies', label: 'Driver License Copies' }]),
          { key: 'salesTaxPermit',          label: 'Sales Tax Permit' },
          { key: 'articlesOfIncorporation', label: 'Articles of Incorporation/Certificate of Formation' },
          { key: 'irsDocument',             label: 'IRS Document' },
          { key: 'tobaccoPermit',           label: 'Tobacco Permit' },
          { key: 'beerLicense',             label: 'Beer License' }
        ]
        return (
          <fieldset className="form-section">
            <legend>Documents</legend>
            <Section title="Uploaded Documents">
              <div className="documents-review-list">
                {docFields.map(({ key, label: docLabel }) => {
                  const val = data[key]
                  const uploaded = !!val
                  const originalName = typeof val === 'object' ? val.originalName : (val || null)
                  const url = typeof val === 'object' ? val.url : null
                  return (
                    <div key={key} className="document-review-item">
                      <span className={`doc-status-icon ${uploaded ? 'uploaded' : 'missing'}`}>
                        {uploaded ? '✓' : '✕'}
                      </span>
                      <span className="doc-review-label">{docLabel}</span>
                      {uploaded && originalName && (
                        <span className="doc-review-filename">{originalName}</span>
                      )}
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="doc-preview-link">
                          Preview
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          </fieldset>
        )
      }

      // ── 10: Agreements ───────────────────────────────────────────────────
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
      </div>

      <ProgressIndicator
        currentStep={currentSection}
        totalSteps={SECTIONS.length}
        steps={SECTIONS}
        onStepClick={handleSectionClick}
      />

      <div className="membership-form view-app-form">
        <div className="step-content">
          {renderSection()}
        </div>

        <div className="form-navigation">
          <button type="button" onClick={onBack} className="nav-button cancel-button">
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
              {onEdit && (
                <button type="button" onClick={() => onEdit(applicationId)} className="nav-button edit-action-button">
                  ✎ Edit
                </button>
              )}
              <button type="button" onClick={handleApproveClick} disabled={application.Status !== 'submitted'} className="nav-button approve-action-button">
                ✓ Approve
              </button>
              <button type="button" onClick={handleRejectClick} disabled={application.Status !== 'submitted'} className="nav-button reject-action-button">
                ✕ Reject
              </button>
            </>
          )}
          <button type="button" onClick={() => generateApplicationPDF(application)} className="nav-button download-button">
            📥 Download PDF
          </button>
        </div>
      </div>

      <footer className="view-app-footer">
        <p>This is a read-only view of your submitted application. To make changes, please create a new application.</p>
      </footer>

      {approvalDialog && (
        <ApprovalDialog
          application={application}
          action={approvalDialog.action}
          onConfirm={handleApprovalConfirm}
          onCancel={() => setApprovalDialog(null)}
        />
      )}
    </div>
  )
}

export default ViewApplication
