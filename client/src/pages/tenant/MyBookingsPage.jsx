import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiMessageSquare, FiArrowRight, FiCreditCard, FiXCircle, FiSearch } from 'react-icons/fi';

const PAGE_SIZE = 8;

export function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelling, setCancelling] = useState({});

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/mine?page=${page}&limit=${PAGE_SIZE}`)
      .then((r) => {
        setBookings(r.data.data);
        setTotalPages(r.data.pagination?.pages || 1);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, [page]);

  async function cancel(id) {
    if (!confirm('Cancel this booking?')) return;
    setCancelling((c) => ({ ...c, [id]: true }));
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch (e) {
      alert(e.response?.data?.message || 'Error.');
    } finally {
      setCancelling((c) => ({ ...c, [id]: false }));
    }
  }

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>My Bookings</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500, lineHeight: 1.6 }}>Track all your booking requests and stays.</p>
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
                    <FiCreditCard size={24} />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>No bookings yet.</span>
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
                </div>
              )}
              {bookings.map((b) => (
                <BookingRow key={b._id} b={b} cancel={cancel} cancelling={cancelling} />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32 }}>
                <PaginationBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</PaginationBtn>
                <span style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>
                  Page {page} of {totalPages}
                </span>
                <PaginationBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next →</PaginationBtn>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

/* ── Subcomponents ── */

function BookingRow({ b, cancel, cancelling }) {
  return (
    <div
      style={{
        padding: '24px 28px', borderRadius: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Top: Title + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-h)', letterSpacing: '-0.01em' }}>{b.listing?.title}</span>
            <Badge variant={b.status} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {b.listing?.city}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text)', opacity: 0.4, display: 'inline-block' }} />
            <span style={{ textTransform: 'capitalize' }}>{b.listing?.roomType}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
            {new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} → {new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
              ₹{b.totalAmount?.toLocaleString('en-IN')}
            </span>
            <Badge variant={b.paymentStatus} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Link
            to={`/bookings/${b._id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 12,
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              color: 'var(--text-h)', fontSize: '0.8125rem', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; }}
          >
            Details <FiArrowRight size={13} />
          </Link>

          {b.status === 'approved' && b.paymentStatus === 'unpaid' && (
            <Link
              to={`/bookings/${b._id}/pay`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 12,
                background: 'var(--btn-accent)', color: '#fff',
                fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all 0.2s ease', border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; }}
            >
              <FiCreditCard size={14} /> Pay Now
            </Link>
          )}

          {['approved', 'active', 'completed'].includes(b.status) && (
            <Link
              to={`/chat/${b._id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 12,
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                color: 'var(--text-h)', fontSize: '0.8125rem', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; }}
            >
              <FiMessageSquare size={14} /> Chat
            </Link>
          )}

          {['pending', 'approved'].includes(b.status) && (
            <button
              onClick={() => cancel(b._id)}
              disabled={cancelling[b._id]}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 12,
                background: 'transparent', border: '1.5px solid rgba(239,68,68,0.35)',
                color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600,
                cursor: cancelling[b._id] ? 'not-allowed' : 'pointer',
                opacity: cancelling[b._id] ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!cancelling[b._id]) { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}
            >
              <FiXCircle size={14} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaginationBtn({ disabled, onClick, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '10px 20px', borderRadius: 12,
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        color: 'var(--text-h)', fontSize: '0.875rem', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; } }}
    >
      {children}
    </button>
  );
}
