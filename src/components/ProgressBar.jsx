export function ProgressBar({ value, max, colorClass = 'bg-vital', trackClass = 'bg-surface-inset', label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="w-full">
      <div
        className={`h-2.5 w-full overflow-hidden rounded-full ${trackClass}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className={`h-full rounded-full transition-[width] duration-300 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
