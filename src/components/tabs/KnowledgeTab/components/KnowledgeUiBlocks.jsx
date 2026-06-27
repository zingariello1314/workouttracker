import React from 'react';
import { Database, Inbox, Loader2, Search } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';

export function KnowledgeSectionTabs({ modes, active, onChange }) {
  const t = useTranslation();
  return (
    <div
      className="flex gap-1 rounded-xl border border-violet-500/20 bg-black/50 p-1"
      role="tablist"
      aria-label={t('knowledge.sectionNav')}
    >
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={active === m.id}
          onClick={() => onChange(m.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
            active === m.id
              ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
              : 'text-slate-400 hover:bg-violet-950/40 hover:text-slate-200'
          }`}
        >
          {m.icon ? <span aria-hidden>{m.icon}</span> : null}
          <span>{t(m.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}

export function KnowledgeSearchBar({ value, onChange, placeholder, action }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-violet-500/25 bg-black/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
        />
      </div>
      {action}
    </div>
  );
}

export function KnowledgeCategoryChips({ categories, activeId, onSelect, hiddenIds = [] }) {
  const t = useTranslation();
  const visible = categories.filter((c) => !hiddenIds.includes(c.id));
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('')}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          !activeId
            ? 'border-violet-400 bg-violet-600/30 text-white'
            : 'border-slate-600 text-slate-400 hover:border-violet-500/50'
        }`}
      >
        {t('knowledge.allCategories')}
      </button>
      {visible.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            activeId === cat.id
              ? 'border-violet-400 bg-violet-600/30 text-white'
              : 'border-slate-600 text-slate-400 hover:border-violet-500/50'
          }`}
          style={cat.color ? { borderColor: activeId === cat.id ? cat.color : undefined } : undefined}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

export function KnowledgeLoading({ className = 'py-16' }) {
  return (
    <div className={`flex justify-center text-violet-300/80 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

export function KnowledgeScrollSentinel({ sentinelRef, loadingMore }) {
  return (
    <>
      <div ref={sentinelRef} className="h-6 w-full" aria-hidden />
      {loadingMore ? (
        <div className="flex justify-center py-4 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}
    </>
  );
}

export function KnowledgeEmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-500/20 bg-violet-950/10 px-6 py-16 text-center">
      <Inbox className="mb-3 h-10 w-10 text-violet-400/40" />
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function KnowledgeStorageBadge({ stats }) {
  const t = useTranslation();
  if (!stats) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-200/90">
      <Database size={14} className="shrink-0 text-emerald-400/80" />
      <span>
        {t('knowledge.storageStats', {
          videos: stats.videoCount,
          size: stats.videoSizeLabel
        })}
      </span>
      <span className="hidden text-emerald-400/60 sm:inline">· {t('knowledge.storagePersistent')}</span>
    </div>
  );
}

export function formatKnowledgeDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

export function formatBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '0 o';
  if (v < 1024) return `${v} o`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} Ko`;
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}
