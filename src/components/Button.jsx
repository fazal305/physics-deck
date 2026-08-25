const VARIANT_CLASSES = {
  primary: 'bg-ember hover:bg-ember-bright text-void border-transparent',
  secondary: 'bg-surface-raised hover:bg-border-strong text-ink border-border-strong',
  ghost: 'bg-transparent hover:bg-surface-raised text-ink-muted border-border',
  danger: 'bg-vital hover:bg-vital-bright text-ink border-transparent',
}

export function Button({ variant = 'secondary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium
        transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-bright
        ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
