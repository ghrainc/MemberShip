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
  SignatureRequestRemindRequest,
  SignatureRequestUpdateRequest,
  SubSignatureRequestTemplateSigner,
  SubCustomField,
  TemplateApi,
} = require('@dropbox/sign')

const { buildReferenceCustomFields } = require('./dropboxSignMapping')

const DROPBOX_SIGN_TEMPLATE_ID            = '48801a508aa8d04b909f28d75eec410c3dc34e3e'
const DROPBOX_SIGN_SIGNER_ROLE            = 'Authorized Rep'
const DROPBOX_SIGN_REFERENCES_TEMPLATE_ID = process.env.DROPBOX_SIGN_REFERENCES_TEMPLATE_ID

// boardSigners = { verification: { firstName, lastName, email }, approved: { firstName, lastName, email } }
// reviewerEmail = employee who approved the application (used in the signing request message)
async function sendSignatureRequest(formData, userEmail, boardSigners, reviewerEmail) {
  const api = new SignatureRequestApi()
  api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

  // Verify template has the expected signer roles AND required custom fields
  const REQUIRED_ROLES = [
    DROPBOX_SIGN_SIGNER_ROLE,
    'Verification: Elected Board Signer',
    'Approved: Elected Board Signer',
  ]
  const REQUIRED_CUSTOM_FIELDS = ['VerificationFirstName', 'VerificationLastName', 'ApprovedFirstName', 'ApprovedLastName']
  const templateApi = new TemplateApi()
  templateApi.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY
  const tmplRes = await templateApi.templateGet(DROPBOX_SIGN_TEMPLATE_ID)
  const presentRoles      = (tmplRes.body.template.signerRoles   || []).map(r => r.name)
  const presentFieldNames = (tmplRes.body.template.customFields  || []).map(f => f.name)
  for (const required of REQUIRED_ROLES) {
    if (!presentRoles.includes(required)) {
      throw new Error(
        `Template is missing required signer role "${required}". ` +
        `Template has: ${presentRoles.length ? presentRoles.join(', ') : '(none)'}`
      )
    }
  }
  for (const required of REQUIRED_CUSTOM_FIELDS) {
    if (!presentFieldNames.includes(required)) {
      throw new Error(
        `Template is missing required custom field "${required}". ` +
        `Ensure the field exists as an API-fillable (no signer assigned) text field in the Dropbox Sign template.`
      )
    }
  }

  const owners = formData.owners || []
  const owner1 = owners[0] || {}
  const repName = [owner1.firstName, owner1.lastName].filter(Boolean).join(' ') || userEmail

  const signer = new SubSignatureRequestTemplateSigner()
  signer.role         = DROPBOX_SIGN_SIGNER_ROLE
  signer.emailAddress = userEmail
  signer.name         = repName

  const bank1 = (formData.bankAccounts || [])[0] || {}
  const bank2 = (formData.bankAccounts || [])[1] || {}
  const bank3 = (formData.bankAccounts || [])[2] || {}
  const cards = formData.authorizedCardHolders || []
  const card1 = cards[0] || {}
  const card2 = cards[1] || {}
  const card3 = cards[2] || {}
  const ach   = formData.achInfoFor      || {}
  const own   = formData.ownershipType   || ''
  const biz   = formData.businessType    || ''
  const cond  = formData.storeCondition  || ''
  const prop  = formData.businessProperty || ''

  // Skip null/empty/false — DS errors on unrecognised blank fields
  function cf(name, value) {
    if (value === undefined || value === null || value === '' || value === false) return null
    const f = new SubCustomField()
    f.name  = name
    f.value = String(value)
    return f
  }
  // Checkboxes: only send when checked
  const chk = (name, checked) => checked ? cf(name, '1') : null
  // Format ownership percent
  const pct = (v) => (v != null && v !== '') ? `${v}%` : null
  // Combine bank address parts into one string
  const bankAddr = (b) => {
    const parts = [b.bankAddress, b.bankCity, b.bankState, b.bankZip].filter(Boolean)
    return parts.length ? parts.join(', ') : null
  }

  const customFields = [
    // ── Business identity ─────────────────────────────────────────────────────
    cf('CorpName',     formData.memberName),
    cf('StoreName',    formData.dbaName || formData.memberName),
    cf('CorpEIN',      formData.ein),
    cf('CorpSalesTax', formData.salesTaxId),
    cf('PrevGHRAAC',   formData.previousGhraNumber),
    cf('Leased Size',  formData.storeSize),

    // ── Store address ─────────────────────────────────────────────────────────
    cf('StoreAddress', formData.storeAddress),
    cf('StoreCity',    formData.storeCity),
    cf('StoreZip',     formData.storeZip),
    cf('StoreState',   formData.storeState),
    cf('StoreCounty',  formData.storeCounty),

    // ── Mailing address ───────────────────────────────────────────────────────
    cf('MailAddress',  formData.mailingAddress),
    cf('MailCity',     formData.mailingCity),
    //cf('MailState',    formData.mailingState),
    cf('MailZip',      formData.mailingZip),
    cf('MailCounty',   formData.mailingCounty),

    // ── Contact ───────────────────────────────────────────────────────────────
    cf('StorePhone',   formData.officePhone),
    cf('StoreFax',     formData.faxPhone),
    cf('StoreEmail',   formData.emailAddress),

    // ── Owner 1 (AuthRep) ─────────────────────────────────────────────────────
    cf('AuthRep',          repName),
    cf('AuthRepFirstName', owner1.firstName),
    cf('AuthRepLastName',  owner1.lastName),
    cf('AuthRepTitle',     owner1.title),
    cf('AuthRepPerc',      pct(owner1.ownershipPercent)),
    cf('AuthRepCell',      owner1.mobilePhone),
    cf('AuthRepDL',        owner1.driverLicense),
    cf('AuthRepState',     owner1.stateIssued),
    // AuthRepSS — not yet collected in form

    // ── Owners 2–10 (dynamic) ─────────────────────────────────────────────────
    ...Array.from({ length: 9 }, (_, i) => {
      const n = i + 2
      const o = owners[i + 1] || {}
      return [
        cf(`Owner${n}FirstName`, o.firstName),
        cf(`Owner${n}LastName`,  o.lastName),
        cf(`Owner${n}Title`,     o.title),
        cf(`Owner${n}Percent`,   pct(o.ownershipPercent)),
        cf(`Owner${n}Cell`,      o.mobilePhone),
        cf(`Owner${n}DL`,        o.driverLicense),
        cf(`Owner${n}State`,     o.stateIssued),
        // Owner{n}SS — not yet collected in form
      ]
    }).flat(),

    // ── Store manager ─────────────────────────────────────────────────────────
    cf('StoreManagerFirstName', formData.storeManagerFirstName),
    cf('StoreManagerLastName',  formData.storeManagerLastName),
    cf('StoreManagerTitle',     formData.storeManagerTitle),
    cf('StoreManagerDL',        formData.storeManagerDriverLicense),
    cf('StoreManagerCell',      formData.storeManagerMobile),

    // ── Bank accounts (address = street + city + state + zip combined) ────────
    cf('Bank1Name',    bank1.bankName),
    cf('Bank1Address', bankAddr(bank1)),
    cf('Bank1Transit', bank1.transitAbaNumber),
    cf('Bank1Account', bank1.accountNumber),
    cf('Bank2Name',    bank2.bankName),
    cf('Bank2Address', bankAddr(bank2)),
    cf('Bank2Transit', bank2.transitAbaNumber),
    cf('Bank2Account', bank2.accountNumber),
    cf('Bank3Name',    bank3.bankName),
    cf('Bank3Address', bankAddr(bank3)),
    cf('Bank3Transit', bank3.transitAbaNumber),
    cf('Bank3Account', bank3.accountNumber),

    // ── References ────────────────────────────────────────────────────────────
    /*cf('reference1Email',      formData.reference1Email),
    cf('reference1Company',    formData.reference1Company),
    cf('reference1GhraNumber', formData.reference1GhraNumber),
    cf('reference1RepName',    formData.reference1RepName),
    cf('reference2Email',      formData.reference2Email),
    cf('reference2Company',    formData.reference2Company),
    cf('reference2GhraNumber', formData.reference2GhraNumber),
    cf('reference2RepName',    formData.reference2RepName),*/

    // ── Donations ─────────────────────────────────────────────────────────────
    chk('AKDNYES', formData.akdnContribute === 'yes'),
    chk('AKDNNO',  formData.akdnContribute === 'no'),
    cf('AKDNMore', formData.akdnContribute === 'yes' ? formData.akdnAmount : null),
    chk('HFBYES',  formData.hfbContribute === 'yes'),
    chk('HFBNO',   formData.hfbContribute === 'no'),
    cf('HFBMORE',  formData.hfbContribute === 'yes' ? formData.hfbAmount : null),

    // ── Warehouse delivery & card holders ─────────────────────────────────────
    chk('WHDeliveryYes', !!formData.warehouseDelivery),
    chk('WHDeliveryNo',  !formData.warehouseDelivery),
    cf('WHCard1Name', [card1.firstName, card1.lastName].filter(Boolean).join(' ') || null),
    cf('WHCard1DL',   card1.drivingLicense),
    cf('WHCard2Name', [card2.firstName, card2.lastName].filter(Boolean).join(' ') || null),
    cf('WHCard2DL',   card2.drivingLicense),
    cf('WHCard3Name', [card3.firstName, card3.lastName].filter(Boolean).join(' ') || null),
    cf('WHCard3DL',   card3.drivingLicense),

    // ── Ownership type ────────────────────────────────────────────────────────
    chk('Sole',        own === 'sole-proprietor'),
    chk('Partnership', own === 'partnership'),
    chk('Corp',        own === 'c-corp' || own === 'corporation'), // 'corporation' = legacy
    chk('SCorp',       own === 's-corp'),
    chk('SCCorp',      own === 'c-corp' || own === 'corporation' || own === 's-corp'),
    chk('LLC',         own === 'llc'),

    // ── Business type ─────────────────────────────────────────────────────────
    chk('StoreWithFuel',    biz === 'with-fuel'),
    chk('StoreWithoutFuel', biz === 'without-fuel'),

    // ── Store condition / property ────────────────────────────────────────────
    chk('Existing Store', cond === 'existing'),
    chk('Remodeled',      cond === 'remodeled'),
    chk('BrandNew',       cond === 'brand-new'),
    chk('Owned',          prop === 'owned'),
    chk('Leased',         prop === 'leased'),

    // ── Previous GHRA membership ──────────────────────────────────────────────
    chk('PrevGHRAYes', !!formData.previousMember),
    chk('PrevGHRANo',  !formData.previousMember),

    // ── ACH checkboxes: CorpBank{n} / WHBank{n} / FuelsBank{n} per bank slot ──
    ...(formData.bankAccounts || []).flatMap((bank, idx) => {
      const n = idx + 1
      const m = formData.achToBankMapping || {}
      return [
        chk(`CorpBank${n}`,  !!(ach.corporate && m.corporate === bank.id)),
        chk(`WHBank${n}`,    !!(ach.warehouse  && m.warehouse  === bank.id)),
        chk(`FuelsBank${n}`, !!(ach.fuels      && m.fuels      === bank.id)),
      ]
    }),

    // ── Spanner Board ─────────────────────────────────────────────────────────
    chk('SpannerYes',        formData.storeSpannerBoard === 'yes'),
    chk('SpannerNo',         formData.storeSpannerBoard === 'no'),
    chk('SpannerPrevMember', formData.storeSpannerBoard === 'prevMember'),

    // Board signer names — pre-filled into the document from our DB values
    cf('VerificationFirstName', boardSigners?.verification?.firstName),
    cf('VerificationLastName',  boardSigners?.verification?.lastName),
    cf('ApprovedFirstName',     boardSigners?.approved?.firstName),
    cf('ApprovedLastName',      boardSigners?.approved?.lastName),
  ].filter(Boolean)

  console.log('=== DS custom fields being sent ===')
  console.log(JSON.stringify(customFields, null, 2))
  console.log('===================================')

  const verificationSigner = new SubSignatureRequestTemplateSigner()
  verificationSigner.role         = 'Verification: Elected Board Signer'
  verificationSigner.emailAddress = boardSigners.verification.email
  verificationSigner.name         = [boardSigners.verification.firstName, boardSigners.verification.lastName].filter(Boolean).join(' ')

  const approvedSigner = new SubSignatureRequestTemplateSigner()
  approvedSigner.role         = 'Approved: Elected Board Signer'
  approvedSigner.emailAddress = boardSigners.approved.email
  approvedSigner.name         = [boardSigners.approved.firstName, boardSigners.approved.lastName].filter(Boolean).join(' ')

  const request = new SignatureRequestSendWithTemplateRequest()
  request.templateIds  = [DROPBOX_SIGN_TEMPLATE_ID]
  request.signers      = [signer, verificationSigner, approvedSigner]
  request.customFields = customFields
  request.testMode     = true
  if (reviewerEmail) {
    request.subject = 'GHRA Membership Application — Signature Required'
    request.message = `Your signature is required for the GHRA Membership Application. This request was sent by ${reviewerEmail}.`
  }

  const response = await api.signatureRequestSendWithTemplate(request)
  const sr   = response.body.signatureRequest
  const sigs = sr.signatures || []
  const vSig = sigs.find(s => s.signerRole === 'Verification: Elected Board Signer')
  const aSig = sigs.find(s => s.signerRole === 'Approved: Elected Board Signer')
  return {
    signatureRequestId:      sr.signatureRequestId,
    verificationSignatureId: vSig?.signatureId || null,
    approvedSignatureId:     aSig?.signatureId || null,
  }
}

async function sendReferencesRequest(formData) {
  if (!DROPBOX_SIGN_REFERENCES_TEMPLATE_ID) {
    throw new Error('DROPBOX_SIGN_REFERENCES_TEMPLATE_ID is not set in .env')
  }

  const ref1Email = (formData.reference1Email || '').trim()
  const ref1Name  = (formData.reference1RepName || '').trim() || 'Reference 1'
  const ref2Email = (formData.reference2Email || '').trim()
  const ref2Name  = (formData.reference2RepName || '').trim() || 'Reference 2'

  if (!ref1Email || !ref2Email) {
    throw new Error('Both reference email addresses are required to send the references signature request')
  }

  const api = new SignatureRequestApi()
  api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

  const signer1 = new SubSignatureRequestTemplateSigner()
  signer1.role         = 'Reference 1 - Membership Application'
  signer1.emailAddress = ref1Email
  signer1.name         = ref1Name

  const signer2 = new SubSignatureRequestTemplateSigner()
  signer2.role         = 'Reference 2 - Membership Application'
  signer2.emailAddress = ref2Email
  signer2.name         = ref2Name

  const request = new SignatureRequestSendWithTemplateRequest()
  request.templateIds  = [DROPBOX_SIGN_REFERENCES_TEMPLATE_ID]
  request.signers      = [signer1, signer2]
  request.customFields = buildReferenceCustomFields(formData)
  request.testMode     = true

  console.log('=== References DS signers ===')
  console.log(JSON.stringify(request.signers, null, 2))
  console.log('=============================')

  const response = await api.signatureRequestSendWithTemplate(request)
  const sr   = response.body.signatureRequest
  const sigs = sr.signatures || []
  const s1   = sigs.find(s => s.signerRole === 'Reference 1 - Membership Application')
  const s2   = sigs.find(s => s.signerRole === 'Reference 2 - Membership Application')
  return {
    signatureRequestId: sr.signatureRequestId,
    ref1SignatureId:    s1?.signatureId || null,
    ref2SignatureId:    s2?.signatureId || null,
  }
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
app.use(cors({ origin: /^http:\/\/(localhost|ghra-memb)(:\d+)?$/ }))
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
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'ReferencesSignatureRequestId'
      )
        ALTER TABLE Applications ADD ReferencesSignatureRequestId NVARCHAR(255) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'ReferencesSignatureStatus'
      )
        ALTER TABLE Applications ADD ReferencesSignatureStatus NVARCHAR(50) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'ReferencesSignedAt'
      )
        ALTER TABLE Applications ADD ReferencesSignedAt DATETIME NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'Ref1SignatureId'
      )
        ALTER TABLE Applications ADD Ref1SignatureId NVARCHAR(255) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'Ref2SignatureId'
      )
        ALTER TABLE Applications ADD Ref2SignatureId NVARCHAR(255) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'Ref1SignatureStatus'
      )
        ALTER TABLE Applications ADD Ref1SignatureStatus NVARCHAR(50) NULL
    `)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Applications') AND name = 'Ref2SignatureStatus'
      )
        ALTER TABLE Applications ADD Ref2SignatureStatus NVARCHAR(50) NULL
    `)
    // Board signer columns (on the main membership signature request)
    const boardCols = [
      ['BoardSignerVerificationFirstName', 'NVARCHAR(100)'],
      ['BoardSignerVerificationLastName',  'NVARCHAR(100)'],
      ['BoardSignerVerificationEmail',     'NVARCHAR(255)'],
      ['VerificationSignatureId',          'NVARCHAR(255)'],
      ['VerificationSignatureStatus',      'NVARCHAR(50)'],
      ['VerificationSignedAt',             'DATETIME'],
      ['BoardSignerApprovedFirstName',     'NVARCHAR(100)'],
      ['BoardSignerApprovedLastName',      'NVARCHAR(100)'],
      ['BoardSignerApprovedEmail',         'NVARCHAR(255)'],
      ['ApprovedSignatureId',              'NVARCHAR(255)'],
      ['ApprovedSignatureStatus',          'NVARCHAR(50)'],
      ['ApprovedSignedAt',                 'DATETIME'],
    ]
    for (const [col, type] of boardCols) {
      await db.request().query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns
          WHERE object_id = OBJECT_ID('Applications') AND name = '${col}'
        )
          ALTER TABLE Applications ADD ${col} ${type} NULL
      `)
    }
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

// ── Member account management (employee-only) ────────────────────────────────

// GET /api/employees/members — list all member accounts (with app count + store name)
app.get('/api/employees/members', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request()
      .query(`SELECT u.Id, u.Email, u.MustChangePassword, u.CreatedAt,
                     COUNT(a.Id) AS ApplicationCount,
                     MAX(a.StoreName) AS StoreName
              FROM Users u
              LEFT JOIN Applications a ON a.UserEmail = u.Email
              WHERE u.Role = 'member'
              GROUP BY u.Id, u.Email, u.MustChangePassword, u.CreatedAt
              ORDER BY u.CreatedAt DESC`)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/employees/members  — employee creates a member login with employee-chosen password
app.post('/api/employees/members', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const db = await getPool()
    const existing = await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT Id FROM Users WHERE Email = @email')
    if (existing.recordset.length > 0)
      return res.status(400).json({ error: 'An account with that email already exists' })

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

// POST /api/employees/members/:id/reset-password  — employee resets a member's password
app.post('/api/employees/members/:id/reset-password', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password is required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT Id FROM Users WHERE Id = @id AND Role = 'member'`)
    if (!result.recordset.length)
      return res.status(404).json({ error: 'Member account not found' })

    const passwordHash = await bcrypt.hash(password, 10)
    await db.request()
      .input('id', sql.Int, req.params.id)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('UPDATE Users SET PasswordHash = @passwordHash, MustChangePassword = 1 WHERE Id = @id')

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/employees/members/:id — delete a member account (blocked if they have applications)
app.delete('/api/employees/members/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const memberResult = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT Id, Email FROM Users WHERE Id = @id AND Role = 'member'`)
    if (!memberResult.recordset.length)
      return res.status(404).json({ error: 'Member account not found' })

    const memberEmail = memberResult.recordset[0].Email
    const appResult = await db.request()
      .input('email', sql.NVarChar, memberEmail)
      .query(`SELECT COUNT(*) AS cnt FROM Applications WHERE UserEmail = @email`)
    const appCount = appResult.recordset[0].cnt
    if (appCount > 0)
      return res.status(400).json({ error: `Cannot delete: this member has ${appCount} existing application${appCount !== 1 ? 's' : ''}` })

    await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM Users WHERE Id = @id AND Role = 'member'`)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Employee account management (employee-only) ───────────────────────────────

// GET /api/employees — list all employee accounts
app.get('/api/employees', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request()
      .query(`SELECT Id, Email, CreatedAt FROM Users WHERE Role = 'employee' ORDER BY CreatedAt DESC`)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/employees — create a new employee account
app.post('/api/employees', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  try {
    const db = await getPool()
    const existing = await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT Id FROM Users WHERE Email = @email')
    if (existing.recordset.length > 0)
      return res.status(400).json({ error: 'An account with that email already exists' })
    const passwordHash = await bcrypt.hash(password, 10)
    await db.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, 'employee')
      .query('INSERT INTO Users (Email, PasswordHash, Role, MustChangePassword) VALUES (@email, @passwordHash, @role, 1)')
    res.json({ success: true, email: email.toLowerCase() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/employees/:id/reset-password — reset an employee's password
const ADMIN_EMAIL = 'admin@ghraonline.com'

app.post('/api/employees/:id/reset-password', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password is required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT Id, Email FROM Users WHERE Id = @id AND Role = 'employee'`)
    if (!result.recordset.length)
      return res.status(404).json({ error: 'Employee account not found' })
    if (result.recordset[0].Email.toLowerCase() === ADMIN_EMAIL)
      return res.status(403).json({ error: 'The admin account cannot be reset' })
    const passwordHash = await bcrypt.hash(password, 10)
    await db.request()
      .input('id', sql.Int, req.params.id)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('UPDATE Users SET PasswordHash = @passwordHash, MustChangePassword = 1 WHERE Id = @id')
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/employees/:id — delete an employee account
app.delete('/api/employees/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT Id, Email FROM Users WHERE Id = @id AND Role = 'employee'`)
    if (!result.recordset.length)
      return res.status(404).json({ error: 'Employee account not found' })
    const targetEmail = result.recordset[0].Email.toLowerCase()
    if (targetEmail === ADMIN_EMAIL)
      return res.status(403).json({ error: 'The admin account cannot be deleted' })
    if (targetEmail === req.user.email.toLowerCase())
      return res.status(400).json({ error: 'You cannot delete your own account' })
    await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM Users WHERE Id = @id AND Role = 'employee'`)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
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

// POST /api/applications/sync-statuses  — pull live DS signer status into DB (bypasses webhooks)
app.post('/api/applications/sync-statuses', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request()
      .query(`SELECT Id, SignatureRequestId, ReferencesSignatureRequestId
              FROM Applications
              WHERE SignatureRequestId IS NOT NULL OR ReferencesSignatureRequestId IS NOT NULL`)

    const api = new SignatureRequestApi()
    api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

    for (const row of result.recordset) {
      try {
        // Membership + board signers
        if (row.SignatureRequestId) {
          const r    = await api.signatureRequestGet(row.SignatureRequestId)
          const sigs = r.body.signatureRequest.signatures || []
          const rep    = sigs.find(s => s.signerRole === DROPBOX_SIGN_SIGNER_ROLE)
          const verify = sigs.find(s => s.signerRole === 'Verification: Elected Board Signer')
          const appr   = sigs.find(s => s.signerRole === 'Approved: Elected Board Signer')

          if (rep?.statusCode === 'signed') {
            await db.request()
              .input('id', sql.Int, row.Id)
              .query(`UPDATE Applications SET Status = 'signed', SignedAt = COALESCE(SignedAt, GETDATE()) WHERE Id = @id AND Status != 'signed'`)
          }
          await db.request()
            .input('vStatus', sql.NVarChar, verify?.statusCode  || null)
            .input('vSigId',  sql.NVarChar, verify?.signatureId || null)
            .input('aStatus', sql.NVarChar, appr?.statusCode    || null)
            .input('aSigId',  sql.NVarChar, appr?.signatureId   || null)
            .input('id',      sql.Int,      row.Id)
            .query(`UPDATE Applications
                    SET VerificationSignatureStatus = COALESCE(@vStatus, VerificationSignatureStatus),
                        VerificationSignatureId     = COALESCE(@vSigId,  VerificationSignatureId),
                        VerificationSignedAt        = CASE WHEN @vStatus = 'signed' AND VerificationSignedAt IS NULL THEN GETDATE() ELSE VerificationSignedAt END,
                        ApprovedSignatureStatus     = COALESCE(@aStatus, ApprovedSignatureStatus),
                        ApprovedSignatureId         = COALESCE(@aSigId,  ApprovedSignatureId),
                        ApprovedSignedAt            = CASE WHEN @aStatus = 'signed' AND ApprovedSignedAt IS NULL THEN GETDATE() ELSE ApprovedSignedAt END
                    WHERE Id = @id`)
        }

        // Reference signers — update per-signer status and signatureId by role name
        if (row.ReferencesSignatureRequestId) {
          const r    = await api.signatureRequestGet(row.ReferencesSignatureRequestId)
          const sigs = r.body.signatureRequest.signatures || []
          const s1   = sigs.find(s => s.signerRole === 'Reference 1 - Membership Application')
          const s2   = sigs.find(s => s.signerRole === 'Reference 2 - Membership Application')
          await db.request()
            .input('ref1Status', sql.NVarChar, s1?.statusCode    || null)
            .input('ref1SigId',  sql.NVarChar, s1?.signatureId   || null)
            .input('ref2Status', sql.NVarChar, s2?.statusCode    || null)
            .input('ref2SigId',  sql.NVarChar, s2?.signatureId   || null)
            .input('id',         sql.Int,      row.Id)
            .query(`UPDATE Applications
                    SET Ref1SignatureStatus = @ref1Status, Ref1SignatureId = @ref1SigId,
                        Ref2SignatureStatus = @ref2Status, Ref2SignatureId = @ref2SigId
                    WHERE Id = @id`)
        }
      } catch {
        // Non-fatal — continue syncing other applications
      }
    }
    res.json({ success: true, synced: result.recordset.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/applications/last-board-signers  — employee only; returns board signer fields from the most recently approved application that has them populated
app.get('/api/applications/last-board-signers', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request().query(`
      SELECT TOP 1
        BoardSignerVerificationFirstName, BoardSignerVerificationLastName, BoardSignerVerificationEmail,
        BoardSignerApprovedFirstName,     BoardSignerApprovedLastName,     BoardSignerApprovedEmail
      FROM Applications
      WHERE Status IN ('approved', 'pending_signature', 'signed')
        AND BoardSignerVerificationFirstName IS NOT NULL AND BoardSignerVerificationFirstName <> ''
        AND BoardSignerVerificationEmail     IS NOT NULL AND BoardSignerVerificationEmail     <> ''
        AND BoardSignerApprovedFirstName     IS NOT NULL AND BoardSignerApprovedFirstName     <> ''
        AND BoardSignerApprovedEmail         IS NOT NULL AND BoardSignerApprovedEmail         <> ''
      ORDER BY ReviewedAt DESC
    `)
    if (result.recordset.length === 0) return res.json(null)
    const row = result.recordset[0]
    res.json({
      verification: {
        firstName: row.BoardSignerVerificationFirstName || '',
        lastName:  row.BoardSignerVerificationLastName  || '',
        email:     row.BoardSignerVerificationEmail     || ''
      },
      approved: {
        firstName: row.BoardSignerApprovedFirstName || '',
        lastName:  row.BoardSignerApprovedLastName  || '',
        email:     row.BoardSignerApprovedEmail     || ''
      }
    })
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
      .query(`SELECT a.Id, a.UserEmail, u.Id AS UserId,
                     a.StoreName, a.StoreAddress, a.Status, a.CurrentStep, a.ReviewedBy, a.ReviewedAt, a.Notes, a.CreatedAt,
                     a.SignatureRequestId, a.ReferencesSignatureRequestId,
                     a.Ref1SignatureStatus, a.Ref2SignatureStatus, a.FormData,
                     a.BoardSignerVerificationFirstName, a.BoardSignerVerificationLastName, a.BoardSignerVerificationEmail,
                     a.VerificationSignatureId, a.VerificationSignatureStatus, a.VerificationSignedAt,
                     a.BoardSignerApprovedFirstName, a.BoardSignerApprovedLastName, a.BoardSignerApprovedEmail,
                     a.ApprovedSignatureId, a.ApprovedSignatureStatus, a.ApprovedSignedAt
              FROM Applications a
              LEFT JOIN Users u ON u.Email = a.UserEmail
              ORDER BY a.CreatedAt DESC`)
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
  const { status, notes, boardSigners } = req.body
  try {
    const db = await getPool()

    // Load existing history to append to it
    const existing = await db.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT CommentsHistory, FormData, UserEmail FROM Applications WHERE Id = @id')
    if (!existing.recordset.length) return res.status(404).json({ error: 'Not found' })

    let history = []
    try { history = JSON.parse(existing.recordset[0]?.CommentsHistory || '[]') } catch {}
    if (notes) {
      history.push({ status, comment: notes, reviewedBy: req.user.email, reviewedAt: new Date().toISOString() })
    }
    const historyJson = JSON.stringify(history)

    if (status === 'approved') {
      // Validate board signer details — required before any DS call
      const v = boardSigners?.verification
      const a = boardSigners?.approved
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!v?.firstName?.trim() || !v?.lastName?.trim() || !v?.email?.trim() ||
          !a?.firstName?.trim() || !a?.lastName?.trim() || !a?.email?.trim()) {
        return res.status(400).json({ error: 'First name, last name, and email are required for both board signers' })
      }
      if (!emailRx.test(v.email)) return res.status(400).json({ error: 'Invalid Verification signer email address' })
      if (!emailRx.test(a.email)) return res.status(400).json({ error: 'Invalid Approved signer email address' })
      if (v.email.toLowerCase() === a.email.toLowerCase()) {
        return res.status(400).json({ error: 'Verification and Approved signer email addresses must be different' })
      }

      // For approvals: DS send drives the status — do not set 'approved' unless send succeeds
      let fd = {}
      try { fd = JSON.parse(existing.recordset[0].FormData || '{}') } catch {}
      const { UserEmail } = existing.recordset[0]

      try {
        const { signatureRequestId, verificationSignatureId, approvedSignatureId } =
          await sendSignatureRequest(fd, UserEmail, boardSigners, req.user.email)

        // DS succeeded — commit status = pending_signature with reviewer + board signer fields
        await db.request()
          .input('id2',        sql.Int,            req.params.id)
          .input('sigId',      sql.NVarChar,        signatureRequestId)
          .input('notes',      sql.NVarChar(sql.MAX), notes || '')
          .input('reviewedBy', sql.NVarChar,        req.user.email)
          .input('history',    sql.NVarChar(sql.MAX), historyJson)
          .input('vFirstName', sql.NVarChar,        v.firstName)
          .input('vLastName',  sql.NVarChar,        v.lastName)
          .input('vEmail',     sql.NVarChar,        v.email)
          .input('vSigId',     sql.NVarChar,        verificationSignatureId || null)
          .input('aFirstName', sql.NVarChar,        a.firstName)
          .input('aLastName',  sql.NVarChar,        a.lastName)
          .input('aEmail',     sql.NVarChar,        a.email)
          .input('aSigId',     sql.NVarChar,        approvedSignatureId || null)
          .query(`UPDATE Applications
                  SET Status = 'pending_signature', SignatureRequestId = @sigId,
                      Notes = @notes, ReviewedBy = @reviewedBy, ReviewedAt = GETDATE(), CommentsHistory = @history,
                      BoardSignerVerificationFirstName = @vFirstName,
                      BoardSignerVerificationLastName  = @vLastName,
                      BoardSignerVerificationEmail     = @vEmail,
                      VerificationSignatureId          = @vSigId,
                      VerificationSignatureStatus      = 'awaiting_signature',
                      BoardSignerApprovedFirstName     = @aFirstName,
                      BoardSignerApprovedLastName      = @aLastName,
                      BoardSignerApprovedEmail         = @aEmail,
                      ApprovedSignatureId              = @aSigId
                  WHERE Id = @id2`)

        // Send references signature request (non-fatal)
        try {
          const { signatureRequestId: refSigId, ref1SignatureId, ref2SignatureId } = await sendReferencesRequest(fd)
          await db.request()
            .input('refSigId',    sql.NVarChar, refSigId)
            .input('ref1SigId',   sql.NVarChar, ref1SignatureId || null)
            .input('ref2SigId',   sql.NVarChar, ref2SignatureId || null)
            .input('id3',         sql.Int,      req.params.id)
            .query(`UPDATE Applications
                    SET ReferencesSignatureRequestId = @refSigId,
                        ReferencesSignatureStatus    = 'sent',
                        Ref1SignatureId              = @ref1SigId,
                        Ref2SignatureId              = @ref2SigId,
                        Ref1SignatureStatus          = 'awaiting_signature',
                        Ref2SignatureStatus          = 'awaiting_signature'
                    WHERE Id = @id3`)
        } catch (refErr) {
          console.error('References signature request failed:', refErr.body?.error?.errorMsg || refErr.message)
        }

        return res.json({ success: true, status: 'pending_signature', signatureRequestId })
      } catch (dsErr) {
        const detail = dsErr.body?.error?.errorMsg || dsErr.message || 'Unknown error'
        console.error('Dropbox Sign send failed:', detail)

        // DS failed — record reviewer fields but leave Status unchanged (stays 'submitted')
        await db.request()
          .input('id4', sql.Int, req.params.id)
          .input('notes', sql.NVarChar(sql.MAX), notes || '')
          .input('reviewedBy', sql.NVarChar, req.user.email)
          .input('history', sql.NVarChar(sql.MAX), historyJson)
          .query(`UPDATE Applications
                  SET Notes = @notes, ReviewedBy = @reviewedBy, ReviewedAt = GETDATE(), CommentsHistory = @history
                  WHERE Id = @id4`)

        return res.status(500).json({ success: false, error: `Signature request failed: ${detail}` })
      }
    }

    // rejected / any other status — update status directly then send notification email
    await db.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar(sql.MAX), notes || '')
      .input('reviewedBy', sql.NVarChar, req.user.email)
      .input('history', sql.NVarChar(sql.MAX), historyJson)
      .query(`UPDATE Applications
              SET Status = @status, Notes = @notes, ReviewedBy = @reviewedBy, ReviewedAt = GETDATE(), CommentsHistory = @history
              WHERE Id = @id`)

    const { UserEmail, StoreName } = existing.recordset[0]
    sendStatusEmail(UserEmail, StoreName, status, notes).catch(() => {})

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/applications/:id/signature-status  — fetch live signer statuses from DS
app.get('/api/applications/:id/signature-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT SignatureRequestId, ReferencesSignatureRequestId, UserEmail FROM Applications WHERE Id = @id')
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' })
    const { SignatureRequestId, ReferencesSignatureRequestId, UserEmail } = result.recordset[0]

    const api = new SignatureRequestApi()
    api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

    const out = {}

    if (SignatureRequestId) {
      const r = await api.signatureRequestGet(SignatureRequestId)
      const sigs = r.body.signatureRequest.signatures || []
      const s = sigs.find(x => x.signerRole === DROPBOX_SIGN_SIGNER_ROLE)
      const v = sigs.find(x => x.signerRole === 'Verification: Elected Board Signer')
      const a = sigs.find(x => x.signerRole === 'Approved: Elected Board Signer')
      if (s) out.member = { email: s.signerEmailAddress, status: s.statusCode, signatureId: s.signatureId }
      if (v) out.verification_board_signer = { email: v.signerEmailAddress, status: v.statusCode, signatureId: v.signatureId }
      if (a) out.approved_board_signer     = { email: a.signerEmailAddress, status: a.statusCode, signatureId: a.signatureId }
    } else {
      out.member = { email: UserEmail, status: null, signatureId: null }
    }

    if (ReferencesSignatureRequestId) {
      const r = await api.signatureRequestGet(ReferencesSignatureRequestId)
      const sigs = r.body.signatureRequest.signatures || []
      const s1 = sigs.find(x => x.signerRole === 'Reference 1 - Membership Application')
      const s2 = sigs.find(x => x.signerRole === 'Reference 2 - Membership Application')
      if (s1) out.reference1 = { email: s1.signerEmailAddress, status: s1.statusCode, signatureId: s1.signatureId }
      if (s2) out.reference2 = { email: s2.signerEmailAddress, status: s2.statusCode, signatureId: s2.signatureId }
    }

    res.json(out)
  } catch (err) {
    const detail = err.body?.error?.errorMsg || err.message || 'Unknown error'
    res.status(500).json({ error: detail })
  }
})

// POST /api/applications/:id/resend/:target  — resend or redirect a DS signing email
// target: member | reference1 | reference2 ; body: { email? }
app.post('/api/applications/:id/resend/:target', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { target } = req.params
  const newEmail = (req.body.email || '').trim()

  const ROLE_MAP = {
    member:                    { col: 'SignatureRequestId',           role: DROPBOX_SIGN_SIGNER_ROLE },
    reference1:                { col: 'ReferencesSignatureRequestId', role: 'Reference 1 - Membership Application' },
    reference2:                { col: 'ReferencesSignatureRequestId', role: 'Reference 2 - Membership Application' },
    verification_board_signer: { col: 'SignatureRequestId',           role: 'Verification: Elected Board Signer' },
    approved_board_signer:     { col: 'SignatureRequestId',           role: 'Approved: Elected Board Signer' },
  }
  if (!ROLE_MAP[target]) return res.status(400).json({ error: 'Invalid target. Use member, reference1, reference2, verification_board_signer, or approved_board_signer.' })
  const { col, role } = ROLE_MAP[target]

  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT SignatureRequestId, ReferencesSignatureRequestId, FormData FROM Applications WHERE Id = @id')
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' })

    const row = result.recordset[0]
    const sigReqId = row[col]
    if (!sigReqId) return res.status(400).json({ error: `No signature request found for "${target}". Has the application been approved yet?` })

    const api = new SignatureRequestApi()
    api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

    // Fetch live signer list to find signatureId and current email
    const dsRes = await api.signatureRequestGet(sigReqId)
    const sigs = dsRes.body.signatureRequest.signatures || []
    const signer = sigs.find(s => s.signerRole === role)
    if (!signer) return res.status(404).json({ error: `Signer role "${role}" not found in signature request.` })

    if (signer.statusCode === 'signed') {
      return res.status(400).json({ error: 'This signer has already signed and cannot be reminded.' })
    }

    // For the Approved board signer, verify it's their turn (Verification must have signed first)
    if (target === 'approved_board_signer') {
      const turnRow = await db.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT VerificationSignedAt FROM Applications WHERE Id = @id')
      if (!turnRow.recordset[0]?.VerificationSignedAt) {
        return res.status(400).json({ error: "The Verification signer hasn't signed yet — it's not the Approved signer's turn." })
      }
    }

    const currentEmail = signer.signerEmailAddress

    if (newEmail && newEmail !== currentEmail) {
      // Change email → DS update triggers a new signing email automatically
      const updateReq = new SignatureRequestUpdateRequest()
      updateReq.signatureId  = signer.signatureId
      updateReq.emailAddress = newEmail
      const updateRes = await api.signatureRequestUpdate(sigReqId, updateReq)

      // Grab the new signatureId DS assigns to the updated signer
      const updatedSigs = updateRes.body?.signatureRequest?.signatures || []
      const updatedSigner = updatedSigs.find(s => s.signerRole === role)
      const newSigId = updatedSigner?.signatureId || null

      if (target === 'reference1') {
        await db.request()
          .input('newSigId',  sql.NVarChar, newSigId)
          .input('id2',       sql.Int,      req.params.id)
          .query(`UPDATE Applications
                  SET Ref1SignatureId = @newSigId, Ref1SignatureStatus = 'awaiting_signature'
                  WHERE Id = @id2`)
        // Persist updated email into FormData
        let fd = {}
        try { fd = JSON.parse(row.FormData || '{}') } catch {}
        fd.reference1Email = newEmail
        await db.request()
          .input('fd',  sql.NVarChar(sql.MAX), JSON.stringify(fd))
          .input('id3', sql.Int,               req.params.id)
          .query('UPDATE Applications SET FormData = @fd WHERE Id = @id3')
      } else if (target === 'reference2') {
        await db.request()
          .input('newSigId',  sql.NVarChar, newSigId)
          .input('id2',       sql.Int,      req.params.id)
          .query(`UPDATE Applications
                  SET Ref2SignatureId = @newSigId, Ref2SignatureStatus = 'awaiting_signature'
                  WHERE Id = @id2`)
        let fd = {}
        try { fd = JSON.parse(row.FormData || '{}') } catch {}
        fd.reference2Email = newEmail
        await db.request()
          .input('fd',  sql.NVarChar(sql.MAX), JSON.stringify(fd))
          .input('id3', sql.Int,               req.params.id)
          .query('UPDATE Applications SET FormData = @fd WHERE Id = @id3')
      } else if (target === 'verification_board_signer') {
        await db.request()
          .input('newSigId', sql.NVarChar, newSigId)
          .input('email',    sql.NVarChar, newEmail)
          .input('id2',      sql.Int,      req.params.id)
          .query(`UPDATE Applications
                  SET VerificationSignatureId = @newSigId,
                      VerificationSignatureStatus = 'awaiting_signature',
                      BoardSignerVerificationEmail = @email
                  WHERE Id = @id2`)
      } else if (target === 'approved_board_signer') {
        await db.request()
          .input('newSigId', sql.NVarChar, newSigId)
          .input('email',    sql.NVarChar, newEmail)
          .input('id2',      sql.Int,      req.params.id)
          .query(`UPDATE Applications
                  SET ApprovedSignatureId = @newSigId,
                      ApprovedSignatureStatus = 'awaiting_signature',
                      BoardSignerApprovedEmail = @email
                  WHERE Id = @id2`)
      }
      // member target — status is derived from app.Status, no per-signer DB column

      return res.json({ success: true, message: `Email updated to ${newEmail} — a new signing link has been sent.` })
    } else {
      // Same email → just remind
      const remindReq = new SignatureRequestRemindRequest()
      remindReq.emailAddress = currentEmail
      await api.signatureRequestRemind(sigReqId, remindReq)

      // Reset per-signer status back to awaiting so it reflects the resend
      if (target === 'reference1') {
        await db.request()
          .input('id2', sql.Int, req.params.id)
          .query(`UPDATE Applications SET Ref1SignatureStatus = 'awaiting_signature' WHERE Id = @id2`)
      } else if (target === 'reference2') {
        await db.request()
          .input('id2', sql.Int, req.params.id)
          .query(`UPDATE Applications SET Ref2SignatureStatus = 'awaiting_signature' WHERE Id = @id2`)
      } else if (target === 'verification_board_signer') {
        await db.request()
          .input('id2', sql.Int, req.params.id)
          .query(`UPDATE Applications SET VerificationSignatureStatus = 'awaiting_signature' WHERE Id = @id2`)
      } else if (target === 'approved_board_signer') {
        await db.request()
          .input('id2', sql.Int, req.params.id)
          .query(`UPDATE Applications SET ApprovedSignatureStatus = 'awaiting_signature' WHERE Id = @id2`)
      }

      return res.json({ success: true, message: `Reminder sent to ${currentEmail}.` })
    }
  } catch (err) {
    const detail = err.body?.error?.errorMsg || err.message || 'Unknown error'
    res.status(500).json({ error: detail })
  }
})

// PATCH /api/applications/:id/board-signers  — update board signer names/emails (employee only)
// Uses signatureRequestUpdate (same approach as reference email changes in resend endpoint)
app.patch('/api/applications/:id/board-signers', authMiddleware, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' })
  const { verification, approved } = req.body
  try {
    const db = await getPool()
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT SignatureRequestId,
                     VerificationSignatureId, VerificationSignedAt, BoardSignerVerificationEmail,
                     ApprovedSignatureId,     ApprovedSignedAt,     BoardSignerApprovedEmail
              FROM Applications WHERE Id = @id`)
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' })
    const row = result.recordset[0]

    if (!row.SignatureRequestId)
      return res.status(400).json({ error: 'No signature request exists for this application yet' })

    const api = new SignatureRequestApi()
    api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

    // ── Update Verification signer ──────────────────────────────────────────
    if (verification && !row.VerificationSignedAt) {
      let newSigId = row.VerificationSignatureId
      if (verification.email && verification.email.toLowerCase() !== (row.BoardSignerVerificationEmail || '').toLowerCase()) {
        const updateReq = new SignatureRequestUpdateRequest()
        updateReq.signatureId  = row.VerificationSignatureId
        updateReq.emailAddress = verification.email
        const updateRes = await api.signatureRequestUpdate(row.SignatureRequestId, updateReq)
        const updatedSig = (updateRes.body?.signatureRequest?.signatures || [])
          .find(s => s.signerRole === 'Verification: Elected Board Signer')
        newSigId = updatedSig?.signatureId || newSigId
      }
      await db.request()
        .input('firstName', sql.NVarChar, (verification.firstName || '').trim() || null)
        .input('lastName',  sql.NVarChar, (verification.lastName  || '').trim() || null)
        .input('email',     sql.NVarChar, (verification.email     || '').trim() || null)
        .input('sigId',     sql.NVarChar, newSigId)
        .input('id',        sql.Int,      req.params.id)
        .query(`UPDATE Applications
                SET BoardSignerVerificationFirstName = ISNULL(@firstName, BoardSignerVerificationFirstName),
                    BoardSignerVerificationLastName  = ISNULL(@lastName,  BoardSignerVerificationLastName),
                    BoardSignerVerificationEmail     = ISNULL(@email,     BoardSignerVerificationEmail),
                    VerificationSignatureId          = @sigId,
                    VerificationSignatureStatus      = 'awaiting_signature'
                WHERE Id = @id`)
    }

    // ── Update Approved signer ──────────────────────────────────────────────
    if (approved && !row.ApprovedSignedAt) {
      let newSigId = row.ApprovedSignatureId
      if (approved.email && approved.email.toLowerCase() !== (row.BoardSignerApprovedEmail || '').toLowerCase()) {
        const updateReq = new SignatureRequestUpdateRequest()
        updateReq.signatureId  = row.ApprovedSignatureId
        updateReq.emailAddress = approved.email
        const updateRes = await api.signatureRequestUpdate(row.SignatureRequestId, updateReq)
        const updatedSig = (updateRes.body?.signatureRequest?.signatures || [])
          .find(s => s.signerRole === 'Approved: Elected Board Signer')
        newSigId = updatedSig?.signatureId || newSigId
      }
      await db.request()
        .input('firstName', sql.NVarChar, (approved.firstName || '').trim() || null)
        .input('lastName',  sql.NVarChar, (approved.lastName  || '').trim() || null)
        .input('email',     sql.NVarChar, (approved.email     || '').trim() || null)
        .input('sigId',     sql.NVarChar, newSigId)
        .input('id',        sql.Int,      req.params.id)
        .query(`UPDATE Applications
                SET BoardSignerApprovedFirstName = ISNULL(@firstName, BoardSignerApprovedFirstName),
                    BoardSignerApprovedLastName  = ISNULL(@lastName,  BoardSignerApprovedLastName),
                    BoardSignerApprovedEmail     = ISNULL(@email,     BoardSignerApprovedEmail),
                    ApprovedSignatureId          = @sigId,
                    ApprovedSignatureStatus      = 'awaiting_signature'
                WHERE Id = @id`)
    }

    res.json({ success: true })
  } catch (err) {
    const detail = err.body?.error?.errorMsg || err.message
    res.status(500).json({ error: detail })
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
      url: `/uploads/${applicationId}/${filename}`
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
    storeState:                'TX',
    storeZip:                  '77001',
    storeCounty:               'Harris',
    mailingAddress:            '1234 Main Street',
    mailingCity:               'Houston',
    mailingState:              'TX',
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
    storeSpannerBoard: 'yes',
  }

  const dummyBoardSigners = {
    verification: { firstName: 'Verification', lastName: 'Signer', email: req.body.verificationEmail || `verify.${Date.now()}@example.com` },
    approved:     { firstName: 'Approved',     lastName: 'Signer', email: req.body.approvedEmail    || `approved.${Date.now()}@example.com` },
  }

  try {
    const { signatureRequestId, verificationSignatureId, approvedSignatureId } =
      await sendSignatureRequest(dummyFormData, signerEmail, dummyBoardSigners, req.user.email)
    res.json({ success: true, signatureRequestId, verificationSignatureId, approvedSignatureId })
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
        const api = new SignatureRequestApi()
        api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

        // ── Membership + board signers ────────────────────────────────────────
        // Fetch live signer state from DS; check who signed before flipping Status.
        // Status = 'signed' flips only when the Authorized Rep signs.
        // Board signer signed timestamps are updated independently.
        const memMatch = await db.request()
          .input('sigId', sql.NVarChar, sigReqId)
          .query(`SELECT Id FROM Applications WHERE SignatureRequestId = @sigId`)

        if (memMatch.recordset.length > 0) {
          const r    = await api.signatureRequestGet(sigReqId)
          const sigs = r.body.signatureRequest.signatures || []
          const rep    = sigs.find(s => s.signerRole === DROPBOX_SIGN_SIGNER_ROLE)
          const verify = sigs.find(s => s.signerRole === 'Verification: Elected Board Signer')
          const appr   = sigs.find(s => s.signerRole === 'Approved: Elected Board Signer')
          const appId  = memMatch.recordset[0].Id

          if (rep?.statusCode === 'signed') {
            await db.request()
              .input('id', sql.Int, appId)
              .query(`UPDATE Applications SET Status = 'signed', SignedAt = COALESCE(SignedAt, GETDATE()) WHERE Id = @id`)
          }
          await db.request()
            .input('vStatus', sql.NVarChar, verify?.statusCode  || null)
            .input('vSigId',  sql.NVarChar, verify?.signatureId || null)
            .input('aStatus', sql.NVarChar, appr?.statusCode    || null)
            .input('aSigId',  sql.NVarChar, appr?.signatureId   || null)
            .input('id',      sql.Int,      appId)
            .query(`UPDATE Applications
                    SET VerificationSignatureStatus = @vStatus,
                        VerificationSignatureId     = COALESCE(@vSigId, VerificationSignatureId),
                        VerificationSignedAt        = CASE WHEN @vStatus = 'signed' AND VerificationSignedAt IS NULL THEN GETDATE() ELSE VerificationSignedAt END,
                        ApprovedSignatureStatus     = @aStatus,
                        ApprovedSignatureId         = COALESCE(@aSigId, ApprovedSignatureId),
                        ApprovedSignedAt            = CASE WHEN @aStatus = 'signed' AND ApprovedSignedAt IS NULL THEN GETDATE() ELSE ApprovedSignedAt END
                    WHERE Id = @id`)
        }

        // ── References document: fetch live signer data via DS API ────────────
        // Avoids reliance on webhook payload field names (which vary); SDK returns
        // reliable camelCase fields (signerRole, statusCode, signatureId).
        const refMatch = await db.request()
          .input('sigId2', sql.NVarChar, sigReqId)
          .query(`SELECT Id FROM Applications WHERE ReferencesSignatureRequestId = @sigId2`)

        if (refMatch.recordset.length > 0) {
          const r    = await api.signatureRequestGet(sigReqId)
          const sigs = r.body.signatureRequest.signatures || []
          const s1   = sigs.find(s => s.signerRole === 'Reference 1 - Membership Application')
          const s2   = sigs.find(s => s.signerRole === 'Reference 2 - Membership Application')
          const appId = refMatch.recordset[0].Id

          await db.request()
            .input('ref1Status', sql.NVarChar, s1?.statusCode  || null)
            .input('ref1SigId',  sql.NVarChar, s1?.signatureId || null)
            .input('ref2Status', sql.NVarChar, s2?.statusCode  || null)
            .input('ref2SigId',  sql.NVarChar, s2?.signatureId || null)
            .input('id',         sql.Int,      appId)
            .query(`UPDATE Applications
                    SET Ref1SignatureStatus = @ref1Status,
                        Ref1SignatureId     = COALESCE(@ref1SigId, Ref1SignatureId),
                        Ref2SignatureStatus = @ref2Status,
                        Ref2SignatureId     = COALESCE(@ref2SigId, Ref2SignatureId)
                    WHERE Id = @id`)

          if (eventType === 'signature_request_all_signed') {
            await db.request()
              .input('id2', sql.Int, appId)
              .query(`UPDATE Applications SET ReferencesSignatureStatus = 'signed', ReferencesSignedAt = GETDATE() WHERE Id = @id2`)
          }
        }
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
