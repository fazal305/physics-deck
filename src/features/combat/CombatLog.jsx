import { useEffect, useRef } from 'react'

const KIND_COLOR = {
  info: 'text-ink-muted',
  success: 'text-guard-bright',
  danger: 'text-vital-bright',
  warn: 'text-ember-bright',
}

export function CombatLog({ entries }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [entries.length])

  return (
    <div
      ref={listRef}
      className="h-full min-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-surface-inset p-3 font-mono text-xs"
      aria-live="polite"
      aria-label="Combat log"
    >
      {entries.map((entry) => (
        <p key={entry.id} className={KIND_COLOR[entry.kind] ?? 'text-ink-muted'}>
          {entry.text}
        </p>
      ))}
    </div>
  )
}
