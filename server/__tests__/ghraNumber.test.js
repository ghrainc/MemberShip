'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { validateGhraNumber } = require('../ghra/ghraNumber')

describe('validateGhraNumber', () => {
  it('returns null for a simple alphanumeric number', () => {
    assert.equal(validateGhraNumber('GHRA-1234'), null)
    assert.equal(validateGhraNumber('A1'), null)
    assert.equal(validateGhraNumber('123'), null)
  })

  it('returns null for a number with spaces and dashes', () => {
    assert.equal(validateGhraNumber('GHRA 1234-A'), null)
  })

  it('rejects null', () => {
    assert.ok(validateGhraNumber(null) !== null)
  })

  it('rejects undefined', () => {
    assert.ok(validateGhraNumber(undefined) !== null)
  })

  it('rejects an empty string', () => {
    assert.ok(validateGhraNumber('') !== null)
  })

  it('rejects a whitespace-only string', () => {
    assert.ok(validateGhraNumber('   ') !== null)
  })

  it('rejects a number longer than 50 characters', () => {
    assert.ok(validateGhraNumber('A'.repeat(51)) !== null)
  })

  it('accepts exactly 50 characters', () => {
    assert.equal(validateGhraNumber('A'.repeat(50)), null)
  })

  it('rejects special characters (%, @, #, etc.)', () => {
    assert.ok(validateGhraNumber('GHRA#001') !== null)
    assert.ok(validateGhraNumber('GHRA@001') !== null)
    assert.ok(validateGhraNumber('100%') !== null)
  })

  it('rejects a non-string type', () => {
    assert.ok(validateGhraNumber(123) !== null)
    assert.ok(validateGhraNumber({}) !== null)
  })
})
