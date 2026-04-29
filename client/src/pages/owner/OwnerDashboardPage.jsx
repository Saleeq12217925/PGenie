import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { FiHome, FiInbox, FiTrendingUp, FiZap, FiArrowRight, FiClipboard, FiCheckCircle } from 'react-icons/fi';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiModal, setAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({ city: '', roomType: 'single', amenities: '' });
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    api.get('/admin/owner-stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  async function predictRent(e) {
    e.preventDefault();
    setAiLoading(true); setAiError(''); setAiResult(null);
    try {
      const amenitiesList = aiForm.amenities.split(',').map((a) => a.trim()).filter(Boolean);
      const { data } = await api.post('/ai/predict-rent', {
        city: aiForm.city, roomType: aiForm.roomType, amenities: amenitiesList,
      });
      setAiResult(data.predictedRent);
    } catch (e) {
      setAiError(e.response?.data?.message || 'AI service error.');
    } finally {
      setAiLoading(false);
    }
  }

  const monthly = stats?.monthlyRevenue || [];
  const maxRev = Math.max(...monthly.map((m) => m.total), 1);

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
              Manage your PG listings, track bookings, and optimize revenue.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setAiModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px', borderRadius: 12,
                background: 'var(--surface)', color: 'var(--text-h)',
                border: '1.5px solid var(--border)', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; }}
            >
              <FiZap size={15} /> AI Rent Suggestion
            </button>
            <Link
              to="/owner/listings/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 24px', borderRadius: 12,
                background: 'var(--btn-accent)', color: '#fff',
                fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; }}
            >
              + New Listing
            </Link>
          </div>
        </div>

        <ErrorBanner message={error} />
        {loading ? <PageSpinner /> : stats && (
          <>
            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <OwnerStatTile label="Active Listings" value={stats.activeListings} icon={<FiHome size={20} />} />
              <OwnerStatTile label="Pending Requests" value={stats.pendingRequests} icon={<FiInbox size={20} />} color="amber" />
              <OwnerStatTile label="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} icon={<FiTrendingUp size={20} />} accent />
            </div>

            {/* ── Revenue Chart ── */}
            {monthly.length > 0 && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                  Monthly Revenue
                </h2>
                <div
                  style={{
                    borderRadius: 20, background: 'var(--surface)',
                    border: '1px solid var(--border)', padding: '32px 28px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, justifyContent: 'space-between' }}>
                    {monthly.map((m, i) => {
                      const barH = Math.max(16, (m.total / maxRev) * 120);
                      return (
                        <div key={i} style={{ flex: 1, maxWidth: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text)', opacity: 0 }} className="rev-label">
                            ₹{(m.total / 1000).toFixed(0)}k
                          </span>
                          <div
                            style={{
                              width: '100%', height: barH, borderRadius: '8px 8px 4px 4px',
                              background: 'var(--accent)', opacity: 0.65,
                              transition: 'all 0.3s ease', transformOrigin: 'bottom',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleY(1.06)'; e.currentTarget.parentElement.querySelector('.rev-label').style.opacity = '1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.65'; e.currentTarget.style.transform = ''; e.currentTarget.parentElement.querySelector('.rev-label').style.opacity = '0'; }}
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text)', fontWeight: 600 }}>
                            {MONTH_NAMES[(m._id.month || 1) - 1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── Quick Actions ── */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: '0 0 24px' }}>
                Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                <QuickCard to="/owner/listings" icon={<FiHome size={22} />} title="My Listings" desc="View and manage all your PG property listings." />
                <QuickCard to="/owner/requests" icon={<FiClipboard size={22} />} title="Booking Requests" desc="Review pending requests and approve or reject bookings." />
                <QuickCard to="/owner/completed" icon={<FiCheckCircle size={22} />} title="Completed Stays" desc="View history and revenue from past completed bookings." />
              </div>
            </section>
          </>
        )}
      </main>

      {/* AI Rent Modal */}
      <Modal open={aiModal} onClose={() => { setAiModal(false); setAiResult(null); setAiError(''); }} title="AI Rent Prediction">
        <form onSubmit={predictRent} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
          <ModalField label="City">
            <input value={aiForm.city} onChange={(e) => setAiForm((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Bangalore" required style={modalInput} />
          </ModalField>
          <ModalField label="Room Type">
            <select value={aiForm.roomType} onChange={(e) => setAiForm((f) => ({ ...f, roomType: e.target.value }))} style={modalInput}>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </ModalField>
          <ModalField label="Amenities">
            <input value={aiForm.amenities} onChange={(e) => setAiForm((f) => ({ ...f, amenities: e.target.value }))} placeholder="wifi, ac, meals (comma-separated)" style={modalInput} />
          </ModalField>
          <ErrorBanner message={aiError} />
          {aiResult !== null && (
            <div style={{ padding: 24, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Suggested Rent</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-h)', marginTop: 4, letterSpacing: '-0.02em' }}>
                ₹{aiResult?.toLocaleString('en-IN')}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)' }}> /mo</span>
              </div>
            </div>
          )}
          <button
            type="submit" disabled={aiLoading}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 12,
              background: 'var(--btn-accent)', color: '#fff',
              fontWeight: 600, fontSize: '0.9375rem', border: 'none',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              opacity: aiLoading ? 0.65 : 1,
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={(e) => { if (!aiLoading) { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={(e) => { if (!aiLoading) { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; } }}
          >
            {aiLoading ? 'Predicting...' : <><FiZap size={16} /> Predict Rent</>}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}

/* ── Subcomponents ── */

const ICON_COLORS = {
  default: { bg: 'var(--accent-bg)', border: 'var(--accent-border)', color: 'var(--accent)' },
  amber:   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#d97706' },
};

function OwnerStatTile({ label, value, icon, accent, color = 'default' }) {
  if (accent) {
    return (
      <div
        style={{
          padding: '24px 28px', borderRadius: 20,
          background: 'var(--accent)', border: '1px solid var(--accent-border)',
          display: 'flex', flexDirection: 'column', gap: 16,
          transition: 'all 0.3s ease', cursor: 'default',
          boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.25)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            {icon}
          </span>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      </div>
    );
  }
  const c = ICON_COLORS[color] || ICON_COLORS.default;
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
        <span style={{ width: 42, height: 42, borderRadius: 14, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function QuickCard({ to, icon, title, desc }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: '28px 24px', borderRadius: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        textDecoration: 'none', transition: 'all 0.3s ease',
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

function ModalField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '0.01em' }}>{label}</label>
      {children}
    </div>
  );
}

const modalInput = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: '1.5px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-h)', fontSize: '0.9375rem', outline: 'none',
  transition: 'all 0.2s ease', boxSizing: 'border-box',
};
