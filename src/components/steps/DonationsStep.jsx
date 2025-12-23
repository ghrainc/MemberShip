function DonationsStep({ formData, handleInputChange }) {
  // Note: Donation auth rep names are automatically filled from Authorized Representative fields
  // If not filled, user can manually enter them

  return (
    <>
      <fieldset className="form-section">
        <legend>Authorization for Contributions towards Sponsorships</legend>

        <div className="donations-intro-text">
          <p>
            GHRA, in collaboration with its members, actively partners with global organizations like AKDN. In addition, GHRA
            is committed to supporting local organizations that positively impact the communities where we live and work. To
            further this mission, GHRA has established partnerships with the following agencies to advance their important causes:
          </p>
          <p>
            Your participation in this initiative through a contribution is entirely optional, and your choice is greatly valued.
          </p>
          <p>
            The sponsorship contributions are allocated as follows:
          </p>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="donation-org-title">AGA KHAN DEVELOPMENT NETWORK (AKDN)</legend>

        <p className="donation-instruction">Please Select One</p>

        <div className="donation-options-group">
          <label className="donation-radio-label">
            <input
              type="radio"
              name="akdnContribute"
              value="yes"
              checked={formData.akdnContribute === 'yes'}
              onChange={handleInputChange}
            />
            <span>YES, I would like to contribute $100 or More $
              <input
                type="number"
                name="akdnAmount"
                value={formData.akdnAmount || ''}
                onChange={handleInputChange}
                placeholder="______"
                className="donation-amount-input"
                disabled={formData.akdnContribute !== 'yes'}
                min="100"
              />
              toward sponsorship.
            </span>
          </label>
          <label className="donation-radio-label">
            <input
              type="radio"
              name="akdnContribute"
              value="no"
              checked={formData.akdnContribute === 'no'}
              onChange={handleInputChange}
            />
            <span>NO, I do not wish to contribute</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section donation-org-spacing">
        <legend className="donation-org-title">HOUSTON FOOD BANK (HFB)</legend>

        <p className="donation-instruction">Please Select One</p>

        <div className="donation-options-group">
          <label className="donation-radio-label">
            <input
              type="radio"
              name="hfbContribute"
              value="yes"
              checked={formData.hfbContribute === 'yes'}
              onChange={handleInputChange}
            />
            <span>YES, I would like to contribute $10 or More $
              <input
                type="number"
                name="hfbAmount"
                value={formData.hfbAmount || ''}
                onChange={handleInputChange}
                placeholder="______"
                className="donation-amount-input"
                disabled={formData.hfbContribute !== 'yes'}
                min="10"
              />
              toward sponsorship.
            </span>
          </label>
          <label className="donation-radio-label">
            <input
              type="radio"
              name="hfbContribute"
              value="no"
              checked={formData.hfbContribute === 'no'}
              onChange={handleInputChange}
            />
            <span>NO, I do not wish to contribute</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section donation-note-spacing">
        <p className="donation-note">
          GHRA will deduct contribution amount annually from your (Member) 3rd quarter rebate check for this cause.
          Members have the flexibility to adjust their contribution amounts during the renewal process each year. GHRA
          sincerely appreciates the continued support and involvement of its members in this meaningful initiative.
        </p>
        <p className="donation-auth-note">
          The undersigned GHRA member hereby authorizes GHRA to make a deduction and disbursement from member's
          rebate check for the 3rd Quarter for the above contributions, if any, designated by the member.
        </p>

        <div className="donation-auth-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="donationAuthRepFirstName">First Name</label>
              <input
                type="text"
                id="donationAuthRepFirstName"
                name="donationAuthRepFirstName"
                value={formData.donationAuthRepFirstName || formData.authorizedRepFirstName || ''}
                onChange={handleInputChange}
                className="form-input"
                placeholder="First Name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="donationAuthRepLastName">Last Name</label>
              <input
                type="text"
                id="donationAuthRepLastName"
                name="donationAuthRepLastName"
                value={formData.donationAuthRepLastName || formData.authorizedRepLastName || ''}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Information on the organizations GHRA is partnering</legend>

        <div className="org-info-subsection">
          <h4>AGA KHAN DEVELOPMENT NETWORK (AKDN)</h4>
          <p className="org-description">
            GHRA and its members, consistently demonstrates its support for AKDN by actively contributing to their cause annually. The
            AKDN is committed to tackling the underlying causes of poverty through the promotion of innovative solutions in vital areas
            such as health, education, rural development, civil society, and the environment.
          </p>
        </div>

        <div className="org-info-subsection">
          <h4>HOUSTON FOOD BANK</h4>
          <p className="org-description">
            The Houston Food Bank is a prominent non-profit organization based in Houston, Texas, dedicated to addressing food
            insecurity in the region. It plays a vital role in distributing food and other essential resources to individuals and families in
            need. Established in 1982, the Houston Food Bank has grown into one of the largest food banks in the United States.
          </p>
          <p className="org-description">
            A $10 contribution to the Houston Food Bank can have a meaningful impact on fighting hunger in the community.
            With $10, the Houston Food Bank can provide approximately 30 meals to individuals and families facing food insecurity.
          </p>
        </div>
      </fieldset>
    </>
  )
}

export default DonationsStep
