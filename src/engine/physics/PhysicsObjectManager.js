import Matter from 'matter-js'
import { getProfile } from './physicsObjectProfiles.js'
import { CATEGORY } from './collisionCategories.js'
import { ARENA } from './arenaConfig.js'
import { PHYSICS_EVENT } from '../events/eventTypes.js'

const { Bodies, Body } = Matter

/**
 * Creates and tracks all combat-relevant bodies (player, enemies, and
 * card-spawned physics objects). Every body carries `body.plugin.physicsDeck`
 * metadata so the CollisionManager can identify what collided with what
 * without any lookups back into React state.
 */
export class PhysicsObjectManager {
  constructor(world, eventBus) {
    this.world = world
    this.bus = eventBus
    this.spawnCounter = 0
  }

  spawnCombatant(entityId, { x, y, team, physics, hp }) {
    const radius = physics.radius ?? 26
    const body = Bodies.circle(x, y, radius, {
      mass: physics.mass,
      friction: physics.friction,
      frictionAir: physics.frictionAir,
      restitution: physics.restitution,
      label: `combatant:${entityId}`,
      collisionFilter: {
        category: team === 'player' ? CATEGORY.PLAYER : CATEGORY.ENEMY,
      },
    })
    body.plugin.physicsDeck = {
      kind: 'combatant',
      entityId,
      team,
      baseMass: physics.mass,
      hp,
      isDestructible: false,
    }
    this.world.addBody(entityId, body)
    return body
  }

  spawnObject(objectKind, { x, y, ownerTeam, velocity, force }) {
    const profile = getProfile(objectKind)
    const id = `obj_${this.spawnCounter++}`
    let body
    if (profile.shape === 'circle') {
      body = Bodies.circle(x, y, profile.radius, {
        mass: profile.mass,
        friction: profile.friction,
        frictionAir: profile.frictionAir,
        restitution: profile.restitution,
        label: `object:${objectKind}`,
        collisionFilter: { category: CATEGORY.PROJECTILE },
      })
    } else {
      body = Bodies.rectangle(x, y, profile.width, profile.height, {
        mass: profile.mass,
        friction: profile.friction,
        frictionAir: profile.frictionAir,
        restitution: profile.restitution,
        label: `object:${objectKind}`,
        collisionFilter: { category: CATEGORY.PROJECTILE },
      })
    }
    body.plugin.physicsDeck = {
      kind: 'object',
      objectKind,
      entityId: id,
      ownerTeam,
      profile,
      hp: profile.hp ?? null,
      isDestructible: !!profile.destructible,
      hasExploded: false,
    }
    if (velocity) Body.setVelocity(body, velocity)
    if (force) Body.applyForce(body, body.position, force)
    this.world.addBody(id, body)
    this.bus.emit(PHYSICS_EVENT.OBJECT_SPAWNED, { id, objectKind, x, y })
    return { id, body }
  }

  destroyObject(id, reason = 'destroyed') {
    const body = this.world.getBody(id)
    if (!body) return
    this.world.removeBody(id)
    this.bus.emit(PHYSICS_EVENT.OBJECT_DESTROYED, { id, reason })
  }

  removeCombatant(entityId) {
    this.world.removeBody(entityId)
  }

  applyImpulseToward(id, targetPoint, magnitude) {
    const body = this.world.getBody(id)
    if (!body) return
    const dx = targetPoint.x - body.position.x
    const dy = targetPoint.y - body.position.y
    const dist = Math.max(1, Math.hypot(dx, dy))
    const fx = (dx / dist) * magnitude
    const fy = (dy / dist) * magnitude
    Body.applyForce(body, body.position, { x: fx, y: fy })
  }

  getAllPhysicsObjectIds() {
    const ids = []
    for (const [id, body] of this.world.getAllEntityBodies()) {
      if (body.plugin.physicsDeck?.kind === 'object') ids.push(id)
    }
    return ids
  }

  clearSpawnedObjects() {
    for (const id of this.getAllPhysicsObjectIds()) {
      this.world.removeBody(id)
    }
  }
}

export function arenaXForSide(side) {
  return side === 'playerSide' ? ARENA.playerX + 60 : ARENA.enemyBaseX
}
