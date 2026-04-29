import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { FileUpload } from '../../components/ui/FileUpload.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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
const AMENITY_OPTIONS = ['wifi', 'ac', 'meals', 'laundry', 'parking', 'gym', 'tv', 'water', 'security'];

const defaultForm = {
  title: '', description: '', address: '', city: '', locality: '',
  roomType: 'single', rent: '', deposit: '', totalBeds: '', rules: '',
  amenities: [], lat: 12.9716, lng: 77.5946,
};

export function ListingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/pgs/${id}`)
      .then((r) => {
        const l = r.data.data;
        setForm({
          title: l.title || '', description: l.description || '',
          address: l.address || '', city: l.city || '', locality: l.locality || '',
          roomType: l.roomType || 'single', rent: l.rent || '', deposit: l.deposit || '',
          totalBeds: l.totalBeds || '', rules: l.rules || '', amenities: l.amenities || [],
          lat: l.lat || 12.9716, lng: l.lng || 77.5946,
        });
        setExistingPhotos(l.photos || []);
      })
      .catch(() => setError('Failed to load listing.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  async function fetchAddress(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const newCity = addr.city || addr.town || addr.village || addr.state_district || form.city;
        const newLocality = addr.suburb || addr.neighbourhood || addr.residential || form.locality;
        const fullAddress = data.display_name || form.address;
        setForm((f) => ({ ...f, city: newCity, locality: newLocality, address: fullAddress, lat, lng }));
      } else {
        set('lat', lat); set('lng', lng);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      set('lat', lat); set('lng', lng);
    }
  }

  async function removeExistingPhoto(filename) {
    setDeletingPhoto((d) => ({ ...d, [filename]: true }));
    try {
      await api.delete(`/pgs/${id}/photos/${filename}`);
      setExistingPhotos((prev) => prev.filter((p) => p !== filename));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete photo.');
    } finally {
      setDeletingPhoto((d) => ({ ...d, [filename]: false }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      let listingId = id;
      if (isEdit) {
        await api.put(`/pgs/${id}`, form);
      } else {
        const { data } = await api.post('/pgs', form);
        listingId = data.data._id;
      }
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach((f) => fd.append('photos', f));
        await api.post(`/pgs/${listingId}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/owner/listings');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppShell><PageSpinner /></AppShell>;

  return (
    <AppShell>
      <main style={{ padding: '32px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.15 }}>{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 32px', fontWeight: 500, lineHeight: 1.6 }}>
          {isEdit ? 'Update your property details to ensure they remain accurate and appealing.' : 'Provide comprehensive details to make your property stand out to potential tenants.'}
        </p>
        <ErrorBanner message={error} />
        <form style={{ display: 'flex', flexDirection: 'column', gap: 32 }} onSubmit={handleSubmit}>
          
          <Section title="Basic Information" description="Provide a clear title and description to make your property stand out.">
            <Field label="Title *"><input style={inp} value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={120} placeholder="Koramangala Premium PG" /></Field>
            <Field label="Description">
              <textarea style={{ ...inp, minHeight: 160, resize: 'vertical', lineHeight: 1.6 }} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} placeholder="Describe your property, surroundings, and what makes it special..." />
            </Field>
          </Section>

          <Section title="Location details" description="Pinpoint your property on the map so tenants can find it easily.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="City *"><input style={inp} value={form.city} onChange={(e) => set('city', e.target.value)} required placeholder="Enter city" /></Field>
              <Field label="Locality"><input style={inp} value={form.locality} onChange={(e) => set('locality', e.target.value)} placeholder="Koramangala" /></Field>
            </div>
            <Field label="Full Address *"><input style={inp} value={form.address} onChange={(e) => set('address', e.target.value)} required /></Field>
            
            <Field label="Pin on Map">
              <div style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }}>
                <MapContainer center={[form.lat, form.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <LocationMarker 
                    position={{ lat: form.lat, lng: form.lng }} 
                    setPosition={(pos) => fetchAddress(pos.lat, pos.lng)} 
                  />
                </MapContainer>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '4px 0 0 4px' }}>Click on the map to set the exact location of your property.</p>
            </Field>
          </Section>

          <Section title="Room Details & Pricing" description="Set your rates and specify the type of accommodation available.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Room Type *">
                <select style={inp} value={form.roomType} onChange={(e) => set('roomType', e.target.value)}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="dormitory">Dormitory</option>
                </select>
              </Field>
              <Field label="Rent (₹/mo) *"><input style={inp} type="number" min="1" value={form.rent} onChange={(e) => set('rent', e.target.value)} required /></Field>
              <Field label="Deposit (₹)"><input style={inp} type="number" min="0" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} /></Field>
            </div>
            <Field label="Total Beds *"><input style={inp} type="number" min="1" max="100" value={form.totalBeds} onChange={(e) => set('totalBeds', e.target.value)} required /></Field>
          </Section>

          <Section title="Amenities & Rules" description="List the facilities provided and any guidelines tenants must follow.">
            <Field label="House Rules">
              <textarea style={{ ...inp, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }} value={form.rules} onChange={(e) => set('rules', e.target.value)} maxLength={500} placeholder="No smoking, no pets, guests must leave by 10pm..." />
            </Field>

            <Field label="Amenities">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AMENITY_OPTIONS.map((a) => (
                  <label
                    key={a}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '8px 16px', borderRadius: 12, fontSize: '0.875rem', fontWeight: 600,
                      transition: 'all 0.2s ease', border: '1px solid',
                      ...(form.amenities.includes(a)
                        ? { background: 'var(--btn-accent)', borderColor: 'var(--btn-accent)', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }
                        : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }
                      )
                    }}
                    onMouseEnter={(e) => {
                      if (!form.amenities.includes(a)) { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }
                      else { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }
                    }}
                    onMouseLeave={(e) => {
                      if (!form.amenities.includes(a)) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface)'; }
                      else { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; }
                    }}
                  >
                    <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} style={{ display: 'none' }} />
                    {a}
                  </label>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Media" description="Upload high-quality photos to attract more tenants to your property.">
            <Field label="Photos (up to 5)">
              {isEdit && existingPhotos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text)', marginBottom: 8 }}>Current photos — click × to remove</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {existingPhotos.map((filename) => (
                      <div key={filename} style={{ position: 'relative' }}>
                        <img
                          src={`${API_URL}/uploads/${filename}`}
                          alt=""
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', opacity: deletingPhoto[filename] ? 0.4 : 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(filename)}
                          disabled={deletingPhoto[filename]}
                          style={{
                            position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                            borderRadius: '50%', background: '#ef4444', color: '#fff',
                            border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FileUpload onFiles={setPhotos} maxFiles={5 - existingPhotos.length} />
            </Field>
          </Section>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              type="button" onClick={() => navigate('/owner/listings')}
              style={{
                flex: 1, padding: '16px', borderRadius: 16, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-h)', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              style={{
                flex: 2, padding: '16px', borderRadius: 16, border: 'none',
                background: 'var(--btn-accent)', color: '#fff', fontWeight: 700,
                letterSpacing: '0.02em', transition: 'all 0.3s ease', fontSize: '0.95rem',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(16,185,129,0.25)'
              }}
              onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.35)'; e.currentTarget.style.background = 'var(--btn-accent-hover)'; } }}
              onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; e.currentTarget.style.background = 'var(--btn-accent)'; } }}
            >
              {saving ? 'Saving...' : (isEdit ? 'Update Listing' : 'Create Listing')}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-h)', marginLeft: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <div style={{
      padding: '32px 28px', borderRadius: 20, background: 'var(--surface)',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 24,
      boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
    }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{title}</h2>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

const inp = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-h)', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' };
