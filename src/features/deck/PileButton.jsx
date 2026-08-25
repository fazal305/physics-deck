import { useState } from 'react'
import { getCard } from '../../data/cards/cards.js'

export function PileButton({ label, cards }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex flex-col items-center gap-1 rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-xs
          text-ink-muted transition-colors hover:border-ember-bright focus-visible:outline focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-ember-bright"
      >
        <span className="text-lg font-bold text-heading">{cards.length}</span>
        <span className="uppercase tracking-wide">{label}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 max-h-64 w-56 -translate-x-1/2 overflow-y-auto rounded-md
          border border-border-strong bg-surface-raised p-2 text-left shadow-[var(--shadow-panel)]">
          {cards.length === 0 && <p className="p-2 text-xs text-ink-faint">Empty.</p>}
          <ul className="space-y-1">
            {cards.map((c) => (
              <li key={c.instanceId} className="rounded px-2 py-1 text-xs text-ink hover:bg-surface-inset">
                {getCard(c.cardId).name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
