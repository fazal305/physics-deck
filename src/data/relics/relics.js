/**
 * Relics are passive modifiers. Each declares which gameplay hooks it
 * affects; CombatEngine/CardEngine read these multipliers directly rather
 * than relics subscribing to an event bus, since the set of hooks is small
 * and fixed. This keeps relic effects easy to reason about and to test.
 */
export const RELICS = {
  physicsCore: {
    id: 'physicsCore',
    name: 'Physics Core',
    description: 'Physics-based damage is increased by 15%.',
    hooks: { physicsDamageMultiplier: 1.15 },
  },
  reinforcedGravity: {
    id: 'reinforcedGravity',
    name: 'Reinforced Gravity Plating',
    description: 'Knockback forces you apply are 30% stronger.',
    hooks: { forceMultiplier: 1.3 },
  },
  kineticBattery: {
    id: 'kineticBattery',
    name: 'Kinetic Battery',
    description: 'The first physics card you play each turn costs 0.',
    hooks: { firstPhysicsCardFree: true },
  },
  collisionAmplifier: {
    id: 'collisionAmplifier',
    name: 'Collision Amplifier',
    description: 'Impacts above 15 speed deal 25% additional damage.',
    hooks: { highSpeedThreshold: 15, highSpeedDamageBonus: 1.25 },
  },
  quarrymansGrit: {
    id: 'quarrymansGrit',
    name: "Quarryman's Grit",
    description: 'Gain 3 additional Block whenever you play a Defend-type card.',
    hooks: { blockCardBonus: 3 },
  },
  emberSatchel: {
    id: 'emberSatchel',
    name: 'Ember Satchel',
    description: 'Burning you apply lasts 1 extra stack.',
    hooks: { burningBonusStacks: 1 },
  },
}

export function getRelic(id) {
  const relic = RELICS[id]
  if (!relic) throw new Error(`Unknown relic: ${id}`)
  return relic
}

export const RELIC_POOL_IDS = Object.keys(RELICS)
