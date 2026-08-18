import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import ResendSignatureModal from './ResendSignatureModal'
import BoardSignersModal from './BoardSignersModal'
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

const EMPTY_FILTERS = { storeName: '', submittedDate: '', status: '', email: '', repName: '' }

function EmployeeDashboard() {
  const {
    currentUser, getAllApplications, syncSignatureStatuses, testDropboxSign, logout,
    createMemberAccount, resetMemberPassword,
    getMembers, deleteMember,
    getEmployees, createEmployeeAccount, resetEmployeePassword, deleteEmployee
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

  // Employee delete (in Employee Accounts modal)
  const [employeeDeletePending, setEmployeeDeletePending] = useState(null) // { id, email }
  const [employeeDeleteError, setEmployeeDeleteError] = useState('')

  // Employee accounts
  const [showEmployeeAccounts, setShowEmployeeAccounts] = useState(false)
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)

  // Create employee (embedded in Employee Accounts modal)
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

  useEffect(() => {
    if (activeTab === 'members') loadMembers()
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
    return (
      (searchTerms.storeName === '' || (app.StoreName || '').toLowerCase().includes(searchTerms.storeName.toLowerCase())) &&
      (searchTerms.submittedDate === '' || dateStr.includes(searchTerms.submittedDate)) &&
      statusMatch &&
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
    if (resetPassword.length < 6) {
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

  // ── Employee accounts ────────────────────────────────────────────────────────

  const handleShowEmployeeAccounts = async () => {
    setShowEmployeeAccounts(true)
    setEmployeesLoading(true)
    const data = await getEmployees()
    setEmployees(data || [])
    setEmployeesLoading(false)
  }

  const handleCloseEmployeeAccounts = () => {
    setShowEmployeeAccounts(false)
    setEmployees([])
    setNewEmployeeEmail('')
    setNewEmployeePassword('')
    setNewEmployeeConfirm('')
    setCreateEmployeeError('')
    setCreateEmployeeSuccess('')
    setCreateEmployeeLoading(false)
    setEmployeeDeletePending(null)
    setEmployeeDeleteError('')
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
      const data = await getEmployees()
      setEmployees(data || [])
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
    if (newEmployeePassword.length < 6) {
      setCreateEmployeeError('Password must be at least 6 characters')
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
      const data = await getEmployees()
      setEmployees(data || [])
    } else {
      setCreateEmployeeError(result.error)
    }
  }

  const countLabel = hasActiveFilters
    ? `${sortedApplications.length} of ${applications.length} application${applications.length !== 1 ? 's' : ''}`
    : `${applications.length} application${applications.length !== 1 ? 's' : ''}`

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
              <button className="create-member-button" onClick={handleShowEmployeeAccounts} style={{ background: '#495057' }}>
                Employee Accounts
              </button>
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
                    <th className="action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-filter-row">
                        No applications match the current filters.{' '}
                        <button className="clear-filters-inline" onClick={handleClearFilters}>Clear Filters</button>
                      </td>
                    </tr>
                  ) : (
                    sortedApplications.map((app) => {
                      const repFullName = `${app.AuthRepFirstName || ''} ${app.AuthRepLastName || ''}`.trim()
                      return (
                        <tr key={app.Id}>
                          <td>{app.StoreName || '—'}</td>
                          <td className="email-cell">{app.UserEmail}</td>
                          <td>{repFullName || 'Not provided'}</td>
                          <td>{formatDate(app.CreatedAt)}</td>
                          <td>
                            <div className="sig-status-cell">
                              <div className="sig-status-row">
                                <span className="sig-status-label">App</span>
                                {getAppStatusBadge(app.Status)}
                              </div>
                              <div className="sig-status-row sig-status-row-sub">
                                <span className="sig-status-label">Ref 1</span>
                                {getSigStatusBadge(app.Ref1SignatureStatus)}
                              </div>
                              <div className="sig-status-row sig-status-row-sub">
                                <span className="sig-status-label">Ref 2</span>
                                {getSigStatusBadge(app.Ref2SignatureStatus)}
                              </div>
                              <div className="sig-status-divider" />
                              <div className="sig-status-row sig-status-row-sub">
                                <span className="sig-status-label">Verify</span>
                                {getBoardStatusBadge(getBoardVerifyState(app), app.VerificationSignedAt)}
                              </div>
                              <div className="sig-status-row sig-status-row-sub">
                                <span className="sig-status-label">Approve</span>
                                {getBoardStatusBadge(getBoardApproveState(app), app.ApprovedSignedAt)}
                              </div>
                            </div>
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

      {/* ── Employee accounts modal (list + create) ─────────────────────── */}
      {showEmployeeAccounts && (
        <div className="modal-overlay" onClick={handleCloseEmployeeAccounts}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Employee Accounts</h3>
              <button className="modal-close" onClick={handleCloseEmployeeAccounts}>✕</button>
            </div>
            <div className="modal-form">

              {/* ── Existing accounts list ── */}
              {employeesLoading ? (
                <p style={{ color: '#666', fontSize: 14 }}>Loading...</p>
              ) : employees.length === 0 ? (
                <p style={{ color: '#888', fontSize: 14, margin: 0 }}>No employee accounts yet.</p>
              ) : (
                <>
                {employeeDeleteError && (
                  <div className="member-delete-error" style={{ marginBottom: 10 }}>
                    {employeeDeleteError}
                    <button style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 600 }} onClick={() => setEmployeeDeleteError('')}>✕</button>
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#495057' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#495057' }}>Created</th>
                      <th style={{ padding: '6px 8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => {
                      const isAdmin = emp.Email.toLowerCase() === 'admin@ghraonline.com'
                      const isSelf = emp.Email.toLowerCase() === currentUser?.email?.toLowerCase()
                      return (
                        <tr key={emp.Id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px' }}>
                            {emp.Email}
                            {isAdmin && <span style={{ marginLeft: 6, fontSize: 11, background: '#ffc107', color: '#333', borderRadius: 3, padding: '1px 5px' }}>protected</span>}
                            {isSelf && !isAdmin && <span style={{ marginLeft: 6, fontSize: 11, background: '#cce5ff', color: '#004085', borderRadius: 3, padding: '1px 5px' }}>you</span>}
                          </td>
                          <td style={{ padding: '8px', color: '#6c757d' }}>{formatDate(emp.CreatedAt)}</td>
                          <td style={{ padding: '8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {!isAdmin && (
                              <button
                                className="reset-pwd-button"
                                onClick={() => { handleCloseEmployeeAccounts(); openResetModal(emp, 'employee') }}
                              >
                                Reset PWD
                              </button>
                            )}
                            {!isAdmin && !isSelf && (
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
                </>
              )}

              {/* ── Divider ── */}
              <div style={{ borderTop: '1px solid #dee2e6', margin: '20px 0 16px' }} />

              {/* ── Create new employee form ── */}
              <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 12px', color: '#343a40' }}>Create New Employee</p>
              <form onSubmit={handleCreateEmployeeSubmit}>
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
                    className="form-input" placeholder="Min 6 characters" />
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
                  <button type="button" className="modal-cancel-button" onClick={handleCloseEmployeeAccounts}>Close</button>
                </div>
              </form>

            </div>
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
                  className="form-input" placeholder="Min 6 characters" />
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
