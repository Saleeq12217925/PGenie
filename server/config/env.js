import 'dotenv/config';

// Render supplies the public HTTPS origin after assigning the service URL.
if (!process.env.CLIENT_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.CLIENT_URL = process.env.RENDER_EXTERNAL_URL;
}

const required = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_SECRET', 'AES_KEY', 'CLIENT_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!/^[a-f0-9]{64}$/i.test(process.env.AES_KEY)) {
  throw new Error('AES_KEY must be exactly 64 hex characters (32 bytes)');
}

if (!['local', 'mongodb'].includes(process.env.PHOTO_STORAGE || 'local')) {
  throw new Error('PHOTO_STORAGE must be local or mongodb');
}

export const env = Object.freeze({
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.REFRESH_SECRET,
  aesKey: process.env.AES_KEY,
  clientUrl: process.env.CLIENT_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
});
