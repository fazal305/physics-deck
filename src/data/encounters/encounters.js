/**
 * Encounter definitions: which enemies appear together. MapGenerator picks
 * from these pools by node type; RoguelikeRunManager instantiates the actual
 * enemy state when a combat node is entered.
 */
export const NORMAL_ENCOUNTERS = [
  { id: 'goblinPair', enemyIds: ['gravelGoblin', 'gravelGoblin'] },
  { id: 'guardAndSkitter', enemyIds: ['shieldGuard', 'skitterling'] },
  { id: 'skitterSwarm', enemyIds: ['skitterling', 'skitterling', 'skitterling'] },
  { id: 'mageAndGoblin', enemyIds: ['cinderMage', 'gravelGoblin'] },
]

export const ELITE_ENCOUNTERS = [
  { id: 'lonelyBrute', enemyIds: ['heavyBrute'] },
  { id: 'bruteAndMage', enemyIds: ['heavyBrute', 'cinderMage'] },
]

export const BOSS_ENCOUNTERS = [
  { id: 'quarryTitanBoss', enemyIds: ['quarryTitan'] },
]

export const EVENTS = [
  {
    id: 'oldQuarryShrine',
    title: 'The Old Quarry Shrine',
    description: 'A weathered shrine hums with residual force. Something here wants to be disturbed.',
    choices: [
      { id: 'offer', label: 'Offer 20 gold', requiresGold: 20, outcome: { type: 'relic' } },
      { id: 'disturb', label: 'Disturb the shrine', outcome: { type: 'damageAndCard', damage: 8 } },
      { id: 'leave', label: 'Leave it be', outcome: { type: 'nothing' } },
    ],
  },
  {
    id: 'collapsedTunnel',
    title: 'Collapsed Tunnel',
    description: 'Loose rubble blocks the path forward. Digging through costs time and blood, but may be worth it.',
    choices: [
      { id: 'dig', label: 'Dig through (lose 6 HP)', outcome: { type: 'damageAndGold', damage: 6, gold: 35 } },
      { id: 'goAround', label: 'Go around', outcome: { type: 'nothing' } },
    ],
  },
]

export function pickRandomEncounter(pool, rng) {
  return pool[Math.floor(rng() * pool.length)]
}
