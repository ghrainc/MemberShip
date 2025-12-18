import { createContext, useState, useCallback } from 'react'

export const AuthContext = createContext()

// Dummy user credentials for demonstration
const DUMMY_USERS = {
  'john@example.com': 'password123',
  'jane@example.com': 'secure456',
  'demo@ghra.com': 'demo2024'
}

// Dummy employee credentials
const DUMMY_EMPLOYEES = {
  'admin@ghra.com': 'admin123',
  'reviewer@ghra.com': 'reviewer456'
}

// Dummy applications data
const DUMMY_APPLICATIONS = {
  'john@example.com': [
    {
      id: 'app-001',
      storeName: 'Downtown Convenience Store',
      status: 'submitted',
      submittedDate: '2024-01-15',
      storeAddress: '123 Main St, Houston, TX 77001',
      email: 'john@example.com'
    },
    {
      id: 'app-002',
      storeName: 'Midtown Market',
      status: 'submitted',
      submittedDate: '2024-01-20',
      storeAddress: '456 Midtown Ave, Houston, TX 77002',
      email: 'john@example.com'
    }
  ],
  'jane@example.com': [
    {
      id: 'app-003',
      storeName: 'North Houston Retail',
      status: 'submitted',
      submittedDate: '2024-01-18',
      storeAddress: '789 North Blvd, Houston, TX 77003',
      email: 'jane@example.com'
    }
  ]
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState('')

  const login = useCallback((email, password) => {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return false
    }

    if (DUMMY_USERS[email] && DUMMY_USERS[email] === password) {
      setIsAuthenticated(true)
      setCurrentUser({ email, role: 'member' })
      return true
    }

    setError('Invalid email or password')
    return false
  }, [])

  const employeeLogin = useCallback((email, password) => {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return false
    }

    if (DUMMY_EMPLOYEES[email] && DUMMY_EMPLOYEES[email] === password) {
      setIsAuthenticated(true)
      setCurrentUser({ email, role: 'employee' })
      return true
    }

    setError('Invalid email or password')
    return false
  }, [])

  const signup = useCallback((email, password, confirmPassword) => {
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    if (DUMMY_USERS[email]) {
      setError('Email already registered. Please login instead.')
      return false
    }

    // In a real app, this would create a user in the database
    DUMMY_USERS[email] = password
    DUMMY_APPLICATIONS[email] = []

    setIsAuthenticated(true)
    setCurrentUser({ email, role: 'member' })
    return true
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setError('')
  }, [])

  const getUserApplications = useCallback((email) => {
    return DUMMY_APPLICATIONS[email] || []
  }, [])

  const saveApplication = useCallback((email, applicationData) => {
    if (!DUMMY_APPLICATIONS[email]) {
      DUMMY_APPLICATIONS[email] = []
    }

    const newApplication = {
      id: `app-${Date.now()}`,
      storeName: applicationData.storeNameCertification || 'Unnamed Store',
      status: 'submitted',
      submittedDate: new Date().toISOString().split('T')[0],
      storeAddress: applicationData.storeAddressCertification || '',
      email,
      fullData: applicationData
    }

    DUMMY_APPLICATIONS[email].push(newApplication)
    return newApplication
  }, [])

  const getApplicationById = useCallback((email, appId) => {
    const apps = DUMMY_APPLICATIONS[email] || []
    return apps.find(app => app.id === appId)
  }, [])

  const getAllApplications = useCallback(() => {
    const allApps = []
    Object.keys(DUMMY_APPLICATIONS).forEach(email => {
      allApps.push(...DUMMY_APPLICATIONS[email])
    })
    return allApps
  }, [])

  const updateApplicationStatus = useCallback((appId, newStatus, comments = '') => {
    Object.keys(DUMMY_APPLICATIONS).forEach(email => {
      const app = DUMMY_APPLICATIONS[email].find(a => a.id === appId)
      if (app) {
        app.status = newStatus
        app.reviewedAt = new Date().toISOString().split('T')[0]
        app.reviewedBy = currentUser?.email
        app.reviewComments = comments
      }
    })
    return true
  }, [currentUser])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        error,
        login,
        signup,
        employeeLogin,
        logout,
        getUserApplications,
        saveApplication,
        getApplicationById,
        getAllApplications,
        updateApplicationStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
