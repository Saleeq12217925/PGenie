import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

function PageSpinner() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
        style={{ animation: 'spin 0.75s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== 'loading') return;
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [status]);

  if (status === 'loading' && !timedOut) return <PageSpinner />;
  if (status === 'unauthenticated' || timedOut) return <Navigate to="/" replace />;
  return children;
}
