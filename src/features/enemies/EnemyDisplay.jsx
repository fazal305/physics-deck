import { ProgressBar } from '../../components/ProgressBar.jsx'
import { Tooltip } from '../../components/Tooltip.jsx'
import { getStatusDef } from '../../data/statusEffects/statusEffects.js'

const INTENT_LABEL = {
  attack: 'Attack',
  attackAll: 'Attack',
  defend: 'Defend',
  debuff: 'Debuff',
  unknown: '—',
}

export function EnemyDisplay({ enemy, targetable, targeted, onSelect }) {
  const statusEntries = Object.entries(enemy.statuses ?? {}).filter(([, v]) => v > 0)

  return (
    <button
      type="button"
      onClick={() => targetable && onSelect(enemy.id)}
      disabled={!targetable}
      aria-pressed={targeted}
      className={`flex w-40 flex-col gap-2 rounded-lg border p-3 text-left transition-colors
        ${targetable ? 'cursor-pointer border-border-strong bg-surface-raised hover:border-vital-bright' : 'border-border bg-surface'}
        ${targeted ? 'ring-2 ring-vital-bright' : ''}
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-bright
        disabled:cursor-default`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">{enemy.name}</span>
        <span
          className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted"
          title={enemy.intentLabel}
        >
          {INTENT_LABEL[enemy.intentType] ?? enemy.intentType} {enemy.intentType === 'attack' || enemy.intentType === 'attackAll' ? '↗' : ''}
        </span>
      </div>
      <ProgressBar value={enemy.hp} max={enemy.maxHp} colorClass="bg-vital-bright" label={`${enemy.name} health`} />
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          {enemy.hp} / {enemy.maxHp} HP
        </span>
        {enemy.block > 0 && <span className="text-gold">+{enemy.block} Block</span>}
      </div>
      {statusEntries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {statusEntries.map(([statusId, amount]) => (
            <Tooltip key={statusId} label={getStatusDef(statusId).description}>
              <span className="rounded bg-surface-inset px-1.5 py-0.5 text-[10px] text-ink-muted">
                {getStatusDef(statusId).name} {amount}
              </span>
            </Tooltip>
          ))}
        </div>
      )}
    </button>
  )
}
