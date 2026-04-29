import { useState } from 'react';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { FiUser, FiMail, FiShield, FiCalendar, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';

const ROLE_LABELS = { admin: 'Administrator', owner: 'Property Owner', tenant: 'Tenant' };
const ROLE_COLORS = {
  admin:  { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' },
  owner:  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#d97706' },
  tenant: { bg: 'var(--accent-bg)', border: 'var(--accent-border)', color: 'var(--accent)' },
};

export function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const role = user?.role || 'tenant';
  const rc = ROLE_COLORS[role] || ROLE_COLORS.tenant;
  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.patch('/auth/profile', { name: name.trim() });
      setSuccess('Name updated successfully.');
      if (refetchUser) refetchUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await api.patch('/auth/profile', { currentPassword, newPassword });
      setPwSuccess('Password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Header ── */}
        <div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>
            Profile
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
            Manage your account details and security settings.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* ── Account Info Card ── */}
          <div style={{
            gridColumn: '1 / -1',
            padding: '32px', borderRadius: 20,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 800, flexShrink: 0,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                {user?.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <InfoChip icon={<FiMail size={13} />} text={user?.email} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 8,
                  background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color,
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  <FiShield size={12} /> {ROLE_LABELS[role]}
                </span>
                <InfoChip icon={<FiCalendar size={13} />} text={`Joined ${new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`} />
              </div>
            </div>
          </div>

          {/* ── Edit Name Card ── */}
          <SectionCard title="Personal Information" icon={<FiUser size={18} />}>
            <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FormField label="Full Name">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  style={inputStyle} required maxLength={100}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
              <FormField label="Email">
                <input value={user?.email || ''} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: 4, display: 'block' }}>Email cannot be changed.</span>
              </FormField>
              {error && <StatusMsg type="error" msg={error} />}
              {success && <StatusMsg type="success" msg={success} />}
              <SaveBtn loading={saving}>Save Changes</SaveBtn>
            </form>
          </SectionCard>

          {/* ── Change Password Card ── */}
          <SectionCard title="Change Password" icon={<FiLock size={18} />}>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FormField label="Current Password">
                <input
                  type="password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={inputStyle} required autoComplete="current-password"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
              <FormField label="New Password">
                <input
                  type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle} required minLength={8} autoComplete="new-password"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
              <FormField label="Confirm New Password">
                <input
                  type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle} required minLength={8} autoComplete="new-password"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </FormField>
              {pwError && <StatusMsg type="error" msg={pwError} />}
              {pwSuccess && <StatusMsg type="success" msg={pwSuccess} />}
              <SaveBtn loading={pwSaving}>Update Password</SaveBtn>
            </form>
          </SectionCard>

          {/* ── Account Status Card ── */}
          <div style={{
            gridColumn: '1 / -1',
            padding: '28px 32px', borderRadius: 20,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', marginBottom: 20, margin: '0 0 20px' }}>
              Account Status
            </h3>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <StatusItem label="Account" value={user?.isActive !== false ? 'Active' : 'Deactivated'} active={user?.isActive !== false} />
              <StatusItem label="Email Verified" value={user?.isVerified ? 'Verified' : 'Not Verified'} active={!!user?.isVerified} />
              <StatusItem label="MFA" value={user?.mfaEnabled ? 'Enabled' : 'Disabled'} active={!!user?.mfaEnabled} />
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

/* ── Subcomponents ── */

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: '1.5px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-h)', fontSize: '0.9375rem', fontWeight: 500,
  outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box',
};

function SectionCard({ title, icon, children }) {
  return (
    <div
      style={{
        padding: '28px 28px', borderRadius: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)', flexShrink: 0,
        }}>
          {icon}
        </span>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '0.01em' }}>{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ loading, children }) {
  return (
    <button
      type="submit" disabled={loading}
      style={{
        width: '100%', padding: '14px 20px', borderRadius: 12,
        background: 'var(--btn-accent)', color: '#fff',
        fontWeight: 600, fontSize: '0.9375rem', border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.65 : 1,
        boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
        transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
      onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; } }}
    >
      {loading ? 'Saving...' : children}
    </button>
  );
}

function StatusMsg({ type, msg }) {
  const isErr = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 16px', borderRadius: 12,
      background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
      border: `1px solid ${isErr ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
      color: isErr ? '#ef4444' : 'var(--accent)',
      fontSize: '0.875rem', fontWeight: 600,
    }}>
      {isErr ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
      {msg}
    </div>
  );
}

function InfoChip({ icon, text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500,
    }}>
      {icon} {text}
    </span>
  );
}

function StatusItem({ label, value, active }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: active ? 'var(--accent)' : 'var(--border)',
          boxShadow: active ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
        }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-h)' }}>{value}</span>
      </div>
    </div>
  );
}
