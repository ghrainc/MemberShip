import { useState } from 'react'
import '../styles/AuthForm.css'

// Dummy data - existing users
const DUMMY_USERS = {
  'john@example.com': 'password123',
  'jane@example.com': 'secure456',
  'member@ghra.com': 'ghra2024'
}

function AuthForm({ onSuccess }) {
  const [isSignup, setIsSignup] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Email validation
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isSignup) {
      // Signup logic
      if (DUMMY_USERS[email]) {
        setError('This email already exists. Please login instead.')
        setIsSignup(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      // Successful signup
      setSuccess('Account created successfully! Proceeding to membership form...')
      setTimeout(() => {
        onSuccess(email)
      }, 1000)
    } else {
      // Login logic
      if (!DUMMY_USERS[email]) {
        setError('Email not found. Please sign up instead.')
        setIsSignup(true)
        return
      }

      if (DUMMY_USERS[email] !== password) {
        setError('Incorrect password')
        return
      }

      // Successful login
      setSuccess('Login successful! Proceeding to membership form...')
      setTimeout(() => {
        onSuccess(email)
      }, 1000)
    }
  }

  const toggleMode = () => {
    setIsSignup(!isSignup)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
            alt="GHRA Logo"
            className="auth-logo"
          />
          <h1 className="ghra-title">GHRA Application Portal</h1>
          <p className="auth-subtitle">
            {isSignup ? 'Create Your Account' : 'Welcome Back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="auth-button">
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="toggle-button"
              onClick={toggleMode}
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="dummy-credentials">
          <details className="credentials-info">
            <summary>Demo Credentials</summary>
            <div className="credentials-list">
              <p><strong>Email:</strong> john@example.com</p>
              <p><strong>Password:</strong> password123</p>
              <p><strong>Or use any new email to sign up</strong></p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
