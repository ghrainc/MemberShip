import { useContext, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { AuthContext } from '../context/AuthContext'
import { generateApplicationPDF } from '../utils/pdfExport'
import NewApplicationModal from './NewApplicationModal'
import '../styles/Dashboard.css'

function Dashboard() {
  const {
    currentUser, getUserApplications, getMyWarehouseApplications, getMyFuelsApplications, logout,
    deleteFuelsApplication, deleteWarehouseApplication,
  } = useContext(AuthContext)
  const navigate = useNavigate()
  const [applications, setApplications]         = useState([])
  const [loading, setLoading]                   = useState(true)
  const [warehouseApps, setWarehouseApps]       = useState([])
  const [warehouseLoading, setWarehouseLoading] = useState(true)
  const [fuelsApps, setFuelsApps]               = useState([])
  const [fuelsLoading, setFuelsLoading]         = useState(true)
  const [showNewAppModal, setShowNewAppModal]   = useState(false)
  const [deleteConfirm, setDeleteConfirm]       = useState(null)  // { type: 'fuels'|'warehouse', id }
  const [deletingId, setDeletingId]             = useState(null)
  const [toast, setToast]                       = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    getUserApplications().then(data => { setApplications(data || []); setLoading(false) })
    getMyWarehouseApplications().then(data => { setWarehouseApps(data || []); setWarehouseLoading(false) })
    getMyFuelsApplications().then(data => { setFuelsApps(data || []); setFuelsLoading(false) })
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleContinueApplication = (appId) => navigate(`/application/${appId}/step/1`)
  const handleViewApplication     = (appId) => navigate(`/application/${appId}`)

  const handleDeleteExecute = async () => {
    if (!deleteConfirm) return
    const { type, id } = deleteConfirm
    setDeletingId(id)
    try {
      const fn = type === 'fuels' ? deleteFuelsApplication : deleteWarehouseApplication
      const result = await fn(id)
      if (!result.success) { setToast(result.error || 'Delete failed'); return }
      setDeleteConfirm(null)
      setToast('Draft deleted')
      if (type === 'fuels') {
        getMyFuelsApplications().then(data => setFuelsApps(data || []))
      } else {
        getMyWarehouseApplications().then(data => setWarehouseApps(data || []))
      }
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

  const getStatusBadge = (status) => {
    const statusMap = {
      draft:             { label: 'Draft',              class: 'status-pending' },
      submitted:         { label: 'Submitted',          class: 'status-submitted' },
      approved:          { label: 'Approved',           class: 'status-approved' },
      rejected:          { label: 'Needs Revision',     class: 'status-rejected' },
      pending_signature: { label: 'Awaiting Signature', class: 'status-pending-signature' },
      signed:            { label: 'Signed by Member',   class: 'status-signed' },
    }
    const s = statusMap[status] || { label: status, class: 'status-unknown' }
    return <span className={`status-badge ${s.class}`}>{s.label}</span>
  }

  // ── Derive which dashboard state to show ──────────────────────────────────
  const overallLoading = loading || warehouseLoading || fuelsLoading
  const source         = currentUser?.signupSource ?? null
  const hasMembership  = applications.length > 0
  const hasFuels       = fuelsApps.length > 0
  const hasWarehouse   = warehouseApps.length > 0

  const memberType = (() => {
    if (source === 'membership') return 'membership'
    if (source === 'fuels')      return hasWarehouse ? 'both' : 'fuels'
    if (source === 'warehouse')  return hasFuels ? 'both' : 'warehouse'
    // No source — infer from existing apps once all three have loaded
    if (!overallLoading) {
      if (hasMembership)            return 'membership'
      if (hasFuels && hasWarehouse) return 'both'
      if (hasFuels)                 return 'fuels'
      if (hasWarehouse)             return 'warehouse'
    }
    return null
  })()

  const handleNewApplication = () => {
    if (memberType === 'membership') navigate('/application/new/step/1')
    else setShowNewAppModal(true)
  }

  // ── Shared card renderers ──────────────────────────────────────────────────
  const renderMembershipCards = () => {
    if (loading) return <div className="empty-state"><p>Loading applications...</p></div>
    if (applications.length === 0) return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No Applications Yet</h3>
        <p>Start your GHRA Membership application to get started.</p>
        <button className="empty-button" onClick={handleNewApplication}>
          Start Application
        </button>
      </div>
    )
    return (
      <div className="applications-grid">
        {applications.map(app => (
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
                <button className="action-button view-button" onClick={() => handleContinueApplication(app.Id)}>
                  Continue Editing
                </button>
              ) : app.Status === 'rejected' ? (
                <>
                  <button className="action-button view-button" onClick={() => handleViewApplication(app.Id)}>View Details</button>
                  <button className="action-button resubmit-button" onClick={() => handleContinueApplication(app.Id)}>Edit &amp; Resubmit</button>
                </>
              ) : (
                <>
                  <button className="action-button view-button" onClick={() => handleViewApplication(app.Id)}>View Details</button>
                  <button className="action-button download-button" onClick={() => generateApplicationPDF(app)}>Download PDF</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderWarehouseCards = () => {
    if (warehouseLoading) return <div className="empty-state"><p>Loading...</p></div>
    if (warehouseApps.length === 0) return (
      <div className="empty-state">
        <div className="empty-icon">🏭</div>
        <h3>No Warehouse Applications</h3>
        <p>Apply for a GHRA Warehouse account to access wholesale ordering.</p>
        <button className="empty-button" onClick={() => navigate('/warehouse-application/new')}>
          Start Warehouse Application
        </button>
      </div>
    )
    return (
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
              <button className="action-button view-button" onClick={() => navigate(`/warehouse-application/${app.Id}`)}>
                {app.Status === 'draft' ? 'Continue' : 'View'}
              </button>
              {app.Status === 'draft' && (
                <button
                  className="delete-draft-btn"
                  onClick={() => setDeleteConfirm({ type: 'warehouse', id: app.Id })}
                  disabled={deletingId === app.Id}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderFuelsCards = () => {
    if (fuelsLoading) return <div className="empty-state"><p>Loading...</p></div>
    if (fuelsApps.length === 0) return (
      <div className="empty-state">
        <div className="empty-icon">⛽</div>
        <h3>No Fuels Applications</h3>
        <p>Apply for a GHRA Fuels credit account for your unbranded fuel operations.</p>
        <button className="empty-button" onClick={() => navigate('/fuels-application/new')}>
          Start Fuels Application
        </button>
      </div>
    )
    return (
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
              <button className="action-button view-button" onClick={() => navigate(`/fuels-application/${app.Id}`)}>
                {app.Status === 'draft' ? 'Continue' : 'View'}
              </button>
              {app.Status === 'draft' && (
                <button
                  className="delete-draft-btn"
                  onClick={() => setDeleteConfirm({ type: 'fuels', id: app.Id })}
                  disabled={deletingId === app.Id}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Section subtitle helpers ───────────────────────────────────────────────
  const membershipSubtitle = loading
    ? 'Loading...'
    : applications.length === 0
      ? "No applications yet"
      : `${applications.length} application${applications.length !== 1 ? 's' : ''}`

  const warehouseSubtitle = warehouseLoading
    ? 'Loading...'
    : warehouseApps.length === 0
      ? 'No applications yet'
      : `${warehouseApps.length} application${warehouseApps.length !== 1 ? 's' : ''}`

  const fuelsSubtitle = fuelsLoading
    ? 'Loading...'
    : fuelsApps.length === 0
      ? 'No applications yet'
      : `${fuelsApps.length} application${fuelsApps.length !== 1 ? 's' : ''}`

  // ── Section divider wrapper ────────────────────────────────────────────────
  const SectionDivider = () => (
    <div className="dash-section-divider" />
  )

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
              <p>Manage your GHRA program applications</p>
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

          {/* ── MEMBERSHIP VIEW ── */}
          {(memberType === 'membership' || memberType === null) && (
            <>
              <div className="content-header">
                <div className="section-title">
                  <h2>Your Applications</h2>
                  <p className="section-subtitle">{membershipSubtitle}</p>
                </div>
                <button className="new-app-button" onClick={handleNewApplication}>
                  <span>+</span> New Application
                </button>
              </div>
              {renderMembershipCards()}
            </>
          )}

          {/* ── WAREHOUSE VIEW ── */}
          {(memberType === 'warehouse' || memberType === 'both' || memberType === null) && (
            <>
              {memberType === null && <SectionDivider />}
              <div className="content-header">
                <div className="section-title">
                  <h2>Warehouse Account Applications</h2>
                  <p className="section-subtitle">{warehouseSubtitle}</p>
                </div>
                <button className="new-app-button" onClick={() => navigate('/warehouse-application/new')}>
                  <span>+</span> New Warehouse Application
                </button>
              </div>
              {renderWarehouseCards()}
              {memberType === 'warehouse' && (
                <p className="dash-cross-sell">
                  Also need fuels credit?{' '}
                  <Link to="/fuels-application/new">Apply for a GHRA Fuels account</Link>
                </p>
              )}
            </>
          )}

          {/* ── FUELS VIEW ── */}
          {(memberType === 'fuels' || memberType === 'both' || memberType === null) && (
            <>
              {(memberType === null || memberType === 'both') && <SectionDivider />}
              <div className="content-header">
                <div className="section-title">
                  <h2>GHRA Fuels Credit Applications</h2>
                  <p className="section-subtitle">{fuelsSubtitle}</p>
                </div>
                <button className="new-app-button" onClick={() => navigate('/fuels-application/new')}>
                  <span>+</span> New Fuels Application
                </button>
              </div>
              {renderFuelsCards()}
              {memberType === 'fuels' && (
                <p className="dash-cross-sell">
                  Also need warehouse ordering?{' '}
                  <Link to="/warehouse-application/new">Apply for a Warehouse account</Link>
                </p>
              )}
            </>
          )}

        </div>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} Greater Houston Retailers Cooperative Association. All rights reserved.</p>
      </footer>

      {showNewAppModal && (
        <NewApplicationModal onClose={() => setShowNewAppModal(false)} />
      )}

      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => !deletingId && setDeleteConfirm(null)}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete this draft?</h3>
            <p>This will permanently delete the draft application and any uploaded files. This cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-ok"
                onClick={handleDeleteExecute}
                disabled={!!deletingId}
              >
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="dashboard-toast">{toast}</div>}
    </div>
  )
}

export default Dashboard
