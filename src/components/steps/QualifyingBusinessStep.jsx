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

    </div>
  )
}

export default QualifyingBusinessStep
