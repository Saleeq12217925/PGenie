import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentBookingId, setCurrentBookingId] = useState(null);

  function connect(accessToken) {
    if (socketRef.current?.connected) return;
    socketRef.current?.disconnect();
    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('error', (err) => console.error('[Socket]', err));
    socketRef.current = socket;
  }

  function disconnect() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setMessages([]);
    setCurrentBookingId(null);
  }

  const joinBooking = useCallback((bookingId, initialMessages = []) => {
    setCurrentBookingId(bookingId);
    setMessages(initialMessages);
    socketRef.current?.emit('join_booking', bookingId);
  }, []);

  const sendMessage = useCallback((bookingId, content) => {
    socketRef.current?.emit('send_message', { bookingId, content });
  }, []);

  return (
    <ChatContext.Provider value={{ connected, messages, currentBookingId, connect, disconnect, joinBooking, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}
