import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function ResendSignatureModal({ appId, userEmail, onClose }) {
  const { getSignatureStatus, resendSignature, sendReferencesRequest } = useContext(AuthContext)

  const [sigStatus, setSigStatus]         = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [emails, setEmails]               = useState({ member: '', reference1: '', reference2: '' })
  const [sending, setSending]             = useState({})
  const [messages, setMessages]           = useState({})
  const [sendRefLoading, setSendRefLoading] = useState(false)
  const [sendRefMsg, setSendRefMsg]       = useState(null)

  const applyStatus = (data) => {
    setSigStatus(data)
    if (data) {
      setEmails({
        member:     data.member?.email     || userEmail || '',
        reference1: data.reference1?.email || '',
        reference2: data.reference2?.email || '',
      })
    }
    setLoadingStatus(false)
  }

  useEffect(() => {
    getSignatureStatus(appId).then(applyStatus)
  }, [appId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async (target) => {
    setSending(s => ({ ...s, [target]: true }))
    setMessages(m => ({ ...m, [target]: null }))
    const result = await resendSignature(appId, target, emails[target])
    setSending(s => ({ ...s, [target]: false }))
    setMessages(m => ({ ...m, [target]: result }))
    if (result.success) {
      getSignatureStatus(appId).then(data => {
        if (data) applyStatus(data)
      })
    }
  }

  const handleSendReferences = async () => {
    setSendRefLoading(true)
    setSendRefMsg(null)
    const result = await sendReferencesRequest(appId, emails.reference1, emails.reference2)
    setSendRefLoading(false)
    if (result.success) {
      // Reload so the normal per-signer Resend controls appear
      setLoadingStatus(true)
      getSignatureStatus(appId).then(applyStatus)
    } else {
      setSendRefMsg(result)
    }
  }

  const statusBadge = (code) => {
    if (!code) return <span className="sig-status-badge sig-status-unknown">Not sent</span>
    if (code === 'signed')             return <span className="sig-status-badge sig-status-signed">Signed</span>
    if (code === 'awaiting_signature') return <span className="sig-status-badge sig-status-waiting">Awaiting</span>
    if (code === 'declined')           return <span className="sig-status-badge sig-status-declined">Declined</span>
    return <span className="sig-status-badge sig-status-unknown">{code}</span>
  }

  // True only when the server has confirmed no references request exists yet
  const referencesRequestMissing = sigStatus !== null && sigStatus?.referencesRequestExists === false

  const signers = [
    { key: 'member',     label: 'Member',      info: sigStatus?.member },
    { key: 'reference1', label: 'Reference 1', info: sigStatus?.reference1 },
    { key: 'reference2', label: 'Reference 2', info: sigStatus?.reference2 },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content resend-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Resend Signature Request</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="resend-modal-body">
          {loadingStatus ? (
            <p className="resend-loading">Loading signer status...</p>
          ) : (
            <>
              {signers.map(({ key, label, info }) => {
                const isRef     = key === 'reference1' || key === 'reference2'
                // For reference rows with no request: inputs are editable but Resend is suppressed
                const hideResend = isRef && referencesRequestMissing
                const isSigned  = info?.status === 'signed'
                const available = !!info
                const email     = emails[key] || ''
                const msg       = messages[key]

                return (
                  <div key={key} className={`resend-row ${isSigned ? 'resend-row-signed' : ''}`}>
                    <div className="resend-row-header">
                      <span className="resend-row-label">{label}</span>
                      {hideResend
                        ? <span className="sig-status-badge sig-status-unknown">No request sent</span>
                        : available ? statusBadge(info?.status) : (
                          <span className="sig-status-badge sig-status-unknown">No request sent</span>
                        )
                      }
                    </div>
                    <div className="resend-row-controls">
                      <input
                        type="email"
                        className="resend-email-input"
                        value={email}
                        onChange={e => setEmails(em => ({ ...em, [key]: e.target.value }))}
                        disabled={isSigned || (!hideResend && (!available || !!sending[key]))}
                        placeholder="Email address"
                      />
                      {!hideResend && (
                        <button
                          className="resend-button"
                          onClick={() => handleResend(key)}
                          disabled={isSigned || !available || !!sending[key] || !email}
                          title={isSigned ? 'Already signed' : !available ? 'No signature request exists yet' : ''}
                        >
                          {sending[key] ? 'Sending…' : 'Resend'}
                        </button>
                      )}
                    </div>
                    {msg && (
                      <p className={`resend-message ${msg.success ? 'resend-message-ok' : 'resend-message-err'}`}>
                        {msg.success ? msg.message : `Error: ${msg.error}`}
                      </p>
                    )}
                  </div>
                )
              })}

              {referencesRequestMissing && (
                <div className="resend-row">
                  <div className="resend-row-controls">
                    <button
                      className="resend-button"
                      style={{ flex: 1 }}
                      onClick={handleSendReferences}
                      disabled={sendRefLoading || !emails.reference1 || !emails.reference2}
                    >
                      {sendRefLoading ? 'Sending…' : 'Send References Request'}
                    </button>
                  </div>
                  {sendRefMsg && (
                    <p className={`resend-message ${sendRefMsg.success ? 'resend-message-ok' : 'resend-message-err'}`}>
                      {sendRefMsg.success ? 'References request sent.' : `Error: ${sendRefMsg.error}`}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ResendSignatureModal
