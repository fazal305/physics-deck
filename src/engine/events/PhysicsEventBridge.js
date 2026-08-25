import { PHYSICS_EVENT } from './eventTypes.js'

/**
 * The only module allowed to translate raw physics facts (a collision, an
 * explosion) into gameplay state mutations. CollisionManager only computes
 * physical quantities (impact speed, knockback) — it has no idea what
 * "damage" or "HP" mean. This bridge is where that translation happens, so
 * gameplay balance changes never require touching the physics layer.
 */
export class PhysicsEventBridge {
  constructor(eventBus, combatEngine) {
    this.bus = eventBus
    this.combatEngine = combatEngine
    this._unsubscribers = [
      eventBus.on(PHYSICS_EVENT.COLLISION_RESOLVED, (payload) => this._onCollisionResolved(payload)),
      eventBus.on(PHYSICS_EVENT.EXPLOSION, (payload) => this._onExplosion(payload)),
    ]
  }

  _onCollisionResolved(payload) {
    if (payload.targetTeam !== 'enemy' && payload.targetTeam !== 'player') return
    this.combatEngine.applyPhysicsCollision(payload)
  }

  _onExplosion(payload) {
    this.combatEngine.applyExplosion(payload)
  }

  destroy() {
    this._unsubscribers.forEach((unsub) => unsub())
  }
}
