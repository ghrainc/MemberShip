import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import PasswordInput from './PasswordInput'
import '../styles/EmployeeDashboard.css'

function EmployeeDashboard({ onViewApplication, onEditApplication, onLogout }) {
  const { currentUser, getAllApplications, createMember } = useContext(AuthContext)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchTerms, setSearchTerms] = useState({
    storeName: '',
    submittedDate: '',
    status: '',
    email: '',
    repName: ''
  })

  const [sortConfig, setSortConfig] = useState({
    key: 'CreatedAt',
    direction: 'desc'
  })

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

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({ ...prev, [field]: value }))
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

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
      submitted: { label: 'Submitted',     class: 'status-submitted' },
      approved:  { label: 'Approved',      class: 'status-approved' },
      pending:   { label: 'Pending Review',class: 'status-pending' },
      rejected:  { label: 'Rejected',      class: 'status-rejected' },
      draft:     { label: 'Draft',         class: 'status-pending' }
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

  const handleCloseModal = () => {
    setShowCreateMember(false)
    setNewMemberEmail('')
    setNewMemberPassword('')
    setNewMemberConfirm('')
    setCreateMemberError('')
    setCreateMemberSuccess('')
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
              <button className="create-member-button" onClick={() => setShowCreateMember(true)}>
                + Create Member Login
              </button>
              <span className="user-role">Employee: {currentUser?.email}</span>
              <button className="logout-button" onClick={onLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="employee-dashboard-main">
        <div className="dashboard-content">
          <div className="content-header">
            <h2>All Applications</h2>
            <p className="application-count">
              {loading ? 'Loading...' : `${sortedApplications.length} application${sortedApplications.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading applications...</p></div>
          ) : sortedApplications.length === 0 ? (
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
                  {sortedApplications.map((app) => {
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
                            onClick={() => onViewApplication(app.Id)}
                          >
                            View
                          </button>
                          <button
                            className="edit-button"
                            onClick={() => onEditApplication(app.Id)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="employee-dashboard-footer">
        <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>

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
