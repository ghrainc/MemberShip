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
          <span className="inner-legend">Documents</span>

          <div className="agreements-content">
            <div className="agreement-item">
              <label className="agreement-label">
                <input
                  type="checkbox"
                  name="membershipAgreement"
                  checked={formData.membershipAgreement}
                  onChange={handleInputChange}
                />
                <span>
                  <a href="/MEMBERSHIP_AGREEMENT_2024_FINAL.pdf" download className="agreement-link">
                    Membership Agreement
                  </a>
                </span>
              </label>
            </div>

            <div className="agreement-item">
              <label className="agreement-label">
                <input
                  type="checkbox"
                  name="memberRequirements"
                  checked={formData.memberRequirements}
                  onChange={handleInputChange}
                />
                <span>
                  <a href="/REQUIREMENTS_TO_BE_A_MEMBER_2025.pdf" download className="agreement-link">
                    Requirements to be a Member
                  </a>
                </span>
              </label>
            </div>

            <div className="agreement-item">
              <label className="agreement-label">
                <input
                  type="checkbox"
                  name="rebateConsent"
                  checked={formData.rebateConsent}
                  onChange={handleInputChange}
                />
                <span>
                  <a href="/FINANCIAL_REBATE_CONSENT_FORM.pdf" download className="agreement-link">
                    Financial Information & Rebate Consent
                  </a>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section-inner">
          <span className="inner-legend">Financial Terms</span>

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

        <div className="form-section-inner">
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
