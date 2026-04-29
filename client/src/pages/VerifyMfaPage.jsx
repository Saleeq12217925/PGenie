import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthCard } from '../components/auth/AuthCard.jsx';
import { OtpInput } from '../components/auth/OtpInput.jsx';
import { SubmitButton } from '../components/auth/SubmitButton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';

export function VerifyMfaPage() {
  const { status, setTokens } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  // Guard: must arrive here via login flow with a tempToken
  if (!state?.tempToken) return <Navigate to="/login" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Enter all 6 digits.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-mfa', {
        tempToken: state.tempToken,
        token: otp,
      });
      setTokens(data.accessToken, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Two-factor verification"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '28px' }}>
          <OtpInput value={otp} onChange={setOtp} />
          {error && (
            <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#ef4444' }}>
              {error}
            </p>
          )}
        </div>

        <SubmitButton loading={loading} disabled={otp.length < 6}>
          Verify
        </SubmitButton>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text)' }}>
          <a
            href="/login"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
            onClick={(e) => { e.preventDefault(); navigate('/login'); }}
          >
            Back to login
          </a>
        </p>
      </form>
    </AuthCard>
  );
}
