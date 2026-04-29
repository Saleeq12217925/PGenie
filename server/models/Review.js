import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'PGListing', required: true, index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
}, { timestamps: true });

// After save, recompute listing avgRating & reviewCount
reviewSchema.post('save', async function () {
  const PGListing = mongoose.model('PGListing');
  const agg = await mongoose.model('Review').aggregate([
    { $match: { listing: this.listing } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg.length) {
    await PGListing.findByIdAndUpdate(this.listing, {
      avgRating: Math.round(agg[0].avg * 10) / 10,
      reviewCount: agg[0].count,
    });
  }
});

export const Review = mongoose.model('Review', reviewSchema);
