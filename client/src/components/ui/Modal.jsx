import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-[var(--text-h)]/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg)] border border-[var(--border)] w-full max-h-[90vh] overflow-auto rounded-2xl flex flex-col gap-0"
        style={{ maxWidth: width, boxShadow: '0 20px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
            <h2 className="text-[1rem] font-semibold text-[var(--text-h)] tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="bg-transparent text-[var(--text)] hover:text-[var(--text-h)] hover:bg-[var(--surface)] w-8 h-8 flex items-center justify-center transition-all rounded-lg text-lg leading-none"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
