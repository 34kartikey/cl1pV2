import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Lock, Upload } from 'lucide-react'

const instructions = [
  { icon: Search, title: 'Search for a Cl1p', desc: 'Enter a cl1p name and click search. If found, the content and files will be displayed.' },
  { icon: Plus, title: 'Create a New Cl1p', desc: "If a cl1p isn't found, you can create a new one with the same name. Add text, files, and optional password." },
  { icon: Lock, title: 'Password Protection', desc: 'Add an optional password to your cl1p for extra security. Only those with the password can access it.' },
  { icon: Upload, title: 'File Sharing', desc: 'Upload and share files along with your cl1p text. All files are easily accessible when viewing the cl1p.' },
]

const inputStyle = {
  display: 'block', width: '100%', padding: '8px 12px', fontSize: '13px',
  border: '1px solid var(--border)', borderRadius: '6px', outline: 'none',
  background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit',
  transition: 'box-shadow 150ms, border-color 150ms',
}

export default function Landing() {
  const [slug, setSlug] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const navigate = useNavigate()

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const v = slug.trim().replace(/\s+/g, '-').toLowerCase()
    if (!v) return
    navigate(`/${v}`)
  }

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? '64px 16px 48px' : '48px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>Cl1p</h3>
          <p style={{ fontSize: '18px', color: 'var(--text-2)', maxWidth: '480px', margin: '0 auto' }}>
            Share files and text instantly with secure links
          </p>
        </div>

        {/* Search card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow)', padding: '28px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '9px' }}>Cl1p Name</label>
                <input
                  type="text" placeholder="Enter cl1p name" value={slug} required
                  onChange={e => setSlug(e.target.value)}
                  autoFocus autoComplete="off" spellCheck={false}
                  style={{ ...inputStyle, padding: '12px 14px', fontSize: '15px', fontWeight: 500, borderRadius: '7px' }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.12)'; e.target.style.borderColor = '#000' }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)' }}
                />
              </div>
              <button type="submit"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '7px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 150ms' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Search size={16} />
                Search Or Create
              </button>
            </form>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>How to Use Cl1p</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Get started with these simple steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {instructions.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', padding: '20px 24px', transition: 'box-shadow 200ms', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--surface-2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color="#374151" />
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{item.title}</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
