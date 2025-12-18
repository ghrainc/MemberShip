import '../../styles/steps/QualifyingBusinessStep.css'

function QualifyingBusinessStep({ formData, errors, handleInputChange }) {
  const productCategories = [
    'gasoline',
    'beverages',
    'tobaccoProducts',
    'snackFoods',
    'candy',
    'groceryItems',
    'bakeryItems',
    'dairyProducts',
    'preparedFoods',
    'freshPackagedMeats',
    'produce',
    'healthBeautyAids'
  ]

  const productLabels = {
    gasoline: 'Gasoline',
    beverages: 'Beverages',
    tobaccoProducts: 'Tobacco Products',
    snackFoods: 'Snack Foods',
    candy: 'Candy',
    groceryItems: 'Grocery Items',
    bakeryItems: 'Bakery Items',
    dairyProducts: 'Dairy Products',
    preparedFoods: 'Prepared Foods',
    freshPackagedMeats: 'Fresh/Packaged Meats',
    produce: 'Produce',
    healthBeautyAids: 'Health and Beauty Aids'
  }

  const handleCategoryChange = (category) => {
    const currentCategories = formData.storeProductCategories || []
    const updated = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category]
    
    handleInputChange({
      target: {
        name: 'storeProductCategories',
        value: updated,
        type: 'custom'
      }
    })
  }

  const categoriesChecked = (formData.storeProductCategories || []).length

  return (
    <div className="qualifying-business-step">
      <div className="section-header">
        <h2>Qualifying Your Business as a Convenience Store</h2>
        <p className="section-description">
          The Greater Houston Retailers Cooperative Association, Inc. focuses on providing valuable programs and savings to the Independent Convenience Store Operators in the Greater Houston Area Market. All GHRA Member stores must meet the minimum qualifications defining a convenience store operation. Please complete the questionnaire below to ensure your business meets the definition of a Convenience Store and requirements of GHRA as determined by GHRA in its discretion.
        </p>
      </div>

      <fieldset className="form-section">
        <legend>Defining the Convenience Store</legend>

        <div className="qualifying-questions">
          <div className="question-item">
            <label className="question-label">
              <span>Does your store sell hard liquor (18% or more alcohol content)?</span>
              <div className="question-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="hardLiquor"
                    value="yes"
                    checked={formData.hardLiquor === 'yes'}
                    onChange={handleInputChange}
                  />
                  YES
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="hardLiquor"
                    value="no"
                    checked={formData.hardLiquor === 'no'}
                    onChange={handleInputChange}
                  />
                  NO
                </label>
              </div>
            </label>
          </div>

          <div className="question-item">
            <label className="question-label">
              <span>Is there an age requirement to allow patrons into your store?</span>
              <div className="question-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="ageRequirement"
                    value="yes"
                    checked={formData.ageRequirement === 'yes'}
                    onChange={handleInputChange}
                  />
                  YES
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="ageRequirement"
                    value="no"
                    checked={formData.ageRequirement === 'no'}
                    onChange={handleInputChange}
                  />
                  NO
                </label>
              </div>
            </label>
          </div>

          <div className="question-item">
            <label className="question-label">
              <span>Is your store required to be closed on Sunday and after 9:00 PM Monday - Saturday?</span>
              <div className="question-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="closedSundayAfter9pm"
                    value="yes"
                    checked={formData.closedSundayAfter9pm === 'yes'}
                    onChange={handleInputChange}
                  />
                  YES
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="closedSundayAfter9pm"
                    value="no"
                    checked={formData.closedSundayAfter9pm === 'no'}
                    onChange={handleInputChange}
                  />
                  NO
                </label>
              </div>
            </label>
          </div>
        </div>

        <p className="qualifying-note">
          A business would qualify as a Convenience Store by answering NO to questions above and meeting a minimum of 7 criteria below:
        </p>

        <p className="product-mix-title">Does your store primarily make available for sale, a product mix of:</p>

        <div className="product-categories-grid">
          {productCategories.map((category) => (
            <label key={category} className="product-checkbox">
              <input
                type="checkbox"
                checked={(formData.storeProductCategories || []).includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              <span>{productLabels[category]}</span>
            </label>
          ))}
        </div>

        <div className={`categories-count ${categoriesChecked >= 7 ? 'valid' : 'invalid'}`}>
          <strong>Total # of Criteria Met: {categoriesChecked}</strong>
          {categoriesChecked < 7 && (
            <span className="warning"> (Minimum 7 required)</span>
          )}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Store Certification</legend>

        <p className="certification-text">
          I hereby certify and verify to GHRA that the above disclosures/checked items are an accurate reflection of this business location.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storeNameCertification" className="form-label">Store Name</label>
            <input
              type="text"
              id="storeNameCertification"
              name="storeNameCertification"
              className="form-input"
              value={formData.storeNameCertification || ''}
              onChange={handleInputChange}
              placeholder="Enter store name"
            />
            {errors.storeNameCertification && <span className="error-text">{errors.storeNameCertification}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="storeAddressCertification" className="form-label">Store Address</label>
            <input
              type="text"
              id="storeAddressCertification"
              name="storeAddressCertification"
              className="form-input"
              value={formData.storeAddressCertification || ''}
              onChange={handleInputChange}
              placeholder="Enter store address"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storeCityCertification" className="form-label">Store City</label>
            <input
              type="text"
              id="storeCityCertification"
              name="storeCityCertification"
              className="form-input"
              value={formData.storeCityCertification || ''}
              onChange={handleInputChange}
              placeholder="Enter city"
            />
          </div>

          <div className="form-group">
            <label htmlFor="storeZipCertification" className="form-label">Zip Code</label>
            <input
              type="text"
              id="storeZipCertification"
              name="storeZipCertification"
              className="form-input"
              value={formData.storeZipCertification || ''}
              onChange={handleInputChange}
              placeholder="Enter zip code"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="authorizedRepNameCertification" className="form-label">Authorized Representative Name</label>
          <input
            type="text"
            id="authorizedRepNameCertification"
            name="authorizedRepNameCertification"
            className="form-input"
            value={formData.authorizedRepNameCertification || ''}
            onChange={handleInputChange}
            placeholder="Enter authorized representative name"
          />
        </div>
      </fieldset>
    </div>
  )
}

export default QualifyingBusinessStep
