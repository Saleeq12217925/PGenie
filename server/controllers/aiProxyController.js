import axios from 'axios';
import { PGListing } from '../models/PGListing.js';
import { Booking } from '../models/Booking.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const CITY_SCORES = {
  mumbai: 5, bangalore: 4, pune: 3, delhi: 4, hyderabad: 3, chennai: 3,
};
const MARKET_TREND = { mumbai: 1.3, bangalore: 1.2, pune: 1.1, delhi: 1.25, default: 1.0 };
const ROOM_TYPE_ENC = { single: 0, double: 1, triple: 2, dormitory: 3 };

// POST /api/ai/predict-rent — owner requests rent suggestion
export async function predictRent(req, res) {
  try {
    const { city, amenities = [], roomType, occupancyRate = 0.7, listingId } = req.body;

    let effectiveOccupancy = occupancyRate;
    if (listingId) {
      const listing = await PGListing.findById(listingId);
      if (listing) effectiveOccupancy = listing.occupancyRate ?? occupancyRate;
    }

    const cityKey = (city || '').toLowerCase().trim();
    const payload = {
      location_score: CITY_SCORES[cityKey] || 2,
      amenities_count: Array.isArray(amenities) ? amenities.length : 0,
      room_type_encoded: ROOM_TYPE_ENC[roomType] ?? 1,
      occupancy_rate: Math.min(1, Math.max(0, Number(effectiveOccupancy))),
      market_trend_index: MARKET_TREND[cityKey] || MARKET_TREND.default,
    };

    const { data } = await axios.post(`${AI_SERVICE_URL}/predict-rent`, payload, { timeout: 10000 });
    res.json({ success: true, predictedRent: data.predicted_rent });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ success: false, message: 'AI service is not running.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/ai/recommendations — tenant gets personalized PG recommendations
export async function getRecommendations(req, res) {
  try {
    const { city, roomType, maxRent, limit = 6 } = req.query;
    const tenantId = req.user.id;

    // Fetch all active listings
    const allListings = await PGListing.find({ isActive: true }).lean();

    // Fetch tenant's previous booking history
    const tenantBookings = await Booking.find({ tenant: tenantId }, 'listing').lean();
    const bookedListingIds = tenantBookings.map((b) => b.listing.toString());

    // Build global booking matrix (sample, capped for performance)
    const recentBookings = await Booking.find({}, 'tenant listing').limit(500).lean();
    const bookingMatrix = recentBookings.map((b) => ({
      tenantId: b.tenant.toString(),
      listingId: b.listing.toString(),
    }));

    const payload = {
      tenantId,
      preferences: {
        city: city || '',
        roomType: roomType || '',
        maxRent: maxRent ? Number(maxRent) : null,
      },
      bookedListingIds,
      allListings: allListings.map((l) => ({
        id: l._id.toString(),
        city: l.city,
        roomType: l.roomType,
        amenities: l.amenities,
        rent: l.rent,
        avgRating: l.avgRating,
      })),
      bookingMatrix,
    };

    const { data } = await axios.post(`${AI_SERVICE_URL}/recommend`, payload, { timeout: 15000 });

    // Merge recommendation scores with full listing data
    const listingMap = Object.fromEntries(allListings.map((l) => [l._id.toString(), l]));
    const recommendations = (data.recommendations || [])
      .slice(0, Number(limit))
      .map((r) => ({ ...listingMap[r.listingId], matchScore: r.score }))
      .filter(Boolean);

    res.json({ success: true, data: recommendations });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ success: false, message: 'AI service is not running.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}
