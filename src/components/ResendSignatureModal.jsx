import { useState, useEffect, useContext, useRef } from 'react'
import { AuthContext } from '../context/AuthContext'

function ResendSignatureModal({ appId, userEmail, onClose }) {
  const {
    getSignatureStatus, resendSignature, sendReferencesRequest,
    getApplicationById, resendReferencesRequest,
  } = useContext(AuthContext)

  const [sigStatus, setSigStatus]         = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [emails, setEmails]               = useState({ member: '', reference1: '', reference2: '' })
  const [sending, setSending]             = useState({})
  const [messages, setMessages]           = useState({})
  const [sendRefLoading, setSendRefLoading] = useState(false)
  const [sendRefMsg, setSendRefMsg]       = useState(null)

  // "Resend with updated details" state — only used when a references request already exists.
  const [refForm, setRefForm] = useState({
    reference1: { repName: '', company: '', ghraNumber: '', email: '' },
    reference2: { repName: '', company: '', ghraNumber: '', email: '' },
  })
  const [refFormOpen, setRefFormOpen]     = useState(false)
  const [refFormLoading, setRefFormLoading] = useState(false)
  const [refFormMsg, setRefFormMsg]       = useState(null)
  const [refFormConfirming, setRefFormConfirming] = useState(false)

  // Snapshot of the stored reference values at modal open-time. Used by the review
  // screen to show a true "current → new" diff that doesn't shift as the user edits.
  const refOriginalRef = useRef({
    reference1: { repName: '', company: '', ghraNumber: '', email: '' },
    reference2: { repName: '', company: '', ghraNumber: '', email: '' },
  })

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
    // Pre-fill the full reference-edit form from the stored application record.
    getApplicationById(appId).then(app => {
      if (!app) return
      let fd = {}
      try { fd = typeof app.FormData === 'string' ? JSON.parse(app.FormData || '{}') : (app.FormData || {}) } catch {}
      const initial = {
        reference1: {
          repName:    fd.reference1RepName    || '',
          company:    fd.reference1Company    || '',
          ghraNumber: fd.reference1GhraNumber || '',
          email:      fd.reference1Email      || '',
        },
        reference2: {
          repName:    fd.reference2RepName    || '',
          company:    fd.reference2Company    || '',
          ghraNumber: fd.reference2GhraNumber || '',
          email:      fd.reference2Email      || '',
        },
      }
      setRefForm(initial)
      // Deep-ish copy so later edits to setRefForm don't mutate the snapshot.
      refOriginalRef.current = {
        reference1: { ...initial.reference1 },
        reference2: { ...initial.reference2 },
      }
    })
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
      setLoadingStatus(true)
      getSignatureStatus(appId).then(applyStatus)
    } else {
      setSendRefMsg(result)
    }
  }

  const updateRefField = (key, field, value) => {
    setRefForm(f => ({ ...f, [key]: { ...f[key], [field]: value } }))
  }

  const handleResendReferences = async () => {
    setRefFormLoading(true)
    setRefFormMsg(null)
    const result = await resendReferencesRequest(appId, refForm.reference1, refForm.reference2)
    setRefFormLoading(false)
    setRefFormConfirming(false)
    if (result.success) {
      setRefFormMsg({ success: true, message: result.message || 'References request cancelled and resent.' })
      // Reload live status and stored details so the dialog reflects the new state.
      setLoadingStatus(true)
      getSignatureStatus(appId).then(applyStatus)
    } else {
      setRefFormMsg(result)
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
  const referencesRequestExists  = sigStatus?.referencesRequestExists === true
  const ref1Signed = sigStatus?.reference1?.status === 'signed'
  const ref2Signed = sigStatus?.reference2?.status === 'signed'
  const referencesFullySigned = referencesRequestExists && ref1Signed && ref2Signed

  const signers = [
    { key: 'member',     label: 'Member',      info: sigStatus?.member },
    { key: 'reference1', label: 'Reference 1', info: sigStatus?.reference1 },
    { key: 'reference2', label: 'Reference 2', info: sigStatus?.reference2 },
  ]

  const refValid = (r) => r.repName.trim() && r.company.trim() && r.ghraNumber.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || '').trim())
  const refFormValid = refValid(refForm.reference1) && refValid(refForm.reference2)

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

              {/* ── Resend References Request (change details) ───────────────────── */}
              {referencesRequestExists && (
                <div className="resend-row" style={{ marginTop: 16, borderTop: '1px solid var(--ghra-line)', paddingTop: 16 }}>
                  {!refFormOpen ? (
                    <div className="resend-row-controls">
                      <button
                        className="resend-button"
                        style={{ flex: 1 }}
                        onClick={() => setRefFormOpen(true)}
                        disabled={referencesFullySigned}
                        title={referencesFullySigned ? 'Both references have already signed — nothing to resend.' : ''}
                      >
                        {referencesFullySigned ? 'References fully signed' : 'Resend References Request (change details)'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="resend-row-header" style={{ marginBottom: 8 }}>
                        <span className="resend-row-label">Update reference details and resend</span>
                        <button
                          className="modal-close"
                          onClick={() => { if (!refFormLoading) { setRefFormOpen(false); setRefFormMsg(null); setRefFormConfirming(false) } }}
                          title="Close editor"
                          style={{ fontSize: 14 }}
                        >✕</button>
                      </div>

                      {(ref1Signed || ref2Signed) && !refFormConfirming && (
                        <div className="resend-message resend-message-err" style={{ marginBottom: 10 }}>
                          {ref1Signed && (
                            <div>⚠ Reference 1 ({refForm.reference1.repName || sigStatus?.reference1?.email}) has already signed. Cancelling will void that signature and they will need to sign again.</div>
                          )}
                          {ref2Signed && (
                            <div>⚠ Reference 2 ({refForm.reference2.repName || sigStatus?.reference2?.email}) has already signed. Cancelling will void that signature and they will need to sign again.</div>
                          )}
                        </div>
                      )}

                      {!refFormConfirming && ['reference1', 'reference2'].map((key, idx) => {
                        const inputStyle = { fontSize: 13 }
                        const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ghra-muted)', marginBottom: 2 }
                        return (
                          <div key={key} style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Reference {idx + 1}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={labelStyle} htmlFor={`${key}-repName`}>Reference Name</label>
                                <input
                                  id={`${key}-repName`}
                                  className="resend-email-input"
                                  style={inputStyle}
                                  value={refForm[key].repName}
                                  onChange={e => updateRefField(key, 'repName', e.target.value)}
                                  disabled={refFormLoading}
                                />
                              </div>
                              <div>
                                <label style={labelStyle} htmlFor={`${key}-company`}>Company</label>
                                <input
                                  id={`${key}-company`}
                                  className="resend-email-input"
                                  style={inputStyle}
                                  value={refForm[key].company}
                                  onChange={e => updateRefField(key, 'company', e.target.value)}
                                  disabled={refFormLoading}
                                />
                              </div>
                              <div>
                                <label style={labelStyle} htmlFor={`${key}-ghraNumber`}>GHRA #</label>
                                <input
                                  id={`${key}-ghraNumber`}
                                  className="resend-email-input"
                                  style={inputStyle}
                                  value={refForm[key].ghraNumber}
                                  onChange={e => updateRefField(key, 'ghraNumber', e.target.value)}
                                  disabled={refFormLoading}
                                />
                              </div>
                              <div>
                                <label style={labelStyle} htmlFor={`${key}-email`}>Email</label>
                                <input
                                  id={`${key}-email`}
                                  type="email"
                                  className="resend-email-input"
                                  style={inputStyle}
                                  value={refForm[key].email}
                                  onChange={e => updateRefField(key, 'email', e.target.value)}
                                  disabled={refFormLoading}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {!refFormConfirming ? (
                        <div className="resend-row-controls">
                          <button
                            className="resend-button"
                            style={{ flex: 1 }}
                            onClick={() => setRefFormConfirming(true)}
                            disabled={refFormLoading || !refFormValid}
                            title={!refFormValid ? 'All four fields are required for each reference, and emails must be valid.' : ''}
                          >
                            Review changes
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Review changes before confirming</div>

                          {(ref1Signed || ref2Signed) && (
                            <div className="resend-message resend-message-err" style={{ margin: 0 }}>
                              {ref1Signed && (
                                <div>⚠ Reference 1 — <strong>{refForm.reference1.repName || sigStatus?.reference1?.email}</strong> has already signed. Confirming will void that signature.</div>
                              )}
                              {ref2Signed && (
                                <div>⚠ Reference 2 — <strong>{refForm.reference2.repName || sigStatus?.reference2?.email}</strong> has already signed. Confirming will void that signature.</div>
                              )}
                            </div>
                          )}

                          {(() => {
                            // Pulled from the application record (loaded on open) so this is
                            // genuinely "before" — not just the edit form's starting state.
                            const refOrig = {
                              reference1: {
                                repName:    refOriginalRef.current.reference1.repName,
                                company:    refOriginalRef.current.reference1.company,
                                ghraNumber: refOriginalRef.current.reference1.ghraNumber,
                                email:      refOriginalRef.current.reference1.email,
                              },
                              reference2: {
                                repName:    refOriginalRef.current.reference2.repName,
                                company:    refOriginalRef.current.reference2.company,
                                ghraNumber: refOriginalRef.current.reference2.ghraNumber,
                                email:      refOriginalRef.current.reference2.email,
                              },
                            }
                            const normEmail = v => (v || '').trim().toLowerCase()
                            const diffRow = (key, idx) => {
                              const o = refOrig[key]
                              const n = refForm[key]
                              const rows = [
                                ['Reference Name', o.repName,    n.repName.trim()],
                                ['Company',        o.company,    n.company.trim()],
                                ['GHRA #',         o.ghraNumber, n.ghraNumber.trim()],
                                ['Email',          normEmail(o.email), normEmail(n.email)],
                              ]
                              return (
                                <div key={key} style={{ marginBottom: 10 }}>
                                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Reference {idx + 1}</div>
                                  <table className="ds-activity-table" style={{ width: '100%' }}>
                                    <thead>
                                      <tr>
                                        <th style={{ width: '20%' }}>Field</th>
                                        <th>Current</th>
                                        <th>New</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map(([label, oldV, newV]) => {
                                        const changed = oldV !== newV
                                        return (
                                          <tr key={label}>
                                            <td style={{ fontWeight: 500 }}>{label}</td>
                                            <td style={{ color: changed ? 'var(--ghra-muted)' : 'inherit', textDecoration: changed ? 'line-through' : 'none' }}>{oldV || <em style={{ color: 'var(--ghra-muted)' }}>(empty)</em>}</td>
                                            <td style={{ color: changed ? 'var(--ghra-red)' : 'inherit', fontWeight: changed ? 600 : 400 }}>{newV || <em style={{ color: 'var(--ghra-muted)' }}>(empty)</em>}</td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )
                            }
                            return <>{diffRow('reference1', 0)}{diffRow('reference2', 1)}</>
                          })()}

                          <div className="resend-message resend-message-err" style={{ margin: 0 }}>
                            This will <strong>cancel</strong> the existing Dropbox Sign references request and send a <strong>new one to both references</strong> with the values shown above. {(ref1Signed || ref2Signed) && 'Any already-signed signature on the current request will be voided.'}
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="modal-cancel-button"
                              style={{ flex: 1 }}
                              onClick={() => setRefFormConfirming(false)}
                              disabled={refFormLoading}
                            >Back</button>
                            <button
                              className="resend-button"
                              style={{ flex: 2 }}
                              onClick={handleResendReferences}
                              disabled={refFormLoading}
                            >
                              {refFormLoading ? 'Cancelling & resending…' : 'Cancel & Resend to Both'}
                            </button>
                          </div>
                        </div>
                      )}

                      {refFormMsg && (
                        <p className={`resend-message ${refFormMsg.success ? 'resend-message-ok' : 'resend-message-err'}`} style={{ marginTop: 8 }}>
                          {refFormMsg.success ? refFormMsg.message : `Error: ${refFormMsg.error}`}
                        </p>
                      )}
                    </>
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
