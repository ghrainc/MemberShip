const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

const SENSITIVE_RE = /password|ssn|social|routing|account|transit|secret|api.?key/i

function maskObj(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(maskObj)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_RE.test(k) ? '[redacted]' : (typeof v === 'object' && v !== null ? maskObj(v) : v)
  }
  return out
}

function sessionAgeMinutes() {
  try {
    const t = localStorage.getItem('ghra_token')
    if (!t) return null
    const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return p.iat ? Math.floor((Date.now() / 1000 - p.iat) / 60) : null
  } catch { return null }
}

function storedEmail() {
  try {
    const u = JSON.parse(localStorage.getItem('ghra_user') || 'null')
    return u?.email || null
  } catch { return null }
}

// Fire-and-forget. Never throws. Never blocks the caller.
export function logClientError({ errorType, message, technicalDetail, url, action, applicationId, step }) {
  try {
    const token = localStorage.getItem('ghra_token')
    const body = JSON.stringify({
      errorType: String(errorType || 'unknown').slice(0, 50),
      message: String(message || '').slice(0, 1000),
      technicalDetail: technicalDetail
        ? JSON.stringify(maskObj(technicalDetail)).slice(0, 8000)
        : null,
      url: String(url ?? (typeof location !== 'undefined' ? location.href : '')).slice(0, 500),
      action: action ? String(action).slice(0, 100) : null,
      applicationId: applicationId ? (Number(applicationId) || null) : null,
      step: step ? (Number(step) || null) : null,
      sessionAgeMinutes: sessionAgeMinutes(),
      clientEmail: storedEmail(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
    })
    fetch(`${API_BASE}/api/logs/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    }).catch(() => {})
  } catch {}
}
