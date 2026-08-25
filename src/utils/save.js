const STORAGE_KEY = 'physics-deck/save-v1'

const DEFAULT_SAVE = {
  settings: { reducedMotion: false, screenShake: true, soundEnabled: true },
  bestRun: { floorsCleared: 0, enemiesDefeated: 0 },
  unlocks: { seenCards: [] },
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SAVE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SAVE, ...parsed }
  } catch {
    return DEFAULT_SAVE
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently, run continues unsaved
  }
}

export function updateSave(patch) {
  const current = loadSave()
  const next = { ...current, ...patch }
  writeSave(next)
  return next
}

export function recordBestRun(floorsCleared, enemiesDefeated) {
  const current = loadSave()
  if (floorsCleared > current.bestRun.floorsCleared) {
    return updateSave({ bestRun: { floorsCleared, enemiesDefeated } })
  }
  return current
}
