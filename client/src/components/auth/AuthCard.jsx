import { FiLock, FiCpu, FiMessageCircle, FiCheckCircle, FiSun, FiMoon } from 'react-icons/fi';
import { Wordmark } from '../layout/Wordmark.jsx';
import { useTheme } from '../../hooks/useTheme.js';

const FEATURES = [
  { icon: <FiLock size={16} />, text: 'Bank-grade AES-256 encryption' },
  { icon: <FiCpu size={16} />, text: 'AI-powered rent predictions' },
  { icon: <FiMessageCircle size={16} />, text: 'Real-time owner–tenant chat' },
  { icon: <FiCheckCircle size={16} />, text: '100% verified PG listings' },
];

export function AuthCard({ title, subtitle, children }) {
  const { dark, toggle } = useTheme();

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      background: 'var(--bg)',
      fontFamily: 'var(--sans)',
    }}>

      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex"
        style={{
          flex: '0 0 480px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative geometric shapes */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', border: '1px solid var(--border)', opacity: 0.5, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: 80, left: -40, width: 140, height: 140, borderRadius: '50%', border: '1px solid var(--accent-border)', opacity: 0.4, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '40%', right: 30, width: 80, height: 80, border: '1px solid var(--border)', transform: 'rotate(45deg)', opacity: 0.3, pointerEvents: 'none' }}></div>

        {/* Top: Logo + theme toggle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <Wordmark size="md" />
            <button
              type="button"
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--bg)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 16, transition: 'all 0.2s',
                color: 'var(--text-h)', position: 'relative', zIndex: 10,
              }}
            >
              {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-h)',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
          }}>
            Find your perfect
            <br />
            <span style={{ color: 'var(--accent)' }}>PG stay.</span>
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text)',
            lineHeight: 1.65,
            maxWidth: 360,
            margin: 0,
          }}>
            Join thousands of tenants and owners who trust PGenie to simplify their rental experience.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 14,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              transition: 'all 0.2s',
            }}>
              <span style={{ width: 24, textAlign: 'center', flexShrink: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-h)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom trust line */}
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text)',
          margin: 0,
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}>
          Trusted by 10,000+ students across India
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>
        {/* Mobile-only theme toggle (top-right) */}
        <div
          className="lg:hidden"
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}
        >
          <button
            type="button"
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, transition: 'all 0.2s',
              color: 'var(--text-h)',
            }}
          >
            {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <Wordmark size="md" />
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-h)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
