export function Panel({ title, className = '', children, actions = null }) {
  return (
    <section className={`rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)] ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
