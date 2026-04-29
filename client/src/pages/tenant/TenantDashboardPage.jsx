import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { FiHome, FiSearch, FiClipboard, FiZap, FiMessageSquare, FiArrowRight, FiRefreshCw } from 'react-icons/fi';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function TenantDashboardPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const fetchRecs = useCallback(() => {
    setRecsLoading(true);
    api.get('/ai/recommendations?limit=3')
      .then((r) => setRecs(r.data.data || []))
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false));
  }, []);

  useEffect(() => {
    api.get('/bookings/mine?limit=5')
      .then((r) => setBookings(r.data.data || []))
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
    fetchRecs();
  }, [fetchRecs]);

  const activeBooking = bookings.find((b) => ['pending', 'approved', 'active'].includes(b.status));
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const activeCount = bookings.filter((b) => ['pending', 'approved', 'active'].includes(b.status)).length;

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── Header ── */}
        <div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
            Find your perfect PG and manage your bookings — all in one place.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <StatTile label="Active Bookings" value={bookingsLoading ? '—' : activeCount} icon={<FiClipboard size={20} />} />
          <StatTile label="Total Spent" value={bookingsLoading ? '—' : `₹${totalSpent.toLocaleString('en-IN')}`} icon={<FiZap size={20} />} />
          <StatTile label="Messages" value={<Link to="/chat/inbox" style={{ color: 'inherit', textDecoration: 'none' }}>Inbox →</Link>} icon={<FiMessageSquare size={20} />} />
        </div>

        {/* ── Active Booking Banner ── */}
        {!bookingsLoading && activeBooking && (
          <div
            style={{
              padding: '28px 32px', borderRadius: 20,
              background: 'var(--surface)', border: '1.5px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 20, flexWrap: 'wrap',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Current Booking</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.01em' }}>
                {activeBooking.listing?.title}
                <span style={{ color: 'var(--text)', fontWeight: 400, margin: '0 8px' }}>·</span>
                <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: '1rem' }}>{activeBooking.listing?.city}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Badge variant={activeBooking.status} />
              <Link
                to={`/bookings/${activeBooking._id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 12,
                  background: 'var(--btn-accent)', color: '#fff',
                  fontWeight: 600, fontSize: '0.875rem',
                  textDecoration: 'none', border: 'none',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; }}
              >
                View Details <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ── AI Recommendations ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiZap size={18} style={{ color: 'var(--accent)' }} /> AI Recommendations
            </h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button
                onClick={fetchRecs}
                disabled={recsLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: recsLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)',
                  opacity: recsLoading ? 0.5 : 1, transition: 'color 0.2s',
                  padding: 0,
                }}
                onMouseEnter={(e) => { if (!recsLoading) e.currentTarget.style.color = 'var(--text-h)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
              >
                <FiRefreshCw size={13} style={{ animation: recsLoading ? 'spin 0.75s linear infinite' : 'none' }} /> Refresh
              </button>
              <Link
                to="/pgs"
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-h)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
              >
                Browse all →
              </Link>
            </div>
          </div>

          {recsLoading ? (
            <div style={{
              padding: '48px 24px', borderRadius: 20, background: 'var(--surface)',
              border: '1px solid var(--border)', textAlign: 'center',
              color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem',
            }}>
              <div style={{ width: 18, height: 18, border: '2px solid var(--text)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
              Getting personalised recommendations...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : recs.length === 0 ? (
            <div style={{
              padding: '48px 24px', borderRadius: 20, background: 'var(--surface)',
              border: '1px solid var(--border)', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>Book a PG first to get personalized recommendations!</span>
              <Link
                to="/pgs"
                style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: 'var(--btn-accent)', color: '#fff',
                  fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; }}
              >
                Search PGs →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {recs.map((l) => (
                <Link key={l._id} to={`/pgs/${l._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <PGCard listing={l} score={l.matchScore} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Bookings ── */}
        {!bookingsLoading && bookings.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: 0 }}>
                Recent Bookings
              </h2>
              <Link
                to="/bookings"
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-h)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
              >
                View all →
              </Link>
            </div>
            <div style={{ borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {bookings.slice(0, 4).map((b, i) => (
                <Link
                  key={b._id}
                  to={`/bookings/${b._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', textDecoration: 'none',
                    borderBottom: i < Math.min(bookings.length, 4) - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: b.status === 'active' ? 'var(--accent)' : b.status === 'pending' ? '#f59e0b' : b.status === 'approved' ? '#3b82f6' : 'var(--border)',
                      boxShadow: b.status === 'active' ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                    }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-h)' }}>{b.listing?.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text)', marginTop: 2 }}>
                        {b.listing?.city} · {new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <Badge variant={b.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Quick Actions ── */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: '0 0 24px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <QuickActionCard to="/pgs" icon={<FiSearch size={22} />} title="Search PGs" desc="Browse verified listings by city, budget, and amenities." />
            <QuickActionCard to="/bookings" icon={<FiClipboard size={22} />} title="My Bookings" desc="Track your booking requests, payments, and stay history." />
            <QuickActionCard to="/chat/inbox" icon={<FiMessageSquare size={22} />} title="Messages" desc="Chat directly with PG owners about your accommodation." />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

/* ── Subcomponents ── */

function StatTile({ label, value, icon }) {
  return (
    <div
      style={{
        padding: '24px 28px', borderRadius: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 16,
        transition: 'all 0.3s ease', cursor: 'default',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)' }}>{label}</span>
        <span style={{
          width: 42, height: 42, borderRadius: 14,
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)', flexShrink: 0,
        }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function PGCard({ listing: l, score }) {
  return (
    <div
      style={{
        borderRadius: 20, background: 'var(--surface)',
        border: '1px solid var(--border)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s ease', cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ height: 120, background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', opacity: 0.4 }}>
        <FiHome size={28} />
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-h)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: 8 }}>{l.locality || l.city} · {l.roomType}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
            ₹{l.rent?.toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text)' }}>/mo</span>
          </span>
          {score !== undefined && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              color: 'var(--accent)', background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              padding: '3px 8px', borderRadius: 8,
            }}>
              {Math.round(score * 100)}% match
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ to, icon, title, desc }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: '28px 24px', borderRadius: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        textDecoration: 'none', transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <span style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'var(--bg)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)', flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {icon}
      </span>
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', margin: '0 0 6px' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
      </div>
    </Link>
  );
}
