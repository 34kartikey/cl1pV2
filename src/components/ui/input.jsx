import { forwardRef } from 'react'

const Input = forwardRef(({ style, type, ...props }, ref) => (
  <input ref={ref} type={type}
    style={{ display: 'block', width: '100%', height: '36px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 300, outline: 'none', transition: 'border-color 150ms, box-shadow 150ms', ...style }}
    onFocus={e => { e.target.style.borderColor = '#000'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.08)' }}
    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
    {...props}
  />
))
Input.displayName = 'Input'
export { Input }
