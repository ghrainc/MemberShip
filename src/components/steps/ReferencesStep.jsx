function ReferencesStep({ formData, handleInputChange }) {
  const numericInput = (name) => (e) => {
    handleInputChange({ target: { name, value: e.target.value.replace(/\D/g, ''), type: 'text' } })
  }

  return (
    <fieldset className="form-section">
      <legend>Two References / Recommendations</legend>
      <p className="section-note">Note: NO SELF REFERENCES (Two references from two different existing GHRA members)</p>

      <div className="form-section-inner">
        <span className="inner-legend">Reference 1</span>
        <div className="form-group">
          <label htmlFor="reference1Email">Email Address</label>
          <input
            type="email"
            id="reference1Email"
            name="reference1Email"
            value={formData.reference1Email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Email"
            maxLength={50}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reference1Company">Company Name</label>
          <input
            type="text"
            id="reference1Company"
            name="reference1Company"
            value={formData.reference1Company}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Company Name"
            maxLength={50}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reference1GhraNumber">GHRA Membership #</label>
            <input
              type="text"
              id="reference1GhraNumber"
              name="reference1GhraNumber"
              value={formData.reference1GhraNumber}
              onChange={numericInput('reference1GhraNumber')}
              className="form-input"
              placeholder="Numbers only"
              maxLength={20}
              inputMode="numeric"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reference1RepName">Authorized Representative Name</label>
            <input
              type="text"
              id="reference1RepName"
              name="reference1RepName"
              value={formData.reference1RepName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Name"
              maxLength={50}
            />
          </div>
        </div>
      </div>

      <div className="form-section-inner">
        <span className="inner-legend">Reference 2</span>
        <div className="form-group">
          <label htmlFor="reference2Email">Email Address</label>
          <input
            type="email"
            id="reference2Email"
            name="reference2Email"
            value={formData.reference2Email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Email"
            maxLength={50}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reference2Company">Company Name</label>
          <input
            type="text"
            id="reference2Company"
            name="reference2Company"
            value={formData.reference2Company}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Company Name"
            maxLength={50}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reference2GhraNumber">GHRA Membership #</label>
            <input
              type="text"
              id="reference2GhraNumber"
              name="reference2GhraNumber"
              value={formData.reference2GhraNumber}
              onChange={numericInput('reference2GhraNumber')}
              className="form-input"
              placeholder="Numbers only"
              maxLength={20}
              inputMode="numeric"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reference2RepName">Authorized Representative Name</label>
            <input
              type="text"
              id="reference2RepName"
              name="reference2RepName"
              value={formData.reference2RepName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Name"
              maxLength={50}
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}

export default ReferencesStep
