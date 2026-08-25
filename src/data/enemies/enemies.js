/**
 * Enemy archetypes. `physics` describes the Matter body used to represent
 * them in the arena (mass/friction/restitution) so different enemies react
 * to the same collision very differently. `moves` is a fixed-order pattern
 * cycled by EnemyManager; each move is data the CombatEngine already knows
 * how to resolve (reuses the same effect resolver as cards where possible).
 */
export const ENEMIES = {
  gravelGoblin: {
    id: 'gravelGoblin',
    name: 'Gravel Goblin',
    maxHp: 42,
    armor: 0,
    physics: { mass: 4, friction: 0.4, frictionAir: 0.02, restitution: 0.2, radius: 28 },
    resistances: {},
    tags: ['common'],
    moves: [
      { id: 'claw', type: 'attack', damage: 8, intent: 'attack', label: 'Claw' },
      { id: 'claw2', type: 'attack', damage: 8, intent: 'attack', label: 'Claw' },
      { id: 'grit', type: 'defend', block: 6, intent: 'defend', label: 'Brace' },
    ],
  },
  shieldGuard: {
    id: 'shieldGuard',
    name: 'Shield Guard',
    maxHp: 58,
    armor: 6,
    physics: { mass: 8, friction: 0.7, frictionAir: 0.02, restitution: 0.05, radius: 30 },
    resistances: { directDamageMultiplier: 0.6 },
    tags: ['common', 'armored'],
    moves: [
      { id: 'bash', type: 'attack', damage: 10, intent: 'attack', label: 'Shield Bash' },
      { id: 'raiseShield', type: 'defend', block: 12, intent: 'defend', label: 'Raise Shield' },
      { id: 'bash2', type: 'attack', damage: 10, intent: 'attack', label: 'Shield Bash' },
    ],
    notes: 'Resists direct card damage but can still be knocked into hazards for full physics damage.',
  },
  heavyBrute: {
    id: 'heavyBrute',
    name: 'Heavy Brute',
    maxHp: 75,
    armor: 3,
    physics: { mass: 16, friction: 0.6, frictionAir: 0.03, restitution: 0.05, radius: 34 },
    resistances: { knockbackMultiplier: 0.35, explosiveDamageMultiplier: 1.5 },
    tags: ['elite'],
    moves: [
      { id: 'slam', type: 'attack', damage: 16, intent: 'attack', label: 'Ground Slam' },
      { id: 'roar', type: 'applyStatus', status: 'weak', amount: 2, intent: 'debuff', label: 'Intimidate' },
      { id: 'slam2', type: 'attack', damage: 16, intent: 'attack', label: 'Ground Slam' },
    ],
    notes: 'High mass makes knockback weak, but explosive damage hits it hard.',
  },
  skitterling: {
    id: 'skitterling',
    name: 'Skitterling',
    maxHp: 24,
    armor: 0,
    physics: { mass: 1.2, friction: 0.3, frictionAir: 0.01, restitution: 0.4, radius: 18 },
    resistances: { knockbackMultiplier: 1.6 },
    tags: ['common', 'light'],
    moves: [
      { id: 'dart', type: 'attack', damage: 5, intent: 'attack', label: 'Dart' },
      { id: 'dart2', type: 'attack', damage: 5, intent: 'attack', label: 'Dart' },
    ],
    notes: 'Light frame — flies far from even modest impulses.',
  },
  cinderMage: {
    id: 'cinderMage',
    name: 'Cinder Mage',
    maxHp: 46,
    armor: 0,
    physics: { mass: 3, friction: 0.3, frictionAir: 0.015, restitution: 0.15, radius: 24 },
    resistances: {},
    tags: ['common'],
    moves: [
      { id: 'ignite', type: 'applyStatus', status: 'burning', amount: 2, intent: 'debuff', label: 'Ignite' },
      { id: 'boltAttack', type: 'attack', damage: 9, intent: 'attack', label: 'Cinder Bolt' },
    ],
  },
  quarryTitan: {
    id: 'quarryTitan',
    name: 'Quarry Titan',
    maxHp: 160,
    armor: 8,
    physics: { mass: 30, friction: 0.7, frictionAir: 0.03, restitution: 0.02, radius: 44 },
    resistances: { knockbackMultiplier: 0.2, explosiveDamageMultiplier: 1.3 },
    tags: ['boss'],
    moves: [
      { id: 'crush', type: 'attack', damage: 20, intent: 'attack', label: 'Crush' },
      { id: 'quake', type: 'attack', damage: 12, intent: 'attackAll', label: 'Quake' },
      { id: 'harden', type: 'defend', block: 18, intent: 'defend', label: 'Harden' },
      { id: 'crush2', type: 'attack', damage: 20, intent: 'attack', label: 'Crush' },
    ],
    notes: 'Nearly immune to knockback. Must be worn down with direct and explosive damage.',
  },
}

export function getEnemy(id) {
  const def = ENEMIES[id]
  if (!def) throw new Error(`Unknown enemy: ${id}`)
  return def
}
