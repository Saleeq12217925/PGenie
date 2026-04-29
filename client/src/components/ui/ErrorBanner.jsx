export function ErrorBanner({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      {message}
    </div>
  );
}
