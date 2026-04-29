import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiHome, FiSearch } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || '';
const AMENITY_OPTIONS = ['wifi', 'ac', 'meals', 'laundry', 'parking', 'gym'];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const city = params.get('city') || '';
  const roomType = params.get('roomType') || '';
  const minRent = params.get('minRent') || '';
  const maxRent = params.get('maxRent') || '';
  const amenities = params.get('amenities') || '';
  const page = Number(params.get('page') || 1);

  function p(key, val) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setParams(next);
  }

  useEffect(() => {
    setLoading(true); setError('');
    const safePage = Math.max(1, page);
    const q = new URLSearchParams({ page: safePage, limit: 9 });
    if (city) q.set('city', city);
    if (roomType) q.set('roomType', roomType);
    if (minRent) q.set('minRent', minRent);
    if (maxRent) q.set('maxRent', maxRent);
    if (amenities) q.set('amenities', amenities);
    api.get(`/pgs?${q}`)
      .then((r) => {
        const totalPages = r.data.pagination?.pages || 1;
        const clampedPage = Math.min(safePage, totalPages);
        if (clampedPage !== page) {
          const next = new URLSearchParams(params);
          next.set('page', clampedPage);
          setParams(next);
        }
        setListings(r.data.data);
        setPagination(r.data.pagination);
      })
      .catch((e) => setError(e.response?.data?.message || 'Search failed.'))
      .finally(() => setLoading(false));
  }, [city, roomType, minRent, maxRent, amenities, page, params, setParams]);

  function toggleAmenity(a) {
    const list = amenities ? amenities.split(',').filter(Boolean) : [];
    const next = list.includes(a) ? list.filter((x) => x !== a) : [...list, a];
    p('amenities', next.join(','));
  }

  const inputStyle = (focused) => ({
    display: 'block', width: '100%', padding: '14px 16px',
    fontSize: '0.9375rem', color: 'var(--text-h)',
    background: 'var(--bg)', border: '1.5px solid var(--border)',
    borderRadius: 12, outline: 'none', transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text)', marginBottom: 8,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  };

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>
            Search PGs
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
            Browse verified listings by city, budget, and amenities.
          </p>
        </div>

        {/* ── Filter Panel ── */}
        <div
          style={{
            borderRadius: 24, background: 'var(--surface)',
            border: '1px solid var(--border)', padding: '32px 32px 28px',
            marginBottom: 40, transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>City</label>
              <input
                value={city} onChange={(e) => p('city', e.target.value)}
                placeholder="Enter city..."
                style={inputStyle()}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Room Type</label>
              <select
                value={roomType} onChange={(e) => p('roomType', e.target.value)}
                style={{ ...inputStyle(), cursor: 'pointer', appearance: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Any</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Min Rent (₹)</label>
              <input
                type="number" value={minRent} onChange={(e) => p('minRent', e.target.value)}
                placeholder="3000" style={inputStyle()}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Rent (₹)</label>
              <input
                type="number" value={maxRent} onChange={(e) => p('maxRent', e.target.value)}
                placeholder="20000" style={inputStyle()}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Amenity pills */}
          <div>
            <label style={labelStyle}>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              {AMENITY_OPTIONS.map((a) => {
                const selected = amenities.split(',').includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    style={{
                      padding: '8px 18px', borderRadius: 10, fontSize: '0.8125rem',
                      fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                      transition: 'all 0.2s ease', textTransform: 'capitalize',
                      background: selected ? 'var(--btn-accent)' : 'var(--bg)',
                      color: selected ? '#fff' : 'var(--text-h)',
                      borderColor: selected ? 'var(--btn-accent)' : 'var(--border)',
                      boxShadow: selected ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }
                      else { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; e.currentTarget.style.transform = ''; }
                      else { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; }
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <ErrorBanner message={error} />

        {/* ── Results ── */}
        {loading ? <PageSpinner /> : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                {pagination.total ?? listings.length} results found
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
              {listings.length === 0 && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text)', gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', fontWeight: 600 }}>
                  No PGs found. Try adjusting your filters.
                </p>
              )}
              {listings.map((l) => (
                <Link key={l._id} to={`/pgs/${l._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <PGCard listing={l} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                <PaginationBtn disabled={page <= 1} onClick={() => p('page', page - 1)}>← Prev</PaginationBtn>
                <span style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <PaginationBtn disabled={page >= pagination.pages} onClick={() => p('page', page + 1)}>Next →</PaginationBtn>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

/* ── Subcomponents ── */

function PGCard({ listing: l }) {
  const API = import.meta.env.VITE_API_URL || '';
  return (
    <div
      style={{
        borderRadius: 20, background: 'var(--surface)',
        border: '1px solid var(--border)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', height: '100%',
        transition: 'all 0.3s ease', cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Image */}
      <div style={{ height: 160, background: 'var(--bg)', borderBottom: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', position: 'relative' }}>
        {l.photos?.[0]
          ? <img src={`${API}/uploads/${l.photos[0]}`} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} />
          : <FiHome size={28} style={{ opacity: 0.3 }} />
        }
        {/* Room type tag */}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          padding: '5px 12px', borderRadius: 8,
          background: 'var(--accent)', color: '#fff',
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.04em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {l.roomType}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {l.title}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: 0 }}>
          {l.locality || ''}{l.locality ? ', ' : ''}{l.city}
        </p>

        {/* Amenities */}
        {l.amenities?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {l.amenities.slice(0, 3).map((a) => (
              <span key={a} style={{
                padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem',
                fontWeight: 600, textTransform: 'capitalize',
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)',
              }}>
                {a}
              </span>
            ))}
            {l.amenities.length > 3 && (
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: '0.68rem',
                fontWeight: 700, background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)', color: 'var(--accent)',
              }}>
                +{l.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + rating */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
          <span style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
            ₹{l.rent?.toLocaleString('en-IN')}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text)' }}>/mo</span>
          </span>
          {l.avgRating > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#f59e0b' }}>★</span> {l.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PaginationBtn({ disabled, onClick, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '10px 20px', borderRadius: 12,
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        color: 'var(--text-h)', fontSize: '0.875rem', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; } }}
    >
      {children}
    </button>
  );
}
