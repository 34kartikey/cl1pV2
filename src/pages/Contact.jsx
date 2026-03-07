export default function Contact() {
  const contacts = [
    {
      label: 'kartikvaghasiya4477@gmail.com',
      href: 'mailto:kartikvaghasiya4477@gmail.com',
      icon: (
        <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#2563eb', flexShrink: 0 }}>
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 20v-9.99l7.99 7.99c.39.39 1.02.39 1.41 0L20 10.01V20H4z"/>
        </svg>
      ),
    },
    {
      label: 'kartikey-vaghasiya',
      href: 'https://www.linkedin.com/in/kartikey-vaghasiya',
      icon: (
        <svg width="26" height="26" fill="#0a66c2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/>
        </svg>
      ),
    },
    {
      label: 'k4rt1key',
      href: 'https://github.com/k4rt1key',
      icon: (
        <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.589 8.199-6.085 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
    },
  ]

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em' }}>Contact</h1>
      <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.7 }}>
        Have questions, feedback, or need support? Reach out to me directly:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {contacts.map((c, i) => (
          <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', textDecoration: 'none', color: 'var(--text)', fontWeight: 500, fontSize: '14px', transition: 'box-shadow 200ms' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            {c.icon}
            <span>{c.label}</span>
          </a>
        ))}
      </div>
    </main>
  )
}
