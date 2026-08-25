/**
 * Status effects are pure data: id, whether they tick down at end of turn,
 * and hooks the StatusEffectManager reads (damageMultiplier, forceMultiplier,
 * skipTurnChance, etc). Nothing here references React or Matter.
 */
export const STATUS_EFFECTS = {
  weak: {
    id: 'weak',
    name: 'Weak',
    description: 'Deals 25% less attack damage.',
    stacking: 'duration',
    outgoingDamageMultiplier: 0.75,
    tickTiming: 'endOfTurn',
  },
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    description: 'Takes 50% more damage.',
    stacking: 'duration',
    incomingDamageMultiplier: 1.5,
    tickTiming: 'endOfTurn',
  },
  frozen: {
    id: 'frozen',
    name: 'Frozen',
    description: 'Physics response is sluggish — reduced knockback and force resistance.',
    stacking: 'duration',
    forceResponseMultiplier: 0.4,
    tickTiming: 'endOfTurn',
  },
  heavy: {
    id: 'heavy',
    name: 'Heavy',
    description: 'Mass increased — harder to knock back, but slower to act.',
    stacking: 'duration',
    massMultiplier: 1.8,
    tickTiming: 'endOfTurn',
  },
  burning: {
    id: 'burning',
    name: 'Burning',
    description: 'Takes damage at the end of each turn.',
    stacking: 'intensity',
    damagePerStack: 3,
    tickTiming: 'endOfTurnDamage',
  },
  bleeding: {
    id: 'bleeding',
    name: 'Bleeding',
    description: 'Takes damage whenever it takes physics impact damage.',
    stacking: 'intensity',
    onImpactDamagePerStack: 2,
    tickTiming: 'endOfTurn',
  },
  stunned: {
    id: 'stunned',
    name: 'Stunned',
    description: 'Skips its next action.',
    stacking: 'duration',
    skipsAction: true,
    tickTiming: 'startOfTurn',
  },
  shocked: {
    id: 'shocked',
    name: 'Shocked',
    description: 'The next collision this receives deals bonus damage.',
    stacking: 'intensity',
    nextImpactBonus: 8,
    tickTiming: 'onConsume',
  },
}

export function getStatusDef(id) {
  const def = STATUS_EFFECTS[id]
  if (!def) throw new Error(`Unknown status effect: ${id}`)
  return def
}
