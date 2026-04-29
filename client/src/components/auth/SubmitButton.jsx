export function SubmitButton({ children, loading, disabled, onClick, type = 'submit', variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '14px 20px',
        fontSize: '0.9375rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        color: isPrimary ? '#fff' : 'var(--accent)',
        background: isPrimary ? 'var(--btn-accent)' : 'transparent',
        border: isPrimary ? 'none' : '1.5px solid var(--accent-border)',
        borderRadius: '12px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.65 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isPrimary ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && isPrimary) {
          e.target.style.background = 'var(--btn-accent-hover)';
          e.target.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)';
          e.target.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading && isPrimary) {
          e.target.style.background = 'var(--btn-accent)';
          e.target.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)';
          e.target.style.transform = '';
        }
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
