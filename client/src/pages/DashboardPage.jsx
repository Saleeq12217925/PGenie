import { useAuth } from '../hooks/useAuth.js';
import { Wordmark } from '../components/layout/Wordmark.jsx';

const roleColors = {
  admin: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  owner: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  tenant: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const role = user?.role || 'tenant';
  const badge = roleColors[role] || roleColors.tenant;

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <Wordmark size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            background: badge.bg,
            color: badge.text,
          }}>
            {role}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '7px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--accent-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '10px' }}>
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text)', lineHeight: '1.6', marginBottom: '32px' }}>
            Your dashboard is being built. PG listings, bookings, and analytics will appear here.
          </p>

          <div style={{
            padding: '16px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            textAlign: 'left',
            fontSize: '0.875rem',
            color: 'var(--text)',
          }}>
            <strong style={{ color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>Signed in as</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>{user?.name}</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
