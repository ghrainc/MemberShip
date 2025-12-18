import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/EmployeeDashboard.css'

function EmployeeDashboard({ onViewApplication, onLogout }) {
  const { currentUser, getAllApplications } = useContext(AuthContext)
  const applications = getAllApplications()
  
  const [searchTerms, setSearchTerms] = useState({
    storeName: '',
    submittedDate: '',
    status: '',
    email: '',
    repName: ''
  })

  const [sortConfig, setSortConfig] = useState({
    key: 'submittedDate',
    direction: 'desc'
  })

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const filteredApplications = applications.filter(app => {
    const fullData = app.fullData || {}
    
    return (
      (searchTerms.storeName === '' || app.storeName?.toLowerCase().includes(searchTerms.storeName.toLowerCase())) &&
      (searchTerms.submittedDate === '' || app.submittedDate?.includes(searchTerms.submittedDate)) &&
      (searchTerms.status === '' || app.status === searchTerms.status) &&
      (searchTerms.email === '' || app.email?.toLowerCase().includes(searchTerms.email.toLowerCase())) &&
      (searchTerms.repName === '' || fullData.authorizedRepName?.toLowerCase().includes(searchTerms.repName.toLowerCase()))
    )
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue, bValue

    switch (sortConfig.key) {
      case 'storeName':
        aValue = a.storeName || ''
        bValue = b.storeName || ''
        break
      case 'submittedDate':
        aValue = new Date(a.submittedDate)
        bValue = new Date(b.submittedDate)
        break
      case 'status':
        aValue = a.status || ''
        bValue = b.status || ''
        break
      case 'email':
        aValue = a.email || ''
        bValue = b.email || ''
        break
      case 'repName':
        aValue = (a.fullData?.authorizedRepName || '').toLowerCase()
        bValue = (b.fullData?.authorizedRepName || '').toLowerCase()
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
      submitted: { label: 'Submitted', class: 'status-submitted' },
      approved: { label: 'Approved', class: 'status-approved' },
      pending: { label: 'Pending Review', class: 'status-pending' },
      rejected: { label: 'Rejected', class: 'status-rejected' }
    }
    const statusInfo = statusMap[status] || { label: status, class: 'status-unknown' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="sort-icon">⇅</span>
    return <span className={`sort-icon ${sortConfig.direction}`}>
      {sortConfig.direction === 'asc' ? '↑' : '↓'}
    </span>
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
            <p className="application-count">{sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}</p>
          </div>

          {sortedApplications.length === 0 ? (
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
                        <button className="sort-button" onClick={() => handleSort('storeName')}>
                          <SortIcon column="storeName" />
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
                        <button className="sort-button" onClick={() => handleSort('email')}>
                          <SortIcon column="email" />
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
                        <button className="sort-button" onClick={() => handleSort('submittedDate')}>
                          <SortIcon column="submittedDate" />
                        </button>
                      </div>
                      <span className="th-label">Submitted Date</span>
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
                        </select>
                        <button className="sort-button" onClick={() => handleSort('status')}>
                          <SortIcon column="status" />
                        </button>
                      </div>
                      <span className="th-label">Status</span>
                    </th>
                    <th className="action-column">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApplications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.storeName}</td>
                      <td className="email-cell">{app.email}</td>
                      <td>{app.fullData?.authorizedRepName || 'Not provided'}</td>
                      <td>{formatDate(app.submittedDate)}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td className="action-cell">
                        <button
                          className="view-button"
                          onClick={() => onViewApplication(app.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="employee-dashboard-footer">
        <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default EmployeeDashboard
