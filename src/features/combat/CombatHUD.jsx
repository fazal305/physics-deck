import { ProgressBar } from '../../components/ProgressBar.jsx'
import { Tooltip } from '../../components/Tooltip.jsx'
import { getStatusDef } from '../../data/statusEffects/statusEffects.js'

export function CombatHUD({ player, turnNumber, phase }) {
  const statusEntries = Object.entries(player.statuses ?? {}).filter(([, v]) => v > 0)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex min-w-52 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kinetic-dim text-sm font-bold text-kinetic-bright">
          You
        </div>
        <div className="flex-1">
          <ProgressBar value={player.hp} max={player.maxHp} colorClass="bg-kinetic-bright" label="Your health" />
          <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
            <span>
              {player.hp} / {player.maxHp} HP
            </span>
            {player.block > 0 && <span className="text-gold">+{player.block} Block</span>}
          </div>
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
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface-inset px-3 py-1.5">
          <span className="text-xs uppercase tracking-wide text-ink-faint">Energy</span>
          <span className="text-lg font-bold text-ember-bright">
            {player.energy}/{player.maxEnergy}
          </span>
        </div>
        <div className="text-xs uppercase tracking-wide text-ink-faint">
          Turn {turnNumber} · <span className="text-ink">{phase === 'playerTurn' ? 'Your move' : 'Enemy move'}</span>
        </div>
      </div>
    </div>
  )
}
