import { useId, useState } from 'react'

export function Tooltip({ label, children }) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined} tabIndex={0}>
        {children}
      </span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-64 -translate-x-1/2 rounded-md
            border border-border-strong bg-surface-raised px-3 py-2 text-xs text-ink shadow-[var(--shadow-panel)]"
        >
          {label}
        </span>
      )}
    </span>
  )
}
