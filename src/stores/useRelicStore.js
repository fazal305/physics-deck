import { create } from 'zustand'
import { getRelic } from '../data/relics/relics.js'

export const useRelicStore = create((set, get) => ({
  ownedRelicIds: [],

  addRelic(relicId) {
    if (get().ownedRelicIds.includes(relicId)) return
    set((s) => ({ ownedRelicIds: [...s.ownedRelicIds, relicId] }))
  },

  hasRelic(relicId) {
    return get().ownedRelicIds.includes(relicId)
  },

  reset() {
    set({ ownedRelicIds: [] })
  },

  getHookValue(hookName, fallback = 1) {
    const relics = get().ownedRelicIds.map(getRelic)
    let value = fallback
    for (const relic of relics) {
      if (relic.hooks[hookName] == null) continue
      value = hookName.endsWith('Multiplier') ? value * relic.hooks[hookName] : relic.hooks[hookName]
    }
    return value
  },

  getOwnedRelics() {
    return get().ownedRelicIds.map(getRelic)
  },
}))
