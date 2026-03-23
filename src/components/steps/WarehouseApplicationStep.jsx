function WarehouseApplicationStep({
  formData,
  errors,
  handleInputChange,
  handleCardHolderChange,
  addCardHolder,
  removeCardHolder
}) {
  return (
    <fieldset className="form-section">
      <legend>Warehouse Application</legend>

      <p className="section-text">
        Your business shopping membership will permit you to purchase products for business and resale use
        from the warehouse facility of GHRA Warehouse and Distribution Center located at 7110 Bellerive, Houston, Texas 77036.
      </p>

      <div className="form-section-inner">
        <span className="inner-legend">Warehouse Information</span>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="warehouseDelivery"
              checked={formData.warehouseDelivery || false}
              onChange={handleInputChange}
            />
            Would you like to set up your account for delivery?
          </label>
        </div>
      </div>

      {formData.warehouseDelivery && (
        <>
          {(formData.authorizedCardHolders || []).map((cardHolder, index) => (
            <div key={index} className="form-section-inner">
              <div className="inner-section-header">
                <span className="inner-legend">Authorized Card Holder {index + 1}</span>
                {(formData.authorizedCardHolders || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCardHolder(index)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="card-holder-row-item">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={cardHolder.firstName}
                    onChange={(e) => handleCardHolderChange(index, 'firstName', e.target.value)}
                    className={`form-input ${errors[`cardHolder${index}FirstName`] ? 'input-error' : ''}`}
                    placeholder="First Name"
                    maxLength={50}
                  />
                  {errors[`cardHolder${index}FirstName`] && <span className="error-text">{errors[`cardHolder${index}FirstName`]}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={cardHolder.lastName}
                    onChange={(e) => handleCardHolderChange(index, 'lastName', e.target.value)}
                    className={`form-input ${errors[`cardHolder${index}LastName`] ? 'input-error' : ''}`}
                    placeholder="Last Name"
                    maxLength={50}
                  />
                  {errors[`cardHolder${index}LastName`] && <span className="error-text">{errors[`cardHolder${index}LastName`]}</span>}
                </div>
              </div>

              <div className="card-holder-row-item">
                <div className="form-group">
                  <label>Driver License # *</label>
                  <input
                    type="text"
                    value={cardHolder.drivingLicense}
                    onChange={(e) => handleCardHolderChange(index, 'drivingLicense', e.target.value.replace(/\D/g, ''))}
                    className={`form-input ${errors[`cardHolder${index}DrivingLicense`] ? 'input-error' : ''}`}
                    placeholder="Numbers only"
                    maxLength={20}
                    inputMode="numeric"
                  />
                  {errors[`cardHolder${index}DrivingLicense`] && <span className="error-text">{errors[`cardHolder${index}DrivingLicense`]}</span>}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCardHolder}
            className="add-button"
          >
            + Add Another Card Holder
          </button>
        </>
      )}
    </fieldset>
  )
}

export default WarehouseApplicationStep
