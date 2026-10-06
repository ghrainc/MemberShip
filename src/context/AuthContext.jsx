import { createContext, useState, useCallback, useEffect, useRef } from 'react'
import { logClientError } from '../utils/logClientError'

export const AuthContext = createContext()

const API_ORIGIN =  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
const API = `${API_ORIGIN}/api`
const SESSION_EXPIRED_MSG = 'Your session has expired. Please sign in again — your progress has been saved.'

// Converts a stored document path (/uploads/{appId}/{file}) to the authenticated
// API endpoint URL (/api/documents/{appId}/{file}) on the correct host.
export function resolveDocumentUrl(storedUrl) {
  if (!storedUrl) return null
  if (storedUrl.startsWith('/uploads/')) {
    return `${API_ORIGIN}/api/documents/${storedUrl.slice('/uploads/'.length)}`
  }
  const m = storedUrl.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/)
  if (m) return `${API_ORIGIN}/api/documents/${m[1].slice('/uploads/'.length)}`
  return storedUrl
}

// Decode JWT exp claim without a library. Returns 0 on any failure.
function getTokenExp(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).exp || 0
  } catch { return 0 }
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function authHeadersMultipart(token) {
  return { Authorization: `Bearer ${token}` }
}

function saveAuthToStorage(token, user) {
  localStorage.setItem('ghra_token', token)
  localStorage.setItem('ghra_user', JSON.stringify(user))
}

function clearAuthFromStorage() {
  localStorage.removeItem('ghra_token')
  localStorage.removeItem('ghra_user')
}

function loadUserFromStorage() {
  try { return JSON.parse(localStorage.getItem('ghra_user')) } catch { return null }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('ghra_token'))
  const [currentUser, setCurrentUser] = useState(loadUserFromStorage)
  const [token, setToken] = useState(() => localStorage.getItem('ghra_token'))
  const [error, setError] = useState('')
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('')
  const [sessionWarning, setSessionWarning] = useState(false)

  const warningTimerRef = useRef(null)
  const logoutTimerRef  = useRef(null)
  const forceLogoutRef  = useRef(null)

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null }
    if (logoutTimerRef.current)  { clearTimeout(logoutTimerRef.current);  logoutTimerRef.current  = null }
  }, [])

  // Central handler: call this when any API returns 401.
  const forceLogout = useCallback((msg = SESSION_EXPIRED_MSG) => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setToken(null)
    clearAuthFromStorage()
    clearTimers()
    setSessionWarning(false)
    setSessionExpiredMessage(msg)
  }, [clearTimers])

  // Keep refs current so authFetch can call these without dep-array cycles.
  useEffect(() => { forceLogoutRef.current = forceLogout }, [forceLogout])

  // Replaces fetch() for all authenticated calls.
  // 401 → forceLogout (session expired).
  // 403 "Password change required" → forceLogout with an explanatory message.
  const authFetch = useCallback((url, options) =>
    fetch(url, options).then(async res => {
      if (res.status === 401) {
        logClientError({ errorType: 'auth_failure', message: SESSION_EXPIRED_MSG, action: 'api_call', technicalDetail: { status: 401, endpoint: url } })
        forceLogoutRef.current()
        throw Object.assign(new Error('Session expired'), { status: 401 })
      }
      if (res.status === 403) {
        const body = await res.clone().json().catch(() => ({}))
        if (body.error === 'Password change required') {
          logClientError({ errorType: 'auth_failure', message: 'Password change required', action: 'api_call', technicalDetail: { status: 403, endpoint: url } })
          forceLogoutRef.current('Password change required. Please sign in again.')
          throw Object.assign(new Error('Password change required'), { status: 403 })
        }
      }
      return res
    })
  , []) // stable — only closes over refs, not state

  // Called whenever we have a new token — arms the warning + auto-logout timers.
  const armExpiryTimers = useCallback((tok) => {
    clearTimers()
    setSessionWarning(false)
    const exp = getTokenExp(tok)
    if (!exp) return
    const now    = Math.floor(Date.now() / 1000)
    const ttl    = exp - now          // seconds until expiry
    const warnIn = (ttl - 900) * 1000 // 15 min before (ms)
    const outIn  = ttl * 1000

    if (warnIn > 0) {
      warningTimerRef.current = setTimeout(() => setSessionWarning(true), warnIn)
    }
    if (outIn > 0) {
      logoutTimerRef.current = setTimeout(() => {
        setIsAuthenticated(false)
        setCurrentUser(null)
        setToken(null)
        clearAuthFromStorage()
        clearTimers()
        setSessionWarning(false)
        setSessionExpiredMessage(SESSION_EXPIRED_MSG)
      }, outIn)
    }
  }, [clearTimers])

  // Arm timers on mount if there is already a stored token.
  useEffect(() => {
    const stored = localStorage.getItem('ghra_token')
    if (stored) {
      // If the token is already past expiry, force logout immediately.
      const exp = getTokenExp(stored)
      const now = Math.floor(Date.now() / 1000)
      if (exp && exp <= now) {
        clearAuthFromStorage()
        setIsAuthenticated(false)
        setCurrentUser(null)
        setToken(null)
        setSessionExpiredMessage(SESSION_EXPIRED_MSG)
      } else {
        armExpiryTimers(stored)
      }
    }
    return () => clearTimers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissSessionWarning = useCallback(() => setSessionWarning(false), [])
  const clearSessionExpiredMessage = useCallback(() => setSessionExpiredMessage(''), [])

  const login = useCallback(async (email, password) => {
    setError('')
    if (!email || !password) { setError('Email and password are required'); return { success: false, error: 'Email and password are required' } }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok || data.role !== 'member') {
        const msg = data.error || 'Invalid email or password'
        setError(msg)
        return { success: false, error: msg }
      }
      const user = { email: data.email, role: data.role, mustChangePassword: !!data.mustChangePassword, firstName: data.firstName || '', lastName: data.lastName || '' }
      setToken(data.token)
      setIsAuthenticated(true)
      setCurrentUser(user)
      saveAuthToStorage(data.token, user)
      setSessionExpiredMessage('')
      armExpiryTimers(data.token)
      return { success: true, mustChangePassword: !!data.mustChangePassword }
    } catch {
      const msg = 'Unable to connect to server'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [armExpiryTimers])

  const employeeLogin = useCallback(async (email, password) => {
    setError('')
    if (!email || !password) { setError('Email and password are required'); return 'Email and password are required' }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok || data.role !== 'employee') {
        const msg = data.error || 'Invalid employee credentials'
        setError(msg)
        return { success: false, error: msg }
      }
      const user = { email: data.email, role: data.role, mustChangePassword: !!data.mustChangePassword, firstName: data.firstName || '', lastName: data.lastName || '' }
      setToken(data.token)
      setIsAuthenticated(true)
      setCurrentUser(user)
      saveAuthToStorage(data.token, user)
      setSessionExpiredMessage('')
      armExpiryTimers(data.token)
      return { success: true, mustChangePassword: !!data.mustChangePassword }
    } catch {
      const msg = 'Unable to connect to server'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [armExpiryTimers])

  const signup = useCallback(async (email, password, confirmPassword) => {
    setError('')
    if (!email || !password || !confirmPassword) { setError('All fields are required'); return 'All fields are required' }
    if (password !== confirmPassword) { setError('Passwords do not match'); return 'Passwords do not match' }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return 'Password must be at least 6 characters' }

    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { const msg = data.error || 'Signup failed'; setError(msg); return msg }
      const user = { email: data.email, role: data.role }
      setToken(data.token)
      setIsAuthenticated(true)
      setCurrentUser(user)
      saveAuthToStorage(data.token, user)
      return true
    } catch {
      const msg = 'Unable to connect to server'
      setError(msg)
      return msg
    }
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setToken(null)
    setError('')
    setSessionExpiredMessage('')
    setSessionWarning(false)
    clearAuthFromStorage()
    clearTimers()
  }, [clearTimers])

  // Returns { id: number|null, error: string|null }
  // error is null on 401 (forceLogout already triggered) so the caller shows no additional message.
  const saveDraft = useCallback(async (applicationId, currentStep, formData) => {
    if (!token) return { id: null, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/draft`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationId, currentStep, formData })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        logClientError({ errorType: 'api_failure', message: data.error || `Server error ${res.status}`, action: 'save_draft', technicalDetail: { status: res.status } })
        return { id: null, error: data.error || `Server error ${res.status}` }
      }
      const data = await res.json()
      return { id: data.applicationId || null, error: null }
    } catch (err) {
      if (err.status === 401) return { id: null, error: null }
      logClientError({ errorType: 'api_failure', message: 'Unable to connect to server', action: 'save_draft', technicalDetail: { code: err.code, message: err.message } })
      return { id: null, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const saveApplication = useCallback(async (applicationId, formData) => {
    if (!token) return null
    try {
      const res = await authFetch(`${API}/applications/submit`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationId, formData })
      })
      const data = await res.json()
      return data.applicationId || null
    } catch {
      return null
    }
  }, [token, authFetch])

  const getUserApplications = useCallback(async () => {
    if (!token) return []
    try {
      const res = await authFetch(`${API}/applications/my`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch {
      return []
    }
  }, [token, authFetch])

  const getApplicationById = useCallback(async (id) => {
    if (!token) return null
    try {
      const res = await authFetch(`${API}/applications/${id}`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  }, [token, authFetch])

  const getAllApplications = useCallback(async () => {
    if (!token) return null
    try {
      const res = await authFetch(`${API}/applications/all`, { headers: authHeaders(token) })
      if (res.status === 403) return null
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  }, [token, authFetch])

  // Fetches a document with the auth token and opens it in a new tab as a blob URL.
  const openDocument = useCallback(async (storedUrl) => {
    if (!token || !storedUrl) return
    const url = resolveDocumentUrl(storedUrl)
    if (!url) return
    try {
      const res = await authFetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    } catch {}
  }, [token, authFetch])

  // Returns a blob URL for the given stored doc URL. Caller must revoke when done.
  const fetchDocumentBlobUrl = useCallback(async (storedUrl) => {
    if (!token || !storedUrl) return null
    const url = resolveDocumentUrl(storedUrl)
    if (!url) return null
    try {
      const res = await authFetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch { return null }
  }, [token, authFetch])

  // Downloads all uploaded documents for an application as a ZIP file.
  const downloadAllDocuments = useCallback(async (applicationId, storeName) => {
    if (!token) return
    try {
      const res = await authFetch(`${API}/documents/${applicationId}/download-all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = (storeName || String(applicationId))
        .replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '-').substring(0, 40) || String(applicationId)
      a.download = `documents-${safeName}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {}
  }, [token, authFetch])

  const downloadApplicationPackage = useCallback(async (applicationId) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/${applicationId}/package`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error || `Server error ${res.status}` }
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') || ''
      const match = cd.match(/filename="([^"]+)"/)
      const filename = match ? match[1] : `application-${applicationId}.zip`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      return { success: true }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const generateAch = useCallback(async (applicationIds) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/ach/generate`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationIds })
      })
      if (res.status === 422) {
        const data = await res.json()
        return { success: false, validationErrors: data.validationErrors || [] }
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error || `Server error ${res.status}` }
      }
      const blob = await res.blob()
      const cd   = res.headers.get('Content-Disposition') || ''
      const m    = cd.match(/filename="([^"]+)"/)
      const filename = m ? m[1] : `ghra-ach-${new Date().toISOString().slice(0, 10)}.csv`
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      return { success: true, count: applicationIds.length }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const getAchBatches = useCallback(async () => {
    if (!token) return []
    try {
      const res = await authFetch(`${API}/ach/batches`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }, [token, authFetch])

  const downloadAchBatch = useCallback(async (batchId) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/ach/batches/${batchId}/file`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error || `Server error ${res.status}` }
      }
      const blob = await res.blob()
      const cd   = res.headers.get('Content-Disposition') || ''
      const m    = cd.match(/filename="([^"]+)"/)
      const filename = m ? m[1] : `ghra-ach-batch-${batchId}.csv`
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      return { success: true }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  // Downloads the combined PDF for all files in a document slot.
  const downloadCombinedPdf = useCallback(async (applicationId, slotId) => {
    if (!token) return
    try {
      const res = await authFetch(`${API}/documents/${applicationId}/combined/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slotId}-combined.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {}
  }, [token, authFetch])

  const removeDocument = useCallback(async (applicationId, docId) => {
    if (!token) return
    try {
      await authFetch(`${API}/documents/${applicationId}/${docId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
    } catch {
      // best-effort — ignore errors
    }
  }, [token, authFetch])

  const uploadDocument = useCallback(async (applicationId, docId, file) => {
    if (!token) throw new Error('Not authenticated')
    const body = new FormData()
    body.append('file', file)
    body.append('applicationId', applicationId)
    body.append('docId', docId)
    const res = await authFetch(`${API}/documents/upload`, {
      method: 'POST',
      headers: authHeadersMultipart(token),
      body
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data // { filename, originalName, url }
  }, [token, authFetch])

  const updateApplicationStatus = useCallback(async (appId, status, notes = '', boardSigners = null) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/${appId}/status`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status, notes, boardSigners })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Request failed' }
      return { success: true, ...data }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const updateGhraNumber = useCallback(async (appId, payload) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/${appId}/ghra-number`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [token, authFetch])

  const updateBoardSigners = useCallback(async (appId, verification, approved, membershipAdmin) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/${appId}/board-signers`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ verification, approved, membershipAdmin })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Request failed' }
      return { success: true }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const getLastBoardSigners = useCallback(async () => {
    if (!token) return null
    try {
      const res = await authFetch(`${API}/applications/last-board-signers`, { headers: authHeaders(token) })
      if (!res.ok) return null
      return await res.json()
    } catch { return null }
  }, [token, authFetch])

  const syncSignatureStatuses = useCallback(async () => {
    if (!token) return
    try {
      await authFetch(`${API}/applications/sync-statuses`, {
        method: 'POST',
        headers: authHeaders(token)
      })
    } catch {}
  }, [token, authFetch])

  const getSignatureStatus = useCallback(async (appId) => {
    if (!token) return null
    try {
      const res = await authFetch(`${API}/applications/${appId}/signature-status`, {
        headers: authHeaders(token)
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [token, authFetch])

  const resendSignature = useCallback(async (appId, target, email = '') => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/${appId}/resend/${target}`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Request failed' }
      return { success: true, message: data.message }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const sendReferencesRequest = useCallback(async (appId, reference1Email, reference2Email) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/applications/${appId}/send-references`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ reference1Email, reference2Email })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Request failed' }
      return { success: true, message: data.message }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const getDsEvents = useCallback(async (appId) => {
    if (!token) return { events: [] }
    try {
      const params = appId ? `?applicationId=${encodeURIComponent(appId)}` : ''
      const res = await authFetch(`${API}/ds-events${params}`, { headers: authHeaders(token) })
      if (!res.ok) return { events: [] }
      return await res.json()
    } catch {
      return { events: [] }
    }
  }, [token, authFetch])

  const getAuditLog = useCallback(async (appId) => {
    if (!token) return { entries: [] }
    try {
      const res = await authFetch(`${API}/applications/${appId}/audit`, { headers: authHeaders(token) })
      if (!res.ok) return { entries: [] }
      return await res.json()
    } catch {
      return { entries: [] }
    }
  }, [token, authFetch])

  const employeeUpdateApplication = useCallback(async (appId, formData) => {
    if (!token) return false
    try {
      const res = await authFetch(`${API}/applications/${appId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ formData })
      })
      return res.ok
    } catch {
      return false
    }
  }, [token, authFetch])

  const changePassword = useCallback(async (newPassword) => {
    if (!token) return 'Not authenticated'
    try {
      const res = await authFetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Failed to change password'
      const newToken = data.token || token
      setToken(newToken)
      setCurrentUser(prev => {
        const updated = { ...(prev || {}), mustChangePassword: false }
        saveAuthToStorage(newToken, updated)
        return updated
      })
      armExpiryTimers(newToken)
      return true
    } catch {
      return 'Unable to connect to server'
    }
  }, [token, authFetch, armExpiryTimers])

  const testDropboxSign = useCallback(async (signerEmail, signerName) => {
    try {
      const res = await authFetch(`${API}/test/dropbox-sign`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ signerEmail, signerName })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed' }
      return { success: true, signatureRequestId: data.signatureRequestId }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const createMemberAccount = useCallback(async (email, password, firstName = '', lastName = '') => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees/members`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ email, password, firstName, lastName })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to create member' }
      return { success: true, email: data.email }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const resetMemberPassword = useCallback(async (memberId, password) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees/members/${memberId}/reset-password`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to reset password' }
      return { success: true }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const getMembers = useCallback(async () => {
    if (!token) return []
    try {
      const res = await authFetch(`${API}/employees/members`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch { return [] }
  }, [token, authFetch])

  const deleteMember = useCallback(async (id) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees/members/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to delete member' }
      return { success: true }
    } catch { return { success: false, error: 'Unable to connect to server' } }
  }, [token, authFetch])

  const deleteEmployee = useCallback(async (id) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to delete employee' }
      return { success: true }
    } catch { return { success: false, error: 'Unable to connect to server' } }
  }, [token, authFetch])

  const getEmployees = useCallback(async () => {
    if (!token) return []
    try {
      const res = await authFetch(`${API}/employees`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch {
      return []
    }
  }, [token, authFetch])

  const createEmployeeAccount = useCallback(async (email, password, firstName, lastName) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ email, password, firstName, lastName })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to create employee' }
      return { success: true, email: data.email }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const resetEmployeePassword = useCallback(async (employeeId, password) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees/${employeeId}/reset-password`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to reset password' }
      return { success: true }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const updateEmployeeName = useCallback(async (employeeId, firstName, lastName) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/employees/${employeeId}/name`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ firstName, lastName })
      })
      if (!res.ok) {
        let msg = `Server error ${res.status}`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        return { success: false, error: msg }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err?.message || 'Network error — could not reach server' }
    }
  }, [token, authFetch])

  const archiveApplications = useCallback(async (applicationIds) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await authFetch(`${API}/applications/archive`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationIds }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || `Server error ${res.status}` }
      return { success: true, count: data.count }
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, error: 'Request timed out — please try again' }
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const unarchiveApplications = useCallback(async (applicationIds) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await authFetch(`${API}/applications/unarchive`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationIds }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || `Server error ${res.status}` }
      return { success: true, count: data.count }
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, error: 'Request timed out — please try again' }
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  const getClientErrorLogs = useCallback(async (params = {}) => {
    if (!token) return { entries: [], summary: null }
    try {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== '') qs.set(k, String(v))
      }
      const res = await authFetch(`${API}/logs/client?${qs}`, { headers: authHeaders(token) })
      if (!res.ok) return { entries: [], summary: null }
      return await res.json()
    } catch {
      return { entries: [], summary: null }
    }
  }, [token, authFetch])

  const createMember = useCallback(async (email, password) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await authFetch(`${API}/auth/create-member`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to create member' }
      return { success: true }
    } catch {
      return { success: false, error: 'Unable to connect to server' }
    }
  }, [token, authFetch])

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      error,
      sessionExpiredMessage,
      sessionWarning,
      clearSessionExpiredMessage,
      dismissSessionWarning,
      forceLogout,
      login,
      signup,
      employeeLogin,
      logout,
      saveDraft,
      saveApplication,
      getUserApplications,
      getApplicationById,
      getAllApplications,
      updateApplicationStatus,
      updateGhraNumber,
      updateBoardSigners,
      employeeUpdateApplication,
      getLastBoardSigners,
      syncSignatureStatuses,
      getSignatureStatus,
      resendSignature,
      sendReferencesRequest,
      getDsEvents,
      getAuditLog,
      changePassword,
      createMember,
      uploadDocument,
      removeDocument,
      openDocument,
      fetchDocumentBlobUrl,
      downloadAllDocuments,
      downloadApplicationPackage,
      generateAch,
      getAchBatches,
      downloadAchBatch,
      downloadCombinedPdf,
      archiveApplications,
      unarchiveApplications,
      testDropboxSign,
      createMemberAccount,
      resetMemberPassword,
      getMembers,
      deleteMember,
      deleteEmployee,
      getEmployees,
      createEmployeeAccount,
      resetEmployeePassword,
      updateEmployeeName,
      getClientErrorLogs
    }}>
      {children}
    </AuthContext.Provider>
  )
}
