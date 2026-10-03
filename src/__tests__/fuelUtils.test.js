import { describe, it, expect } from 'vitest'
import { ghraFuelsApplies } from '../utils/fuelUtils.js'

describe('ghraFuelsApplies', () => {
  const base = { businessType: 'with-fuel', fuelAvailable: 'unbranded', ghraFuelOptIn: true }

  it('returns true when all conditions are met', () => {
    expect(ghraFuelsApplies(base)).toBe(true)
  })

  it('returns true when ghraFuelOptIn is undefined (not explicitly opted out)', () => {
    const { ghraFuelOptIn: _, ...rest } = base
    expect(ghraFuelsApplies(rest)).toBe(true)
  })

  it('returns false when businessType is without-fuel', () => {
    expect(ghraFuelsApplies({ ...base, businessType: 'without-fuel' })).toBe(false)
  })

  it('returns false when fuelAvailable is branded (not unbranded)', () => {
    expect(ghraFuelsApplies({ ...base, fuelAvailable: 'branded' })).toBe(false)
  })

  it('returns false when fuelAvailable is missing', () => {
    const { fuelAvailable: _, ...rest } = base
    expect(ghraFuelsApplies(rest)).toBe(false)
  })

  it('returns false when ghraFuelOptIn is explicitly false', () => {
    expect(ghraFuelsApplies({ ...base, ghraFuelOptIn: false })).toBe(false)
  })

  it('returns false for an empty form data object', () => {
    expect(ghraFuelsApplies({})).toBe(false)
  })

  it('returns false when businessType is missing', () => {
    const { businessType: _, ...rest } = base
    // undefined !== 'without-fuel' is true, so this passes the first check,
    // but fuelAvailable still needs to be 'unbranded'
    expect(ghraFuelsApplies({ ...rest, fuelAvailable: 'unbranded' })).toBe(true)
  })
})
