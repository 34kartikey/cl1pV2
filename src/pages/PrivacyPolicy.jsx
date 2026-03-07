export default function PrivacyPolicy() {
  const items = [
    { title: 'No Registration', desc: 'You do not need to create an account to use Cl1p.' },
    { title: 'File & Text Sharing', desc: 'Files and text you share are stored securely and are only accessible via unique links.' },
    { title: 'No Selling of Data', desc: 'We do not sell, trade, or misuse your data.' },
    { title: 'Cookies', desc: 'We may use cookies for basic site functionality and analytics.' },
    { title: 'Third-Party Services', desc: 'We use Google Analytics and AdSense. These services may collect anonymous usage data as described in their own privacy policies.' },
    { title: 'Contact', desc: (
      <>For privacy concerns, contact <a href="mailto:kartikvaghasiya4477@gmail.com" style={{ color: '#2563eb', textDecoration: 'underline' }}>kartikvaghasiya4477@gmail.com</a>.</>
    )},
  ]

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em' }}>Privacy Policy</h1>
      <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.7 }}>
        Your privacy is important to us. This policy explains how Cl1p handles your information:
      </p>
      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>{item.title}:</strong> {item.desc}
          </li>
        ))}
      </ul>
    </main>
  )
}
