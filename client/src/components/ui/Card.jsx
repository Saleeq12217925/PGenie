export function Card({ children, style: extra, onClick, padding = '20px' }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding,
        boxShadow: 'var(--shadow)',
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'box-shadow 0.15s' : undefined,
        ...extra,
      }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md)') : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.boxShadow = 'var(--shadow)') : undefined}
    >
      {children}
    </div>
  );
}
