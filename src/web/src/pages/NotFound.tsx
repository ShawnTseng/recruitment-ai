import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h2 style={{ fontSize: '3rem', color: '#dadce0' }}>404</h2>
      <p style={{ color: '#5f6368', marginBottom: '16px' }}>Page not found</p>
      <Link to="/">Back to Dashboard</Link>
    </div>
  )
}
