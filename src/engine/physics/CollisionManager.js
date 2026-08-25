import Matter from 'matter-js'
import { PHYSICS_EVENT } from '../events/eventTypes.js'
import { damageFromImpact } from './physicsObjectProfiles.js'

const { Events, Body } = Matter

function pairKey(bodyA, bodyB) {
  const a = bodyA.id
  const b = bodyB.id
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function relativeSpeed(bodyA, bodyB) {
  const dx = bodyA.velocity.x - bodyB.velocity.x
  const dy = bodyA.velocity.y - bodyB.velocity.y
  return Math.hypot(dx, dy)
}

/**
 * Translates raw Matter collisionStart/collisionEnd pairs into a single,
 * deduplicated CollisionResolved fact per contact episode. Sustained resting
 * contact (Matter's collisionActive) never re-fires damage because we only
 * ever act on collisionStart, and a per-pair "active" set additionally
 * guards against Matter emitting multiple collisionStart events for the same
 * contact episode in one tick (compound bodies, multi-vertex polygons).
 */
export class CollisionManager {
  constructor(physicsWorld, physicsObjectManager, eventBus) {
    this.world = physicsWorld
    this.objects = physicsObjectManager
    this.bus = eventBus
    this.activePairs = new Set()
    this.chainReactionArmed = false

    this._onStart = this._onStart.bind(this)
    this._onEnd = this._onEnd.bind(this)
    Events.on(this.world.engine, 'collisionStart', this._onStart)
    Events.on(this.world.engine, 'collisionEnd', this._onEnd)
  }

  armChainReaction() {
    this.chainReactionArmed = true
  }

  destroy() {
    Events.off(this.world.engine, 'collisionStart', this._onStart)
    Events.off(this.world.engine, 'collisionEnd', this._onEnd)
  }

  _onEnd(event) {
    for (const pair of event.pairs) {
      this.activePairs.delete(pairKey(pair.bodyA, pair.bodyB))
    }
  }

  _onStart(event) {
    for (const pair of event.pairs) {
      const key = pairKey(pair.bodyA, pair.bodyB)
      if (this.activePairs.has(key)) continue
      this.activePairs.add(key)
      this._resolvePair(pair.bodyA, pair.bodyB)
    }
  }

  _resolvePair(bodyA, bodyB) {
    const metaA = bodyA.plugin?.physicsDeck
    const metaB = bodyB.plugin?.physicsDeck
    if (!metaA && !metaB) return // two static bounds colliding — never happens, but guard anyway

    // Normalize so `object` is consistently referenced when one side is a spawned object.
    let objectMeta = null
    let objectBody = null
    let otherMeta = null
    let otherBody = null

    if (metaA?.kind === 'object') {
      objectMeta = metaA
      objectBody = bodyA
      otherMeta = metaB
      otherBody = bodyB
    } else if (metaB?.kind === 'object') {
      objectMeta = metaB
      objectBody = bodyB
      otherMeta = metaA
      otherBody = bodyA
    }

    if (!objectMeta) return // combatant-vs-combatant or object-vs-static-bound with no object: nothing to resolve

    const impactSpeed = relativeSpeed(bodyA, bodyB)
    const profile = objectMeta.profile

    if (objectMeta.isDestructible && objectMeta.hp != null) {
      objectMeta.hp -= 1
    }

    if (profile.explosive && !objectMeta.hasExploded) {
      this._triggerExplosion(objectBody, objectMeta)
      return
    }

    if (otherMeta?.kind === 'combatant') {
      let damage = damageFromImpact(profile, impactSpeed)
      let bonusFromChain = 0
      if (this.chainReactionArmed) {
        bonusFromChain = Math.round(damage * 0.5)
        this.chainReactionArmed = false
        this._shockwave(objectBody.position, 140, 0.03, otherBody)
      }
      this.bus.emit(PHYSICS_EVENT.COLLISION_RESOLVED, {
        objectId: objectMeta.entityId,
        objectKind: objectMeta.objectKind,
        targetEntityId: otherMeta.entityId,
        targetTeam: otherMeta.team,
        impactSpeed,
        damage: damage + bonusFromChain,
        knockbackImpulse: this._computeKnockback(objectBody, otherBody, impactSpeed),
        appliesStatus: profile.appliesStatus ?? null,
        point: { x: objectBody.position.x, y: objectBody.position.y },
      })
    }

    if (objectMeta.isDestructible && objectMeta.hp != null && objectMeta.hp <= 0) {
      this.objects.destroyObject(objectMeta.entityId, 'brokenOnImpact')
    }
  }

  _computeKnockback(objectBody, targetBody, impactSpeed) {
    const dir = Math.sign(targetBody.position.x - objectBody.position.x) || 1
    return { x: dir * impactSpeed * (objectBody.mass / Math.max(1, targetBody.mass)) * 0.6, y: -Math.min(impactSpeed * 0.15, 4) }
  }

  _triggerExplosion(objectBody, objectMeta) {
    objectMeta.hasExploded = true
    const profile = objectMeta.profile
    const center = { x: objectBody.position.x, y: objectBody.position.y }
    const affected = []

    for (const [, body] of this.world.getAllEntityBodies()) {
      const meta = body.plugin?.physicsDeck
      if (!meta || meta.entityId === objectMeta.entityId) continue
      const dx = body.position.x - center.x
      const dy = body.position.y - center.y
      const dist = Math.hypot(dx, dy)
      if (dist > profile.explosionRadius) continue
      const falloff = 1 - dist / profile.explosionRadius
      const forceMag = profile.explosionForce * falloff
      Body.applyForce(body, body.position, {
        x: (dx / Math.max(1, dist)) * forceMag,
        y: (dy / Math.max(1, dist)) * forceMag - forceMag * 0.5,
      })
      if (meta.kind === 'combatant') {
        affected.push({ entityId: meta.entityId, team: meta.team, damage: Math.round(profile.explosionDamage * falloff) })
      }
    }

    this.bus.emit(PHYSICS_EVENT.EXPLOSION, { point: center, affected })
    this.objects.destroyObject(objectMeta.entityId, 'exploded')
  }

  _shockwave(center, radius, force, excludeBody) {
    for (const [, body] of this.world.getAllEntityBodies()) {
      if (body === excludeBody) continue
      const dx = body.position.x - center.x
      const dy = body.position.y - center.y
      const dist = Math.hypot(dx, dy)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      Body.applyForce(body, body.position, {
        x: (dx / Math.max(1, dist)) * force * falloff,
        y: (dy / Math.max(1, dist)) * force * falloff - force * falloff * 0.5,
      })
    }
  }
}
