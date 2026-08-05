/** Points 1–5 pour importance fonctionnelle / esthétique. */
const LEVEL_TO_DOTS = { high: 5, medium: 3, low: 1 };

export default function AnatomyImportanceDots({ level, label, variant = 'green' }) {
  const filled = LEVEL_TO_DOTS[level] ?? 2;
  const fillClass = variant === 'amber' ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="text-[10px] text-slate-500">
      <div className="mb-0.5">{label}</div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i <= filled ? fillClass : 'bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  );
}
