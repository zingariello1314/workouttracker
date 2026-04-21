import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../utils/translations';

const StatsTab = lazy(() => import('./StatsTab'));
const PredictionsTab = lazy(() => import('../PredictionsTab'));
const SmartBalancingTab = lazy(() => import('../SmartBalancingTab'));
const HistoryTab = lazy(() => import('./HistoryTab'));

const HUB_STORAGE_KEY = 'sport.analytics.panel';

function mapLegacyTabToPanel(tabId) {
  if (tabId === 'predictions') return 'predictions';
  if (tabId === 'smart-balancing') return 'balancing';
  if (tabId === 'stats') return 'stats';
  return 'stats';
}

/**
 * Hub unique : Statistiques, Prédictions, Équilibre IA + bloc Historique en dessous.
 * Remplace les anciens sous-onglets séparés (pas de perte de données : mêmes composants).
 */
const SportAnalyticsHubTab = ({ legacyEntry = null }) => {
  const t = useTranslation();
  const [panel, setPanel] = useState(() => {
    if (legacyEntry && legacyEntry !== 'history') return mapLegacyTabToPanel(legacyEntry);
    try {
      const s = localStorage.getItem(HUB_STORAGE_KEY);
      if (s === 'stats' || s === 'predictions' || s === 'balancing') return s;
    } catch {
      /* ignore */
    }
    return 'stats';
  });

  useEffect(() => {
    if (!legacyEntry) return;
    if (legacyEntry === 'history') {
      setTimeout(() => {
        document.getElementById('sport-analytics-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
      return;
    }
    setPanel(mapLegacyTabToPanel(legacyEntry));
  }, [legacyEntry]);

  useEffect(() => {
    try {
      localStorage.setItem(HUB_STORAGE_KEY, panel);
    } catch {
      /* ignore */
    }
  }, [panel]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('nav_params_sport-analytics');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p?.section === 'stats' || p?.section === 'predictions' || p?.section === 'balancing') {
        setPanel(p.section);
      }
      if (p?.section === 'history') {
        setTimeout(() => {
          document.getElementById('sport-analytics-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const pills = useMemo(
    () => [
      { id: 'stats', label: t('nav.stats') },
      { id: 'predictions', label: t('nav.predictions') },
      { id: 'balancing', label: t('nav.smartBalancing') },
    ],
    [t]
  );

  const loadFallback = (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-teal-600">
      {t('sportAnalyticsHub.loading', 'Chargement…')}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-20 text-teal-50">
        <header className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black px-4 py-3 shadow-md shadow-black/40">
          <h1 className="text-xl font-bold tracking-tight text-white">
            {t('sportAnalyticsHub.title', 'Analyses & prévisions')}
          </h1>
          <p className="mt-1 text-sm text-teal-200/85">
            {t(
              'sportAnalyticsHub.subtitle',
              'Statistiques, prédictions, équilibre intelligent et historique des séances au même endroit.'
            )}
          </p>
        </header>

        <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 shadow-md shadow-black/40">
          <div className="flex flex-wrap gap-2">
            {pills.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPanel(p.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  panel === p.id
                    ? 'border-[#0F5C45] bg-[#0F5C45]/35 text-white shadow-md shadow-black/40'
                    : 'border-[#0F4C5C]/55 bg-black text-teal-100 hover:border-[#0F5C45]/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <section className="min-h-[12rem] rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-3 shadow-md shadow-black/40 sm:p-4">
          <Suspense fallback={loadFallback}>
            {panel === 'stats' && <StatsTab />}
            {panel === 'predictions' && <PredictionsTab />}
            {panel === 'balancing' && <SmartBalancingTab />}
          </Suspense>
        </section>

        <section
          id="sport-analytics-history"
          className="scroll-mt-28 space-y-3 rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 shadow-md shadow-black/40"
        >
          <div className="border-b border-[#0F4C5C]/40 pb-3">
            <h2 className="text-lg font-semibold text-teal-100">{t('nav.history')}</h2>
            <p className="mt-1 text-xs text-teal-700">
              {t('sportAnalyticsHub.historyHint', 'Consulte ici tout l’historique des données enregistrées.')}
            </p>
          </div>
          <div className="min-h-[10rem] pt-2">
            <Suspense fallback={loadFallback}>
              <HistoryTab />
            </Suspense>
          </div>
        </section>
    </div>
  );
};

export default SportAnalyticsHubTab;
