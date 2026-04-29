import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { Wordmark } from '../components/layout/Wordmark.jsx';
import { FiHome, FiSun, FiMoon, FiCheck, FiUsers, FiMapPin, FiStar, FiShield } from 'react-icons/fi';

function RevealSection({ children, className = '', style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal-section ${className}`} style={style}>{children}</div>;
}

function AnimatedCounter({ end, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(end / 40));
        const iv = setInterval(() => {
          start += step;
          if (start >= end) { setVal(end); clearInterval(iv); }
          else setVal(start);
        }, 30);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

export function LandingPage() {
  const { status } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchType, setSearchType] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (searchCity.trim()) qs.set('city', searchCity.trim().toLowerCase());
    if (searchType) qs.set('roomType', searchType);
    navigate(`/pgs?${qs}`);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: 'var(--sans)', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── 1. Navbar ── */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'var(--navbar-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.08)' : 'none',
        padding: scrolled ? '14px 0' : '20px 0',
      }}>
        <div className="px-5 md:px-8" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark />
          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 36 }}>
            {['#features', '#how-it-works', '#testimonials'].map((href, i) => (
              <a key={href} href={href} style={{ color: 'var(--text-h)', fontSize: 14, fontWeight: 500, textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.target.style.opacity = 1}
                onMouseLeave={e => e.target.style.opacity = 0.75}>
                {['Features', 'How it Works', 'Testimonials'][i]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => toggleTheme()}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
                color: 'var(--text-h)', flexShrink: 0,
              }}
            >
              {dark ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>
            <Link to="/login" className="hidden sm:inline-block" style={{ color: 'var(--text-h)', fontSize: 14, fontWeight: 600, textDecoration: 'none', opacity: 0.85 }}>Log in</Link>
            <Link to="/register" style={{
              background: 'var(--accent)', color: '#fff', padding: '10px 22px',
              borderRadius: 99, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)', transition: 'all 0.2s',
              display: 'inline-block',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.35)'; }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>

        {/* ── 2. Hero ── */}
        <section className="pt-28 md:pt-[140px] pb-16 md:pb-20 px-5 md:px-8" style={{ background: 'var(--surface)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 56, alignItems: 'center' }}>
            {/* Left */}
            <div style={{ maxWidth: 580 }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 14px',
                borderRadius: 99, background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 28,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--accent)', opacity: 0.7, animation: 'ping 1.2s cubic-bezier(0.4,0,0.6,1) infinite' }}></span>
                  <span style={{ position: 'relative', borderRadius: '50%', width: 10, height: 10, background: 'var(--accent)', display: 'inline-block' }}></span>
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>New Feature</span>
                <span style={{ width: 1, height: 12, background: 'var(--border)', display: 'inline-block' }}></span>
                AI Rent Predictor Live
              </div>

              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--text-h)', margin: '0 0 20px' }}>
                Premium Stays.<br />
                <span style={{ color: 'var(--accent)' }}>Zero Friction.</span>
              </h1>

              <p style={{ fontSize: '1.125rem', color: 'var(--text)', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 480, fontWeight: 450 }}>
                Discover, manage, and book verified PG accommodations with seamless payments, direct owner chat, and intelligent recommendations.
              </p>

              {/* Quick search */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full max-w-[460px] mb-6 rounded-[14px] overflow-hidden border-[1.5px] border-[var(--border)] bg-[var(--bg)] shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
                <input
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Search by city…"
                  className="flex-1 p-[13px_16px] border-none bg-transparent text-[color:var(--text-h)] text-[0.9rem] outline-none"
                />
                <div className="h-[1px] w-full sm:h-auto sm:w-[1px] bg-[var(--border)]"></div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="p-[13px_12px] border-none bg-transparent text-[color:var(--text)] text-[0.85rem] outline-none cursor-pointer"
                >
                  <option value="">Any type</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="dormitory">Dormitory</option>
                </select>
                <button type="submit" className="p-[13px_20px] bg-[var(--accent)] text-white border-none font-bold text-[0.9rem] cursor-pointer">
                  Search
                </button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <HoverLink to="/register" primary>Find Your Room</HoverLink>
                <HoverLink to="/register">List Your Property →</HoverLink>
              </div>
            </div>

            {/* Right — Image */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }} className="hero-img-col">

              <div style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.06)', aspectRatio: '4/5', transform: 'rotate(2deg)', transition: 'transform 0.6s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(2deg)'}>
                <img src="/hero.png" alt="Modern PG Room" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div className="absolute bottom-6 -left-1 sm:-left-5 flex items-center gap-3.5" style={{
                background: 'var(--bg)',
                backdropFilter: 'blur(12px)', padding: '14px 18px', borderRadius: 18,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border)',
                animation: 'floatY 4s ease-in-out infinite',
              }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid var(--border)' }}><FiHome /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', lineHeight: 1 }}>Verified Stays</div>
                  <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 4 }}>100% Quality Assured</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Trusted By Bar ── */}
        <section className="py-8 px-5 md:px-8" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, opacity: 0.55 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)', whiteSpace: 'nowrap' }}>
              Trusted by students at
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 40px', alignItems: 'center' }}>
              {['Stanford', 'MIT', 'Harvard', 'Oxford', 'Berkeley'].map(name => (
                <span key={name} style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-h)' }}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3b. Stats Counter ── */}
        <RevealSection className="py-20 md:py-28 px-5 md:px-8" style={{ background: 'var(--surface)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
            <StatCounter icon={<FiUsers size={22} />} value={10000} suffix="+" label="Happy Tenants" />
            <StatCounter icon={<FiMapPin size={22} />} value={500} suffix="+" label="Cities Covered" />
            <StatCounter icon={<FiHome size={22} />} value={2500} suffix="+" label="Verified PGs" />
            <StatCounter icon={<FiStar size={22} />} value={98} suffix="%" label="Satisfaction Rate" />
          </div>
        </RevealSection>

        {/* ── 4. Features ── */}
        <RevealSection id="features" className="py-20 md:py-28 px-5 md:px-8" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 60px' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-h)', margin: '0 0 14px' }}>
                Designed for peace of mind.
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
                We replace fragmented WhatsApp groups and spreadsheet chaos with a unified, purpose-built platform.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              <FeatureCard
                icon={<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                title="AI-Powered Discovery"
                desc="Our intelligent recommendation engine ranks listings based on your budget, commute routes, and preferred amenities."
              />
              <FeatureCard
                icon={<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                title="Bank-Grade Security"
                desc="With AES-256-GCM encryption at rest, secure token rotation, and MFA workflows, your data is impenetrable."
              />
              <FeatureCard
                icon={<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                title="Real-Time Sync"
                desc="Instantly coordinate viewings and resolve issues using our built-in WebSocket chat engine between tenants and owners."
              />
            </div>
          </div>
        </RevealSection>

        {/* ── 5. How It Works ── */}
        <RevealSection id="how-it-works" className="py-20 md:py-28 px-5 md:px-8" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-h)', margin: '0 0 40px' }}>
                How PGenie Works
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <StepRow number="1" title="Create an account" desc="Sign up via secure MFA and set your role. Tenants browse; Owners build listings." />
                <StepRow number="2" title="Match & Chat" desc="Use AI tools to find exactly what you want, then connect directly inside our real-time messenger." />
                <StepRow number="3" title="Pay & Move In" desc="Digitally accept agreements and securely pay your rent without exiting the app." />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>

                <div style={{
                  position: 'relative', borderRadius: 28, overflow: 'hidden',
                  border: '8px solid var(--surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                  outline: '1px solid var(--border)', aspectRatio: '4/5', transition: 'transform 0.5s ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}>
                  <img src="/app_mockup.png" alt="PGenie App" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div className="absolute top-10 -right-2 sm:-right-7 flex items-center gap-3 z-10" style={{
                  background: 'var(--bg)', backdropFilter: 'blur(12px)', padding: '12px 16px',
                  borderRadius: 16, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', border: '1px solid var(--border)',
                  animation: 'floatY 3.5s ease-in-out infinite 0.5s',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}><FiCheck size={16} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-h)', lineHeight: 1 }}>Payment Sent</div>
                    <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 3 }}>₹12,500 via UPI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* ── 6. Testimonials ── */}
        <RevealSection id="testimonials" className="py-20 md:py-28 px-5 md:px-8" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', color: 'var(--text-h)', margin: '0 0 52px' }}>
              Preferred by top owners & tenants
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              <TestimonialCard
                quote="PGenie took my occupancy rate from 60% to 95% in two months. The AI rent predictor ensured I was pricing my rooms perfectly for the market."
                name="Rahul S." title="PG Owner, Bangalore"
              />
              <TestimonialCard
                quote="Finding a clean, verified PG used to take weeks of calling and visiting. With PGenie, I found my place, chatted with the owner, and paid within 2 hours."
                name="Priya M." title="Student, MIT"
              />
              <TestimonialCard
                quote="The built-in chat and secure payments give me total peace of mind. No more chasing tenants for cash or dealing with fake listings."
                name="Ankit D." title="PG Owner, Mumbai"
              />
            </div>
          </div>
        </RevealSection>

        {/* ── 7. CTA ── */}
        <section className="relative overflow-hidden py-20 md:py-28 px-5 md:px-8" style={{ borderTop: '1px solid var(--accent-border)', borderBottom: '1px solid var(--accent-border)', background: 'var(--accent)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.1 }}>
              Ready to upgrade your rental experience?
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
              Join thousands of users who have already switched to a more intelligent way of managing accommodations.
            </p>
            <Link to="/register" style={{
              display: 'inline-block', background: '#fff', color: '#000', padding: '16px 40px',
              borderRadius: 99, fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)', transition: 'all 0.25s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}>
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      {/* ── 8. Footer ── */}
      <footer className="py-8 px-5 md:px-8" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <Wordmark size="sm" />
          <div style={{ display: 'flex', gap: 28, fontSize: 13, fontWeight: 500 }}>
            {['Privacy Policy', 'Terms', 'Contact Support'].map(label => (
              <Link key={label} to="#" style={{ color: 'var(--text)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-h)'}
                onMouseLeave={e => e.target.style.color = 'var(--text)'}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ color: 'var(--text)', fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} PGenie. All rights reserved.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .reveal-section {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal-section.revealed {
          opacity: 1; transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

// ── Subcomponents ──

function HoverLink({ to, children, primary }) {
  return (
    <Link to={to} style={{
      display: 'inline-block',
      background: primary ? 'var(--accent)' : 'var(--bg)',
      color: primary ? '#fff' : 'var(--text-h)',
      padding: primary ? '14px 30px' : '13px 28px',
      borderRadius: 12, fontWeight: 600, fontSize: '1rem',
      textDecoration: 'none',
      border: primary ? 'none' : '1px solid var(--border)',
      boxShadow: primary ? '0 4px 14px rgba(16,185,129,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = primary ? '0 8px 20px rgba(16,185,129,0.35)' : '0 4px 12px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = primary ? '0 4px 14px rgba(16,185,129,0.25)' : '0 1px 4px rgba(0,0,0,0.06)'; }}>
      {children}
    </Link>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 md:p-9" style={{
      borderRadius: 24, background: 'var(--surface)',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20,
      transition: 'all 0.3s ease', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ color: 'var(--text)', lineHeight: 1.65, margin: 0, fontSize: '0.95rem' }}>{desc}</p>
      </div>
    </div>
  );
}

function StepRow({ number, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', cursor: 'default' }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--bg)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 16, color: 'var(--text-h)', flexShrink: 0,
        transition: 'all 0.25s',
      }}>
        {number}
      </div>
      <div style={{ paddingTop: 8 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', margin: '0 0 6px' }}>{title}</h3>
        <p style={{ color: 'var(--text)', lineHeight: 1.65, margin: 0, fontSize: '0.95rem' }}>{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, title }) {
  return (
    <div className="p-6 md:p-8" style={{
      borderRadius: 20, background: 'var(--surface)',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s ease', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ fontSize: 72, color: 'var(--accent)', opacity: 0.12, position: 'absolute', top: 12, right: 20, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
      <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-h)', lineHeight: 1.7, margin: '0 0 28px', position: 'relative', zIndex: 1, fontWeight: 500 }}>
        "{quote}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
          boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
        }}>{name.charAt(0)}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', lineHeight: 1 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 4 }}>{title}</div>
        </div>
      </div>
    </div>
  );
}

function StatCounter({ icon, value, suffix, label }) {
  return (
    <div style={{
      textAlign: 'center', padding: '24px 16px', borderRadius: 20,
      background: 'var(--bg)', border: '1px solid var(--border)',
      transition: 'all 0.3s ease', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <AnimatedCounter end={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}
