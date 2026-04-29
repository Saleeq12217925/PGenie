import { verifyAccessToken } from '../utils/jwt.js';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';

export function initChatSocket(io) {
  // Auth middleware for Socket.io connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Join a booking chat room
    socket.on('join_booking', async (bookingId) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return socket.emit('error', { message: 'Booking not found.' });

        const isOwner = booking.owner.toString() === socket.userId;
        const isTenant = booking.tenant.toString() === socket.userId;
        if (!isOwner && !isTenant) return socket.emit('error', { message: 'Access denied.' });

        socket.join(bookingId);
        socket.currentBookingId = bookingId;
        socket.emit('joined', { bookingId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Send a message
    socket.on('send_message', async ({ bookingId, content }) => {
      try {
        if (!content?.trim()) return;
        const booking = await Booking.findById(bookingId);
        if (!booking) return socket.emit('error', { message: 'Booking not found.' });

        const isOwner = booking.owner.toString() === socket.userId;
        const isTenant = booking.tenant.toString() === socket.userId;
        if (!isOwner && !isTenant) return socket.emit('error', { message: 'Access denied.' });

        const msg = await Message.create({
          booking: bookingId,
          sender: socket.userId,
          role: isOwner ? 'owner' : 'tenant',
          content: content.trim(),
        });

        await msg.populate('sender', 'name');

        io.to(bookingId).emit('new_message', msg);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {});
  });
}
