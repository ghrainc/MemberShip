'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { csvField } = require('../utils/achCsv')

describe('csvField', () => {
  it('returns a plain string as-is', () => {
    assert.equal(csvField('GHRA-001'), 'GHRA-001')
    assert.equal(csvField('Main Street Market'), 'Main Street Market')
  })

  it('quotes a field containing a comma', () => {
    assert.equal(csvField('Smith, John'), '"Smith, John"')
  })

  it('quotes a field containing a double-quote and escapes it', () => {
    assert.equal(csvField('Say "hello"'), '"Say ""hello"""')
  })

  it('replaces CR with a space', () => {
    assert.equal(csvField('line1\rline2'), 'line1 line2')
  })

  it('replaces LF with a space', () => {
    assert.equal(csvField('line1\nline2'), 'line1 line2')
  })

  it('replaces CRLF with a space', () => {
    assert.equal(csvField('line1\r\nline2'), 'line1  line2')
  })

  it('converts null to empty string', () => {
    assert.equal(csvField(null), '')
  })

  it('converts undefined to empty string', () => {
    assert.equal(csvField(undefined), '')
  })

  it('converts numbers to string', () => {
    assert.equal(csvField(400.00), '400')
    assert.equal(csvField(0), '0')
  })

  it('a field that contains both a comma and a quote is properly double-escaped', () => {
    assert.equal(csvField('A, "B"'), '"A, ""B"""')
  })
})
