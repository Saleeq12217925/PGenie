const sizes = {
  sm: { fontSize: '1.25rem', letterSpacing: '-0.02em' },
  md: { fontSize: '1.75rem', letterSpacing: '-0.03em' },
  lg: { fontSize: '2.5rem', letterSpacing: '-0.04em' },
};

export function Wordmark({ size = 'md' }) {
  const style = sizes[size] || sizes.md;
  return (
    <span
      style={{
        fontFamily: 'var(--heading)',
        fontWeight: 700,
        lineHeight: 1,
        ...style,
      }}
    >
      <span style={{ color: 'var(--accent)' }}>P</span>
      <span style={{ color: 'var(--text-h)' }}>Genie</span>
    </span>
  );
}
