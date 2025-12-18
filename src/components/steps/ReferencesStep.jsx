function ReferencesStep({ formData, handleInputChange }) {
  return (
    <fieldset className="form-section">
      <legend>Two References / Recommendations</legend>
      <p className="section-note">Note: NO SELF REFERENCES (Two references from two different existing GHRA members)</p>

      <div className="reference-subsection">
        <h4>Reference 1</h4>
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
              onChange={handleInputChange}
              className="form-input"
              placeholder="GHRA #"
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
            />
          </div>
        </div>
      </div>

      <div className="reference-subsection">
        <h4>Reference 2</h4>
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
              onChange={handleInputChange}
              className="form-input"
              placeholder="GHRA #"
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
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}

export default ReferencesStep
