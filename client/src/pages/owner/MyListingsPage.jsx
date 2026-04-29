import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiHome } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || '';

export function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    api.get('/pgs/owner/mine')
      .then((r) => setListings(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggleActive(id, current) {
    try {
      await api.put(`/pgs/${id}`, { isActive: !current });
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, isActive: !current } : l));
    } catch (e) { alert(e.response?.data?.message || 'Error.'); }
  }

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>My Listings</h1>
            <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>Manage, edit, and track all your active property listings.</p>
          </div>
          <Link
            to="/owner/listings/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '12px 24px', borderRadius: 12,
              background: 'var(--btn-accent)', color: '#fff',
              fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--btn-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--btn-accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = ''; }}
          >
            + New Listing
          </Link>
        </div>
        <ErrorBanner message={error} />
        {loading ? <PageSpinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {listings.length === 0 && (
              <div style={{
                padding: '64px 24px', borderRadius: 20,
                background: 'var(--surface)', border: '1px solid var(--border)',
                textAlign: 'center', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 16, gridColumn: '1 / -1',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  <FiHome size={24} />
                </div>
                <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>No listings yet. Create your first one!</span>
              </div>
            )}
            {listings.map((l) => (
              <div
                key={l._id}
                style={{
                  borderRadius: 20, background: 'var(--surface)',
                  border: '1px solid var(--border)', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s ease', position: 'relative',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Photo */}
                <div style={{ height: 140, background: 'var(--bg)', borderBottom: '1px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
                  {l.photos?.[0] ? (
                    <img src={`${API_URL}/uploads/${l.photos[0]}`} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FiHome size={32} style={{ opacity: 0.3 }} />
                  )}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <Badge variant={l.isActive ? 'approved' : 'cancelled'} label={l.isActive ? 'active' : 'inactive'} />
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {l.locality ? `${l.locality}, ` : ''}{l.city}
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <Badge variant="pending" label={l.roomType} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.125rem' }}>₹{l.rent?.toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text)' }}>/mo</span></span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>{l.occupiedBeds}/{l.totalBeds} beds</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <Link
                      to={`/owner/listings/${l._id}/edit`}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center',
                        fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text-h)',
                        textDecoration: 'none', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleActive(l._id, l.isActive)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center',
                        fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text-h)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-h)'; }}
                    >
                      {l.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
