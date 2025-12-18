function WarehouseApplicationStep({ formData, handleInputChange }) {
  return (
    <fieldset className="form-section">
      <legend>Warehouse Application</legend>

      <div className="form-group">
        <p className="section-text">
          Your business shopping membership will permit you to purchase products for business and resale use 
          from the warehouse facility of GHRA Warehouse and Distribution Center located at 7110 Bellerive, Houston, Texas 77036.
        </p>
      </div>

      <fieldset className="form-section-inner">
        <legend className="inner-legend">Warehouse Information</legend>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="warehouseDelivery"
              onChange={handleInputChange}
            />
            Would you like to set up your account for delivery?
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section-inner">
        <legend className="inner-legend">Warehouse Membership Terms</legend>

        <div className="terms-content">
          <h5>Key Points:</h5>
          <ul className="terms-list">
            <li>Shopping membership is available to qualifying owners/operators of businesses that are at least 18 years of age</li>
            <li>A shopping membership includes a business shopping card for your business</li>
            <li>Current annual fee to obtain a business membership is $0 for GHRA Members</li>
            <li>Annual membership period is for twelve (12) consecutive months from the date of approval</li>
            <li>The membership fee is for one continuous twelve (12) month period from enrollment</li>
            <li>Renewal notices will be sent by mail each year</li>
            <li>An authorized shopping member may bring up to two (2) guests in the Warehouse Facility during a shopping trip</li>
            <li>Only the authorized shopping member may purchase items or otherwise transact</li>
            <li>Shirts and shoes are required</li>
            <li>GHRA Warehouse policy prohibits firearms, except for authorized law enforcement officers</li>
            <li>No smoking is allowed inside the Warehouse Facility</li>
            <li>Tobacco and liquor sales cannot be made to minors</li>
          </ul>
        </div>

        <div className="form-group">
          <label className="checkbox-label checkbox-large">
            <input
              type="checkbox"
              name="warehouseAgreement"
              onChange={handleInputChange}
            />
            <span>I agree to comply with all warehouse policies, guidelines, rules, and regulations</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section-inner">
        <legend className="inner-legend">Important Information</legend>

        <div className="terms-content">
          <p className="section-text">
            GHRA Warehouse and Distribution Center shopping membership is not an investment and no investment return 
            or appreciation on such membership shall be permitted. The authorized shopping member has clearly understood 
            and hereby acknowledges and agrees that any membership fee or other amounts paid were not an investment of any 
            kind but merely fees paid to be permitted to shop at the Warehouse Facility.
          </p>
          <p className="section-text">
            The undersigned authorized shopping member agrees to jointly and severally indemnify and hold harmless GHRA 
            Warehouse and Distribution Center and GHRA Cooperative from any and all claims, causes of action, demands, 
            suits, liabilities, losses, penalties, and/or actions asserted.
          </p>
        </div>
      </fieldset>

      <div className="form-group">
        <label className="checkbox-label checkbox-large">
          <input
            type="checkbox"
            name="warehouseTermsAccepted"
            onChange={handleInputChange}
          />
          <span>I understand and accept the warehouse membership terms and conditions</span>
        </label>
      </div>
    </fieldset>
  )
}

export default WarehouseApplicationStep
