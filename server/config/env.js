import 'dotenv/config';

const required = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_SECRET', 'AES_KEY', 'CLIENT_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.AES_KEY.length !== 64) {
  throw new Error('AES_KEY must be exactly 64 hex characters (32 bytes)');
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
