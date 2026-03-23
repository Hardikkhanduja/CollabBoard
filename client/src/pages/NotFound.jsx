import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fafafa',
        fontFamily: 'Geist Sans, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>404</h1>
      <p style={{ color: '#71717a', marginBottom: '24px' }}>Page not found</p>
      <Link to="/" style={{ color: '#6ee7b7', textDecoration: 'none', fontSize: '14px' }}>
        ← Back to home
      </Link>
    </div>
  )
}
