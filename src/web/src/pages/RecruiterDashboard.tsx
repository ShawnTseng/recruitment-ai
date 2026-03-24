import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  jobDescriptionApi, candidateApi, submissionApi, feedbackApi,
  type JobDescription, type Candidate, type TokenResponse, type ClientFeedback,
} from '../services/api'

type Tab = 'jd' | 'candidates' | 'feedback';

export default function RecruiterDashboard() {
  const [tab, setTab] = useState<Tab>('jd');
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px' }}>Recruiter Portal</h2>
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e0e0e0' }}>
          {([
            { key: 'jd', label: 'Job Descriptions' },
            { key: 'candidates', label: 'Candidates' },
            { key: 'feedback', label: 'Client Feedback' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#1a73e8' : '#5f6368',
              borderBottom: tab === t.key ? '2px solid #1a73e8' : '2px solid transparent',
              marginBottom: '-2px',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'jd' && <JdTab navigate={navigate} />}
      {tab === 'candidates' && <CandidatesTab />}
      {tab === 'feedback' && <FeedbackTab />}
    </div>
  );
}

// ─── JD Tab ──────────────────────────────────────────────────────────────────

function JdTab({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobDescriptionApi.getAll()
      .then(setJds)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Group JDs by client
  const grouped = jds.reduce<Record<string, { name: string; jds: JobDescription[] }>>((acc, jd) => {
    const key = jd.clientId ?? '__none__';
    const label = jd.clientName ?? 'No Client';
    if (!acc[key]) acc[key] = { name: label, jds: [] };
    acc[key].jds.push(jd);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>{jds.length} job description(s)</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/recruiter/clients')} style={secondaryBtn}>Manage Clients</button>
          <button onClick={() => navigate('/recruiter/jd/new')} style={primaryBtn}>+ New JD</button>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {loading ? <p style={{ color: '#5f6368' }}>Loading...</p>
        : jds.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ color: '#5f6368', textAlign: 'center' }}>No job descriptions yet. Create one to get started.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([key, group]) => (
            <div key={key} style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5f6368', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.name}
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {group.jds.map(jd => (
                  <div key={jd.id} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => navigate(`/recruiter/jd/${jd.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{jd.title}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {jd.parsedJson
                          ? <span style={badge('#0d904f')}>Parsed</span>
                          : <span style={badge('#f9ab00')}>Pending</span>}
                        <span style={{ fontSize: '0.8rem', color: '#5f6368' }}>
                          {new Date(jd.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
    </div>
  );
}

// ─── Candidates Tab ───────────────────────────────────────────────────────────

function CandidatesTab() {
  const { user: _authUser } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [generatedTokens, setGeneratedTokens] = useState<Record<string, TokenResponse>>({});
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, { id: string; submittedAt: string | null }[]>>({});
  const [questionnaires, setQuestionnaires] = useState<{ id: string; title: string }[]>([]);
  const [selectedQId, setSelectedQId] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      candidateApi.getByWorkspace(),
      jobDescriptionApi.getAll(),
    ])
      .then(async ([cands, jds]) => {
        setCandidates(cands);
        // Flatten questionnaires from all JDs for token generation
        const { questionnaireApi } = await import('../services/api');
        const qItems: { id: string; title: string }[] = [];
        await Promise.all(jds.map(async jd => {
          try {
            const qs = await questionnaireApi.getByJd(jd.id);
            qs.forEach(q => qItems.push({ id: q.id, title: `${jd.title} (v${q.templateVersion ?? '1'})` }));
          } catch { /* ignore */ }
        }));
        setQuestionnaires(qItems);
        // Load submissions
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
      const c = await candidateApi.create({ name, email });
      setCandidates(prev => [...prev, c]);
      setName(''); setEmail(''); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create candidate');
    }
  };

  const handleGenerateToken = async (candidateId: string) => {
    const qId = selectedQId[candidateId];
    if (!qId) { setError('Please select a questionnaire first'); return; }
    setGeneratingToken(candidateId);
    try {
      const token = await candidateApi.generateToken(candidateId, { questionnaireId: qId });
      setGeneratedTokens(prev => ({ ...prev, [candidateId]: token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setGeneratingToken(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>{candidates.length} candidate(s)</span>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtn}>
          {showForm ? 'Cancel' : '+ Add Candidate'}
        </button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>New Candidate</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '10px' }}>
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <button type="submit" style={primaryBtn}>Create</button>
          </form>
        </div>
      )}

      {loading ? <p style={{ color: '#5f6368' }}>Loading...</p>
        : candidates.length === 0 ? (
          <div style={cardStyle}><p style={{ color: '#5f6368', textAlign: 'center' }}>No candidates yet.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {candidates.map(c => (
              <div key={c.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{c.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>{c.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {questionnaires.length > 0 && (
                      <select
                        value={selectedQId[c.id] ?? ''}
                        onChange={e => setSelectedQId(prev => ({ ...prev, [c.id]: e.target.value }))}
                        style={{ ...inputStyle, width: 'auto', fontSize: '0.8rem', padding: '4px 8px' }}
                      >
                        <option value="">Select questionnaire…</option>
                        {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                      </select>
                    )}
                    <button
                      onClick={() => handleGenerateToken(c.id)}
                      disabled={generatingToken === c.id || !selectedQId[c.id]}
                      style={{ ...primaryBtn, padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {generatingToken === c.id ? '...' : 'Send Link'}
                    </button>
                  </div>
                </div>

                {generatedTokens[c.id] && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#e6f4ea', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d904f' }}>Link Generated</div>
                    <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', margin: '4px 0' }}>{generatedTokens[c.id].submissionUrl}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button onClick={() => navigator.clipboard.writeText(generatedTokens[c.id].submissionUrl)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '0.8rem' }}>
                        Copy
                      </button>
                      <button onClick={() => navigate(`/recruiter/report/${generatedTokens[c.id].submissionId}`)} style={{ ...primaryBtn, padding: '4px 10px', fontSize: '0.8rem' }}>
                        View Report →
                      </button>
                    </div>
                  </div>
                )}

                {!generatedTokens[c.id] && submissions[c.id]?.filter(s => s.submittedAt).map(sub => (
                  <div key={sub.id} style={{ marginTop: '8px' }}>
                    <button onClick={() => navigate(`/recruiter/report/${sub.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8', fontSize: '0.85rem', padding: 0 }}>
                      📋 View Report (submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''}) →
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

function FeedbackTab() {
  const { user } = useAuth();
  const workspaceId = user?.workspaceId ?? '';
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    feedbackApi.getByRecruiter(workspaceId)
      .then(setFeedbacks)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const outcomeColor: Record<string, string> = { Hired: '#0d904f', Rejected: '#d93025', Pending: '#f9ab00' };

  return (
    <div>
      {error && <div style={errorBox}>{error}</div>}
      {loading ? <p style={{ color: '#5f6368' }}>Loading...</p>
        : feedbacks.length === 0 ? (
          <div style={cardStyle}><p style={{ color: '#5f6368', textAlign: 'center' }}>No client feedback yet.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {feedbacks.map(f => {
              let tags: string[] = [];
              try { tags = JSON.parse(f.tags); } catch { /* ignore */ }
              return (
                <div key={f.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={badge(outcomeColor[f.outcome] ?? '#5f6368')}>{f.outcome}</span>
                    <span style={{ fontSize: '0.8rem', color: '#5f6368' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  {f.comments && <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>{f.comments}</p>}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {tags.map((t, i) => <span key={i} style={badge('#1a73e8')}>{t}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};

const errorBox: React.CSSProperties = {
  color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px',
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
  borderRadius: '6px', cursor: 'pointer', padding: '8px 20px', fontSize: '0.9rem',
};

const badge = (color: string): React.CSSProperties => ({
  background: `${color}20`, color, padding: '2px 8px',
  borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
});
