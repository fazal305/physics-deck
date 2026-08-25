import { Tooltip } from '../../components/Tooltip.jsx'

export function RelicBar({ relics }) {
  if (relics.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2" aria-label="Relics">
      {relics.map((relic) => (
        <Tooltip key={relic.id} label={`${relic.name} — ${relic.description}`}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface-raised
              text-xs font-bold text-gold"
          >
            {relic.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </Tooltip>
      ))}
    </div>
  )
}
