import './config/env.js'; // validate env vars first
import { createServer } from 'http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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

// Socket.io
const io = new SocketServer(httpServer, {
  cors: { origin: env.clientUrl, credentials: true },
});
initChatSocket(io);

// Security headers
app.use(helmet());

// CORS — allow only the frontend origin, support credentials (cookies)
app.use(cors({ origin: env.clientUrl, credentials: true }));

// Body + cookie parsing
app.use(express.json());
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/pgs', pgsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reviews', reviewsRouter);

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
