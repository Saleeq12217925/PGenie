import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export function generateMfaSecret(email) {
  const secret = speakeasy.generateSecret({
    name: `PGenie:${email}`,
    length: 20,
  });
  return { base32: secret.base32, otpauthUrl: secret.otpauth_url };
}

export function generateQrDataUrl(otpauthUrl) {
  return qrcode.toDataURL(otpauthUrl);
}

export function verifyTotp(base32Secret, token) {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: 'base32',
    token,
    window: 1, // allow 30s clock drift
  });
}
