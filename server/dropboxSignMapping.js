'use strict'

const { SubCustomField } = require('@dropbox/sign')

function cf(name, value) {
  if (value === undefined || value === null || value === '' || value === false) return null
  const f = new SubCustomField()
  f.name  = name
  f.value = String(value)
  return f
}

function buildReferenceCustomFields(formData) {
  const owners  = formData.owners || []
  const owner1  = owners[0] || {}
  const repName = [owner1.firstName, owner1.lastName].filter(Boolean).join(' ') || ''

  return [
    // ── Business / store (pre-filled, read-only for signers) ──────────────────
    cf('CorpName',     formData.memberName),
    cf('StoreName',    formData.dbaName || formData.memberName),
    cf('StoreAddress', formData.storeAddress),
    cf('StoreCity',    formData.storeCity),
    cf('StoreZip',     formData.storeZip),
    cf('StoreCounty',  formData.storeCounty),
    cf('AuthRep',      repName),
    cf('AuthRepCell',  owner1.mobilePhone),

    // ── Reference 1 ───────────────────────────────────────────────────────────
    cf('reference1Email',       formData.reference1Email),
    cf('reference1Company',     formData.reference1Company),
    cf('reference1GhraNumber',  formData.reference1GhraNumber),
    cf('reference1RepName',     formData.reference1RepName),

    // ── Reference 2 ───────────────────────────────────────────────────────────
    cf('reference2Email',       formData.reference2Email),
    cf('reference2Company',     formData.reference2Company),
    cf('reference2GhraNumber',  formData.reference2GhraNumber),
    cf('reference2RepName',     formData.reference2RepName),
  ].filter(Boolean)
}

module.exports = { buildReferenceCustomFields }
