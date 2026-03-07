import { forwardRef } from 'react'

const base = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: '6px', borderRadius: '8px', border: 'none', fontFamily: 'inherit',
  fontWeight: 400, letterSpacing: '-0.01em', cursor: 'pointer', outline: 'none',
  whiteSpace: 'nowrap', transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
  userSelect: 'none',
}
const variants = {
  default:     { background: '#000', color: '#fff' },
  ghost:       { background: 'transparent', color: 'var(--text-2)' },
  outline:     { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
  destructive: { background: 'var(--danger)', color: '#fff' },
  secondary:   { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
}
const sizes = {
  default: { height: '36px', padding: '0 16px', fontSize: '13px' },
  sm:      { height: '28px', padding: '0 12px', fontSize: '12px' },
  lg:      { height: '42px', padding: '0 24px', fontSize: '14px', fontWeight: 500 },
  icon:    { height: '32px', width: '32px', padding: '0' },
}

const Button = forwardRef(({ variant = 'default', size = 'default', style, disabled, children, ...props }, ref) => {
  const s = { ...base, ...variants[variant] || variants.default, ...sizes[size] || sizes.default }
  if (disabled) { s.opacity = 0.4; s.pointerEvents = 'none'; s.cursor = 'not-allowed' }
  return (
    <button ref={ref} style={{ ...s, ...style }} disabled={disabled}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === 'default') e.currentTarget.style.background = '#18181b'
        if (variant === 'ghost') { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' }
        if (variant === 'outline' || variant === 'secondary') { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }
      }}
      onMouseLeave={e => {
        if (disabled) return
        if (variant === 'default') e.currentTarget.style.background = '#000'
        if (variant === 'ghost') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }
        if (variant === 'outline') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }
        if (variant === 'secondary') { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)' }
      }}
      {...props}
    >{children}</button>
  )
})
Button.displayName = 'Button'
export { Button }
