/**
 * Repairs FormData rows where enum-valued fields were stored uppercased due to a bug in
 * the uppercase transform (fuelAvailability typo + missing select fields in skip list).
 *
 * Usage:
 *   node server/scripts/fixUppercasedEnums.js --dry-run   # preview only
 *   node server/scripts/fixUppercasedEnums.js             # apply fixes
 */

'use strict'

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const sql = require('mssql')

const dryRun = process.argv.includes('--dry-run')

// All enum fields and their valid lowercase values.
// Any stored value that isn't in the allowed set AND lowercases to one that is → fix it.
const ENUM_OPTIONS = {
  ownershipType:        ['sole-proprietor', 'partnership', 'c-corp', 's-corp', 'llc', 'corporation', 'limited-partnership'],
  businessType:         ['with-fuel', 'without-fuel'],
  storeCondition:       ['existing', 'remodeled', 'brand-new'],
  businessProperty:     ['owned', 'leased'],
  fuelAvailable:        ['branded', 'unbranded'],
  scanPOS:              ['yes', 'no'],
  posSystem:            ['gilbarco-passport', 'verifone', 'ruby', 'other'],
  foodServiceAvailable: ['yes', 'no'],
  foodConcept:          ['chicken', 'pizza', 'mexican', 'burger', 'bbq', 'other'],
  foodServiceBranded:   ['yes', 'no'],
  bigMardKudosGameday:  ['yes', 'no'],
  walkInCooler:         ['yes', 'no'],
  walkInFreezer:        ['yes', 'no'],
  beerCave:             ['yes', 'no'],
  storeSpannerBoard:    ['yes', 'no', 'prevMember'],
  hardLiquor:           ['yes', 'no'],
  ageRequirement:       ['yes', 'no'],
  closedSundayAfter9pm: ['yes', 'no'],
  akdnContribute:       ['yes', 'no'],
  hfbContribute:        ['yes', 'no'],
}

// Build a lookup: fieldName -> Set of valid lowercase values
const VALID_VALUES = {}
for (const [field, opts] of Object.entries(ENUM_OPTIONS)) {
  VALID_VALUES[field] = new Set(opts)
}

function repairFormData(fd) {
  let changed = false
  const fixes = []
  for (const [field, valid] of Object.entries(VALID_VALUES)) {
    const stored = fd[field]
    if (typeof stored !== 'string') continue
    if (valid.has(stored)) continue  // already correct
    const lower = stored.toLowerCase()
    if (valid.has(lower)) {
      fixes.push({ field, from: stored, to: lower })
      fd[field] = lower
      changed = true
    }
  }
  return { changed, fixes }
}

async function main() {
  const cfg = {
    server:   process.env.DB_SERVER   || 'localhost',
    database: process.env.DB_NAME     || 'GhraDb',
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options:  { encrypt: false, trustServerCertificate: true },
  }

  const pool = await sql.connect(cfg)
  const rows = await pool.request().query('SELECT Id, FormData FROM Applications WHERE FormData IS NOT NULL')

  let totalFixed = 0
  let totalApps  = 0

  for (const row of rows.recordset) {
    let fd
    try { fd = JSON.parse(row.FormData) } catch { continue }

    const { changed, fixes } = repairFormData(fd)
    if (!changed) continue

    totalApps++
    totalFixed += fixes.length
    console.log(`App ${row.Id}: ${fixes.length} field(s) to fix`)
    for (const f of fixes) console.log(`  ${f.field}: ${JSON.stringify(f.from)} → ${JSON.stringify(f.to)}`)

    if (!dryRun) {
      await pool.request()
        .input('id', sql.Int, row.Id)
        .input('fd', sql.NVarChar(sql.MAX), JSON.stringify(fd))
        .query('UPDATE Applications SET FormData = @fd WHERE Id = @id')
      console.log(`  → updated`)
    }
  }

  if (dryRun) {
    console.log(`\nDry run — ${totalApps} application(s) would be updated, ${totalFixed} field(s) total. Run without --dry-run to apply.`)
  } else {
    console.log(`\nDone — updated ${totalApps} application(s), fixed ${totalFixed} field(s).`)
  }

  await sql.close()
}

main().catch(err => { console.error(err.message); process.exit(1) })
