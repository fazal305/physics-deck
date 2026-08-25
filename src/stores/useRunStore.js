import { create } from 'zustand'
import { generateMap } from '../engine/run/MapGenerator.js'
import { makeSeed } from '../utils/rng.js'

export const useRunStore = create((set, get) => ({
  status: 'notStarted', // notStarted | inProgress | victory | defeat
  seed: null,
  map: null,
  currentNodeId: null,
  visitedNodeIds: [],
  gold: 99,
  floorsCleared: 0,
  pendingReward: null, // { cardChoices, gold } shown after combat
  pendingEvent: null,
  playerHp: 70,
  playerMaxHp: 70,

  startRun(seed = makeSeed()) {
    const map = generateMap(seed)
    set({
      status: 'inProgress',
      seed,
      map,
      currentNodeId: null,
      visitedNodeIds: [],
      gold: 99,
      floorsCleared: 0,
      pendingReward: null,
      pendingEvent: null,
      playerHp: 70,
      playerMaxHp: 70,
    })
  },

  setPlayerHp(hp) {
    set((s) => ({ playerHp: Math.max(0, Math.min(s.playerMaxHp, hp)) }))
  },

  healPlayer(amount) {
    set((s) => ({ playerHp: Math.min(s.playerMaxHp, s.playerHp + amount) }))
  },

  damagePlayerOutOfCombat(amount) {
    set((s) => ({ playerHp: Math.max(0, s.playerHp - amount) }))
  },

  increaseMaxHp(amount) {
    set((s) => ({ playerMaxHp: s.playerMaxHp + amount, playerHp: s.playerHp + amount }))
  },

  travelTo(nodeId) {
    set((s) => ({ currentNodeId: nodeId, visitedNodeIds: [...s.visitedNodeIds, nodeId] }))
  },

  addGold(amount) {
    set((s) => ({ gold: s.gold + amount }))
  },

  spendGold(amount) {
    set((s) => ({ gold: Math.max(0, s.gold - amount) }))
  },

  completeFloor() {
    set((s) => ({ floorsCleared: s.floorsCleared + 1 }))
  },

  setPendingReward(reward) {
    set({ pendingReward: reward })
  },

  clearPendingReward() {
    set({ pendingReward: null })
  },

  setPendingEvent(evt) {
    set({ pendingEvent: evt })
  },

  clearPendingEvent() {
    set({ pendingEvent: null })
  },

  endRun(status) {
    set({ status })
  },

  getCurrentNode() {
    const { map, currentNodeId } = get()
    return currentNodeId ? map?.nodes[currentNodeId] : null
  },
}))
