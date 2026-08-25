const NODE_LABEL = {
  combat: 'Combat',
  elite: 'Elite',
  boss: 'Boss',
  shop: 'Shop',
  rest: 'Rest',
  event: 'Event',
}

const NODE_ACCENT = {
  combat: 'border-vital text-vital-bright',
  elite: 'border-ember text-ember-bright',
  boss: 'border-gold text-gold',
  shop: 'border-kinetic text-kinetic-bright',
  rest: 'border-guard text-guard-bright',
  event: 'border-ink-faint text-ink-muted',
}

export function MapNode({ node, status, onSelect }) {
  const disabled = status !== 'available'
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      disabled={disabled}
      aria-current={status === 'current' ? 'step' : undefined}
      className={`flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full border-2 text-[10px] font-semibold
        uppercase tracking-wide transition-all
        ${NODE_ACCENT[node.type]}
        ${status === 'visited' ? 'opacity-40' : ''}
        ${status === 'locked' ? 'opacity-30 grayscale' : ''}
        ${status === 'available' ? 'bg-surface-raised shadow-[var(--shadow-card)] hover:scale-110 cursor-pointer' : 'bg-surface cursor-default'}
        ${status === 'current' ? 'ring-2 ring-ember-bright' : ''}
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-bright`}
    >
      <span>{NODE_LABEL[node.type]}</span>
    </button>
  )
}
