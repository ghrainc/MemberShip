import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute, { ChangePasswordRoute, RootRedirect } from './components/ProtectedRoute'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import Dashboard from './components/Dashboard'
import EmployeeDashboard from './components/EmployeeDashboard'
import MembershipForm from './components/MembershipForm'
import ViewApplication from './components/ViewApplication'
import ChangePasswordPage from './components/ChangePasswordPage'
import WarehouseApplicationForm from './components/WarehouseApplicationForm'
import WarehouseReview from './components/WarehouseReview'
import FuelsApplicationForm from './components/FuelsApplicationForm'
import FuelsReview from './components/FuelsReview'
import './App.css'

const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/change-password',
    element: <ChangePasswordRoute><ChangePasswordPage /></ChangePasswordRoute>
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute requireRole="member"><Dashboard /></ProtectedRoute>
  },
  {
    path: '/employee',
    element: <ProtectedRoute requireRole="employee"><EmployeeDashboard /></ProtectedRoute>
  },
  // Member wizard — :id is "new" for a fresh application, or an integer ID when continuing
  {
    path: '/application/:id/step/:step',
    element: <ProtectedRoute requireRole="member"><MembershipForm /></ProtectedRoute>
  },
  {
    path: '/application/:id',
    element: <ProtectedRoute requireRole="member"><ViewApplication /></ProtectedRoute>
  },
  {
    path: '/employee/application/:id',
    element: <ProtectedRoute requireRole="employee"><ViewApplication /></ProtectedRoute>
  },
  {
    path: '/employee/application/:id/edit/step/:step',
    element: <ProtectedRoute requireRole="employee"><MembershipForm isEmployeeEdit /></ProtectedRoute>
  },
  {
    path: '/warehouse-application/new',
    element: <ProtectedRoute requireRole="member"><WarehouseApplicationForm /></ProtectedRoute>
  },
  {
    path: '/warehouse-application/:id',
    element: <ProtectedRoute requireRole="member"><WarehouseApplicationForm /></ProtectedRoute>
  },
  {
    path: '/employee/warehouse/:id',
    element: <ProtectedRoute requireRole="employee"><WarehouseReview /></ProtectedRoute>
  },
  {
    path: '/fuels-application/new',
    element: <ProtectedRoute requireRole="member"><FuelsApplicationForm /></ProtectedRoute>
  },
  {
    path: '/fuels-application/:id',
    element: <ProtectedRoute requireRole="member"><FuelsApplicationForm /></ProtectedRoute>
  },
  {
    path: '/employee/fuels/:id',
    element: <ProtectedRoute requireRole="employee"><FuelsReview /></ProtectedRoute>
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
