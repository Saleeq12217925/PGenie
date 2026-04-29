import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { FiHome, FiMapPin } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL || '';

export function PGDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [bookModal, setBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({ checkIn: '', checkOut: '', note: '' });
  const [bookError, setBookError] = useState('');
  const [bookLoading, setBookLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [tenantBooking, setTenantBooking] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    api.get(`/pgs/${id}`)
      .then((r) => setListing(r.data.data))
      .catch(() => setError('Listing not found.'))
      .finally(() => setLoading(false));
    api.get(`/reviews/listing/${id}`)
      .then((r) => setReviews(r.data.data || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'tenant') return;
    api.get('/bookings/mine?limit=100')
      .then((r) => {
        const match = (r.data.data || []).find((b) => b.listing?._id?.toString() === id || b.listing?.toString() === id);
        setTenantBooking(match || null);
      })
      .catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (!user || !tenantBooking) return;
    const alreadyReviewed = reviews.some((rv) => rv.tenant?._id?.toString() === user.id || rv.tenant?.toString() === user.id);
    setHasReviewed(alreadyReviewed);
  }, [reviews, user, tenantBooking]);

  async function submitBooking(e) {
    e.preventDefault();
    setBookLoading(true); setBookError('');
    try {
      const { data } = await api.post('/bookings', { listingId: id, ...bookForm });
      navigate(`/bookings/${data.data._id}`);
    } catch (e) {
      setBookError(e.response?.data?.message || 'Booking failed.');
    } finally {
      setBookLoading(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewLoading(true); setReviewError('');
    try {
      const { data } = await api.post('/reviews', {
        bookingId: tenantBooking._id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviews((prev) => [data.data, ...prev]);
      setHasReviewed(true);
      setReviewModal(false);
    } catch (e) {
      setReviewError(e.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) return <AppShell><PageSpinner /></AppShell>;
  if (error) return <AppShell><div className="p-8 text-[#ef4444] font-medium">{error}</div></AppShell>;

  const l = listing;
  const isOwner = user?.id === l.owner?._id?.toString();
  const isTenant = user?.role === 'tenant';
  const photos = l.photos?.length > 0 ? l.photos : null;
  const canReview = isTenant && tenantBooking && tenantBooking.status === 'completed' && !hasReviewed;

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <div className="text-xs text-[var(--text)] mb-5 flex items-center gap-1.5">
          <Link to="/pgs" className="text-[var(--accent)] hover:underline font-medium">Search</Link>
          <span className="opacity-40">›</span>
          <span className="font-medium truncate max-w-[200px]">{l.title}</span>
        </div>

        {/* Photo carousel */}
        <div className="rounded-xl overflow-hidden h-[280px] md:h-[380px] mb-8 flex items-center justify-center relative text-5xl bg-[var(--surface)] border border-[var(--border)] shadow-sm group">
          {photos ? (
            <>
              <img src={`${API_URL}/uploads/${photos[photoIdx]}`} alt="" className="w-full h-full object-cover" />
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className="h-2 rounded-full border-none cursor-pointer p-0 transition-all duration-200"
                      style={{ width: i === photoIdx ? 20 : 8, background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.5)' }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="text-[var(--text)] opacity-30"><FiHome /></span>
          )}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* Left column */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-h)] mb-3 leading-tight">{l.title}</h1>

            <div className="flex gap-2 flex-wrap mb-3">
              <Badge variant="pending" label={l.roomType} />
              {l.avgRating > 0 && (
                <span className="text-xs text-[var(--text)] flex items-center gap-1 self-center">
                  <span className="text-amber-400">★</span> {l.avgRating} <span className="text-[var(--border)]">·</span> {l.reviewCount} reviews
                </span>
              )}
            </div>

            <p className="text-sm text-[var(--text)] mb-3 flex items-center gap-1.5">
              <FiMapPin size={14} className="text-[var(--accent)]" />
              {l.address}{l.locality ? `, ${l.locality}` : ''}, {l.city}
            </p>

            {l.description ? (
              <div className="ql-snow mb-6"><div className="ql-editor p-0 text-sm text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: l.description }} /></div>
            ) : (
              <p className="text-sm text-[var(--text)] leading-relaxed mb-6">No description provided.</p>
            )}

            {l.lat && l.lng && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[var(--text-h)] mb-3 uppercase tracking-wide">Location Map</h2>
                <div style={{ height: 250, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }}>
                  <MapContainer center={[l.lat, l.lng]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[l.lat, l.lng]} />
                  </MapContainer>
                </div>
              </div>
            )}

            {l.amenities?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[var(--text-h)] mb-3 uppercase tracking-wide">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {l.amenities.map((a) => <Badge key={a} variant="completed" label={a} />)}
                </div>
              </div>
            )}

            {l.rules && (
              <div className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <h2 className="text-sm font-semibold text-[var(--text-h)] mb-2">House Rules</h2>
                <div className="ql-snow"><div className="ql-editor p-0 text-sm text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: l.rules }} /></div>
              </div>
            )}

            <p className="text-xs text-[var(--text)] mb-8">
              Owner: <strong className="text-[var(--text-h)] font-semibold">{l.owner?.name}</strong>
            </p>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[var(--text-h)]">Reviews ({reviews.length})</h2>
                {canReview && (
                  <button
                    onClick={() => setReviewModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--btn-accent)] text-white text-xs font-bold border-none cursor-pointer hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5 hover:shadow-sm transition-all"
                  >
                    Write a Review
                  </button>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--text)]">No reviews yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews.map((rv) => (
                    <div key={rv._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[var(--text-h)] text-sm">{rv.tenant?.name}</span>
                        <span className="text-amber-400 text-sm tracking-tight">{'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}</span>
                        <span className="text-xs text-[var(--text)] ml-auto">{new Date(rv.createdAt).toLocaleDateString()}</span>
                      </div>
                      {rv.comment && <p className="text-sm text-[var(--text)] leading-relaxed">{rv.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — Booking card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 lg:sticky lg:top-6 shadow-sm">
            <div className="text-2xl font-bold text-[var(--accent)] mb-0.5">
              ₹{l.rent?.toLocaleString('en-IN')}
              <span className="text-sm font-normal text-[var(--text)] ml-1">/mo</span>
            </div>
            {l.deposit > 0 && (
              <div className="text-xs text-[var(--text)] mb-4">Deposit: ₹{l.deposit?.toLocaleString('en-IN')}</div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-[var(--text)] mb-5">
              <span className="font-semibold text-[var(--text-h)]">{l.totalBeds - l.occupiedBeds}</span> beds available
              <span className="text-[var(--border)]">·</span>
              <span>{l.occupiedBeds}/{l.totalBeds} occupied</span>
            </div>
            {isTenant && (
              <button
                onClick={() => setBookModal(true)}
                className="w-full py-3.5 rounded-xl border-none bg-[var(--btn-accent)] text-white font-bold text-sm tracking-wide transition-all shadow-sm cursor-pointer hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5 hover:shadow-md"
              >
                Book Now
              </button>
            )}
            {isOwner && user?.id === l.owner?._id?.toString() && (
              <Link
                to={`/owner/listings/${l._id}/edit`}
                className="block w-full py-3.5 rounded-xl border-none bg-[var(--btn-accent)] text-white font-bold text-sm tracking-wide transition-all shadow-sm text-center no-underline hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5 hover:shadow-md"
              >
                Edit Listing
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Book Now Modal */}
      <Modal open={bookModal} onClose={() => { setBookModal(false); setBookError(''); }} title="Book This PG">
        <form onSubmit={submitBooking} className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text)]">
            <strong className="text-[var(--text-h)] font-semibold">{l?.title}</strong> · ₹{l?.rent?.toLocaleString('en-IN')}/mo
          </p>
          <div>
            <label className={labelCls}>Check-in Date *</label>
            <input type="date" required value={bookForm.checkIn} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookForm((f) => ({ ...f, checkIn: e.target.value }))} className={inpCls} />
          </div>
          <div>
            <label className={labelCls}>Check-out Date *</label>
            <input type="date" required value={bookForm.checkOut}
              min={bookForm.checkIn ? (() => { const d = new Date(bookForm.checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookForm((f) => ({ ...f, checkOut: e.target.value }))} className={inpCls} />
            {bookForm.checkIn && bookForm.checkOut && bookForm.checkOut <= bookForm.checkIn && (
              <p className="text-[#ef4444] text-xs mt-1">Check-out must be after check-in.</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Note to Owner</label>
            <textarea value={bookForm.note} onChange={(e) => setBookForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Anything you'd like to tell the owner..."
              className={`${inpCls} min-h-[70px] resize-y`} />
          </div>
          <ErrorBanner message={bookError} />
          <button type="submit" disabled={bookLoading}
            className="py-2.5 bg-[var(--accent)] text-white border-none rounded-xl cursor-pointer font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {bookLoading ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewModal} onClose={() => { setReviewModal(false); setReviewError(''); }} title="Write a Review">
        <form onSubmit={submitReview} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Rating *</label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                  className="text-2xl bg-none border-none cursor-pointer p-0.5 transition-colors duration-100"
                  style={{ color: star <= reviewForm.rating ? '#f59e0b' : 'var(--border)' }}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Comment</label>
            <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience..." maxLength={500}
              className={`${inpCls} min-h-[80px] resize-y`} />
          </div>
          <ErrorBanner message={reviewError} />
          <button type="submit" disabled={reviewLoading}
            className="py-2.5 bg-[var(--accent)] text-white border-none rounded-xl cursor-pointer font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {reviewLoading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}

const labelCls = 'block text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-1.5';
const inpCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-h)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all';
