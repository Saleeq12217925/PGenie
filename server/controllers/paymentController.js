import { randomUUID } from 'crypto';
import { Booking } from '../models/Booking.js';
import { PGListing } from '../models/PGListing.js';

// POST /api/payments/initiate — generate a simulated order
export async function initiatePayment(req, res) {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, tenant: req.user.id })
      .populate('listing', 'title city rent');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Booking must be approved before payment.' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid.' });
    }

    // Simulate order creation (like Razorpay order object)
    const orderId = `order_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const order = {
      orderId,
      amount: booking.totalAmount,
      currency: 'INR',
      bookingId: booking._id,
      listing: booking.listing,
      createdAt: new Date().toISOString(),
    };

    // Store pending order ID for payment idempotency verification
    await Booking.findByIdAndUpdate(bookingId, { pendingOrderId: orderId });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/payments/confirm — mark booking as paid
export async function confirmPayment(req, res) {
  try {
    const { bookingId, orderId } = req.body;
    if (!bookingId || !orderId) {
      return res.status(400).json({ success: false, message: 'bookingId and orderId are required.' });
    }

    // Atomic update prevents double-charge: only succeeds once
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        tenant: req.user.id,
        status: 'approved',
        paymentStatus: { $ne: 'paid' },
        pendingOrderId: orderId, // Verify order was initiated
      },
      {
        $set: {
          paymentStatus: 'paid',
          status: 'active',
          paymentId: orderId,
        },
      },
      { new: true }
    ).populate('listing', 'isActive title city rent');

    if (!booking) {
      return res.status(400).json({ success: false, message: 'Payment already processed or invalid order.' });
    }

    // Verify listing is still active (prevent payment for deleted listings)
    if (!booking.listing?.isActive) {
      // Roll back the payment
      await Booking.findByIdAndUpdate(bookingId, {
        $set: { paymentStatus: 'unpaid', status: 'approved', paymentId: null },
      });
      return res.status(400).json({ success: false, message: 'Listing is no longer available. Payment rolled back.' });
    }

    res.json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentId: booking.paymentId,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        receipt: {
          receiptId: `rcpt_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
          amount: booking.totalAmount,
          currency: 'INR',
          paidAt: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
