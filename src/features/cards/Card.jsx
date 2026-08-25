const TYPE_ACCENT = {
  attack: 'border-l-vital',
  skill: 'border-l-guard',
  physics: 'border-l-kinetic',
  status: 'border-l-gold',
}

const TYPE_LABEL = {
  attack: 'Attack',
  skill: 'Skill',
  physics: 'Physics',
  status: 'Status',
}

export function Card({ cardDef, instanceId, selected, affordable, onSelect, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(instanceId)}
      aria-pressed={selected}
      disabled={!affordable}
      className={`group flex ${compact ? 'h-40 w-28' : 'h-56 w-40'} flex-shrink-0 flex-col rounded-lg border border-border
        border-l-4 ${TYPE_ACCENT[cardDef.type] ?? 'border-l-border'} bg-surface-raised text-left shadow-[var(--shadow-card)]
        transition-transform duration-150 ease-out
        hover:-translate-y-1.5 focus-visible:-translate-y-1.5
        disabled:opacity-45 disabled:hover:translate-y-0 disabled:cursor-not-allowed
        ${selected ? 'ring-2 ring-ember-bright -translate-y-2' : ''}
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-bright`}
    >
      <div className="flex items-center justify-between px-2.5 pt-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-void text-xs font-semibold text-gold">
          {cardDef.cost}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-ink-faint">{TYPE_LABEL[cardDef.type]}</span>
      </div>
      <div className="px-2.5 pt-2">
        <h3 className="font-heading text-sm font-semibold leading-tight text-heading">{cardDef.name}</h3>
      </div>
      <p className={`flex-1 px-2.5 pb-2.5 pt-1.5 text-xs leading-snug text-ink-muted ${compact ? 'line-clamp-4' : ''}`}>
        {cardDef.description}
      </p>
    </button>
  )
}
