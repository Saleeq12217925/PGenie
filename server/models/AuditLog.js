import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for unauthenticated failed attempts
  },
  action: {
    type: String,
    required: true,
    // e.g. REGISTER | LOGIN_SUCCESS | LOGIN_FAIL | MFA_VERIFY | TOKEN_REFRESH | LOGOUT
  },
  ip: String,
  userAgent: String,
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL: auto-delete after 90 days
    expires: 60 * 60 * 24 * 90,
  },
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
