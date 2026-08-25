import { describe, expect, it, vi } from 'vitest'
import { CardEngine } from './CardEngine.js'
import { StatusEffectManager } from './StatusEffectManager.js'
import { getCard } from '../../data/cards/cards.js'

function makeCombatStoreStub(enemyOverrides = {}) {
  const enemy = { id: 'enemy_0', name: 'Gravel Goblin', hp: 42, maxHp: 42, block: 0, armor: 0, resistances: {}, ...enemyOverrides }
  return {
    enemies: [enemy],
    getEnemy: (id) => (id === 'enemy_0' ? enemy : undefined),
    damageEnemy: vi.fn((id, amount) => {
      enemy.hp -= amount
    }),
    damagePlayer: vi.fn(),
    addPlayerBlock: vi.fn(),
    addEnemyBlock: vi.fn(),
    gainEnergy: vi.fn(),
    syncPlayerStatuses: vi.fn(),
    syncEnemyStatuses: vi.fn(),
    armChainReaction: vi.fn(),
  }
}

function makeRelicStoreStub(overrides = {}) {
  return { getHookValue: (name, fallback) => overrides[name] ?? fallback, hasRelic: () => false }
}

describe('CardEngine.resolveCard', () => {
  it('applies flat damage to the chosen target', () => {
    const cardEngine = new CardEngine()
    const combatStore = makeCombatStoreStub()
    cardEngine.resolveCard(getCard('strike'), {
      chosenTargetId: 'enemy_0',
      physicsEngine: { dispatch: vi.fn() },
      statusEffects: new StatusEffectManager(),
      combatStore,
      deckStore: { drawCards: vi.fn() },
      relicStore: makeRelicStoreStub(),
      log: () => {},
    })
    expect(combatStore.damageEnemy).toHaveBeenCalledWith('enemy_0', 6)
  })

  it('reduces damage by enemy armor and applies resistance multiplier', () => {
    const cardEngine = new CardEngine()
    const combatStore = makeCombatStoreStub({ armor: 2, resistances: { directDamageMultiplier: 0.5 } })
    cardEngine.resolveCard(getCard('strike'), {
      chosenTargetId: 'enemy_0',
      physicsEngine: { dispatch: vi.fn() },
      statusEffects: new StatusEffectManager(),
      combatStore,
      deckStore: { drawCards: vi.fn() },
      relicStore: makeRelicStoreStub(),
      log: () => {},
    })
    // (6 - 2) * 0.5 = 2
    expect(combatStore.damageEnemy).toHaveBeenCalledWith('enemy_0', 2)
  })

  it('applies weak (outgoing) and vulnerable (incoming) multipliers together', () => {
    const cardEngine = new CardEngine()
    const combatStore = makeCombatStoreStub()
    const statusEffects = new StatusEffectManager()
    statusEffects.apply('player', 'weak', 1)
    statusEffects.apply('enemy_0', 'vulnerable', 1)
    cardEngine.resolveCard(getCard('strike'), {
      chosenTargetId: 'enemy_0',
      physicsEngine: { dispatch: vi.fn() },
      statusEffects,
      combatStore,
      deckStore: { drawCards: vi.fn() },
      relicStore: makeRelicStoreStub(),
      log: () => {},
    })
    // 6 * 0.75 (weak) * 1.5 (vulnerable) = 6.75 -> rounds to 7
    expect(combatStore.damageEnemy).toHaveBeenCalledWith('enemy_0', 7)
  })

  it('dispatches a SPAWN_OBJECT physics command for physics cards', () => {
    const cardEngine = new CardEngine()
    const dispatch = vi.fn()
    cardEngine.resolveCard(getCard('boulder'), {
      chosenTargetId: 'enemy_0',
      physicsEngine: { dispatch },
      statusEffects: new StatusEffectManager(),
      combatStore: makeCombatStoreStub(),
      deckStore: { drawCards: vi.fn() },
      relicStore: makeRelicStoreStub(),
      log: () => {},
    })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ objectKind: 'boulder', target: { entityId: 'enemy_0' } })
    )
  })
})
