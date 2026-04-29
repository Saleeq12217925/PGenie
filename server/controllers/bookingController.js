import { Booking } from '../models/Booking.js';
import { PGListing } from '../models/PGListing.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { sendMail } from '../utils/mailer.js';

// POST /api/bookings — tenant creates booking request
export async function createBooking(req, res) {
  try {
    const { listingId, checkIn, checkOut, note } = req.body;
    const listing = await PGListing.findOne({ _id: listingId, isActive: true });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ success: false, message: 'Check-out must be after check-in.' });
    }
    if (checkInDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Check-in date must be in the future.' });
    }

    const existingBooking = await Booking.findOne({
      tenant: req.user.id,
      listing: listingId,
      status: { $in: ['pending', 'approved', 'active'] },
    });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: 'You already have an active booking for this listing.' });
    }

    if (listing.occupiedBeds >= listing.totalBeds) {
      return res.status(400).json({ success: false, message: 'No beds available for this listing.' });
    }

    // Calculate months (round up to nearest month)
    const months = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24 * 30)));
    const totalAmount = listing.rent * months;

    const booking = await Booking.create({
      tenant: req.user.id,
      listing: listing._id,
      owner: listing.owner,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalAmount,
      note: note || '',
    });

    await booking.populate([
      { path: 'listing', select: 'title city rent roomType' },
      { path: 'owner', select: 'name email' },
    ]);

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// GET /api/bookings/mine — tenant's bookings (paginated)
export async function getMyBookings(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
    const safePage = Math.max(1, Number(page));
    const filter = { tenant: req.user.id };
    if (status) filter.status = status;
    const skip = (safePage - 1) * safeLimit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('listing', 'title city roomType rent photos')
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Booking.countDocuments(filter),
    ]);
    res.json({ success: true, data: bookings, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bookings/requests — owner's incoming requests (paginated)
export async function getBookingRequests(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
    const safePage = Math.max(1, Number(page));
    const filter = { owner: req.user.id };
    if (status) filter.status = status;
    const skip = (safePage - 1) * safeLimit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('listing', 'title city roomType')
        .populate('tenant', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Booking.countDocuments(filter),
    ]);
    res.json({ success: true, data: bookings, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bookings/:id — single booking (owner or tenant)
export async function getBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'title city roomType rent address photos amenities')
      .populate('tenant', 'name email')
      .populate('owner', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isOwner = booking.owner._id.toString() === req.user.id;
    const isTenant = booking.tenant._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isTenant && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/bookings/:id/approve — owner approves
export async function approveBooking(req, res) {
  try {
    // Atomic status transition (prevents double-approve race condition)
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id, status: 'pending' },
      { $set: { status: 'approved' } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found or not pending.' });

    // Atomic capacity-guarded increment (prevents overbooking)
    const listing = await PGListing.findOneAndUpdate(
      { _id: booking.listing, $expr: { $lt: ['$occupiedBeds', '$totalBeds'] } },
      { $inc: { occupiedBeds: 1 } },
      { new: true }
    );
    if (!listing) {
      // Listing full — roll back approval
      await Booking.findByIdAndUpdate(booking._id, { $set: { status: 'pending' } });
      return res.status(400).json({ success: false, message: 'No beds available. Approval rolled back.' });
    }

    const tenant = await User.findById(booking.tenant).select('name email');
    const listingTitle = listing.toObject ? listing.toObject().title : listing.title;
    if (tenant?.email) {
      sendMail({
        to: tenant.email,
        subject: `Booking Approved — ${listingTitle}`,
        text: `Hi ${tenant.name},\n\nYour booking for "${listingTitle}" has been approved! You can now proceed to make the payment.\n\n— PGenie`,
        html: `<p>Hi <strong>${tenant.name}</strong>,</p><p>Your booking for <strong>${listingTitle}</strong> has been <span style="color:green">approved</span>! You can now proceed to make the payment.</p><p>— PGenie</p>`,
      }).catch(() => {});
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/bookings/:id/reject — owner rejects
export async function rejectBooking(req, res) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, owner: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not pending.' });
    }

    booking.status = 'rejected';
    await booking.save();

    const tenant = await User.findById(booking.tenant).select('name email');
    const listing = await PGListing.findById(booking.listing).select('title');
    if (tenant?.email) {
      sendMail({
        to: tenant.email,
        subject: `Booking Update — ${listing?.title}`,
        text: `Hi ${tenant.name},\n\nUnfortunately, your booking for "${listing?.title}" was not approved at this time. You can search for other available PGs.\n\n— PGenie`,
        html: `<p>Hi <strong>${tenant.name}</strong>,</p><p>Unfortunately, your booking for <strong>${listing?.title}</strong> was <span style="color:red">not approved</span> at this time. You can search for other available PGs.</p><p>— PGenie</p>`,
      }).catch(() => {});
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/bookings/:id/cancel — tenant cancels
export async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, tenant: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (!['pending', 'approved', 'active'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel booking at this stage.' });
    }

    const wasApprovedOrActive = ['approved', 'active'].includes(booking.status);
    booking.status = 'cancelled';
    await booking.save();

    if (wasApprovedOrActive) {
      // Guard decrement against going negative (prevents race condition with concurrent complete)
      await PGListing.findOneAndUpdate(
        { _id: booking.listing, occupiedBeds: { $gt: 0 } },
        { $inc: { occupiedBeds: -1 } }
      );
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/bookings/:id/complete — owner completes
export async function completeBooking(req, res) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, owner: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active bookings can be marked complete.' });
    }

    booking.status = 'completed';
    await booking.save();

    // Guard decrement against going negative (prevents race condition with concurrent cancel)
    await PGListing.findOneAndUpdate(
      { _id: booking.listing, occupiedBeds: { $gt: 0 } },
      { $inc: { occupiedBeds: -1 } }
    );

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bookings/chat/:bookingId — load message history + mark received as read
export async function getChatHistory(req, res) {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isOwner = booking.owner.toString() === req.user.id;
    const isTenant = booking.tenant.toString() === req.user.id;
    if (!isOwner && !isTenant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Mark messages not sent by current user as read
    await Message.updateMany(
      { booking: req.params.bookingId, sender: { $ne: req.user.id }, readAt: null },
      { $set: { readAt: new Date() } }
    );

    const messages = await Message.find({ booking: req.params.bookingId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bookings/unread-count — unread messages across all of user's bookings
export async function getUnreadCount(req, res) {
  try {
    const userBookings = await Booking.find({
      $or: [{ tenant: req.user.id }, { owner: req.user.id }],
    }).select('_id');
    const bookingIds = userBookings.map((b) => b._id);
    const count = await Message.countDocuments({
      booking: { $in: bookingIds },
      sender: { $ne: req.user.id },
      readAt: null,
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
