import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'PGListing', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'active', 'completed'],
      default: 'pending',
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentId: { type: String, default: null },
    pendingOrderId: { type: String, default: null },
    note: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ tenant: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ listing: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
