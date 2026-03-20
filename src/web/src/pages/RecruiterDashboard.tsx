import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobDescriptionApi, type JobDescription } from '../services/api'

// Temporary hardcoded recruiter ID for MVP (will be replaced by auth)
const RECRUITER_ID = '00000000-0000-0000-0000-000000000001';

export default function RecruiterDashboard() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobDescriptionApi.getByRecruiter(RECRUITER_ID)
      .then(setJds)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Job Descriptions</h2>
        <Link to="/recruiter/jd/new" style={{
          background: '#1a73e8', color: 'white', padding: '8px 20px',
          borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem',
        }}>
          + New JD
        </Link>
      </div>

      {error && <div style={{ color: '#d93025', marginBottom: '16px' }}>Error: {error}</div>}

      {loading ? (
        <p style={{ color: '#5f6368' }}>Loading...</p>
      ) : jds.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: '#5f6368', textAlign: 'center' }}>No job descriptions yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {jds.map(jd => (
            <Link key={jd.id} to={`/recruiter/jd/${jd.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ ...cardStyle, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{jd.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {jd.parsedJson ? (
                      <span style={badgeStyle('#0d904f')}>Parsed</span>
                    ) : (
                      <span style={badgeStyle('#f9ab00')}>Pending</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '8px' }}>
                  Created: {new Date(jd.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: '#5f6368', marginBottom: '12px' }}>Quick Links</h3>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '8px' }}>
          <li><Link to="/recruiter/candidates">Candidates</Link></li>
        </ul>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};

const badgeStyle = (color: string): React.CSSProperties => ({
  background: `${color}15`, color, padding: '2px 8px',
  borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
});
