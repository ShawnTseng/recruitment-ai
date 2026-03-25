import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/api';

const ROLES = [
  { role: 'Recruiter',      label: 'Recruiter',       desc: '管理 JD、候選人與問卷',    color: '#1a73e8' },
  { role: 'Interviewer',    label: 'Interviewer',     desc: '進行 Stage 2 技術面試',    color: '#0f9d58' },
  { role: 'Manager',        label: 'Manager',         desc: '查看 KPI 與系統參數',      color: '#f57c00' },
  { role: 'AccountManager', label: 'Account Manager', desc: '管理客戶回饋',             color: '#7b1fa2' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRoleLogin = async (role: string) => {
    setError('');
    setLoading(role);
    try {
      const res = await fetch(`${API_BASE}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      login({ token: data.token, role: data.role, displayName: data.displayName, workspaceId: data.workspaceId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#1a73e8', fontWeight: 700 }}>RecruitmentAI</h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>選擇角色以進入系統</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROLES.map(({ role, label, desc, color }) => (
            <button
              key={role}
              onClick={() => handleRoleLogin(role)}
              disabled={loading !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', background: loading === role ? '#eee' : 'white',
                border: `2px solid ${color}`, borderRadius: 6, cursor: loading !== null ? 'not-allowed' : 'pointer',
                textAlign: 'left', transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: color }}>{label}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{desc}</div>
              </div>
              {loading === role && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>登入中…</span>}
            </button>
          ))}
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: '10px 12px', background: '#fce8e6', borderRadius: 4, color: '#c5221f', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
