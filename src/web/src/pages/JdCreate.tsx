import { useState, useEffect, useRef, type FormEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobDescriptionApi, clientApi, type Client } from '../services/api'

type InputMode = 'text' | 'file';

export default function JdCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clientApi.getAll().then(setClients).catch(() => {/* non-blocking */});
  }, []);

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(ext ?? '')) {
      setError('Only .pdf, .docx, and .txt files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      let jd;
      if (inputMode === 'file' && selectedFile) {
        jd = await jobDescriptionApi.uploadFile({
          title: title.trim(),
          file: selectedFile,
          clientId: clientId || undefined,
        });
      } else {
        if (!rawText.trim()) { setError('Job description text is required.'); setLoading(false); return; }
        jd = await jobDescriptionApi.create({
          title: title.trim(),
          rawText: rawText.trim(),
          clientId: clientId || undefined,
        });
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
                <button type="button" onClick={() => navigate('/clients')}
                  style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>
                  Create a client first →{/* navigates to shared /clients page */}
                </button>
              </span>
            )}
          </div>

          {/* Input mode toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Job Description Content *</label>
            <div style={{ display: 'flex', gap: '0', marginBottom: '12px', border: '1px solid #dadce0', borderRadius: '6px', overflow: 'hidden', width: 'fit-content' }}>
              <button type="button" onClick={() => setInputMode('file')}
                style={{ padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                  background: inputMode === 'file' ? '#1a73e8' : 'white',
                  color: inputMode === 'file' ? 'white' : '#333' }}>
                📎 Upload File
              </button>
              <button type="button" onClick={() => setInputMode('text')}
                style={{ padding: '6px 16px', border: 'none', borderLeft: '1px solid #dadce0', cursor: 'pointer', fontSize: '0.875rem',
                  background: inputMode === 'text' ? '#1a73e8' : 'white',
                  color: inputMode === 'text' ? 'white' : '#333' }}>
                ✏️ Paste Text
              </button>
            </div>

            {inputMode === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? '#1a73e8' : '#dadce0'}`,
                  borderRadius: '8px', padding: '32px',
                  textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? '#e8f0fe' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontWeight: 600, color: '#1a73e8' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px' }}>Click to change file</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>☁️</div>
                    <div style={{ color: '#333', marginBottom: '4px' }}>Drag & drop or click to upload</div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368' }}>Supported: PDF, DOCX, TXT · Max 10MB</div>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste the full job description here..."
                style={{ ...inputStyle, minHeight: '300px', resize: 'vertical' }}
              />
            )}
          </div>

          {error && <div style={{ color: '#d93025', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading || (inputMode === 'file' && !selectedFile)} style={primaryBtnStyle}>
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
