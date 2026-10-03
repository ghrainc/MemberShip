// All fields whose values come from a fixed option set (selects, radios, checkboxes).
// Casing is meaningful here — these values are compared against string literals elsewhere.
// Must stay in sync with ENUM_FIELD_NAMES_SERVER in server/utils/uppercaseFormData.js.
export const ENUM_OPTIONS = {
  ownershipType:        ['sole-proprietor', 'partnership', 'c-corp', 's-corp', 'llc'],
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

export const ENUM_FIELD_NAMES = new Set(Object.keys(ENUM_OPTIONS))

export const SKIP_UPPERCASE_CLIENT = new Set([
  'email', 'userEmail', 'password', 'newPassword', 'confirmPassword',
  'accountNumber', 'transitAbaNumber', 'ein', 'salesTaxId', 'ssn', 'ssnCipher',
  'warehouseDelivery', 'previousMember',
  'membershipAgreement', 'memberRequirements', 'rebateConsent', 'membershipFeeAgreement',
  'acknowledgement', 'authorizationConsent', 'indemnificationConsent', 'storeProductCategories',
  ...ENUM_FIELD_NAMES,
])

export function uppercaseFieldValue(name, value) {
  if (typeof value !== 'string') return value
  if (SKIP_UPPERCASE_CLIENT.has(name)) return value
  if (name.toLowerCase().endsWith('email')) return value
  return value.toUpperCase()
}
