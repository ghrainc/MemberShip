function StoreInformationStep({ formData, errors, handleInputChange }) {
  return (
    <>
      <fieldset className="form-section">
        <legend>Store Condition</legend>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="storeCondition"
              value="existing"
              checked={formData.storeCondition === 'existing'}
              onChange={handleInputChange}
            />
            Existing Store
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="storeCondition"
              value="remodeled"
              checked={formData.storeCondition === 'remodeled'}
              onChange={handleInputChange}
            />
            Remodeled
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="storeCondition"
              value="brand-new"
              checked={formData.storeCondition === 'brand-new'}
              onChange={handleInputChange}
            />
            Brand New
          </label>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="businessProperty">Business Property</label>
            <select
              id="businessProperty"
              name="businessProperty"
              value={formData.businessProperty}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="owned">Owned</option>
              <option value="leased">Leased</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="storeSize">Store Size</label>
            <input
              type="text"
              id="storeSize"
              name="storeSize"
              value={formData.storeSize}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., 2000 sq ft"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Store Address</legend>

        <div className="form-group">
          <label htmlFor="storeAddress">Store Address *</label>
          <input
            type="text"
            id="storeAddress"
            name="storeAddress"
            value={formData.storeAddress}
            onChange={handleInputChange}
            className={`form-input ${errors.storeAddress ? 'input-error' : ''}`}
            placeholder="Street address"
          />
          {errors.storeAddress && <span className="error-text">{errors.storeAddress}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storeCity">City *</label>
            <input
              type="text"
              id="storeCity"
              name="storeCity"
              value={formData.storeCity}
              onChange={handleInputChange}
              className={`form-input ${errors.storeCity ? 'input-error' : ''}`}
              placeholder="City"
            />
            {errors.storeCity && <span className="error-text">{errors.storeCity}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="storeZip">Zip Code *</label>
            <input
              type="text"
              id="storeZip"
              name="storeZip"
              value={formData.storeZip}
              onChange={handleInputChange}
              className={`form-input ${errors.storeZip ? 'input-error' : ''}`}
              placeholder="Zip code"
            />
            {errors.storeZip && <span className="error-text">{errors.storeZip}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="storeCounty">County</label>
            <input
              type="text"
              id="storeCounty"
              name="storeCounty"
              value={formData.storeCounty}
              onChange={handleInputChange}
              className="form-input"
              placeholder="County"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Mailing Address</legend>

        <div className="form-group">
          <label htmlFor="mailingAddress">Mailing Address</label>
          <input
            type="text"
            id="mailingAddress"
            name="mailingAddress"
            value={formData.mailingAddress}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Street address"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mailingCity">City</label>
            <input
              type="text"
              id="mailingCity"
              name="mailingCity"
              value={formData.mailingCity}
              onChange={handleInputChange}
              className="form-input"
              placeholder="City"
            />
          </div>
          <div className="form-group">
            <label htmlFor="mailingZip">Zip Code</label>
            <input
              type="text"
              id="mailingZip"
              name="mailingZip"
              value={formData.mailingZip}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Zip code"
            />
          </div>
          <div className="form-group">
            <label htmlFor="mailingCounty">County</label>
            <input
              type="text"
              id="mailingCounty"
              name="mailingCounty"
              value={formData.mailingCounty}
              onChange={handleInputChange}
              className="form-input"
              placeholder="County"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Contact Information</legend>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storePhone">Store Phone</label>
            <input
              type="tel"
              id="storePhone"
              name="storePhone"
              value={formData.storePhone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="(XXX) XXX-XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="faxPhone">Fax Phone</label>
            <input
              type="tel"
              id="faxPhone"
              name="faxPhone"
              value={formData.faxPhone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="(XXX) XXX-XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="officePhone">Office Phone</label>
            <input
              type="tel"
              id="officePhone"
              name="officePhone"
              value={formData.officePhone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="(XXX) XXX-XXXX"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="emailAddress">Email Address *</label>
          <input
            type="email"
            id="emailAddress"
            name="emailAddress"
            value={formData.emailAddress}
            onChange={handleInputChange}
            className={`form-input ${errors.emailAddress ? 'input-error' : ''}`}
            placeholder="business@example.com"
          />
          {errors.emailAddress && <span className="error-text">{errors.emailAddress}</span>}
        </div>
      </fieldset>
    </>
  )
}

export default StoreInformationStep
