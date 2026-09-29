const sql = require('mssql')
const { maskDsPayload } = require('../ds/logDsEvent')

const MAX_DETAILS_BYTES = 16 * 1024

function detailsToString(details) {
  if (!details) return null
  const masked = maskDsPayload(details)
  const str = JSON.stringify(masked) || ''
  if (Buffer.byteLength(str, 'utf8') <= MAX_DETAILS_BYTES) return str
  return str.slice(0, MAX_DETAILS_BYTES) + '…[truncated]'
}

async function logApplicationAction(db, {
  appId, action, performedBy, performedByRole,
  details, previousStatus, newStatus, ipAddress
}) {
  if (!db) return
  try {
    await db.request()
      .input('appId',           sql.Int,               appId)
      .input('action',          sql.NVarChar(50),      action)
      .input('performedBy',     sql.NVarChar(255),     performedBy)
      .input('performedByRole', sql.NVarChar(20),      performedByRole ?? null)
      .input('details',         sql.NVarChar(sql.MAX), detailsToString(details))
      .input('previousStatus',  sql.NVarChar(20),      previousStatus ?? null)
      .input('newStatus',       sql.NVarChar(20),      newStatus ?? null)
      .input('ipAddress',       sql.NVarChar(45),      ipAddress ?? null)
      .query(`INSERT INTO ApplicationAuditLog
        (ApplicationId, Action, PerformedBy, PerformedByRole, Details, PreviousStatus, NewStatus, IpAddress)
        VALUES
        (@appId, @action, @performedBy, @performedByRole, @details, @previousStatus, @newStatus, @ipAddress)`)
  } catch (logErr) {
    console.error('[ApplicationAuditLog] logging failed:', logErr.message)
  }
}

module.exports = { logApplicationAction }
