import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const roleNav: Record<string, { path: string; label: string }[]> = {
  Recruiter: [{ path: '/recruiter', label: 'My Portal' }],
  Interviewer: [{ path: '/interviewer', label: 'Interviews' }],
  Manager: [{ path: '/manager', label: 'Dashboard' }],
  AccountManager: [{ path: '/manager', label: 'Dashboard' }],
  SuperAdmin: [
    { path: '/recruiter', label: 'Recruiter' },
    { path: '/interviewer', label: 'Interviewer' },
    { path: '/manager', label: 'Manager' },
  ],
};

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user ? (roleNav[user.role] ?? []) : [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: '#1a73e8',
        color: 'white',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'white', padding: '12px 0' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>RecruitmentAI</h1>
          <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Screening System</span>
        </Link>
        <nav style={{ display: 'flex', gap: '4px', marginLeft: 'auto', alignItems: 'center' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path} style={{
                color: 'white',
                textDecoration: 'none',
                padding: '14px 16px',
                fontSize: '0.9rem',
                borderBottom: isActive ? '3px solid white' : '3px solid transparent',
                opacity: isActive ? 1 : 0.8,
              }}>
                {item.label}
              </Link>
            );
          })}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {user.displayName} <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '6px 12px', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
          )}
        </nav>
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

