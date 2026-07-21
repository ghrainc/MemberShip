// Helper: numeric-only onChange for fields using handleInputChange
const numericInput = (handleInputChange, name) => (e) => {
  const value = e.target.value.replace(/\D/g, '')
  handleInputChange({ target: { name, value, type: 'text' } })
}

function StoreInformationStep({ formData, errors, handleInputChange, copyStoreToMailing }) {
  const withoutFuel = formData.businessType === 'without-fuel'

  return (
    <fieldset className="form-section">
      <legend>Store Information</legend>

      <div className="form-section-inner">
        <span className="inner-legend">Store Condition</span>
        <div className="radio-group radio-group-row">
          <label className="radio-label">
            <input type="radio" name="storeCondition" value="existing" checked={formData.storeCondition === 'existing'} onChange={handleInputChange} />
            Existing Store
          </label>
          <label className="radio-label">
            <input type="radio" name="storeCondition" value="remodeled" checked={formData.storeCondition === 'remodeled'} onChange={handleInputChange} />
            Remodeled
          </label>
          <label className="radio-label">
            <input type="radio" name="storeCondition" value="brand-new" checked={formData.storeCondition === 'brand-new'} onChange={handleInputChange} />
            Brand New
          </label>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Business Property</span>
        <div className="business-row-item">
          <div className="form-group">
            <label htmlFor="businessProperty">Business Property</label>
            <select id="businessProperty" name="businessProperty" value={formData.businessProperty} onChange={handleInputChange} className="form-select">
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
              onChange={numericInput(handleInputChange, 'storeSize')}
              className="form-input"
              placeholder="Square footage (numbers only)"
              maxLength={20}
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      {!withoutFuel && (
        <div className="form-section-inner">
          <span className="inner-legend">Fuel</span>

          <div className="fuel-row-item">
            <div className="form-group">
              <label htmlFor="fuelAvailable">If with fuel *</label>
              <select id="fuelAvailable" name="fuelAvailable" value={formData.fuelAvailable || ''} onChange={handleInputChange} className={`form-select ${errors.fuelAvailable ? 'input-error' : ''}`}>
                <option value="">Select one option</option>
                <option value="branded">Branded</option>
                <option value="unbranded">Unbranded</option>
              </select>
              {errors.fuelAvailable && <span className="error-text">{errors.fuelAvailable}</span>}
            </div>

            {formData.fuelAvailable === 'unbranded' && (
              <div className="form-group fuel-optin-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="ghraFuelOptIn"
                    checked={formData.ghraFuelOptIn !== false}
                    onChange={handleInputChange}
                  />
                  I want to OPT-IN to receive pricing for GHRA Fuel.
                </label>
              </div>
            )}

            {formData.fuelAvailable === 'branded' && (
              <div className="form-group">
                <label htmlFor="brandName">Brand Name *</label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  value={formData.brandName || ''}
                  onChange={handleInputChange}
                  className={`form-input ${errors.brandName ? 'input-error' : ''}`}
                  placeholder="Enter brand name"
                  maxLength={50}
                />
                {errors.brandName && <span className="error-text">{errors.brandName}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="numberOfTanks">Number of Tanks *</label>
              <input
                type="text"
                id="numberOfTanks"
                name="numberOfTanks"
                value={formData.numberOfTanks || ''}
                onChange={numericInput(handleInputChange, 'numberOfTanks')}
                className={`form-input ${errors.numberOfTanks ? 'input-error' : ''}`}
                placeholder="Numbers only"
                maxLength={20}
                inputMode="numeric"
              />
              {errors.numberOfTanks && <span className="error-text">{errors.numberOfTanks}</span>}
            </div>
          </div>

          <div className="fuel-row-item">
            <div className="form-group">
              <label htmlFor="tankCapacity">Tank Capacity *</label>
              <input
                type="text"
                id="tankCapacity"
                name="tankCapacity"
                value={formData.tankCapacity || ''}
                onChange={numericInput(handleInputChange, 'tankCapacity')}
                className={`form-input ${errors.tankCapacity ? 'input-error' : ''}`}
                placeholder="Numbers only"
                maxLength={20}
                inputMode="numeric"
              />
              {errors.tankCapacity && <span className="error-text">{errors.tankCapacity}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="estimatedFuelSales">Estimated Fuels Sales per month *</label>
              <input
                type="text"
                id="estimatedFuelSales"
                name="estimatedFuelSales"
                value={formData.estimatedFuelSales || ''}
                onChange={numericInput(handleInputChange, 'estimatedFuelSales')}
                className={`form-input ${errors.estimatedFuelSales ? 'input-error' : ''}`}
                placeholder="Numbers only"
                maxLength={20}
                inputMode="numeric"
              />
              {errors.estimatedFuelSales && <span className="error-text">{errors.estimatedFuelSales}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currentFuelSupplier">Current Fuel Supplier(s) *</label>
              <input
                type="text"
                id="currentFuelSupplier"
                name="currentFuelSupplier"
                value={formData.currentFuelSupplier || ''}
                onChange={handleInputChange}
                className={`form-input ${errors.currentFuelSupplier ? 'input-error' : ''}`}
                placeholder="Supplier name"
                maxLength={50}
              />
              {errors.currentFuelSupplier && <span className="error-text">{errors.currentFuelSupplier}</span>}
            </div>
          </div>

          <div className="fuel-row-item">
            <div className="form-group">
              <label htmlFor="tceqNumber">TCEQ number *</label>
              <input
                type="text"
                id="tceqNumber"
                name="tceqNumber"
                value={formData.tceqNumber || ''}
                onChange={handleInputChange}
                className={`form-input ${errors.tceqNumber ? 'input-error' : ''}`}
                placeholder="TCEQ number"
                maxLength={50}
              />
              {errors.tceqNumber && <span className="error-text">{errors.tceqNumber}</span>}
            </div>
          </div>

        </div>
      )}

      <div className="form-section-inner">
        <span className="inner-legend">POS System</span>

        <div className="pos-row-item">
          <div className="form-group">
            <label htmlFor="scanPOS">Do you scan your products at the POS? *</label>
            <select id="scanPOS" name="scanPOS" value={formData.scanPOS || ''} onChange={handleInputChange} className={`form-select ${errors.scanPOS ? 'input-error' : ''}`}>
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {errors.scanPOS && <span className="error-text">{errors.scanPOS}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="backOfficeProvider">Who is back office provider? *</label>
            <input
              type="text"
              id="backOfficeProvider"
              name="backOfficeProvider"
              value={formData.backOfficeProvider || ''}
              onChange={handleInputChange}
              className={`form-input ${errors.backOfficeProvider ? 'input-error' : ''}`}
              placeholder="Provider name"
              maxLength={50}
            />
            {errors.backOfficeProvider && <span className="error-text">{errors.backOfficeProvider}</span>}
          </div>
        </div>

        <div className="pos-row-item">
          <div className="form-group">
            <label htmlFor="posSystem">What register system (POS) is being used? *</label>
            <select id="posSystem" name="posSystem" value={formData.posSystem || ''} onChange={handleInputChange} className={`form-select ${errors.posSystem ? 'input-error' : ''}`}>
              <option value="">Select one option</option>
              <option value="gilbarco-passport">Gilbarco passport</option>
              <option value="verifone">Verifone</option>
              <option value="ruby">Ruby</option>
              <option value="other">Other</option>
            </select>
            {errors.posSystem && <span className="error-text">{errors.posSystem}</span>}
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Food Service</span>

        <div className="food-service-row-item">
          <div className="form-group">
            <label htmlFor="foodServiceAvailable">Do you have food service at store *</label>
            <select id="foodServiceAvailable" name="foodServiceAvailable" value={formData.foodServiceAvailable || ''} onChange={handleInputChange} className={`form-select ${errors.foodServiceAvailable ? 'input-error' : ''}`}>
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {errors.foodServiceAvailable && <span className="error-text">{errors.foodServiceAvailable}</span>}
          </div>
        </div>

        {formData.foodServiceAvailable === 'yes' && (
          <>
            <div className="food-service-row-item">
              <div className="form-group">
                <label htmlFor="foodConcept">Food Concept *</label>
                <select id="foodConcept" name="foodConcept" value={formData.foodConcept || ''} onChange={handleInputChange} className={`form-select ${errors.foodConcept ? 'input-error' : ''}`}>
                  <option value="">Select one option</option>
                  <option value="chicken">Chicken</option>
                  <option value="pizza">Pizza</option>
                  <option value="mexican">Mexican</option>
                  <option value="burger">Burger</option>
                  <option value="bbq">BBQ</option>
                  <option value="other">Other</option>
                </select>
                {errors.foodConcept && <span className="error-text">{errors.foodConcept}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="foodServiceBranded">Is your food service branded *</label>
                <select id="foodServiceBranded" name="foodServiceBranded" value={formData.foodServiceBranded || ''} onChange={handleInputChange} className={`form-select ${errors.foodServiceBranded ? 'input-error' : ''}`}>
                  <option value="">Select one option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.foodServiceBranded && <span className="error-text">{errors.foodServiceBranded}</span>}
              </div>
            </div>

            {formData.foodServiceBranded === 'yes' && (
              <div className="food-service-row-item">
                <div className="form-group">
                  <label htmlFor="foodBrandName">Brand Name *</label>
                  <input
                    type="text"
                    id="foodBrandName"
                    name="foodBrandName"
                    value={formData.foodBrandName || ''}
                    onChange={handleInputChange}
                    className={`form-input ${errors.foodBrandName ? 'input-error' : ''}`}
                    placeholder="Enter brand name"
                    maxLength={50}
                  />
                  {errors.foodBrandName && <span className="error-text">{errors.foodBrandName}</span>}
                </div>
              </div>
            )}

            <div className="food-service-row-item">
              <div className="form-group">
                <label htmlFor="bigMardKudosGameday">Are you interested in receiving more information on BIG MARD, KUDOS and GAMEDAY CHICKEN? *</label>
                <select id="bigMardKudosGameday" name="bigMardKudosGameday" value={formData.bigMardKudosGameday || ''} onChange={handleInputChange} className={`form-select ${errors.bigMardKudosGameday ? 'input-error' : ''}`}>
                  <option value="">Select one option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.bigMardKudosGameday && <span className="error-text">{errors.bigMardKudosGameday}</span>}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Cooler</span>

        <div className="cooler-row-item">
          <div className="form-group">
            <label htmlFor="walkInCooler">Does your store have a walk-in cooler? *</label>
            <select id="walkInCooler" name="walkInCooler" value={formData.walkInCooler || ''} onChange={handleInputChange} className={`form-select ${errors.walkInCooler ? 'input-error' : ''}`}>
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {errors.walkInCooler && <span className="error-text">{errors.walkInCooler}</span>}
          </div>

          {formData.walkInCooler === 'yes' && (
            <div className="form-group">
              <label htmlFor="coolerDoors">If yes, how many doors *</label>
              <input
                type="text"
                id="coolerDoors"
                name="coolerDoors"
                value={formData.coolerDoors || ''}
                onChange={numericInput(handleInputChange, 'coolerDoors')}
                className={`form-input ${errors.coolerDoors ? 'input-error' : ''}`}
                placeholder="Numbers only"
                maxLength={20}
                inputMode="numeric"
              />
              {errors.coolerDoors && <span className="error-text">{errors.coolerDoors}</span>}
            </div>
          )}
        </div>

        <div className="cooler-row-item">
          <div className="form-group">
            <label htmlFor="walkInFreezer">Does your store have a walk-in Freezer? *</label>
            <select id="walkInFreezer" name="walkInFreezer" value={formData.walkInFreezer || ''} onChange={handleInputChange} className={`form-select ${errors.walkInFreezer ? 'input-error' : ''}`}>
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {errors.walkInFreezer && <span className="error-text">{errors.walkInFreezer}</span>}
          </div>

          {formData.walkInFreezer === 'yes' && (
            <div className="form-group">
              <label htmlFor="freezerDoors">If yes, how many doors *</label>
              <input
                type="text"
                id="freezerDoors"
                name="freezerDoors"
                value={formData.freezerDoors || ''}
                onChange={numericInput(handleInputChange, 'freezerDoors')}
                className={`form-input ${errors.freezerDoors ? 'input-error' : ''}`}
                placeholder="Numbers only"
                maxLength={20}
                inputMode="numeric"
              />
              {errors.freezerDoors && <span className="error-text">{errors.freezerDoors}</span>}
            </div>
          )}
        </div>

        <div className="cooler-row-item">
          <div className="form-group">
            <label htmlFor="beerCave">Does your store have a beer cave? *</label>
            <select id="beerCave" name="beerCave" value={formData.beerCave || ''} onChange={handleInputChange} className={`form-select ${errors.beerCave ? 'input-error' : ''}`}>
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {errors.beerCave && <span className="error-text">{errors.beerCave}</span>}
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Spanner Board</span>
        <div className="radio-group">
          <label className="radio-label">
            <input type="radio" name="storeSpannerBoard" value="yes" checked={formData.storeSpannerBoard === 'yes'} onChange={handleInputChange} />
            I do have permission to install a 15ft spanner board.
          </label>
          <label className="radio-label">
            <input type="radio" name="storeSpannerBoard" value="no" checked={formData.storeSpannerBoard === 'no'} onChange={handleInputChange} />
            I do not have permission from city, landlord or authority to install GHRA spanner frame. (Provide documentation)
          </label>
          <label className="radio-label">
            <input type="radio" name="storeSpannerBoard" value="prevMember" checked={formData.storeSpannerBoard === 'prevMember'} onChange={handleInputChange} />
            I have a spanner board from previous member in good condition (provide current photograph).
          </label>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Store Address</span>

        <div className="store-address-row-item">
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
              maxLength={50}
            />
            {errors.storeAddress && <span className="error-text">{errors.storeAddress}</span>}
          </div>
        </div>

        <div className="store-address-row-item">
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
              maxLength={50}
            />
            {errors.storeCity && <span className="error-text">{errors.storeCity}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="storeState">State *</label>
            <input
              type="text"
              id="storeState"
              name="storeState"
              value={formData.storeState}
              onChange={handleInputChange}
              className={`form-input ${errors.storeState ? 'input-error' : ''}`}
              placeholder="State"
              maxLength={50}
            />
            {errors.storeState && <span className="error-text">{errors.storeState}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="storeZip">Zip Code *</label>
            <input
              type="text"
              id="storeZip"
              name="storeZip"
              value={formData.storeZip}
              onChange={numericInput(handleInputChange, 'storeZip')}
              className={`form-input ${errors.storeZip ? 'input-error' : ''}`}
              placeholder="Numbers only"
              maxLength={20}
              inputMode="numeric"
            />
            {errors.storeZip && <span className="error-text">{errors.storeZip}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="storeCounty">County *</label>
            <input
              type="text"
              id="storeCounty"
              name="storeCounty"
              value={formData.storeCounty}
              onChange={handleInputChange}
              className={`form-input ${errors.storeCounty ? 'input-error' : ''}`}
              placeholder="County"
              maxLength={50}
            />
            {errors.storeCounty && <span className="error-text">{errors.storeCounty}</span>}
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Mailing Address</span>

        <div className="mailing-address-row-item">
          <button type="button" className="btn-same-address" onClick={copyStoreToMailing}>
            Same as Store Address
          </button>
        </div>

        <div className="mailing-address-row-item">
          <div className="form-group">
            <label htmlFor="mailingAddress">Mailing Address *</label>
            <input
              type="text"
              id="mailingAddress"
              name="mailingAddress"
              value={formData.mailingAddress}
              onChange={handleInputChange}
              className={`form-input ${errors.mailingAddress ? 'input-error' : ''}`}
              placeholder="Street address"
              maxLength={50}
            />
            {errors.mailingAddress && <span className="error-text">{errors.mailingAddress}</span>}
          </div>
        </div>

        <div className="mailing-address-row-item">
          <div className="form-group">
            <label htmlFor="mailingCity">City *</label>
            <input
              type="text"
              id="mailingCity"
              name="mailingCity"
              value={formData.mailingCity}
              onChange={handleInputChange}
              className={`form-input ${errors.mailingCity ? 'input-error' : ''}`}
              placeholder="City"
              maxLength={50}
            />
            {errors.mailingCity && <span className="error-text">{errors.mailingCity}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="mailingState">State *</label>
            <input
              type="text"
              id="mailingState"
              name="mailingState"
              value={formData.mailingState}
              onChange={handleInputChange}
              className={`form-input ${errors.mailingState ? 'input-error' : ''}`}
              placeholder="State"
              maxLength={50}
            />
            {errors.mailingState && <span className="error-text">{errors.mailingState}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="mailingZip">Zip Code *</label>
            <input
              type="text"
              id="mailingZip"
              name="mailingZip"
              value={formData.mailingZip}
              onChange={numericInput(handleInputChange, 'mailingZip')}
              className={`form-input ${errors.mailingZip ? 'input-error' : ''}`}
              placeholder="Numbers only"
              maxLength={20}
              inputMode="numeric"
            />
            {errors.mailingZip && <span className="error-text">{errors.mailingZip}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="mailingCounty">County *</label>
            <input
              type="text"
              id="mailingCounty"
              name="mailingCounty"
              value={formData.mailingCounty}
              onChange={handleInputChange}
              className={`form-input ${errors.mailingCounty ? 'input-error' : ''}`}
              placeholder="County"
              maxLength={50}
            />
            {errors.mailingCounty && <span className="error-text">{errors.mailingCounty}</span>}
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Contact Information</span>

        <div className="contact-info-row-item">
          <div className="form-group">
            <label htmlFor="storePhone">Store Phone</label>
            <input type="tel" id="storePhone" name="storePhone" value={formData.storePhone} onChange={handleInputChange} className="form-input" placeholder="XXX-XXX-XXXX" />
          </div>
          <div className="form-group">
            <label htmlFor="faxPhone">Fax Phone</label>
            <input type="tel" id="faxPhone" name="faxPhone" value={formData.faxPhone} onChange={handleInputChange} className="form-input" placeholder="XXX-XXX-XXXX" />
          </div>
          <div className="form-group">
            <label htmlFor="officePhone">Office Phone</label>
            <input type="tel" id="officePhone" name="officePhone" value={formData.officePhone} onChange={handleInputChange} className="form-input" placeholder="XXX-XXX-XXXX" />
          </div>
        </div>

        <div className="contact-info-row-item">
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
              maxLength={50}
            />
            {errors.emailAddress && <span className="error-text">{errors.emailAddress}</span>}
          </div>
        </div>
      </div>
    </fieldset>
  )
}

export default StoreInformationStep
