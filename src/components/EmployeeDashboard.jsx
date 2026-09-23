import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import PasswordStrengthChecklist from './PasswordStrengthChecklist'
import ResendSignatureModal from './ResendSignatureModal'
import BoardSignersModal from './BoardSignersModal'
import { isEmployeePasswordValid } from '../utils/passwordValidation'
import '../styles/EmployeeDashboard.css'

function getBoardVerifyState(app) {
  if (!app.SignatureRequestId)  return 'not_sent'
  if (app.VerificationSignedAt) return 'signed'
  return 'awaiting'
}

function getBoardApproveState(app) {
  if (!app.SignatureRequestId)   return 'not_sent'
  if (app.ApprovedSignedAt)      return 'signed'
  if (!app.VerificationSignedAt) return 'queued'
  return 'awaiting'
}

function getAdminSignState(app) {
  if (!app.SignatureRequestId) return 'not_sent'
  if (!app.AdminSignatureId)   return 'legacy'   // app approved before MembershipAdmin was added
  if (app.AdminSignedAt)       return 'signed'
  return 'awaiting'
}

function getAuthRepState(app) {
  if (!app.SignatureRequestId) return 'not_sent'
  if (app.SignedAt || app.Status === 'signed') return 'signed'
  return 'awaiting'
}

const EMPTY_FILTERS = { storeName: '', submittedDate: '', status: '', email: '', repName: '', achStatus: '' }

function EmployeeDashboard() {
  const {
    currentUser, getAllApplications, syncSignatureStatuses, testDropboxSign, logout,
    createMemberAccount, resetMemberPassword,
    getMembers, deleteMember,
    getEmployees, createEmployeeAccount, resetEmployeePassword, deleteEmployee, updateEmployeeName,
    updateGhraNumber, downloadApplicationPackage, generateAch, getAchBatches, downloadAchBatch
  } = useContext(AuthContext)
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [searchTerms, setSearchTerms] = useState(EMPTY_FILTERS)
  const [sortConfig, setSortConfig] = useState({ key: 'CreatedAt', direction: 'desc' })

  // Resend modal
  const [resendApp, setResendApp] = useState(null)

  // Board signers modal
  const [boardApp, setBoardApp] = useState(null)

  // GHRA # inline editing (applications table)
  const [editingGhraId, setEditingGhraId] = useState(null)
  const [editingGhraValue, setEditingGhraValue] = useState('')
  const [editGhraLoading, setEditGhraLoading] = useState(false)
  const [editGhraError, setEditGhraError] = useState('')

  // ACH export row selection
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Docs download
  const [docsDownloading, setDocsDownloading] = useState(new Set())
  const [achToast, setAchToast] = useState(null)
  const [achValidationErrors, setAchValidationErrors] = useState(null)

  // ACH History tab
  const [achBatches, setAchBatches] = useState([])
  const [achBatchesLoading, setAchBatchesLoading] = useState(false)
  const [achBatchDownloading, setAchBatchDownloading] = useState(null)

  // Dropbox Sign test modal
  const [showDsTest, setShowDsTest] = useState(false)
  const [dsTestEmail, setDsTestEmail] = useState('')
  const [dsTestName, setDsTestName] = useState('')
  const [dsTestLoading, setDsTestLoading] = useState(false)
  const [dsTestResult, setDsTestResult] = useState(null)

  // Create member modal
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberConfirm, setNewMemberConfirm] = useState('')
  const [createMemberError, setCreateMemberError] = useState('')
  const [createMemberSuccess, setCreateMemberSuccess] = useState('')
  const [createMemberLoading, setCreateMemberLoading] = useState(false)

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState(null) // { userId, label, mode: 'member'|'employee' }
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  // Tab navigation
  const [activeTab, setActiveTab] = useState('applications')

  // Members tab
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberSearchEmail, setMemberSearchEmail] = useState('')
  const [memberDeletePending, setMemberDeletePending] = useState(null) // { id, email }
  const [memberDeleteError, setMemberDeleteError] = useState('')

  // Employee Accounts tab
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [employeeDeletePending, setEmployeeDeletePending] = useState(null) // { id, email }
  const [employeeDeleteError, setEmployeeDeleteError] = useState('')

  // Edit employee name (inline)
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editNameLoading, setEditNameLoading] = useState(false)
  const [editNameError, setEditNameError] = useState('')

  // Create employee (in Employee Accounts tab)
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('')
  const [newEmployeeLastName, setNewEmployeeLastName] = useState('')
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeePassword, setNewEmployeePassword] = useState('')
  const [newEmployeeConfirm, setNewEmployeeConfirm] = useState('')
  const [createEmployeeError, setCreateEmployeeError] = useState('')
  const [createEmployeeSuccess, setCreateEmployeeSuccess] = useState('')
  const [createEmployeeLoading, setCreateEmployeeLoading] = useState(false)

  useEffect(() => {
    getAllApplications().then(data => {
      setApplications(data || [])
      setLoading(false)
    })
  }, [])

  const loadMembers = async () => {
    setMembersLoading(true)
    const data = await getMembers()
    setMembers(data || [])
    setMembersLoading(false)
  }

  const loadEmployees = async () => {
    setEmployeesLoading(true)
    const data = await getEmployees()
    setEmployees(data || [])
    setEmployeesLoading(false)
  }

  const loadAchBatches = async () => {
    setAchBatchesLoading(true)
    const data = await getAchBatches()
    setAchBatches(data || [])
    setAchBatchesLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'members')    loadMembers()
    if (activeTab === 'employees')  loadEmployees()
    if (activeTab === 'achHistory') loadAchBatches()
  }, [activeTab])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleRefresh = async () => {
    setRefreshing(true)
    await syncSignatureStatuses()
    const data = await getAllApplications()
    setApplications(data || [])
    setRefreshing(false)
  }

  const handleBoardSaved = async () => {
    const data = await getAllApplications()
    setApplications(data || [])
  }

  const handleSearchChange = (field, value) => setSearchTerms(prev => ({ ...prev, [field]: value }))
  const handleClearFilters = () => setSearchTerms(EMPTY_FILTERS)
  const handleSort = (key) => setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
  }))

  const hasActiveFilters = Object.values(searchTerms).some(v => v !== '')

  const filteredApplications = applications.filter(app => {
    const repFullName = `${app.AuthRepFirstName || ''} ${app.AuthRepLastName || ''}`.trim()
    const dateStr = app.CreatedAt ? app.CreatedAt.slice(0, 10) : ''
    let statusMatch = true
    if (searchTerms.status !== '') {
      if (searchTerms.status === 'verification_signed') statusMatch = getBoardVerifyState(app) === 'signed'
      else if (searchTerms.status === 'board_approved')  statusMatch = getBoardApproveState(app) === 'signed'
      else                                               statusMatch = (app.Status || '') === searchTerms.status
    }
    let achMatch = true
    if (searchTerms.achStatus !== '') {
      achMatch = searchTerms.achStatus === 'generated' ? !!app.AchAuthorizationDate : !app.AchAuthorizationDate
    }
    return (
      (searchTerms.storeName === '' || (app.StoreName || '').toLowerCase().includes(searchTerms.storeName.toLowerCase())) &&
      (searchTerms.submittedDate === '' || dateStr.includes(searchTerms.submittedDate)) &&
      statusMatch &&
      achMatch &&
      (searchTerms.email === '' || (app.UserEmail || '').toLowerCase().includes(searchTerms.email.toLowerCase())) &&
      (searchTerms.repName === '' || repFullName.toLowerCase().includes(searchTerms.repName.toLowerCase()))
    )
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue, bValue
    switch (sortConfig.key) {
      case 'StoreName': aValue = a.StoreName || ''; bValue = b.StoreName || ''; break
      case 'CreatedAt': aValue = new Date(a.CreatedAt); bValue = new Date(b.CreatedAt); break
      case 'Status': aValue = a.Status || ''; bValue = b.Status || ''; break
      case 'UserEmail': aValue = a.UserEmail || ''; bValue = b.UserEmail || ''; break
      case 'repName':
        aValue = `${a.AuthRepFirstName || ''} ${a.AuthRepLastName || ''}`.trim().toLowerCase()
        bValue = `${b.AuthRepFirstName || ''} ${b.AuthRepLastName || ''}`.trim().toLowerCase()
        break
      case 'AchAuthorizationDate':
        aValue = a.AchAuthorizationDate ? new Date(a.AchAuthorizationDate) : new Date(0)
        bValue = b.AchAuthorizationDate ? new Date(b.AchAuthorizationDate) : new Date(0)
        break
      default: return 0
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const APP_STATUS_MAP = {
    submitted:         { label: 'Submitted',          cls: 'status-submitted' },
    approved:          { label: 'Approved',           cls: 'status-approved' },
    pending:           { label: 'Pending Review',     cls: 'status-pending' },
    rejected:          { label: 'Rejected',           cls: 'status-rejected' },
    draft:             { label: 'Draft',              cls: 'status-pending' },
    pending_signature: { label: 'Awaiting Signature', cls: 'status-pending-signature' },
    signed:            { label: 'Signed',             cls: 'status-signed' },
  }

  const getAppStatusBadge = (status) => {
    const info = APP_STATUS_MAP[status] || { label: status, cls: 'status-unknown' }
    return <span className={`status-badge ${info.cls}`}>{info.label}</span>
  }

  const getBoardStatusBadge = (state, signedAt) => {
    if (state === 'not_sent') return <span className="sig-status-badge sig-status-unknown">Not Sent</span>
    if (state === 'queued')   return <span className="sig-status-badge sig-status-queued">Queued</span>
    if (state === 'awaiting') return <span className="sig-status-badge sig-status-waiting">Awaiting</span>
    if (state === 'signed') {
      const dateStr = signedAt ? new Date(signedAt).toLocaleDateString() : ''
      return <span className="sig-status-badge sig-status-signed" title={dateStr ? `Signed ${dateStr}` : undefined}>Signed</span>
    }
    return <span className="sig-status-badge sig-status-unknown">{state}</span>
  }

  const getSigStatusBadge = (statusCode) => {
    if (!statusCode) return <span className="sig-status-badge sig-status-unknown">Not Sent</span>
    if (statusCode === 'signed')             return <span className="sig-status-badge sig-status-signed">Signed</span>
    if (statusCode === 'awaiting_signature') return <span className="sig-status-badge sig-status-waiting">Awaiting</span>
    if (statusCode === 'declined')           return <span className="sig-status-badge sig-status-declined">Declined</span>
    if (statusCode === 'viewed')             return <span className="sig-status-badge sig-status-waiting">Viewed</span>
    return <span className="sig-status-badge sig-status-unknown">{statusCode}</span>
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="sort-icon">⇅</span>
    return <span className={`sort-icon ${sortConfig.direction}`}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  // ── Create member ────────────────────────────────────────────────────────────

  const handleCreateMemberSubmit = async (e) => {
    e.preventDefault()
    setCreateMemberError('')
    setCreateMemberSuccess('')
    if (!newMemberEmail || !newMemberPassword || !newMemberConfirm) {
      setCreateMemberError('All fields are required')
      return
    }
    if (newMemberPassword !== newMemberConfirm) {
      setCreateMemberError('Passwords do not match')
      return
    }
    if (newMemberPassword.length < 6) {
      setCreateMemberError('Password must be at least 6 characters')
      return
    }
    setCreateMemberLoading(true)
    const result = await createMemberAccount(newMemberEmail, newMemberPassword)
    setCreateMemberLoading(false)
    if (result.success) {
      setCreateMemberSuccess(`Member account created for ${result.email}`)
      setNewMemberEmail('')
      setNewMemberPassword('')
      setNewMemberConfirm('')
      loadMembers()
    } else {
      setCreateMemberError(result.error)
    }
  }

  const handleCloseCreateMember = () => {
    setShowCreateMember(false)
    setNewMemberEmail('')
    setNewMemberPassword('')
    setNewMemberConfirm('')
    setCreateMemberError('')
    setCreateMemberSuccess('')
    setCreateMemberLoading(false)
  }

  // ── Reset password ───────────────────────────────────────────────────────────

  const openResetModal = (target, mode) => {
    setResetTarget({ userId: target.Id, label: target.Email, mode })
    setResetPassword('')
    setResetConfirm('')
    setResetError('')
    setResetSuccess('')
    setShowResetModal(true)
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    if (!resetPassword || !resetConfirm) {
      setResetError('Both fields are required')
      return
    }
    if (resetPassword !== resetConfirm) {
      setResetError('Passwords do not match')
      return
    }
    if (resetTarget.mode === 'employee' && !isEmployeePasswordValid(resetPassword)) {
      setResetError('Password does not meet all requirements listed below')
      return
    }
    if (resetTarget.mode !== 'employee' && resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters')
      return
    }
    setResetLoading(true)
    const result = resetTarget.mode === 'employee'
      ? await resetEmployeePassword(resetTarget.userId, resetPassword)
      : await resetMemberPassword(resetTarget.userId, resetPassword)
    setResetLoading(false)
    if (result.success) {
      const role = resetTarget.mode === 'employee' ? 'employee' : 'member'
      setResetSuccess(`Password reset. The ${role} will be prompted to set a new password on next login.`)
      setResetPassword('')
      setResetConfirm('')
      if (resetTarget.mode === 'member') loadMembers()
    } else {
      setResetError(result.error)
    }
  }

  const handleCloseResetModal = () => {
    setShowResetModal(false)
    setResetTarget(null)
    setResetPassword('')
    setResetConfirm('')
    setResetError('')
    setResetSuccess('')
    setResetLoading(false)
  }

  // ── DS test ──────────────────────────────────────────────────────────────────

  const handleDsTestSubmit = async (e) => {
    e.preventDefault()
    if (!dsTestEmail) return
    setDsTestLoading(true)
    setDsTestResult(null)
    const result = await testDropboxSign(dsTestEmail, dsTestName)
    setDsTestResult(result)
    setDsTestLoading(false)
  }

  const handleCloseDsTest = () => {
    setShowDsTest(false)
    setDsTestEmail('')
    setDsTestName('')
    setDsTestResult(null)
  }

  // ── Edit employee name ───────────────────────────────────────────────────────

  const handleEditEmployeeName = (emp) => {
    setEditingEmployeeId(emp.Id)
    setEditFirstName(emp.FirstName || '')
    setEditLastName(emp.LastName || '')
    setEditNameError('')
  }

  const handleCancelEdit = () => {
    setEditingEmployeeId(null)
    setEditFirstName('')
    setEditLastName('')
    setEditNameError('')
  }

  const handleStartGhraEdit = (app) => {
    setEditingGhraId(app.Id)
    setEditingGhraValue(app.GhraNumber || '')
    setEditGhraError('')
  }

  const handleSaveGhraNumber = async (appId) => {
    setEditGhraLoading(true)
    const result = await updateGhraNumber(appId, { ghraNumber: editingGhraValue.trim() || null })
    setEditGhraLoading(false)
    if (result.success) {
      setApplications(prev =>
        prev.map(a => a.Id === appId ? { ...a, GhraNumber: editingGhraValue.trim() || null } : a)
      )
      setEditingGhraId(null)
      setEditGhraError('')
    } else {
      setEditGhraError(result.error || 'Failed to save')
    }
  }

  const handleSaveEmployeeName = async (id) => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      setEditNameError('First and last name are required')
      return
    }
    setEditNameLoading(true)
    const result = await updateEmployeeName(id, editFirstName.trim(), editLastName.trim())
    setEditNameLoading(false)
    if (result.success) {
      setEditingEmployeeId(null)
      setEditNameError('')
      await loadEmployees()
    } else {
      setEditNameError(result.error)
    }
  }

  // ── Delete member ────────────────────────────────────────────────────────────

  const handleDeleteMember = async (id) => {
    const result = await deleteMember(id)
    if (result.success) {
      setMemberDeletePending(null)
      setMemberDeleteError('')
      loadMembers()
    } else {
      setMemberDeleteError(result.error)
      setMemberDeletePending(null)
    }
  }

  // ── Delete employee ──────────────────────────────────────────────────────────

  const handleDeleteEmployee = async (id) => {
    const result = await deleteEmployee(id)
    if (result.success) {
      setEmployeeDeletePending(null)
      setEmployeeDeleteError('')
      await loadEmployees()
    } else {
      setEmployeeDeleteError(result.error)
      setEmployeeDeletePending(null)
    }
  }

  // ── Create employee ──────────────────────────────────────────────────────────

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault()
    setCreateEmployeeError('')
    setCreateEmployeeSuccess('')
    if (!newEmployeeFirstName.trim() || !newEmployeeLastName.trim()) {
      setCreateEmployeeError('First name and last name are required')
      return
    }
    if (!newEmployeeEmail || !newEmployeePassword || !newEmployeeConfirm) {
      setCreateEmployeeError('All fields are required')
      return
    }
    if (newEmployeePassword !== newEmployeeConfirm) {
      setCreateEmployeeError('Passwords do not match')
      return
    }
    if (!isEmployeePasswordValid(newEmployeePassword)) {
      setCreateEmployeeError('Password does not meet all requirements listed below')
      return
    }
    setCreateEmployeeLoading(true)
    const result = await createEmployeeAccount(newEmployeeEmail, newEmployeePassword, newEmployeeFirstName.trim(), newEmployeeLastName.trim())
    setCreateEmployeeLoading(false)
    if (result.success) {
      setCreateEmployeeSuccess(`Employee account created for ${result.email}`)
      setNewEmployeeFirstName('')
      setNewEmployeeLastName('')
      setNewEmployeeEmail('')
      setNewEmployeePassword('')
      setNewEmployeeConfirm('')
      await loadEmployees()
    } else {
      setCreateEmployeeError(result.error)
    }
  }

  const countLabel = hasActiveFilters
    ? `${sortedApplications.length} of ${applications.length} application${applications.length !== 1 ? 's' : ''}`
    : `${applications.length} application${applications.length !== 1 ? 's' : ''}`

  const visibleIds = sortedApplications.map(a => a.Id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => { const next = new Set(prev); visibleIds.forEach(id => next.delete(id)); return next })
    } else {
      setSelectedIds(prev => { const next = new Set(prev); visibleIds.forEach(id => next.add(id)); return next })
    }
  }

  const toggleSelectApp = (id) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const generateAchCsv = async () => {
    if (!selectedIds.size) return
    setAchValidationErrors(null)
    setAchToast(null)
    const ids    = Array.from(selectedIds)
    const result = await generateAch(ids)
    if (result.success) {
      const data = await getAllApplications()
      setApplications(data || [])
      setSelectedIds(new Set())
      setAchToast({ type: 'success', text: `ACH file generated for ${ids.length} application${ids.length !== 1 ? 's' : ''}` })
      setTimeout(() => setAchToast(null), 6000)
    } else if (result.validationErrors) {
      setAchValidationErrors(result.validationErrors)
    } else {
      setAchToast({ type: 'error', text: result.error || 'ACH generation failed' })
      setTimeout(() => setAchToast(null), 6000)
    }
  }

  return (
    <div className="employee-dashboard-container">
      <header className="employee-dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
              alt="GHRA Logo"
              className="dashboard-logo"
            />
            <div className="header-info">
              <h1>Applications Review</h1>
              <p>Review and approve membership applications</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <button className="create-member-button" onClick={() => setShowDsTest(true)} style={{ background: '#6c757d' }}>
                Test Dropbox Sign
              </button>
              <span className="user-role">Employee: {currentUser?.email}</span>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-button${activeTab === 'applications' ? ' tab-button--active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          All Applications
        </button>
        <button
          className={`tab-button${activeTab === 'members' ? ' tab-button--active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
        <button
          className={`tab-button${activeTab === 'employees' ? ' tab-button--active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Employee Accounts
        </button>
        <button
          className={`tab-button${activeTab === 'achHistory' ? ' tab-button--active' : ''}`}
          onClick={() => setActiveTab('achHistory')}
        >
          ACH History
        </button>
      </nav>

      <main className="employee-dashboard-main">
        <div className="dashboard-content">

          {/* ── All Applications tab ──────────────────────────────────────── */}
          {activeTab === 'applications' && <>
          <div className="content-header">
            <h2>All Applications</h2>
            <div className="content-header-right">
              <p className="application-count">
                {loading ? 'Loading...' : countLabel}
              </p>
              {selectedIds.size > 0 && (
                <button className="ach-export-button" onClick={generateAchCsv}>
                  Download ACH File ({selectedIds.size})
                </button>
              )}
              {achToast && (
                <span style={{
                  padding: '4px 12px', borderRadius: 4, fontSize: 13, fontWeight: 500,
                  background: achToast.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: achToast.type === 'success' ? '#155724' : '#721c24',
                  border: `1px solid ${achToast.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                }}>
                  {achToast.text}
                </span>
              )}
              {achValidationErrors && (
                <div style={{
                  background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6,
                  padding: '10px 14px', fontSize: 13, maxWidth: 520, lineHeight: 1.5,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <strong style={{ color: '#856404' }}>ACH generation failed — fix these issues first:</strong>
                    <button onClick={() => setAchValidationErrors(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: '#856404', padding: '0 0 0 8px' }}>✕</button>
                  </div>
                  {achValidationErrors.map(ve => (
                    <div key={ve.id} style={{ marginBottom: 6 }}>
                      <strong>{ve.storeName || `Application #${ve.id}`}:</strong>
                      <ul style={{ margin: '2px 0 0 16px', padding: 0 }}>
                        {ve.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {hasActiveFilters && (
                <button className="clear-filters-button" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              )}
              <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading applications...</p></div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Applications</h3>
              <p>There are no applications to review at this time.</p>
            </div>
          ) : (
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th className="select-col">
                      <input
                        type="checkbox"
                        className="ach-checkbox"
                        checked={allVisibleSelected}
                        ref={el => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected }}
                        onChange={toggleSelectAll}
                        title="Select all visible"
                      />
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input type="text" placeholder="Search store..." value={searchTerms.storeName}
                            onChange={(e) => handleSearchChange('storeName', e.target.value)} />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('StoreName')}><SortIcon column="StoreName" /></button>
                      </div>
                      <span className="th-label">Store Name</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input type="text" placeholder="Search email..." value={searchTerms.email}
                            onChange={(e) => handleSearchChange('email', e.target.value)} />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('UserEmail')}><SortIcon column="UserEmail" /></button>
                      </div>
                      <span className="th-label">Member Email</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input type="text" placeholder="Search rep..." value={searchTerms.repName}
                            onChange={(e) => handleSearchChange('repName', e.target.value)} />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('repName')}><SortIcon column="repName" /></button>
                      </div>
                      <span className="th-label">Rep Name</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input type="date" value={searchTerms.submittedDate}
                            onChange={(e) => handleSearchChange('submittedDate', e.target.value)} />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('CreatedAt')}><SortIcon column="CreatedAt" /></button>
                      </div>
                      <span className="th-label">Date</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <select value={searchTerms.status} onChange={(e) => handleSearchChange('status', e.target.value)} className="filter-select">
                          <option value="">All Status</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="pending">Pending</option>
                          <option value="draft">Draft</option>
                          <option value="pending_signature">Awaiting Signature</option>
                          <option value="signed">Signed by Member</option>
                          <option value="verification_signed">Verification Signed</option>
                          <option value="board_approved">Board Approved</option>
                        </select>
                        <button className="sort-button" onClick={() => handleSort('Status')}><SortIcon column="Status" /></button>
                      </div>
                      <span className="th-label">Status</span>
                    </th>
                    <th className="ach-date-column">
                      <div className="table-header">
                        <select value={searchTerms.achStatus} onChange={e => handleSearchChange('achStatus', e.target.value)} className="filter-select">
                          <option value="">All</option>
                          <option value="not_generated">ACH not generated</option>
                          <option value="generated">ACH generated</option>
                        </select>
                        <button className="sort-button" onClick={() => handleSort('AchAuthorizationDate')}><SortIcon column="AchAuthorizationDate" /></button>
                      </div>
                      <span className="th-label">ACH Date</span>
                    </th>
                    <th className="ghra-number-column">
                      <span className="th-label">GHRA #</span>
                    </th>
                    <th className="action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-filter-row">
                        No applications match the current filters.{' '}
                        <button className="clear-filters-inline" onClick={handleClearFilters}>Clear Filters</button>
                      </td>
                    </tr>
                  ) : (
                    sortedApplications.map((app) => {
                      const repFullName = `${app.AuthRepFirstName || ''} ${app.AuthRepLastName || ''}`.trim()
                      return (
                        <tr key={app.Id} className={selectedIds.has(app.Id) ? 'row-selected' : ''}>
                          <td className="select-col">
                            <input
                              type="checkbox"
                              className="ach-checkbox"
                              checked={selectedIds.has(app.Id)}
                              onChange={() => toggleSelectApp(app.Id)}
                            />
                          </td>
                          <td>{app.StoreName || '—'}</td>
                          <td className="email-cell">{app.UserEmail}</td>
                          <td>{repFullName || 'Not provided'}</td>
                          <td>{formatDate(app.CreatedAt)}</td>
                          <td>
                            <div className="sig-status-cell">
                              {(!app.SignatureRequestId || (app.Status !== 'pending_signature' && app.Status !== 'signed')) && (
                                <div className="sig-status-row">
                                  <span className="sig-status-label">Status</span>
                                  {getAppStatusBadge(app.Status)}
                                </div>
                              )}
                              {app.SignatureRequestId && (
                                <>
                                  <div className="sig-group">
                                    <span className="sig-group-label">App</span>
                                    <div className="sig-status-row sig-status-row-sub">
                                      <span className="sig-status-label">Auth Rep</span>
                                      {getBoardStatusBadge(getAuthRepState(app), app.SignedAt)}
                                    </div>
                                    <div className="sig-status-row sig-status-row-sub">
                                      <span className="sig-status-label">Verify</span>
                                      {getBoardStatusBadge(getBoardVerifyState(app), app.VerificationSignedAt)}
                                    </div>
                                    <div className="sig-status-row sig-status-row-sub">
                                      <span className="sig-status-label">Approve</span>
                                      {getBoardStatusBadge(getBoardApproveState(app), app.ApprovedSignedAt)}
                                    </div>
                                    <div className="sig-status-row sig-status-row-sub">
                                      <span className="sig-status-label">MemAdmin</span>
                                      {getAdminSignState(app) === 'legacy'
                                        ? <span className="sig-status-badge sig-status-na" title="Sent before the Membership Admin signer was added">N/A</span>
                                        : getBoardStatusBadge(getAdminSignState(app), app.AdminSignedAt)
                                      }
                                    </div>
                                  </div>
                                  <div className="sig-group">
                                    <span className="sig-group-label">Ref</span>
                                    <div className="sig-status-row sig-status-row-sub">
                                      <span className="sig-status-label">Ref 1</span>
                                      {getSigStatusBadge(app.Ref1SignatureStatus)}
                                    </div>
                                    <div className="sig-status-row sig-status-row-sub">
                                      <span className="sig-status-label">Ref 2</span>
                                      {getSigStatusBadge(app.Ref2SignatureStatus)}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="ach-date-column">
                            {app.AchAuthorizationDate
                              ? new Date(app.AchAuthorizationDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="ghra-number-cell">
                            {editingGhraId === app.Id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    value={editingGhraValue}
                                    onChange={e => setEditingGhraValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveGhraNumber(app.Id); if (e.key === 'Escape') setEditingGhraId(null) }}
                                    placeholder="e.g. 12345"
                                    maxLength={50}
                                    autoFocus
                                    style={{ width: 80, padding: '3px 6px', fontSize: 12, border: '1px solid #ced4da', borderRadius: 4 }}
                                  />
                                  <button className="reset-pwd-button" onClick={() => handleSaveGhraNumber(app.Id)} disabled={editGhraLoading} style={{ fontSize: 11, padding: '3px 8px' }}>
                                    {editGhraLoading ? '…' : '✓'}
                                  </button>
                                  <button className="delete-button" onClick={() => setEditingGhraId(null)} disabled={editGhraLoading} style={{ background: '#6c757d', fontSize: 11, padding: '3px 8px' }}>
                                    ✕
                                  </button>
                                </div>
                                {editGhraError && <span style={{ color: '#e74c3c', fontSize: 11 }}>{editGhraError}</span>}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: app.GhraNumber ? 600 : 400, color: app.GhraNumber ? '#2c3e50' : '#aaa' }}>
                                  {app.GhraNumber || '—'}
                                </span>
                                <button
                                  className="edit-button"
                                  onClick={() => handleStartGhraEdit(app)}
                                  style={{ fontSize: 11, padding: '2px 7px' }}
                                  title={app.GhraNumber ? 'Edit GHRA #' : 'Assign GHRA #'}
                                >
                                  {app.GhraNumber ? '✎' : '+'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="action-cell action-cell--column">
                            <button className="view-button" onClick={() => navigate(`/employee/application/${app.Id}`)}>
                              View
                            </button>
                            <button className="edit-button" onClick={() => navigate(`/employee/application/${app.Id}/edit/step/1`)}>
                              Edit
                            </button>
                            {['pending_signature', 'signed', 'approved'].includes(app.Status) && (
                              <button className="resend-action-button" onClick={() => setResendApp({ Id: app.Id, UserEmail: app.UserEmail })}>
                                Resend
                              </button>
                            )}
                            {app.SignatureRequestId && (
                              <button className="board-action-button" onClick={() => setBoardApp(app)}>
                                Board
                              </button>
                            )}
                            {app.Status !== 'draft' && (
                              <button
                                className="board-action-button"
                                style={{ background: '#17a2b8', opacity: docsDownloading.has(app.Id) ? 0.6 : 1 }}
                                disabled={docsDownloading.has(app.Id)}
                                onClick={async () => {
                                  setDocsDownloading(prev => new Set([...prev, app.Id]))
                                  const result = await downloadApplicationPackage(app.Id)
                                  setDocsDownloading(prev => { const n = new Set(prev); n.delete(app.Id); return n })
                                  if (!result.success) setAchToast({ type: 'error', text: `Download failed: ${result.error}` })
                                }}
                                title="Download application package"
                              >
                                {docsDownloading.has(app.Id) ? '…' : 'Docs'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          </>}

          {/* ── Members tab ───────────────────────────────────────────────── */}
          {activeTab === 'members' && <>
          <div className="content-header">
            <h2>Member Accounts</h2>
            <div className="content-header-right">
              <p className="application-count">
                {membersLoading ? 'Loading...' : `${members.filter(m => !memberSearchEmail || m.Email.toLowerCase().includes(memberSearchEmail.toLowerCase())).length} of ${members.length} member${members.length !== 1 ? 's' : ''}`}
              </p>
              <button className="create-member-button" onClick={() => setShowCreateMember(true)}>
                + Create Member Login
              </button>
              <button className="refresh-button" onClick={loadMembers} disabled={membersLoading}>
                {membersLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="members-search">
            <input
              type="text"
              placeholder="Search by email..."
              value={memberSearchEmail}
              onChange={(e) => setMemberSearchEmail(e.target.value)}
            />
          </div>

          {memberDeleteError && (
            <div className="member-delete-error">{memberDeleteError} <button style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 600 }} onClick={() => setMemberDeleteError('')}>✕</button></div>
          )}

          {membersLoading ? (
            <div className="empty-state"><p>Loading members...</p></div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>No Member Accounts</h3>
              <p>No member accounts have been created yet.</p>
            </div>
          ) : (
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th><span className="th-label">Email</span></th>
                    <th><span className="th-label">Store / Business Name</span></th>
                    <th><span className="th-label">Status</span></th>
                    <th><span className="th-label">Created</span></th>
                    <th className="action-column"><span className="th-label">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .filter(m => !memberSearchEmail || m.Email.toLowerCase().includes(memberSearchEmail.toLowerCase()))
                    .map(m => (
                      <tr key={m.Id}>
                        <td className="email-cell">{m.Email}</td>
                        <td>{m.StoreName || <span style={{ color: '#aaa' }}>—</span>}</td>
                        <td>
                          {m.MustChangePassword
                            ? <span className="status-badge status-must-reset">Must Reset</span>
                            : <span className="status-badge status-active">Active</span>
                          }
                        </td>
                        <td>{formatDate(m.CreatedAt)}</td>
                        <td className="action-cell">
                          <button className="reset-pwd-button" onClick={() => openResetModal(m, 'member')}>
                            Reset PWD
                          </button>
                          {m.ApplicationCount > 0 ? (
                            <button className="delete-button" disabled title={`Has ${m.ApplicationCount} application${m.ApplicationCount !== 1 ? 's' : ''} — cannot delete`}>
                              Delete
                            </button>
                          ) : memberDeletePending?.id === m.Id ? (
                            <span className="delete-confirm-inline">
                              <span>Delete?</span>
                              <button className="delete-confirm-yes" onClick={() => handleDeleteMember(m.Id)}>Yes</button>
                              <button className="delete-confirm-cancel" onClick={() => setMemberDeletePending(null)}>Cancel</button>
                            </span>
                          ) : (
                            <button className="delete-button" onClick={() => setMemberDeletePending({ id: m.Id, email: m.Email })}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
          </>}

          {/* ── Employee Accounts tab ─────────────────────────────────────── */}
          {activeTab === 'employees' && <>
          <div className="content-header">
            <h2>Employee Accounts</h2>
            <div className="content-header-right">
              <p className="application-count">
                {employeesLoading ? 'Loading...' : `${employees.length} employee${employees.length !== 1 ? 's' : ''}`}
              </p>
              <button className="refresh-button" onClick={loadEmployees} disabled={employeesLoading}>
                {employeesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {employeeDeleteError && (
            <div className="member-delete-error">
              {employeeDeleteError}
              <button style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 600 }} onClick={() => setEmployeeDeleteError('')}>✕</button>
            </div>
          )}
          {editNameError && (
            <div className="member-delete-error">
              {editNameError}
              <button style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 600 }} onClick={() => setEditNameError('')}>✕</button>
            </div>
          )}

          {employeesLoading ? (
            <div className="empty-state"><p>Loading employees...</p></div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>No Employee Accounts</h3>
              <p>No employee accounts found.</p>
            </div>
          ) : (
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th><span className="th-label">Name</span></th>
                    <th><span className="th-label">Email</span></th>
                    <th><span className="th-label">Created</span></th>
                    <th className="action-column"><span className="th-label">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const isAdmin = emp.Email.toLowerCase() === 'admin@ghraonline.com'
                    const isSelf = emp.Email.toLowerCase() === currentUser?.email?.toLowerCase()
                    const isEditing = editingEmployeeId === emp.Id
                    const displayName = [emp.FirstName, emp.LastName].filter(Boolean).join(' ')
                    return (
                      <tr key={emp.Id}>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="text"
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                                placeholder="First name"
                                style={{ width: 100, padding: '3px 6px', fontSize: 13, border: '1px solid #ced4da', borderRadius: 4 }}
                                maxLength={100}
                              />
                              <input
                                type="text"
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                                placeholder="Last name"
                                style={{ width: 100, padding: '3px 6px', fontSize: 13, border: '1px solid #ced4da', borderRadius: 4 }}
                                maxLength={100}
                              />
                              <button className="reset-pwd-button" onClick={() => handleSaveEmployeeName(emp.Id)} disabled={editNameLoading}>
                                {editNameLoading ? '...' : 'Save'}
                              </button>
                              <button className="delete-button" onClick={handleCancelEdit} disabled={editNameLoading} style={{ background: '#6c757d' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span>
                              {displayName || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No name set</span>}
                              {isAdmin && <span style={{ marginLeft: 6, fontSize: 11, background: '#ffc107', color: '#333', borderRadius: 3, padding: '1px 5px' }}>protected</span>}
                              {isSelf && !isAdmin && <span style={{ marginLeft: 6, fontSize: 11, background: '#cce5ff', color: '#004085', borderRadius: 3, padding: '1px 5px' }}>you</span>}
                            </span>
                          )}
                        </td>
                        <td className="email-cell">{emp.Email}</td>
                        <td>{formatDate(emp.CreatedAt)}</td>
                        <td className="action-cell">
                          {!isEditing && (
                            <button className="reset-pwd-button" style={{ background: '#6c757d' }} onClick={() => handleEditEmployeeName(emp)}>
                              Edit Name
                            </button>
                          )}
                          {!isAdmin && !isEditing && (
                            <button className="reset-pwd-button" onClick={() => openResetModal(emp, 'employee')}>
                              Reset PWD
                            </button>
                          )}
                          {!isAdmin && !isSelf && !isEditing && (
                            employeeDeletePending?.id === emp.Id ? (
                              <span className="delete-confirm-inline">
                                <span>Delete?</span>
                                <button className="delete-confirm-yes" onClick={() => handleDeleteEmployee(emp.Id)}>Yes</button>
                                <button className="delete-confirm-cancel" onClick={() => setEmployeeDeletePending(null)}>Cancel</button>
                              </span>
                            ) : (
                              <button className="delete-button" onClick={() => setEmployeeDeletePending({ id: emp.Id, email: emp.Email })}>
                                Delete
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ borderTop: '1px solid #dee2e6', margin: '24px 0 16px' }} />

          <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 12px', color: '#343a40' }}>Create New Employee</p>
          <form onSubmit={handleCreateEmployeeSubmit} style={{ maxWidth: 540 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" value={newEmployeeFirstName} onChange={(e) => setNewEmployeeFirstName(e.target.value)}
                  className="form-input" placeholder="First Name" maxLength={100} />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" value={newEmployeeLastName} onChange={(e) => setNewEmployeeLastName(e.target.value)}
                  className="form-input" placeholder="Last Name" maxLength={100} />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" value={newEmployeeEmail} onChange={(e) => setNewEmployeeEmail(e.target.value)}
                className="form-input" placeholder="employee@example.com" maxLength={100} />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <PasswordInput value={newEmployeePassword} onChange={(e) => setNewEmployeePassword(e.target.value)}
                className="form-input" placeholder="Min 8 characters" />
              <PasswordStrengthChecklist password={newEmployeePassword} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <PasswordInput value={newEmployeeConfirm} onChange={(e) => setNewEmployeeConfirm(e.target.value)}
                className="form-input" placeholder="Repeat password" />
            </div>
            <p style={{ fontSize: 12, color: '#7f8c8d', margin: '0 0 8px' }}>
              Employee will be required to change this password on first login.
            </p>
            {createEmployeeError && <div className="modal-error">{createEmployeeError}</div>}
            {createEmployeeSuccess && <div className="modal-success">{createEmployeeSuccess}</div>}
            <div className="modal-actions">
              <button type="submit" className="modal-submit-button" disabled={createEmployeeLoading}>
                {createEmployeeLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
          </>}

          {/* ── ACH History tab ───────────────────────────────────────────── */}
          {activeTab === 'achHistory' && <>
          <div className="content-header">
            <h2>ACH History</h2>
            <div className="content-header-right">
              <button className="refresh-button" onClick={loadAchBatches} disabled={achBatchesLoading}>
                {achBatchesLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {achBatchesLoading ? (
            <p style={{ color: '#6c757d', padding: '20px 0' }}>Loading…</p>
          ) : achBatches.length === 0 ? (
            <p style={{ color: '#6c757d', padding: '20px 0' }}>No ACH batches have been generated yet.</p>
          ) : (
            <div className="table-container">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Date Generated</th>
                    <th>Generated By</th>
                    <th style={{ textAlign: 'center' }}>Applications</th>
                    <th style={{ textAlign: 'center' }}>File</th>
                  </tr>
                </thead>
                <tbody>
                  {achBatches.map(batch => (
                    <tr key={batch.Id}>
                      <td>{new Date(batch.GeneratedAt).toLocaleString()}</td>
                      <td>{batch.GeneratedBy}</td>
                      <td style={{ textAlign: 'center' }}>{batch.AppCount}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="resend-button"
                          disabled={achBatchDownloading === batch.Id}
                          onClick={async () => {
                            setAchBatchDownloading(batch.Id)
                            await downloadAchBatch(batch.Id)
                            setAchBatchDownloading(null)
                          }}
                        >
                          {achBatchDownloading === batch.Id ? 'Downloading…' : 'Download CSV'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </>}

        </div>
      </main>

      <footer className="employee-dashboard-footer">
        <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>

      {/* ── Dropbox Sign test modal ──────────────────────────────────────── */}
      {showDsTest && (
        <div className="modal-overlay" onClick={handleCloseDsTest}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Test Dropbox Sign</h3>
              <button className="modal-close" onClick={handleCloseDsTest}>✕</button>
            </div>
            <form onSubmit={handleDsTestSubmit} className="modal-form">
              <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                Sends a dummy signature request using the configured template and API key.
              </p>
              <div className="form-group">
                <label>Signer Email *</label>
                <input type="email" value={dsTestEmail} onChange={(e) => setDsTestEmail(e.target.value)}
                  className="form-input" placeholder="signer@example.com" required />
              </div>
              <div className="form-group">
                <label>Signer Name (optional)</label>
                <input type="text" value={dsTestName} onChange={(e) => setDsTestName(e.target.value)}
                  className="form-input" placeholder="John Doe" />
              </div>
              {dsTestResult?.success && (
                <div className="modal-success">
                  Sent! ID: <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{dsTestResult.signatureRequestId}</code>
                </div>
              )}
              {dsTestResult && !dsTestResult.success && (
                <div className="modal-error">Error: {dsTestResult.error}</div>
              )}
              <div className="modal-actions">
                <button type="submit" className="modal-submit-button" disabled={dsTestLoading || !dsTestEmail}>
                  {dsTestLoading ? 'Sending...' : 'Send Test Request'}
                </button>
                <button type="button" className="modal-cancel-button" onClick={handleCloseDsTest}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Resend signature modal ───────────────────────────────────────── */}
      {resendApp && (
        <ResendSignatureModal
          appId={resendApp.Id}
          userEmail={resendApp.UserEmail}
          onClose={() => setResendApp(null)}
        />
      )}

      {/* ── Board signers modal ──────────────────────────────────────────── */}
      {boardApp && (
        <BoardSignersModal
          app={boardApp}
          onClose={() => setBoardApp(null)}
          onSaved={handleBoardSaved}
        />
      )}

      {/* ── Create member modal ──────────────────────────────────────────── */}
      {showCreateMember && (
        <div className="modal-overlay" onClick={handleCloseCreateMember}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Member Login</h3>
              <button className="modal-close" onClick={handleCloseCreateMember}>✕</button>
            </div>
            <form onSubmit={handleCreateMemberSubmit} className="modal-form">
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="form-input" placeholder="member@example.com" maxLength={100} />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <PasswordInput value={newMemberPassword} onChange={(e) => setNewMemberPassword(e.target.value)}
                  className="form-input" placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <PasswordInput value={newMemberConfirm} onChange={(e) => setNewMemberConfirm(e.target.value)}
                  className="form-input" placeholder="Repeat password" />
              </div>
              <p style={{ fontSize: 12, color: '#7f8c8d', margin: 0 }}>
                The member will be required to change this password on first login.
              </p>
              {createMemberError && <div className="modal-error">{createMemberError}</div>}
              {createMemberSuccess && <div className="modal-success">{createMemberSuccess}</div>}
              <div className="modal-actions">
                <button type="submit" className="modal-submit-button" disabled={createMemberLoading}>
                  {createMemberLoading ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" className="modal-cancel-button" onClick={handleCloseCreateMember}>
                  {createMemberSuccess ? 'Close' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset password modal ─────────────────────────────────────────── */}
      {showResetModal && resetTarget && (
        <div className="modal-overlay" onClick={handleCloseResetModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset {resetTarget.mode === 'employee' ? 'Employee' : 'Member'} Password</h3>
              <button className="modal-close" onClick={handleCloseResetModal}>✕</button>
            </div>
            <form onSubmit={handleResetSubmit} className="modal-form">
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                Setting a new password for <strong>{resetTarget.label}</strong>.
                The {resetTarget.mode === 'employee' ? 'employee' : 'member'} will be required to change it on next login.
              </p>
              <div className="form-group">
                <label>New Password *</label>
                <PasswordInput value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                  className="form-input"
                  placeholder={resetTarget.mode === 'employee' ? 'Min 8 characters' : 'Min 6 characters'} />
                {resetTarget.mode === 'employee' && (
                  <PasswordStrengthChecklist password={resetPassword} />
                )}
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <PasswordInput value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)}
                  className="form-input" placeholder="Repeat password" />
              </div>
              {resetError && <div className="modal-error">{resetError}</div>}
              {resetSuccess && <div className="modal-success">{resetSuccess}</div>}
              <div className="modal-actions">
                {!resetSuccess && (
                  <button type="submit" className="modal-submit-button" disabled={resetLoading}>
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                )}
                <button type="button" className="modal-cancel-button" onClick={handleCloseResetModal}>
                  {resetSuccess ? 'Close' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeDashboard
