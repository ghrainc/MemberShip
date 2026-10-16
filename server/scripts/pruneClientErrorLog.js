// Usage: node server/scripts/pruneClientErrorLog.js [--dry-run] [--days=N]
// Default retention: 90 days. Pass --days=N to override.
// --dry-run prints the count that would be deleted without deleting anything.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const sql = require('mssql')

async function main() {
  const dryRun  = process.argv.includes('--dry-run')
  const daysArg = process.argv.find(a => a.startsWith('--days='))
  const days    = daysArg ? parseInt(daysArg.slice(7), 10) : 90
  if (isNaN(days) || days < 1) {
    console.error('--days must be a positive integer')
    process.exit(1)
  }

  const config = {
    server:   process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port:     parseInt(process.env.DB_PORT) || 1433,
    options:  { encrypt: false, trustServerCertificate: true },
  }

  const pool = await sql.connect(config)
  try {
    const countRes = await pool.request()
      .input('days', sql.Int, days)
      .query(`SELECT COUNT(*) AS cnt FROM ClientErrorLog WHERE CreatedAt < DATEADD(day, -@days, GETDATE())`)
    const count = countRes.recordset[0].cnt

    if (dryRun) {
      console.log(`[dry-run] Would delete ${count} row(s) older than ${days} days from ClientErrorLog.`)
    } else {
      await pool.request()
        .input('days', sql.Int, days)
        .query(`DELETE FROM ClientErrorLog WHERE CreatedAt < DATEADD(day, -@days, GETDATE())`)
      console.log(`Deleted ${count} row(s) older than ${days} days from ClientErrorLog.`)
    }
  } finally {
    await pool.close()
  }
}

main().catch(err => {
  console.error('pruneClientErrorLog failed:', err.message)
  process.exit(1)
})
