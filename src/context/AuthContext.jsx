import { createContext, useState, useCallback } from 'react'

export const AuthContext = createContext()

const API = 'http://localhost:3001/api'

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function authHeadersMultipart(token) {
  return { Authorization: `Bearer ${token}` }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(null)
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
      setToken(data.token)
      setIsAuthenticated(true)
      setCurrentUser({ email: data.email, role: data.role, mustChangePassword: !!data.mustChangePassword })
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
        return msg
      }
      setToken(data.token)
      setIsAuthenticated(true)
      setCurrentUser({ email: data.email, role: data.role })
      return true
    } catch {
      const msg = 'Unable to connect to server'
      setError(msg)
      return msg
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
      setToken(data.token)
      setIsAuthenticated(true)
      setCurrentUser({ email: data.email, role: data.role })
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

  const updateApplicationStatus = useCallback(async (appId, status, notes = '') => {
    if (!token) return false
    try {
      const res = await fetch(`${API}/applications/${appId}/status`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status, notes })
      })
      return res.ok
    } catch {
      return false
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
      // Clear mustChangePassword flag in local state
      setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : prev)
      return true
    } catch {
      return 'Unable to connect to server'
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
      employeeUpdateApplication,
      changePassword,
      createMember,
      uploadDocument,
      removeDocument
    }}>
      {children}
    </AuthContext.Provider>
  )
}
