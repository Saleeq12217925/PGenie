import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';

const STATUSES = ['', 'pending', 'approved', 'rejected', 'cancelled', 'completed'];

export function BookingsAdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  function load(s) {
    setLoading(true);
    setError('');
    api.get(`/admin/bookings?limit=50${s ? `&status=${s}` : ''}`)
      .then((r) => setBookings(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(status); }, [status]);

  const columns = [
    { key: 'tenant', label: 'Tenant', render: (b) => b.tenant?.name || '—' },
    { key: 'owner', label: 'Owner', render: (b) => b.owner?.name || '—' },
    { key: 'listing', label: 'Listing', render: (b) => (
      <Link to={`/pgs/${b.listing?._id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
        {b.listing?.title || '—'}
      </Link>
    )},
    { key: 'city', label: 'City', render: (b) => b.listing?.city || '—' },
    { key: 'status', label: 'Status', render: (b) => <Badge variant={b.status} /> },
    { key: 'paymentStatus', label: 'Payment', render: (b) => <Badge variant={b.paymentStatus} /> },
    { key: 'totalAmount', label: 'Amount', render: (b) => `₹${b.totalAmount?.toLocaleString('en-IN')}` },
    { key: 'createdAt', label: 'Date', render: (b) => new Date(b.createdAt).toLocaleDateString() },
  ];

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>All Bookings</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500, lineHeight: 1.6 }}>View and monitor every booking across all listings on the platform.</p>
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUSES.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all shadow-sm ${status === s ? 'bg-[var(--btn-accent)] border-[var(--btn-accent)] text-white hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] hover:-translate-y-0.5'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <ErrorBanner message={error} />
        {loading ? <PageSpinner /> : (
          <div style={{ borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
            <DataTable columns={columns} rows={bookings} emptyText="No bookings found." />
          </div>
        )}
      </main>
    </AppShell>
  );
}
