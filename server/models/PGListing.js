import mongoose from 'mongoose';

const pgListingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '' },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, lowercase: true },
    locality: { type: String, trim: true, default: '' },
    roomType: {
      type: String,
      enum: ['single', 'double', 'triple', 'dormitory'],
      required: true,
    },
    rent: { type: Number, required: true, min: 0 },
    deposit: { type: Number, default: 0, min: 0 },
    amenities: [{ type: String }],
    photos: [{ type: String }],
    lat: { type: Number },
    lng: { type: Number },
    totalBeds: { type: Number, required: true, min: 1 },
    occupiedBeds: { type: Number, default: 0, min: 0 },
    rules: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pgListingSchema.virtual('occupancyRate').get(function () {
  if (this.totalBeds === 0) return 0;
  return parseFloat((this.occupiedBeds / this.totalBeds).toFixed(2));
});

pgListingSchema.set('toJSON', { virtuals: true });
pgListingSchema.set('toObject', { virtuals: true });

pgListingSchema.index({ city: 1, isActive: 1 });
pgListingSchema.index({ owner: 1 });

export const PGListing = mongoose.model('PGListing', pgListingSchema);
