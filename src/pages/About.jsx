export default function About() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em' }}>About Cl1p</h1>
      <p style={{ fontSize: '16px', color: 'var(--text-2)', lineHeight: 1.7 }}>
        Cl1p is a simple and secure platform for sharing files and text instantly with anyone, anywhere. Built with privacy and ease-of-use in mind, Cl1p helps you transfer information quickly without hassle.
      </p>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '10px' }}>About the Developer</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.7 }}>
          Hi, I'm Kartikey, a passionate software developer. I created Cl1p to make sharing information fast, secure, and accessible for everyone. My goal is to build tools that empower users and respect their privacy.
        </p>
      </div>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '10px' }}>Why Cl1p?</h2>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Instant file and text sharing with secure links',
            'No registration required',
            'Privacy-focused: your data is never sold or misused',
            'Easy to use on any device',
          ].map((item, i) => (
            <li key={i} style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.6 }}>{item}</li>
          ))}
        </ul>
      </div>
    </main>
  )
}
