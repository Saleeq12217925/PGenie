import { AuditLog } from '../models/AuditLog.js';

export function auditLog(action, getMeta) {
  return (req, _res, next) => {
    const userId = req.user?.id ?? null;
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const meta = getMeta ? getMeta(req) : {};

    // Fire-and-forget: do not await so auth response latency is unaffected
    AuditLog.create({ userId, action, ip, userAgent, meta }).catch((err) => {
      console.error('[AuditLog] Failed to write:', err.message);
    });

    next();
  };
}
