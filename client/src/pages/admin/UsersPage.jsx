import { useEffect, useState } from 'react';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiCheck } from 'react-icons/fi';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});

  useEffect(() => {
    api.get('/admin/users?limit=100')
      .then((r) => setUsers(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(userId, role) {
    setSaving((s) => ({ ...s, [userId]: true }));
    try {
      const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: data.data.role } : u));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to change role.');
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  }

  async function toggleActive(userId) {
    setSaving((s) => ({ ...s, [`active_${userId}`]: true }));
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: data.data.isActive } : u));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to toggle user.');
    } finally {
      setSaving((s) => ({ ...s, [`active_${userId}`]: false }));
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (u) => <span style={{ fontWeight: 500, color: 'var(--text-h)' }}>{u.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (u) => <Badge variant={u.role} /> },
    { key: 'status', label: 'Status', render: (u) => (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: u.isActive !== false ? '#16a34a' : '#ef4444' }}>
        {u.isActive !== false ? 'Active' : 'Deactivated'}
      </span>
    )},
    { key: 'isVerified', label: 'Verified', render: (u) => u.isVerified ? <FiCheck size={14} style={{ color: 'var(--accent)' }} /> : '—' },
    { key: 'createdAt', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'roleAction', label: 'Change Role',
      render: (u) => (
        <select
          value={u.role}
          disabled={saving[u._id]}
          onChange={(e) => changeRole(u._id, e.target.value)}
          className="px-2 py-1 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] cursor-pointer outline-none focus:border-[var(--accent-border)] transition-all"
        >
          <option value="tenant">tenant</option>
          <option value="owner">owner</option>
          <option value="admin">admin</option>
        </select>
      ),
    },
    {
      key: 'activeAction', label: 'Deactivate',
      render: (u) => (
        <button
          disabled={saving[`active_${u._id}`]}
          onClick={() => toggleActive(u._id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm hover:shadow hover:-translate-y-0.5 ${u.isActive !== false ? 'bg-[#ef4444] hover:bg-[#dc2626]' : 'bg-[var(--btn-accent)] hover:bg-[var(--btn-accent-hover)]'}`}
          style={{ opacity: saving[`active_${u._id}`] ? 0.6 : 1 }}
        >
          {u.isActive !== false ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>Users</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500 }}>Manage all registered users and their roles.</p>
        <ErrorBanner message={error} />
        {loading ? <PageSpinner /> : (
          <div style={{ borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
            <DataTable columns={columns} rows={users} emptyText="No users found." />
          </div>
        )}
      </main>
    </AppShell>
  );
}
