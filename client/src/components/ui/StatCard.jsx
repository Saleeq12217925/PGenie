const COLOR_MAP = {
  default: { icon: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-h)' }, value: 'var(--text-h)', label: 'var(--text)' },
  indigo:  { icon: { background: 'rgba(99,102,241,0.12)', color: '#6366f1' }, value: 'var(--text-h)', label: 'var(--text)' },
  emerald: { icon: { background: 'rgba(16,185,129,0.12)', color: '#10b981' }, value: 'var(--text-h)', label: 'var(--text)' },
  amber:   { icon: { background: 'rgba(245,158,11,0.12)',  color: '#d97706' }, value: 'var(--text-h)', label: 'var(--text)' },
  rose:    { icon: { background: 'rgba(244,63,94,0.12)',   color: '#f43f5e' }, value: 'var(--text-h)', label: 'var(--text)' },
  sky:     { icon: { background: 'rgba(14,165,233,0.12)',  color: '#0ea5e9' }, value: 'var(--text-h)', label: 'var(--text)' },
};

export function StatCard({ label, value, icon, sub, accent, color = 'default' }) {
  if (accent) {
    return (
      <div className="p-5 flex flex-col gap-2 rounded-xl border border-[var(--accent-border)] relative overflow-hidden group bg-[var(--accent)] shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-[0.72rem] font-semibold uppercase tracking-widest text-white/80">{label}</span>
          {icon && (
            <span className="w-9 h-9 flex items-center justify-center text-lg rounded-xl bg-white/20 text-white shadow-inner transition-transform duration-300 group-hover:scale-110">
              {icon}
            </span>
          )}
        </div>
        <div className="text-3xl font-extrabold leading-none mt-2 text-white">{value}</div>
        {sub && <div className="text-[0.72rem] mt-1 font-medium text-white/75">{sub}</div>}
      </div>
    );
  }

  const c = COLOR_MAP[color] || COLOR_MAP.default;
  return (
    <div className="p-5 flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[0.72rem] font-semibold uppercase tracking-widest" style={{ color: c.label }}>{label}</span>
        {icon && (
          <span
            className="w-9 h-9 flex items-center justify-center text-lg rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={c.icon}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold leading-none mt-2" style={{ color: c.value }}>{value}</div>
      {sub && <div className="text-[0.72rem] mt-1 font-medium" style={{ color: c.label }}>{sub}</div>}
    </div>
  );
}
