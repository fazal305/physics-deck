import { create } from 'zustand'
import { getCard, STARTER_DECK_IDS } from '../data/cards/cards.js'
import { shuffle, createRng, makeSeed } from '../utils/rng.js'

let instanceCounter = 0
const makeInstance = (cardId) => ({ instanceId: `c${instanceCounter++}`, cardId })

export const useDeckStore = create((set, get) => ({
  masterDeck: STARTER_DECK_IDS.map(makeInstance), // persists across the whole run
  drawPile: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],
  rng: createRng(makeSeed()),

  seedRng(seed) {
    set({ rng: createRng(seed) })
  },

  startCombat() {
    const shuffled = shuffle(get().rng, get().masterDeck)
    set({ drawPile: shuffled, hand: [], discardPile: [], exhaustPile: [] })
  },

  drawCards(count) {
    let { drawPile, discardPile, hand } = get()
    const drawn = []
    for (let i = 0; i < count; i++) {
      if (drawPile.length === 0) {
        if (discardPile.length === 0) break
        drawPile = shuffle(get().rng, discardPile)
        discardPile = []
      }
      const [next, ...rest] = drawPile
      drawn.push(next)
      drawPile = rest
    }
    set({ drawPile, discardPile, hand: [...hand, ...drawn] })
    return drawn
  },

  discardHand() {
    set((s) => ({ discardPile: [...s.discardPile, ...s.hand], hand: [] }))
  },

  moveCardFromHand(instanceId, destination) {
    set((s) => {
      const card = s.hand.find((c) => c.instanceId === instanceId)
      if (!card) return {}
      const hand = s.hand.filter((c) => c.instanceId !== instanceId)
      if (destination === 'exhaust') return { hand, exhaustPile: [...s.exhaustPile, card] }
      return { hand, discardPile: [...s.discardPile, card] }
    })
  },

  addCardToMasterDeck(cardId) {
    set((s) => ({ masterDeck: [...s.masterDeck, makeInstance(cardId)] }))
  },

  removeCardFromMasterDeck(instanceId) {
    set((s) => ({ masterDeck: s.masterDeck.filter((c) => c.instanceId !== instanceId) }))
  },

  upgradeCardInMasterDeck(instanceId) {
    set((s) => ({
      masterDeck: s.masterDeck.map((c) => {
        if (c.instanceId !== instanceId) return c
        const def = getCard(c.cardId)
        return def.upgradesTo ? { ...c, cardId: def.upgradesTo } : c
      }),
    }))
  },

  loadMasterDeck(masterDeck) {
    instanceCounter = Math.max(instanceCounter, masterDeck.length)
    set({ masterDeck })
  },

  resetToStarterDeck() {
    set({ masterDeck: STARTER_DECK_IDS.map(makeInstance) })
  },
}))
