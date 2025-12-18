import { useState, useContext } from 'react'
import { AuthProvider, AuthContext } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import MembershipForm from './components/MembershipForm'
import ViewApplication from './components/ViewApplication'
import EmployeeDashboard from './components/EmployeeDashboard'
import './App.css'

function AppContent() {
  const { isAuthenticated, currentUser, logout, saveApplication } = useContext(AuthContext)
  const [screen, setScreen] = useState('login') // 'login', 'dashboard', 'form', 'view', 'employee-dashboard', 'employee-view'
  const [selectedAppId, setSelectedAppId] = useState(null)

  const handleLoginSuccess = (designMode) => {
    if (designMode === 'employee') {
      setScreen('employee-dashboard')
    } else {
      setScreen('dashboard')
    }
  }

  const handleNewApplication = () => {
    setScreen('form')
  }

  const handleViewApplication = (appId) => {
    setSelectedAppId(appId)
    if (currentUser?.role === 'employee') {
      setScreen('employee-view')
    } else {
      setScreen('view')
    }
  }

  const handleFormSubmit = (formData) => {
    if (currentUser?.email) {
      saveApplication(currentUser.email, formData)
      setScreen('dashboard')
    }
  }

  const handleBackToDashboard = () => {
    if (currentUser?.role === 'employee') {
      setScreen('employee-dashboard')
    } else {
      setScreen('dashboard')
    }
    setSelectedAppId(null)
  }

  const handleLogout = () => {
    logout()
    setScreen('login')
    setSelectedAppId(null)
  }

  return (
    <div className="app-container">
      {screen === 'login' && <LoginPage onDesignSelect={handleLoginSuccess} />}
      {screen === 'dashboard' && (
        <Dashboard
          onNewApplication={handleNewApplication}
          onViewApplication={handleViewApplication}
          onLogout={handleLogout}
        />
      )}
      {screen === 'form' && (
        <MembershipForm
          userEmail={currentUser?.email}
          onSubmit={handleFormSubmit}
          onCancel={handleBackToDashboard}
        />
      )}
      {screen === 'view' && selectedAppId && (
        <ViewApplication
          applicationId={selectedAppId}
          onBack={handleBackToDashboard}
        />
      )}
      {screen === 'employee-dashboard' && (
        <EmployeeDashboard
          onViewApplication={handleViewApplication}
          onLogout={handleLogout}
        />
      )}
      {screen === 'employee-view' && selectedAppId && (
        <ViewApplication
          applicationId={selectedAppId}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
