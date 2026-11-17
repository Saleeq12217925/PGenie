import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken, signTempToken, verifyRefreshToken, verifyTempToken } from '../utils/jwt.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { generateMfaSecret, generateQrDataUrl, verifyTotp } from '../utils/mfa.js';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setRefreshCookie(res, token) {
  res.cookie('pgenie_refresh', token, COOKIE_OPTS);
}

function clearRefreshCookie(res) {
  res.clearCookie('pgenie_refresh', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
}

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled };
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'tenant',
      mfaEnabled: false,
      isVerified: true,
    });

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, accessToken, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    // If MFA is enabled, issue a short-lived temp token and require OTP
    if (user.mfaEnabled && user.mfaSecret) {
      const tempToken = signTempToken(user._id.toString());
      return res.json({ success: true, mfaRequired: true, tempToken });
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, accessToken, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-mfa
export async function verifyMfa(req, res, next) {
  try {
    const { tempToken, token } = req.body;

    let payload;
    try {
      payload = verifyTempToken(tempToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Temp token invalid or expired.' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.mfaSecret) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    const base32 = decrypt(user.mfaSecret);
    const valid = verifyTotp(base32, token);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid authenticator code.' });
    }

    // Mark MFA as enabled on first successful verification
    if (!user.mfaEnabled) {
      user.mfaEnabled = true;
      user.isVerified = true;
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, accessToken, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -mfaSecret -refreshTokenHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/auth/profile
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { name, currentPassword, newPassword } = req.body;

    // Update name
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Change password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    res.json({ success: true, user: safeUser(user), message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
export async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.pgenie_refresh;
    if (!raw) return res.status(401).json({ success: false, message: 'No refresh token.' });

    let payload;
    try {
      payload = verifyRefreshToken(raw);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ success: false, message: 'Session not found.' });
    }

    if (user.isActive === false) {
      clearRefreshCookie(res);
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    const match = await bcrypt.compare(raw, user.refreshTokenHash);
    if (!match) {
      // Possible token theft — invalidate session
      user.refreshTokenHash = null;
      await user.save();
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Token mismatch. Please log in again.' });
    }

    // Rotate tokens
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const newRefresh = signRefreshToken(user._id.toString());
    user.refreshTokenHash = await bcrypt.hash(newRefresh, 10);
    await user.save();

    setRefreshCookie(res, newRefresh);
    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshTokenHash: null });
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/mfa/setup
export async function setupMfa(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Generate new secret
    const { base32, otpauthUrl } = generateMfaSecret(user.email);

    // Save the encrypted secret but DO NOT enable MFA yet
    user.mfaSecret = encrypt(base32);
    await user.save();

    // Generate QR code data URL
    const qrDataUrl = await generateQrDataUrl(otpauthUrl);

    res.json({ success: true, qrDataUrl });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/mfa/enable
export async function enableMfa(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'OTP token is required.' });

    const user = await User.findById(req.user.id);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'MFA setup not initialized.' });
    }

    const base32 = decrypt(user.mfaSecret);
    const valid = verifyTotp(base32, token);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid authenticator code. Please try again.' });
    }

    // Enable MFA
    user.mfaEnabled = true;
    user.isVerified = true;
    await user.save();

    res.json({ success: true, message: 'MFA successfully enabled.', user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}
