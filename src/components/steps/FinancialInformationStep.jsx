function FinancialInformationStep({ formData, handleInputChange }) {
  return (
    <fieldset className="form-section">
      <legend>Financial Information & Rebate Consent</legend>

      <div className="form-group">
        <p className="section-text">
          I consent to receive and/or obtain any and all Financials and related communications electronically. 
          I understand that financials and related communications will not be furnished on paper. 
          I represent that I have the necessary hardware and software to access the GHRA secured member portal.
        </p>
      </div>

      <div className="form-section-inner">
        <h4>GHRA Rebate Schedule</h4>
        <p className="section-text">
          I understand that I must be a GHRA member in good standing for the full quarter and must be in compliance 
          with GHRA guidelines and programs, in order to be eligible for rebates, cooler, shelving or any other allowance.
        </p>

        <table className="rebate-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Months in Each Quarter</th>
              <th>ACH Payment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1st</td>
              <td>1st January to 31st March</td>
              <td>20th May</td>
            </tr>
            <tr>
              <td>2nd</td>
              <td>1st April to 30th June</td>
              <td>20th August</td>
            </tr>
            <tr>
              <td>3rd</td>
              <td>1st July to 30th September</td>
              <td>20th November</td>
            </tr>
            <tr>
              <td>4th</td>
              <td>1st October to 31st December</td>
              <td>25th February</td>
            </tr>
          </tbody>
        </table>

        <p className="section-text">
          Complete GHRA membership application (with all required documents and fees) must be submitted at least three weeks 
          before the new quarter starts in order to give proper time for application approval and processing.
        </p>
      </div>

      <div className="form-section-inner">
        <h4>Important Notice</h4>
        <ul className="notice-list">
          <li>To access and retain the communications electronically, you will need a device capable of connecting to the internet with a browser compatible with our site. We recommend using Google Chrome.</li>
          <li>IRS Form 1099 will remain available electronically for one year.</li>
          <li>You may obtain a paper copy of the electronic information by printing it from your computer.</li>
          <li>You may request a paper copy of any record made available to you electronically. A paper copy of your statement is available upon request at the GHRA office.</li>
        </ul>
      </div>

      <div className="form-group">
        <label className="checkbox-label checkbox-large">
          <input
            type="checkbox"
            name="financialConsent"
            onChange={handleInputChange}
          />
          <span>I certify that I have read this agreement and my signature indicates my understanding and consent.</span>
        </label>
      </div>
    </fieldset>
  )
}

export default FinancialInformationStep
