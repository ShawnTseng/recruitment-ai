import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobDescriptionApi, clientApi, type Client } from '../services/api'

export default function JdCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientApi.getAll().then(setClients).catch(() => {/* non-blocking */});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const jd = await jobDescriptionApi.create({
        title: title.trim(),
        rawText: rawText.trim(),
        clientId: clientId || undefined,
      });
      navigate(`/recruiter/jd/${jd.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create JD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Create Job Description</h2>

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack Developer"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Client</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— No client assigned —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {clients.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px', display: 'block' }}>
                No clients yet.{' '}
                <button type="button" onClick={() => navigate('/recruiter/clients')}
                  style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>
                  Create a client first →
                </button>
              </span>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Job Description Text *</label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste the full job description here..."
              style={{ ...inputStyle, minHeight: '300px', resize: 'vertical' }}
              required
            />
          </div>

          {error && <div style={{ color: '#d93025', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Creating...' : 'Create Job Description'}
            </button>
            <button type="button" onClick={() => navigate('/recruiter')} style={secondaryBtnStyle}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#333',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #dadce0', borderRadius: '6px',
  fontSize: '0.9rem', boxSizing: 'border-box',
};
const primaryBtnStyle: React.CSSProperties = {
  background: '#1a73e8', color: 'white', border: 'none', padding: '10px 24px',
  borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
};
const secondaryBtnStyle: React.CSSProperties = {
  background: 'white', color: '#333', border: '1px solid #dadce0', padding: '10px 24px',
  borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
};
