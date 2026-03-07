const Progress = ({ value = 0, style, className }) => (
  <div style={{
    width: '100%', height: '4px', borderRadius: '99px',
    background: 'var(--surface-2)', overflow: 'hidden',
    border: '1px solid var(--border)', ...style,
  }} className={className}>
    <div style={{
      height: '100%', borderRadius: '99px',
      background: 'var(--primary)',
      width: `${Math.min(100, Math.max(0, value))}%`,
      transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
    }} />
  </div>
)
export { Progress }
