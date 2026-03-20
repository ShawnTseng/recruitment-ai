import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobDescriptionApi } from '../services/api'

const RECRUITER_ID = '00000000-0000-0000-0000-000000000001';

export default function JdCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let jd;
      if (mode === 'file' && file) {
        jd = await jobDescriptionApi.upload(RECRUITER_ID, title, file);
      } else {
        jd = await jobDescriptionApi.create(RECRUITER_ID, { title, rawText });
      }
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setMode('text')}
            style={tabStyle(mode === 'text')}
          >
            Paste Text
          </button>
          <button
            onClick={() => setMode('file')}
            style={tabStyle(mode === 'file')}
          >
            Upload File
          </button>
        </div>

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

          {mode === 'text' ? (
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
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Upload JD File (.pdf or .docx)</label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={inputStyle}
              />
            </div>
          )}

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
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
  fontSize: '0.875rem', fontWeight: 600,
  background: active ? '#1a73e8' : '#f1f3f4',
  color: active ? 'white' : '#5f6368',
});
