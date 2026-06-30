import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import '../styles/LoginPage.css'

function LoginPage() {
  const { login, signup, error, employeeLogin, isAuthenticated, currentUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    if (currentUser?.mustChangePassword) { navigate('/change-password', { replace: true }); return }
    navigate(currentUser?.role === 'employee' ? '/employee' : '/dashboard', { replace: true })
  }, [isAuthenticated])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setSuccessMessage('')

    if (isEmployee) {
      const result = await employeeLogin(email, password)
      if (result === true) navigate('/employee')
      else setLocalError(result)
    } else if (isSignup) {
      const result = await signup(email, password, confirmPassword)
      if (result === true) {
        setIsSignup(false)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setSuccessMessage('Account created successfully! Please log in.')
      } else {
        setLocalError(result)
      }
    } else {
      const result = await login(email, password)
      if (result?.success) {
        if (result.mustChangePassword) navigate('/change-password')
        else navigate('/dashboard')
      } else {
        setLocalError(result?.error || result || 'Login failed')
      }
    }
  }

  const handleToggleMode = () => {
    setIsSignup(!isSignup)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLocalError('')
    setSuccessMessage('')
  }

  const handleToggleEmployeeMode = () => {
    setIsEmployee(!isEmployee)
    setIsSignup(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLocalError('')
  }

  return (
    <div className="login-container design-1">
      <div className="login-wrapper">
        <div className="login-header">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
            alt="GHRA Logo"
            className="login-logo"
          />
          <h1>GHRA Application Portal</h1>
          <p className="login-subtitle">
            {isEmployee ? 'Employee Login' : 'Welcome Back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}
          {(localError || error) && <div className="error-message">{localError || error}</div>}

          <button type="submit" className="login-button">
            {isEmployee ? 'Sign In as Employee' : 'Sign In'}
          </button>
        </form>

        <div className="employee-login-section">
          <div className="employee-divider">
            <span>or</span>
          </div>
          {isEmployee ? (
            <button type="button" className="employee-toggle-button" onClick={handleToggleEmployeeMode}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="employee-toggle-icon">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to Member Login
            </button>
          ) : (
            <button type="button" className="employee-toggle-button" onClick={handleToggleEmployeeMode}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="employee-toggle-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Employee Portal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
