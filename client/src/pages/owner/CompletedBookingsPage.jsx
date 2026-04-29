import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiCheckCircle } from 'react-icons/fi';
const PAGE_SIZE = 10;

export function CompletedBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ status: 'completed', page, limit: PAGE_SIZE });
    api.get(`/bookings/requests?${qs}`)
      .then((r) => {
        setBookings(r.data.data || []);
        setTotalPages(r.data.pagination?.pages || 1);
        const rev = (r.data.data || [])
          .filter((b) => b.paymentStatus === 'paid')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        setTotalRevenue(rev);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>Completed Bookings</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500 }}>History of all completed stays at your properties.</p>
        <ErrorBanner message={error} />

        {loading ? <PageSpinner /> : (
          <>
            {totalRevenue > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border)',
                borderRadius: 20, background: 'var(--surface)', padding: '24px 28px',
                marginBottom: 32, boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
                  Revenue from this page ({bookings.filter(b => b.paymentStatus === 'paid').length} paid bookings)
                </div>
              </div>
            )}
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
                    <FiCheckCircle size={24} />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>No completed bookings yet.</span>
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
                        <Badge variant={b.paymentStatus} />
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
                    </div>
                    <Link
                      to={`/bookings/${b._id}`}
                      style={{
                        padding: '10px 24px', borderRadius: 12, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text-h)', fontSize: '0.875rem',
                        fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; e.currentTarget.style.transform = ''; }}
                    >
                      View
                    </Link>
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
