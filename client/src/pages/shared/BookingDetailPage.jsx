import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { FiMessageSquare, FiCheck } from 'react-icons/fi';

export function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((r) => setBooking(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppShell><PageSpinner /></AppShell>;
  if (error) return <AppShell><div className="p-8 text-[#ef4444] font-medium">{error}</div></AppShell>;

  const b = booking;
  const isTenant = user?.role === 'tenant';
  const isAdmin = user?.role === 'admin';
  const isApproved = b.status === 'approved';
  const canPay = isTenant && isApproved && b.paymentStatus === 'unpaid';
  const canChat = ['approved', 'active', 'completed'].includes(b.status);

  const STEPS = [
    { key: 'pending',   label: 'Request Sent' },
    { key: 'approved',  label: 'Approved'     },
    { key: 'paid',      label: 'Payment Done' },
    { key: 'active',    label: 'Stay Active'  },
    { key: 'completed', label: 'Completed'    },
  ];
  const currentStep = b.paymentStatus === 'paid' && b.status === 'approved' ? 'paid' : b.status;
  const stepIdx = STEPS.findIndex((s) => s.key === currentStep);

  const backTo = isAdmin ? '/admin/bookings' : isTenant ? '/bookings' : '/owner/requests';

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <Link to={backTo} className="text-sm text-[var(--accent)] font-medium hover:underline flex items-center gap-1 mb-5">
          ← Back
        </Link>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: 0 }}>Booking Details</h1>
            <Badge variant={b.status} />
            <Badge variant={b.paymentStatus} />
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>Full booking summary, payment status, and conversation history.</p>
        </div>

        {/* Timeline */}
        {!['rejected', 'cancelled'].includes(b.status) && (
          <div className="flex items-center overflow-x-auto pb-2 mb-8 gap-0">
            {STEPS.map((step, i) => {
              const done = i <= stepIdx;
              const active = i === stepIdx;
              return (
                <div key={step.key} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-[var(--accent)] text-white' : 'bg-[var(--border)] text-[var(--text)]'}`}>
                      {done ? <FiCheck size={14} /> : i + 1}
                    </div>
                    <span className={`text-[0.62rem] text-center leading-tight ${active ? 'font-semibold' : 'font-normal'} ${done ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < stepIdx ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <InfoRow label="Listing"      value={b.listing?.title} />
          <InfoRow label="City"         value={b.listing?.city} />
          <InfoRow label="Room Type"    value={b.listing?.roomType} />
          <InfoRow label="Rent/mo"      value={`₹${b.listing?.rent?.toLocaleString('en-IN')}`} />
          <InfoRow label="Check-in"     value={new Date(b.checkIn).toLocaleDateString()} />
          <InfoRow label="Check-out"    value={new Date(b.checkOut).toLocaleDateString()} />
          <InfoRow label="Total Amount" value={`₹${b.totalAmount?.toLocaleString('en-IN')}`} />
          {b.paymentId && <InfoRow label="Payment ID" value={b.paymentId} mono />}
          <InfoRow label="Tenant"       value={b.tenant?.name} />
          <InfoRow label="Owner"        value={b.owner?.name} />
        </div>

        {b.note && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 shadow-sm">
            <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text)] block mb-1.5">Note from tenant</span>
            <p className="text-sm text-[var(--text-h)]">{b.note}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {canPay && (
            <Link to={`/bookings/${b._id}/pay`} className="px-6 py-2.5 bg-[var(--btn-accent)] text-white rounded-xl font-bold no-underline shadow-sm hover:bg-[var(--btn-accent-hover)] hover:shadow-md hover:-translate-y-0.5 transition-all">
              Pay Now
            </Link>
          )}
          {canChat && (
            <Link to={`/chat/${b._id}`} className="px-6 py-2.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--text-h)] rounded-xl font-semibold no-underline flex items-center gap-2 hover:bg-[var(--bg)] hover:border-[var(--accent-border)] transition-all shadow-sm">
              <FiMessageSquare /> Chat
            </Link>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] mb-1">{label}</div>
      <div className={`text-sm font-semibold text-[var(--text-h)] ${mono ? 'font-mono tracking-tight text-xs' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}
