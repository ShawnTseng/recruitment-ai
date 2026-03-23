import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  interviewApi, evaluationApi, candidateApi, submissionApi,
  type InterviewGuide, type EvaluationReport, type Candidate,
} from '../services/api'

interface GuideData {
  confirmedStrengths: Array<{ area: string; evidence: string }>
  areasToProbe: Array<{ area: string; concern: string }>
  interviewQuestions: Array<{ question: string; expectedGoodAnswer: string; redFlagAnswer: string }>
  estimatedDuration: string
  guideMarkdown: string
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
}

const sectionHeader: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: '14px',
  color: '#202124',
}

// ─── Interviewer Landing (list view) ─────────────────────────────────────────

interface QueueItem {
  candidate: Candidate;
  submissionId: string;
  submittedAt: string;
  stage1: EvaluationReport | null;
}

export function InterviewerLanding() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    candidateApi.getByWorkspace()
      .then(async (candidates) => {
        const items: QueueItem[] = [];
        await Promise.all(candidates.map(async c => {
          try {
            const subs = await submissionApi.getByCandidate(c.id);
            await Promise.all(subs.filter(s => s.submittedAt).map(async s => {
              try {
                const evals = await evaluationApi.getBySubmission(s.id);
                const stage1 = evals.find(e => e.stage === 1) ?? null;
                items.push({
                  candidate: c,
                  submissionId: s.id,
                  submittedAt: s.submittedAt!,
                  stage1,
                });
              } catch { /* ignore */ }
            }));
          } catch { /* ignore */ }
        }));
        // Sort by submitted date desc
        items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setQueue(items);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const rec = (r: string | null) => {
    if (!r) return { label: 'Not Evaluated', color: '#5f6368' };
    const map: Record<string, string> = { Pass: '#1e7e34', Hold: '#856404', Reject: '#721c24' };
    return { label: r, color: map[r] ?? '#5f6368' };
  };

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }}>Technical Interviewer Portal</h2>
      <p style={{ color: '#5f6368', marginBottom: '24px', fontSize: '0.9rem' }}>
        Candidates who have submitted Stage 1 questionnaires
      </p>

      {error && <div style={{ color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}

      {loading ? <p style={{ color: '#5f6368' }}>Loading candidates...</p>
        : queue.length === 0 ? (
          <div style={cardStyle}><p style={{ color: '#5f6368', textAlign: 'center' }}>No submitted questionnaires yet.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {queue.map(item => {
              const { label, color } = rec(item.stage1?.recommendation ?? null);
              return (
                <div key={item.submissionId} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{item.candidate.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>
                        Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {item.stage1 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{item.stage1.aiScore.toFixed(0)}</div>
                          <div style={{ background: `${color}20`, color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {label}
                          </div>
                        </div>
                      )}
                      {!item.stage1 && (
                        <span style={{ background: '#f1f3f4', color: '#5f6368', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                          {label}
                        </span>
                      )}
                      <button
                        onClick={() => navigate(`/interviewer/${item.submissionId}`)}
                        style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        Interview Guide →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── Interview Guide Detail ───────────────────────────────────────────────────

export default function InterviewerPortal() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<InterviewGuide | null>(null)
  const [stage1, setStage1] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!submissionId) return
    Promise.all([
      interviewApi.getBySubmission(submissionId).catch(() => null),
      evaluationApi.getBySubmission(submissionId).then(rpts => rpts.find(r => r.stage === 1) ?? null),
    ])
      .then(([g, s1]) => {
        setGuide(g)
        setStage1(s1)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [submissionId])

  const handleGenerate = async () => {
    if (!submissionId) return
    setGenerating(true)
    setError(null)
    try {
      const g = await interviewApi.generate(submissionId)
      setGuide(g)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate interview guide')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading interview guide…</div>

  let guideData: GuideData | null = null
  if (guide) {
    try { guideData = JSON.parse(guide.guideJson) } catch { /* ignore */ }
  }

  const avgScore = Object.keys(scores).length > 0
    ? (Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length).toFixed(1)
    : null

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/interviewer')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8', fontSize: '0.85rem', padding: 0, marginBottom: '8px' }}>
            ← Back to Candidate List
          </button>
          <h2 style={{ margin: '8px 0 4px' }}>Stage 2 Interview Guide</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Submission: {submissionId}</p>
        </div>
        {stage1 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Stage 1 Score</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stage1.aiScore.toFixed(0)}</div>
            <div style={{
              padding: '3px 12px',
              borderRadius: '12px',
              display: 'inline-block',
              fontSize: '0.85rem',
              background: stage1.recommendation === 'Pass' ? '#e6f4ea' : stage1.recommendation === 'Hold' ? '#fef7e0' : '#fce8e6',
              color: stage1.recommendation === 'Pass' ? '#1e7e34' : stage1.recommendation === 'Hold' ? '#856404' : '#721c24',
            }}>
              {stage1.recommendation}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Generate prompt if no guide */}
      {!guide && (
        <div style={cardStyle}>
          <p style={{ marginBottom: '12px', color: '#666' }}>
            No interview guide generated yet. {stage1 ? 'Stage 1 evaluation is available.' : 'Run Stage 1 evaluation first from the Recruiter portal.'}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating || !stage1}
            style={{
              padding: '10px 20px',
              background: stage1 ? '#1a73e8' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: stage1 ? 'pointer' : 'not-allowed',
            }}
          >
            {generating ? 'Generating…' : 'Generate Interview Guide'}
          </button>
        </div>
      )}

      {guideData && (
        <>
          {/* Estimated Duration */}
          {guideData.estimatedDuration && (
            <div style={{ ...cardStyle, background: '#e8f0fe', border: '1px solid #c5d8fb' }}>
              <span style={{ fontSize: '0.85rem', color: '#1a73e8' }}>
                ⏱ Estimated interview duration: <strong>{guideData.estimatedDuration}</strong>
              </span>
            </div>
          )}

          {/* Live Score Summary */}
          {avgScore && (
            <div style={{ ...cardStyle, background: '#f8f9fa', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Live Interview Score</div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{avgScore}<span style={{ fontSize: '0.9rem', color: '#666' }}>/5</span></div>
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                {Object.keys(scores).length} of {guideData.interviewQuestions?.length ?? 0} questions rated
              </div>
            </div>
          )}

          {/* Confirmed Strengths */}
          {guideData.confirmedStrengths?.length > 0 && (
            <div style={cardStyle}>
              <h3 style={sectionHeader}>✅ Confirmed Strengths (verify in interview)</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {guideData.confirmedStrengths.map((s, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: '#e6f4ea', borderRadius: '6px' }}>
                    <strong style={{ color: '#1e7e34' }}>{s.area}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#444' }}>{s.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas to Probe */}
          {guideData.areasToProbe?.length > 0 && (
            <div style={cardStyle}>
              <h3 style={sectionHeader}>⚠️ Areas to Probe</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {guideData.areasToProbe.map((a, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: '#fef7e0', borderRadius: '6px' }}>
                    <strong style={{ color: '#856404' }}>{a.area}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#444' }}>{a.concern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Questions */}
          {guideData.interviewQuestions?.length > 0 && (
            <div style={cardStyle}>
              <h3 style={sectionHeader}>Interview Questions</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {guideData.interviewQuestions.map((q, i) => (
                  <div key={i} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: expandedQuestion === i ? '#f8f9fa' : 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                    >
                      <span style={{ fontSize: '0.9rem', flex: 1 }}>Q{i + 1}. {q.question}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '12px' }}>
                        {/* Star Rating */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={e => { e.stopPropagation(); setScores(prev => ({ ...prev, [i]: star })); }} style={{
                              background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
                              color: scores[i] >= star ? '#f9ab00' : '#dadce0',
                              padding: '0 1px',
                            }}>★</button>
                          ))}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#5f6368' }}>{expandedQuestion === i ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {expandedQuestion === i && (
                      <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0', background: '#fafafa' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e7e34', marginBottom: '4px' }}>✅ Good Answer</div>
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>{q.expectedGoodAnswer}</p>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d93025', marginBottom: '4px' }}>🚩 Red Flag</div>
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>{q.redFlagAnswer}</p>
                        </div>
                        <textarea
                          placeholder="Notes…"
                          value={notes[i] ?? ''}
                          onChange={e => setNotes(prev => ({ ...prev, [i]: e.target.value }))}
                          style={{ width: '100%', padding: '8px', border: '1px solid #dadce0', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
