import { useEffect, useState } from 'react'
import {
  feedbackApi, candidateApi, jobDescriptionApi,
  type ClientFeedback, type Candidate, type JobDescription,
} from '../services/api'

const RECRUITER_ID = '00000000-0000-0000-0000-000000000001';
const WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

interface ApiStatus {
  service: string
  status: string
  timestamp: string
}

interface KPI {
  totalJds: number
  totalCandidates: number
  hiredCount: number
  rejectedCount: number
  pendingCount: number
  avgScore: number | null
}

export default function Dashboard() {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([])
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || ''
    Promise.all([
      fetch(`${apiBase}/api/status`).then(r => r.ok ? r.json() as Promise<ApiStatus> : null).catch(() => null),
      jobDescriptionApi.getByRecruiter(RECRUITER_ID).catch(() => [] as JobDescription[]),
      candidateApi.getByWorkspace(WORKSPACE_ID).catch(() => [] as Candidate[]),
      feedbackApi.getByRecruiter(RECRUITER_ID).catch(() => [] as ClientFeedback[]),
    ]).then(([status, jds, candidates, fbs]) => {
      setApiStatus(status)
      setFeedbacks(fbs)
      const hired = fbs.filter(f => f.outcome === 'Hired').length
      const rejected = fbs.filter(f => f.outcome === 'Rejected').length
      setKpi({
        totalJds: jds.length,
        totalCandidates: candidates.length,
        hiredCount: hired,
        rejectedCount: rejected,
        pendingCount: fbs.filter(f => f.outcome === 'Pending').length,
        avgScore: null,
      })
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const outcomeColor: Record<string, string> = { Hired: '#0d904f', Rejected: '#d93025', Pending: '#f9ab00' }

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }}>Manager Dashboard</h2>
      <p style={{ color: '#5f6368', marginBottom: '24px', fontSize: '0.9rem' }}>System overview and recruitment analytics</p>

      {error && <div style={errorBox}>{error}</div>}

      {/* API Status */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>System Status</h3>
        {!apiStatus && loading && <p style={{ color: '#5f6368' }}>Checking...</p>}
        {apiStatus ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: apiStatus.status === 'running' ? '#0d904f' : '#d93025' }}>
              ● {apiStatus.status === 'running' ? 'Online' : 'Offline'}
            </span>
            <span style={{ color: '#5f6368', fontSize: '0.85rem' }}>API: {apiStatus.service}</span>
            <span style={{ color: '#5f6368', fontSize: '0.85rem' }}>Last checked: {new Date(apiStatus.timestamp).toLocaleTimeString()}</span>
          </div>
        ) : !loading && (
          <span style={{ color: '#d93025', fontSize: '0.9rem' }}>Could not reach API</span>
        )}
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={kpiCard}><div style={kpiNum}>{kpi.totalJds}</div><div style={kpiLabel}>Job Descriptions</div></div>
          <div style={kpiCard}><div style={kpiNum}>{kpi.totalCandidates}</div><div style={kpiLabel}>Candidates</div></div>
          <div style={{ ...kpiCard, borderTop: `3px solid #0d904f` }}><div style={{ ...kpiNum, color: '#0d904f' }}>{kpi.hiredCount}</div><div style={kpiLabel}>Hired</div></div>
          <div style={{ ...kpiCard, borderTop: `3px solid #d93025` }}><div style={{ ...kpiNum, color: '#d93025' }}>{kpi.rejectedCount}</div><div style={kpiLabel}>Rejected</div></div>
          <div style={{ ...kpiCard, borderTop: `3px solid #f9ab00` }}><div style={{ ...kpiNum, color: '#f9ab00' }}>{kpi.pendingCount}</div><div style={kpiLabel}>Pending</div></div>
        </div>
      )}

      {/* Feedback Table */}
      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <h3 style={sectionTitle}>Client Feedback ({feedbacks.length})</h3>
        {loading ? <p style={{ color: '#5f6368' }}>Loading...</p>
          : feedbacks.length === 0 ? (
            <p style={{ color: '#5f6368', textAlign: 'center' }}>No feedback recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    {['Outcome', 'Tags', 'Comments', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#5f6368', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(f => {
                    let tags: string[] = [];
                    try { tags = JSON.parse(f.tags); } catch { /* ignore */ }
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: `${outcomeColor[f.outcome] ?? '#5f6368'}20`, color: outcomeColor[f.outcome] ?? '#5f6368', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {f.outcome}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {tags.map((t, i) => <span key={i} style={{ background: '#e8f0fe', color: '#1a73e8', padding: '1px 6px', borderRadius: '8px', fontSize: '0.75rem' }}>{t}</span>)}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#444', maxWidth: '300px' }}>{f.comments ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#5f6368', whiteSpace: 'nowrap' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1rem', color: '#333', marginBottom: '14px', fontWeight: 600,
};

const errorBox: React.CSSProperties = {
  color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px',
};

const kpiCard: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '16px 20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)', textAlign: 'center',
};

const kpiNum: React.CSSProperties = {
  fontSize: '2rem', fontWeight: 700, color: '#202124',
};

const kpiLabel: React.CSSProperties = {
  fontSize: '0.8rem', color: '#5f6368', marginTop: '4px',
};
