import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiMessageSquare, FiClipboard } from 'react-icons/fi';

const PAGE_SIZE = 8;

export function BookingRequestsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [acting, setActing] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function load(s, p = 1) {
    setLoading(true);
    setError('');
    const qs = new URLSearchParams({ page: p, limit: PAGE_SIZE });
    if (s) qs.set('status', s);
    api.get(`/bookings/requests?${qs}`)
      .then((r) => {
        setBookings(r.data.data);
        setTotalPages(r.data.pagination?.pages || 1);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(status, page); }, [status, page]);

  function changeStatus(s) { setStatus(s); setPage(1); }

  async function act(id, action) {
    setActing((a) => ({ ...a, [id]: action }));
    try {
      await api.patch(`/bookings/${id}/${action}`);
      load(status, page);
    } catch (e) {
      alert(e.response?.data?.message || 'Error.');
    } finally {
      setActing((a) => ({ ...a, [id]: null }));
    }
  }

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>Booking Requests</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500, lineHeight: 1.6 }}>Review, approve, or reject incoming tenant requests for your listings.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => changeStatus(s)}
              style={{
                padding: '8px 16px', borderRadius: 12, fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid',
                ...(status === s
                  ? { background: 'var(--btn-accent)', borderColor: 'var(--btn-accent)', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }
                  : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }
                )
              }}
              onMouseEnter={(e) => {
                if (status !== s) { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }
                else { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }
              }}
              onMouseLeave={(e) => {
                if (status !== s) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface)'; }
                else { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; }
              }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
        <ErrorBanner message={error} />
        {loading ? <PageSpinner /> : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    <FiClipboard size={24} />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>No requests found.</span>
                </div>
              )}
              {bookings.map((b) => (
                <div
                  key={b._id}
                  style={{
                    border: '1px solid var(--border)', borderRadius: 20,
                    background: 'var(--surface)', padding: 24,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '1.125rem' }}>{b.tenant?.name}</span>
                        <Badge variant={b.status} />
                      </div>
                      <div style={{ fontSize: '0.9375rem', color: 'var(--text)', marginBottom: 8 }}>
                        <strong style={{ color: 'var(--text-h)', fontWeight: 600 }}>{b.listing?.title}</strong> · {b.listing?.city}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: 'var(--bg)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{b.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      {b.note && <p style={{ fontSize: '0.8125rem', color: 'var(--text)', marginTop: 12, fontStyle: 'italic', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, borderLeft: '2px solid var(--border)' }}>&ldquo;{b.note}&rdquo;</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => act(b._id, 'approve')} disabled={acting[b._id]}
                            style={{
                              padding: '8px 16px', borderRadius: 12, background: '#16a34a', color: '#fff',
                              border: 'none', cursor: acting[b._id] ? 'not-allowed' : 'pointer',
                              fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.2s ease',
                              opacity: acting[b._id] ? 0.6 : 1, boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                            }}
                            onMouseEnter={(e) => { if (!acting[b._id]) { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (!acting[b._id]) { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = ''; } }}
                          >
                            {acting[b._id] === 'approve' ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => act(b._id, 'reject')} disabled={acting[b._id]}
                            style={{
                              padding: '8px 16px', borderRadius: 12, background: '#ef4444', color: '#fff',
                              border: 'none', cursor: acting[b._id] ? 'not-allowed' : 'pointer',
                              fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.2s ease',
                              opacity: acting[b._id] ? 0.6 : 1, boxShadow: '0 2px 8px rgba(239,68,68,0.25)',
                            }}
                            onMouseEnter={(e) => { if (!acting[b._id]) { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (!acting[b._id]) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = ''; } }}
                          >
                            {acting[b._id] === 'reject' ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {b.status === 'active' && (
                        <button
                          onClick={() => act(b._id, 'complete')} disabled={acting[b._id]}
                          style={{
                            padding: '8px 16px', borderRadius: 12, background: '#0ea5e9', color: '#fff',
                            border: 'none', cursor: acting[b._id] ? 'not-allowed' : 'pointer',
                            fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.2s ease',
                            opacity: acting[b._id] ? 0.6 : 1, boxShadow: '0 2px 8px rgba(14,165,233,0.25)',
                          }}
                          onMouseEnter={(e) => { if (!acting[b._id]) { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                          onMouseLeave={(e) => { if (!acting[b._id]) { e.currentTarget.style.background = '#0ea5e9'; e.currentTarget.style.transform = ''; } }}
                        >
                          {acting[b._id] === 'complete' ? '...' : 'Mark Complete'}
                        </button>
                      )}
                      {(b.status === 'approved' || b.status === 'active' || b.status === 'completed') && (
                        <Link
                          to={`/chat/${b._id}`}
                          style={{
                            padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border)',
                            color: 'var(--accent)', textDecoration: 'none', fontSize: '0.8125rem',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--surface)', transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <FiMessageSquare /> Chat
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{
                    padding: '10px 20px', borderRadius: 14, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: '0.875rem',
                    fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (page !== 1) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-h)'; } }}
                  onMouseLeave={(e) => { if (page !== 1) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
                >
                  ← Prev
                </button>
                <span style={{ padding: '10px 20px', fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{
                    padding: '10px 20px', borderRadius: 14, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: '0.875rem',
                    fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (page !== totalPages) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-h)'; } }}
                  onMouseLeave={(e) => { if (page !== totalPages) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
