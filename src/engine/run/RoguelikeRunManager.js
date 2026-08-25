import { NORMAL_ENCOUNTERS, ELITE_ENCOUNTERS, BOSS_ENCOUNTERS, EVENTS, pickRandomEncounter } from '../../data/encounters/encounters.js'
import { CARD_REWARD_POOL_IDS, getCard } from '../../data/cards/cards.js'
import { RELIC_POOL_IDS, getRelic } from '../../data/relics/relics.js'
import { rngPick, shuffle } from '../../utils/rng.js'

const ENCOUNTER_POOLS = {
  combat: NORMAL_ENCOUNTERS,
  elite: ELITE_ENCOUNTERS,
  boss: BOSS_ENCOUNTERS,
}

export function isCombatNode(nodeType) {
  return nodeType === 'combat' || nodeType === 'elite' || nodeType === 'boss'
}

export function pickEncounterForNode(node, rng) {
  const pool = ENCOUNTER_POOLS[node.type]
  if (!pool) return null
  return pickRandomEncounter(pool, rng)
}

export function generateCardReward(rng, ownedRelicIds, count = 3) {
  const pool = shuffle(rng, CARD_REWARD_POOL_IDS)
  return pool.slice(0, count).map((id) => getCard(id))
}

export function generateGoldReward(nodeType, rng) {
  if (nodeType === 'elite') return 25 + Math.floor(rng() * 15)
  if (nodeType === 'boss') return 75
  return 10 + Math.floor(rng() * 10)
}

export function pickRandomEvent(rng) {
  return rngPick(rng, EVENTS)
}

export function pickShopRelic(rng, ownedRelicIds) {
  const available = RELIC_POOL_IDS.filter((id) => !ownedRelicIds.includes(id))
  if (available.length === 0) return null
  return getRelic(rngPick(rng, available))
}

export function pickRandomRelic(rng, ownedRelicIds) {
  return pickShopRelic(rng, ownedRelicIds)
}
