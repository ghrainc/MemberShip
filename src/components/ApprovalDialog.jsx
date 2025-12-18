import { useState } from 'react'
import '../styles/ApprovalDialog.css'

function ApprovalDialog({ application, action, onConfirm, onCancel }) {
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = () => {
    setIsSubmitting(true)
    onConfirm(comments)
  }

  const getDialogConfig = () => {
    if (action === 'approve') {
      return {
        title: 'Approve Application',
        message: `Are you sure you want to approve this application?`,
        buttonClass: 'approve-button',
        buttonText: 'Approve',
        icon: '✓'
      }
    } else {
      return {
        title: 'Reject Application',
        message: `Are you sure you want to reject this application?`,
        buttonClass: 'reject-button',
        buttonText: 'Reject',
        icon: '✕'
      }
    }
  }

  const config = getDialogConfig()

  return (
    <div className="approval-dialog-overlay">
      <div className="approval-dialog">
        <div className="dialog-header">
          <span className={`dialog-icon ${action}`}>{config.icon}</span>
          <h2>{config.title}</h2>
          <button
            type="button"
            className="close-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="dialog-content">
          <div className="application-info">
            <h3>{application.storeName}</h3>
            <p>ID: {application.id}</p>
          </div>

          <p className="confirmation-message">{config.message}</p>

          <div className="form-group">
            <label htmlFor="comments" className="form-label">
              Comments {action === 'approve' ? '(Optional)' : '(Required)'}
            </label>
            <textarea
              id="comments"
              className="comments-textarea"
              placeholder={action === 'approve' 
                ? 'Add any additional notes about this application approval...' 
                : 'Please provide reason for rejection...'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting}
              rows="4"
              required={action === 'reject'}
            />
            {action === 'reject' && !comments.trim() && (
              <p className="validation-error">Comments are required for rejection</p>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="dialog-button cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`dialog-button ${config.buttonClass}`}
            onClick={handleConfirm}
            disabled={isSubmitting || (action === 'reject' && !comments.trim())}
          >
            {isSubmitting ? 'Processing...' : config.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApprovalDialog
