import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { interviewApi, evaluationApi, type InterviewGuide, type EvaluationReport } from '../services/api'

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

export default function InterviewerPortal() {
  const { submissionId } = useParams<{ submissionId: string }>()
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
          <Link to="/recruiter" style={{ fontSize: '0.85rem', color: '#1a73e8' }}>&larr; Back to Recruiter Dashboard</Link>
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
            No interview guide generated yet. {stage1 ? 'Stage 1 evaluation is available.' : 'Run Stage 1 evaluation first from the Recruiter dashboard.'}
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
                        userSelect: 'none',
                      }}
                      onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                    >
                      <span style={{ fontWeight: 500, flex: 1, marginRight: '12px' }}>Q{i + 1}. {q.question}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        {/* Live Score */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              onClick={e => { e.stopPropagation(); setScores(prev => ({ ...prev, [i]: star })) }}
                              style={{ cursor: 'pointer', fontSize: '1.1rem', color: (scores[i] ?? 0) >= star ? '#fbbc04' : '#e0e0e0' }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>{expandedQuestion === i ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expandedQuestion === i && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', background: '#fafafa' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e7e34', marginBottom: '4px' }}>✅ Good Answer</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>{q.expectedGoodAnswer}</p>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d93025', marginBottom: '4px' }}>🚩 Red Flag Answer</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>{q.redFlagAnswer}</p>
                        </div>
                        <textarea
                          placeholder="Interview notes for this question…"
                          value={notes[i] ?? ''}
                          onChange={e => setNotes(prev => ({ ...prev, [i]: e.target.value }))}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #dadce0',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                          }}
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
