import { createContext, useState, useCallback } from 'react'

export const AuthContext = createContext()

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
const API = `${API_ORIGIN}/api`

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
      return { success: true, mustChangePassword: !!data.mustChangePassword }
    } catch {
      const msg = 'Unable to connect to server'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

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
      return { success: true, mustChangePassword: !!data.mustChangePassword }
    } catch {
      const msg = 'Unable to connect to server'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

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
    clearAuthFromStorage()
  }, [])

  const saveDraft = useCallback(async (applicationId, currentStep, formData) => {
    if (!token) return null
    try {
      const res = await fetch(`${API}/applications/draft`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationId, currentStep, formData })
      })
      const data = await res.json()
      return data.applicationId || null
    } catch {
      return null
    }
  }, [token])

  const saveApplication = useCallback(async (applicationId, formData) => {
    if (!token) return null
    try {
      const res = await fetch(`${API}/applications/submit`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ applicationId, formData })
      })
      const data = await res.json()
      return data.applicationId || null
    } catch {
      return null
    }
  }, [token])

  const getUserApplications = useCallback(async () => {
    if (!token) return []
    try {
      const res = await fetch(`${API}/applications/my`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch {
      return []
    }
  }, [token])

  const getApplicationById = useCallback(async (id) => {
    if (!token) return null
    try {
      const res = await fetch(`${API}/applications/${id}`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  }, [token])

  const getAllApplications = useCallback(async () => {
    if (!token) return []
    try {
      const res = await fetch(`${API}/applications/all`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch {
      return []
    }
  }, [token])

  // Fetches a document with the auth token and opens it in a new tab as a blob URL.
  const openDocument = useCallback(async (storedUrl) => {
    if (!token || !storedUrl) return
    const url = resolveDocumentUrl(storedUrl)
    if (!url) return
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    } catch {}
  }, [token])

  // Returns a blob URL for the given stored doc URL. Caller must revoke when done.
  const fetchDocumentBlobUrl = useCallback(async (storedUrl) => {
    if (!token || !storedUrl) return null
    const url = resolveDocumentUrl(storedUrl)
    if (!url) return null
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch { return null }
  }, [token])

  // Downloads all uploaded documents for an application as a ZIP file.
  const downloadAllDocuments = useCallback(async (applicationId, storeName) => {
    if (!token) return
    try {
      const res = await fetch(`${API}/documents/${applicationId}/download-all`, {
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
  }, [token])

  const downloadApplicationPackage = useCallback(async (applicationId) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/applications/${applicationId}/package`, {
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
  }, [token])

  const generateAch = useCallback(async (applicationIds) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/ach/generate`, {
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
  }, [token])

  const getAchBatches = useCallback(async () => {
    if (!token) return []
    try {
      const res = await fetch(`${API}/ach/batches`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }, [token])

  const downloadAchBatch = useCallback(async (batchId) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/ach/batches/${batchId}/file`, {
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
  }, [token])

  // Downloads the combined PDF for all files in a document slot.
  const downloadCombinedPdf = useCallback(async (applicationId, slotId) => {
    if (!token) return
    try {
      const res = await fetch(`${API}/documents/${applicationId}/combined/${slotId}`, {
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
  }, [token])

  const removeDocument = useCallback(async (applicationId, docId) => {
    if (!token) return
    try {
      await fetch(`${API}/documents/${applicationId}/${docId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
    } catch {
      // best-effort — ignore errors
    }
  }, [token])

  const uploadDocument = useCallback(async (applicationId, docId, file) => {
    if (!token) throw new Error('Not authenticated')
    const body = new FormData()
    body.append('file', file)
    body.append('applicationId', applicationId)
    body.append('docId', docId)
    const res = await fetch(`${API}/documents/upload`, {
      method: 'POST',
      headers: authHeadersMultipart(token),
      body
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data // { filename, originalName, url }
  }, [token])

  const updateApplicationStatus = useCallback(async (appId, status, notes = '', boardSigners = null) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/applications/${appId}/status`, {
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
  }, [token])

  const updateGhraNumber = useCallback(async (appId, payload) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/applications/${appId}/ghra-number`, {
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
  }, [token])

  const updateBoardSigners = useCallback(async (appId, verification, approved, membershipAdmin) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/applications/${appId}/board-signers`, {
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
  }, [token])

  const getLastBoardSigners = useCallback(async () => {
    if (!token) return null
    try {
      const res = await fetch(`${API}/applications/last-board-signers`, { headers: authHeaders(token) })
      if (!res.ok) return null
      return await res.json()
    } catch { return null }
  }, [token])

  const syncSignatureStatuses = useCallback(async () => {
    if (!token) return
    try {
      await fetch(`${API}/applications/sync-statuses`, {
        method: 'POST',
        headers: authHeaders(token)
      })
    } catch {}
  }, [token])

  const getSignatureStatus = useCallback(async (appId) => {
    if (!token) return null
    try {
      const res = await fetch(`${API}/applications/${appId}/signature-status`, {
        headers: authHeaders(token)
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [token])

  const resendSignature = useCallback(async (appId, target, email = '') => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/applications/${appId}/resend/${target}`, {
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
  }, [token])

  const employeeUpdateApplication = useCallback(async (appId, formData) => {
    if (!token) return false
    try {
      const res = await fetch(`${API}/applications/${appId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ formData })
      })
      return res.ok
    } catch {
      return false
    }
  }, [token])

  const changePassword = useCallback(async (newPassword) => {
    if (!token) return 'Not authenticated'
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Failed to change password'
      setCurrentUser(prev => {
        if (!prev) return prev
        const updated = { ...prev, mustChangePassword: false }
        saveAuthToStorage(token, updated)
        return updated
      })
      return true
    } catch {
      return 'Unable to connect to server'
    }
  }, [token])

  const testDropboxSign = useCallback(async (signerEmail, signerName) => {
    try {
      const res = await fetch(`${API}/test/dropbox-sign`, {
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
  }, [token])

  const createMemberAccount = useCallback(async (email, password, firstName = '', lastName = '') => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees/members`, {
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
  }, [token])

  const resetMemberPassword = useCallback(async (memberId, password) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees/members/${memberId}/reset-password`, {
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
  }, [token])

  const getMembers = useCallback(async () => {
    if (!token) return []
    try {
      const res = await fetch(`${API}/employees/members`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch { return [] }
  }, [token])

  const deleteMember = useCallback(async (id) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees/members/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to delete member' }
      return { success: true }
    } catch { return { success: false, error: 'Unable to connect to server' } }
  }, [token])

  const deleteEmployee = useCallback(async (id) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to delete employee' }
      return { success: true }
    } catch { return { success: false, error: 'Unable to connect to server' } }
  }, [token])

  const getEmployees = useCallback(async () => {
    if (!token) return []
    try {
      const res = await fetch(`${API}/employees`, { headers: authHeaders(token) })
      return res.ok ? await res.json() : []
    } catch {
      return []
    }
  }, [token])

  const createEmployeeAccount = useCallback(async (email, password, firstName, lastName) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees`, {
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
  }, [token])

  const resetEmployeePassword = useCallback(async (employeeId, password) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees/${employeeId}/reset-password`, {
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
  }, [token])

  const updateEmployeeName = useCallback(async (employeeId, firstName, lastName) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/employees/${employeeId}/name`, {
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
  }, [token])

  const createMember = useCallback(async (email, password) => {
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API}/auth/create-member`, {
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
  }, [token])

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      error,
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
      testDropboxSign,
      createMemberAccount,
      resetMemberPassword,
      getMembers,
      deleteMember,
      deleteEmployee,
      getEmployees,
      createEmployeeAccount,
      resetEmployeePassword,
      updateEmployeeName
    }}>
      {children}
    </AuthContext.Provider>
  )
}
