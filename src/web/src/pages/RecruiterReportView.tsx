import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { evaluationApi, interviewApi, type EvaluationReport, type InterviewGuide } from '../services/api'

interface ReportData {
  recommendation: string
  confidenceScore: number
  reportMarkdown: string
  followUpQuestions: string[]
  technicalFit: Array<{ requirement: string; status: string; evidence: string }>
}

const recommendationColor: Record<string, string> = {
  Pass: '#1e7e34',
  Hold: '#856404',
  Reject: '#721c24',
  Pending: '#555',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
}

export default function RecruiterReportView() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const [reports, setReports] = useState<EvaluationReport[]>([])
  const [guide, setGuide] = useState<InterviewGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [generatingGuide, setGeneratingGuide] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stage1 = reports.find(r => r.stage === 1)

  useEffect(() => {
    if (!submissionId) return
    Promise.all([
      evaluationApi.getBySubmission(submissionId),
      interviewApi.getBySubmission(submissionId).catch(() => null),
    ])
      .then(([rpts, g]) => {
        setReports(rpts)
        setGuide(g)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [submissionId])

  const handleEvaluate = async () => {
    if (!submissionId) return
    setEvaluating(true)
    setError(null)
    try {
      const report = await evaluationApi.evaluate(submissionId)
      setReports(prev => [...prev.filter(r => r.stage !== 1), report])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed')
    } finally {
      setEvaluating(false)
    }
  }

  const handleGenerateGuide = async () => {
    if (!submissionId) return
    setGeneratingGuide(true)
    setError(null)
    try {
      const g = await interviewApi.generate(submissionId)
      setGuide(g)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate interview guide')
    } finally {
      setGeneratingGuide(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading report…</div>

  let reportData: ReportData | null = null
  if (stage1) {
    try { reportData = JSON.parse(stage1.reportJson) } catch { /* ignore */ }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <Link to="/recruiter" style={{ fontSize: '0.85rem', color: '#1a73e8' }}>&larr; Back to Dashboard</Link>
      <h2 style={{ marginTop: '16px' }}>Stage 1 Evaluation Report</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>Submission: {submissionId}</p>

      {error && (
        <div style={{ color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {!stage1 && (
        <div style={cardStyle}>
          <p>No Stage 1 evaluation yet.</p>
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            style={{ padding: '10px 20px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            {evaluating ? 'Evaluating…' : 'Run AI Evaluation'}
          </button>
        </div>
      )}

      {stage1 && (
        <>
          {/* Score Banner */}
          <div style={{
            ...cardStyle,
            background: '#f8f9fa',
            display: 'flex',
            gap: '32px',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>AI Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#202124' }}>
                {stage1.aiScore.toFixed(0)}
                <span style={{ fontSize: '1rem', color: '#666' }}>/100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Recommendation</div>
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: '20px',
                background: `${recommendationColor[stage1.recommendation] ?? '#555'}22`,
                color: recommendationColor[stage1.recommendation] ?? '#555',
                fontWeight: 600,
                fontSize: '1rem',
              }}>
                {stage1.recommendation}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                style={{ padding: '8px 16px', background: '#f1f3f4', border: '1px solid #dadce0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {evaluating ? 'Re-evaluating…' : 'Re-run Evaluation'}
              </button>
              {!guide && (
                <button
                  onClick={handleGenerateGuide}
                  disabled={generatingGuide}
                  style={{ padding: '8px 16px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {generatingGuide ? 'Generating…' : 'Generate Stage 2 Guide'}
                </button>
              )}
              {guide && (
                <Link
                  to={`/interviewer/${submissionId}`}
                  style={{ padding: '8px 16px', background: '#34a853', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}
                >
                  View Stage 2 Guide →
                </Link>
              )}
            </div>
          </div>

          {/* Technical Fit */}
          {reportData?.technicalFit && reportData.technicalFit.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Technical Fit</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>Requirement</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.technicalFit.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{item.requirement}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          background: item.status === 'Confirmed' ? '#e6f4ea' : item.status === 'Partial' ? '#fef7e0' : '#fce8e6',
                          color: item.status === 'Confirmed' ? '#1e7e34' : item.status === 'Partial' ? '#856404' : '#721c24',
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Follow-up Questions */}
          {reportData?.followUpQuestions && reportData.followUpQuestions.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Suggested Follow-up Questions</h3>
              <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                {reportData.followUpQuestions.map((q, i) => (
                  <li key={i} style={{ color: '#444', marginBottom: '4px' }}>{q}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Full Markdown Report */}
          {reportData?.reportMarkdown && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Full Report</h3>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', fontSize: '0.9rem', color: '#333', lineHeight: '1.6', margin: 0 }}>
                {reportData.reportMarkdown}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}
