import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/EmployeeDashboard.css'

function getBoardVerifyState(app) {
  if (!app.SignatureRequestId)  return 'not_sent'
  if (app.VerificationSignedAt) return 'signed'
  return 'awaiting'
}

function getBoardApproveState(app) {
  if (!app.SignatureRequestId)   return 'not_sent'
  if (app.ApprovedSignedAt)      return 'signed'
  if (!app.VerificationSignedAt) return 'queued'
  return 'awaiting'
}

function getAdminSignState(app) {
  if (!app.SignatureRequestId) return 'not_sent'
  if (!app.AdminSignatureId)   return 'legacy'
  if (app.AdminSignedAt)       return 'signed'
  return 'awaiting'
}

function StateBadge({ state, signedAt }) {
  if (state === 'not_sent') return <span className="sig-status-badge sig-status-unknown">Not Sent</span>
  if (state === 'legacy')   return <span className="sig-status-badge sig-status-unknown">N/A</span>
  if (state === 'queued')   return <span className="sig-status-badge sig-status-queued">Queued</span>
  if (state === 'awaiting') return <span className="sig-status-badge sig-status-waiting">Awaiting</span>
  if (state === 'signed') {
    const dateStr = signedAt ? new Date(signedAt).toLocaleDateString() : ''
    return <span className="sig-status-badge sig-status-signed" title={dateStr ? `Signed ${dateStr}` : undefined}>Signed</span>
  }
  return <span className="sig-status-badge sig-status-unknown">{state}</span>
}

function SignerBlock({ title, state, signedAt, editData, onChange, target, appId }) {
  const { resendSignature } = useContext(AuthContext)
  const [resendConfirm, setResendConfirm] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState(null)

  const canEdit   = state !== 'signed'
  const canResend = state === 'awaiting'

  const handleResend = async () => {
    setResendLoading(true)
    setResendMessage(null)
    const result = await resendSignature(appId, target, '')
    setResendLoading(false)
    setResendConfirm(false)
    setResendMessage(result)
  }

  return (
    <div className="board-signer-section-block">
      <div className="board-signer-section-header">
        <span className="board-signer-section-title">{title}</span>
        <StateBadge state={state} signedAt={signedAt} />
      </div>

      {canEdit ? (
        <div className="board-signer-edit-fields">
          <div className="board-signer-name-row">
            <div className="signer-field">
              <label className="signer-field-label">First Name</label>
              <input
                className="signer-input"
                value={editData.firstName}
                onChange={e => onChange({ ...editData, firstName: e.target.value })}
              />
            </div>
            <div className="signer-field">
              <label className="signer-field-label">Last Name</label>
              <input
                className="signer-input"
                value={editData.lastName}
                onChange={e => onChange({ ...editData, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="signer-field">
            <label className="signer-field-label">Email Address</label>
            <input
              type="email"
              className="signer-input"
              value={editData.email}
              onChange={e => onChange({ ...editData, email: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <div className="board-signer-readonly">
          <span>{editData.firstName} {editData.lastName}</span>
          <span className="board-signer-email">{editData.email}</span>
        </div>
      )}

      {canResend && (
        <div className="board-signer-resend-row">
          {resendConfirm ? (
            <>
              <span className="board-signer-resend-confirm">Resend reminder?</span>
              <button className="board-resend-yes" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? '...' : 'Yes'}
              </button>
              <button className="board-resend-cancel" onClick={() => setResendConfirm(false)}>Cancel</button>
            </>
          ) : (
            <button className="resend-button" onClick={() => setResendConfirm(true)}>Resend</button>
          )}
          {resendMessage && (
            <p className={`resend-message ${resendMessage.success ? 'resend-message-ok' : 'resend-message-err'}`}>
              {resendMessage.success ? resendMessage.message : resendMessage.error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function BoardSignersModal({ app, onClose, onSaved }) {
  const { updateBoardSigners } = useContext(AuthContext)

  const verifyState  = getBoardVerifyState(app)
  const approveState = getBoardApproveState(app)
  const adminState   = getAdminSignState(app)

  const [editVerify, setEditVerify] = useState({
    firstName: app.BoardSignerVerificationFirstName || '',
    lastName:  app.BoardSignerVerificationLastName  || '',
    email:     app.BoardSignerVerificationEmail     || '',
  })
  const [editApproved, setEditApproved] = useState({
    firstName: app.BoardSignerApprovedFirstName || '',
    lastName:  app.BoardSignerApprovedLastName  || '',
    email:     app.BoardSignerApprovedEmail     || '',
  })
  const [adminRedirectEmail, setAdminRedirectEmail] = useState(app.AdminSignerEmail || '')

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const adminCanRedirect = adminState === 'awaiting'
  const hasEditable = verifyState !== 'signed' || approveState !== 'signed' || adminCanRedirect

  const handleSave = async () => {
    setSaveLoading(true)
    setSaveError('')
    setSaveSuccess('')
    const result = await updateBoardSigners(
      app.Id,
      verifyState  !== 'signed' ? editVerify   : null,
      approveState !== 'signed' ? editApproved : null,
      adminCanRedirect ? { email: adminRedirectEmail } : null
    )
    setSaveLoading(false)
    if (result.success) {
      setSaveSuccess('Board signer details saved.')
      onSaved()
    } else {
      setSaveError(result.error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content board-signers-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Board Signers — {app.StoreName}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <SignerBlock
            title="Verification Board Signer"
            state={verifyState}
            signedAt={app.VerificationSignedAt}
            editData={editVerify}
            onChange={setEditVerify}
            target="verification_board_signer"
            appId={app.Id}
          />
          <hr className="board-signer-hr" />
          <SignerBlock
            title="Approved Board Signer"
            state={approveState}
            signedAt={app.ApprovedSignedAt}
            editData={editApproved}
            onChange={setEditApproved}
            target="approved_board_signer"
            appId={app.Id}
          />
          {adminState !== 'legacy' && adminState !== 'not_sent' && (
            <>
              <hr className="board-signer-hr" />
              <div className="board-signer-section-block">
                <div className="board-signer-section-header">
                  <span className="board-signer-section-title">Membership Admin</span>
                  <StateBadge state={adminState} signedAt={app.AdminSignedAt} />
                </div>
                <div className="board-signer-readonly">
                  <span>{[app.AdminSignerFirstName, app.AdminSignerLastName].filter(Boolean).join(' ')}</span>
                  <span className="board-signer-email">{app.AdminSignerEmail}</span>
                </div>
                {adminCanRedirect && (
                  <div className="board-signer-redirect-row">
                    <label className="signer-field-label">Redirect to another email</label>
                    <input
                      type="email"
                      className="signer-input"
                      value={adminRedirectEmail}
                      onChange={e => setAdminRedirectEmail(e.target.value)}
                      placeholder="Leave unchanged to keep current email"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {saveError   && <div className="modal-error">{saveError}</div>}
          {saveSuccess && <div className="modal-success">{saveSuccess}</div>}

          <div className="modal-actions">
            {hasEditable && (
              <button className="modal-submit-button" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button className="modal-cancel-button" onClick={onClose}>
              {hasEditable ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardSignersModal
