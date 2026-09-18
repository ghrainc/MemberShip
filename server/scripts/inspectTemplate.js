/**
 * Inspect the DS membership template: print signer roles and all fields.
 * Run from the server/ directory:  node scripts/inspectTemplate.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const { TemplateApi } = require('@dropbox/sign')

const TEMPLATE_ID = process.env.DS_TEMPLATE_ID

if (!TEMPLATE_ID) {
  console.error('DS_TEMPLATE_ID is not set in .env')
  process.exit(1)
}

;(async () => {
  const api = new TemplateApi()
  api.authentications['api_key'].username = process.env.DROPBOX_SIGN_API_KEY

  let body
  try {
    const res = await api.templateGet(TEMPLATE_ID)
    body = res.body
  } catch (err) {
    console.error('templateGet failed:', err.message || err)
    process.exit(1)
  }

  const tmpl = body.template

  // ── Signer roles ────────────────────────────────────────────────────────────
  console.log('\n=== Signer Roles ===')
  const roles = tmpl.signerRoles || []
  if (roles.length === 0) {
    console.log('  (none)')
  } else {
    roles.forEach((r, i) => {
      console.log(`  [${i}] name="${r.name}"  order=${r.order}`)
    })
  }

  // ── Custom fields (pre-fill / merge fields) ──────────────────────────────────
  console.log('\n=== Custom Fields (merge/pre-fill) ===')
  const customFields = tmpl.customFields || []
  if (customFields.length === 0) {
    console.log('  (none)')
  } else {
    customFields.forEach(f => {
      console.log(
        `  name="${f.name}"  type=${f.type}  required=${f.required}  apiId=${f.apiId ?? f.api_id ?? 'n/a'}`
      )
    })
  }

  // ── Form fields per document ─────────────────────────────────────────────────
  console.log('\n=== Form Fields (per document) ===')
  const docs = tmpl.documents || []
  if (docs.length === 0) {
    console.log('  (no documents in template)')
  } else {
    docs.forEach((doc, di) => {
      console.log(`\n  Document [${di}]: "${doc.name}"`)
      const fields = doc.formFields || doc.form_fields || []
      if (fields.length === 0) {
        console.log('    (no form fields)')
      } else {
        fields.forEach(f => {
          const signer = f.signer ?? f.signerRole ?? 'n/a'
          console.log(
            `    name="${f.name}"  apiId=${f.apiId ?? f.api_id ?? 'n/a'}` +
            `  type=${f.type}  required=${f.required}  signer=${signer}`
          )
        })
      }
    })
  }

  console.log('\n=== Done ===\n')
})()
