function AchAuthorizationStep({ formData, handleInputChange }) {
  return (
    <fieldset className="form-section">
      <legend>Authorization Form for Automatic Deposits (ACH Credits/Debits)</legend>

      <div className="form-group">
        <p className="section-text">
          I hereby authorize Greater Houston Retailers Cooperative Association, Inc. (GHRA) to initiate credit entries 
          and to initiate, if necessary, debit entries and adjustments for any credit entries in error to my account 
          listed and the depository named below.
        </p>
      </div>

      <fieldset className="form-section-inner">
        <legend className="inner-legend">ACH Information</legend>

        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="achInfoFor"
              value="corporate"
              checked={formData.achInfoFor === 'corporate'}
              onChange={handleInputChange}
            />
            GHRA Corporate
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="achInfoFor"
              value="warehouse"
              checked={formData.achInfoFor === 'warehouse'}
              onChange={handleInputChange}
            />
            GHRA Warehouse
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="achInfoFor"
              value="both"
              checked={formData.achInfoFor === 'both'}
              onChange={handleInputChange}
            />
            Both
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section-inner">
        <legend className="inner-legend">Bank Information</legend>

        <div className="form-group">
          <label htmlFor="bankName">Bank Name</label>
          <input
            type="text"
            id="bankName"
            name="bankName"
            value={formData.bankName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Bank Name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bankAddress">Branch Address</label>
            <input
              type="text"
              id="bankAddress"
              name="bankAddress"
              value={formData.bankAddress}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Street Address"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bankCity">City</label>
            <input
              type="text"
              id="bankCity"
              name="bankCity"
              value={formData.bankCity}
              onChange={handleInputChange}
              className="form-input"
              placeholder="City"
            />
          </div>
          <div className="form-group">
            <label htmlFor="bankState">State</label>
            <input
              type="text"
              id="bankState"
              name="bankState"
              value={formData.bankState}
              onChange={handleInputChange}
              className="form-input"
              placeholder="State"
            />
          </div>
          <div className="form-group">
            <label htmlFor="bankZip">Zip Code</label>
            <input
              type="text"
              id="bankZip"
              name="bankZip"
              value={formData.bankZip}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Zip Code"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="transitAbaNumber">Transit/ABA Number</label>
            <input
              type="text"
              id="transitAbaNumber"
              name="transitAbaNumber"
              value={formData.transitAbaNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Routing Number"
            />
          </div>
          <div className="form-group">
            <label htmlFor="accountNumber">Account Number</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Account Number"
            />
          </div>
        </div>
      </fieldset>

      <div className="form-group">
        <p className="section-text notice-text">
          This authority is to remain in full force and effect until GHRA has received written notification from the member 
          of its termination in such time and in such manner as to afford GHRA and DEPOSITORY a reasonable opportunity to act on it.
        </p>
        <p className="section-text notice-text">
          Please do not attach a personal check or a check copy. Only original check will be accepted.
        </p>
      </div>
    </fieldset>
  )
}

export default AchAuthorizationStep
