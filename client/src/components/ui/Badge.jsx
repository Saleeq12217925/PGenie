const VARIANTS = {
  pending:   'bg-[#f59e0b]/15 text-[#d97706] border-[#f59e0b]/30',
  approved:  'bg-[#16a34a]/15 text-[#15803d] border-[#16a34a]/30',
  active:    'bg-[#16a34a]/15 text-[#15803d] border-[#16a34a]/30',
  completed: 'bg-[#64748b]/15 text-[#475569] border-[#64748b]/30',
  rejected:  'bg-[#ef4444]/15 text-[#b91c1c] border-[#ef4444]/30',
  cancelled: 'bg-[var(--text)]/15 text-[var(--text-h)] border-[var(--border)]',
  paid:      'bg-[#16a34a]/15 text-[#15803d] border-[#16a34a]/30',
  unpaid:    'bg-[#f59e0b]/15 text-[#d97706] border-[#f59e0b]/30',
  refunded:  'bg-[#3b82f6]/15 text-[#1d4ed8] border-[#3b82f6]/30',
  admin:     'bg-[#ef4444]/15 text-[#b91c1c] border-[#ef4444]/30',
  owner:     'bg-[#f59e0b]/15 text-[#d97706] border-[#f59e0b]/30',
  tenant:    'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30',
};

export function Badge({ variant = 'pending', label, style: extra, className = '' }) {
  const vClass = VARIANTS[variant] || VARIANTS.pending;
  const text = label ?? variant;
  return (
    <span 
      style={extra}
      className={`inline-flex items-center justify-center px-2.5 pt-[4px] pb-[3px] text-[0.7rem] leading-none font-bold tracking-wide uppercase border rounded-full whitespace-nowrap ${vClass} ${className}`}
    >
      {text}
    </span>

  );
}
