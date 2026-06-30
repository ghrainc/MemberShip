const express = require('express')
const cors = require('cors')
const sql = require('mssql')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const {
  SignatureRequestApi,
  SignatureRequestSendWithTemplateRequest,
  SubSignatureRequestTemplateSigner,
  SubCustomField,
} = require('@dropbox/sign')

const DROPBOX_SIGN_TEMPLATE_ID   = '48801a508aa8d04b909f28d75eec410c3dc34e3e'
const DROPBOX_SIGN_SIGNER_ROLE   = 'Authorized Rep'

async function sendSignatureRequest(formData, userEmail) {
  const api = new SignatureRequestApi()
  api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

  const firstName = formData.authorizedRepFirstName || ''
  const lastName  = formData.authorizedRepLastName  || ''
  const repName   = [firstName, lastName].filter(Boolean).join(' ') || userEmail

  const signer = new SubSignatureRequestTemplateSigner()
  signer.role         = DROPBOX_SIGN_SIGNER_ROLE
  signer.emailAddress = userEmail
  signer.name         = repName

  const owner1 = (formData.owners        || [])[0] || {}
  const owner2 = (formData.owners        || [])[1] || {}
  const owner3 = (formData.owners        || [])[2] || {}
  const bank1  = (formData.bankAccounts  || [])[0] || {}
  const bank2  = (formData.bankAccounts  || [])[1] || {}
  const bank3  = (formData.bankAccounts  || [])[2] || {}
  const ach    = formData.achInfoFor     || {}
  const own    = formData.ownershipType  || ''
  const biz    = formData.businessType   || ''
  const cond   = formData.storeCondition || ''
  const prop   = formData.businessProperty || ''

  // Build a SubCustomField — skip null/empty/false so DS doesn't error on blank required fields
  function cf(name, value) {
    if (value === undefined || value === null || value === '' || value === false) return null
    const f = new SubCustomField()
    f.name  = name
    f.value = String(value)
    return f
  }
  // Checkbox helper — only send when checked (unchecked checkboxes are left blank)
  const chk = (name, checked) => checked ? cf(name, '1') : null

  const customFields = [
    // ── Business identity ────────────────────────────────────────────────────
    cf('CorpName',     formData.memberName),
    cf('StoreName',    formData.dbaName || formData.memberName),
    cf('CorpEIN',      formData.ein),
    cf('CorpSalesTax', formData.salesTaxId),
    cf('PrevGHRAAC',   formData.previousGhraNumber),
    cf('Leased Size',  formData.storeSize),

    // ── Store address ────────────────────────────────────────────────────────
    cf('StoreAddress', formData.storeAddress),
    cf('StoreCity',    formData.storeCity),
    cf('StoreZip',     formData.storeZip),
    cf('StoreCounty',  formData.storeCounty),

    // ── Mailing address ──────────────────────────────────────────────────────
    cf('MailAddress',  formData.mailingAddress),
    cf('MailCity',     formData.mailingCity),
    cf('MailZip',      formData.mailingZip),
    cf('MailCounty',   formData.mailingCounty),

    // ── Contact ──────────────────────────────────────────────────────────────
    cf('StorePhone',   formData.storePhone),
    cf('StoreEmail',   formData.emailAddress),

    // ── Authorized rep (owner 1) ─────────────────────────────────────────────
    cf('AuthRep',      repName),
    cf('AuthRepTitle', owner1.title),
    cf('AuthRepPerc',  owner1.ownershipPercent != null ? `${owner1.ownershipPercent}%` : null),
    cf('AuthRepCell',  owner1.mobilePhone),
    cf('AuthRepDL',    owner1.driverLicense),
    cf('AuthRepState', owner1.stateIssued),

    // ── Owner 2 ──────────────────────────────────────────────────────────────
    cf('Owner2Name',   [owner2.firstName, owner2.lastName].filter(Boolean).join(' ') || null),
    cf('Owner2Title',  owner2.title),
    cf('Owner2Perc',   owner2.ownershipPercent != null ? `${owner2.ownershipPercent}%` : null),
    cf('Owner2Cell',   owner2.mobilePhone),
    cf('Owner2DL',     owner2.driverLicense),
    cf('Owner2State',  owner2.stateIssued),

    // ── Owner 3 ──────────────────────────────────────────────────────────────
    cf('Owner3Name',   [owner3.firstName, owner3.lastName].filter(Boolean).join(' ') || null),
    cf('Owner3Title',  owner3.title),
    cf('Owner3Perc',   owner3.ownershipPercent != null ? `${owner3.ownershipPercent}%` : null),
    cf('Owner3Cell',   owner3.mobilePhone),
    cf('Owner3DL',     owner3.driverLicense),
    cf('Owner3State',  owner3.stateIssued),

    // ── Bank accounts ────────────────────────────────────────────────────────
    cf('Bank1Name',    bank1.bankName),
    cf('Bank1Address', bank1.bankAddress),
    cf('Bank1Transit', bank1.transitAbaNumber),
    cf('Bank1Account', bank1.accountNumber),
    cf('Bank2Name',    bank2.bankName),
    cf('Bank2Address', bank2.bankAddress),
    cf('Bank2Transit', bank2.transitAbaNumber),
    cf('Bank2Account', bank2.accountNumber),
    cf('Bank3Name',    bank3.bankName),
    cf('Bank3Address', bank3.bankAddress),
    cf('Bank3Transit', bank3.transitAbaNumber),
    cf('Bank3Account', bank3.accountNumber),

    // ── Ownership type ───────────────────────────────────────────────────────
    chk('Sole',               own === 'sole-proprietor'),
    chk('Partnership',        own === 'partnership'),
    chk('LimitedPartnership', own === 'limited-partnership'),
    chk('Corp',               own === 'corporation'),
    chk('LLC',                own === 'llc'),

    // ── Business type ────────────────────────────────────────────────────────
    chk('StoreWithFuel',    biz === 'with-fuel'),
    chk('StoreWithoutFuel', biz === 'without-fuel'),

    // ── Store condition / property ───────────────────────────────────────────
    chk('Existing Store', cond === 'existing'),
    chk('Remodeled',      cond === 'remodeled'),
    chk('BrandNew',       cond === 'brand-new'),
    chk('Owned',          prop === 'owned'),
    chk('Leased',         prop === 'leased'),

    // ── Previous GHRA membership ─────────────────────────────────────────────
    chk('PrevGHRAYes', !!formData.previousMember),
    chk('PrevGHRANo',  !formData.previousMember),

    // ── ACH bank checkboxes ──────────────────────────────────────────────────
    chk('CorpBank1',  !!ach.corporate),
    chk('WHBank',     !!ach.warehouse),
    chk('FuelsBank1', !!ach.fuels),
    chk('CorpBank2',  !!ach.corporate),
    chk('WHBank2',    !!ach.warehouse),
    chk('FuelsBank2', !!ach.fuels),
    chk('CorpBank3',  !!ach.corporate),
    chk('FuelsBank3', !!ach.fuels),

    // ── Other ────────────────────────────────────────────────────────────────
    chk('OldSpanner', !!formData.storeSpannerBoard),
  ].filter(Boolean)

  const request = new SignatureRequestSendWithTemplateRequest()
  request.templateIds  = [DROPBOX_SIGN_TEMPLATE_ID]
  request.signers      = [signer]
  request.customFields = customFields
  request.testMode     = true

  const response = await api.signatureRequestSendWithTemplate(request)
  return response.body.signatureRequest.signatureRequestId
}

// nodemailer is optional — email notifications silently skipped if not installed or configured
let nodemailer
try { nodemailer = require('nodemailer') } catch {}

function createTransporter() {
  if (!nodemailer || !process.env.EMAIL_HOST) return null
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  })
}

async function sendStatusEmail(toEmail, storeName, newStatus, notes) {
  const transporter = createTransporter()
  if (!transporter) return
  const approved = newStatus === 'approved'
  const subject = approved
    ? 'Your GHRA Membership Application Has Been Approved'
    : 'Your GHRA Membership Application Requires Revision'
  const html = approved
    ? `<p>Congratulations! Your GHRA membership application for <strong>${storeName}</strong> has been approved.</p><p>We look forward to welcoming you as a member.</p>`
    : `<p>Your GHRA membership application for <strong>${storeName}</strong> has been reviewed and requires revision.</p>${notes ? `<p><strong>Reviewer comments:</strong> ${notes}</p>` : ''}<p>Please log in to your account to edit and resubmit your application.</p>`
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject,
      html
    })
  } catch (err) {
    console.error('Email send failed:', err.message)
  }
}

const PORT = process.env.PORT || 3001

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXTENSIONS.has(ext)) cb(null, true)
    else cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'))
  }
})

const app = express()
app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/ }))
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'UploadedDocuments')))

// ── DB connection ────────────────────────────────────────────────────────────

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  connectionTimeout: 5000,
  requestTimeout: 5000,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

let pool

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig)
    console.log('Connected to SQL Server:', process.env.DB_SERVER)
  }
  return pool
}

// ── Schema migration ─────────────────────────────────────────────────────────

async function ensureSchema() {
  try {
    const db = await getPool()
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Users') AND name = 'MustChangePassword'
      )
        ALTER TABLE Users ADD MustChangePassword BIT NOT NULL DEFAULT 0
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'CommentsHistory'
      )
        ALTER TABLE Applications ADD CommentsHistory NVARCHAR(MAX) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'SignatureRequestId'
      )
        ALTER TABLE Applications ADD SignatureRequestId NVARCHAR(255) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'SignedAt'
      )
        ALTER TABLE Applications ADD SignedAt DATETIME NULL
    `)
  } catch (err) {
    console.error('Schema migration failed:', err.message)
  }
}

// ── Auth middleware ──────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No token provided' })
  const token = header.replace('Bearer ', '')
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ── Auth routes ──────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const db = await getPool()

    const existing = await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT Id FROM Users WHERE Email = @email')

    if (existing.recordset.length > 0)
      return res.status(400).json({ error: 'Email already registered. Please login instead.' })

    const passwordHash = await bcrypt.hash(password, 10)

    await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, 'member')
      .query('INSERT INTO Users (Email, PasswordHash, Role) VALUES (@email, @passwordHash, @role)')

    const token = jwt.sign({ email: email.toLowerCase(), role: 'member' }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ email: email.toLowerCase(), role: 'member', token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login  (members + employees)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const db = await getPool()
    const result = await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT Id, Email, PasswordHash, Role, MustChangePassword FROM Users WHERE Email = @email')

    if (!result.recordset.length)
      return res.status(401).json({ error: 'Invalid email or password' })

    const user = result.recordset[0]
    const valid = await bcrypt.compare(password, user.PasswordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const mustChangePassword = user.MustChangePassword === true || user.MustChangePassword === 1
    const token = jwt.sign(
      { email: user.Email, role: user.Role, mustChangePassword },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ email: user.Email, role: user.Role, token, mustChangePassword })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/change-password  — authenticated member changes their password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { newPassword } = req.body
  if (!newPassword) return res.status(400).json({ error: 'New password is required' })
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const db = await getPool()
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.request()
      .input('email', sql.NVarChar, req.user.email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('UPDATE Users SET PasswordHash = @passwordHash, MustChangePassword = 0 WHERE Email = @email')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/create-member  — employee creates a new member account
app.post('/api/auth/create-member', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const db = await getPool()
    const existing = await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT Id FROM Users WHERE Email = @email')
    if (existing.recordset.length > 0)
      return res.status(400).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, 'member')
      .query('INSERT INTO Users (Email, PasswordHash, Role, MustChangePassword) VALUES (@email, @passwordHash, @role, 1)')

    res.json({ success: true, email: email.toLowerCase() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Application routes ───────────────────────────────────────────────────────

// POST /api/applications/draft  — create or update draft on each Next press
app.post('/api/applications/draft', authMiddleware, async (req, res) => {
  const { applicationId, currentStep, formData } = req.body
  const userEmail = req.user.email

  try {
    const db = await getPool()
    const storeName = formData.memberName || formData.storeNameCertification || ''
    const storeAddress = [formData.storeAddress, formData.storeCity, formData.storeZip]
      .filter(Boolean).join(', ')

    if (applicationId) {
      // Update existing draft
      await db.request()
        .input('id', sql.Int, applicationId)
        .input('email', sql.NVarChar, userEmail)
        .input('currentStep', sql.Int, currentStep)
        .input('formData', sql.NVarChar(sql.MAX), JSON.stringify(formData))
        .input('storeName', sql.NVarChar, storeName)
        .input('storeAddress', sql.NVarChar, storeAddress)
        .query(`UPDATE Applications
                SET CurrentStep = @currentStep,
                    FormData = @formData,
                    StoreName = @storeName,
                    StoreAddress = @storeAddress,
                    UpdatedAt = GETDATE()
                WHERE Id = @id AND UserEmail = @email`)
      res.json({ applicationId })
    } else {
      // Create new draft
      const result = await db.request()
        .input('email', sql.NVarChar, userEmail)
        .input('currentStep', sql.Int, currentStep)
        .input('formData', sql.NVarChar(sql.MAX), JSON.stringify(formData))
        .input('storeName', sql.NVarChar, storeName)
        .input('storeAddress', sql.NVarChar, storeAddress)
        .query(`INSERT INTO Applications (UserEmail, StoreName, StoreAddress, Status, CurrentStep, FormData)
                OUTPUT INSERTED.Id
                VALUES (@email, @storeName, @storeAddress, 'draft', @currentStep, @formData)`)
      res.json({ applicationId: result.recordset[0].Id })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/applications/submit  — final submission
app.post('/api/applications/submit', authMiddleware, async (req, res) => {
  const { applicationId, formData } = req.body
  const userEmail = req.user.email

  try {
    const db = await getPool()
    const storeName = formData.memberName || formData.storeNameCertification || ''
    const storeAddress = [formData.storeAddress, formData.storeCity, formData.storeZip]
      .filter(Boolean).join(', ')

    if (applicationId) {
      await db.request()
        .input('id', sql.Int, applicationId)
        .input('email', sql.NVarChar, userEmail)
        .input('formData', sql.NVarChar(sql.MAX), JSON.stringify(formData))
        .input('storeName', sql.NVarChar, storeName)
        .input('storeAddress', sql.NVarChar, storeAddress)
        .query(`UPDATE Applications
                SET Status = 'submitted',
                    FormData = @formData,
                    StoreName = @storeName,
                    StoreAddress = @storeAddress,
                    UpdatedAt = GETDATE()
                WHERE Id = @id AND UserEmail = @email`)
      res.json({ applicationId })
    } else {
      const result = await db.request()
        .input('email', sql.NVarChar, userEmail)
        .input('formData', sql.NVarChar(sql.MAX), JSON.stringify(formData))
        .input('storeName', sql.NVarChar, storeName)
        .input('storeAddress', sql.NVarChar, storeAddress)
        .query(`INSERT INTO Applications (UserEmail, StoreName, StoreAddress, Status, CurrentStep, FormData)
                OUTPUT INSERTED.Id
                VALUES (@email, @storeName, @storeAddress, 'submitted', 10, @formData)`)
      res.json({ applicationId: result.recordset[0].Id })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/applications/my  — current user's applications
app.get('/api/applications/my', authMiddleware, async (req, res) => {
  try {
    const db = await getPool()
    const result = await db.request()
      .input('email', sql.NVarChar, req.user.email)
      .query('SELECT Id, StoreName, StoreAddress, Status, CurrentStep, CreatedAt, UpdatedAt FROM Applications WHERE UserEmail = @email ORDER BY CreatedAt DESC')
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/applications/all  — employee only
app.get('/api/applications/all', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request()
      .query(`SELECT Id, UserEmail, StoreName, StoreAddress, Status, CurrentStep, ReviewedBy, ReviewedAt, Notes, CreatedAt, FormData
              FROM Applications ORDER BY CreatedAt DESC`)
    const rows = result.recordset.map(row => {
      let fd = {}
      try { fd = JSON.parse(row.FormData || '{}') } catch {}
      return {
        ...row,
        FormData: undefined,
        AuthRepFirstName: fd.authorizedRepFirstName || '',
        AuthRepLastName: fd.authorizedRepLastName || ''
      }
    })
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/applications/:id
app.get('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Applications WHERE Id = @id')
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' })
    const row = result.recordset[0]
    row.FormData = JSON.parse(row.FormData)
    try { row.CommentsHistory = JSON.parse(row.CommentsHistory || '[]') } catch { row.CommentsHistory = [] }
    res.json(row)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/applications/:id/status  — employee review
app.patch('/api/applications/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { status, notes } = req.body
  try {
    const db = await getPool()

    // Load existing history to append to it
    const existing = await db.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT CommentsHistory FROM Applications WHERE Id = @id')
    let history = []
    try { history = JSON.parse(existing.recordset[0]?.CommentsHistory || '[]') } catch {}
    if (notes) {
      history.push({
        status,
        comment: notes,
        reviewedBy: req.user.email,
        reviewedAt: new Date().toISOString()
      })
    }

    await db.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar(sql.MAX), notes || '')
      .input('reviewedBy', sql.NVarChar, req.user.email)
      .input('history', sql.NVarChar(sql.MAX), JSON.stringify(history))
      .query(`UPDATE Applications
              SET Status = @status, Notes = @notes, ReviewedBy = @reviewedBy, ReviewedAt = GETDATE(), CommentsHistory = @history
              WHERE Id = @id`)

    if (status === 'approved') {
      // Load full FormData + email to build the signature request
      const fullApp = await db.request()
        .input('id2', sql.Int, req.params.id)
        .query('SELECT FormData, UserEmail FROM Applications WHERE Id = @id2')

      if (!fullApp.recordset.length) return res.status(404).json({ error: 'Not found' })
      const { FormData: rawFormData, UserEmail } = fullApp.recordset[0]
      let fd = {}
      try { fd = JSON.parse(rawFormData || '{}') } catch {}

      try {
        const signatureRequestId = await sendSignatureRequest(fd, UserEmail)
        await db.request()
          .input('sigId', sql.NVarChar, signatureRequestId)
          .input('id3', sql.Int, req.params.id)
          .query(`UPDATE Applications SET Status = 'pending_signature', SignatureRequestId = @sigId WHERE Id = @id3`)
        return res.json({ success: true, status: 'pending_signature', signatureRequestId })
      } catch (dsErr) {
        const detail = dsErr.body?.error?.errorMsg || dsErr.message || 'Unknown error'
        console.error('Dropbox Sign send failed:', detail)
        return res.status(500).json({
          error: `Application approved but signature request failed to send: ${detail}`
        })
      }
    }

    // For rejected / any other status — send email and return success
    const appRow = await db.request()
      .input('id4', sql.Int, req.params.id)
      .query('SELECT UserEmail, StoreName FROM Applications WHERE Id = @id4')
    if (appRow.recordset.length > 0) {
      const { UserEmail, StoreName } = appRow.recordset[0]
      sendStatusEmail(UserEmail, StoreName, status, notes).catch(() => {})
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/applications/:id  — employee updates application form data
app.put('/api/applications/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { formData } = req.body
  try {
    const db = await getPool()
    const storeName = formData.memberName || formData.storeNameCertification || ''
    const storeAddress = [formData.storeAddress, formData.storeCity, formData.storeZip]
      .filter(Boolean).join(', ')
    await db.request()
      .input('id', sql.Int, req.params.id)
      .input('formData', sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .input('storeName', sql.NVarChar, storeName)
      .input('storeAddress', sql.NVarChar, storeAddress)
      .query(`UPDATE Applications
              SET FormData = @formData, StoreName = @storeName, StoreAddress = @storeAddress, UpdatedAt = GETDATE()
              WHERE Id = @id`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Document upload ──────────────────────────────────────────────────────────

// POST /api/documents/upload
app.post('/api/documents/upload', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const { applicationId, docId } = req.body
    if (!applicationId) return res.status(400).json({ error: 'applicationId is required' })

    const ext = path.extname(req.file.originalname).toLowerCase()
    const filename = `${docId}${ext}`
    const dir = path.join(__dirname, 'UploadedDocuments', String(applicationId))

    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, filename), req.file.buffer)

    res.json({
      filename,
      originalName: req.file.originalname,
      url: `http://localhost:${PORT}/uploads/${applicationId}/${filename}`
    })
  })
})

// DELETE /api/documents/:applicationId/:docId  — remove an uploaded file
app.delete('/api/documents/:applicationId/:docId', authMiddleware, (req, res) => {
  const { applicationId, docId } = req.params
  const dir = path.join(__dirname, 'UploadedDocuments', String(applicationId))

  // Find the file that starts with docId (extension may vary)
  let deleted = false
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const nameWithoutExt = path.basename(file, path.extname(file))
      if (nameWithoutExt === docId) {
        fs.unlinkSync(path.join(dir, file))
        deleted = true
        break
      }
    }
  }

  res.json({ deleted })
})

// ── Dropbox Sign test ────────────────────────────────────────────────────────

// POST /api/test/dropbox-sign  — employee only, sends a dummy signature request
app.post('/api/test/dropbox-sign', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })

  const { signerEmail, signerName } = req.body
  if (!signerEmail) return res.status(400).json({ error: 'signerEmail is required' })

  const firstName = signerName ? signerName.split(' ')[0] : 'Test'
  const lastName  = signerName ? signerName.split(' ').slice(1).join(' ') || 'Signer' : 'Signer'

  const dummyFormData = {
    memberName:                'TEST Company LLC',
    dbaName:                   'TEST Store DBA',
    ownershipType:             'llc',
    businessType:              'with-fuel',
    storeCondition:            'existing',
    businessProperty:          'leased',
    storeSize:                 '2500',
    ein:                       '12-3456789',
    salesTaxId:                '1-23-4567890-1',
    previousMember:            false,
    previousGhraNumber:        '',
    storeAddress:              '1234 Main Street',
    storeCity:                 'Houston',
    storeZip:                  '77001',
    storeCounty:               'Harris',
    mailingAddress:            '1234 Main Street',
    mailingCity:               'Houston',
    mailingZip:                '77001',
    mailingCounty:             'Harris',
    storePhone:                '713-555-0100',
    emailAddress:              signerEmail,
    authorizedRepFirstName:    firstName,
    authorizedRepLastName:     lastName,
    owners: [{
      firstName:        firstName,
      lastName:         lastName,
      title:            'Owner',
      ownershipPercent: 100,
      mobilePhone:      '713-555-0101',
      driverLicense:    'TX12345678',
      stateIssued:      'TX',
    }],
    bankAccounts: [{
      bankName:          'First National Bank',
      bankAddress:       '100 Bank Street, Houston TX 77002',
      transitAbaNumber:  '021000021',
      accountNumber:     '123456789',
    }],
    achInfoFor: { corporate: true, warehouse: false, fuels: false },
    storeSpannerBoard: false,
  }

  try {
    const signatureRequestId = await sendSignatureRequest(dummyFormData, signerEmail)
    res.json({ success: true, signatureRequestId })
  } catch (err) {
    const detail = err.body?.error?.errorMsg || err.message || 'Unknown error'
    console.error('Dropbox Sign test failed:', detail)
    res.status(500).json({ error: detail })
  }
})

// ── Dropbox Sign webhook ─────────────────────────────────────────────────────

// POST /api/webhooks/dropbox-sign  — account-level callback (no JWT)
// Dropbox Sign delivers events as multipart/form-data with a field named "json"
app.post('/api/webhooks/dropbox-sign', upload.none(), async (req, res) => {
  // Always respond 200 with this exact body or Dropbox Sign marks the delivery failed
  res.set('Content-Type', 'text/plain')

  let event
  try {
    event = JSON.parse(req.body?.json || '{}')
  } catch {
    return res.status(200).send('Hello API Event Received')
  }

  const eventType = event?.event?.event_type
  if (eventType === 'signature_request_signed' || eventType === 'signature_request_all_signed') {
    const sigReqId = event?.signature_request?.signature_request_id
    if (sigReqId) {
      try {
        const db = await getPool()
        await db.request()
          .input('sigId', sql.NVarChar, sigReqId)
          .query(`UPDATE Applications SET Status = 'signed', SignedAt = GETDATE() WHERE SignatureRequestId = @sigId`)
      } catch (err) {
        console.error('Webhook DB update failed:', err.message)
      }
    }
  }

  return res.status(200).send('Hello API Event Received')
})

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  try {
    await getPool()
    await ensureSchema()
  } catch (err) {
    console.error('DB connection failed:', err.message)
  }
})
