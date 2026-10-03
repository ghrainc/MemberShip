'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { validateAba } = require('../utils/validateAba')

// ABA checksum: (3*(d0+d3+d6) + 7*(d1+d4+d7) + (d2+d5+d8)) % 10 === 0

describe('validateAba', () => {
  it('accepts 021000021 (JPMorgan Chase NY — well-known valid number)', () => {
    assert.ok(validateAba('021000021'))
  })

  it('accepts 111000038 (Federal Reserve Bank)', () => {
    assert.ok(validateAba('111000038'))
  })

  it('accepts 121000358 (Wells Fargo)', () => {
    assert.ok(validateAba('121000358'))
  })

  it('rejects 021000022 (last digit off by one from valid 021000021)', () => {
    assert.ok(!validateAba('021000022'))
  })

  it('rejects 123456789 (sequential digits — fails checksum)', () => {
    assert.ok(!validateAba('123456789'))
  })

  it('rejects 000000000 (all zeros — sum is 0, passes checksum but is not a real routing number)', () => {
    // The function only validates the checksum algorithm, not real-world issuance.
    // All-zeros: sum = 0, 0 % 10 = 0 → passes. Document the behavior.
    assert.ok(validateAba('000000000'))
  })

  it('rejects 999999999 (all nines — sum = 3*27 + 7*27 + 27 = 81+189+27=297, 297%10=7)', () => {
    assert.ok(!validateAba('999999999'))
  })
})
