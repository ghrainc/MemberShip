function StoreInformationStep({ formData, errors, handleInputChange }) {
  return (
    <>
      <fieldset className="form-section">
        <legend>Store Condition</legend>
        <div className="radio-group radio-group-row">
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
      </fieldset>

      <fieldset className="form-section">
        <legend>Business Property</legend>
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
        <legend>Fuel</legend>

        <div className="fuel-row-item">
          <div className="form-group">
            <label htmlFor="fuelAvailable">If with fuel *</label>
            <select
              id="fuelAvailable"
              name="fuelAvailable"
              value={formData.fuelAvailable || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="branded">Branded</option>
              <option value="unbranded">Unbranded</option>
            </select>
          </div>

          {formData.fuelAvailable === 'branded' && (
            <div className="form-group">
              <label htmlFor="brandName">Brand Name *</label>
              <input
                type="text"
                id="brandName"
                name="brandName"
                value={formData.brandName || ''}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter brand name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="numberOfTanks">Number of Tanks *</label>
            <input
              type="number"
              id="numberOfTanks"
              name="numberOfTanks"
              value={formData.numberOfTanks || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Number"
            />
          </div>
        </div>

        <div className="fuel-row-item">
          <div className="form-group">
            <label htmlFor="tankCapacity">Tank Capacity *</label>
            <input
              type="number"
              id="tankCapacity"
              name="tankCapacity"
              value={formData.tankCapacity || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Capacity #"
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimatedFuelSales">Estimated Fuels Sales per month *</label>
            <input
              type="number"
              id="estimatedFuelSales"
              name="estimatedFuelSales"
              value={formData.estimatedFuelSales || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Amount #"
            />
          </div>

          <div className="form-group">
            <label htmlFor="currentFuelSupplier">Current Fuel Supplier(s) *</label>
            <input
              type="text"
              id="currentFuelSupplier"
              name="currentFuelSupplier"
              value={formData.currentFuelSupplier || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Supplier name"
            />
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
              className="form-input"
              placeholder="TCEQ number"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>POS System</legend>

        <div className="pos-row-item">
          <div className="form-group">
            <label htmlFor="scanPOS">Do you scan your products at the POS? *</label>
            <select
              id="scanPOS"
              name="scanPOS"
              value={formData.scanPOS || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="backOfficeProvider">Who is back office provider? *</label>
            <input
              type="text"
              id="backOfficeProvider"
              name="backOfficeProvider"
              value={formData.backOfficeProvider || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Provider name"
            />
          </div>
        </div>

        <div className="pos-row-item">
          <div className="form-group">
            <label htmlFor="posSystem">What register system (POS) is being used? *</label>
            <select
              id="posSystem"
              name="posSystem"
              value={formData.posSystem || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="gilbarco-passport">Gilbarco passport</option>
              <option value="verifone">Verifone</option>
              <option value="ruby">Ruby</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Food Service</legend>

        <div className="food-service-row-item">
          <div className="form-group">
            <label htmlFor="foodServiceAvailable">Do you have food service at store *</label>
            <select
              id="foodServiceAvailable"
              name="foodServiceAvailable"
              value={formData.foodServiceAvailable || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {formData.foodServiceAvailable === 'yes' && (
          <>
            <div className="food-service-row-item">
              <div className="form-group">
                <label htmlFor="foodConcept">Food Concept</label>
                <select
                  id="foodConcept"
                  name="foodConcept"
                  value={formData.foodConcept || ''}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select one option</option>
                  <option value="chicken">Chicken</option>
                  <option value="pizza">Pizza</option>
                  <option value="mexican">Mexican</option>
                  <option value="burger">Burger</option>
                  <option value="bbq">BBQ</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="foodServiceBranded">Is your food service branded</label>
                <select
                  id="foodServiceBranded"
                  name="foodServiceBranded"
                  value={formData.foodServiceBranded || ''}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select one option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {formData.foodServiceBranded === 'yes' && (
              <div className="food-service-row-item">
                <div className="form-group">
                  <label htmlFor="foodBrandName">Brand Name</label>
                  <input
                    type="text"
                    id="foodBrandName"
                    name="foodBrandName"
                    value={formData.foodBrandName || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter brand name"
                  />
                </div>
              </div>
            )}

            <div className="food-service-row-item">
              <div className="form-group">
                <label htmlFor="bigMardKudosGameday">Are you interested in receiving more information on BIG MARD, KUDOS and GAMEDAY CHICKEN?</label>
                <select
                  id="bigMardKudosGameday"
                  name="bigMardKudosGameday"
                  value={formData.bigMardKudosGameday || ''}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select one option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Cooler</legend>

        <div className="cooler-row-item">
          <div className="form-group">
            <label htmlFor="walkInCooler">Does your store have a walk-in cooler? *</label>
            <select
              id="walkInCooler"
              name="walkInCooler"
              value={formData.walkInCooler || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {formData.walkInCooler === 'yes' && (
            <div className="form-group">
              <label htmlFor="coolerDoors">If yes, how many doors *</label>
              <input
                type="number"
                id="coolerDoors"
                name="coolerDoors"
                value={formData.coolerDoors || ''}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Number"
              />
            </div>
          )}
        </div>

        <div className="cooler-row-item">
          <div className="form-group">
            <label htmlFor="walkInFreezer">Does your store have a walk-in Freezer? *</label>
            <select
              id="walkInFreezer"
              name="walkInFreezer"
              value={formData.walkInFreezer || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {formData.walkInFreezer === 'yes' && (
            <div className="form-group">
              <label htmlFor="freezerDoors">If yes, how many doors *</label>
              <input
                type="number"
                id="freezerDoors"
                name="freezerDoors"
                value={formData.freezerDoors || ''}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Number"
              />
            </div>
          )}
        </div>

        <div className="cooler-row-item">
          <div className="form-group">
            <label htmlFor="beerCave">Does your store have a beer cave? *</label>
            <select
              id="beerCave"
              name="beerCave"
              value={formData.beerCave || ''}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select one option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Spanner Board</legend>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="storeSpannerBoard"
              checked={formData.storeSpannerBoard || false}
              onChange={handleInputChange}
            />
            Spanner Board Available
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Store Address</legend>

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

        <div className="mailing-address-row-item">
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
        </div>

        <div className="mailing-address-row-item">
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

        <div className="contact-info-row-item">
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
            />
            {errors.emailAddress && <span className="error-text">{errors.emailAddress}</span>}
          </div>
        </div>
      </fieldset>
    </>
  )
}

export default StoreInformationStep
