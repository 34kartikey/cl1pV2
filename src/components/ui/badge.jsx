const Badge = ({ style, children, ...props }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-2)', color: 'var(--text-2)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 400, border: '1px solid var(--border)', ...style }} {...props}>
    {children}
  </span>
)
export { Badge }
