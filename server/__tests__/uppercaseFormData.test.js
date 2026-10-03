'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { uppercaseValue, uppercaseFormData, SKIP_UPPERCASE_KEYS, ENUM_FIELD_NAMES_SERVER } = require('../utils/uppercaseFormData')

describe('uppercaseValue', () => {
  it('uppercases plain string values', () => {
    assert.equal(uppercaseValue('storeName', 'main st market'), 'MAIN ST MARKET')
  })

  it('returns non-string values unchanged', () => {
    assert.equal(uppercaseValue('storeSize', 1200), 1200)
    assert.equal(uppercaseValue('flag', true), true)
    assert.equal(uppercaseValue('obj', null), null)
  })

  it('never uppercases email key', () => {
    assert.equal(uppercaseValue('email', 'user@example.com'), 'user@example.com')
  })

  it('never uppercases keys ending in email (case-insensitive)', () => {
    assert.equal(uppercaseValue('reference1Email', 'ref@co.com'), 'ref@co.com')
    assert.equal(uppercaseValue('reference2Email', 'ref2@co.com'), 'ref2@co.com')
    assert.equal(uppercaseValue('userEmail', 'mgr@co.com'), 'mgr@co.com')
    assert.equal(uppercaseValue('storeEmail', 'store@co.com'), 'store@co.com')
  })

  it('never uppercases password-pattern keys', () => {
    assert.equal(uppercaseValue('password', 'Secret1!'), 'Secret1!')
    assert.equal(uppercaseValue('newPassword', 'abc'), 'abc')
    assert.equal(uppercaseValue('jwtSecret', 'xyz'), 'xyz')
    assert.equal(uppercaseValue('apiToken', 'tok'), 'tok')
  })

  it('never uppercases financial / ID number keys', () => {
    assert.equal(uppercaseValue('accountNumber', '001234'), '001234')
    assert.equal(uppercaseValue('transitAbaNumber', '021000021'), '021000021')
    assert.equal(uppercaseValue('ssn', '123-45-6789'), '123-45-6789')
    assert.equal(uppercaseValue('ein', '12-3456789'), '12-3456789')
  })

  it('never uppercases any ENUM_FIELD_NAMES_SERVER key', () => {
    for (const name of ENUM_FIELD_NAMES_SERVER) {
      assert.equal(uppercaseValue(name, 'some-value'), 'some-value', `${name} should not be uppercased`)
    }
  })

  it('never uppercases fuelAvailable (the key that had the typo)', () => {
    assert.equal(uppercaseValue('fuelAvailable', 'unbranded'), 'unbranded')
  })
})

describe('uppercaseFormData', () => {
  it('uppercases string values in a flat object', () => {
    const result = uppercaseFormData({ storeName: 'abc', storeCity: 'austin' })
    assert.equal(result.storeName, 'ABC')
    assert.equal(result.storeCity, 'AUSTIN')
  })

  it('does not uppercase enum fields', () => {
    const result = uppercaseFormData({ ownershipType: 'llc', businessType: 'with-fuel' })
    assert.equal(result.ownershipType, 'llc')
    assert.equal(result.businessType, 'with-fuel')
  })

  it('recurses into nested objects', () => {
    const result = uppercaseFormData({ owner: { firstName: 'bob', email: 'b@b.com' } })
    assert.equal(result.owner.firstName, 'BOB')
    assert.equal(result.owner.email, 'b@b.com')
  })

  it('processes arrays of objects', () => {
    const result = uppercaseFormData({ owners: [{ firstName: 'alice' }, { firstName: 'bob' }] })
    assert.equal(result.owners[0].firstName, 'ALICE')
    assert.equal(result.owners[1].firstName, 'BOB')
  })

  it('returns null/undefined untouched', () => {
    assert.equal(uppercaseFormData(null), null)
    assert.equal(uppercaseFormData(undefined), undefined)
  })
})

describe('SKIP_UPPERCASE_KEYS', () => {
  it('contains all ENUM_FIELD_NAMES_SERVER keys', () => {
    for (const name of ENUM_FIELD_NAMES_SERVER) {
      assert.ok(SKIP_UPPERCASE_KEYS.has(name), `${name} should be in SKIP_UPPERCASE_KEYS`)
    }
  })

  it('contains critical credential and financial keys', () => {
    const critical = ['email', 'password', 'accountNumber', 'transitAbaNumber', 'ssn', 'ein', 'GhraNumber']
    for (const k of critical) {
      assert.ok(SKIP_UPPERCASE_KEYS.has(k), `${k} should be in SKIP_UPPERCASE_KEYS`)
    }
  })
})
