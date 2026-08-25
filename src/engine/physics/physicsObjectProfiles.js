/**
 * Data-driven physics bodies that cards can spawn into the arena. Adding a
 * new physical object kind means adding an entry here — no engine code
 * changes required. `damage` is evaluated from impact speed at collision
 * time by CollisionManager (see damageFromImpact).
 */
export const PHYSICS_OBJECT_PROFILES = {
  boulder: {
    label: 'Boulder',
    shape: 'circle',
    radius: 26,
    mass: 9,
    friction: 0.6,
    frictionAir: 0.012,
    restitution: 0.15,
    color: '#7a7267',
    strokeColor: '#4f493f',
    baseDamage: 10,
    velocityDamageFactor: 2.1,
    destructible: false,
    explosive: false,
  },
  pebble_shard: {
    label: 'Shard',
    shape: 'circle',
    radius: 10,
    mass: 1.5,
    friction: 0.3,
    frictionAir: 0.01,
    restitution: 0.35,
    color: '#9a9184',
    strokeColor: '#5c564a',
    baseDamage: 3,
    velocityDamageFactor: 1.2,
    destructible: false,
    explosive: false,
  },
  crate: {
    label: 'Crate',
    shape: 'rectangle',
    width: 46,
    height: 46,
    mass: 3,
    friction: 0.5,
    frictionAir: 0.015,
    restitution: 0.1,
    color: '#8a6a3f',
    strokeColor: '#5a4527',
    baseDamage: 4,
    velocityDamageFactor: 0.9,
    destructible: true,
    hp: 8,
    explosive: false,
  },
  ice_block: {
    label: 'Ice Block',
    shape: 'rectangle',
    width: 40,
    height: 40,
    mass: 4,
    friction: 0.02,
    frictionAir: 0.004,
    restitution: 0.25,
    color: '#7db3c7',
    strokeColor: '#4a7f92',
    baseDamage: 6,
    velocityDamageFactor: 1.5,
    destructible: false,
    explosive: false,
    appliesStatus: { id: 'frozen', duration: 1 },
  },
  explosive_barrel: {
    label: 'Explosive Barrel',
    shape: 'rectangle',
    width: 40,
    height: 52,
    mass: 5,
    friction: 0.4,
    frictionAir: 0.01,
    restitution: 0.1,
    color: '#b8453a',
    strokeColor: '#7a2b23',
    baseDamage: 6,
    velocityDamageFactor: 1.0,
    destructible: true,
    hp: 1,
    explosive: true,
    explosionRadius: 130,
    explosionDamage: 22,
    explosionForce: 0.045,
  },
}

export function getProfile(kind) {
  const profile = PHYSICS_OBJECT_PROFILES[kind]
  if (!profile) throw new Error(`Unknown physics object kind: ${kind}`)
  return profile
}

/** Impact damage from a collision, given relative speed at contact. */
export function damageFromImpact(profile, impactSpeed) {
  if (impactSpeed < 1.5) return 0
  return Math.round(profile.baseDamage + impactSpeed * profile.velocityDamageFactor)
}
