import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { getAllSlots, normaliseDocuments } from '../../utils/documentSlots'
import MultiFileUploader from '../MultiFileUploader'
import '../../styles/steps/DocumentUploadStep.css'

function DocumentUploadStep({
  formData, errors, handleInputChange, applicationId,
  uploadDocument, removeDocument, clearError,
}) {
  const { openDocument, downloadCombinedPdf } = useContext(AuthContext)

  const owners = formData.owners || []
  const slots = getAllSlots(owners)
  const documents = normaliseDocuments(formData)

  const handleFilesChange = (slotId, newFiles) => {
    handleInputChange({ target: { name: 'documents', value: { ...documents, [slotId]: newFiles } } })
    if (newFiles.length > 0 && clearError) clearError(slotId)
  }

  return (
    <div className="document-upload-step">
      <div className="section-header">
        <h2>Required Documents</h2>
        <p className="section-description">
          Upload all required documents below. You can add multiple files per slot and drag to reorder them.
        </p>
      </div>

      <div className="documents-list">
        {slots.map(slot => (
          <MultiFileUploader
            key={slot.id}
            slot={slot}
            files={documents[slot.id] || []}
            applicationId={applicationId}
            onFilesChange={handleFilesChange}
            error={errors[slot.id]}
            uploadDocument={uploadDocument}
            removeDocument={removeDocument}
            openDocument={openDocument}
            downloadCombinedPdf={downloadCombinedPdf}
          />
        ))}
      </div>

      <div className="document-notice">
        <div className="notice-icon">&#x2139;</div>
        <div className="notice-content">
          <h4>Important Notes:</h4>
          <ul>
            <li>All documents must be clear copies with visible content</li>
            <li>Required documents must be submitted to proceed with your application</li>
            <li>GHRA will not accept, process or hold incomplete and/or inaccurate documents and applications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DocumentUploadStep
