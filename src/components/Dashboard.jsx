import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { generateApplicationPDF } from '../utils/pdfExport'
import '../styles/Dashboard.css'

function Dashboard({ onNewApplication, onViewApplication, onContinueApplication, onLogout }) {
  const { currentUser, getUserApplications } = useContext(AuthContext)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserApplications().then(data => {
      setApplications(data || [])
      setLoading(false)
    })
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft:     { label: 'Draft',          class: 'status-pending' },
      submitted: { label: 'Submitted',      class: 'status-submitted' },
      approved:  { label: 'Approved',       class: 'status-approved' },
      rejected:  { label: 'Needs Revision', class: 'status-rejected' }
    }
    const statusInfo = statusMap[status] || { label: status, class: 'status-unknown' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800"
              alt="GHRA Logo"
              className="dashboard-logo"
            />
            <div className="header-info">
              <h1>Application Portal</h1>
              <p>Manage your GHRA membership applications</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-email">{currentUser?.email}</span>
              <button className="logout-button" onClick={onLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="content-header">
            <div className="section-title">
              <h2>Your Applications</h2>
              <p className="section-subtitle">
                {loading
                  ? 'Loading...'
                  : applications.length === 0
                    ? "You haven't submitted any applications yet"
                    : `You have ${applications.length} application${applications.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button className="new-app-button" onClick={onNewApplication}>
              <span>+</span> New Application
            </button>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading applications...</p></div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Applications Yet</h3>
              <p>Start a new membership application to get began with GHRA.</p>
              <button className="empty-button" onClick={onNewApplication}>
                Create First Application
              </button>
            </div>
          ) : (
            <div className="applications-grid">
              {applications.map((app) => (
                <div key={app.Id} className="application-card">
                  <div className="card-header">
                    <div className="card-title-section">
                      <h3>{app.StoreName || 'Unnamed Application'}</h3>
                      {getStatusBadge(app.Status)}
                    </div>
                    <span className="app-id">ID: {app.Id}</span>
                  </div>

                  <div className="card-body">
                    <div className="app-info">
                      <div className="info-item">
                        <span className="info-label">Address</span>
                        <span className="info-value">{app.StoreAddress || 'Not provided'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Date</span>
                        <span className="info-value">{formatDate(app.CreatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    {app.Status === 'draft' ? (
                      <button
                        className="action-button view-button"
                        onClick={() => onContinueApplication(app.Id)}
                      >
                        Continue Editing
                      </button>
                    ) : app.Status === 'rejected' ? (
                      <>
                        <button
                          className="action-button view-button"
                          onClick={() => onViewApplication(app.Id)}
                        >
                          View Details
                        </button>
                        <button
                          className="action-button resubmit-button"
                          onClick={() => onContinueApplication(app.Id)}
                        >
                          Edit &amp; Resubmit
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="action-button view-button"
                          onClick={() => onViewApplication(app.Id)}
                        >
                          View Details
                        </button>
                        <button
                          className="action-button download-button"
                          onClick={() => generateApplicationPDF(app)}
                        >
                          Download PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Dashboard
