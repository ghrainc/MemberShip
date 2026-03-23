import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import '../styles/ChangePasswordPage.css'

function ChangePasswordPage({ onSuccess, onLogout }) {
  const { currentUser, changePassword } = useContext(AuthContext)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || !confirmPassword) {
      setError('Both fields are required')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const result = await changePassword(newPassword)
    setLoading(false)

    if (result === true) {
      onSuccess()
    } else {
      setError(result || 'Failed to change password. Please try again.')
    }
  }

  return (
    <div className="change-password-container">
      <div className="change-password-wrapper">
        <div className="change-password-header">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
            alt="GHRA Logo"
            className="change-password-logo"
          />
          <h1>Set Your Password</h1>
          <p className="change-password-subtitle">
            Your account was created by an employee. You must set a new password before continuing.
          </p>
          <p className="change-password-email">{currentUser?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">New Password *</label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password *</label>
            <PasswordInput
              id="confirmNewPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              className="form-input"
            />
          </div>

          {error && <div className="change-password-error">{error}</div>}

          <button type="submit" className="change-password-button" disabled={loading}>
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>

        <div className="change-password-footer">
          <button type="button" className="logout-link" onClick={onLogout}>
            Logout and sign in with a different account
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPage
