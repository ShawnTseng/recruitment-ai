import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginResponse {
  token: string;
  role: string;
  displayName: string;
  workspaceId: string | null;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data: LoginResponse = await res.json();
      login({ token: data.token, role: data.role, displayName: data.displayName, workspaceId: data.workspaceId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 4, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#1a73e8', fontWeight: 700 }}>RecruitmentAI</h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>Screening System</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#333', fontWeight: 500 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={inputStyle}
              autoComplete="username"
              required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#333', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fce8e6', borderRadius: 4, color: '#c5221f', fontSize: 14 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 12, background: loading ? '#5a9de8' : '#1a73e8',
              color: 'white', border: 'none', borderRadius: 4, fontSize: 15,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
