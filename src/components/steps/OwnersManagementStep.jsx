function OwnersManagementStep({
  formData,
  errors,
  handleInputChange,
  handleOwnerChange,
  addOwner,
  removeOwner
}) {
  return (
    <>
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

      <fieldset className="form-section">
        <legend>Member Company Owners/Partners/Stockholders Information</legend>

        {formData.owners.map((owner, index) => (
          <div key={index} className="owner-subsection">
            <div className="owner-header">
              <h4>Owner/Partner {index + 1}</h4>
              {formData.owners.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOwner(index)}
                  className="remove-button"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={owner.firstName}
                  onChange={(e) => handleOwnerChange(index, 'firstName', e.target.value)}
                  className="form-input"
                  placeholder="First Name"
                />
              </div>
              <div className="form-group">
                <label>Middle Initial</label>
                <input
                  type="text"
                  value={owner.middleInitial}
                  onChange={(e) => handleOwnerChange(index, 'middleInitial', e.target.value)}
                  className="form-input"
                  placeholder="M.I."
                  maxLength="2"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={owner.lastName}
                  onChange={(e) => handleOwnerChange(index, 'lastName', e.target.value)}
                  className="form-input"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={owner.title}
                  onChange={(e) => handleOwnerChange(index, 'title', e.target.value)}
                  className="form-input"
                  placeholder="Title"
                />
              </div>
              <div className="form-group">
                <label>Ownership %</label>
                <input
                  type="number"
                  value={owner.ownershipPercent}
                  onChange={(e) => handleOwnerChange(index, 'ownershipPercent', e.target.value)}
                  className="form-input"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addOwner}
          className="add-button"
        >
          + Add Another Owner/Partner
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Authorized Representative</legend>

        <div className="form-group">
          <label htmlFor="authorizedRepName">Full Name of Authorized Representative *</label>
          <input
            type="text"
            id="authorizedRepName"
            name="authorizedRepName"
            value={formData.authorizedRepName || formData.authorizedRepNameCertification || ''}
            onChange={handleInputChange}
            className={`form-input ${errors.authorizedRepName ? 'input-error' : ''}`}
            placeholder="Full name (auto-populated from Qualifying Business section)"
          />
          {errors.authorizedRepName && <span className="error-text">{errors.authorizedRepName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="authorizedRepTitle">Title</label>
          <input
            type="text"
            id="authorizedRepTitle"
            name="authorizedRepTitle"
            value={formData.authorizedRepTitle}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Title"
          />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Store Manager</legend>
        <p className="section-note">This person will not be eligible to vote or sign any documents or make any changes</p>

        <div className="form-group">
          <label htmlFor="storeManagerName">Manager Name</label>
          <input
            type="text"
            id="storeManagerName"
            name="storeManagerName"
            value={formData.storeManagerName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="storeManagerTitle">Title</label>
          <input
            type="text"
            id="storeManagerTitle"
            name="storeManagerTitle"
            value={formData.storeManagerTitle}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Title"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storeManagerDriverLicense">Driver License #</label>
            <input
              type="text"
              id="storeManagerDriverLicense"
              name="storeManagerDriverLicense"
              value={formData.storeManagerDriverLicense}
              onChange={handleInputChange}
              className="form-input"
              placeholder="License #"
            />
          </div>
          <div className="form-group">
            <label htmlFor="storeManagerMobile">Mobile Number</label>
            <input
              type="tel"
              id="storeManagerMobile"
              name="storeManagerMobile"
              value={formData.storeManagerMobile}
              onChange={handleInputChange}
              className="form-input"
              placeholder="(XXX) XXX-XXXX"
            />
          </div>
        </div>
      </fieldset>
    </>
  )
}

export default OwnersManagementStep
