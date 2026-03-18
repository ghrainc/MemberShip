import { useState } from 'react'
import '../../styles/steps/DocumentUploadStep.css'

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
const ALLOWED_LABEL = 'PDF, Word (.doc, .docx), or image files (JPG, PNG, GIF, BMP, WebP) — max 10MB'

function getFileExtension(filename) {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase()
}

function DocumentUploadStep({ formData, errors, handleInputChange, applicationId, uploadDocument, removeDocument }) {
  const [uploadStates, setUploadStates] = useState({})
  const [inputKeys, setInputKeys] = useState({})

  const owners = formData.owners || []
  const multipleOwners = owners.length > 1

  const driverLicenseDocs = multipleOwners
    ? owners.map((owner, index) => {
        const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || `Owner ${index + 1}`
        return {
          id: `driverLicense_owner_${index}`,
          title: `Driver License — ${name}`,
          description: 'Driver License copy (Picture and text must be visible)',
          required: true
        }
      })
    : [{
        id: 'driverLicenseCopies',
        title: 'Driver License Copies',
        description: 'Driver License Copies of Authorized Representative and all Company Officers (Picture and text must be visible)',
        required: true
      }]

  const documents = [
    ...driverLicenseDocs,
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
      required: true
    },
    {
      id: 'beerLicense',
      title: 'Beer License',
      description: 'Beer License (if not provided, must be submitted within 90 days)',
      required: false
    }
  ]

  const setUploadState = (docId, state) => {
    setUploadStates(prev => ({ ...prev, [docId]: { ...prev[docId], ...state } }))
  }

  const handleFileChange = async (docId, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate extension
    const ext = getFileExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadState(docId, { error: `Invalid file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` })
      e.target.value = ''
      return
    }

    if (!applicationId) {
      setUploadState(docId, { error: 'Please complete a previous step first so your application is saved before uploading documents.' })
      e.target.value = ''
      return
    }

    setUploadState(docId, { loading: true, error: null })

    try {
      const result = await uploadDocument(applicationId, docId, file)
      handleInputChange({
        target: { name: docId, value: result, type: 'text' }
      })
      setUploadState(docId, { loading: false, error: null })
    } catch (err) {
      setUploadState(docId, { loading: false, error: err.message || 'Upload failed. Please try again.' })
      e.target.value = ''
    }
  }

  const handlePreview = (docValue) => {
    const url = typeof docValue === 'object' ? docValue.url : null
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRemove = (docId) => {
    const docValue = formData[docId]
    // Delete from server (best-effort)
    if (applicationId && typeof docValue === 'object') {
      removeDocument(applicationId, docId)
    }
    // Clear formData
    handleInputChange({ target: { name: docId, value: '', type: 'text' } })
    // Reset the file input by bumping its key
    setInputKeys(prev => ({ ...prev, [docId]: (prev[docId] || 0) + 1 }))
    // Clear any upload error state
    setUploadState(docId, { error: null })
  }

  const getDisplayName = (docValue) => {
    if (!docValue) return null
    if (typeof docValue === 'object') return docValue.originalName
    return docValue // legacy string format
  }

  const getPreviewUrl = (docValue) => {
    if (!docValue) return null
    if (typeof docValue === 'object') return docValue.url
    return null
  }

  return (
    <div className="document-upload-step">
      <div className="section-header">
        <h2>Required Documents</h2>
        <p className="section-description">
          Please upload all required documents listed below. Ensure all documents are clear and legible.
        </p>
      </div>

      <div className="documents-list">
        {documents.map((doc) => {
          const docValue = formData[doc.id]
          const displayName = getDisplayName(docValue)
          const previewUrl = getPreviewUrl(docValue)
          const state = uploadStates[doc.id] || {}
          const uploadError = errors[doc.id] || state.error

          return (
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
                    key={inputKeys[doc.id] || 0}
                    type="file"
                    id={`${doc.id}_${inputKeys[doc.id] || 0}`}
                    name={doc.id}
                    onChange={(e) => handleFileChange(doc.id, e)}
                    className="file-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                    disabled={state.loading}
                  />
                  <label htmlFor={`${doc.id}_${inputKeys[doc.id] || 0}`} className={`file-label ${state.loading ? 'loading' : ''} ${displayName ? 'has-file' : ''}`}>
                    {state.loading ? (
                      <>
                        <span className="upload-spinner" />
                        <span className="upload-text">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span className="upload-text">
                          {displayName ? `✓ ${displayName}` : 'Click to upload or drag and drop'}
                        </span>
                        <span className="upload-hint">{ALLOWED_LABEL}</span>
                      </>
                    )}
                  </label>
                </div>

                {previewUrl && (
                  <button
                    type="button"
                    className="preview-button"
                    onClick={() => handlePreview(docValue)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="preview-icon">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Preview
                  </button>
                )}

                {displayName && !state.loading && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => handleRemove(doc.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="remove-icon">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                    Remove
                  </button>
                )}
              </div>

              {uploadError && <span className="error-text">{uploadError}</span>}
            </div>
          )
        })}
      </div>

      <div className="document-notice">
        <div className="notice-icon">ℹ</div>
        <div className="notice-content">
          <h4>Important Notes:</h4>
          <ul>
            <li>All documents must be clear copies with visible content</li>
            <li>Required documents must be submitted to proceed with application</li>
            <li>GHRA will not accept, process or hold incomplete and/or inaccurate documents and applications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DocumentUploadStep
