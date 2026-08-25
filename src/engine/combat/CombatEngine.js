import { PhysicsEngine } from '../physics/PhysicsEngine.js'
import { PhysicsEventBridge } from '../events/PhysicsEventBridge.js'
import { StatusEffectManager } from './StatusEffectManager.js'
import { EnemyManager } from './EnemyManager.js'
import { CardEngine } from './CardEngine.js'
import { TurnManager } from './TurnManager.js'
import { getEnemy } from '../../data/enemies/enemies.js'
import { getCard } from '../../data/cards/cards.js'
import { ARENA } from '../physics/arenaConfig.js'
import { useCombatStore } from '../../stores/useCombatStore.js'
import { useDeckStore } from '../../stores/useDeckStore.js'
import { useRelicStore } from '../../stores/useRelicStore.js'

const HAND_SIZE = 5

/**
 * Orchestrates one combat encounter end to end: spawns physics bodies for
 * every combatant, wires the physics event bridge, and drives the turn
 * cycle. Instantiated fresh per encounter by the combat screen; destroyed on
 * unmount/encounter end.
 */
export class CombatEngine {
  constructor(eventBus) {
    this.bus = eventBus
    this.physicsEngine = new PhysicsEngine(eventBus)
    this.statusEffects = new StatusEffectManager()
    this.enemyManager = new EnemyManager()
    this.cardEngine = new CardEngine()
    this.turnManager = new TurnManager()
    this.bridge = new PhysicsEventBridge(eventBus, this)
    this.usedFreePhysicsCardThisTurn = false
  }

  _log(text, kind = 'info') {
    useCombatStore.getState().addLog(text, kind)
  }

  start(enemyIds, playerVitals = {}) {
    const combatStore = useCombatStore.getState()
    const deckStore = useDeckStore.getState()
    this.statusEffects.clearAll()

    const maxHp = playerVitals.maxHp ?? 70
    const hp = playerVitals.hp ?? maxHp
    const player = { hp, maxHp, block: 0, energy: 3, maxEnergy: 3, statuses: {} }
    this.physicsEngine.spawnCombatant('player', {
      x: ARENA.playerX,
      y: ARENA.playerY,
      team: 'player',
      physics: { mass: 6, friction: 0.5, frictionAir: 0.02, restitution: 0.1, radius: 26 },
      hp: player.maxHp,
    })

    const enemies = enemyIds.map((enemyDefId, index) => {
      const def = getEnemy(enemyDefId)
      const entityId = `enemy_${index}`
      this.physicsEngine.spawnCombatant(entityId, {
        x: ARENA.enemyBaseX + index * ARENA.enemySpacing,
        y: ARENA.enemyY,
        team: 'enemy',
        physics: def.physics,
        hp: def.maxHp,
      })
      this.enemyManager.register(entityId, def)
      return {
        id: entityId,
        defId: enemyDefId,
        name: def.name,
        hp: def.maxHp,
        maxHp: def.maxHp,
        armor: def.armor,
        block: 0,
        resistances: def.resistances ?? {},
        statuses: {},
        intentLabel: '',
        intentType: 'unknown',
        notes: def.notes ?? null,
      }
    })

    combatStore.resetCombat({ player, enemies })
    this.enemyManager.syncIntentsToStore(useCombatStore.getState())

    deckStore.startCombat()
    deckStore.drawCards(HAND_SIZE)

    this.physicsEngine.start()
    this._log('Combat begins.')
  }

  playCard(instanceId, chosenTargetId) {
    const deckStore = useDeckStore.getState()
    const combatStore = useCombatStore.getState()
    const relicStore = useRelicStore.getState()

    const cardInstance = deckStore.hand.find((c) => c.instanceId === instanceId)
    if (!cardInstance) return { ok: false, reason: 'notInHand' }
    const cardDef = getCard(cardInstance.cardId)

    if (cardDef.targetType === 'chosenEnemy' && !chosenTargetId) {
      return { ok: false, reason: 'needsTarget' }
    }

    let cost = cardDef.cost
    let usedFreeCard = false
    if (
      cardDef.type === 'physics' &&
      !this.usedFreePhysicsCardThisTurn &&
      relicStore.hasRelic('kineticBattery')
    ) {
      cost = 0
      usedFreeCard = true
    }

    if (combatStore.player.energy < cost) {
      return { ok: false, reason: 'notEnoughEnergy' }
    }

    combatStore.spendEnergy(cost)
    if (usedFreeCard) this.usedFreePhysicsCardThisTurn = true
    deckStore.moveCardFromHand(instanceId, cardDef.exhausts ? 'exhaust' : 'discard')

    this._log(`You played ${cardDef.name}.`)
    this.cardEngine.resolveCard(cardDef, {
      chosenTargetId,
      physicsEngine: this.physicsEngine,
      statusEffects: this.statusEffects,
      combatStore: useCombatStore.getState(),
      deckStore: useDeckStore.getState(),
      relicStore,
      log: (text) => this._log(text),
    })

    this._reapDefeatedEnemies()
    this._checkVictory()
    return { ok: true }
  }

  applyPhysicsCollision(payload) {
    const combatStore = useCombatStore.getState()
    const relicStore = useRelicStore.getState()
    const physicsMult = relicStore.getHookValue('physicsDamageMultiplier', 1)
    const highSpeedThreshold = relicStore.getHookValue('highSpeedThreshold', Infinity)
    const highSpeedBonus =
      payload.impactSpeed >= highSpeedThreshold ? relicStore.getHookValue('highSpeedDamageBonus', 1) : 1
    const incomingMult = this.statusEffects.getIncomingDamageMultiplier(payload.targetEntityId)

    let damage = Math.round(payload.damage * physicsMult * highSpeedBonus * incomingMult)
    if (damage <= 0) return

    if (payload.targetTeam === 'enemy') {
      combatStore.damageEnemy(payload.targetEntityId, damage)
    } else {
      combatStore.damagePlayer(damage)
    }

    const forceResponse = this.statusEffects.getForceResponseMultiplier(payload.targetEntityId)
    const massMult = this.statusEffects.getMassMultiplier(payload.targetEntityId)
    if (payload.knockbackImpulse) {
      this.physicsEngine.world.applyForce(payload.targetEntityId, {
        x: (payload.knockbackImpulse.x * forceResponse) / massMult,
        y: (payload.knockbackImpulse.y * forceResponse) / massMult,
      })
    }

    if (payload.appliesStatus) {
      this.statusEffects.apply(payload.targetEntityId, payload.appliesStatus.id, payload.appliesStatus.duration)
      this._syncStatuses(payload.targetEntityId)
    }

    const targetName = payload.targetTeam === 'player' ? 'you' : combatStore.getEnemy(payload.targetEntityId)?.name ?? 'the enemy'
    this._log(
      `${payload.objectKind.replace('_', ' ')} hit ${targetName} at ${payload.impactSpeed.toFixed(1)} impact speed for ${damage} damage.`
    )

    if (payload.targetTeam === 'enemy') {
      this._reapDefeatedEnemies()
      this._checkVictory()
    } else {
      this._checkDefeat()
    }
  }

  applyExplosion(payload) {
    const combatStore = useCombatStore.getState()
    const relicStore = useRelicStore.getState()
    const physicsMult = relicStore.getHookValue('physicsDamageMultiplier', 1)
    this._log('An explosive barrel detonated!', 'warn')

    for (const hit of payload.affected) {
      if (hit.damage <= 0) continue
      const enemy = hit.team === 'enemy' ? combatStore.getEnemy(hit.entityId) : null
      const explosiveMult = enemy?.resistances?.explosiveDamageMultiplier ?? 1
      const incomingMult = this.statusEffects.getIncomingDamageMultiplier(hit.entityId)
      const damage = Math.round(hit.damage * physicsMult * explosiveMult * incomingMult)
      if (hit.team === 'enemy') combatStore.damageEnemy(hit.entityId, damage)
      else combatStore.damagePlayer(damage)
      this._log(`Explosion dealt ${damage} damage to ${hit.team === 'player' ? 'you' : enemy?.name ?? hit.entityId}.`)
    }

    this._reapDefeatedEnemies()
    this._checkVictory()
    this._checkDefeat()
  }

  _syncStatuses(entityId) {
    const combatStore = useCombatStore.getState()
    const statuses = this.statusEffects.getAll(entityId)
    if (entityId === 'player') combatStore.syncPlayerStatuses(statuses)
    else combatStore.syncEnemyStatuses(entityId, statuses)
  }

  _reapDefeatedEnemies() {
    const combatStore = useCombatStore.getState()
    for (const enemy of combatStore.enemies) {
      if (enemy.hp <= 0) {
        this.physicsEngine.removeCombatant(enemy.id)
        this.enemyManager.unregister(enemy.id)
        this.statusEffects.clearEntity(enemy.id)
        this._log(`${enemy.name} was defeated.`)
      }
    }
    combatStore.removeDefeatedEnemies()
  }

  _checkVictory() {
    const combatStore = useCombatStore.getState()
    if (combatStore.phase === 'playerTurn' && combatStore.enemies.length === 0) {
      combatStore.setPhase('victory')
      this.physicsEngine.stop()
      this._log('Victory!', 'success')
    }
  }

  _checkDefeat() {
    const combatStore = useCombatStore.getState()
    if (combatStore.player.hp <= 0 && combatStore.phase !== 'defeat') {
      combatStore.setPhase('defeat')
      this.physicsEngine.stop()
      this._log('You have fallen.', 'danger')
    }
  }

  endPlayerTurn() {
    const combatStore = useCombatStore.getState()
    if (!this.turnManager.canEndPlayerTurn(combatStore.phase)) return
    const deckStore = useDeckStore.getState()
    deckStore.discardHand()

    const burnDamage = this.statusEffects.tickEndOfTurnDamage('player')
    if (burnDamage > 0) {
      combatStore.damagePlayer(burnDamage)
      this._log(`Burning dealt ${burnDamage} damage to you.`)
    }
    this._checkDefeat()
    if (useCombatStore.getState().phase === 'defeat') return

    combatStore.setPhase('enemyTurn')
  }

  runEnemyTurn() {
    const combatStore = useCombatStore.getState()
    if (!this.turnManager.canRunEnemyTurn(combatStore.phase)) return

    this.enemyManager.executeTurn({
      combatStore: useCombatStore.getState(),
      statusEffects: this.statusEffects,
      log: (text) => this._log(text),
    })

    this._checkDefeat()
    if (useCombatStore.getState().phase === 'defeat') return

    for (const enemy of useCombatStore.getState().enemies) {
      const burnDamage = this.statusEffects.tickEndOfTurnDamage(enemy.id)
      if (burnDamage > 0) {
        combatStore.damageEnemy(enemy.id, burnDamage)
        this._log(`Burning dealt ${burnDamage} damage to ${enemy.name}.`)
      }
      this.statusEffects.decayDurations(enemy.id)
      this._syncStatuses(enemy.id)
    }
    this.statusEffects.decayDurations('player')
    this._syncStatuses('player')

    this._reapDefeatedEnemies()
    this._checkVictory()
    if (useCombatStore.getState().phase === 'victory') return

    this.physicsEngine.clearSpawnedObjects()
    combatStore.incrementTurn()
    this._startPlayerTurn()
  }

  _startPlayerTurn() {
    const combatStore = useCombatStore.getState()
    const deckStore = useDeckStore.getState()
    combatStore.clearPlayerBlock()
    combatStore.refillEnergy()
    this.usedFreePhysicsCardThisTurn = false
    deckStore.drawCards(HAND_SIZE)
    this.enemyManager.syncIntentsToStore(useCombatStore.getState())
    combatStore.setPhase('playerTurn')
  }

  destroy() {
    this.bridge.destroy()
    this.physicsEngine.destroy()
    this.statusEffects.clearAll()
  }
}
