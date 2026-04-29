import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { PGListing } from '../models/PGListing.js';
import { Booking } from '../models/Booking.js';
import { AuditLog } from '../models/AuditLog.js';

// GET /api/admin/users
export async function listUsers(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
    const safePage = Math.max(1, Number(page));
    const skip = (safePage - 1) * safeLimit;
    const [users, total] = await Promise.all([
      User.find({}, 'name email role isActive isVerified createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      User.countDocuments(),
    ]);
    res.json({ success: true, data: users, pagination: { page: safePage, limit: safeLimit, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/admin/users/:id/toggle-active
export async function toggleUserActive(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const wasActive = user.isActive;
    user.isActive = !user.isActive;

    if (wasActive) {
      // Deactivating: invalidate existing session immediately
      user.refreshTokenHash = null;

      // Deactivate all their listings if they are an owner
      if (user.role === 'owner') {
        await PGListing.updateMany({ owner: user._id }, { isActive: false });
      }
    }

    await user.save();
    res.json({ success: true, data: { _id: user._id, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/admin/users/:id/role
export async function changeUserRole(req, res) {
  try {
    const { role } = req.body;
    if (!['admin', 'owner', 'tenant'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: 'name email role' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/bookings
export async function listAllBookings(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
    const safePage = Math.max(1, Number(page));
    const filter = {};
    if (status) filter.status = status;

    const skip = (safePage - 1) * safeLimit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('tenant', 'name email')
        .populate('owner', 'name email')
        .populate('listing', 'title city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Booking.countDocuments(filter),
    ]);
    res.json({ success: true, data: bookings, pagination: { page: safePage, limit: safeLimit, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/audit-logs
export async function listAuditLogs(req, res) {
  try {
    const { action, page = 1, limit = 30, from, to } = req.query;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
    const safePage = Math.max(1, Number(page));
    const filter = {};
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (safePage - 1) * safeLimit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: logs, pagination: { page: safePage, limit: safeLimit, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/stats
export async function getStats(req, res) {
  try {
    const [totalUsers, totalListings, totalBookings, revenueResult, recentLogs] = await Promise.all([
      User.countDocuments(),
      PGListing.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      AuditLog.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalListings,
        totalBookings,
        revenue: revenueResult[0]?.total || 0,
        recentActivity: recentLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/revenue — monthly revenue for owner dashboard
export async function getOwnerRevenue(req, res) {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.id);
    const months = 6;
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const revenue = await Booking.aggregate([
      { $match: { owner: ownerId, paymentStatus: 'paid', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const ownerStats = await Promise.all([
      PGListing.countDocuments({ owner: ownerId, isActive: true }),
      Booking.countDocuments({ owner: ownerId, status: 'pending' }),
      Booking.aggregate([
        { $match: { owner: ownerId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        monthlyRevenue: revenue,
        activeListings: ownerStats[0],
        pendingRequests: ownerStats[1],
        totalRevenue: ownerStats[2][0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
