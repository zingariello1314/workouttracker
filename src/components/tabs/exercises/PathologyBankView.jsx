import React, { useMemo, useState, useCallback } from 'react';
import {
  Search,
  Stethoscope,
  Clock,
  AlertTriangle,
  Plus,
  Info,
  CheckSquare,
  Layers
} from 'lucide-react';
import {
  searchPathologies,
  listPathologiesBySport,
  PATHOLOGY_SPORTS,
  PATHOLOGY_BODY_ZONES,
  getPathologyById
} from '../../../data/pathology';
import { getStretchByKey } from '../../../data/stretchDatabase';
import { useTranslation } from '../../../utils/translations';
import { resolveExerciseIntensityCoeff } from '../../../utils/trainingLoadUtils';
import {
  buildPathologyRenderableItems,
  buildBulkAddPayload,
  selectionKeyForItem,
  parseDurationSecondsFromDosage
} from '../../../utils/pathologyBankUtils';
import SportBankExerciseCard from '../../sport/SportBankExerciseCard';
import PathologyStretchCard from './PathologyStretchCard';
import PathologyDetailPage from './PathologyDetailPage';
import StretchDetailPage from './StretchDetailPage';

const SPORT_HEADER_CLASS = {
  running: 'text-sky-300 border-sky-500/40',
  strength: 'text-violet-300 border-violet-500/40',
  prevention: 'text-emerald-300 border-emerald-500/40'
};

function PathologyExerciseCardWrap({
  item,
  selected,
  onToggleSelect,
  showSelect,
  data,
  intensityCoeffs,
  maxRecordsByExerciseId,
  onOpenExercise,
  onRequestAddToProgram
}) {
  const ex = item.exercise;
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border-2 bg-black shadow-lg shadow-black/40 transition-all duration-200
        ${selected ? 'border-sky-400/70 ring-2 ring-sky-400/30' : 'border-[#0F4C5C]/85 hover:border-[#0F5C45]/80'}`}
    >
      {(showSelect || item.dosage) && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#0F4C5C]/40 bg-[#041a13]/80 px-3 py-1.5">
          {showSelect ? (
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-sky-200">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect?.()}
                className="accent-sky-500"
              />
              Sélectionner
            </label>
          ) : (
            <span />
          )}
          {item.dosage && (
            <span className="shrink-0 rounded-md border border-sky-500/40 bg-black/60 px-2 py-0.5 text-[10px] font-mono text-sky-200">
              {item.dosage}
            </span>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 [&>div]:h-full [&>div]:min-h-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none [&>div]:ring-0 [&>div]:hover:border-0 [&>div]:hover:shadow-none">
        <SportBankExerciseCard
          exercise={ex}
          onOpenDetail={onOpenExercise}
          effectiveLoadCoeff={resolveExerciseIntensityCoeff(ex, intensityCoeffs)}
          hasRecordedMax={maxRecordsByExerciseId?.has(String(ex.id))}
          maxRecord={maxRecordsByExerciseId?.get(String(ex.id)) || null}
          showAddButton={Boolean(onRequestAddToProgram)}
          onRequestAddToProgram={(p) =>
            onRequestAddToProgram?.({
              kind: 'exercise',
              exercise: p.exercise,
              series: item.dosage || '3×10'
            })
          }
          workoutData={data}
        />
      </div>
    </div>
  );
}

export default function PathologyBankView({
  data,
  updateData,
  onOpenExercise,
  onRequestAddToProgram,
  intensityCoeffs = {},
  maxRecordsByExerciseId,
  isAuthenticated = false,
  sportPrograms = []
}) {
  const t = useTranslation();
  const [zoneFilter, setZoneFilter] = useState('');
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [stretchDetailKey, setStretchDetailKey] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  const ratings = data?.stretchPerceivedRatings || {};

  const sportLabelFor = useCallback(
    (sportId) => {
      const s = PATHOLOGY_SPORTS.find((x) => x.id === sportId);
      return s ? t(s.labelKey, s.labelDefault) : sportId;
    },
    [t]
  );

  const filtered = useMemo(() => {
    let list = query.trim()
      ? searchPathologies(query)
      : PATHOLOGY_SPORTS.flatMap((s) => listPathologiesBySport(s.id));
    if (zoneFilter) list = list.filter((e) => e.bodyZone === zoneFilter);
    return list;
  }, [query, zoneFilter]);

  const groupedBySport = useMemo(() => {
    return PATHOLOGY_SPORTS.map((sport) => ({
      sport,
      entries: filtered.filter((e) => e.sport === sport.id)
    })).filter((g) => g.entries.length > 0);
  }, [filtered]);

  const detailEntry = detailId ? getPathologyById(detailId) : null;
  const stretchDetail = stretchDetailKey ? getStretchByKey(stretchDetailKey) : null;

  const toggleSelect = useCallback((type, key) => {
    const sk = selectionKeyForItem(type, key);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk);
      else next.add(sk);
      return next;
    });
  }, []);

  const selectedRenderable = useMemo(() => {
    const keys = selected;
    const all = [];
    filtered.forEach((entry) => {
      buildPathologyRenderableItems(entry, t).forEach((it) => {
        const sk = selectionKeyForItem(it.type, it.key);
        if (keys.has(sk)) all.push(it);
      });
    });
    return all;
  }, [filtered, selected, t]);

  const openBulkAdd = useCallback(
    (renderableItems, label) => {
      if (!onRequestAddToProgram || renderableItems.length === 0) return;
      onRequestAddToProgram(buildBulkAddPayload(label, renderableItems));
    },
    [onRequestAddToProgram]
  );

  const handleSingleStretchAdd = useCallback(
    (payload, dosage, stretch) => {
      onRequestAddToProgram?.({
        kind: 'stretch',
        stretchKey: payload.stretchKey,
        stretchLabel: payload.stretchLabel,
        duration: parseDurationSecondsFromDosage(dosage, stretch?.defaultDuration || 60)
      });
    },
    [onRequestAddToProgram]
  );

  const handleSingleExerciseAdd = useCallback(
    (payload) => {
      onRequestAddToProgram?.({
        kind: 'exercise',
        exercise: payload.exercise,
        ...(payload.series ? { series: payload.series } : {})
      });
    },
    [onRequestAddToProgram]
  );

  if (stretchDetail && stretchDetailKey) {
    return (
      <StretchDetailPage
        stretch={stretchDetail}
        stretchKey={stretchDetailKey}
        data={data}
        updateData={updateData}
        onBack={() => setStretchDetailKey(null)}
        readOnly={!isAuthenticated}
        sportPrograms={sportPrograms}
        onOpenSimilarStretch={(key) => setStretchDetailKey(key)}
        maxRecordsByExerciseId={maxRecordsByExerciseId}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (detailEntry) {
    return (
      <PathologyDetailPage
        entry={detailEntry}
        sportLabel={sportLabelFor(detailEntry.sport)}
        onBack={() => setDetailId(null)}
        onOpenExercise={(key) => {
          const entry = buildPathologyRenderableItems(detailEntry, t).find(
            (x) => x.type === 'exercise' && x.key === key
          );
          if (entry?.exercise) onOpenExercise?.(entry.exercise);
        }}
        onOpenStretch={(key) => setStretchDetailKey(key)}
      />
    );
  }

  return (
    <div className="relative space-y-8 pb-24">
      <div className="rounded-2xl border border-[#0F4C5C]/50 bg-black p-5">
        <div className="mb-2 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-400" />
          <h3 className="text-lg font-semibold text-white">
            {t('exercisesTab.pathologyTab.title', 'Banque pathologies & rééducation')}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          {t(
            'exercisesTab.pathologyTab.subtitle',
            'Par sport puis pathologie : mêmes cartes que la banque (rouge = exercice, bleu = étirement). Ajoute au programme jour par jour ou en lot.'
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('exercisesTab.pathologyTab.search', 'Rechercher une pathologie, un symptôme…')}
            className="w-full rounded-lg border border-slate-600 bg-black py-2 pl-9 pr-3 text-sm text-white"
          />
        </div>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white sm:w-48"
        >
          <option value="">{t('exercisesTab.pathologyTab.allZones', 'Toutes les zones')}</option>
          {PATHOLOGY_BODY_ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.label}
            </option>
          ))}
        </select>
      </div>

      {groupedBySport.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          {t('exercisesTab.pathologyTab.empty', 'Aucun résultat pour ces filtres.')}
        </p>
      )}

      {groupedBySport.map(({ sport, entries }) => {
        const sportLabel = sportLabelFor(sport.id);
        const headerClass = SPORT_HEADER_CLASS[sport.id] || 'text-teal-200 border-teal-500/40';
        const sportCount = entries.reduce(
          (n, e) => n + buildPathologyRenderableItems(e, t).length,
          0
        );

        return (
          <section key={sport.id} className="space-y-8">
            <header className={`border-b-2 pb-3 ${headerClass.split(' ').slice(1).join(' ')}`}>
              <h2
                className={`text-base font-bold uppercase tracking-widest sm:text-lg ${headerClass.split(' ')[0]}`}
              >
                {sportLabel} ({sportCount})
              </h2>
            </header>

            {entries.map((entry) => {
              const renderable = buildPathologyRenderableItems(entry, t);
              const zoneLabel = PATHOLOGY_BODY_ZONES.find((z) => z.id === entry.bodyZone)?.label;
              const entryKeys = new Set(
                renderable.map((it) => selectionKeyForItem(it.type, it.key))
              );
              const allSelected =
                renderable.length > 0 && renderable.every((it) => selected.has(selectionKeyForItem(it.type, it.key)));

              return (
                <div key={entry.id} className="space-y-4">
                  <div className="flex flex-col gap-3 border-b border-[#0F4C5C]/40 pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-200">
                        {entry.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {zoneLabel && <span>{zoneLabel}</span>}
                        {entry.recoveryTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.recoveryTime}
                          </span>
                        )}
                        {entry.difficultRecovery && (
                          <span className="inline-flex items-center gap-1 text-amber-400/90">
                            <AlertTriangle className="h-3 w-3" />
                            {t('exercisesTab.pathologyTab.difficultRecovery', 'Récupération longue')}
                          </span>
                        )}
                      </div>
                      {(entry.summary || entry.symptoms?.[0]) && (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                          {entry.summary || entry.symptoms[0]}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailId(entry.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900"
                      >
                        <Info className="h-3.5 w-3.5" />
                        {t('exercisesTab.pathologyTab.viewDetail', 'Détails')}
                      </button>
                      {isAuthenticated && renderable.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (allSelected) entryKeys.forEach((k) => next.delete(k));
                                else entryKeys.forEach((k) => next.add(k));
                                return next;
                              });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            {allSelected ? 'Tout désélect.' : 'Tout sélect.'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openBulkAdd(renderable, entry.shortName || entry.name)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F5C45]/60 bg-[#0F5C45]/25 px-3 py-1.5 text-xs font-medium text-teal-100 hover:bg-[#0F5C45]/45"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            {t('exercisesTab.pathologyTab.addAll', 'Ajouter tout')} ({renderable.length})
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {renderable.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">
                      {t(
                        'exercisesTab.pathologyTab.noBankItems',
                        'Pas d’exercice banque lié — voir la fiche détail pour les consignes texte.'
                      )}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {renderable.map((it) => {
                        const sk = selectionKeyForItem(it.type, it.key);
                        const isSel = selected.has(sk);
                        if (it.type === 'stretch') {
                          return (
                            <PathologyStretchCard
                              key={sk}
                              stretch={it.stretch}
                              dosage={it.dosage}
                              ratingForCard={ratings[it.key]}
                              selected={isSel}
                              showSelect={isAuthenticated}
                              onToggleSelect={() => toggleSelect(it.type, it.key)}
                              onOpen={() => setStretchDetailKey(it.key)}
                              onRequestAddToProgram={
                                isAuthenticated
                                  ? (p) => handleSingleStretchAdd(p, it.dosage, it.stretch)
                                  : undefined
                              }
                            />
                          );
                        }
                        return (
                          <PathologyExerciseCardWrap
                            key={sk}
                            item={it}
                            selected={isSel}
                            showSelect={isAuthenticated}
                            onToggleSelect={() => toggleSelect(it.type, it.key)}
                            data={data}
                            intensityCoeffs={intensityCoeffs}
                            maxRecordsByExerciseId={maxRecordsByExerciseId}
                            onOpenExercise={onOpenExercise}
                            onRequestAddToProgram={
                              isAuthenticated ? handleSingleExerciseAdd : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      {isAuthenticated && selectedRenderable.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex w-[min(100%,28rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[#0F5C45]/70 bg-black/95 px-4 py-3 shadow-2xl shadow-teal-950/50 backdrop-blur">
          <span className="text-sm text-teal-100">
            {selectedRenderable.length} sélectionné{selectedRenderable.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() =>
                openBulkAdd(
                  selectedRenderable,
                  t('exercisesTab.pathologyTab.selectionLabel', 'Sélection pathologies')
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F5C45]/60 bg-[#0F5C45]/40 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('exercisesTab.pathologyTab.addSelection', 'Ajouter au programme')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
