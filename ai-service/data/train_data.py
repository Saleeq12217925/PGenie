import numpy as np
import pandas as pd

def generate_rent_data(n=2000, seed=42):
    """Generate synthetic rent prediction training data."""
    rng = np.random.default_rng(seed)

    location_score = rng.integers(1, 6, n)           # 1–5
    amenities_count = rng.integers(0, 9, n)          # 0–8
    room_type_encoded = rng.integers(0, 4, n)        # 0=single, 1=double, 2=triple, 3=dorm
    occupancy_rate = rng.uniform(0.3, 1.0, n)        # 30–100%
    market_trend_index = rng.uniform(0.8, 1.4, n)   # market multiplier

    # Base rent formula with noise
    base = (
        location_score * 1800
        + amenities_count * 500
        - room_type_encoded * 1200   # larger rooms cost less per head
        + occupancy_rate * 3000      # high occupancy → higher demand
        + 4000                        # base floor
    )
    rent = base * market_trend_index + rng.normal(0, 800, n)
    rent = np.clip(rent, 3000, 35000).astype(int)

    df = pd.DataFrame({
        'location_score': location_score,
        'amenities_count': amenities_count,
        'room_type_encoded': room_type_encoded,
        'occupancy_rate': occupancy_rate,
        'market_trend_index': market_trend_index,
        'rent': rent,
    })
    return df


def generate_booking_matrix(n_tenants=50, n_listings=30, n_interactions=200, seed=42):
    """Generate a synthetic user-item booking interaction matrix."""
    rng = np.random.default_rng(seed)
    tenant_ids = [f'tenant_{i}' for i in range(n_tenants)]
    listing_ids = [f'listing_{i}' for i in range(n_listings)]

    interactions = []
    for _ in range(n_interactions):
        tid = rng.choice(tenant_ids)
        lid = rng.choice(listing_ids)
        interactions.append({'tenantId': tid, 'listingId': lid})

    return interactions
