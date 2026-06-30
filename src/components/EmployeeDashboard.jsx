import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import '../styles/EmployeeDashboard.css'

const EMPTY_FILTERS = { storeName: '', submittedDate: '', status: '', email: '', repName: '' }

function EmployeeDashboard() {
  const { currentUser, getAllApplications, createMember, testDropboxSign, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [searchTerms, setSearchTerms] = useState(EMPTY_FILTERS)

  const [sortConfig, setSortConfig] = useState({
    key: 'CreatedAt',
    direction: 'desc'
  })

  // Dropbox Sign test modal state
  const [showDsTest, setShowDsTest] = useState(false)
  const [dsTestEmail, setDsTestEmail] = useState('')
  const [dsTestName, setDsTestName] = useState('')
  const [dsTestLoading, setDsTestLoading] = useState(false)
  const [dsTestResult, setDsTestResult] = useState(null)

  // Create member modal state
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberConfirm, setNewMemberConfirm] = useState('')
  const [createMemberError, setCreateMemberError] = useState('')
  const [createMemberSuccess, setCreateMemberSuccess] = useState('')
  const [createMemberLoading, setCreateMemberLoading] = useState(false)

  useEffect(() => {
    getAllApplications().then(data => {
      setApplications(data || [])
      setLoading(false)
    })
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    const data = await getAllApplications()
    setApplications(data || [])
    setRefreshing(false)
  }

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({ ...prev, [field]: value }))
  }

  const handleClearFilters = () => {
    setSearchTerms(EMPTY_FILTERS)
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const hasActiveFilters =
    searchTerms.storeName !== '' ||
    searchTerms.submittedDate !== '' ||
    searchTerms.status !== '' ||
    searchTerms.email !== '' ||
    searchTerms.repName !== ''

  const filteredApplications = applications.filter(app => {
    const repFullName = `${app.AuthRepFirstName || ''} ${app.AuthRepLastName || ''}`.trim()
    const dateStr = app.CreatedAt ? app.CreatedAt.slice(0, 10) : ''
    return (
      (searchTerms.storeName === '' || (app.StoreName || '').toLowerCase().includes(searchTerms.storeName.toLowerCase())) &&
      (searchTerms.submittedDate === '' || dateStr.includes(searchTerms.submittedDate)) &&
      (searchTerms.status === '' || (app.Status || '') === searchTerms.status) &&
      (searchTerms.email === '' || (app.UserEmail || '').toLowerCase().includes(searchTerms.email.toLowerCase())) &&
      (searchTerms.repName === '' || repFullName.toLowerCase().includes(searchTerms.repName.toLowerCase()))
    )
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue, bValue
    switch (sortConfig.key) {
      case 'StoreName':
        aValue = a.StoreName || ''
        bValue = b.StoreName || ''
        break
      case 'CreatedAt':
        aValue = new Date(a.CreatedAt)
        bValue = new Date(b.CreatedAt)
        break
      case 'Status':
        aValue = a.Status || ''
        bValue = b.Status || ''
        break
      case 'UserEmail':
        aValue = a.UserEmail || ''
        bValue = b.UserEmail || ''
        break
      case 'repName':
        aValue = `${a.AuthRepFirstName || ''} ${a.AuthRepLastName || ''}`.trim().toLowerCase()
        bValue = `${b.AuthRepFirstName || ''} ${b.AuthRepLastName || ''}`.trim().toLowerCase()
        break
      default:
        return 0
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const getStatusBadge = (status) => {
    const statusMap = {
      submitted:           { label: 'Submitted',          class: 'status-submitted' },
      approved:            { label: 'Approved',           class: 'status-approved' },
      pending:             { label: 'Pending Review',     class: 'status-pending' },
      rejected:            { label: 'Rejected',           class: 'status-rejected' },
      draft:               { label: 'Draft',              class: 'status-pending' },
      pending_signature:   { label: 'Awaiting Signature', class: 'status-pending-signature' },
      signed:              { label: 'Signed by Member',   class: 'status-signed' }
    }
    const info = statusMap[status] || { label: status, class: 'status-unknown' }
    return <span className={`status-badge ${info.class}`}>{info.label}</span>
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="sort-icon">⇅</span>
    return <span className={`sort-icon ${sortConfig.direction}`}>
      {sortConfig.direction === 'asc' ? '↑' : '↓'}
    </span>
  }

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
    const result = await createMember(newMemberEmail, newMemberPassword)
    setCreateMemberLoading(false)
    if (result.success) {
      setCreateMemberSuccess(`Member account created for ${newMemberEmail}`)
      setNewMemberEmail('')
      setNewMemberPassword('')
      setNewMemberConfirm('')
    } else {
      setCreateMemberError(result.error)
    }
  }

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

  const handleCloseModal = () => {
    setShowCreateMember(false)
    setNewMemberEmail('')
    setNewMemberPassword('')
    setNewMemberConfirm('')
    setCreateMemberError('')
    setCreateMemberSuccess('')
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
              <button className="create-member-button" onClick={() => setShowCreateMember(true)}>
                + Create Member Login
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

      <main className="employee-dashboard-main">
        <div className="dashboard-content">
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
                          <input
                            type="text"
                            placeholder="Search store..."
                            value={searchTerms.storeName}
                            onChange={(e) => handleSearchChange('storeName', e.target.value)}
                          />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('StoreName')}>
                          <SortIcon column="StoreName" />
                        </button>
                      </div>
                      <span className="th-label">Store Name</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input
                            type="text"
                            placeholder="Search email..."
                            value={searchTerms.email}
                            onChange={(e) => handleSearchChange('email', e.target.value)}
                          />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('UserEmail')}>
                          <SortIcon column="UserEmail" />
                        </button>
                      </div>
                      <span className="th-label">Member Email</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input
                            type="text"
                            placeholder="Search rep..."
                            value={searchTerms.repName}
                            onChange={(e) => handleSearchChange('repName', e.target.value)}
                          />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('repName')}>
                          <SortIcon column="repName" />
                        </button>
                      </div>
                      <span className="th-label">Rep Name</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <div className="filter-input">
                          <input
                            type="date"
                            value={searchTerms.submittedDate}
                            onChange={(e) => handleSearchChange('submittedDate', e.target.value)}
                          />
                        </div>
                        <button className="sort-button" onClick={() => handleSort('CreatedAt')}>
                          <SortIcon column="CreatedAt" />
                        </button>
                      </div>
                      <span className="th-label">Date</span>
                    </th>
                    <th>
                      <div className="table-header">
                        <select
                          value={searchTerms.status}
                          onChange={(e) => handleSearchChange('status', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">All Status</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="pending">Pending</option>
                          <option value="draft">Draft</option>
                          <option value="pending_signature">Awaiting Signature</option>
                          <option value="signed">Signed by Member</option>
                        </select>
                        <button className="sort-button" onClick={() => handleSort('Status')}>
                          <SortIcon column="Status" />
                        </button>
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
                        <button className="clear-filters-inline" onClick={handleClearFilters}>
                          Clear Filters
                        </button>
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
                          <td>{getStatusBadge(app.Status)}</td>
                          <td className="action-cell">
                            <button
                              className="view-button"
                              onClick={() => navigate(`/employee/application/${app.Id}`)}
                            >
                              View
                            </button>
                            <button
                              className="edit-button"
                              onClick={() => navigate(`/employee/application/${app.Id}/edit/step/1`)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="employee-dashboard-footer">
        <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>

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
                The request email will go to the address below.
              </p>
              <div className="form-group">
                <label>Signer Email *</label>
                <input
                  type="email"
                  value={dsTestEmail}
                  onChange={(e) => setDsTestEmail(e.target.value)}
                  className="form-input"
                  placeholder="signer@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Signer Name (optional)</label>
                <input
                  type="text"
                  value={dsTestName}
                  onChange={(e) => setDsTestName(e.target.value)}
                  className="form-input"
                  placeholder="John Doe"
                />
              </div>
              {dsTestResult && dsTestResult.success && (
                <div className="modal-success">
                  Sent! Signature Request ID: <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{dsTestResult.signatureRequestId}</code>
                </div>
              )}
              {dsTestResult && !dsTestResult.success && (
                <div className="modal-error">Error: {dsTestResult.error}</div>
              )}
              <div className="modal-actions">
                <button type="submit" className="modal-submit-button" disabled={dsTestLoading || !dsTestEmail}>
                  {dsTestLoading ? 'Sending...' : 'Send Test Request'}
                </button>
                <button type="button" className="modal-cancel-button" onClick={handleCloseDsTest}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateMember && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Member Login</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleCreateMemberSubmit} className="modal-form">
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="form-input"
                  placeholder="member@example.com"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <PasswordInput
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  className="form-input"
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <PasswordInput
                  value={newMemberConfirm}
                  onChange={(e) => setNewMemberConfirm(e.target.value)}
                  className="form-input"
                  placeholder="Repeat password"
                />
              </div>
              {createMemberError && <div className="modal-error">{createMemberError}</div>}
              {createMemberSuccess && <div className="modal-success">{createMemberSuccess}</div>}
              <div className="modal-actions">
                <button type="submit" className="modal-submit-button" disabled={createMemberLoading}>
                  {createMemberLoading ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" className="modal-cancel-button" onClick={handleCloseModal}>
                  Close
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
