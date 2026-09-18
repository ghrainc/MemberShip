import { useState, useEffect } from 'react'
import '../styles/ApprovalDialog.css'

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SignerField({ role, field, label, type = 'text', value, error, onChange, disabled }) {
  return (
    <div className="signer-field">
      <label className="signer-field-label" htmlFor={`signer-${role}-${field}`}>{label}</label>
      <input
        id={`signer-${role}-${field}`}
        name={`${role}-${field}`}
        type={type}
        autoComplete="off"
        className={`signer-input${error ? ' signer-input--error' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
      />
      {error && <span className="board-field-error">{error}</span>}
    </div>
  )
}

function ApprovalDialog({ application, action, onConfirm, onCancel, initialBoardSigners, prefillLoading, currentUser }) {
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [boardSigners, setBoardSigners] = useState({
    verification: { firstName: '', lastName: '', email: '' },
    approved:     { firstName: '', lastName: '', email: '' },
  })
  const [boardErrors, setBoardErrors] = useState({})

  const isApprove = action === 'approve'

  // Apply pre-fill once the fetch resolves. Inputs are hidden until then, so there is nothing to overwrite.
  useEffect(() => {
    if (!prefillLoading) {
      setBoardSigners({
        verification: initialBoardSigners?.verification ?? { firstName: '', lastName: '', email: '' },
        approved:     initialBoardSigners?.approved     ?? { firstName: '', lastName: '', email: '' },
      })
    }
  }, [prefillLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateSigner = (role, field, value) => {
    setBoardSigners(prev => ({ ...prev, [role]: { ...prev[role], [field]: value } }))
    setBoardErrors(prev => { const next = { ...prev }; delete next[`${role}_${field}`]; return next })
  }

  const validateBoard = () => {
    const errs = {}
    const v = boardSigners.verification
    const a = boardSigners.approved
    if (!v.firstName.trim()) errs.verification_firstName = 'Required'
    if (!v.lastName.trim())  errs.verification_lastName  = 'Required'
    if (!v.email.trim())     errs.verification_email     = 'Required'
    else if (!EMAIL_RX.test(v.email)) errs.verification_email = 'Invalid email'
    if (!a.firstName.trim()) errs.approved_firstName = 'Required'
    if (!a.lastName.trim())  errs.approved_lastName  = 'Required'
    if (!a.email.trim())     errs.approved_email     = 'Required'
    else if (!EMAIL_RX.test(a.email)) errs.approved_email = 'Invalid email'
    if (!errs.verification_email && !errs.approved_email &&
        v.email.toLowerCase() === a.email.toLowerCase()) {
      errs.approved_email = 'Must differ from Verification signer email'
    }
    return errs
  }

  const handleConfirm = () => {
    if (isApprove) {
      const errs = validateBoard()
      if (Object.keys(errs).length > 0) { setBoardErrors(errs); return }
    }
    setIsSubmitting(true)
    onConfirm(comments, isApprove ? boardSigners : null)
  }

  const adminName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || '(name not set)'
  const adminDisplay = `${adminName} (${currentUser?.email || ''})`

  const config = isApprove
    ? { title: 'Approve Application', message: 'Enter board signer details to proceed with approval.', buttonClass: 'approve-button', buttonText: 'Approve & Send', icon: '✓' }
    : { title: 'Reject Application',  message: 'Are you sure you want to reject this application?',  buttonClass: 'reject-button',  buttonText: 'Reject',         icon: '✕' }

  return (
    <div className="approval-dialog-overlay">
      <div className={`approval-dialog${isApprove ? ' approval-dialog--wide' : ''}`}>
        <div className="dialog-header">
          <span className={`dialog-icon ${action}`}>{config.icon}</span>
          <h2>{config.title}</h2>
          <button type="button" className="close-button" onClick={onCancel} disabled={isSubmitting}>✕</button>
        </div>

        <div className="dialog-content">
          <div className="application-info">
            <h3>{application.StoreName}</h3>
            <p>ID: {application.Id}</p>
          </div>

          <p className="confirmation-message">{config.message}</p>

          {isApprove && (
            <div className="board-signers-section">
              {prefillLoading ? (
                <div className="board-prefill-loading">Loading board signer history…</div>
              ) : (
                <>
                  <div className="board-signer-group">
                    <div className="board-signers-group-title">Verification Board Signer</div>
                    <div className="board-signer-name-row">
                      <SignerField role="verification" field="firstName" label="First Name"
                        value={boardSigners.verification.firstName} error={boardErrors.verification_firstName}
                        onChange={e => updateSigner('verification', 'firstName', e.target.value)} disabled={isSubmitting} />
                      <SignerField role="verification" field="lastName" label="Last Name"
                        value={boardSigners.verification.lastName} error={boardErrors.verification_lastName}
                        onChange={e => updateSigner('verification', 'lastName', e.target.value)} disabled={isSubmitting} />
                    </div>
                    <SignerField role="verification" field="email" label="Email Address" type="email"
                      value={boardSigners.verification.email} error={boardErrors.verification_email}
                      onChange={e => updateSigner('verification', 'email', e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="board-signer-group">
                    <div className="board-signers-group-title">Approved Board Signer</div>
                    <div className="board-signer-name-row">
                      <SignerField role="approved" field="firstName" label="First Name"
                        value={boardSigners.approved.firstName} error={boardErrors.approved_firstName}
                        onChange={e => updateSigner('approved', 'firstName', e.target.value)} disabled={isSubmitting} />
                      <SignerField role="approved" field="lastName" label="Last Name"
                        value={boardSigners.approved.lastName} error={boardErrors.approved_lastName}
                        onChange={e => updateSigner('approved', 'lastName', e.target.value)} disabled={isSubmitting} />
                    </div>
                    <SignerField role="approved" field="email" label="Email Address" type="email"
                      value={boardSigners.approved.email} error={boardErrors.approved_email}
                      onChange={e => updateSigner('approved', 'email', e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="board-signer-group board-signer-group--admin">
                    <div className="board-signers-group-title">Membership Admin</div>
                    <div className="board-signer-admin-readonly">{adminDisplay}</div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="comments" className="form-label">
              Comments {isApprove ? '(Optional)' : '(Required)'}
            </label>
            <textarea
              id="comments"
              className="comments-textarea"
              placeholder={isApprove
                ? 'Add any additional notes about this application approval...'
                : 'Please provide reason for rejection...'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting}
              rows={isApprove ? 3 : 4}
              required={!isApprove}
            />
            {!isApprove && !comments.trim() && (
              <p className="validation-error">Comments are required for rejection</p>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button type="button" className="dialog-button cancel-button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={`dialog-button ${config.buttonClass}`}
            onClick={handleConfirm}
            disabled={isSubmitting || (!isApprove && !comments.trim())}
          >
            {isSubmitting ? 'Processing...' : config.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApprovalDialog
