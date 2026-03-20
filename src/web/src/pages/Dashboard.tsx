import { useEffect, useState } from 'react'

interface ApiStatus {
  service: string
  status: string
  timestamp: string
}

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || ''
    fetch(`${apiBase}/api/status`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setApiStatus)
      .catch(err => setError(err.message))
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Dashboard</h2>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        marginBottom: '16px',
      }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: '#5f6368' }}>API Status</h3>
        {error && <p style={{ color: '#d93025' }}>Error: {error}</p>}
        {apiStatus && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div><strong>Service:</strong> {apiStatus.service}</div>
            <div>
              <strong>Status:</strong>{' '}
              <span style={{
                color: apiStatus.status === 'running' ? '#0d904f' : '#d93025',
                fontWeight: 600,
              }}>
                {apiStatus.status}
              </span>
            </div>
            <div><strong>Timestamp:</strong> {apiStatus.timestamp}</div>
          </div>
        )}
        {!apiStatus && !error && <p style={{ color: '#5f6368' }}>Loading...</p>}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: '#5f6368' }}>Quick Links</h3>
        <ul style={{ listStyle: 'none', display: 'grid', gap: '8px' }}>
          <li>Stage 1 — Written Questionnaire Screening (coming soon)</li>
          <li>Stage 2 — Technical Interview Guide (coming soon)</li>
          <li>Manager Dashboard (coming soon)</li>
        </ul>
      </div>
    </div>
  )
}
