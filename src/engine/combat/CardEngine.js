import { PHYSICS_COMMAND } from '../events/eventTypes.js'
import { getStatusDef } from '../../data/statusEffects/statusEffects.js'

/**
 * Resolves a card's data-driven `effects` array against the current combat
 * state. Adding a new card never requires touching this file as long as it
 * only uses effect `type`s already implemented in EFFECT_RESOLVERS.
 */
const EFFECT_RESOLVERS = {
  damage(effect, ctx) {
    const targets = resolveTargets(effect.target, ctx)
    for (const targetId of targets) {
      const isPlayer = targetId === 'player'
      const outgoingMult = ctx.statusEffects.getOutgoingDamageMultiplier('player')
      const incomingMult = ctx.statusEffects.getIncomingDamageMultiplier(targetId)
      let amount = effect.amount * outgoingMult * incomingMult
      if (!isPlayer) {
        const enemy = ctx.combatStore.getEnemy(targetId)
        const armor = enemy?.armor ?? 0
        const directMult = enemy?.resistances?.directDamageMultiplier ?? 1
        amount = Math.max(1, (amount - armor) * directMult)
      }
      amount = Math.round(amount)
      if (isPlayer) ctx.combatStore.damagePlayer(amount)
      else ctx.combatStore.damageEnemy(targetId, amount)
      ctx.log(`${ctx.sourceName} dealt ${amount} damage to ${targetId === 'player' ? 'you' : ctx.combatStore.getEnemy(targetId)?.name ?? targetId}.`)
    }
  },

  block(effect, ctx) {
    const bonus = ctx.relicStore.getHookValue('blockCardBonus', 0)
    const amount = effect.amount + (typeof bonus === 'number' && bonus !== 1 ? bonus : 0)
    if (effect.target === 'self') {
      ctx.combatStore.addPlayerBlock(amount)
      ctx.log(`You gained ${amount} Block.`)
    } else {
      ctx.combatStore.addEnemyBlock(effect.target, amount)
    }
  },

  draw(effect, ctx) {
    ctx.deckStore.drawCards(effect.amount)
    ctx.log(`You drew ${effect.amount} card${effect.amount === 1 ? '' : 's'}.`)
  },

  energy(effect, ctx) {
    ctx.combatStore.gainEnergy(effect.amount)
  },

  applyStatus(effect, ctx) {
    const targets = resolveTargets(effect.target, ctx)
    let amount = effect.amount
    if (effect.status === 'burning') {
      amount += ctx.relicStore.getHookValue('burningBonusStacks', 0) || 0
    }
    for (const targetId of targets) {
      ctx.statusEffects.apply(targetId, effect.status, amount)
      syncStatuses(targetId, ctx)
      ctx.log(`${targetId === 'player' ? 'You' : ctx.combatStore.getEnemy(targetId)?.name ?? targetId} gained ${amount} ${getStatusDef(effect.status).name}.`)
    }
  },

  spawnObject(effect, ctx) {
    const targets = resolveTargets(effect.target, ctx)
    for (const targetId of targets) {
      if (targetId === 'player') continue
      ctx.physicsEngine.dispatch({
        type: PHYSICS_COMMAND.SPAWN_OBJECT,
        objectKind: effect.objectKind,
        target: { entityId: targetId },
        spawnSide: effect.spawnSide,
        launchSpeed: effect.launchSpeed ?? 0,
        count: effect.count ?? 1,
        spread: effect.spread ?? 0,
      })
    }
    ctx.log(`${ctx.sourceName} sent a ${effect.objectKind.replace('_', ' ')} into the arena.`)
  },

  applyForce(effect, ctx) {
    const targets = resolveTargets(effect.target, ctx)
    const forceMult = ctx.relicStore.getHookValue('forceMultiplier', 1)
    for (const targetId of targets) {
      ctx.physicsEngine.dispatch({
        type: PHYSICS_COMMAND.APPLY_FORCE,
        target: { entityId: targetId },
        magnitude: effect.magnitude * forceMult,
        direction: effect.direction,
      })
      const targetName = targetId === 'player' ? 'You were' : `${ctx.combatStore.getEnemy(targetId)?.name ?? targetId} was`
      ctx.log(`${targetName} knocked backward.`)
    }
  },

  setGravity(effect, ctx) {
    ctx.physicsEngine.dispatch({ type: PHYSICS_COMMAND.SET_GRAVITY, gravityY: effect.gravityY })
    ctx.log(`The arena's gravity shifted.`)
  },

  attractToPoint(effect, ctx) {
    const targets = resolveTargets(effect.target, ctx)
    for (const targetId of targets) {
      ctx.physicsEngine.dispatch({
        type: PHYSICS_COMMAND.ATTRACT_TO_POINT,
        target: { entityId: targetId },
        radius: effect.radius,
        strength: effect.strength,
      })
    }
  },

  armChainReaction(_effect, ctx) {
    ctx.combatStore.armChainReaction()
    ctx.physicsEngine.collisions.armChainReaction()
    ctx.log('The next collision will trigger a chain reaction.')
  },
}

function resolveTargets(target, ctx) {
  if (target === 'self') return ['player']
  if (target === 'chosenEnemy') return ctx.chosenTargetId ? [ctx.chosenTargetId] : []
  if (target === 'allEnemies') return ctx.combatStore.enemies.map((e) => e.id)
  if (typeof target === 'string') return [target]
  return []
}

function syncStatuses(entityId, ctx) {
  const statuses = ctx.statusEffects.getAll(entityId)
  if (entityId === 'player') ctx.combatStore.syncPlayerStatuses(statuses)
  else ctx.combatStore.syncEnemyStatuses(entityId, statuses)
}

export class CardEngine {
  resolveCard(cardDef, { chosenTargetId, physicsEngine, statusEffects, combatStore, deckStore, relicStore, log }) {
    const ctx = {
      chosenTargetId,
      physicsEngine,
      statusEffects,
      combatStore,
      deckStore,
      relicStore,
      log,
      sourceName: 'You',
    }
    for (const effect of cardDef.effects) {
      const resolver = EFFECT_RESOLVERS[effect.type]
      if (!resolver) {
        console.warn(`No resolver for card effect type "${effect.type}"`)
        continue
      }
      resolver(effect, ctx)
    }
  }
}
