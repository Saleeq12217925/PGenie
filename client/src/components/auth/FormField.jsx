export function FormField({ label, id, error, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--text-h)',
            marginBottom: '6px',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p
          style={{
            marginTop: '5px',
            fontSize: '0.8rem',
            color: '#ef4444',
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ id, type = 'text', placeholder, value, onChange, disabled, autoComplete, style }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete={autoComplete}
      style={{
        display: 'block',
        width: '100%',
        padding: '10px 14px',
        fontSize: '0.9375rem',
        color: 'var(--text-h)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        outline: 'none',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
    />
  );
}

export function Select({ id, value, onChange, disabled, children, style }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        padding: '10px 14px',
        fontSize: '0.9375rem',
        color: 'var(--text-h)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'auto',
        ...style,
      }}
    >
      {children}
    </select>
  );
}
