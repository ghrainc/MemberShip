import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import { generateApplicationPDF } from '../utils/pdfExport'
import '../styles/Dashboard.css'

function Dashboard() {
  const { currentUser, getUserApplications, getMyWarehouseApplications, getMyFuelsApplications, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [warehouseApps, setWarehouseApps]         = useState([])
  const [warehouseLoading, setWarehouseLoading]   = useState(true)
  const [fuelsApps, setFuelsApps]                 = useState([])
  const [fuelsLoading, setFuelsLoading]           = useState(true)

  useEffect(() => {
    getUserApplications().then(data => {
      setApplications(data || [])
      setLoading(false)
    })
    getMyWarehouseApplications().then(data => {
      setWarehouseApps(data || [])
      setWarehouseLoading(false)
    })
    getMyFuelsApplications().then(data => {
      setFuelsApps(data || [])
      setFuelsLoading(false)
    })
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNewApplication = () => {
    navigate('/application/new/step/1')
  }

  const handleContinueApplication = (appId) => {
    // MembershipForm will load the app and redirect to the saved step
    navigate(`/application/${appId}/step/1`)
  }

  const handleViewApplication = (appId) => {
    navigate(`/application/${appId}`)
  }

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
      draft:               { label: 'Draft',               class: 'status-pending' },
      submitted:           { label: 'Submitted',           class: 'status-submitted' },
      approved:            { label: 'Approved',            class: 'status-approved' },
      rejected:            { label: 'Needs Revision',      class: 'status-rejected' },
      pending_signature:   { label: 'Awaiting Signature',  class: 'status-pending-signature' },
      signed:              { label: 'Signed by Member',    class: 'status-signed' }
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
              <button className="logout-button" onClick={handleLogout}>Logout</button>
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
            <button className="new-app-button" onClick={handleNewApplication}>
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
              <button className="empty-button" onClick={handleNewApplication}>
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
                        onClick={() => handleContinueApplication(app.Id)}
                      >
                        Continue Editing
                      </button>
                    ) : app.Status === 'rejected' ? (
                      <>
                        <button
                          className="action-button view-button"
                          onClick={() => handleViewApplication(app.Id)}
                        >
                          View Details
                        </button>
                        <button
                          className="action-button resubmit-button"
                          onClick={() => handleContinueApplication(app.Id)}
                        >
                          Edit &amp; Resubmit
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="action-button view-button"
                          onClick={() => handleViewApplication(app.Id)}
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

          {/* ── Warehouse Applications section ── */}
          <div style={{ borderTop: '2px solid var(--ghra-line)', margin: '32px 0 0 0', paddingTop: 32 }}>
            <div className="content-header">
              <div className="section-title">
                <h2>Warehouse Account Applications</h2>
                <p className="section-subtitle">
                  {warehouseLoading
                    ? 'Loading...'
                    : warehouseApps.length === 0
                      ? 'No warehouse applications yet'
                      : `${warehouseApps.length} application${warehouseApps.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                className="new-app-button"
                onClick={() => navigate('/warehouse-application/new')}
              >
                <span>+</span> New Warehouse Application
              </button>
            </div>

            {warehouseLoading ? (
              <div className="empty-state"><p>Loading...</p></div>
            ) : warehouseApps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏭</div>
                <h3>No Warehouse Applications</h3>
                <p>Apply for a GHRA warehouse account to access wholesale pricing.</p>
                <button className="empty-button" onClick={() => navigate('/warehouse-application/new')}>
                  Start Warehouse Application
                </button>
              </div>
            ) : (
              <div className="applications-grid">
                {warehouseApps.map(app => (
                  <div key={app.Id} className="application-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <h3>Warehouse Application</h3>
                        {getStatusBadge(app.Status)}
                      </div>
                      <span className="app-id">ID: {app.Id}</span>
                    </div>
                    <div className="card-body">
                      <div className="app-info">
                        <div className="info-item">
                          <span className="info-label">Created</span>
                          <span className="info-value">{formatDate(app.CreatedAt)}</span>
                        </div>
                        {app.SubmittedAt && (
                          <div className="info-item">
                            <span className="info-label">Submitted</span>
                            <span className="info-value">{formatDate(app.SubmittedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-actions">
                      {app.Status === 'draft' ? (
                        <button
                          className="action-button view-button"
                          onClick={() => navigate(`/warehouse-application/${app.Id}`)}
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          className="action-button view-button"
                          onClick={() => navigate(`/warehouse-application/${app.Id}`)}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Fuels Applications section ── */}
          <div style={{ borderTop: '2px solid var(--ghra-line)', margin: '32px 0 0 0', paddingTop: 32 }}>
            <div className="content-header">
              <div className="section-title">
                <h2>GHRA Fuels Credit Applications</h2>
                <p className="section-subtitle">
                  {fuelsLoading
                    ? 'Loading...'
                    : fuelsApps.length === 0
                      ? 'No fuels applications yet'
                      : `${fuelsApps.length} application${fuelsApps.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                className="new-app-button"
                onClick={() => navigate('/fuels-application/new')}
              >
                <span>+</span> New Fuels Credit Application
              </button>
            </div>

            {fuelsLoading ? (
              <div className="empty-state"><p>Loading...</p></div>
            ) : fuelsApps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#9981;</div>
                <h3>No Fuels Applications</h3>
                <p>Apply for a GHRA Fuels credit account.</p>
                <button className="empty-button" onClick={() => navigate('/fuels-application/new')}>
                  Start Fuels Application
                </button>
              </div>
            ) : (
              <div className="applications-grid">
                {fuelsApps.map(app => (
                  <div key={app.Id} className="application-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <h3>Fuels Credit Application</h3>
                        {getStatusBadge(app.Status)}
                      </div>
                      <span className="app-id">ID: {app.Id}</span>
                    </div>
                    <div className="card-body">
                      <div className="app-info">
                        <div className="info-item">
                          <span className="info-label">Created</span>
                          <span className="info-value">{formatDate(app.CreatedAt)}</span>
                        </div>
                        {app.SubmittedAt && (
                          <div className="info-item">
                            <span className="info-label">Submitted</span>
                            <span className="info-value">{formatDate(app.SubmittedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-actions">
                      {app.Status === 'draft' ? (
                        <button
                          className="action-button view-button"
                          onClick={() => navigate(`/fuels-application/${app.Id}`)}
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          className="action-button view-button"
                          onClick={() => navigate(`/fuels-application/${app.Id}`)}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Dashboard
