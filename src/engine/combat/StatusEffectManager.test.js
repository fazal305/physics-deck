import { describe, expect, it, beforeEach } from 'vitest'
import { StatusEffectManager } from './StatusEffectManager.js'

describe('StatusEffectManager', () => {
  let statusEffects

  beforeEach(() => {
    statusEffects = new StatusEffectManager()
  })

  it('duration-based statuses take the max of existing and new duration, not a sum', () => {
    statusEffects.apply('enemy_0', 'weak', 2)
    statusEffects.apply('enemy_0', 'weak', 1)
    expect(statusEffects.get('enemy_0', 'weak')).toBe(2)
  })

  it('intensity-based statuses (burning) stack additively', () => {
    statusEffects.apply('enemy_0', 'burning', 2)
    statusEffects.apply('enemy_0', 'burning', 3)
    expect(statusEffects.get('enemy_0', 'burning')).toBe(5)
  })

  it('applies outgoing/incoming damage multipliers', () => {
    statusEffects.apply('player', 'weak', 1)
    statusEffects.apply('enemy_0', 'vulnerable', 1)
    expect(statusEffects.getOutgoingDamageMultiplier('player')).toBeCloseTo(0.75)
    expect(statusEffects.getIncomingDamageMultiplier('enemy_0')).toBeCloseTo(1.5)
  })

  it('decayDurations counts down and removes at zero', () => {
    statusEffects.apply('enemy_0', 'frozen', 1)
    statusEffects.decayDurations('enemy_0')
    expect(statusEffects.has('enemy_0', 'frozen')).toBe(false)
  })

  it('tickEndOfTurnDamage sums burning damage across stacks', () => {
    statusEffects.apply('enemy_0', 'burning', 3)
    expect(statusEffects.tickEndOfTurnDamage('enemy_0')).toBe(9)
  })

  it('clearEntity removes all statuses for that entity only', () => {
    statusEffects.apply('enemy_0', 'weak', 2)
    statusEffects.apply('enemy_1', 'weak', 2)
    statusEffects.clearEntity('enemy_0')
    expect(statusEffects.has('enemy_0', 'weak')).toBe(false)
    expect(statusEffects.has('enemy_1', 'weak')).toBe(true)
  })
})
