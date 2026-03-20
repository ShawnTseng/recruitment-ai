import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { candidateApi, submissionApi, type Candidate, type TokenResponse } from '../services/api'

const WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

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

  // Token generation
  const [generatedTokens, setGeneratedTokens] = useState<Record<string, TokenResponse>>({});
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);

  // Submission IDs per candidate (for report links)
  const [submissions, setSubmissions] = useState<Record<string, { id: string; submittedAt: string | null }[]>>({});

  useEffect(() => {
    candidateApi.getByWorkspace(WORKSPACE_ID)
      .then(async (cands) => {
        setCandidates(cands);
        // Load submissions for each candidate to enable report links
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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const candidate = await candidateApi.create({ name, email, workspaceId: WORKSPACE_ID });
      setCandidates(prev => [...prev, candidate]);
      setName(''); setEmail(''); setShowForm(false);
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
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Add New Candidate</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <button type="submit" style={primaryBtn}>Create</button>
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

              {/* Show report links for existing submissions */}
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
