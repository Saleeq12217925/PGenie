import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(userId, role) {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, { expiresIn: '15m' });
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, env.refreshSecret, { expiresIn: '7d' });
}

export function signTempToken(userId) {
  return jwt.sign({ sub: userId, purpose: 'mfa' }, env.jwtSecret, { expiresIn: '5m' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}

export function verifyTempToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.purpose !== 'mfa') throw new Error('Invalid token purpose');
  return payload;
}
