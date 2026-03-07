const Card = ({ style, children, ...props }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', ...style }} {...props}>{children}</div>
)
const CardContent = ({ style, children, ...props }) => (
  <div style={{ padding: '12px', ...style }} {...props}>{children}</div>
)
const CardFooter = ({ style, children, ...props }) => (
  <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', ...style }} {...props}>{children}</div>
)
export { Card, CardContent, CardFooter }
