import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Landing from './pages/Landing.jsx'
import ClipPage from './pages/ClipPage.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

const isAdminHost = typeof window !== 'undefined' &&
  (window.location.hostname === 'admin.cl1p.in' || window.location.hostname.startsWith('admin.'))

export default function App() {
  // Admin subdomain — render admin app without sidebar
  if (isAdminHost) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/:slug" element={<ClipPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
