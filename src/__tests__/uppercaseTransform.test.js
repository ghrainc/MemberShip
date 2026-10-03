import { describe, it, expect } from 'vitest'
import { uppercaseFieldValue, SKIP_UPPERCASE_CLIENT, ENUM_FIELD_NAMES } from '../utils/uppercaseTransform.js'

describe('uppercaseFieldValue', () => {
  it('uppercases plain text fields', () => {
    expect(uppercaseFieldValue('storeName', 'main street market')).toBe('MAIN STREET MARKET')
  })

  it('leaves numbers and non-strings untouched', () => {
    expect(uppercaseFieldValue('storeSize', 1200)).toBe(1200)
    expect(uppercaseFieldValue('storeSize', null)).toBe(null)
    expect(uppercaseFieldValue('storeSize', true)).toBe(true)
  })

  it('never uppercases the email field', () => {
    expect(uppercaseFieldValue('email', 'User@Example.com')).toBe('User@Example.com')
  })

  it('never uppercases fields whose name ends in "email" (case-insensitive)', () => {
    expect(uppercaseFieldValue('reference1Email', 'bob@example.com')).toBe('bob@example.com')
    expect(uppercaseFieldValue('reference2Email', 'ref@co.com')).toBe('ref@co.com')
    expect(uppercaseFieldValue('storeEmail', 'mgr@co.com')).toBe('mgr@co.com')
  })

  it('never uppercases password fields', () => {
    expect(uppercaseFieldValue('password', 'Secret1!')).toBe('Secret1!')
    expect(uppercaseFieldValue('newPassword', 'abc123')).toBe('abc123')
    expect(uppercaseFieldValue('confirmPassword', 'abc123')).toBe('abc123')
  })

  it('never uppercases account and routing numbers', () => {
    expect(uppercaseFieldValue('accountNumber', '001234567')).toBe('001234567')
    expect(uppercaseFieldValue('transitAbaNumber', '021000021')).toBe('021000021')
  })

  it('never uppercases SSN fields', () => {
    expect(uppercaseFieldValue('ssn', '123-45-6789')).toBe('123-45-6789')
  })

  // The enum fields that caused the production bug
  it('never uppercases ownershipType', () => {
    expect(uppercaseFieldValue('ownershipType', 'sole-proprietor')).toBe('sole-proprietor')
    expect(uppercaseFieldValue('ownershipType', 'llc')).toBe('llc')
  })

  it('never uppercases businessType', () => {
    expect(uppercaseFieldValue('businessType', 'with-fuel')).toBe('with-fuel')
  })

  it('never uppercases fuelAvailable (the misnamed field that caused the bug)', () => {
    expect(uppercaseFieldValue('fuelAvailable', 'unbranded')).toBe('unbranded')
    expect(uppercaseFieldValue('fuelAvailable', 'branded')).toBe('branded')
  })

  it('never uppercases scanPOS (was missing from skip list)', () => {
    expect(uppercaseFieldValue('scanPOS', 'yes')).toBe('yes')
    expect(uppercaseFieldValue('scanPOS', 'no')).toBe('no')
  })

  it('never uppercases posSystem', () => {
    expect(uppercaseFieldValue('posSystem', 'gilbarco-passport')).toBe('gilbarco-passport')
  })

  it('never uppercases foodConcept', () => {
    expect(uppercaseFieldValue('foodConcept', 'pizza')).toBe('pizza')
  })

  it('never uppercases beerCave', () => {
    expect(uppercaseFieldValue('beerCave', 'yes')).toBe('yes')
  })

  it('never uppercases storeSpannerBoard (has prevMember option)', () => {
    expect(uppercaseFieldValue('storeSpannerBoard', 'prevMember')).toBe('prevMember')
  })

  it('every key in ENUM_FIELD_NAMES is excluded from uppercasing', () => {
    for (const name of ENUM_FIELD_NAMES) {
      expect(uppercaseFieldValue(name, 'some-value')).toBe('some-value')
    }
  })
})

describe('SKIP_UPPERCASE_CLIENT completeness', () => {
  it('includes all ENUM_FIELD_NAMES', () => {
    for (const name of ENUM_FIELD_NAMES) {
      expect(SKIP_UPPERCASE_CLIENT.has(name)).toBe(true)
    }
  })

  it('includes credential and sensitive fields', () => {
    const critical = ['email', 'password', 'accountNumber', 'transitAbaNumber', 'ssn', 'ein']
    for (const f of critical) {
      expect(SKIP_UPPERCASE_CLIENT.has(f)).toBe(true)
    }
  })
})
