import { useEffect, useState } from 'react'
import {
  managerApi, feedbackApi, systemParameterApi, talentPoolApi,
  type ManagerStats, type ClientFeedback, type SystemParameter, type TalentPoolCandidate,
} from '../services/api'

const RECRUITER_ID = '00000000-0000-0000-0000-000000000001'
type Tab = 'overview' | 'feedback' | 'params' | 'talent'

interface ApiStatus { service: string; status: string; timestamp: string }

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<ManagerStats | null>(null)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([])
  const [params, setParams] = useState<SystemParameter[]>([])
  const [talent, setTalent] = useState<TalentPoolCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // System param edit state
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [paramSaving, setParamSaving] = useState(false)

  // Talent pool search
  const [skillFilter, setSkillFilter] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [talentLoading, setTalentLoading] = useState(false)

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || ''
    Promise.all([
      fetch(`${apiBase}/api/status`).then(r => r.ok ? r.json() as Promise<ApiStatus> : null).catch(() => null),
      managerApi.getStats().catch(() => null),
      feedbackApi.getByRecruiter(RECRUITER_ID).catch(() => [] as ClientFeedback[]),
      systemParameterApi.getAll().catch(() => [] as SystemParameter[]),
    ]).then(([status, s, fbs, ps]) => {
      setApiStatus(status)
      if (s) setStats(s)
      setFeedbacks(fbs)
      setParams(ps)
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const searchTalent = () => {
    setTalentLoading(true)
    talentPoolApi.search(skillFilter || undefined, scoreFilter ? Number(scoreFilter) : undefined)
      .then(setTalent)
      .catch(err => setError(err.message))
      .finally(() => setTalentLoading(false))
  }

  useEffect(() => { if (tab === 'talent') searchTalent() }, [tab])

  const saveParam = async () => {
    if (!editKey) return
    setParamSaving(true)
    try {
      const updated = await systemParameterApi.upsert(editKey, { value: editValue, updatedBy: 'manager' })
      setParams(prev => prev.map(p => p.key === editKey ? updated : p))
      setEditKey(null)
    } catch { setError('Failed to save parameter') }
    finally { setParamSaving(false) }
  }

  const addParam = async () => {
    if (!newKey || !newValue) return
    setParamSaving(true)
    try {
      const created = await systemParameterApi.upsert(newKey, { value: newValue, updatedBy: 'manager' })
      setParams(prev => [...prev.filter(p => p.key !== newKey), created])
      setNewKey(''); setNewValue('')
    } catch { setError('Failed to add parameter') }
    finally { setParamSaving(false) }
  }

  const outcomeColor: Record<string, string> = { Hired: '#0d904f', 'Rejected at Client': '#d93025', 'Offer Declined': '#f9ab00' }
  const recColor: Record<string, string> = { Pass: '#0d904f', Hold: '#f9ab00', Reject: '#d93025' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>Manager Dashboard</h2>
        {apiStatus && (
          <span style={{ fontSize: '0.85rem', color: apiStatus.status === 'running' ? '#0d904f' : '#d93025', fontWeight: 600 }}>
            ● API {apiStatus.status === 'running' ? 'Online' : 'Offline'}
          </span>
        )}
      </div>
      <p style={{ color: '#5f6368', marginBottom: '16px', fontSize: '0.9rem' }}>Analytics · Parameter management · Talent pool</p>

      {error && <div style={errorBox}>{error}<button onClick={() => setError(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#d93025' }}>✕</button></div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        {([['overview', 'Overview & KPIs'], ['feedback', 'Client Feedback'], ['params', 'System Parameters'], ['talent', 'Talent Pool']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, color: tab === t ? '#1a73e8' : '#5f6368', borderBottom: tab === t ? '2px solid #1a73e8' : '2px solid transparent', marginBottom: '-2px', fontSize: '0.9rem' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div>
          {loading ? <p style={{ color: '#5f6368' }}>Loading stats...</p> : stats ? (
            <>
              <h3 style={sectionTitle}>Recruitment Pipeline</h3>
              <div style={kpiGrid}>
                <KpiCard label="Job Descriptions" value={stats.totalJobDescriptions} />
                <KpiCard label="Candidates" value={stats.totalCandidates} />
                <KpiCard label="Submissions" value={stats.totalSubmissions} />
                <KpiCard label="Evaluated" value={stats.evaluatedSubmissions} />
                <KpiCard label="Stage 2 Completed" value={stats.stage2CompletedCount} />
              </div>
              <h3 style={{ ...sectionTitle, marginTop: '20px' }}>Stage 1 Results</h3>
              <div style={kpiGrid}>
                <KpiCard label="Pass" value={stats.stage1PassCount} color="#0d904f" />
                <KpiCard label="Hold" value={stats.stage1HoldCount} color="#f9ab00" />
                <KpiCard label="Reject" value={stats.stage1RejectCount} color="#d93025" />
                <KpiCard label="Pass Rate" value={`${stats.stage1PassRate}%`} color="#1a73e8" />
                <KpiCard label="Avg AI Score" value={stats.averageAiScore > 0 ? stats.averageAiScore : '–'} />
              </div>
              <h3 style={{ ...sectionTitle, marginTop: '20px' }}>Client Outcomes</h3>
              <div style={kpiGrid}>
                <KpiCard label="Total Feedbacks" value={stats.totalFeedbacks} />
                <KpiCard label="Hired" value={stats.hiredCount} color="#0d904f" />
                <KpiCard label="Rejected at Client" value={stats.rejectedAtClientCount} color="#d93025" />
                <KpiCard label="Hire Rate" value={`${stats.hireRate}%`} color="#1a73e8" />
              </div>
            </>
          ) : (
            <p style={{ color: '#5f6368' }}>No stats available — the API may not be reachable.</p>
          )}
        </div>
      )}

      {/* ── Feedback Tab ── */}
      {tab === 'feedback' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Client Feedback ({feedbacks.length})</h3>
          {loading ? <p style={{ color: '#5f6368' }}>Loading...</p>
            : feedbacks.length === 0
              ? <p style={{ color: '#5f6368', textAlign: 'center' }}>No feedback recorded yet.</p>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        {['Outcome', 'Tags', 'Comments', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.map(f => {
                        let tags: string[] = []
                        try { tags = JSON.parse(f.tags) } catch { /* ignore */ }
                        return (
                          <tr key={f.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                            <td style={tdStyle}><Chip label={f.outcome} color={outcomeColor[f.outcome] ?? '#5f6368'} /></td>
                            <td style={tdStyle}><div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{tags.map((t, i) => <span key={i} style={tagChip}>{t}</span>)}</div></td>
                            <td style={{ ...tdStyle, maxWidth: '300px', color: '#444' }}>{f.comments ?? '—'}</td>
                            <td style={{ ...tdStyle, color: '#5f6368', whiteSpace: 'nowrap' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
        </div>
      )}

      {/* ── System Parameters Tab ── */}
      {tab === 'params' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>System Parameters</h3>
          <p style={{ color: '#5f6368', fontSize: '0.85rem', marginBottom: '16px' }}>
            Adjust Rubric weights, prompt versions, and thresholds without code changes.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                {['Key', 'Value', 'Updated By', 'Updated At', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {params.map(p => (
                <tr key={p.key} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.key}</td>
                  <td style={tdStyle}>
                    {editKey === p.key
                      ? <input value={editValue} onChange={e => setEditValue(e.target.value)} style={inputStyle} />
                      : <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.value}</span>}
                  </td>
                  <td style={{ ...tdStyle, color: '#5f6368' }}>{p.updatedBy ?? '—'}</td>
                  <td style={{ ...tdStyle, color: '#5f6368', whiteSpace: 'nowrap' }}>{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    {editKey === p.key
                      ? <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={saveParam} disabled={paramSaving} style={btnPrimary}>{paramSaving ? '…' : 'Save'}</button>
                        <button onClick={() => setEditKey(null)} style={btnSecondary}>Cancel</button>
                      </div>
                      : <button onClick={() => { setEditKey(p.key); setEditValue(p.value) }} style={btnSecondary}>Edit</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
            <h4 style={{ marginBottom: '12px', fontWeight: 600, color: '#333', fontSize: '0.9rem' }}>Add Parameter</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5f6368', marginBottom: '4px' }}>Key</label>
                <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. rubric.technicalDepth.weight" style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5f6368', marginBottom: '4px' }}>Value</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="e.g. 0.4" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <button onClick={addParam} disabled={!newKey || !newValue || paramSaving} style={btnPrimary}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Talent Pool Tab ── */}
      {tab === 'talent' && (
        <div>
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <h3 style={sectionTitle}>Search Talent Pool</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5f6368', marginBottom: '4px' }}>Skills / Keywords</label>
                <input value={skillFilter} onChange={e => setSkillFilter(e.target.value)} placeholder="React, .NET, Azure…" style={inputStyle} onKeyDown={e => e.key === 'Enter' && searchTalent()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5f6368', marginBottom: '4px' }}>Min AI Score</label>
                <input value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} placeholder="0–100" style={{ ...inputStyle, width: '100px' }} type="number" min="0" max="100" />
              </div>
              <button onClick={searchTalent} style={btnPrimary}>Search</button>
            </div>
          </div>
          <div style={cardStyle}>
            {talentLoading ? <p style={{ color: '#5f6368' }}>Searching…</p>
              : talent.length === 0
                ? <p style={{ color: '#5f6368', textAlign: 'center' }}>No candidates found. Try adjusting filters.</p>
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <p style={{ color: '#5f6368', fontSize: '0.85rem', marginBottom: '12px' }}>{talent.length} candidate{talent.length !== 1 ? 's' : ''} found</p>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                          {['Name', 'Skills', 'Submissions', 'AI Score', 'Recommendation', 'Last Outcome', 'Added'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {talent.map(c => {
                          let tags: string[] = []
                          try { tags = JSON.parse(c.skillTags) } catch { /* ignore */ }
                          return (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                              <td style={tdStyle}><strong>{c.name}</strong></td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {tags.length > 0 ? tags.map((t, i) => <span key={i} style={tagChip}>{t}</span>) : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>—</span>}
                                </div>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>{c.totalSubmissions}</td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>{c.latestAiScore != null ? c.latestAiScore.toFixed(0) : '—'}</td>
                              <td style={tdStyle}>{c.latestRecommendation ? <Chip label={c.latestRecommendation} color={recColor[c.latestRecommendation] ?? '#5f6368'} /> : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>—</span>}</td>
                              <td style={tdStyle}>{c.lastOutcome ? <Chip label={c.lastOutcome} color={outcomeColor[c.lastOutcome] ?? '#5f6368'} /> : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>—</span>}</td>
                              <td style={{ ...tdStyle, color: '#5f6368', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={kpiCard}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color ?? '#202124' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: `${color}20`, color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
      {label}
    </span>
  )
}

const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }
const kpiCard: React.CSSProperties = { background: 'white', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', textAlign: 'center' }
const sectionTitle: React.CSSProperties = { fontSize: '1rem', color: '#333', marginBottom: '14px', fontWeight: 600, marginTop: 0 }
const errorBox: React.CSSProperties = { color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', color: '#5f6368', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '10px 12px' }
const tagChip: React.CSSProperties = { background: '#e8f0fe', color: '#1a73e8', padding: '1px 6px', borderRadius: '8px', fontSize: '0.75rem' }
const inputStyle: React.CSSProperties = { border: '1px solid #dadce0', borderRadius: '4px', padding: '6px 10px', fontSize: '0.9rem' }
const btnPrimary: React.CSSProperties = { background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', padding: '7px 16px', cursor: 'pointer', fontSize: '0.9rem' }
const btnSecondary: React.CSSProperties = { background: 'white', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.9rem' }

