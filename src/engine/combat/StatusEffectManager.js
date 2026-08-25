import { getStatusDef } from '../../data/statusEffects/statusEffects.js'

/**
 * Tracks status effect stacks/durations per entity. Duration-based effects
 * count down at end of turn; intensity-based effects (burning, bleeding)
 * keep a stack count that damage/other systems read directly.
 */
export class StatusEffectManager {
  constructor() {
    this.byEntity = new Map() // entityId -> { [statusId]: amount }
  }

  _entity(entityId) {
    if (!this.byEntity.has(entityId)) this.byEntity.set(entityId, {})
    return this.byEntity.get(entityId)
  }

  apply(entityId, statusId, amount) {
    const def = getStatusDef(statusId)
    const bucket = this._entity(entityId)
    if (def.stacking === 'duration') {
      bucket[statusId] = Math.max(bucket[statusId] ?? 0, amount)
    } else {
      bucket[statusId] = (bucket[statusId] ?? 0) + amount
    }
    return bucket[statusId]
  }

  get(entityId, statusId) {
    return this.byEntity.get(entityId)?.[statusId] ?? 0
  }

  has(entityId, statusId) {
    return this.get(entityId, statusId) > 0
  }

  getAll(entityId) {
    return { ...(this.byEntity.get(entityId) ?? {}) }
  }

  getOutgoingDamageMultiplier(entityId) {
    const bucket = this.byEntity.get(entityId)
    if (!bucket) return 1
    let mult = 1
    for (const statusId of Object.keys(bucket)) {
      if (bucket[statusId] <= 0) continue
      const def = getStatusDef(statusId)
      if (def.outgoingDamageMultiplier != null) mult *= def.outgoingDamageMultiplier
    }
    return mult
  }

  getIncomingDamageMultiplier(entityId) {
    const bucket = this.byEntity.get(entityId)
    if (!bucket) return 1
    let mult = 1
    for (const statusId of Object.keys(bucket)) {
      if (bucket[statusId] <= 0) continue
      const def = getStatusDef(statusId)
      if (def.incomingDamageMultiplier != null) mult *= def.incomingDamageMultiplier
    }
    return mult
  }

  getForceResponseMultiplier(entityId) {
    const bucket = this.byEntity.get(entityId)
    if (!bucket) return 1
    let mult = 1
    for (const statusId of Object.keys(bucket)) {
      if (bucket[statusId] <= 0) continue
      const def = getStatusDef(statusId)
      if (def.forceResponseMultiplier != null) mult *= def.forceResponseMultiplier
    }
    return mult
  }

  getMassMultiplier(entityId) {
    const bucket = this.byEntity.get(entityId)
    if (!bucket) return 1
    let mult = 1
    for (const statusId of Object.keys(bucket)) {
      if (bucket[statusId] <= 0) continue
      const def = getStatusDef(statusId)
      if (def.massMultiplier != null) mult *= def.massMultiplier
    }
    return mult
  }

  isStunned(entityId) {
    return this.has(entityId, 'stunned')
  }

  /** Returns { damage } from burning-type effects; call at end of turn. */
  tickEndOfTurnDamage(entityId) {
    const bucket = this.byEntity.get(entityId)
    if (!bucket) return 0
    let damage = 0
    for (const statusId of Object.keys(bucket)) {
      const stacks = bucket[statusId]
      if (stacks <= 0) continue
      const def = getStatusDef(statusId)
      if (def.damagePerStack) damage += def.damagePerStack * stacks
    }
    return damage
  }

  /** Decrements duration-based statuses; call once per entity at end of turn. */
  decayDurations(entityId) {
    const bucket = this.byEntity.get(entityId)
    if (!bucket) return
    for (const statusId of Object.keys(bucket)) {
      const def = getStatusDef(statusId)
      if (def.stacking === 'duration') {
        bucket[statusId] = Math.max(0, bucket[statusId] - 1)
        if (bucket[statusId] === 0) delete bucket[statusId]
      }
    }
  }

  clearEntity(entityId) {
    this.byEntity.delete(entityId)
  }

  clearAll() {
    this.byEntity.clear()
  }
}
