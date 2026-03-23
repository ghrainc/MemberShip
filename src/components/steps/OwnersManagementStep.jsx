import { useEffect } from 'react'

function OwnersManagementStep({
  formData,
  errors,
  handleInputChange,
  handleOwnerChange,
  addOwner,
  removeOwner
}) {
  // Auto-fill first owner with Authorized Representative data
  useEffect(() => {
    if (formData.owners.length > 0 && formData.authorizedRepFirstName) {
      handleOwnerChange(0, 'firstName', formData.authorizedRepFirstName)
      handleOwnerChange(0, 'middleInitial', formData.authorizedRepMiddleInitial || '')
      handleOwnerChange(0, 'lastName', formData.authorizedRepLastName)
    }
  }, [formData.authorizedRepFirstName, formData.authorizedRepMiddleInitial, formData.authorizedRepLastName])

  const numericOwner = (index, field) => (e) => {
    handleOwnerChange(index, field, e.target.value.replace(/\D/g, ''))
  }

  const ownershipChange = (index) => (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    const val = digits === '' ? '' : String(Math.min(Number(digits), 100))
    handleOwnerChange(index, 'ownershipPercent', val)
  }

  return (
    <>
      <fieldset className="form-section">
        <legend>Member Company Owners/Partners/Stockholders Information</legend>

        {formData.owners.map((owner, index) => (
          <div key={index} className="form-section-inner">
            <div className="inner-section-header">
              <span className="inner-legend">
                {index === 0 ? 'Owner / Partner / Authorized Representative 1' : `Owner / Partner / Authorized Representative ${index + 1}`}
              </span>
              {formData.owners.length > 1 && index !== 0 && (
                <button type="button" onClick={() => removeOwner(index)} className="remove-button">Remove</button>
              )}
            </div>

            <div className="owners-row-item">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={owner.firstName}
                  onChange={(e) => handleOwnerChange(index, 'firstName', e.target.value)}
                  className="form-input"
                  placeholder="First Name"
                  maxLength={50}
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
                  maxLength={2}
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
                  maxLength={50}
                />
              </div>
            </div>

            <div className="owners-row-item">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={owner.title}
                  onChange={(e) => handleOwnerChange(index, 'title', e.target.value)}
                  className="form-input"
                  placeholder="Title"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Ownership % (max 100)</label>
                <input
                  type="text"
                  value={owner.ownershipPercent}
                  onChange={ownershipChange(index)}
                  className="form-input"
                  placeholder="0-100"
                  maxLength={3}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="owners-row-item">
              <div className="form-group">
                <label>Mobile Phone</label>
                <input
                  type="tel"
                  value={owner.mobilePhone}
                  onChange={(e) => handleOwnerChange(index, 'mobilePhone', e.target.value)}
                  className="form-input"
                  placeholder="XXX-XXX-XXXX"
                />
              </div>
              <div className="form-group">
                <label>Driver License #</label>
                <input
                  type="text"
                  value={owner.driverLicense}
                  onChange={numericOwner(index, 'driverLicense')}
                  className="form-input"
                  placeholder="Numbers only"
                  maxLength={20}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="owners-row-item">
              <div className="form-group">
                <label>State Issued</label>
                <input
                  type="text"
                  value={owner.stateIssued}
                  onChange={(e) => handleOwnerChange(index, 'stateIssued', e.target.value)}
                  className="form-input"
                  placeholder="State"
                  maxLength={50}
                />
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addOwner} className="add-button">
          + Add Another Owner/Partner
        </button>

        {errors.ownershipTotal && (
          <div className="ownership-total-error">{errors.ownershipTotal}</div>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Store Manager</legend>
        <p className="section-note">This person will not be eligible to vote or sign any documents or make any changes</p>

        <div className="form-section-inner">
          <span className="inner-legend">Store Manager Information</span>

          <div className="manager-row-item">
            <div className="form-group">
              <label htmlFor="storeManagerFirstName">First Name *</label>
              <input
                type="text"
                id="storeManagerFirstName"
                name="storeManagerFirstName"
                value={formData.storeManagerFirstName}
                onChange={handleInputChange}
                className={`form-input ${errors.storeManagerFirstName ? 'input-error' : ''}`}
                placeholder="First Name"
                maxLength={50}
              />
              {errors.storeManagerFirstName && <span className="error-text">{errors.storeManagerFirstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="storeManagerLastName">Last Name *</label>
              <input
                type="text"
                id="storeManagerLastName"
                name="storeManagerLastName"
                value={formData.storeManagerLastName}
                onChange={handleInputChange}
                className={`form-input ${errors.storeManagerLastName ? 'input-error' : ''}`}
                placeholder="Last Name"
                maxLength={50}
              />
              {errors.storeManagerLastName && <span className="error-text">{errors.storeManagerLastName}</span>}
            </div>
          </div>

          <div className="manager-row-item">
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
                maxLength={50}
              />
            </div>
          </div>

          <div className="manager-row-item">
            <div className="form-group">
              <label htmlFor="storeManagerDriverLicense">Driver License #</label>
              <input
                type="text"
                id="storeManagerDriverLicense"
                name="storeManagerDriverLicense"
                value={formData.storeManagerDriverLicense}
                onChange={(e) => handleInputChange({ target: { name: 'storeManagerDriverLicense', value: e.target.value.replace(/\D/g, ''), type: 'text' } })}
                className="form-input"
                placeholder="Numbers only"
                maxLength={20}
                inputMode="numeric"
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
                placeholder="XXX-XXX-XXXX"
              />
            </div>
          </div>
        </div>
      </fieldset>
    </>
  )
}

export default OwnersManagementStep
