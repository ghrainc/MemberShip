const sql = require('mssql')

const MAX_SUMMARY_BYTES = 8 * 1024

function maskDsPayload(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(maskDsPayload)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (/ssn|social/i.test(k)) continue
    if (/password|secret|token|api_?key/i.test(k)) continue
    if (/account|routing/i.test(k) && typeof v === 'string') {
      out[k] = v.length > 4 ? `***${v.slice(-4)}` : '***'
      continue
    }
    out[k] = (v && typeof v === 'object') ? maskDsPayload(v) : v
  }
  return out
}

function toSummary(obj) {
  if (obj === null || obj === undefined) return null
  const masked = maskDsPayload(obj)
  const str = JSON.stringify(masked) || ''
  if (Buffer.byteLength(str, 'utf8') <= MAX_SUMMARY_BYTES) return str
  return str.slice(0, MAX_SUMMARY_BYTES) + '…[truncated]'
}

async function logDsEvent(db, {
  appId, direction, operation, signatureRequestId,
  success, httpStatus, errorCode, errorMessage,
  requestSummary, responseSummary, durationMs, performedBy
}) {
  if (!db) return
  try {
    const reqStr = typeof requestSummary  === 'string' ? requestSummary  : toSummary(requestSummary)
    const resStr = typeof responseSummary === 'string' ? responseSummary : toSummary(responseSummary)
    await db.request()
      .input('appId',              sql.Int,               appId              ?? null)
      .input('direction',          sql.NVarChar(20),      direction)
      .input('operation',          sql.NVarChar(100),     operation)
      .input('signatureRequestId', sql.NVarChar(255),     signatureRequestId ?? null)
      .input('success',            sql.Bit,               success ? 1 : 0)
      .input('httpStatus',         sql.Int,               httpStatus         ?? null)
      .input('errorCode',          sql.NVarChar(100),     errorCode          ?? null)
      .input('errorMessage',       sql.NVarChar(sql.MAX), errorMessage       ?? null)
      .input('requestSummary',     sql.NVarChar(sql.MAX), reqStr             ?? null)
      .input('responseSummary',    sql.NVarChar(sql.MAX), resStr             ?? null)
      .input('durationMs',         sql.Int,               durationMs         ?? null)
      .input('performedBy',        sql.NVarChar(255),     performedBy        ?? null)
      .query(`INSERT INTO DsEventLog
        (ApplicationId, Direction, Operation, SignatureRequestId, Success, HttpStatus,
         ErrorCode, ErrorMessage, RequestSummary, ResponseSummary, DurationMs, PerformedBy)
        VALUES
        (@appId, @direction, @operation, @signatureRequestId, @success, @httpStatus,
         @errorCode, @errorMessage, @requestSummary, @responseSummary, @durationMs, @performedBy)`)
  } catch (logErr) {
    console.error('[DsEventLog] logging failed:', logErr.message)
  }
}

// Wraps any DS SDK call: logs success + response, or failure, then always rethrows on failure.
// meta: { appId, operation, performedBy, signatureRequestId?, requestSummary }
// fn: async () => sdk call result
// getResponse: (result) => object to store as responseSummary (optional)
async function dsCall(db, meta, fn, getResponse) {
  const start = Date.now()
  let result
  try {
    result = await fn()
  } catch (err) {
    const durationMs = Date.now() - start
    const httpStatus = err.statusCode ?? err.response?.statusCode ?? null
    const errBody    = err.body?.error || {}
    await logDsEvent(db, {
      appId:              meta.appId              ?? null,
      direction:          'outbound',
      operation:          meta.operation,
      signatureRequestId: meta.signatureRequestId ?? null,
      success:            false,
      httpStatus,
      errorCode:          errBody.errorName       ?? err.code    ?? null,
      errorMessage:       errBody.errorMsg        ?? err.message ?? null,
      requestSummary:     meta.requestSummary,
      responseSummary:    null,
      durationMs,
      performedBy:        meta.performedBy        ?? null,
    })
    throw err
  }
  const durationMs  = Date.now() - start
  const responseObj = getResponse ? getResponse(result) : null
  const sigId =
    responseObj?.signatureRequestId ??
    responseObj?.signatureRequest?.signatureRequestId ??
    meta.signatureRequestId ?? null
  await logDsEvent(db, {
    appId:              meta.appId     ?? null,
    direction:          'outbound',
    operation:          meta.operation,
    signatureRequestId: sigId,
    success:            true,
    httpStatus:         200,
    requestSummary:     meta.requestSummary,
    responseSummary:    responseObj,
    durationMs,
    performedBy:        meta.performedBy ?? null,
  })
  return result
}

module.exports = { maskDsPayload, toSummary, logDsEvent, dsCall }
