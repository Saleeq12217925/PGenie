import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { FiMessageSquare, FiArrowRight, FiSearch } from 'react-icons/fi';

export function ChatInboxPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const endpoint = user?.role === 'tenant' ? '/bookings/mine?limit=50' : '/bookings/requests?limit=50';
    api.get(endpoint)
      .then((r) => {
        const all = r.data.data || [];
        setBookings(all.filter((b) => ['approved', 'active', 'completed'].includes(b.status)));
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load chats.'))
      .finally(() => setLoading(false));
  }, [user]);

  const other = (b) => user?.role === 'tenant' ? b.owner : b.tenant;

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>
          Messages
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500, lineHeight: 1.6 }}>
          Chats are linked to bookings. Select one to continue the conversation.
        </p>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading ? <PageSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.length === 0 && (
              <div style={{
                padding: '64px 24px', borderRadius: 20,
                background: 'var(--surface)', border: '1px solid var(--border)',
                textAlign: 'center', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  <FiMessageSquare size={24} />
                </div>
                <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>No active chats yet.</span>
                {user?.role === 'tenant' && (
                  <Link
                    to="/pgs"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 28px', borderRadius: 12,
                      background: 'var(--btn-accent)', color: '#fff',
                      fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; }}
                  >
                    <FiSearch size={14} /> Search PGs →
                  </Link>
                )}
              </div>
            )}

            {/* Chat thread list */}
            {bookings.length > 0 && (
              <div style={{ borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {bookings.map((b, i) => (
                  <ChatRow key={b._id} b={b} other={other(b)} isLast={i === bookings.length - 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ── Subcomponents ── */

function ChatRow({ b, other, isLast }) {
  return (
    <Link
      to={`/chat/${b._id}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '20px 24px',
        textDecoration: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.9rem',
          boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
        }}>
          {(other?.name || '?').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-h)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {other?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {b.listing?.title}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text)', opacity: 0.4, display: 'inline-block', flexShrink: 0 }} />
            {b.listing?.city}
          </div>
        </div>
      </div>

      {/* Right: badge + arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Badge variant={b.status} />
        <FiArrowRight size={14} style={{ color: 'var(--text)', opacity: 0.5 }} />
      </div>
    </Link>
  );
}
