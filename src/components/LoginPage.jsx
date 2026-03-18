import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/LoginPage.css'

function LoginPage({ onDesignSelect }) {
  const { login, signup, error, employeeLogin } = useContext(AuthContext)
  const [isSignup, setIsSignup] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [designMode, setDesignMode] = useState('design1') // 'design1', 'design2'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setSuccessMessage('')

    if (isEmployee) {
      const result = await employeeLogin(email, password)
      if (result === true) onDesignSelect?.('employee')
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
      if (result === true) onDesignSelect?.(designMode)
      else setLocalError(result)
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

  // Design 1: Modern Minimal
  if (designMode === 'design1') {
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
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

  // Design 2: Professional Split
  if (designMode === 'design2') {
    return (
      <div className="login-container design-2">
        <div className="login-content">
          <div className="login-left">
            <div className="brand-section">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
                alt="GHRA Logo"
                className="brand-logo"
              />
              <h2>GHRA</h2>
              <p className="brand-tagline">Greater Houston Retailers Cooperative Association</p>
              <p className="brand-description">
                Building strong partnerships and providing valuable programs for independent convenience store operators.
              </p>
            </div>
          </div>

          <div className="login-right">
            <div className="login-card">
              <h1>{isSignup ? 'Create Account' : 'Welcome'}</h1>
              <p className="card-subtitle">{isSignup ? 'Join GHRA Application Portal' : 'Sign in to your account'}</p>

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
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                {isSignup && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>
                )}

                {successMessage && <div className="success-message">{successMessage}</div>}
            {(localError || error) && <div className="error-message">{localError || error}</div>}

                <button type="submit" className="login-button">
                  {isSignup ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="login-footer">
                <p>
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button" className="toggle-button" onClick={handleToggleMode}>
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>

              <div className="demo-info">
                <p><strong>Demo:</strong> john@example.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default LoginPage
