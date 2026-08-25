import Matter from 'matter-js'
import { ARENA } from './arenaConfig.js'
import { CATEGORY } from './collisionCategories.js'

const { Engine, World, Bodies, Body } = Matter

/**
 * Owns the Matter.Engine/World and static arena geometry. This is a plain JS
 * class instantiated once per combat encounter — it never touches React.
 */
export class PhysicsWorld {
  constructor() {
    this.engine = Engine.create({ gravity: { x: 0, y: 1 } })
    this.world = this.engine.world
    this.bodies = new Map() // id -> Matter.Body
    this._buildBounds()
  }

  _buildBounds() {
    const { width, height, floorThickness, wallThickness } = ARENA
    const floor = Bodies.rectangle(width / 2, height + floorThickness / 2, width * 2, floorThickness, {
      isStatic: true,
      friction: 0.8,
      label: 'floor',
      collisionFilter: { category: CATEGORY.WALL },
    })
    const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
      isStatic: true,
      label: 'wall_left',
      collisionFilter: { category: CATEGORY.WALL },
    })
    const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, {
      isStatic: true,
      label: 'wall_right',
      collisionFilter: { category: CATEGORY.WALL },
    })
    World.add(this.world, [floor, leftWall, rightWall])
    this.staticBodies = { floor, leftWall, rightWall }
  }

  addBody(id, body) {
    body.plugin = body.plugin || {}
    body.plugin.entityId = id
    this.bodies.set(id, body)
    World.add(this.world, body)
  }

  removeBody(id) {
    const body = this.bodies.get(id)
    if (!body) return
    World.remove(this.world, body)
    this.bodies.delete(id)
  }

  getBody(id) {
    return this.bodies.get(id)
  }

  getAllEntityBodies() {
    return this.bodies
  }

  setGravityY(y) {
    this.engine.gravity.y = y
  }

  resetGravity() {
    this.engine.gravity.y = 1
  }

  applyForce(id, force) {
    const body = this.bodies.get(id)
    if (!body) return
    Body.applyForce(body, body.position, force)
  }

  step(deltaMs) {
    Engine.update(this.engine, deltaMs)
  }

  destroy() {
    World.clear(this.world, false)
    Engine.clear(this.engine)
    this.bodies.clear()
  }
}
