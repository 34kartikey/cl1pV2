import { forwardRef } from 'react'

const Select = forwardRef(({ style, children, ...props }, ref) => (
  <select
    ref={ref}
    style={{
      height: '28px', borderRadius: '4px',
      background: 'var(--surface-2)', color: 'var(--text)',
      border: '1px solid var(--border)', padding: '0 8px',
      fontSize: '12px', fontFamily: 'inherit', fontWeight: 300,
      outline: 'none', cursor: 'pointer', transition: 'border-color 150ms',
      colorScheme: 'light', ...style,
    }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'
export { Select }
