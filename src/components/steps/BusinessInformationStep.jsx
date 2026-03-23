// Helpers
const numericInput = (handleInputChange, name) => (e) => {
  const value = e.target.value.replace(/\D/g, '')
  handleInputChange({ target: { name, value, type: 'text' } })
}

function formatEin(raw, isSoleProprietor) {
  const digits = raw.replace(/\D/g, '')
  if (isSoleProprietor) {
    // SSN: XXX-XX-XXXX (9 digits)
    const d = digits.slice(0, 9)
    if (d.length <= 3) return d
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
  } else {
    // EIN: XX-XXXXXXX (9 digits)
    const d = digits.slice(0, 9)
    if (d.length <= 2) return d
    return `${d.slice(0, 2)}-${d.slice(2)}`
  }
}

function BusinessInformationStep({ formData, errors, handleInputChange }) {
  const isSoleProprietor = formData.ownershipType === 'sole-proprietor'

  const handleEinChange = (e) => {
    const formatted = formatEin(e.target.value, isSoleProprietor)
    handleInputChange({ target: { name: 'ein', value: formatted, type: 'text' } })
  }

  return (
    <fieldset className="form-section">
      <legend>Business Information</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Type of Ownership</span>
        <div className="radio-group radio-group-row">
          <label className="radio-label">
            <input type="radio" name="ownershipType" value="sole-proprietor" checked={formData.ownershipType === 'sole-proprietor'} onChange={handleInputChange} />
            Sole Proprietorship
          </label>
          <label className="radio-label">
            <input type="radio" name="ownershipType" value="partnership" checked={formData.ownershipType === 'partnership'} onChange={handleInputChange} />
            Partnership
          </label>
          <label className="radio-label">
            <input type="radio" name="ownershipType" value="limited-partnership" checked={formData.ownershipType === 'limited-partnership'} onChange={handleInputChange} />
            Limited Partnership
          </label>
          <label className="radio-label">
            <input type="radio" name="ownershipType" value="corporation" checked={formData.ownershipType === 'corporation'} onChange={handleInputChange} />
            Corporation
          </label>
          <label className="radio-label">
            <input type="radio" name="ownershipType" value="llc" checked={formData.ownershipType === 'llc'} onChange={handleInputChange} />
            LLC
          </label>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Business Type</span>
        <div className="radio-group radio-group-row">
          <label className="radio-label">
            <input type="radio" name="businessType" value="with-fuel" checked={formData.businessType === 'with-fuel'} onChange={handleInputChange} />
            Convenience Store with Fuel
          </label>
          <label className="radio-label">
            <input type="radio" name="businessType" value="without-fuel" checked={formData.businessType === 'without-fuel'} onChange={handleInputChange} />
            Convenience Store without Fuel
          </label>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Business Details</span>

        <div className="form-group">
          <label htmlFor="memberName">Member Name (Company Name) *</label>
          <input
            type="text"
            id="memberName"
            name="memberName"
            value={formData.memberName}
            onChange={handleInputChange}
            className={`form-input ${errors.memberName ? 'input-error' : ''}`}
            placeholder="Enter company name"
            maxLength={50}
          />
          {errors.memberName && <span className="error-text">{errors.memberName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dbaName">DBA/Assumed Name</label>
          <input
            type="text"
            id="dbaName"
            name="dbaName"
            value={formData.dbaName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter DBA name if applicable"
            maxLength={50}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ein">
              {isSoleProprietor ? 'SSN * (XXX-XX-XXXX)' : 'EIN (Fed Tax ID #) * (XX-XXXXXXX)'}
            </label>
            <input
              type="text"
              id="ein"
              name="ein"
              value={formData.ein}
              onChange={handleEinChange}
              className={`form-input ${errors.ein ? 'input-error' : ''}`}
              placeholder={isSoleProprietor ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
              maxLength={isSoleProprietor ? 11 : 10}
            />
            {errors.ein && <span className="error-text">{errors.ein}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="salesTaxId">Sales Tax ID # *</label>
            <input
              type="text"
              id="salesTaxId"
              name="salesTaxId"
              value={formData.salesTaxId}
              onChange={numericInput(handleInputChange, 'salesTaxId')}
              className={`form-input ${errors.salesTaxId ? 'input-error' : ''}`}
              placeholder="Numbers only"
              maxLength={20}
              inputMode="numeric"
            />
            {errors.salesTaxId && <span className="error-text">{errors.salesTaxId}</span>}
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Authorized Representative</span>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="authorizedRepFirstName">First Name *</label>
            <input
              type="text"
              id="authorizedRepFirstName"
              name="authorizedRepFirstName"
              value={formData.authorizedRepFirstName}
              onChange={handleInputChange}
              className={`form-input ${errors.authorizedRepFirstName ? 'input-error' : ''}`}
              placeholder="First Name"
              maxLength={50}
            />
            {errors.authorizedRepFirstName && <span className="error-text">{errors.authorizedRepFirstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="authorizedRepMiddleInitial">Middle Initial</label>
            <input
              type="text"
              id="authorizedRepMiddleInitial"
              name="authorizedRepMiddleInitial"
              value={formData.authorizedRepMiddleInitial}
              onChange={handleInputChange}
              className="form-input"
              placeholder="M.I."
              maxLength={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="authorizedRepLastName">Last Name *</label>
            <input
              type="text"
              id="authorizedRepLastName"
              name="authorizedRepLastName"
              value={formData.authorizedRepLastName}
              onChange={handleInputChange}
              className={`form-input ${errors.authorizedRepLastName ? 'input-error' : ''}`}
              placeholder="Last Name"
              maxLength={50}
            />
            {errors.authorizedRepLastName && <span className="error-text">{errors.authorizedRepLastName}</span>}
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Previous Membership</span>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="previousMember"
              checked={formData.previousMember}
              onChange={handleInputChange}
            />
            Was the store previously a member store of GHRA?
          </label>
        </div>

        {formData.previousMember && (
          <div className="form-group">
            <label htmlFor="previousGhraNumber">Previous GHRA #</label>
            <input
              type="text"
              id="previousGhraNumber"
              name="previousGhraNumber"
              value={formData.previousGhraNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter previous GHRA number"
              maxLength={50}
            />
          </div>
        )}
      </div>
    </fieldset>
  )
}

export default BusinessInformationStep
