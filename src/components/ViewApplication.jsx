import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { generateApplicationPDF } from '../utils/pdfExport'
import ProgressIndicator from './ProgressIndicator'
import ApprovalDialog from './ApprovalDialog'
import '../styles/ViewApplication.css'

const SECTIONS = [
  { id: 1, title: 'Qualifying Business' },
  { id: 2, title: 'Business Information' },
  { id: 3, title: 'Store Information' },
  { id: 4, title: 'Owners & Management' },
  { id: 5, title: 'References' },
  { id: 6, title: 'Financial Information' },
  { id: 7, title: 'Documents' }
]

function ViewApplication({ applicationId, onBack }) {
  const { currentUser, getApplicationById, getAllApplications, updateApplicationStatus } = useContext(AuthContext)
  const isEmployee = currentUser?.role === 'employee'

  let application
  if (isEmployee) {
    const allApps = getAllApplications()
    application = allApps.find(app => app.id === applicationId)
  } else {
    application = getApplicationById(currentUser?.email, applicationId)
  }

  const [currentSection, setCurrentSection] = useState(1)
  const [approvalDialog, setApprovalDialog] = useState(null)

  const handleDownloadPDF = () => {
    if (application) {
      generateApplicationPDF(application)
    }
  }

  const handleSectionClick = (sectionId) => {
    setCurrentSection(sectionId)
    window.scrollTo(0, 0)
  }

  const handleApproveClick = () => {
    setApprovalDialog({ action: 'approve' })
  }

  const handleRejectClick = () => {
    setApprovalDialog({ action: 'reject' })
  }

  const handleApprovalConfirm = (comments) => {
    const action = approvalDialog.action
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    updateApplicationStatus(applicationId, newStatus, comments)
    setApprovalDialog(null)
    onBack()
  }

  const handleApprovalCancel = () => {
    setApprovalDialog(null)
  }

  if (!application) {
    return (
      <div className="view-application-container">
        <button className="back-button" onClick={onBack}>← Back to Dashboard</button>
        <div className="error-message">Application not found</div>
      </div>
    )
  }

  const data = application.fullData || {}

  const InfoField = ({ label, value }) => (
    <div className="info-field">
      <span className="info-field-label">{label}</span>
      <span className="info-field-value">{value || 'Not provided'}</span>
    </div>
  )

  const InfoRow = ({ children }) => (
    <div className="info-row">
      {children}
    </div>
  )

  const renderSection = () => {
    switch (currentSection) {
      case 1:
        return (
          <fieldset className="form-section">
            <legend>Qualifying Business Information</legend>
            <div className="form-section-inner">
              <span className="inner-legend">Certification Answers</span>
              <InfoRow>
                <InfoField label="Hard Liquor Sales" value={data.hardLiquor === 'yes' ? 'Yes' : 'No'} />
                <InfoField label="Age Requirement" value={data.ageRequirement === 'yes' ? 'Yes' : 'No'} />
                <InfoField label="Closed Sunday After 9pm" value={data.closedSundayAfter9pm === 'yes' ? 'Yes' : 'No'} />
              </InfoRow>
            </div>

            <div className="form-section-inner">
              <span className="inner-legend">Store Certification</span>
              <InfoRow>
                <InfoField label="Store Name" value={data.storeNameCertification} />
                <InfoField label="Authorized Representative" value={data.authorizedRepNameCertification} />
              </InfoRow>
            </div>

            {data.storeProductCategories && data.storeProductCategories.length > 0 && (
              <div className="form-section-inner">
                <span className="inner-legend">Product Categories</span>
                <div className="category-list">
                  {data.storeProductCategories.map((cat, idx) => (
                    <span key={idx} className="category-tag">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        )

      case 2:
        return (
          <fieldset className="form-section">
            <legend>Business Information</legend>
            <div className="form-section-inner">
              <span className="inner-legend">Member & Business Details</span>
              <InfoRow>
                <InfoField label="Member Name" value={data.memberName} />
                <InfoField label="DBA/Assumed Name" value={data.dbaName} />
              </InfoRow>
              <InfoRow>
                <InfoField label="EIN" value={data.ein} />
                <InfoField label="Sales Tax ID" value={data.salesTaxId} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Ownership Type" value={data.ownershipType} />
                <InfoField label="Business Type" value={data.businessType} />
              </InfoRow>
            </div>
          </fieldset>
        )

      case 3:
        return (
          <fieldset className="form-section">
            <legend>Store Information</legend>
            <div className="form-section-inner">
              <span className="inner-legend">Location Details</span>
              <InfoRow>
                <InfoField label="Store Address" value={data.storeAddress} />
              </InfoRow>
              <InfoRow>
                <InfoField label="City" value={data.storeCity} />
                <InfoField label="State" value="TX" />
                <InfoField label="Zip Code" value={data.storeZip} />
              </InfoRow>
            </div>

            <div className="form-section-inner">
              <span className="inner-legend">Contact Information</span>
              <InfoRow>
                <InfoField label="Store Phone" value={data.storePhone} />
                <InfoField label="Email Address" value={data.emailAddress} />
              </InfoRow>
            </div>

            <div className="form-section-inner">
              <span className="inner-legend">Business Details</span>
              <InfoRow>
                <InfoField label="Store Size (sq ft)" value={data.storeSize} />
                <InfoField label="Business Property" value={data.businessProperty} />
              </InfoRow>
            </div>
          </fieldset>
        )

      case 4:
        return (
          <fieldset className="form-section">
            <legend>Owners & Management</legend>
            {data.owners && data.owners.length > 0 && (
              <div className="form-section-inner">
                <span className="inner-legend">Owner Information</span>
                <div className="owners-list">
                  {data.owners.map((owner, idx) => (
                    <div key={idx} className="owner-subsection">
                      <h4>Owner {idx + 1}</h4>
                      <InfoRow>
                        <InfoField label="First Name" value={owner.firstName} />
                        <InfoField label="Middle Initial" value={owner.middleInitial} />
                        <InfoField label="Last Name" value={owner.lastName} />
                      </InfoRow>
                      <InfoRow>
                        <InfoField label="Title" value={owner.title} />
                        <InfoField label="Ownership %" value={owner.ownershipPercent} />
                      </InfoRow>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="form-section-inner">
              <span className="inner-legend">Authorized Representative</span>
              <InfoRow>
                <InfoField label="Name" value={data.authorizedRepName} />
                <InfoField label="Title" value={data.authorizedRepTitle} />
              </InfoRow>
            </div>
          </fieldset>
        )

      case 5:
        return (
          <fieldset className="form-section">
            <legend>References</legend>
            <div className="form-section-inner">
              <span className="inner-legend">Reference 1</span>
              <InfoRow>
                <InfoField label="Company Name" value={data.reference1Company} />
                <InfoField label="GHRA Membership #" value={data.reference1GhraNumber} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Email" value={data.reference1Email} />
                <InfoField label="Representative Name" value={data.reference1RepName} />
              </InfoRow>
            </div>

            <div className="form-section-inner">
              <span className="inner-legend">Reference 2</span>
              <InfoRow>
                <InfoField label="Company Name" value={data.reference2Company} />
                <InfoField label="GHRA Membership #" value={data.reference2GhraNumber} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Email" value={data.reference2Email} />
                <InfoField label="Representative Name" value={data.reference2RepName} />
              </InfoRow>
            </div>
          </fieldset>
        )

      case 6:
        return (
          <fieldset className="form-section">
            <legend>Financial Information</legend>
            <div className="form-section-inner">
              <span className="inner-legend">Bank Details</span>
              <InfoRow>
                <InfoField label="Bank Name" value={data.bankName} />
                <InfoField label="Bank Address" value={data.bankAddress} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Bank City" value={data.bankCity} />
                <InfoField label="Bank State" value={data.bankState} />
                <InfoField label="Bank Zip" value={data.bankZip} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Transit/ABA Number" value={data.transitAbaNumber} />
                <InfoField label="Account Number" value={data.accountNumber} />
              </InfoRow>
            </div>
          </fieldset>
        )

      case 7:
        return (
          <fieldset className="form-section">
            <legend>Documents</legend>
            <div className="form-section-inner">
              <span className="inner-legend">Uploaded Documents</span>
              <InfoRow>
                <InfoField label="Driver License Copies" value={data.driverLicenseCopies ? '✓ Uploaded' : 'Not uploaded'} />
                <InfoField label="Sales Tax Permit" value={data.salesTaxPermit ? '✓ Uploaded' : 'Not uploaded'} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Articles of Incorporation" value={data.articlesOfIncorporation ? '✓ Uploaded' : 'Not uploaded'} />
                <InfoField label="IRS Document" value={data.irsDocument ? '✓ Uploaded' : 'Not uploaded'} />
              </InfoRow>
              <InfoRow>
                <InfoField label="Tobacco Permit" value={data.tobaccoPermit ? '✓ Uploaded' : 'Not uploaded'} />
                <InfoField label="Beer License" value={data.beerLicense ? '✓ Uploaded' : 'Not uploaded'} />
              </InfoRow>
            </div>
          </fieldset>
        )

      default:
        return null
    }
  }

  return (
    <div className="membership-container view-app-mode">
      <div className="membership-header">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
          alt="GHRA Logo"
          className="membership-logo"
        />
        <h1>Application Review</h1>
        <p className="header-subtitle">{application.storeName}</p>
        <p className="submitted-info">Submitted: {new Date(application.submittedDate).toLocaleDateString()} | ID: {application.id}</p>
      </div>

      <ProgressIndicator currentStep={currentSection} totalSteps={SECTIONS.length} steps={SECTIONS} onStepClick={handleSectionClick} />

      <div className="membership-form view-app-form">
        <div className="step-content">
          {renderSection()}
        </div>

        <div className="form-navigation">
          {isEmployee ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="nav-button cancel-button"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleApproveClick}
                disabled={application?.status !== 'submitted'}
                className="nav-button approve-action-button"
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={handleRejectClick}
                disabled={application?.status !== 'submitted'}
                className="nav-button reject-action-button"
              >
                ✕ Reject
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="nav-button download-button"
              >
                📥 Download PDF
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => currentSection > 1 && handleSectionClick(currentSection - 1)}
                disabled={currentSection === 1}
                className="nav-button prev-button"
              >
                ← Previous
              </button>

              {currentSection === SECTIONS.length ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="nav-button submit-button"
                >
                  Back to Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSectionClick(currentSection + 1)}
                  className="nav-button next-button"
                >
                  Next →
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="nav-button download-button"
              >
                📥 Download PDF
              </button>
            </>
          )}
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
          onCancel={handleApprovalCancel}
        />
      )}
    </div>
  )
}

export default ViewApplication
