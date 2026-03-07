const Label = ({ style, children, ...props }) => (
  <label style={{
    display: 'block', fontSize: '10px', fontWeight: 500,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-3)', ...style,
  }} {...props}>
    {children}
  </label>
)
export { Label }
