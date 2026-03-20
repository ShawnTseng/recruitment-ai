import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: '#1a73e8',
        color: 'white',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>RecruitmentAI</h1>
        <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Screening System</span>
      </header>
      <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '12px',
        fontSize: '0.75rem',
        color: '#6c757d',
        borderTop: '1px solid #dee2e6',
      }}>
        &copy; {new Date().getFullYear()} RecruitmentAI
      </footer>
    </div>
  )
}
