import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios.js';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useChat } from '../../hooks/useChat.js';
import { FiMessageSquare } from 'react-icons/fi';

export function ChatPage() {
  const { bookingId } = useParams();
  const { user, accessToken } = useAuth();
  const { connect, joinBooking, sendMessage, messages, connected } = useChat();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Load booking + chat history
    Promise.all([
      api.get(`/bookings/${bookingId}`),
      api.get(`/bookings/chat/${bookingId}`),
    ])
      .then(([bookRes, msgRes]) => {
        setBooking(bookRes.data.data);
        // Connect socket and join room with initial messages
        if (accessToken) connect(accessToken);
        joinBooking(bookingId, msgRes.data.data || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load chat.'))
      .finally(() => {
        setLoading(false);
        // instant scroll to bottom on first load (no animation)
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'instant' });
          initialLoadDone.current = true;
        }, 50);
      });
  }, [bookingId, accessToken, connect, joinBooking]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(bookingId, text.trim());
    setText('');
  }

  if (loading) return <AppShell><PageSpinner /></AppShell>;
  if (error && !booking) return <AppShell><div className="p-8 text-[#ef4444] font-medium">{error}</div></AppShell>;

  const b = booking;
  const otherPerson = user?.role === 'tenant' ? b?.owner : b?.tenant;

  return (
    <AppShell>
      <div className="flex h-[100svh] min-h-0">
        {/* Booking info sidebar */}
        <div className="w-[260px] border-r border-[var(--border)] p-5 bg-[var(--surface)] flex flex-col gap-4 shrink-0 shadow-sm z-10 relative hidden md:flex">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-h)]">Chat Details</h2>
          {b && (
            <>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm transition-all hover:shadow-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] mb-1">Listing</div>
                <div className="text-sm font-semibold text-[var(--text-h)]">{b.listing?.title}</div>
                <div className="text-xs text-[var(--text)] mt-0.5">{b.listing?.city}</div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm transition-all hover:shadow-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] mb-1">Chatting with</div>
                <div className="text-sm font-semibold text-[var(--text-h)]">{otherPerson?.name}</div>
              </div>
              <div className={`flex items-center gap-2 text-[11px] font-bold tracking-wide uppercase ${connected ? 'text-green-500' : 'text-[var(--text)]'}`}>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-[var(--border)]'}`} />
                {connected ? 'Connected' : 'Connecting...'}
              </div>
              <Link to={`/bookings/${bookingId}`} className="text-sm text-[var(--accent)] font-semibold mt-2 hover:underline">← View Booking</Link>
            </>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2"><FiMessageSquare className="text-[var(--accent)]" /> {otherPerson?.name}</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 bg-[var(--bg)]/40 relative">
            <ErrorBanner message={error} />
            {messages.length === 0 && !error && (
              <div className="text-center text-[var(--text)] mt-10 text-sm font-medium">
                No messages yet. Say hello!
              </div>
            )}
            {messages.map((msg, i) => {
              const isMine = msg.sender?._id === user?.id || msg.sender === user?.id;
              return (
                <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all ${isMine ? 'rounded-[16px_16px_4px_16px] bg-[var(--btn-accent)] text-white border-none' : 'rounded-[16px_16px_16px_4px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-h)]'}`}>
                    {!isMine && <div className="text-[11px] font-bold mb-1 opacity-70">{msg.sender?.name}</div>}
                    {msg.content}
                    <div className="text-[10px] mt-1.5 opacity-70 text-right font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface)] flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] text-[0.95rem] outline-none shadow-inner focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
            />
            <button type="submit" disabled={!text.trim() || !connected} className={`px-6 rounded-full font-bold tracking-wide transition-all duration-300 shadow-sm ${(!text.trim() || !connected) ? 'bg-[var(--border)] text-[var(--text)] opacity-60 cursor-not-allowed' : 'bg-[var(--btn-accent)] text-white hover:bg-[var(--btn-accent-hover)] hover:-translate-y-0.5 hover:shadow-md cursor-pointer'}`}>
              Send
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
