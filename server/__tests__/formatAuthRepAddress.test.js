'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { formatAuthRepAddress } = require('../utils/formatAuthRepAddress')

describe('formatAuthRepAddress', () => {
  it('returns all four parts in "Street, City, State Zip" format', () => {
    const fd = {
      authorizedRepAddress: '123 Main St',
      authorizedRepCity:    'Austin',
      authorizedRepState:   'TX',
      authorizedRepZip:     '78701',
    }
    assert.equal(formatAuthRepAddress(fd), '123 Main St, Austin, TX 78701')
  })

  it('omits the street when missing', () => {
    const fd = {
      authorizedRepAddress: '',
      authorizedRepCity:    'Austin',
      authorizedRepState:   'TX',
      authorizedRepZip:     '78701',
    }
    assert.equal(formatAuthRepAddress(fd), 'Austin, TX 78701')
  })

  it('omits the state when missing', () => {
    const fd = {
      authorizedRepAddress: '123 Main St',
      authorizedRepCity:    'Austin',
      authorizedRepState:   '',
      authorizedRepZip:     '78701',
    }
    assert.equal(formatAuthRepAddress(fd), '123 Main St, Austin, 78701')
  })

  it('omits the zip when missing', () => {
    const fd = {
      authorizedRepAddress: '123 Main St',
      authorizedRepCity:    'Austin',
      authorizedRepState:   'TX',
      authorizedRepZip:     '',
    }
    assert.equal(formatAuthRepAddress(fd), '123 Main St, Austin, TX')
  })

  it('returns empty string when all fields are missing', () => {
    assert.equal(formatAuthRepAddress({}), '')
  })

  it('trims whitespace from each field', () => {
    const fd = {
      authorizedRepAddress: '  123 Main St  ',
      authorizedRepCity:    '  Austin  ',
      authorizedRepState:   '  TX  ',
      authorizedRepZip:     '  78701  ',
    }
    assert.equal(formatAuthRepAddress(fd), '123 Main St, Austin, TX 78701')
  })

  it('handles null field values without throwing', () => {
    const fd = {
      authorizedRepAddress: null,
      authorizedRepCity:    'Austin',
      authorizedRepState:   null,
      authorizedRepZip:     '78701',
    }
    assert.equal(formatAuthRepAddress(fd), 'Austin, 78701')
  })

  it('handles undefined field values without throwing', () => {
    assert.doesNotThrow(() => formatAuthRepAddress({}))
  })
})
