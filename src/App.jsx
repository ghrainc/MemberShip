import { useState, useContext } from 'react'
import { AuthProvider, AuthContext } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import MembershipForm from './components/MembershipForm'
import ViewApplication from './components/ViewApplication'
import EmployeeDashboard from './components/EmployeeDashboard'
import ChangePasswordPage from './components/ChangePasswordPage'
import './App.css'

function AppContent() {
  const { isAuthenticated, currentUser, logout, getApplicationById, employeeUpdateApplication } = useContext(AuthContext)
  const [screen, setScreen] = useState('login')
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [draftData, setDraftData] = useState(null) // { applicationId, formData, currentStep }

  const handleLoginSuccess = (designMode) => {
    if (designMode === 'employee') {
      setScreen('employee-dashboard')
    } else if (designMode === 'change-password') {
      setScreen('change-password')
    } else {
      setScreen('dashboard')
    }
  }

  const handleNewApplication = () => {
    setDraftData(null)
    setScreen('form')
  }

  const handleContinueApplication = async (appId) => {
    const app = await getApplicationById(appId)
    if (app) {
      setDraftData({
        applicationId: app.Id,
        formData: app.FormData,
        currentStep: app.CurrentStep || 1
      })
      setScreen('form')
    }
  }

  const handleViewApplication = (appId) => {
    setSelectedAppId(appId)
    if (currentUser?.role === 'employee') {
      setScreen('employee-view')
    } else {
      setScreen('view')
    }
  }

  const handleEditApplication = async (appId) => {
    const app = await getApplicationById(appId)
    if (app) {
      setDraftData({
        applicationId: app.Id,
        formData: app.FormData,
        currentStep: 1
      })
      setScreen('employee-edit')
    }
  }

  const handleFormSubmit = () => {
    setDraftData(null)
    setScreen('dashboard')
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
      {screen === 'change-password' && (
        <ChangePasswordPage
          onSuccess={() => setScreen('dashboard')}
          onLogout={handleLogout}
        />
      )}
      {screen === 'dashboard' && (
        <Dashboard
          onNewApplication={handleNewApplication}
          onViewApplication={handleViewApplication}
          onContinueApplication={handleContinueApplication}
          onLogout={handleLogout}
        />
      )}
      {screen === 'form' && (
        <MembershipForm
          userEmail={currentUser?.email}
          onSubmit={handleFormSubmit}
          onCancel={handleBackToDashboard}
          initialApplicationId={draftData?.applicationId}
          initialFormData={draftData?.formData}
          initialStep={draftData?.currentStep || 1}
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
          onEditApplication={handleEditApplication}
          onLogout={handleLogout}
        />
      )}
      {screen === 'employee-view' && selectedAppId && (
        <ViewApplication
          applicationId={selectedAppId}
          onBack={handleBackToDashboard}
          onEdit={handleEditApplication}
        />
      )}
      {screen === 'employee-edit' && draftData && (
        <MembershipForm
          userEmail={currentUser?.email}
          onSubmit={() => {
            setDraftData(null)
            setScreen('employee-dashboard')
          }}
          onCancel={handleBackToDashboard}
          initialApplicationId={draftData?.applicationId}
          initialFormData={draftData?.formData}
          initialStep={draftData?.currentStep || 1}
          isEmployeeEdit={true}
          onEmployeeSave={employeeUpdateApplication}
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
