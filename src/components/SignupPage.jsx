import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import '../styles/AuthForm.css'
import '../styles/SignupPage.css'

const LOGO_URL =
  'https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800'

export default function SignupPage() {
  const { signup } = useContext(AuthContext)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('All fields are required.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const result = await signup(email, password, confirmPassword)
    setLoading(false)

    if (result === true) {
      // AuthContext auto-authenticates the user on signup success.
      // Show a brief success notice then let the router redirect to the dashboard.
      setSuccess(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1800)
    } else {
      setError(typeof result === 'string' ? result : 'Signup failed. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <img src={LOGO_URL} alt="GHRA" className="signup-logo" />
            <h1 className="signup-title">Account Created</h1>
          </div>
          <div className="success-message" role="status">
            Account created — please sign in.
          </div>
          <div className="signup-footer">
            <p>
              <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <img src={LOGO_URL} alt="GHRA" className="signup-logo" />
          <h1 className="signup-title">Create Member Account</h1>
          <p className="signup-subtitle">Join the GHRA cooperative membership program</p>
        </div>

        <form className="signup-form auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>
            <PasswordInput
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm" className="form-label">
              Confirm Password
            </label>
            <PasswordInput
              id="signup-confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="form-input"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </p>
        </div>

        <Link to="/" className="signup-back-link">
          Back to home
        </Link>
      </div>
    </div>
  )
}
