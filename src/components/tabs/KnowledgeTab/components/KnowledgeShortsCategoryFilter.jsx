import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';

/**
 * Cycle par catégorie : neutre → inclure → exclure → neutre.
 */
export default function KnowledgeShortsCategoryFilter({
  categories,
  includeCategoryIds,
  excludeCategoryIds,
  onCycleCategory,
  onReset
}) {
  const t = useTranslation();

  if (!categories.length) return null;

  const hasFilters = includeCategoryIds.length > 0 || excludeCategoryIds.length > 0;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-black/50 px-3 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-violet-200">{t('knowledge.feedFilterTitle')}</p>
          <p className="text-[10px] text-slate-500">{t('knowledge.feedFilterHint')}</p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg border border-slate-600/50 px-2 py-1 text-[10px] text-slate-400 transition hover:border-violet-500/40 hover:text-violet-200"
          >
            <RotateCcw size={12} />
            {t('knowledge.feedFilterReset')}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const included = includeCategoryIds.includes(cat.id);
          const excluded = excludeCategoryIds.includes(cat.id);
          let chipClass =
            'border-slate-600/60 bg-black/40 text-slate-400 hover:border-violet-500/40 hover:text-slate-200';
          let prefix = null;
          if (included) {
            chipClass = 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200';
            prefix = '✓';
          } else if (excluded) {
            chipClass = 'border-rose-500/40 bg-rose-950/30 text-rose-300/90 line-through';
            prefix = '✕';
          }

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCycleCategory(cat.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${chipClass}`}
              title={t('knowledge.feedFilterCycle')}
            >
              {prefix ? <span className="mr-1 opacity-80">{prefix}</span> : null}
              {cat.name}
            </button>
          );
        })}
      </div>

      {hasFilters ? (
        <p className="mt-2 text-[10px] text-slate-500">
          {includeCategoryIds.length > 0
            ? t('knowledge.feedFilterIncludeCount', { count: includeCategoryIds.length })
            : t('knowledge.feedFilterAllCategories')}
          {excludeCategoryIds.length > 0
            ? ` · ${t('knowledge.feedFilterExcludeCount', { count: excludeCategoryIds.length })}`
            : ''}
        </p>
      ) : null}
    </div>
  );
}
