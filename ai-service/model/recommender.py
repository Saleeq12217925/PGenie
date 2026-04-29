import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize


AMENITY_VOCAB = ['wifi', 'ac', 'meals', 'laundry', 'parking', 'gym', 'tv', 'water']
CITY_MAP = {'bangalore': 0, 'mumbai': 1, 'pune': 2, 'delhi': 3, 'hyderabad': 4, 'chennai': 5}
ROOM_MAP = {'single': 0, 'double': 1, 'triple': 2, 'dormitory': 3}


def _listing_vector(listing: dict, max_rent=35000):
    city_enc = CITY_MAP.get(listing.get('city', '').lower(), 6) / 6
    room_enc = ROOM_MAP.get(listing.get('roomType', 'single'), 0) / 3
    rent_norm = min(listing.get('rent', 0) / max_rent, 1.0)
    rating_norm = listing.get('avgRating', 0) / 5.0
    amenity_vec = [1 if a in listing.get('amenities', []) else 0 for a in AMENITY_VOCAB]
    return np.array([city_enc, room_enc, rent_norm, rating_norm] + amenity_vec, dtype=float)


def _pref_vector(preferences: dict, max_rent=35000):
    city_enc = CITY_MAP.get(preferences.get('city', '').lower(), 6) / 6
    room_enc = ROOM_MAP.get(preferences.get('roomType', 'single'), 0) / 3
    rent_norm = min((preferences.get('maxRent') or max_rent) / max_rent, 1.0)
    amenity_vec = [0] * len(AMENITY_VOCAB)
    return np.array([city_enc, room_enc, rent_norm, 0.5] + amenity_vec, dtype=float)


class HybridRecommender:
    def recommend(self, payload: dict, top_n=10) -> list:
        listings = payload.get('allListings', [])
        prefs = payload.get('preferences', {})
        booked_ids = set(payload.get('bookedListingIds', []))
        tenant_id = payload.get('tenantId', '')
        booking_matrix = payload.get('bookingMatrix', [])

        if not listings:
            return []

        ids = [l['id'] for l in listings]
        max_rent = max((l.get('rent', 0) for l in listings), default=35000)

        # ── Content-based similarity ────────────────────────
        vectors = np.array([_listing_vector(l, max_rent) for l in listings])
        pref_vec = _pref_vector(prefs, max_rent).reshape(1, -1)
        # Normalize to unit vectors
        vectors_norm = normalize(vectors + 1e-8)
        pref_norm = normalize(pref_vec + 1e-8)
        content_scores = cosine_similarity(pref_norm, vectors_norm)[0]

        # ── Collaborative filtering (user-item SVD) ─────────
        all_tenants = list({b['tenantId'] for b in booking_matrix})
        if tenant_id not in all_tenants:
            all_tenants.append(tenant_id)
        tenant_idx = {t: i for i, t in enumerate(all_tenants)}
        listing_idx = {l: i for i, l in enumerate(ids)}

        R = np.zeros((len(all_tenants), len(ids)))
        for b in booking_matrix:
            ti = tenant_idx.get(b['tenantId'])
            li = listing_idx.get(b['listingId'])
            if ti is not None and li is not None:
                R[ti, li] += 1

        # Truncated SVD via numpy
        n_components = min(10, R.shape[0], R.shape[1])
        collab_scores = np.zeros(len(ids))
        if n_components > 0 and R.any():
            try:
                U, s, Vt = np.linalg.svd(R, full_matrices=False)
                U_trunc = U[:, :n_components]
                s_trunc = np.diag(s[:n_components])
                Vt_trunc = Vt[:n_components, :]
                R_approx = U_trunc @ s_trunc @ Vt_trunc
                ti = tenant_idx.get(tenant_id, 0)
                collab_row = R_approx[ti]
                # Normalize collab scores to [0,1]
                if collab_row.max() > 0:
                    collab_scores = collab_row / collab_row.max()
            except Exception:
                pass

        # ── Hybrid merge ────────────────────────────────────
        final_scores = 0.6 * content_scores + 0.4 * collab_scores

        # Filter already-booked listings
        results = [
            {'listingId': ids[i], 'score': round(float(final_scores[i]), 4)}
            for i in range(len(ids))
            if ids[i] not in booked_ids
        ]
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_n]
