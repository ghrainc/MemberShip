'use strict'

/**
 * Central email service.
 *
 * Config resolution order (first non-empty wins):
 *   1. AppSettings rows in the database (set via the Settings → Email UI)
 *   2. EMAIL_* environment variables (legacy fallback, keeps existing deploys working)
 *
 * sendEmail() throws on failure so callers can surface the error. The caller
 * decides whether to swallow or propagate — this function never decides.
 *
 * logEmail() is fire-and-forget; errors are printed to console only.
 */

const nodemailer = require('nodemailer')

/**
 * Load SMTP config from AppSettings, falling back to env vars.
 * Returns null if neither source has enough config to send.
 * @param {import('mssql').ConnectionPool} db
 */
async function resolveEmailConfig(db) {
  let cfg = {}

  if (db) {
    try {
      const rows = await db.request().query(
        "SELECT SettingKey, SettingValue FROM AppSettings WHERE SettingKey LIKE 'email.%'"
      )
      for (const row of rows.recordset) {
        cfg[row.SettingKey] = row.SettingValue
      }
    } catch { /* table may not exist yet on first boot */ }
  }

  const host     = cfg['email.host']     || process.env.EMAIL_HOST     || ''
  const port     = cfg['email.port']     || process.env.EMAIL_PORT     || '587'
  const user     = cfg['email.user']     || process.env.EMAIL_USER     || ''
  const fromAddr = cfg['email.from']     || process.env.EMAIL_FROM     || user
  const fromName = cfg['email.fromName'] || process.env.EMAIL_FROM_NAME || 'GHRA Membership'
  const tls      = (cfg['email.tls']     ?? process.env.EMAIL_TLS ?? 'false') === 'true'

  // password: DB-stored encrypted value takes priority over env var
  let pass = ''
  const encPass = cfg['email.passwordEncrypted'] || ''
  if (encPass) {
    const { ssnDecrypt } = require('./smtpCrypto')
    pass = ssnDecrypt(encPass) || ''
  }
  if (!pass) pass = process.env.EMAIL_PASS || ''

  if (!host || !user || !pass) return null

  return { host, port: parseInt(port) || 587, user, pass, fromAddr, fromName, tls }
}

/**
 * Send an email. Throws on failure.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 * @param {import('mssql').ConnectionPool} db
 * @param {{ sentBy?: string, template?: string }} meta  for the email log
 */
async function sendEmail({ to, subject, html, text }, db, meta = {}) {
  const cfg = await resolveEmailConfig(db)
  if (!cfg) {
    // No config at all — preserve the legacy silent-skip behaviour.
    // If you want to require email config, throw here instead of returning.
    return { sent: false, reason: 'no_config' }
  }

  const transporter = nodemailer.createTransport({
    host:   cfg.host,
    port:   cfg.port,
    secure: cfg.tls,
    auth:   { user: cfg.user, pass: cfg.pass },
  })

  await transporter.sendMail({
    from:    `"${cfg.fromName}" <${cfg.fromAddr}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  })

  await logEmail({ to, subject, success: true, sentBy: meta.sentBy, template: meta.template }, db)
  return { sent: true }
}

/**
 * Log an email attempt to EmailLog. Fire-and-forget — never throws.
 */
async function logEmail({ to, subject, success, errorMessage, sentBy, template }, db) {
  if (!db) return
  try {
    await db.request()
      .input('recipient',     require('mssql').NVarChar(255),        to || '')
      .input('template',      require('mssql').NVarChar(100),        template || '')
      .input('subject',       require('mssql').NVarChar(500),        subject || '')
      .input('success',       require('mssql').Bit,                  success ? 1 : 0)
      .input('errorMessage',  require('mssql').NVarChar(require('mssql').MAX), errorMessage || null)
      .input('sentBy',        require('mssql').NVarChar(255),        sentBy || null)
      .query(`INSERT INTO EmailLog (Recipient, Template, Subject, Success, ErrorMessage, SentBy, SentAt)
              VALUES (@recipient, @template, @subject, @success, @errorMessage, @sentBy, GETDATE())`)
  } catch (err) {
    console.error('[emailLog] Failed to log email:', err.message)
  }
}

module.exports = { sendEmail, logEmail, resolveEmailConfig }
