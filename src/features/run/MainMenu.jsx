import { Button } from '../../components/Button.jsx'

export function MainMenu({ bestRun, onStartRun, onOpenSettings }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-8 p-6 text-center">
      <div>
        <h1 className="font-heading text-5xl font-semibold text-heading">Physics Deck</h1>
        <p className="mt-3 text-ink-muted">Every card is a physical object. Every fight is a chain reaction.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" onClick={onStartRun} className="px-8 py-3 text-base">
          Start Run
        </Button>
        <Button variant="secondary" onClick={onOpenSettings} className="px-8 py-3 text-base">
          Settings
        </Button>
      </div>

      {bestRun.floorsCleared > 0 && (
        <p className="text-xs uppercase tracking-wide text-ink-faint">
          Best run: {bestRun.floorsCleared} floors cleared · {bestRun.enemiesDefeated} enemies defeated
        </p>
      )}
    </div>
  )
}
