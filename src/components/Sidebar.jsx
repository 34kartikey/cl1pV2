import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const MOBILE_BP = 768

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < MOBILE_BP)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < MOBILE_BP
      setIsMobile(mobile)
      if (!mobile) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function go(path) { navigate(path); setOpen(false) }

  const sidebarStyle = {
    width: '256px',
    minWidth: '256px',
    minHeight: '100vh',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    ...(isMobile ? {
      position: 'fixed',
      top: 0, left: 0,
      height: '100vh',
      zIndex: 40,
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1)',
    } : { position: 'relative' }),
  }

  const linkStyle = {
    display: 'block', padding: '10px 16px', borderRadius: '8px',
    color: '#374151', fontWeight: 500, fontSize: '14px',
    background: 'transparent', border: 'none', fontFamily: 'inherit',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    transition: 'background 150ms',
  }

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && !open && (
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          style={{ position: 'fixed', top: '12px', left: '12px', zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '99px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
        >
          <Menu size={20} color="#374151" />
        </button>
      )}

      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Mobile close */}
        {isMobile && open && (
          <button onClick={() => setOpen(false)} aria-label="Close menu"
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '99px', padding: '6px', cursor: 'pointer', display: 'flex', zIndex: 1 }}
          >
            <X size={18} color="#374151" />
          </button>
        )}

        <div>
          {/* Logo — click goes home */}
          <button onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', marginBottom: '8px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
            <img src="/favicon.ico" alt="Cl1p Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Cl1p</span>
          </button>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 16px' }}>
            {[
              { label: 'Home', path: '/' },
              { label: 'About', path: '/about' },
              { label: 'Contact', path: '/contact' },
              { label: 'Privacy Policy', path: '/privacy-policy' },
            ].map(item => (
              <button key={item.path} style={linkStyle} onClick={() => go(item.path)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{item.label}</button>
            ))}
          </nav>
        </div>

        <footer style={{ fontSize: '11px', color: 'var(--text-3)', padding: '16px' }}>
          &copy; 2025 Cl1p by Kartikey
        </footer>
      </aside>

      {/* Mobile backdrop */}
      {isMobile && open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 30 }}
        />
      )}
    </>
  )
}
