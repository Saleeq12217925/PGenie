import './config/env.js'; // validate env vars first
import { createServer } from 'http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import mongoose from 'mongoose';
import { servePhoto, usesMongoPhotos } from './utils/photoStorage.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initChatSocket } from './socket/chatSocket.js';
import authRouter from './routes/auth.js';
import pgsRouter from './routes/pgs.js';
import bookingsRouter from './routes/bookings.js';
import adminRouter from './routes/admin.js';
import paymentsRouter from './routes/payments.js';
import aiRouter from './routes/ai.js';
import reviewsRouter from './routes/reviews.js';

const app = express();
const httpServer = createServer(app);

// The Render deployment has one trusted reverse proxy in front of Express.
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Socket.io
const io = new SocketServer(httpServer, {
  cors: { origin: env.clientUrl, credentials: true },
});
initChatSocket(io);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: { connectSrc: ["'self'", 'https://nominatim.openstreetmap.org'] },
  },
}));

// CORS — allow only the frontend origin, support credentials (cookies)
app.use(cors({ origin: env.clientUrl, credentials: true }));

// Body + cookie parsing
app.use(express.json());
app.use(cookieParser());

// Static file serving for uploads
if (usesMongoPhotos()) app.get('/uploads/:filename', servePhoto);
else app.use('/uploads', express.static('uploads'));

app.get('/api/health', async (_req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    if (process.env.CHECK_AI_HEALTH === 'true') {
      const response = await fetch(`${process.env.AI_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error('AI service unavailable');
    }
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/pgs', pgsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reviews', reviewsRouter);

// The free deployment serves the built SPA and API from one HTTPS origin.
if (process.env.STATIC_DIR) {
  const staticDir = path.resolve(process.env.STATIC_DIR);
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (/^\/(api|uploads|socket\.io)(\/|$)/.test(req.path)) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  if (env.isDev) console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error.' });
});

connectDB().then(() => {
  httpServer.listen(env.port, () => {
    console.log(`PGenie server running on port ${env.port} [${env.nodeEnv}]`);
  });
});
