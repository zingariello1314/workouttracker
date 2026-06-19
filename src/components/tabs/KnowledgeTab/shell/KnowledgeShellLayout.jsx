import React from 'react';
import { useTranslation } from '../../../../utils/translations';
import { KNOWLEDGE_VIEWS } from '../constants';

import { KnowledgeStorageBadge } from '../components/KnowledgeUiBlocks';

export default function KnowledgeShellLayout({ activeView, onViewChange, isAdmin, stats, children }) {
  const t = useTranslation();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1400px] flex-col px-3 py-4 text-slate-100 sm:px-4">
      <header className="sticky top-0 z-30 mb-4 rounded-xl border border-violet-500/25 bg-black/95 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80">
              {t('knowledge.breadcrumb')}
            </p>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">{t('knowledge.title')}</h1>
            <p className="mt-0.5 text-xs text-slate-400">{t('knowledge.subtitle')}</p>
            {stats ? (
              <div className="mt-2">
                <KnowledgeStorageBadge stats={stats} />
              </div>
            ) : null}
          </div>
          {isAdmin ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
              {t('knowledge.adminBadge')}
            </span>
          ) : (
            <span className="rounded-full border border-slate-600/50 bg-slate-900/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {t('knowledge.readOnlyBadge')}
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <nav
          className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-violet-500/20 bg-black/60 p-1.5 lg:w-48 lg:flex-col"
          aria-label={t('knowledge.navLabel')}
        >
          {KNOWLEDGE_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-violet-600/90 text-white shadow-md'
                  : 'text-slate-300 hover:bg-violet-950/50 hover:text-white'
              }`}
              aria-current={activeView === view.id ? 'page' : undefined}
            >
              <span aria-hidden>{view.icon}</span>
              <span>{t(view.labelKey)}</span>
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
