import { describe, expect, it } from 'vitest'
import { damageFromImpact, getProfile } from './physicsObjectProfiles.js'

describe('damageFromImpact', () => {
  it('deals zero damage below the minimum impact threshold', () => {
    const profile = getProfile('boulder')
    expect(damageFromImpact(profile, 1)).toBe(0)
  })

  it('scales with impact speed', () => {
    const profile = getProfile('boulder')
    const low = damageFromImpact(profile, 3)
    const high = damageFromImpact(profile, 15)
    expect(high).toBeGreaterThan(low)
  })

  it('throws for an unknown object kind', () => {
    expect(() => getProfile('not_a_real_object')).toThrow()
  })
})
