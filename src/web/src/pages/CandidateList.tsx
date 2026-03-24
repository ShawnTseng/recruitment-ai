import { useEffect, useState, useRef, type FormEvent, type DragEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { candidateApi, submissionApi, type Candidate, type TokenResponse } from '../services/api'

export default function CandidateList() {
  const [searchParams] = useSearchParams();
  const questionnaireId = searchParams.get('questionnaireId');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New candidate form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Token generation
  const [generatedTokens, setGeneratedTokens] = useState<Record<string, TokenResponse>>({});
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);

  // Submission IDs per candidate (for report links)
  const [submissions, setSubmissions] = useState<Record<string, { id: string; submittedAt: string | null }[]>>({});

  useEffect(() => {
    candidateApi.getByWorkspace()
      .then(async (cands) => {
        setCandidates(cands);
        const subMap: Record<string, { id: string; submittedAt: string | null }[]> = {};
        await Promise.all(cands.map(async c => {
          try {
            const subs = await submissionApi.getByCandidate(c.id);
            subMap[c.id] = subs.map(s => ({ id: s.id, submittedAt: s.submittedAt }));
          } catch { /* ignore */ }
        }));
        setSubmissions(subMap);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleResumeSelect = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(ext ?? '')) {
      setError('Only .pdf, .docx, and .txt files are supported.');
      return;
    }
    setResumeFile(file);
    setError(null);
    setParsing(true);
    try {
      const result = await candidateApi.parseResume(file);
      if (result.name) setName(result.name);
      if (result.email) setEmail(result.email);
    } catch {
      // AI not available — user fills in manually, that's fine
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeSelect(file);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const candidate = await candidateApi.create({ name, email });
      setCandidates(prev => [...prev, candidate]);
      setName(''); setEmail(''); setResumeFile(null); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create candidate');
    }
  };

  const handleGenerateToken = async (candidateId: string) => {
    if (!questionnaireId) return;
    setGeneratingToken(candidateId);
    try {
      const token = await candidateApi.generateToken(candidateId, { questionnaireId });
      setGeneratedTokens(prev => ({ ...prev, [candidateId]: token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setGeneratingToken(null);
    }
  };

  return (
    <div>
      <Link to="/recruiter" style={{ fontSize: '0.85rem', color: '#1a73e8' }}>&larr; Back to Dashboard</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 24px' }}>
        <h2>Candidates</h2>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtn}>
          {showForm ? 'Cancel' : '+ Add Candidate'}
        </button>
      </div>

      {questionnaireId && (
        <div style={{ ...cardStyle, marginBottom: '16px', background: '#e8f0fe' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1a73e8' }}>
            Select a candidate to generate a questionnaire link (Questionnaire: {questionnaireId.slice(0, 8)}...)
          </p>
        </div>
      )}

      {error && <div style={{ color: '#d93025', marginBottom: '16px' }}>{error}</div>}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Add New Candidate</h3>
          <p style={{ fontSize: '0.8rem', color: '#5f6368', marginBottom: '12px' }}>
            Upload a resume to auto-fill name & email, or enter details manually.
          </p>

          {/* Resume upload / drag-drop area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? '#1a73e8' : '#dadce0'}`,
              borderRadius: '8px', padding: '16px',
              textAlign: 'center', cursor: 'pointer',
              background: dragOver ? '#e8f0fe' : '#fafafa',
              marginBottom: '12px', transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeSelect(f); }}
            />
            {parsing ? (
              <div style={{ color: '#1a73e8', fontSize: '0.9rem' }}>🤖 Parsing resume with AI...</div>
            ) : resumeFile ? (
              <div>
                <span style={{ fontWeight: 600, color: '#0d904f' }}>📄 {resumeFile.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#5f6368', marginLeft: '8px' }}>Click to change</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>
                📎 Drop resume here or click to upload (PDF / DOCX / TXT)
              </div>
            )}
          </div>

          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
            <input
              type="text"
              placeholder="Full Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="submit" disabled={parsing} style={primaryBtn}>
              {parsing ? 'Parsing...' : 'Create Candidate'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#5f6368' }}>Loading...</p>
      ) : candidates.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: '#5f6368', textAlign: 'center' }}>No candidates yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {candidates.map(c => (
            <div key={c.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{c.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>{c.email}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {c.resumeBlobUrl && <span style={badge('#0d904f')}>Resume ✓</span>}
                  {questionnaireId && !generatedTokens[c.id] && (
                    <button
                      onClick={() => handleGenerateToken(c.id)}
                      disabled={generatingToken === c.id}
                      style={{ ...primaryBtn, padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {generatingToken === c.id ? 'Generating...' : 'Send Questionnaire'}
                    </button>
                  )}
                </div>
              </div>

              {generatedTokens[c.id] && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#e6f4ea', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0d904f', marginBottom: '4px' }}>
                    Link Generated!
                  </div>
                  <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    <strong>URL:</strong> {generatedTokens[c.id].submissionUrl}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px' }}>
                    Expires: {new Date(generatedTokens[c.id].expiresAt).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedTokens[c.id].submissionUrl)}
                      style={{ ...secondaryBtn, padding: '4px 12px', fontSize: '0.8rem' }}
                    >
                      Copy Link
                    </button>
                    <Link
                      to={`/recruiter/report/${generatedTokens[c.id].submissionId}`}
                      style={{ padding: '4px 12px', background: '#1a73e8', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}
                    >
                      View Report →
                    </Link>
                  </div>
                </div>
              )}

              {!generatedTokens[c.id] && submissions[c.id]?.filter(s => s.submittedAt).map(sub => (
                <div key={sub.id} style={{ marginTop: '8px' }}>
                  <Link
                    to={`/recruiter/report/${sub.id}`}
                    style={{ fontSize: '0.85rem', color: '#1a73e8', textDecoration: 'none' }}
                  >
                    📋 View Report (submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''}) →
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #dadce0', borderRadius: '6px',
  fontSize: '0.9rem', width: '100%', boxSizing: 'border-box',
};
const primaryBtn: React.CSSProperties = {
  background: '#1a73e8', color: 'white', border: 'none', padding: '8px 20px',
  borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  background: 'white', color: '#333', border: '1px solid #dadce0',
  borderRadius: '6px', cursor: 'pointer',
};
const badge = (color: string): React.CSSProperties => ({
  background: `${color}15`, color, padding: '2px 8px',
  borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
});
