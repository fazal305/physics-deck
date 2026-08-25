/**
 * Event type constants shared across the physics bridge and gameplay engines.
 * Keeping these as string constants (not an enum-like frozen object of
 * symbols) keeps them trivially serializable for logging/debugging.
 */

// Commands: gameplay -> physics (imperative requests to affect the world)
export const PHYSICS_COMMAND = {
  SPAWN_OBJECT: 'physics/command/spawnObject',
  APPLY_FORCE: 'physics/command/applyForce',
  APPLY_IMPULSE: 'physics/command/applyImpulse',
  SET_GRAVITY: 'physics/command/setGravity',
  RESET_GRAVITY: 'physics/command/resetGravity',
  REMOVE_BODY: 'physics/command/removeBody',
  FREEZE_BODY: 'physics/command/freezeBody',
  ATTRACT_TO_POINT: 'physics/command/attractToPoint',
}

// Events: physics -> gameplay (facts about what happened in the world)
export const PHYSICS_EVENT = {
  COLLISION_RESOLVED: 'physics/event/collisionResolved',
  OBJECT_SPAWNED: 'physics/event/objectSpawned',
  OBJECT_SETTLED: 'physics/event/objectSettled',
  OBJECT_DESTROYED: 'physics/event/objectDestroyed',
  EXPLOSION: 'physics/event/explosion',
  WORLD_IDLE: 'physics/event/worldIdle',
}

// Gameplay events: combat engine -> React/Zustand stores
export const GAME_EVENT = {
  CARD_PLAYED: 'game/event/cardPlayed',
  DAMAGE_APPLIED: 'game/event/damageApplied',
  BLOCK_APPLIED: 'game/event/blockApplied',
  KNOCKBACK_APPLIED: 'game/event/knockbackApplied',
  STATUS_APPLIED: 'game/event/statusApplied',
  ENEMY_DEFEATED: 'game/event/enemyDefeated',
  PLAYER_DEFEATED: 'game/event/playerDefeated',
  TURN_STARTED: 'game/event/turnStarted',
  TURN_ENDED: 'game/event/turnEnded',
  COMBAT_RESOLVED: 'game/event/combatResolved',
  LOG: 'game/event/log',
}
