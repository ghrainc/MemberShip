const express = require('express')
const cors = require('cors')
const sql = require('mssql')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

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
app.use(cors({ origin: 'http://localhost:5173' }))
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
      .query('SELECT Id, Email, PasswordHash, Role FROM Users WHERE Email = @email')

    if (!result.recordset.length)
      return res.status(401).json({ error: 'Invalid email or password' })

    const user = result.recordset[0]
    const valid = await bcrypt.compare(password, user.PasswordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = jwt.sign({ email: user.Email, role: user.Role }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ email: user.Email, role: user.Role, token })
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
      .query('SELECT Id, UserEmail, StoreName, StoreAddress, Status, CurrentStep, ReviewedBy, ReviewedAt, Notes, CreatedAt FROM Applications ORDER BY CreatedAt DESC')
    res.json(result.recordset)
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
    await db.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar(sql.MAX), notes || '')
      .input('reviewedBy', sql.NVarChar, req.user.email)
      .query(`UPDATE Applications
              SET Status = @status, Notes = @notes, ReviewedBy = @reviewedBy, ReviewedAt = GETDATE()
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

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  try {
    await getPool()
  } catch (err) {
    console.error('DB connection failed:', err.message)
  }
})
