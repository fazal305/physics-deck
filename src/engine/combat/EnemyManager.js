/**
 * Drives enemy intent telegraphing and turn execution. Move selection is a
 * simple fixed-order cycle read from data (see data/enemies/enemies.js) —
 * deterministic and easy to reason about/test, while still reading as
 * "AI" because intents are telegraphed a turn ahead.
 */
export class EnemyManager {
  constructor() {
    this.moveIndex = new Map() // entityId -> index into def.moves
    this.selectedMove = new Map() // entityId -> current telegraphed move
    this.defs = new Map() // entityId -> enemy def
  }

  register(entityId, def) {
    this.moveIndex.set(entityId, 0)
    this.defs.set(entityId, def)
    this.rollIntent(entityId)
  }

  unregister(entityId) {
    this.moveIndex.delete(entityId)
    this.selectedMove.delete(entityId)
    this.defs.delete(entityId)
  }

  rollIntent(entityId) {
    const def = this.defs.get(entityId)
    if (!def) return null
    const idx = this.moveIndex.get(entityId) ?? 0
    const move = def.moves[idx % def.moves.length]
    this.selectedMove.set(entityId, move)
    return move
  }

  getSelectedMove(entityId) {
    return this.selectedMove.get(entityId)
  }

  advance(entityId) {
    const idx = this.moveIndex.get(entityId) ?? 0
    this.moveIndex.set(entityId, idx + 1)
  }

  executeTurn({ combatStore, statusEffects, log }) {
    const aliveEnemies = combatStore.enemies.filter((e) => e.hp > 0)
    for (const enemy of aliveEnemies) {
      const move = this.getSelectedMove(enemy.id)
      if (!move) continue

      combatStore.clearEnemyBlock(enemy.id)

      if (statusEffects.isStunned(enemy.id)) {
        log(`${enemy.name} is stunned and skips its turn.`)
        this.advance(enemy.id)
        this.rollIntent(enemy.id)
        continue
      }

      if (move.type === 'attack' || move.type === 'attackAll') {
        const outgoing = statusEffects.getOutgoingDamageMultiplier(enemy.id)
        const incoming = statusEffects.getIncomingDamageMultiplier('player')
        const amount = Math.round(move.damage * outgoing * incoming)
        combatStore.damagePlayer(amount)
        log(`${enemy.name} used ${move.label} for ${amount} damage.`)
      } else if (move.type === 'defend') {
        combatStore.addEnemyBlock(enemy.id, move.block)
        log(`${enemy.name} braces, gaining ${move.block} Block.`)
      } else if (move.type === 'applyStatus') {
        statusEffects.apply('player', move.status, move.amount)
        combatStore.syncPlayerStatuses(statusEffects.getAll('player'))
        log(`${enemy.name} used ${move.label} on you.`)
      }

      this.advance(enemy.id)
      this.rollIntent(enemy.id)
    }
  }

  syncIntentsToStore(combatStore) {
    for (const enemy of combatStore.enemies) {
      const move = this.getSelectedMove(enemy.id)
      if (move) combatStore.setEnemyIntent(enemy.id, move.label, move.intent)
    }
  }
}
