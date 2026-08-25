import { describe, expect, it } from 'vitest'
import Matter from 'matter-js'
import { PhysicsWorld } from './PhysicsWorld.js'
import { PhysicsObjectManager } from './PhysicsObjectManager.js'
import { CollisionManager } from './CollisionManager.js'
import { EventBus } from '../events/EventBus.js'
import { PHYSICS_EVENT } from '../events/eventTypes.js'
import { ARENA } from './arenaConfig.js'

function runSimulation(world, steps = 240, dtMs = 16) {
  for (let i = 0; i < steps; i++) world.step(dtMs)
}

describe('CollisionManager', () => {
  it('a falling boulder eventually deals physics damage to whatever it lands on', () => {
    const bus = new EventBus()
    const world = new PhysicsWorld()
    const objects = new PhysicsObjectManager(world, bus)
    new CollisionManager(world, objects, bus)

    const dummyX = ARENA.enemyBaseX
    world.addBody(
      'enemy_0',
      Matter.Bodies.circle(dummyX, ARENA.enemyY, 28, {
        isStatic: true,
        label: 'combatant:enemy_0',
        plugin: { physicsDeck: { kind: 'combatant', entityId: 'enemy_0', team: 'enemy', hp: 42 } },
      })
    )

    objects.spawnObject('boulder', { x: dummyX, y: ARENA.enemyY - 150, ownerTeam: 'player' })

    const resolvedEvents = []
    bus.on(PHYSICS_EVENT.COLLISION_RESOLVED, (payload) => resolvedEvents.push(payload))

    runSimulation(world, 300)

    expect(resolvedEvents.length).toBeGreaterThanOrEqual(1)
    expect(resolvedEvents[0].targetEntityId).toBe('enemy_0')
    expect(resolvedEvents[0].damage).toBeGreaterThan(0)
  })

  it('never resolves the same contact episode twice, even if Matter fires collisionStart redundantly in one tick', () => {
    const bus = new EventBus()
    const world = new PhysicsWorld()
    const objects = new PhysicsObjectManager(world, bus)
    const collisionManager = new CollisionManager(world, objects, bus)

    const enemyBody = Matter.Bodies.circle(ARENA.enemyBaseX, ARENA.enemyY, 28, {
      isStatic: true,
      label: 'combatant:enemy_0',
      plugin: { physicsDeck: { kind: 'combatant', entityId: 'enemy_0', team: 'enemy', hp: 42 } },
    })
    world.addBody('enemy_0', enemyBody)
    const { body: objectBody } = objects.spawnObject('boulder', {
      x: ARENA.enemyBaseX,
      y: ARENA.enemyY,
      ownerTeam: 'player',
    })

    const resolvedEvents = []
    bus.on(PHYSICS_EVENT.COLLISION_RESOLVED, (payload) => resolvedEvents.push(payload))

    const pair = { bodyA: objectBody, bodyB: enemyBody }
    // Simulate Matter emitting collisionStart twice for the same contact episode in one tick.
    Matter.Events.trigger(world.engine, 'collisionStart', { pairs: [pair] })
    Matter.Events.trigger(world.engine, 'collisionStart', { pairs: [pair] })
    expect(resolvedEvents.length).toBe(1)

    // Once the contact ends and a genuinely new one begins, it resolves again.
    Matter.Events.trigger(world.engine, 'collisionEnd', { pairs: [pair] })
    Matter.Events.trigger(world.engine, 'collisionStart', { pairs: [pair] })
    expect(resolvedEvents.length).toBe(2)

    collisionManager.destroy()
  })

  it('triggers exactly one explosion for an explosive barrel and destroys it', () => {
    const bus = new EventBus()
    const world = new PhysicsWorld()
    const objects = new PhysicsObjectManager(world, bus)
    new CollisionManager(world, objects, bus)

    const dummyX = ARENA.enemyBaseX
    world.addBody(
      'enemy_0',
      Matter.Bodies.circle(dummyX, ARENA.enemyY, 28, {
        isStatic: true,
        label: 'combatant:enemy_0',
        plugin: { physicsDeck: { kind: 'combatant', entityId: 'enemy_0', team: 'enemy', hp: 42 } },
      })
    )

    objects.spawnObject('explosive_barrel', { x: dummyX, y: ARENA.enemyY - 150, ownerTeam: 'player' })

    const explosions = []
    const destroyed = []
    bus.on(PHYSICS_EVENT.EXPLOSION, (payload) => explosions.push(payload))
    bus.on(PHYSICS_EVENT.OBJECT_DESTROYED, (payload) => destroyed.push(payload))

    runSimulation(world, 300)

    expect(explosions.length).toBe(1)
    expect(destroyed.length).toBe(1)
    expect(explosions[0].affected.some((a) => a.entityId === 'enemy_0')).toBe(true)
  })
})
