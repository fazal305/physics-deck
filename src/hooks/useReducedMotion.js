import { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore.js'

export function useReducedMotion() {
  const override = useSettingsStore((s) => s.reducedMotion)
  const [systemPreference, setSystemPreference] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setSystemPreference(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return override || systemPreference
}
