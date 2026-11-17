import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { Wordmark } from '../components/layout/Wordmark.jsx';
import api from '../lib/axios.js';
import { OtpInput } from '../components/auth/OtpInput.jsx';

const roleColors = {
  admin: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  owner: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  tenant: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
};

export function DashboardPage() {
  const { user, logout, refetchUser } = useAuth();
  const role = user?.role || 'tenant';
  const badge = roleColors[role] || roleColors.tenant;

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
        <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
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

          {/* MFA Setup Prompt */}
          {user && !user.mfaEnabled && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px',
              textAlign: 'left',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
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

      {/* MFA Setup Modal */}
      {mfaModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 100
        }}>
          <div style={{
            background: 'var(--surface)', padding: 32, borderRadius: 16, maxWidth: 400, width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 16, color: 'var(--text-h)' }}>Set up Two-Factor Auth</h2>

            {mfaLoading && !qrCode ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.75s linear infinite', display: 'inline-block' }}>
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              </div>
            ) : qrCode ? (
              <form onSubmit={handleEnableMfa}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: 20, lineHeight: 1.5 }}>
                  Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
                </p>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <img src={qrCode} alt="MFA QR Code" style={{ width: 200, height: 200, display: 'inline-block', borderRadius: 8, background: '#fff', padding: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <OtpInput value={otp} onChange={setOtp} />
                  {mfaError && <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', marginTop: 12 }}>{mfaError}</p>}
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
