import { describe, it, expect } from 'vitest'
import { normaliseDocuments, STATIC_SLOTS, getAllSlots } from '../utils/documentSlots.js'

describe('normaliseDocuments', () => {
  it('returns documents object as-is when already in new shape', () => {
    const docs = { salesTaxPermit: [{ filename: 'tax.pdf', originalName: 'tax.pdf' }], irsDocument: [] }
    expect(normaliseDocuments({ documents: docs })).toBe(docs)
  })

  it('does not treat an array documents field as the new shape (falls through to legacy path)', () => {
    // documents is an array, not a plain object → not the new shape
    const result = normaliseDocuments({ documents: [] })
    expect(Array.isArray(result)).toBe(false)
    expect(typeof result).toBe('object')
  })

  it('wraps a legacy object-valued slot in an array', () => {
    const legacy = { salesTaxPermit: { filename: 'tax.pdf', originalName: 'tax.pdf', url: 'http://x' } }
    const result = normaliseDocuments(legacy)
    expect(result.salesTaxPermit).toEqual([{ filename: 'tax.pdf', originalName: 'tax.pdf', url: 'http://x' }])
  })

  it('wraps a legacy string-valued slot in a minimal file object', () => {
    const legacy = { salesTaxPermit: 'old-tax-permit.pdf' }
    const result = normaliseDocuments(legacy)
    expect(result.salesTaxPermit).toEqual([{ originalName: 'old-tax-permit.pdf', filename: 'old-tax-permit.pdf', url: null }])
  })

  it('produces an empty array for slots not present in form data', () => {
    const result = normaliseDocuments({})
    for (const slot of STATIC_SLOTS) {
      expect(result[slot.id]).toEqual([])
    }
  })

  it('produces a single driverLicenseCopies slot when owners list is absent', () => {
    const result = normaliseDocuments({})
    expect(result.driverLicenseCopies).toEqual([])
    expect(result.driverLicense_owner_0).toBeUndefined()
  })

  it('produces per-owner driver license slots when multiple owners are present', () => {
    const owners = [
      { firstName: 'Alice', lastName: 'Smith' },
      { firstName: 'Bob', lastName: 'Jones' },
    ]
    const result = normaliseDocuments({ owners })
    expect(result.driverLicense_owner_0).toEqual([])
    expect(result.driverLicense_owner_1).toEqual([])
    expect(result.driverLicenseCopies).toBeUndefined()
  })

  it('handles null/undefined formData without throwing', () => {
    expect(() => normaliseDocuments(null)).not.toThrow()
    expect(() => normaliseDocuments(undefined)).not.toThrow()
  })
})

describe('getAllSlots', () => {
  it('returns at least the static slots', () => {
    const slots = getAllSlots([])
    for (const s of STATIC_SLOTS) {
      expect(slots.find(x => x.id === s.id)).toBeTruthy()
    }
  })
})
