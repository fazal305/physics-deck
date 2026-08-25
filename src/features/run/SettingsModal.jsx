import { useSettingsStore } from '../../stores/useSettingsStore.js'
import { Button } from '../../components/Button.jsx'

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 text-sm text-ink">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-ember' : 'bg-surface-inset'}
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-bright`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  )
}

export function SettingsModal({ onClose }) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const screenShake = useSettingsStore((s) => s.screenShake)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion)
  const setScreenShake = useSettingsStore((s) => s.setScreenShake)
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border-strong bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-xl">Settings</h2>
        <Toggle label="Reduce motion" checked={reducedMotion} onChange={setReducedMotion} />
        <Toggle label="Screen shake" checked={screenShake} onChange={setScreenShake} />
        <Toggle label="Sound" checked={soundEnabled} onChange={setSoundEnabled} />
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
