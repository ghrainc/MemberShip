function BusinessInformationStep({ formData, errors, handleInputChange }) {
  return (
    <>
      <fieldset className="form-section">
        <legend>Type of Ownership</legend>
        <div className="radio-group radio-group-row">
          <label className="radio-label">
            <input
              type="radio"
              name="ownershipType"
              value="sole-proprietor"
              checked={formData.ownershipType === 'sole-proprietor'}
              onChange={handleInputChange}
            />
            Sole Proprietorship
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="ownershipType"
              value="partnership"
              checked={formData.ownershipType === 'partnership'}
              onChange={handleInputChange}
            />
            Partnership
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="ownershipType"
              value="limited-partnership"
              checked={formData.ownershipType === 'limited-partnership'}
              onChange={handleInputChange}
            />
            Limited Partnership
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="ownershipType"
              value="corporation"
              checked={formData.ownershipType === 'corporation'}
              onChange={handleInputChange}
            />
            Corporation
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="ownershipType"
              value="llc"
              checked={formData.ownershipType === 'llc'}
              onChange={handleInputChange}
            />
            LLC
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Business Type</legend>
        <div className="radio-group radio-group-row">
          <label className="radio-label">
            <input
              type="radio"
              name="businessType"
              value="with-fuel"
              checked={formData.businessType === 'with-fuel'}
              onChange={handleInputChange}
            />
            Convenience Store with Fuel
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="businessType"
              value="without-fuel"
              checked={formData.businessType === 'without-fuel'}
              onChange={handleInputChange}
            />
            Convenience Store without Fuel
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Business Information</legend>

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
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ein">EIN (Fed Tax ID #) *</label>
            <input
              type="text"
              id="ein"
              name="ein"
              value={formData.ein}
              onChange={handleInputChange}
              className={`form-input ${errors.ein ? 'input-error' : ''}`}
              placeholder="XX-XXXXXXX"
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
              onChange={handleInputChange}
              className={`form-input ${errors.salesTaxId ? 'input-error' : ''}`}
              placeholder="Enter Sales Tax ID"
            />
            {errors.salesTaxId && <span className="error-text">{errors.salesTaxId}</span>}
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Authorized Representative</legend>

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
              maxLength="2"
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
            />
            {errors.authorizedRepLastName && <span className="error-text">{errors.authorizedRepLastName}</span>}
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Previous Membership</legend>

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
            />
          </div>
        )}
      </fieldset>
    </>
  )
}

export default BusinessInformationStep
