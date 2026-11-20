import React, { useEffect, useState } from 'react';
import { RECAP_VIEW_PERIODS } from '../../../utils/sport/recapViewPeriods';

const PERIOD_LABELS = {
  today: 'Aujourd’hui',
  '7d': '7 jours',
  '30d': '30 jours',
  '3m': '3 mois',
  '6m': '6 mois',
  '1y': '1 an',
  '2y': '2 ans',
  all: 'Toujours'
};

const PERIOD_OPTIONS = (RECAP_VIEW_PERIODS || Object.keys(PERIOD_LABELS).map((id) => ({ id }))).map((row) => ({
  id: row.id,
  label: PERIOD_LABELS[row.id] || row.label || row.id
}));

function labelOf(id) {
  return PERIOD_LABELS[id] || PERIOD_OPTIONS.find((row) => row.id === id)?.label || id;
}

/**
 * Actions d’export dans Récap → Analyse (hors console diagnostic).
 * Réutilise window.momentumExport* enregistré par RecapTab.
 */
export default function RecapAnalyseExportBar({
  period,
  periodWindow = null,
  captureDom = null,
  isAdmin = false
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [periodA, setPeriodA] = useState(period || '7d');
  const [periodB, setPeriodB] = useState(period === '7d' ? '30d' : '7d');
  const canAuditExport = import.meta.env.DEV || isAdmin;

  useEffect(() => {
    setPeriodA(period || '7d');
  }, [period]);

  useEffect(() => {
    const onProgress = (event) => setProgress(event?.detail || null);
    window.addEventListener('momentum:analysis-export-progress', onProgress);
    return () => window.removeEventListener('momentum:analysis-export-progress', onProgress);
  }, []);

  const run = async (fnName, opts, preparing) => {
    if (busy) return;
    const fn = window[fnName];
    if (typeof fn !== 'function') {
      setNotice('Service d’export indisponible. Rechargez Récap → Analyse puis réessayez.');
      return;
    }
    setBusy(true);
    setNotice(preparing);
    setProgress(null);
    try {
      const domCapture = typeof captureDom === 'function' ? captureDom() : null;
      const result = await fn({ ...opts, download: true, domCapture });
      if (result?.refused) {
        setNotice(`Export refusé : ${result.reason || 'paquet indisponible'}.`);
        return;
      }
      if (result?.download && result.download.ok === false) {
        setNotice(`Téléchargement échoué : ${result.download.reason || 'inconnu'}.`);
        return;
      }
      if (result?.schema === 'momentum.analysisEightPeriodExport.v1' && !result.complete) {
        const missing = (result.unavailable || []).map((row) => `${row.period}: ${row.reason}`).join(' · ');
        setNotice(`Export 8 périodes incomplet. ${missing || 'période manquante'}.`);
        return;
      }
      const file = result?.download?.filename || 'fichier téléchargé';
      const warn =
        Array.isArray(result?.warnings) && result.warnings.length
          ? ` · ${result.warnings.length} avertissement(s) (voir MANIFEST.json)`
          : '';
      setNotice(`Export réussi · ${file}${warn}`);
    } catch (error) {
      setNotice(`Erreur : ${String(error?.message || error)}. Réessayez.`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="mb-3 rounded-xl border border-[#0F4C5C]/40 bg-black/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">Exports</span>
        <button
          type="button"
          className="rounded-md border border-teal-700/40 px-2 py-1 text-[11px] text-teal-100/90 hover:bg-teal-950/50 disabled:opacity-40"
          disabled={busy}
          onClick={() =>
            run(
              'momentumExportAnalysisDossier',
              { period, window: periodWindow },
              `Préparation de l’export ${labelOf(period)}…`
            )
          }
        >
          Cette période
        </button>
        <button
          type="button"
          className="rounded-md border border-teal-700/40 px-2 py-1 text-[11px] text-teal-100/90 hover:bg-teal-950/50 disabled:opacity-40"
          disabled={busy}
          onClick={() => run('momentumExportEightPeriods', {}, 'Préparation des 8 périodes (peut prendre plusieurs minutes)…')}
        >
          8 périodes
        </button>
        <button
          type="button"
          className="rounded-md border border-teal-700/40 px-2 py-1 text-[11px] text-teal-100/90 hover:bg-teal-950/50 disabled:opacity-40"
          disabled={busy}
          onClick={() => setCompareOpen((v) => !v)}
        >
          Comparer deux périodes
        </button>
        {canAuditExport ? (
          <button
            type="button"
            className="rounded-md border border-rose-700/40 px-2 py-1 text-[11px] text-rose-100/90 hover:bg-rose-950/40 disabled:opacity-40"
            disabled={busy}
            title="ZIP d’audit : 8 périodes, comparaisons, rejeu et jeux A/B/C archivés — sans relancer vitest"
            onClick={() =>
              run(
                'momentumExportCompleteAudit',
                {},
                'Assemblage du dossier d’audit complet (export 8 périodes + artefacts)…'
              )
            }
          >
            Exporter le dossier d’audit complet
          </button>
        ) : null}
      </div>

      {compareOpen ? (
        <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-800/80 pt-2">
          <label className="text-[11px] text-slate-400">
            A
            <select
              className="ml-1 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-slate-200"
              value={periodA}
              onChange={(e) => setPeriodA(e.target.value)}
            >
              {PERIOD_OPTIONS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label || row.id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-slate-400">
            B
            <select
              className="ml-1 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-slate-200"
              value={periodB}
              onChange={(e) => setPeriodB(e.target.value)}
            >
              {PERIOD_OPTIONS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label || row.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-md border border-amber-700/40 px-2 py-1 text-[11px] text-amber-100/90 hover:bg-amber-950/40 disabled:opacity-40"
            disabled={busy || !periodA || !periodB || periodA === periodB}
            onClick={() =>
              run(
                'momentumExportPeriodComparison',
                { periodA, periodB },
                `Comparaison ${labelOf(periodA)} / ${labelOf(periodB)}…`
              )
            }
          >
            Exporter la comparaison
          </button>
        </div>
      ) : null}

      {(busy || notice) && (
        <p className="mt-2 text-[11px] text-slate-400" role="status" aria-live="polite">
          {busy && progress
            ? `En cours · ${progress.index || '?'}/${progress.total || 8} · ${progress.period} (${progress.phase})…`
            : null}
          {busy && !progress ? notice || 'En cours…' : null}
          {!busy ? notice : null}
          {!busy && notice ? (
            <button type="button" className="ml-2 underline" onClick={() => setNotice('')}>
              OK
            </button>
          ) : null}
        </p>
      )}
    </div>
  );
}
