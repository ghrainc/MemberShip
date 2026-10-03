'use strict'

// All enum-valued form fields — values are fixed option strings that must never be uppercased.
// Must stay in sync with ENUM_OPTIONS in src/utils/uppercaseTransform.js.
const ENUM_FIELD_NAMES_SERVER = new Set([
  'ownershipType', 'businessType', 'storeCondition', 'businessProperty',
  'fuelAvailable',
  'scanPOS', 'posSystem',
  'foodServiceAvailable', 'foodConcept', 'foodServiceBranded', 'bigMardKudosGameday',
  'walkInCooler', 'walkInFreezer', 'beerCave',
  'storeSpannerBoard', 'hardLiquor', 'ageRequirement', 'closedSundayAfter9pm',
  'akdnContribute', 'hfbContribute',
])

const SKIP_UPPERCASE_KEYS = new Set([
  'email', 'userEmail',
  'password', 'newPassword', 'confirmPassword',
  'accountNumber', 'transitAbaNumber', 'ein', 'salesTaxId', 'ssn', 'ssnCipher', 'ssnEncrypted',
  'GhraNumber',
  'url', 'filename', 'originalName', 'filePath',
  'warehouseDelivery', 'previousMember',
  'membershipAgreement', 'memberRequirements', 'rebateConsent', 'membershipFeeAgreement',
  'acknowledgement', 'authorizationConsent', 'indemnificationConsent', 'storeProductCategories',
  ...ENUM_FIELD_NAMES_SERVER,
])

function uppercaseValue(key, value) {
  if (SKIP_UPPERCASE_KEYS.has(key)) return value
  if (typeof key === 'string' && key.toLowerCase().endsWith('email')) return value
  if (typeof key === 'string' && /password|pass|pwd|secret|token|hash/i.test(key)) return value
  if (typeof value !== 'string') return value
  return value.toUpperCase()
}

function uppercaseFormData(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(item => uppercaseFormData(item))
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = uppercaseFormData(v)
    } else if (Array.isArray(v)) {
      out[k] = v.map(item => (item && typeof item === 'object') ? uppercaseFormData(item) : uppercaseValue(k, item))
    } else {
      out[k] = uppercaseValue(k, v)
    }
  }
  return out
}

module.exports = { ENUM_FIELD_NAMES_SERVER, SKIP_UPPERCASE_KEYS, uppercaseValue, uppercaseFormData }
