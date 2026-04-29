import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FiCheckCircle, FiShield } from 'react-icons/fi';

export function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [cardForm, setCardForm] = useState({ number: '4242 4242 4242 4242', name: '', expiry: '12/26', cvv: '123' });

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((r) => setBooking(r.data.data))
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function initiateOrder() {
    setProcessing(true); setError('');
    try {
      const { data } = await api.post('/payments/initiate', { bookingId: id });
      setOrder(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setProcessing(false);
    }
  }

  async function confirmPayment() {
    setProcessing(true); setError('');
    try {
      const { data } = await api.post('/payments/confirm', { bookingId: id, orderId: order.orderId });
      setSuccess(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Payment failed.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <AppShell><PageSpinner /></AppShell>;
  if (error && !booking) return <AppShell><div className="p-8 text-[#ef4444] font-medium">{error}</div></AppShell>;

  const b = booking;

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Payment</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 28px', fontWeight: 500, lineHeight: 1.6 }}>Complete your booking payment securely below.</p>

        {/* Booking summary */}
        {b && !success && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-6 shadow-sm">
            <div className="font-semibold text-[var(--text-h)] mb-1">{b.listing?.title}</div>
            <div className="text-sm text-[var(--text)] mb-3">
              {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
            </div>
            <div className="text-2xl font-bold text-[var(--accent)]">
              ₹{b.totalAmount?.toLocaleString('en-IN')}
            </div>
          </div>
        )}

        <ErrorBanner message={error} />

        {/* Success screen */}
        {success ? (
          <div className="text-center py-10 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col items-center gap-3">
            <div className="text-5xl" style={{ color: 'var(--accent)' }}><FiCheckCircle size={48} /></div>
            <h2 className="text-xl font-bold text-[var(--text-h)]">Payment Successful!</h2>
            <p className="text-sm text-[var(--text)]">
              Receipt: <code className="font-mono text-xs bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded">{success.receipt?.receiptId}</code>
            </p>
            <p className="text-sm text-[var(--text)]">
              Amount paid: <strong className="text-[var(--text-h)]">₹{success.receipt?.amount?.toLocaleString('en-IN')}</strong>
            </p>
            <button
              onClick={() => navigate(`/bookings/${id}`)}
              className="mt-2 px-7 py-2.5 bg-[var(--btn-accent)] text-white border-none rounded-xl cursor-pointer font-bold shadow-sm hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              View Booking
            </button>
          </div>
        ) : !order ? (
          /* Step 1: Card form */
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-h)] mb-0.5">
                Card Details{' '}
                <span className="text-xs text-[var(--text)] font-normal">(sandbox — any values work)</span>
              </h2>
            </div>
            <Field label="Card Number">
              <input value={cardForm.number} onChange={(e) => setCardForm((f) => ({ ...f, number: e.target.value }))} className={inpCls} maxLength={19} />
            </Field>
            <Field label="Cardholder Name">
              <input value={cardForm.name} onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name on card" className={inpCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry">
                <input value={cardForm.expiry} onChange={(e) => setCardForm((f) => ({ ...f, expiry: e.target.value }))} placeholder="MM/YY" className={inpCls} maxLength={5} />
              </Field>
              <Field label="CVV">
                <input type="password" value={cardForm.cvv} onChange={(e) => setCardForm((f) => ({ ...f, cvv: e.target.value }))} className={inpCls} maxLength={4} />
              </Field>
            </div>
            <button
              onClick={initiateOrder}
              disabled={processing}
              className="mt-2 w-full py-3.5 bg-[var(--btn-accent)] text-white border-none rounded-xl cursor-pointer font-bold shadow-sm hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : `Pay ₹${b?.totalAmount?.toLocaleString('en-IN')}`}
            </button>
          </div>
        ) : (
          /* Step 2: Confirm */
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-4xl" style={{ color: 'var(--accent)' }}><FiShield size={40} /></div>
            <h2 className="text-lg font-bold text-[var(--text-h)]">Confirm Payment</h2>
            <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-left">
              <div className="text-xs text-[var(--text)] mb-1 font-medium">Order ID</div>
              <div className="font-mono text-sm text-[var(--text-h)] break-all">{order.orderId}</div>
            </div>
            <p className="text-sm text-[var(--text)]">
              Amount: <strong className="text-[var(--text-h)]">₹{order.amount?.toLocaleString('en-IN')}</strong>
            </p>
            <button
              onClick={confirmPayment}
              disabled={processing}
              className="w-full py-3.5 bg-[#16a34a] text-white border-none rounded-xl cursor-pointer font-bold text-base shadow-sm hover:bg-[#15803d] hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? 'Confirming...' : 'Confirm & Complete Payment'}
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inpCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-h)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] hover:border-[var(--text)] transition-all';
