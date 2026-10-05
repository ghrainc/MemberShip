'use strict'

const sql = require('mssql')
const { sendEmail } = require('./emailService')

// Stored formData has enum fields uppercased (businessType, fuelAvailable, bigMardKudosGameday).
// Booleans like storeResetInterest and ghraFuelOptIn stay as-is.
function ghraFuelsApplies(formData) {
  return formData.businessType !== 'WITHOUT-FUEL'
    && formData.fuelAvailable === 'UNBRANDED'
    && formData.ghraFuelOptIn !== false
}

const TYPE_LABEL = {
  store_reset:  'Store Reset',
  fuels:        'Fuels',
  food_service: 'Food Service (Big Mard / Kudos / Gameday)',
}

/**
 * Determine which manager types should receive a notification for this application.
 * @param {object} formData — parsed FormData JSON (with enum fields uppercased)
 */
function notificationTypes(formData) {
  const types = []
  if (formData.storeResetInterest)                types.push('store_reset')
  if (ghraFuelsApplies(formData))                 types.push('fuels')
  if (formData.bigMardKudosGameday === 'YES')      types.push('food_service')
  return types
}

/**
 * Send manager notifications and mark ManagerNotificationsSent = 1 on the application.
 * Never throws — errors are logged and a result object is returned.
 *
 * @param {import('mssql').ConnectionPool} db
 * @param {{ appId: number, formData: object, ghraNumber: string, storeName: string, triggerEmail: string }} opts
 * @returns {{ sent: number }}
 */
async function sendManagerNotifications(db, { appId, formData, ghraNumber, storeName, triggerEmail }) {
  const types = notificationTypes(formData)
  if (types.length === 0) {
    await db.request().input('id', sql.Int, appId)
      .query('UPDATE Applications SET ManagerNotificationsSent = 1 WHERE Id = @id')
    return { sent: 0 }
  }

  let sent = 0
  try {
    const rows = await db.request().query(
      "SELECT Id, ManagerType, (FirstName + ' ' + LastName) AS Name, Email FROM Managers WHERE IsActive = 1"
    )
    const toNotify = rows.recordset.filter(m => types.includes(m.ManagerType))

    for (const mgr of toNotify) {
      const label   = TYPE_LABEL[mgr.ManagerType] || mgr.ManagerType
      const subject = `GHRA New Member — ${storeName || 'Application #' + appId}`
      const html    = `
        <p>Hello ${mgr.Name},</p>
        <p>A new GHRA member has been assigned membership number <strong>${ghraNumber}</strong>.</p>
        <table style="border-collapse:collapse;font-size:14px;margin:12px 0">
          <tr><td style="padding:3px 12px 3px 0;color:#555">Store / Business:</td><td><strong>${storeName || '—'}</strong></td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#555">Program:</td><td>${label}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#555">GHRA #:</td><td>${ghraNumber}</td></tr>
        </table>
        <p>Please follow up as appropriate.</p>
        <p style="color:#888;font-size:12px">— GHRA Membership System</p>
      `
      try {
        await sendEmail(
          { to: mgr.Email, subject, html },
          db,
          { template: 'manager_notification', sentBy: triggerEmail || 'system' }
        )
        sent++
      } catch (err) {
        console.error(`[managerNotification] Failed to email ${mgr.Email}:`, err.message)
      }
    }
  } catch (err) {
    console.error('[managerNotification] Error fetching managers:', err.message)
  }

  try {
    await db.request().input('id', sql.Int, appId)
      .query('UPDATE Applications SET ManagerNotificationsSent = 1 WHERE Id = @id')
  } catch (err) {
    console.error('[managerNotification] Failed to set ManagerNotificationsSent:', err.message)
  }

  return { sent }
}

module.exports = { sendManagerNotifications, notificationTypes }
