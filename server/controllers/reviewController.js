import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';

// POST /api/reviews — tenant submits review for a completed booking
export async function createReview(req, res) {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'bookingId and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const booking = await Booking.findOne({ _id: bookingId, tenant: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (!['approved', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'You can only review approved or completed bookings.' });
    }

    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking.' });
    }

    const review = await Review.create({
      listing: booking.listing,
      tenant: req.user.id,
      booking: bookingId,
      rating: Number(rating),
      comment: comment || '',
    });
    await review.populate('tenant', 'name');

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// GET /api/reviews/listing/:listingId — public, paginated
export async function getListingReviews(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find({ listing: req.params.listingId })
        .populate('tenant', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ listing: req.params.listingId }),
    ]);
    res.json({ success: true, data: reviews, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
