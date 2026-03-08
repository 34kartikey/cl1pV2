export default function Contact() {
  const contacts = [
    {
      label: '34kartikey@gmail.com',
      href: 'mailto:34kartikey@gmail.com',
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
