import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16, padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem' }}>🏚️</div>
      <h1 style={{ fontSize: '2rem' }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--text)' }}>The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
