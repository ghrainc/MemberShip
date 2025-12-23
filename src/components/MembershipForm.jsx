import { useState } from 'react'
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

function MembershipForm({ userEmail, onSubmit, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
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
    storeZip: '',
    storeCounty: '',
    mailingAddress: '',
    mailingCity: '',
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
    storeSpannerBoard: false,
    owners: [{ firstName: '', middleInitial: '', lastName: '', title: '', ownershipPercent: '' }],
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
    bankName: '',
    bankAddress: '',
    bankCity: '',
    bankState: '',
    bankZip: '',
    transitAbaNumber: '',
    accountNumber: '',
    achInfoFor: 'corporate',
    akdnContribute: '',
    akdnAmount: '',
    hfbContribute: '',
    hfbAmount: '',
    donationAuthRepFirstName: '',
    donationAuthRepLastName: '',
    acknowledgement: false
  })

  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const CurrentStepComponent = STEPS[currentStep - 1].component

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'custom' ? value : value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleOwnerChange = (index, field, value) => {
    const updatedOwners = [...formData.owners]
    updatedOwners[index][field] = value
    setFormData(prev => ({
      ...prev,
      owners: updatedOwners
    }))
  }

  const addOwner = () => {
    setFormData(prev => ({
      ...prev,
      owners: [...prev.owners, { firstName: '', middleInitial: '', lastName: '', title: '', ownershipPercent: '' }]
    }))
  }

  const removeOwner = (index) => {
    if (formData.owners.length > 1) {
      setFormData(prev => ({
        ...prev,
        owners: prev.owners.filter((_, i) => i !== index)
      }))
    }
  }

  const validateStep = () => {
    const newErrors = {}

    switch (currentStep) {
      case 1: // Qualifying Business
        if (!formData.hardLiquor) newErrors.hardLiquor = 'Please answer all questions'
        if (!formData.ageRequirement) newErrors.ageRequirement = 'Please answer all questions'
        if (!formData.closedSundayAfter9pm) newErrors.closedSundayAfter9pm = 'Please answer all questions'
        if ((formData.storeProductCategories || []).length < 7) newErrors.storeProductCategories = 'Must select minimum 7 product categories'
        break

      case 2: // Business Information
        if (!formData.memberName.trim()) newErrors.memberName = 'Member Name is required'
        if (!formData.ein.trim()) newErrors.ein = 'EIN is required'
        if (!formData.salesTaxId.trim()) newErrors.salesTaxId = 'Sales Tax ID is required'
        if (!formData.authorizedRepFirstName.trim()) newErrors.authorizedRepFirstName = 'Authorized Representative First Name is required'
        if (!formData.authorizedRepLastName.trim()) newErrors.authorizedRepLastName = 'Authorized Representative Last Name is required'
        break

      case 3: // Store Information
        if (!formData.storeAddress.trim()) newErrors.storeAddress = 'Store Address is required'
        if (!formData.storeCity.trim()) newErrors.storeCity = 'Store City is required'
        if (!formData.storeZip.trim()) newErrors.storeZip = 'Store Zip Code is required'
        if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email Address is required'

        // Fuel fields validation
        if (!formData.fuelAvailable) newErrors.fuelAvailable = 'If with fuel is required'
        if (!formData.numberOfTanks) newErrors.numberOfTanks = 'Number of Tanks is required'
        if (!formData.tankCapacity) newErrors.tankCapacity = 'Tank Capacity is required'
        if (!formData.estimatedFuelSales) newErrors.estimatedFuelSales = 'Estimated Fuels Sales per month is required'
        if (!formData.currentFuelSupplier.trim()) newErrors.currentFuelSupplier = 'Current Fuel Supplier(s) is required'
        if (!formData.tceqNumber.trim()) newErrors.tceqNumber = 'TCEQ number is required'

        // POS fields validation
        if (!formData.scanPOS) newErrors.scanPOS = 'Do you scan your products at the POS? is required'
        if (!formData.backOfficeProvider.trim()) newErrors.backOfficeProvider = 'Who is back office provider? is required'
        if (!formData.posSystem) newErrors.posSystem = 'What register system (POS) is being used? is required'

        // Food Service fields validation
        if (!formData.foodServiceAvailable) newErrors.foodServiceAvailable = 'Do you have food service at store is required'
        if (formData.foodServiceAvailable === 'yes') {
          if (!formData.foodConcept) newErrors.foodConcept = 'Food Concept is required'
          if (!formData.foodServiceBranded) newErrors.foodServiceBranded = 'Is your food service branded is required'
          if (!formData.bigMardKudosGameday) newErrors.bigMardKudosGameday = 'Are you interested in receiving more information on BIG MARD, KUDOS and GAMEDAY CHICKEN? is required'
          if (formData.foodServiceBranded === 'yes' && !formData.foodBrandName.trim()) newErrors.foodBrandName = 'Brand Name is required'
        }

        // Cooler fields validation
        if (!formData.walkInCooler) newErrors.walkInCooler = 'Does your store have a walk-in cooler? is required'
        if (formData.walkInCooler === 'yes' && !formData.coolerDoors) newErrors.coolerDoors = 'Number of cooler doors is required'
        if (!formData.walkInFreezer) newErrors.walkInFreezer = 'Does your store have a walk-in Freezer? is required'
        if (formData.walkInFreezer === 'yes' && !formData.freezerDoors) newErrors.freezerDoors = 'Number of freezer doors is required'
        if (!formData.beerCave) newErrors.beerCave = 'Does your store have a beer cave? is required'
        break

      case 4: // Owners & Management
        if (!formData.storeManagerFirstName.trim()) newErrors.storeManagerFirstName = 'Store Manager First Name is required'
        if (!formData.storeManagerLastName.trim()) newErrors.storeManagerLastName = 'Store Manager Last Name is required'
        break

      case 8: // Donations
        // Donations step has no required validation
        break

      case 9: // Documents
        if (!formData.driverLicenseCopies) newErrors.driverLicenseCopies = 'Driver License Copies are required'
        if (!formData.salesTaxPermit) newErrors.salesTaxPermit = 'Sales Tax Permit is required'
        if (!formData.articlesOfIncorporation) newErrors.articlesOfIncorporation = 'Articles of Incorporation/Certificate of Formation is required'
        if (!formData.irsDocument) newErrors.irsDocument = 'IRS Document is required'
        break

      case 10: // Agreements
        if (!formData.acknowledgement) newErrors.acknowledgement = 'You must acknowledge the membership requirements'
        break

      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
        window.scrollTo(0, 0)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleStepClick = (stepId) => {
    setCurrentStep(stepId)
    window.scrollTo(0, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateStep()) {
      return
    }

    onSubmit(formData)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="membership-container">
        <div className="success-card">
          <h1>Application Submitted Successfully</h1>
          <p>Thank you for your membership application!</p>
          <p>Your application has been submitted and will be reviewed by the GHRA Board of Directors.</p>
          <p>You will receive a confirmation email at: <strong>{userEmail}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div className="membership-container">
      <div className="membership-header">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
          alt="GHRA Logo"
          className="membership-logo"
        />
        <h1>GHRA Membership Application</h1>
        <p className="header-subtitle">Greater Houston Retailers Cooperative Association, Inc.</p>
        <p className="applicant-email">Applicant Email: {userEmail}</p>
      </div>

      <ProgressIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} onStepClick={handleStepClick} />

      <form onSubmit={handleSubmit} className="membership-form step-form">
        <div className="step-content">
          <CurrentStepComponent
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleOwnerChange={handleOwnerChange}
            addOwner={addOwner}
            removeOwner={removeOwner}
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
            <button
              type="submit"
              className="nav-button submit-button"
            >
              Submit Application
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="nav-button next-button"
            >
              Next →
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="nav-button cancel-button"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default MembershipForm
