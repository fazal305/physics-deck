import { describe, expect, it, beforeEach } from 'vitest'
import { useDeckStore } from './useDeckStore.js'

describe('useDeckStore', () => {
  beforeEach(() => {
    useDeckStore.getState().resetToStarterDeck()
    useDeckStore.getState().seedRng(1)
  })

  it('startCombat shuffles the master deck into the draw pile without losing cards', () => {
    const before = useDeckStore.getState().masterDeck.length
    useDeckStore.getState().startCombat()
    const { drawPile, hand, discardPile } = useDeckStore.getState()
    expect(drawPile.length + hand.length + discardPile.length).toBe(before)
  })

  it('drawing more cards than available reshuffles discard into draw', () => {
    useDeckStore.getState().startCombat()
    const total = useDeckStore.getState().drawPile.length
    useDeckStore.getState().drawCards(total)
    useDeckStore.getState().discardHand()
    const drawn = useDeckStore.getState().drawCards(total)
    expect(drawn.length).toBe(total)
    expect(useDeckStore.getState().discardPile.length).toBe(0)
  })

  it('moveCardFromHand removes the card from hand and adds it to the destination pile', () => {
    useDeckStore.getState().startCombat()
    useDeckStore.getState().drawCards(3)
    const instanceId = useDeckStore.getState().hand[0].instanceId
    useDeckStore.getState().moveCardFromHand(instanceId, 'discard')
    expect(useDeckStore.getState().hand.some((c) => c.instanceId === instanceId)).toBe(false)
    expect(useDeckStore.getState().discardPile.some((c) => c.instanceId === instanceId)).toBe(true)
  })

  it('upgradeCardInMasterDeck swaps a card to its upgraded id', () => {
    const strikeInstance = useDeckStore.getState().masterDeck.find((c) => c.cardId === 'strike')
    useDeckStore.getState().upgradeCardInMasterDeck(strikeInstance.instanceId)
    const updated = useDeckStore.getState().masterDeck.find((c) => c.instanceId === strikeInstance.instanceId)
    expect(updated.cardId).toBe('strikePlus')
  })
})
