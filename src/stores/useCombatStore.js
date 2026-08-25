import { create } from 'zustand'

let logIdCounter = 0

const initialState = {
  phase: 'idle', // idle | playerTurn | resolving | enemyTurn | victory | defeat
  turnNumber: 0,
  player: { hp: 70, maxHp: 70, block: 0, energy: 3, maxEnergy: 3 },
  enemies: [], // { id, name, hp, maxHp, armor, block, intentLabel, intentType, statuses, tags, notes }
  log: [],
  selectedCardInstanceId: null,
  chainReactionArmed: false,
}

export const useCombatStore = create((set, get) => ({
  ...initialState,

  resetCombat({ player, enemies }) {
    set({
      phase: 'playerTurn',
      turnNumber: 1,
      player,
      enemies,
      log: [],
      selectedCardInstanceId: null,
      chainReactionArmed: false,
    })
  },

  setPhase(phase) {
    set({ phase })
  },

  incrementTurn() {
    set((s) => ({ turnNumber: s.turnNumber + 1 }))
  },

  addLog(text, kind = 'info') {
    set((s) => ({ log: [...s.log, { id: logIdCounter++, text, kind }].slice(-80) }))
  },

  damagePlayer(amount) {
    set((s) => {
      const blockAbsorbed = Math.min(s.player.block, amount)
      const remaining = amount - blockAbsorbed
      const hp = Math.max(0, s.player.hp - remaining)
      return { player: { ...s.player, block: s.player.block - blockAbsorbed, hp } }
    })
  },

  healPlayer(amount) {
    set((s) => ({ player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + amount) } }))
  },

  addPlayerBlock(amount) {
    set((s) => ({ player: { ...s.player, block: s.player.block + amount } }))
  },

  clearPlayerBlock() {
    set((s) => ({ player: { ...s.player, block: 0 } }))
  },

  spendEnergy(amount) {
    set((s) => ({ player: { ...s.player, energy: Math.max(0, s.player.energy - amount) } }))
  },

  gainEnergy(amount) {
    set((s) => ({ player: { ...s.player, energy: s.player.energy + amount } }))
  },

  refillEnergy() {
    set((s) => ({ player: { ...s.player, energy: s.player.maxEnergy } }))
  },

  damageEnemy(entityId, rawAmount) {
    set((s) => ({
      enemies: s.enemies.map((e) => {
        if (e.id !== entityId) return e
        const blockAbsorbed = Math.min(e.block, rawAmount)
        const remaining = rawAmount - blockAbsorbed
        const hp = Math.max(0, e.hp - remaining)
        return { ...e, block: e.block - blockAbsorbed, hp }
      }),
    }))
  },

  addEnemyBlock(entityId, amount) {
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === entityId ? { ...e, block: e.block + amount } : e)),
    }))
  },

  clearEnemyBlock(entityId) {
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === entityId ? { ...e, block: 0 } : e)),
    }))
  },

  setEnemyIntent(entityId, intentLabel, intentType) {
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === entityId ? { ...e, intentLabel, intentType } : e)),
    }))
  },

  syncEnemyStatuses(entityId, statuses) {
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === entityId ? { ...e, statuses } : e)),
    }))
  },

  syncPlayerStatuses(statuses) {
    set((s) => ({ player: { ...s.player, statuses } }))
  },

  removeDefeatedEnemies() {
    set((s) => ({ enemies: s.enemies.filter((e) => e.hp > 0) }))
  },

  setSelectedCard(instanceId) {
    set({ selectedCardInstanceId: instanceId })
  },

  armChainReaction() {
    set({ chainReactionArmed: true })
  },

  consumeChainReaction() {
    const wasArmed = get().chainReactionArmed
    if (wasArmed) set({ chainReactionArmed: false })
    return wasArmed
  },

  getEnemy(entityId) {
    return get().enemies.find((e) => e.id === entityId)
  },
}))
