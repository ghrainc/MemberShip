import '../../styles/steps/DocumentUploadStep.css'

function DocumentUploadStep({ formData, errors, handleInputChange }) {
  const documents = [
    {
      id: 'driverLicenseCopies',
      title: 'Driver License Copies',
      description: 'Driver License Copies of Authorized Representative and all Company Officers (Picture and text must be visible)',
      required: true
    },
    {
      id: 'salesTaxPermit',
      title: 'Sales Tax Permit',
      description: 'Sales Tax Permit (Receipt will not be accepted)',
      required: true
    },
    {
      id: 'articlesOfIncorporation',
      title: 'Articles of Incorporation/Certificate of Formation',
      description: 'Articles of Incorporation/Certificate of Formation and Amendments-(Seal of "State of Texas")/Distribution of Shares',
      required: true
    },
    {
      id: 'irsDocument',
      title: 'IRS Document',
      description: 'IRS Document with the business EIN (Employer Identification Number)',
      required: true
    },
    {
      id: 'tobaccoPermit',
      title: 'Tobacco Permit',
      description: 'Tobacco Permit (if applicable)',
      required: false
    },
    {
      id: 'beerLicense',
      title: 'Beer License',
      description: 'Beer License (if not provided, must be submitted within 90 days)',
      required: false
    }
  ]

  const handleFileChange = (docId, e) => {
    const files = e.target.files
    handleInputChange({
      target: {
        name: docId,
        value: files ? files[0]?.name || '' : '',
        type: 'text'
      }
    })
  }

  return (
    <div className="document-upload-step">
      <div className="section-header">
        <h2>Required Documents</h2>
        <p className="section-description">
          Please upload or prepare copies of all required documents listed below. Ensure all documents are clear and legible.
        </p>
      </div>

      <div className="documents-list">
        {documents.map((doc) => (
          <div key={doc.id} className={`document-item ${doc.required ? 'required' : 'optional'}`}>
            <div className="document-header">
              <div className="document-title-section">
                <h3 className="document-title">{doc.title}</h3>
                {doc.required && <span className="required-badge">Required</span>}
                {!doc.required && <span className="optional-badge">Optional</span>}
              </div>
              <p className="document-description">{doc.description}</p>
            </div>

            <div className="document-upload-area">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id={doc.id}
                  name={doc.id}
                  onChange={(e) => handleFileChange(doc.id, e)}
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label htmlFor={doc.id} className="file-label">
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="upload-text">
                    {formData[doc.id] ? `✓ ${formData[doc.id]}` : 'Click to upload or drag and drop'}
                  </span>
                  <span className="upload-hint">PDF, JPG, PNG, DOC up to 10MB</span>
                </label>
              </div>
            </div>

            {errors[doc.id] && <span className="error-text">{errors[doc.id]}</span>}
          </div>
        ))}
      </div>

      <div className="document-notice">
        <div className="notice-icon">ℹ</div>
        <div className="notice-content">
          <h4>Important Notes:</h4>
          <ul>
            <li>All documents must be clear copies with visible content</li>
            <li>Required documents must be submitted to proceed with application</li>
            <li>Optional documents can be submitted later (within specified timeframes)</li>
            <li>Please do not submit original government documents - GHRA will not be responsible for loss</li>
            <li>GHRA will not accept, process or hold incomplete and/or inaccurate documents and applications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DocumentUploadStep
