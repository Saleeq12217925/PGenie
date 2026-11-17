import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { Wordmark } from './Wordmark.jsx';
import api from '../../lib/axios.js';
import { OtpInput } from '../auth/OtpInput.jsx';

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IC = {
  grid:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  users:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  file:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  shield:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  home:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  inbox:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  check:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  search:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  logout:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevL:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  menu:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg>,
  close:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  user:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const NAV_ITEMS = {
  admin: [
    { to: '/dashboard',     label: 'Dashboard',  icon: 'grid'   },
    { to: '/admin/users',   label: 'Users',       icon: 'users'  },
    { to: '/admin/bookings',label: 'Bookings',    icon: 'file'   },
    { to: '/admin/audit',   label: 'Audit Log',   icon: 'shield' },
  ],
  owner: [
    { to: '/dashboard',       label: 'Dashboard',  icon: 'grid'    },
    { to: '/owner/listings',  label: 'Listings',   icon: 'home'    },
    { to: '/owner/requests',  label: 'Requests',   icon: 'inbox'   },
    { to: '/owner/completed', label: 'Completed',  icon: 'check'   },
    { to: '/chat/inbox',      label: 'Messages',   icon: 'message', unread: true },
  ],
  tenant: [
    { to: '/dashboard', label: 'Dashboard',   icon: 'grid'    },
    { to: '/pgs',       label: 'Search PGs',  icon: 'search'  },
    { to: '/bookings',  label: 'My Bookings', icon: 'file'    },
    { to: '/chat/inbox',label: 'Messages',    icon: 'message', unread: true },
  ],
};

const SIDEBAR_W = 272;
const COLLAPSED_W = 68;
const MOBILE_BP = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
}

function Avatar({ name, size = 40 }) {
  const initials = (name || '?')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className="flex-shrink-0 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white select-none shadow-sm"
    >
      {initials}
    </div>
  );
}

function NavItem({ item, collapsed, isMobile, unreadCount }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      className={({ isActive }) => `
        group relative flex items-center gap-0 ${(!collapsed || isMobile) ? 'px-3 mx-3 rounded-xl' : 'justify-center w-11 h-11 mx-auto rounded-xl'} py-2.5 text-[0.875rem] transition-all duration-200 ease-out mb-0.5
        ${isActive
          ? 'text-[var(--accent)] bg-[var(--accent-bg)] font-semibold'
          : 'text-[var(--text)] hover:text-[var(--text-h)] hover:bg-[var(--surface)] font-medium'
        }
      `}
    >
      {({ isActive }) => (
        <>
          {(!collapsed || isMobile) && isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent)] rounded-r-full" />
          )}
          <span className={`relative flex-shrink-0 flex items-center justify-center w-5 h-5 transition-transform duration-200 ${(!collapsed || isMobile) ? 'ml-2' : ''}`}>
            {IC[item.icon]}
            {item.unread && unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#ef4444] text-white rounded-full min-w-[16px] px-0.5 h-4 text-[0.6rem] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          {(!collapsed || isMobile) && (
            <span className="flex-1 flex items-center justify-between min-w-0 ml-2.5">
              <span className="truncate">{item.label}</span>
              {item.unread && unreadCount > 0 && (
                <span className="bg-[#ef4444] text-white px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold flex-shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function IconBtn({ onClick, title, children, 'aria-label': ariaLabel }) {
  return (
    <button
      onClick={onClick} title={title} aria-label={ariaLabel}
      className="p-2 text-[var(--text)] hover:text-[var(--text-h)] bg-transparent hover:bg-[var(--surface)] rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-200"
    >
      {children}
    </button>
  );
}

const ROLE_COLORS = {
  admin:  { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444' },
  owner:  { bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
  tenant: { bg: 'rgba(99,102,241,0.1)',  text: 'var(--accent)' },
};

export function AppShell({ children }) {
  const { user, logout, refetchUser } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const role = user?.role || 'tenant';
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.tenant;
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.tenant;

  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [otp, setOtp] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  async function handleSetupMfa() {
    setMfaModalOpen(true);
    setMfaLoading(true);
    setMfaError('');
    setQrCode('');
    setOtp('');
    try {
      const { data } = await api.get('/auth/mfa/setup');
      setQrCode(data.qrDataUrl);
    } catch (err) {
      setMfaError('Failed to initialize MFA setup.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleEnableMfa(e) {
    e.preventDefault();
    if (otp.length < 6) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      await api.post('/auth/mfa/enable', { token: otp });
      setMfaModalOpen(false);
      await refetchUser();
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Invalid code. Try again.');
      setOtp('');
    } finally {
      setMfaLoading(false);
    }
  }

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = (isMobile && mobileOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (!user) return;
    const fetch = () =>
      api.get('/bookings/unread-count')
        .then((r) => setUnreadCount(r.data.data?.count || 0))
        .catch(() => {});
    fetch();
    const iv = setInterval(fetch, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const sidebarStyle = isMobile
    ? { width: SIDEBAR_W, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }
    : { width: collapsed ? COLLAPSED_W : SIDEBAR_W };

  return (
    <div className="flex min-h-[100svh] bg-[var(--surface)] font-sans antialiased text-[var(--text)]">

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[299] bg-[var(--text-h)]/60 transition-opacity duration-300"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className="fixed md:sticky top-0 left-0 z-[300] h-[100svh] flex flex-col bg-[var(--surface)] border-r border-[var(--border)] flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
        style={sidebarStyle}
      >
        {/* Logo row */}
        <div
          className="h-[68px] flex-shrink-0 flex items-center border-b border-[var(--border)] bg-transparent transition-all duration-300"
          style={{ padding: (!collapsed || isMobile) ? '0 16px 0 20px' : '0', justifyContent: 'center' }}
        >
          {(!collapsed || isMobile) && (
            <div className="flex-1 flex justify-start">
              <Wordmark size="sm" />
            </div>
          )}
          {!isMobile && (
            <IconBtn onClick={() => setCollapsed((c) => !c)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? IC.chevR : IC.chevL}
            </IconBtn>
          )}
          {isMobile && (
            <IconBtn onClick={() => setMobileOpen(false)} aria-label="Close menu">
              {IC.close}
            </IconBtn>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 flex flex-col overflow-y-auto overflow-x-hidden bg-transparent">
          {(!collapsed || isMobile) && (
            <div className="px-5 pb-1 pt-1">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text)] opacity-60">Menu</span>
            </div>
          )}
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              isMobile={isMobile}
              unreadCount={unreadCount}
            />
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[var(--border)] flex-shrink-0 bg-transparent">
          {(!collapsed || isMobile) ? (
            <Link to="/profile" className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] mb-2 no-underline transition-all duration-200 hover:bg-[var(--accent-bg)]" style={{ cursor: 'pointer' }}>
              <Avatar name={user?.name} size={38} />
              <div className="flex-1 min-w-0 flex items-center h-full">
                <div className="font-semibold text-[0.875rem] text-[var(--text-h)] truncate leading-tight">
                  {user?.name}
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/profile" className="flex justify-center mb-2" style={{ cursor: 'pointer' }}>
              <Avatar name={user?.name} size={38} />
            </Link>
          )}

          <div className={(!collapsed || isMobile) ? "flex gap-2" : "flex flex-col gap-2"}>
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
              className={`flex-1 flex items-center gap-2.5 py-2.5 rounded-xl border border-transparent bg-transparent hover:bg-[var(--accent-bg)] hover:border-[var(--accent-border)] text-[var(--text)] hover:text-[var(--accent)] text-[0.875rem] font-medium transition-all duration-200 ${(!collapsed || isMobile) ? 'px-2.5 justify-start' : 'justify-center w-11 h-11 mx-auto'}`}
            >
              <span className="flex items-center justify-center flex-shrink-0">
                {dark ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </span>
              {(!collapsed || isMobile) && <span className="truncate">{dark ? 'Light' : 'Dark'}</span>}
            </button>

            <button
              onClick={logout}
              className={`flex-1 flex items-center gap-2.5 py-2.5 rounded-xl border border-transparent bg-transparent hover:bg-[#ef4444]/8 hover:border-[#ef4444]/15 text-[var(--text)] hover:text-[#ef4444] text-[0.875rem] font-medium transition-all duration-200 ${(!collapsed || isMobile) ? 'px-2.5 justify-start' : 'justify-center w-11 h-11 mx-auto'}`}
            >
              <span className="flex items-center justify-center flex-shrink-0">{IC.logout}</span>
              {(!collapsed || isMobile) && <span className="truncate">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] transition-all duration-300">

        {/* Mobile topbar */}
        {isMobile && (
          <div className="sticky top-0 z-[100] h-[68px] px-4 bg-[var(--bg)] border-b border-[var(--border)] flex items-center gap-3 flex-shrink-0">
            <IconBtn onClick={() => setMobileOpen(true)} aria-label="Open menu">
              {IC.menu}
            </IconBtn>
            <Wordmark size="sm" />
          </div>
        )}

        <div className="flex-1 overflow-x-hidden">
          {user && !user.mfaEnabled && (
            <div style={{
              margin: '24px',
              padding: '16px 20px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div>
                <strong style={{ color: '#d97706', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Secure your account</strong>
                <p style={{ color: 'var(--text)', fontSize: '0.85rem', margin: 0 }}>Two-factor authentication is not enabled.</p>
              </div>
              <button
                onClick={handleSetupMfa}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.background = '#d97706'}
                onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
              >
                Set up MFA
              </button>
            </div>
          )}
          {children}
        </div>
      </div>

      {mfaModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 9999
        }}>
          <div style={{
            background: 'var(--surface)', padding: 32, borderRadius: 16, maxWidth: 400, width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 16, color: 'var(--text-h)', marginTop: 0 }}>Set up Two-Factor Auth</h2>

            {mfaLoading && !qrCode ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.75s linear infinite', display: 'inline-block' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              </div>
            ) : qrCode ? (
              <form onSubmit={handleEnableMfa} style={{ margin: 0 }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: 20, lineHeight: 1.5, marginTop: 0 }}>
                  Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
                </p>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <img src={qrCode} alt="MFA QR Code" style={{ width: 200, height: 200, display: 'inline-block', borderRadius: 8, background: '#fff', padding: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <OtpInput value={otp} onChange={setOtp} />
                  {mfaError && <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>{mfaError}</p>}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setMfaModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={otp.length < 6 || mfaLoading} style={{ flex: 1, padding: '12px', background: 'var(--btn-accent)', border: 'none', borderRadius: 12, color: '#fff', cursor: (otp.length < 6 || mfaLoading) ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (otp.length < 6 || mfaLoading) ? 0.65 : 1 }}>Verify & Enable</button>
                </div>
              </form>
            ) : (
              <div>
                <p style={{ color: '#ef4444', marginBottom: 24 }}>{mfaError}</p>
                <button onClick={() => setMfaModalOpen(false)} style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
