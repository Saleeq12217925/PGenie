import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiUsers, FiHome, FiClipboard, FiTrendingUp, FiShield, FiArrowRight } from 'react-icons/fi';

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── Header ── */}
        <div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
            System overview, user management, and platform analytics.
          </p>
        </div>
        <ErrorBanner message={error} />

        {loading ? <PageSpinner /> : stats && (
          <>
            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <AdminStatTile label="Total Users" value={stats.totalUsers} icon={<FiUsers size={20} />} color="indigo" />
              <AdminStatTile label="Active Listings" value={stats.totalListings} icon={<FiHome size={20} />} color="emerald" />
              <AdminStatTile label="Total Bookings" value={stats.totalBookings} icon={<FiClipboard size={20} />} color="amber" />
              <AdminStatTile label="Revenue (Paid)" value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`} icon={<FiTrendingUp size={20} />} accent />
            </div>

            {/* ── Recent Activity ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: 0 }}>
                  Recent Activity
                </h2>
                <Link
                  to="/admin/audit"
                  style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-h)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
                >
                  View all →
                </Link>
              </div>
              <div style={{ borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {(stats.recentActivity || []).map((log, i) => (
                  <div
                    key={log._id || i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderBottom: i < (stats.recentActivity || []).length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-h)', textTransform: 'capitalize' }}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.5, display: 'inline-block' }} />
                        {log.userId?.email || 'anonymous'} · {log.ip}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      padding: '4px 12px', borderRadius: 8,
                    }}>
                      {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                  <div style={{ padding: 48, textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                    No recent activity
                  </div>
                )}
              </div>
            </section>

            {/* ── Quick Admin Actions ── */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: '0 0 24px' }}>
                Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                <AdminQuickCard to="/admin/users" icon={<FiUsers size={22} />} title="Manage Users" desc="View, search, and update user roles and account status." />
                <AdminQuickCard to="/admin/bookings" icon={<FiClipboard size={22} />} title="All Bookings" desc="Monitor bookings across the platform with status filters." />
                <AdminQuickCard to="/admin/audit" icon={<FiShield size={22} />} title="Audit Log" desc="Review security events, login attempts, and system activity." />
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}

/* ── Subcomponents ── */

const ICON_COLORS = {
  default: { bg: 'var(--accent-bg)', border: 'var(--accent-border)', color: 'var(--accent)' },
  indigo:  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#6366f1' },
  emerald: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
  amber:   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#d97706' },
};

function AdminStatTile({ label, value, icon, accent, color = 'default' }) {
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

function AdminQuickCard({ to, icon, title, desc }) {
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
