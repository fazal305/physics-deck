import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  reducedMotion: false,
  screenShake: true,
  soundEnabled: true,

  setReducedMotion(value) {
    set({ reducedMotion: value })
  },

  setScreenShake(value) {
    set({ screenShake: value })
  },

  setSoundEnabled(value) {
    set({ soundEnabled: value })
  },

  hydrate(settings) {
    set(settings)
  },
}))
