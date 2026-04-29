import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthCard } from '../components/auth/AuthCard.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';

function PasswordStrength({ password }) {
  const checks = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = checks.filter((r) => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= score ? colors[score] : 'var(--border)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

export function RegisterPage() {
  const { status, setTokens } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'tenant' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'At least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter.';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number.';
    return errs;
  }

  async function handleRegister(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setTokens(data.accessToken, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        setServerError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (field) => ({
    display: 'block',
    width: '100%',
    padding: '14px 16px',
    fontSize: '0.9375rem',
    color: 'var(--text-h)',
    background: 'var(--surface)',
    border: `1.5px solid ${errors[field] ? '#ef4444' : focusedField === field ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 12,
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px var(--accent-bg)' : 'none',
  });

  const selectStyle = {
    display: 'block',
    width: '100%',
    padding: '14px 16px',
    fontSize: '0.9375rem',
    color: 'var(--text-h)',
    background: 'var(--surface)',
    border: `1.5px solid ${focusedField === 'role' ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 12,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'auto',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === 'role' ? '0 0 0 3px var(--accent-bg)' : 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-h)',
    marginBottom: 8,
    letterSpacing: '0.01em',
  };

  return (
    <AuthCard title="Create your account" subtitle="Get started with PGenie for free">
      <form onSubmit={handleRegister} noValidate>
        {serverError && (
          <div style={{
            padding: '12px 16px', marginBottom: 24, borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', fontSize: '0.875rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {serverError}
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="reg-name" style={labelStyle}>Full name</label>
          <input id="reg-name" placeholder="John Doe" value={form.name} onChange={set('name')} disabled={loading} autoComplete="name"
            onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} style={inputStyle('name')} />
          {errors.name && <p style={{ marginTop: 6, fontSize: '0.8rem', color: '#ef4444' }}>{errors.name}</p>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="reg-email" style={labelStyle}>Email address</label>
          <input id="reg-email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} disabled={loading} autoComplete="email"
            onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} style={inputStyle('email')} />
          {errors.email && <p style={{ marginTop: 6, fontSize: '0.8rem', color: '#ef4444' }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="reg-password" style={labelStyle}>Password</label>
          <input id="reg-password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} disabled={loading} autoComplete="new-password"
            onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} style={inputStyle('password')} />
          {errors.password && <p style={{ marginTop: 6, fontSize: '0.8rem', color: '#ef4444' }}>{errors.password}</p>}
          <PasswordStrength password={form.password} />
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="reg-role" style={labelStyle}>I am a</label>
          <select id="reg-role" value={form.role} onChange={set('role')} disabled={loading}
            onFocus={() => setFocusedField('role')} onBlur={() => setFocusedField(null)} style={selectStyle}>
            <option value="tenant">Tenant</option>
            <option value="owner">PG Owner</option>
          </select>
        </div>

        {/* Submit */}
        <div style={{ marginTop: 28 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px 20px',
              fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '0.01em',
              color: '#fff', background: 'var(--btn-accent)',
              border: 'none', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; } }}
          >
            {loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.75s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            )}
            Create account
          </button>
        </div>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
      </div>

      {/* Login link */}
      <Link
        to="/login"
        style={{
          display: 'block', width: '100%', padding: '13px 20px',
          fontSize: '0.9375rem', fontWeight: 600, textAlign: 'center',
          color: 'var(--text-h)', background: 'var(--surface)',
          border: '1.5px solid var(--border)', borderRadius: 12,
          textDecoration: 'none', transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; }}
      >
        Sign in instead
      </Link>
    </AuthCard>
  );
}
