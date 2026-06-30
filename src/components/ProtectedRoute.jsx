import { useContext } from 'react'
import { Navigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'

function roleDashboard(user) {
  return user?.role === 'employee' ? '/employee' : '/dashboard'
}

// Guards any route that requires authentication and a completed password change.
function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, currentUser } = useContext(AuthContext)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (currentUser?.mustChangePassword) return <Navigate to="/change-password" replace />
  if (requireRole && currentUser?.role !== requireRole) {
    return <Navigate to={roleDashboard(currentUser)} replace />
  }
  return children
}

// Only accessible when mustChangePassword=1. Redirects away after password is set.
export function ChangePasswordRoute({ children }) {
  const { isAuthenticated, currentUser } = useContext(AuthContext)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!currentUser?.mustChangePassword) return <Navigate to={roleDashboard(currentUser)} replace />
  return children
}

// Smart redirect for '/'
export function RootRedirect() {
  const { isAuthenticated, currentUser } = useContext(AuthContext)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (currentUser?.mustChangePassword) return <Navigate to="/change-password" replace />
  return <Navigate to={roleDashboard(currentUser)} replace />
}

export default ProtectedRoute
