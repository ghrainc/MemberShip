import { useState, useEffect, useContext, useCallback } from 'react'
import { AuthContext } from '../../context/AuthContext'
import '../../styles/settings.css'

const MANAGER_TYPES = [
  { key: 'store_reset',  label: 'Store Reset Manager',   desc: 'Notified when an application opts in to a store reset visit.' },
  { key: 'fuels',        label: 'Fuels Manager',          desc: 'Notified when a fuels application is assigned a GHRA number.' },
  { key: 'food_service', label: 'Food Service Manager',   desc: 'Notified when a food service game day coordinator is requested.' },
]

export default function ManagerSettings() {
  const { getManagers, createManager, updateManager, deactivateManager } = useContext(AuthContext)

  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)

  // Per-type add form state
  const [addForms, setAddForms]   = useState({})
  const [addLoading, setAddLoading] = useState({})
  const [addErrors, setAddErrors]  = useState({})

  // Inline edit state
  const [editingId, setEditingId]   = useState(null)
  const [editName, setEditName]     = useState('')
  const [editEmail, setEditEmail]   = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState('')

  const load = useCallback(async () => {
    const data = await getManagers()
    setManagers(data || [])
    setLoading(false)
  }, [getManagers])

  useEffect(() => { load() }, [load])

  // ── Add ────────────────────────────────────────────────────────────────────

  const setAddField = (type, field, value) => {
    setAddForms(prev => ({ ...prev, [type]: { ...(prev[type] || {}), [field]: value } }))
    setAddErrors(prev => ({ ...prev, [type]: '' }))
  }

  const handleAdd = async (type) => {
    const form = addForms[type] || {}
    if (!form.name?.trim() || !form.email?.trim()) {
      setAddErrors(prev => ({ ...prev, [type]: 'Name and email are required.' }))
      return
    }
    setAddLoading(prev => ({ ...prev, [type]: true }))
    const result = await createManager(type, form.name.trim(), form.email.trim())
    setAddLoading(prev => ({ ...prev, [type]: false }))
    if (result.success) {
      setAddForms(prev => ({ ...prev, [type]: {} }))
      await load()
    } else {
      setAddErrors(prev => ({ ...prev, [type]: result.error }))
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  const startEdit = (mgr) => {
    setEditingId(mgr.Id)
    setEditName(mgr.Name)
    setEditEmail(mgr.Email)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const handleEditSave = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and email are required.')
      return
    }
    setEditSaving(true)
    const result = await updateManager(editingId, editName.trim(), editEmail.trim())
    setEditSaving(false)
    if (result.success) {
      setEditingId(null)
      setEditError('')
      await load()
    } else {
      setEditError(result.error)
    }
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  const handleDeactivate = async (id) => {
    const result = await deactivateManager(id)
    if (result.success) await load()
  }

  // ──────────────────────────────────────────────────────────────────────────

  if (loading) return <p style={{ color: 'var(--ghra-muted)', padding: '8px 0' }}>Loading…</p>

  return (
    <div className="settings-panel">
      {MANAGER_TYPES.map(({ key, label, desc }) => {
        const list       = managers.filter(m => m.ManagerType === key)
        const form       = addForms[key] || {}
        const addErr     = addErrors[key]
        const isAddBusy  = !!addLoading[key]

        return (
          <div className="settings-section" key={key}>
            <h3>{label}</h3>
            <p style={{ fontSize: 13, color: 'var(--ghra-muted)', margin: '-4px 0 14px' }}>{desc}</p>

            {list.length > 0 && (
              <ul className="manager-list">
                {list.map(mgr => (
                  <li key={mgr.Id} className={`manager-list-item${!mgr.IsActive ? ' manager-list-item--inactive' : ''}`}>
                    {editingId === mgr.Id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setEditError('') }}
                          className="form-input"
                          style={{ flex: 1, fontSize: 13, padding: '4px 8px' }}
                          placeholder="Full name"
                          onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                        />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={e => { setEditEmail(e.target.value); setEditError('') }}
                          className="form-input"
                          style={{ flex: 1, fontSize: 13, padding: '4px 8px' }}
                          placeholder="Email address"
                          onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                        />
                        <button className="manager-add-button" onClick={handleEditSave} disabled={editSaving} style={{ fontSize: 12 }}>
                          {editSaving ? '…' : 'Save'}
                        </button>
                        <button className="manager-edit-button" onClick={cancelEdit} disabled={editSaving}>
                          Cancel
                        </button>
                        {editError && (
                          <span style={{ width: '100%', fontSize: 12, color: '#721c24' }}>{editError}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="manager-name">{mgr.Name}</span>
                        <span className="manager-email">{mgr.Email}</span>
                        {mgr.IsActive ? (
                          <>
                            <button className="manager-edit-button" onClick={() => startEdit(mgr)}>Edit</button>
                            <button className="manager-deactivate-button" onClick={() => handleDeactivate(mgr.Id)}>Remove</button>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--ghra-muted)', fontStyle: 'italic' }}>Inactive</span>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="manager-add-form">
              <input
                type="text"
                placeholder="Full name"
                value={form.name || ''}
                onChange={e => setAddField(key, 'name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd(key)}
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email || ''}
                onChange={e => setAddField(key, 'email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd(key)}
              />
              <button className="manager-add-button" onClick={() => handleAdd(key)} disabled={isAddBusy}>
                {isAddBusy ? '…' : '+ Add'}
              </button>
            </div>
            {addErr && (
              <p style={{ fontSize: 12, color: '#721c24', margin: '6px 0 0' }}>{addErr}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
