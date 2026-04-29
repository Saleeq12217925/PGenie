import { useEffect, useState } from 'react';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';

const ACTIONS = ['', 'REGISTER', 'LOGIN_ATTEMPT', 'MFA_VERIFY', 'TOKEN_REFRESH', 'LOGOUT', 'LISTING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'PAYMENT_CONFIRMED', 'ROLE_CHANGED'];

export function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 30;

  function load(a, p) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: LIMIT, page: p });
    if (a) params.set('action', a);
    api.get(`/admin/audit-logs?${params}`)
      .then((r) => { setLogs(r.data.data); setTotal(r.data.pagination?.total || 0); })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(action, page); }, [action, page]);

  const columns = [
    { key: 'action', label: 'Action', render: (l) => (
      <span className="font-mono text-[0.8rem] text-[var(--accent)] font-semibold">{l.action}</span>
    )},
    { key: 'user', label: 'User', render: (l) => l.userId?.email || 'anonymous' },
    { key: 'ip', label: 'IP' },
    { key: 'meta', label: 'Details', render: (l) => (
      <span className="text-xs text-[var(--text)] font-mono">
        {l.meta ? JSON.stringify(l.meta).slice(0, 60) : '—'}
      </span>
    )},
    { key: 'createdAt', label: 'Time', render: (l) => new Date(l.createdAt).toLocaleString() },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>Audit Log</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 24px', fontWeight: 500 }}>{total} total entries (auto-deleted after 90 days)</p>

        <div className="flex gap-2 flex-wrap mb-6">
          {ACTIONS.map((a) => (
            <button key={a || 'all'} onClick={() => { setAction(a); setPage(1); }} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow hover:-translate-y-0.5 ${action === a ? 'bg-[var(--btn-accent)] border-[var(--btn-accent)] text-white hover:bg-[var(--btn-accent-hover)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-bg)] hover:border-[var(--accent-border)] hover:text-[var(--accent)]'}`}>
              {a || 'All'}
            </button>
          ))}
        </div>

        <ErrorBanner message={error} />
        {loading ? <PageSpinner /> : (
          <>
            <div style={{ borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)', marginBottom: 24 }}>
              <DataTable columns={columns} rows={logs} emptyText="No log entries found." />
            </div>
            {totalPages > 1 && (
              <div className="flex gap-2 justify-center items-center mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm cursor-pointer hover:bg-[var(--bg)] hover:text-[var(--text-h)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Prev</button>
                <span className="px-4 py-2 text-xs text-[var(--text)] flex items-center">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm cursor-pointer hover:bg-[var(--bg)] hover:text-[var(--text-h)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next →</button>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

