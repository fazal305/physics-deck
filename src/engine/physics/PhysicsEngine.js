import { PhysicsWorld } from './PhysicsWorld.js'
import { PhysicsObjectManager, arenaXForSide } from './PhysicsObjectManager.js'
import { CollisionManager } from './CollisionManager.js'
import { ARENA } from './arenaConfig.js'
import { PHYSICS_COMMAND } from '../events/eventTypes.js'

const MAX_STEP_MS = 1000 / 30

/**
 * Facade over the physics subsystem. Runs its own requestAnimationFrame loop
 * completely outside React's render cycle — React never sees a re-render
 * because of this loop. Gameplay code talks to it only via `dispatch` and by
 * listening for events on the shared EventBus.
 */
export class PhysicsEngine {
  constructor(eventBus) {
    this.bus = eventBus
    this.world = new PhysicsWorld()
    this.objects = new PhysicsObjectManager(this.world, eventBus)
    this.collisions = new CollisionManager(this.world, this.objects, eventBus)
    this._rafId = null
    this._lastTime = null
    this._running = false
  }

  start() {
    if (this._running) return
    this._running = true
    this._lastTime = performance.now()
    const loop = (now) => {
      if (!this._running) return
      const delta = Math.min(now - this._lastTime, MAX_STEP_MS)
      this._lastTime = now
      this.world.step(delta)
      this._rafId = requestAnimationFrame(loop)
    }
    this._rafId = requestAnimationFrame(loop)
  }

  stop() {
    this._running = false
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this._rafId = null
  }

  destroy() {
    this.stop()
    this.collisions.destroy()
    this.world.destroy()
  }

  spawnCombatant(entityId, options) {
    return this.objects.spawnCombatant(entityId, options)
  }

  removeCombatant(entityId) {
    this.objects.removeCombatant(entityId)
  }

  clearSpawnedObjects() {
    this.objects.clearSpawnedObjects()
  }

  getBody(entityId) {
    return this.world.getBody(entityId)
  }

  getAllEntityBodies() {
    return this.world.getAllEntityBodies()
  }

  dispatch(command) {
    switch (command.type) {
      case PHYSICS_COMMAND.SPAWN_OBJECT: {
        const { target, spawnSide, launchSpeed = 0, count = 1, spread = 0 } = command
        const results = []
        for (let i = 0; i < count; i++) {
          const targetBody = this.world.getBody(target.entityId)
          const spawnX = arenaXForSide(spawnSide)
          const spawnY = spawnSide === 'above' ? 40 : ARENA.enemyY
          const jitter = count > 1 ? (i - (count - 1) / 2) * spread * 40 : 0
          let velocity = null
          if (spawnSide !== 'above' && targetBody) {
            const dx = targetBody.position.x - spawnX
            const dy = targetBody.position.y - spawnY
            const dist = Math.max(1, Math.hypot(dx, dy))
            velocity = { x: (dx / dist) * launchSpeed, y: (dy / dist) * launchSpeed - 2 }
          }
          results.push(
            this.objects.spawnObject(command.objectKind, {
              x: spawnX + jitter,
              y: spawnY,
              ownerTeam: 'player',
              velocity,
            })
          )
        }
        return results
      }
      case PHYSICS_COMMAND.APPLY_FORCE: {
        const targetBody = this.world.getBody(command.target.entityId)
        if (!targetBody) return null
        const dir = command.direction === 'away' ? Math.sign(targetBody.position.x - ARENA.playerX) || 1 : 1
        this.world.applyForce(command.target.entityId, { x: dir * command.magnitude, y: -command.magnitude * 0.3 })
        return true
      }
      case PHYSICS_COMMAND.ATTRACT_TO_POINT: {
        const targetBody = this.world.getBody(command.target.entityId)
        if (!targetBody) return null
        for (const [, body] of this.world.getAllEntityBodies()) {
          if (body === targetBody) continue
          if (body.plugin?.physicsDeck?.kind !== 'object') continue
          const dist = Math.hypot(body.position.x - targetBody.position.x, body.position.y - targetBody.position.y)
          if (dist > command.radius) continue
          this.objects.applyImpulseToward(body.plugin.physicsDeck.entityId, targetBody.position, command.strength)
        }
        return true
      }
      case PHYSICS_COMMAND.SET_GRAVITY:
        this.world.setGravityY(command.gravityY)
        return true
      case PHYSICS_COMMAND.RESET_GRAVITY:
        this.world.resetGravity()
        return true
      case PHYSICS_COMMAND.REMOVE_BODY:
        this.objects.destroyObject(command.id, command.reason)
        return true
      case PHYSICS_COMMAND.FREEZE_BODY: {
        const body = this.world.getBody(command.id)
        if (body) {
          body.frictionAir = Math.min(0.5, body.frictionAir + 0.3)
        }
        return true
      }
      default:
        return null
    }
  }
}
