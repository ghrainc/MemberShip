import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import '../../styles/settings.css'

export default function EmailSettings() {
  const { getEmailSettings, updateEmailSettings, sendTestEmail } = useContext(AuthContext)

  const [form, setForm] = useState({
    host: '', port: '587', user: '', password: '', fromAddr: '', fromName: 'GHRA Membership', tls: false,
  })
  const [passwordSet, setPasswordSet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  const [testTo, setTestTo] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testMsg, setTestMsg] = useState(null)

  useEffect(() => {
    getEmailSettings().then(data => {
      if (data) {
        setForm({
          host:     data.host     || '',
          port:     String(data.port || 587),
          user:     data.user     || '',
          password: '',
          fromAddr: data.fromAddr || '',
          fromName: data.fromName || 'GHRA Membership',
          tls:      !!data.tls,
        })
        setPasswordSet(!!data.passwordSet)
      }
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaveMsg(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    const payload = { ...form }
    if (!payload.password) delete payload.password
    const result = await updateEmailSettings(payload)
    setSaving(false)
    if (result.success) {
      setSaveMsg({ ok: true, text: 'Settings saved.' })
      if (form.password) {
        setPasswordSet(true)
        setForm(prev => ({ ...prev, password: '' }))
      }
    } else {
      setSaveMsg({ ok: false, text: result.error })
    }
  }

  const handleTest = async () => {
    if (!testTo) return
    setTestSending(true)
    setTestMsg(null)
    const result = await sendTestEmail(testTo)
    setTestSending(false)
    setTestMsg(result.success
      ? { ok: true,  text: 'Test email sent successfully.' }
      : { ok: false, text: result.error })
  }

  if (loading) return <p style={{ color: 'var(--ghra-muted)', padding: '8px 0' }}>Loading…</p>

  return (
    <div className="settings-panel">
      <form onSubmit={handleSave}>
        <div className="settings-section">
          <h3>SMTP Configuration</h3>
          <p style={{ fontSize: 13, color: 'var(--ghra-muted)', margin: '-4px 0 16px' }}>
            Settings saved here override the <code>EMAIL_*</code> environment variables. The password is encrypted at rest.
          </p>

          <div className="settings-row">
            <div className="form-group">
              <label>SMTP Host *</label>
              <input type="text" className="form-input" value={form.host}
                onChange={e => set('host', e.target.value)} placeholder="smtp.example.com" />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input type="number" className="form-input" value={form.port}
                onChange={e => set('port', e.target.value)} placeholder="587" min="1" max="65535" />
            </div>
          </div>

          <div className="settings-row">
            <div className="form-group">
              <label>Username (SMTP email) *</label>
              <input type="text" className="form-input" value={form.user}
                onChange={e => set('user', e.target.value)} placeholder="you@example.com" autoComplete="off" />
            </div>
            <div className="form-group">
              <label>
                Password&nbsp;
                {passwordSet && !form.password
                  ? <span style={{ fontSize: 12, color: 'var(--ghra-muted)', fontWeight: 400 }}>(already set — leave blank to keep)</span>
                  : '*'
                }
              </label>
              <input type="password" className="form-input" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={passwordSet ? '••••••••' : 'SMTP password'}
                autoComplete="new-password" />
            </div>
          </div>

          <div className="settings-row">
            <div className="form-group">
              <label>From Address</label>
              <input type="text" className="form-input" value={form.fromAddr}
                onChange={e => set('fromAddr', e.target.value)} placeholder="Falls back to username" />
            </div>
            <div className="form-group">
              <label>From Name</label>
              <input type="text" className="form-input" value={form.fromName}
                onChange={e => set('fromName', e.target.value)} placeholder="GHRA Membership" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontWeight: 500 }}>
              <input type="checkbox" checked={form.tls} onChange={e => set('tls', e.target.checked)} />
              Use SSL/TLS (port 465; leave off for STARTTLS on 587)
            </label>
          </div>

          <div className="settings-footer">
            <button type="submit" className="settings-save-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            {saveMsg && (
              <span className={`settings-msg ${saveMsg.ok ? 'settings-msg--success' : 'settings-msg--error'}`}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </div>
      </form>

      <div className="settings-section">
        <h3>Send Test Email</h3>
        <p style={{ fontSize: 13, color: 'var(--ghra-muted)', margin: '-4px 0 16px' }}>
          Sends a test message using the settings currently saved in the database.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <label>Send to</label>
            <input type="email" className="form-input" value={testTo}
              onChange={e => { setTestTo(e.target.value); setTestMsg(null) }}
              onKeyDown={e => e.key === 'Enter' && handleTest()}
              placeholder="recipient@example.com" />
          </div>
          <button
            type="button"
            className="settings-test-button"
            onClick={handleTest}
            disabled={testSending || !testTo.trim()}
            style={{ marginBottom: 0 }}
          >
            {testSending ? 'Sending…' : 'Send Test'}
          </button>
        </div>
        {testMsg && (
          <div className={`settings-msg ${testMsg.ok ? 'settings-msg--success' : 'settings-msg--error'}`} style={{ marginTop: 12 }}>
            {testMsg.text}
          </div>
        )}
      </div>
    </div>
  )
}
