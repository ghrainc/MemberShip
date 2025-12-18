function AgreementsStep({ formData, errors, handleInputChange }) {
  return (
    <>
      <fieldset className="form-section">
        <legend>Membership Agreement & Requirements</legend>

        <div className="terms-content">
          <p className="section-text">
            By signing this application, you acknowledge that you have read and understand the GHRA Membership Agreement 
            and Requirements. You agree to comply with all GHRA bylaws, governing documents, organizational documents, 
            Certificate of Formation, policies, guidelines, rules, and regulations of Greater Houston Retailers Cooperative 
            Association, Inc. as currently in effect and as amended or modified from time to time.
          </p>
        </div>

        <div className="form-section-inner">
          <legend className="inner-legend">Key Membership Requirements:</legend>

          <div className="requirements-content">
            <h5>General Requirements:</h5>
            <ul className="requirements-list">
              <li>Submit completed GHRA Application with all required documents and membership fees and deposits</li>
              <li>Comply with all of GHRA's governing documents, rules, regulations, policies, and requirements</li>
              <li>Display current GHRA Logo Decal with member number at the front door of the store</li>
              <li>Attend In-Store Membership Orientation (Authorized Representative and/or designee)</li>
              <li>Not use any harsh or abusive language or actions with GHRA directors, suppliers and employees</li>
              <li>Comply with all applicable GHRA warehouse policies as amended</li>
            </ul>

            <h5>Merchandising Program Requirements:</h5>
            <ul className="requirements-list">
              <li>Comply with all supplier agreements negotiated by GHRA on your behalf</li>
              <li>Purchase approved products from GHRA-approved suppliers</li>
              <li>Follow GHRA-approved planograms and promotional activities</li>
              <li>Must purchase the minimum product per quarter for CMA funding eligibility</li>
              <li>Member option space in walk-in cooler will not exceed 15% of total space</li>
              <li>Post interior and exterior promotional signage during promotions</li>
              <li>Support warehouse promotional activity as required</li>
            </ul>

            <h5>Benefits to GHRA Members:</h5>
            <ul className="benefits-list">
              <li>Access to proprietary programs</li>
              <li>Support of field staff, chefs and managers</li>
              <li>Opportunity to take advantage of GHRA Brands</li>
              <li>Preferred Membership at Warehouse with Rebates (5% for grocery, 3% for non-cigarette tobacco)</li>
              <li>Receive discounts on eligible purchases</li>
              <li>Receive supplier rebates where applicable</li>
              <li>Outdoor signage hardware kit (Spanner Board)</li>
              <li>Printed marketing materials monthly</li>
              <li>Automatically enrolled in members benefit program</li>
              <li>Representation in front of State and Local Government</li>
              <li>Support in regulatory issues</li>
              <li>Printed convenience store compliance signage</li>
            </ul>
          </div>
        </div>

        <div className="form-section-inner">
          <legend className="inner-legend">Financial Terms</legend>

          <div className="financial-terms">
            <p className="section-text">
              <strong>Membership Fees:</strong> $400.00 per year per approved Member store and business location
            </p>
            <p className="section-text">
              <strong>Store Participation Deposit:</strong> Currently set at $12,000.00 per approved Member store, subject to modification
            </p>
            <p className="section-text">
              <strong>Monthly Warehouse Purchase Requirement:</strong> $2,000.00 minimum of grocery items per calendar month. 
              Failure to meet this requirement results in a $240.00 support fee, reduced by $0.12 for every $1.00 purchased in grocery items.
            </p>
            <p className="section-text">
              The membership period in GHRA is from January 1 to December 31 of each year. Unless you notify GHRA sixty 
              (60) days prior to the end of a calendar year that you do not wish to be a member, membership dues will 
              automatically be deducted from any patronage dividends, rebates, or other amounts due.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Final Acknowledgement</legend>

        <div className="form-group">
          <label className="checkbox-label checkbox-large">
            <input
              type="checkbox"
              name="acknowledgement"
              checked={formData.acknowledgement}
              onChange={handleInputChange}
            />
            <span>
              I certify that I have read and understand the GHRA Membership Agreement, Requirements, and all other 
              documents provided. I agree to accept and abide by all membership requirements, rules, regulations, and policies 
              of Greater Houston Retailers Cooperative Association, Inc.
            </span>
          </label>
          {errors.acknowledgement && <span className="error-text">{errors.acknowledgement}</span>}
        </div>

        <div className="form-group">
          <label className="checkbox-label checkbox-large">
            <input
              type="checkbox"
              name="authorizationConsent"
              onChange={handleInputChange}
            />
            <span>
              I authorize GHRA to share my business and other relevant information with vendors, suppliers, and other 
              parties as determined necessary by GHRA. I understand that GHRA may access any point-of-sale data within 
              my point-of-sale system to fully exercise its purchasing power.
            </span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label checkbox-large">
            <input
              type="checkbox"
              name="indemnificationConsent"
              onChange={handleInputChange}
            />
            <span>
              I agree to indemnify and hold harmless GHRA and all of its Officers, Directors, employees, agents, and 
              representatives from any claims, causes of action, demands, suits, liabilities, losses, penalties, and/or 
              actions arising from my membership or participation in GHRA programs.
            </span>
          </label>
        </div>
      </fieldset>

      <div className="form-info-box">
        <p className="info-title">Important Notice</p>
        <p className="section-text">
          Acceptance of Membership Fees and/or Store Participation Deposits by GHRA does not automatically imply acceptance 
          of your Application. The collected fees/deposits will be returned if the application is not approved by the Board. 
          Acceptance shall only occur upon written approval by the Board of Directors.
        </p>
      </div>
    </>
  )
}

export default AgreementsStep
