/**
 * 🧘 STRETCH BANK VIEW — Vue principale "Banque d'étirements"
 *
 * Liste l'intégralité de la `stretchDatabase` :
 *   • barre de recherche live (synonymes anatomiques : "dos", "psoas", "respi"…)
 *   • filtres par catégorie + zone du corps + difficulté
 *   • 1 carte par étirement avec moyenne des étoiles utilisateur + XP par coche
 *   • clic → ouvre StretchDetailPage (notation, notes perso)
 *
 * @module StretchBankView
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  Search,
  Target,
  Clock,
  Heart,
  Activity,
  Star,
  RotateCcw,
  Plus
} from 'lucide-react';
import Card, { CardContent } from '../../ui/Card';
import {
  stretchDatabase,
  searchStretches,
  STRETCH_CATEGORIES,
  STRETCH_BODY_ZONES,
  listStretches
} from '../../../data/stretchDatabase';
import StretchDetailPage from './StretchDetailPage';
import {
  computeStretchXpFromRating,
  computeStretchWeightedGlobal5,
  stretchStorageToDraft,
  stretchRatingHasAnswers
} from '../../../utils/stretchPerceivedRatings';
import AnatomyBankCardPreview from '../../anatomy/AnatomyBankCardPreview';
import { sortStretchesByFamily, getStretchFamilyKey, getStretchFamilyLabel } from '../../../utils/bankFamilySort';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r === 0 ? `${m} min` : `${m}m${r}s`;
}

/**
 * Regroupe la valeur brute `equipment` (très variée dans la banque) en quelques
 * familles utilisables pour le filtre UI sans se noyer dans les 30+ libellés.
 *
 * Retourne `null` quand la valeur ne match aucune famille (sera classée dans "Autre").
 */
function classifyEquipment(rawEquipment) {
  const eq = String(rawEquipment || '').toLowerCase();
  if (!eq) return 'aucun';
  if (eq.startsWith('aucun') || eq === 'sol' || eq.startsWith('tapis')) return 'aucun';
  if (eq.includes('mur')) return 'mur';
  if (eq.includes('sangle')) return 'sangle';
  if (eq.includes('élastique') || eq.includes('elastique')) return 'elastique';
  if (eq.includes('rouleau')) return 'rouleau';
  if (eq.includes('balle')) return 'balle';
  if (eq.includes('coussin') || eq.includes('bolster')) return 'coussin';
  if (eq.includes('chaise') || eq.includes('canapé') || eq.includes('canape') || eq.includes('banc') || eq.includes('marche')) {
    return 'banc';
  }
  if (eq.includes('barre') || eq.includes('rack') || eq.includes('chambranle') || eq.includes('cadre de porte')) return 'barre';
  if (eq.includes('serviette') || eq.includes('bâton') || eq.includes('baton') || eq.includes('haltère') || eq.includes('halt') || eq.includes('plaque') || eq.includes('lit') || eq.includes('table')) {
    return 'petitMateriel';
  }
  return 'autre';
}

const EQUIPMENT_BUCKETS = [
  { id: 'aucun', label: 'Aucun matériel (sol / tapis)' },
  { id: 'mur', label: 'Mur' },
  { id: 'sangle', label: 'Sangle' },
  { id: 'elastique', label: 'Élastique' },
  { id: 'rouleau', label: 'Rouleau mousse' },
  { id: 'balle', label: 'Balle de massage' },
  { id: 'coussin', label: 'Coussin / bolster' },
  { id: 'banc', label: 'Banc / chaise' },
  { id: 'barre', label: 'Barre / chambranle' },
  { id: 'petitMateriel', label: 'Petit matériel (serviette, bâton, haltère léger…)' },
  { id: 'autre', label: 'Autre' }
];

const SORT_OPTIONS = [
  { id: 'name', label: 'Nom (A → Z)' },
  { id: 'difficultyAsc', label: 'Niveau croissant' },
  { id: 'difficultyDesc', label: 'Niveau décroissant' },
  { id: 'durationAsc', label: 'Durée croissante' },
  { id: 'durationDesc', label: 'Durée décroissante' },
  { id: 'category', label: 'Catégorie' }
];

const RATED_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'rated', label: 'Déjà notés' },
  { id: 'unrated', label: 'Jamais notés' }
];

const DURATION_BUCKETS = [
  { id: 'any', label: 'Toute durée' },
  { id: 'lt60', label: '≤ 1 min' },
  { id: 'lt120', label: '≤ 2 min' },
  { id: 'lt240', label: '≤ 4 min' },
  { id: 'gt240', label: '≥ 4 min (longs)' }
];

const StretchCard = ({ stretch, ratingForCard, onOpen, onRequestAddToProgram }) => {
  const xpPerCheck = computeStretchXpFromRating(ratingForCard);
  const global5 = computeStretchWeightedGlobal5(stretchStorageToDraft(ratingForCard || {}));
  const avgNote = global5 != null ? (Math.round(global5 * 10) / 10).toFixed(1) : null;

  const open = () => onOpen(stretch);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="group text-left rounded-xl border-2 border-[#0F4C5C]/85 bg-black shadow-lg shadow-black/40 hover:border-[#0F5C45]/80 hover:shadow-[0_0_24px_-8px_rgba(15,92,69,0.45)] transition-all duration-200 p-5 grid h-full min-h-[32rem] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45
        grid-rows-[auto_auto_auto_300px_auto_auto_minmax(3.25rem,1fr)_auto]
        gap-3"
    >
      <div className="row-start-1 flex shrink-0 min-h-[3.75rem] items-start justify-between gap-3 border-b border-[#0F4C5C]/35 pb-3">
        <div className="min-w-0 flex-1 flex flex-col justify-start gap-1">
          <h4 className="text-sm font-semibold text-white leading-snug tracking-tight line-clamp-2 min-h-[2.5rem]">
            {stretch.name}
          </h4>
        </div>
        <span className="shrink-0 self-start text-[10px] text-teal-600/90 inline-flex items-center gap-0.5 tabular-nums rounded-md border border-[#0F4C5C]/50 bg-black px-2 py-0.5">
          <Star className="w-3 h-3 text-amber-400" />
          {xpPerCheck} XP
        </span>
      </div>

      <div className="row-start-2 flex min-h-[2.875rem] flex-col justify-start" data-no-drag-scroll>
        {onRequestAddToProgram ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestAddToProgram({
                kind: 'stretch',
                stretchKey: stretch.key,
                stretchLabel: stretch.name
              });
            }}
            className="inline-flex w-fit max-w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#0F5C45] bg-[#0F5C45]/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_0_16px_-6px_rgba(15,92,69,0.55)] transition hover:bg-[#0F5C45]/65 focus:outline-none focus:ring-2 focus:ring-teal-300/40"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Ajouter au programme
          </button>
        ) : (
          <span className="invisible text-xs py-2" aria-hidden>
            Ajouter
          </span>
        )}
      </div>

      <div className="row-start-3 flex min-h-[3.25rem] shrink-0 flex-wrap content-start items-start gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-md border border-[#0F5C45]/45 bg-[#0F5C45]/15 text-teal-100 inline-flex items-center gap-1 capitalize">
          <Target className="w-3 h-3 text-teal-400 shrink-0" />
          {stretch.bodyZone}
        </span>
        <span className="px-2 py-0.5 rounded-md border border-[#0F4C5C]/50 bg-black text-teal-200/90">
          {stretch.category}
        </span>
        <span className="text-teal-700 inline-flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          {formatDuration(stretch.defaultDuration)}
        </span>
        <span className="text-teal-700 tabular-nums">Niv. {stretch.difficulty}/4</span>
      </div>

      <div className="row-start-4 flex h-[300px] w-full min-h-0 shrink-0 overflow-hidden [&>*]:min-h-0">
        <AnatomyBankCardPreview
          primaryMuscles={stretch.primaryMuscles}
          secondaryMuscles={stretch.secondaryMuscles}
          mode="stretch"
          layout="gridFill"
          stretchDatabaseKey={stretch.key}
        />
      </div>

      {(stretch.primaryMuscles?.length > 0 || stretch.secondaryMuscles?.length > 0) ? (
        <div className="row-start-5 space-y-1 min-h-[2.75rem]">
          {stretch.primaryMuscles?.length > 0 && (
            <div className="text-[10px] text-teal-600/90 leading-snug" title={stretch.primaryMuscles.join(', ')}>
              <span className="text-teal-800 uppercase tracking-wide font-medium">Primaires · </span>
              <span className="text-teal-100/85">
                {stretch.primaryMuscles.slice(0, 4).join(' · ')}
                {stretch.primaryMuscles.length > 4 ? '…' : ''}
              </span>
            </div>
          )}
          {stretch.secondaryMuscles?.length > 0 && (
            <div className="text-[10px] text-slate-500 leading-snug line-clamp-2" title={stretch.secondaryMuscles.join(', ')}>
              <span className="text-slate-600 uppercase tracking-wide font-medium">Secondaires · </span>
              {stretch.secondaryMuscles.slice(0, 3).join(' · ')}
              {stretch.secondaryMuscles.length > 3 ? '…' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="row-start-5 min-h-[2.75rem]" aria-hidden />
      )}

      <div className="row-start-6 flex min-h-[2.25rem] items-center border-t border-[#0F4C5C]/35 pt-2">
        {avgNote !== null ? (
          <div className="flex w-full items-center justify-between text-[10px] text-amber-300/90">
            <span className="inline-flex items-center gap-1">
              <Heart className="w-3 h-3 shrink-0" />
              Note pondérée : {avgNote}/5
            </span>
            <span className="text-teal-600/85 text-[9px] uppercase tracking-wide shrink-0">pondéré</span>
          </div>
        ) : (
          <div className="text-[10px] text-transparent select-none" aria-hidden>
            —
          </div>
        )}
      </div>

      <p className="row-start-7 text-[11px] text-teal-100/75 line-clamp-3 leading-relaxed border-t border-[#0F4C5C]/30 pt-3 min-h-[3.75rem]">
        {stretch.description}
      </p>
    </div>
  );
};

const StretchBankView = ({
  data,
  updateData,
  readOnly = false,
  onRequestAddToProgram,
  sportPrograms = [],
  onOpenComplementaryExercise,
  maxRecordsByExerciseId,
  isAuthenticated = false
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [durationBucket, setDurationBucket] = useState('any');
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(4);
  const [ratedFilter, setRatedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [detailKey, setDetailKey] = useState(null);

  const ratings = data?.stretchPerceivedRatings || {};

  const isRated = useCallback(
    (stretchKey) => stretchRatingHasAnswers(ratings[stretchKey]),
    [ratings]
  );

  /** Liste triée des muscles primaires uniques (pour le filtre dédié). */
  const allPrimaryMuscles = useMemo(() => {
    const set = new Set();
    listStretches().forEach((s) => {
      (s.primaryMuscles || []).forEach((m) => {
        if (m && typeof m === 'string') set.add(m);
      });
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, []);

  const filtered = useMemo(() => {
    let list = query ? searchStretches(query) : listStretches();

    if (categoryFilter) list = list.filter((s) => s.category === categoryFilter);
    if (zoneFilter) list = list.filter((s) => s.bodyZone === zoneFilter);
    if (muscleFilter) {
      list = list.filter(
        (s) =>
          (s.primaryMuscles || []).includes(muscleFilter) ||
          (s.secondaryMuscles || []).includes(muscleFilter)
      );
    }
    if (equipmentFilter) {
      list = list.filter((s) => classifyEquipment(s.equipment) === equipmentFilter);
    }
    if (durationBucket !== 'any') {
      list = list.filter((s) => {
        const d = Number(s.defaultDuration) || 0;
        switch (durationBucket) {
          case 'lt60':
            return d <= 60;
          case 'lt120':
            return d <= 120;
          case 'lt240':
            return d <= 240;
          case 'gt240':
            return d >= 240;
          default:
            return true;
        }
      });
    }
    if (minDifficulty > 1 || maxDifficulty < 4) {
      list = list.filter((s) => {
        const d = s.difficulty || 1;
        return d >= minDifficulty && d <= maxDifficulty;
      });
    }
    if (ratedFilter !== 'all') {
      list = list.filter((s) => {
        const rated = isRated(s.key);
        return ratedFilter === 'rated' ? rated : !rated;
      });
    }

    const sorted = [...list];
    switch (sortBy) {
      case 'difficultyAsc':
        sorted.sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
        break;
      case 'difficultyDesc':
        sorted.sort((a, b) => (b.difficulty || 1) - (a.difficulty || 1));
        break;
      case 'durationAsc':
        sorted.sort((a, b) => (a.defaultDuration || 0) - (b.defaultDuration || 0));
        break;
      case 'durationDesc':
        sorted.sort((a, b) => (b.defaultDuration || 0) - (a.defaultDuration || 0));
        break;
      case 'category':
        sorted.sort((a, b) =>
          String(a.category || '').localeCompare(String(b.category || ''), 'fr')
        );
        break;
      case 'name':
      default:
        sorted.sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'fr')
        );
        break;
    }

    return sortStretchesByFamily(sorted);
  }, [
    query,
    categoryFilter,
    zoneFilter,
    muscleFilter,
    equipmentFilter,
    durationBucket,
    minDifficulty,
    maxDifficulty,
    ratedFilter,
    sortBy,
    isRated
  ]);

  const stats = useMemo(() => {
    const all = listStretches();
    const ratedKeys = Object.keys(ratings).filter((k) => stretchRatingHasAnswers(ratings[k]));
    return {
      total: all.length,
      categories: STRETCH_CATEGORIES.length,
      zones: STRETCH_BODY_ZONES.length,
      rated: ratedKeys.length
    };
  }, [ratings]);

  const groupedStretches = useMemo(() => {
    const baseOrder = ['respiration', 'drills_course', 'upper_mobility', 'back', 'lower_mobility', 'full_body'];
    const map = new Map();
    filtered.forEach((stretch) => {
      const key = getStretchFamilyKey(stretch);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(stretch);
    });
    const order = [
      ...baseOrder,
      ...Array.from(map.keys()).filter((k) => !baseOrder.includes(k))
    ];
    return order
      .map((key) => {
        const rows = map.get(key) || [];
        if (rows.length === 0) return null;
        const byCategory = new Map();
        rows.forEach((row) => {
          const cat = String(row.category || 'Autres');
          if (!byCategory.has(cat)) byCategory.set(cat, []);
          byCategory.get(cat).push(row);
        });
        const categories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b, 'fr'));
        return {
          key,
          label: getStretchFamilyLabel(rows[0]),
          categorySummary: categories.join(' · '),
          groups: categories.map((cat) => ({
            category: cat,
            rows: byCategory.get(cat) || []
          }))
        };
      })
      .filter(Boolean);
  }, [filtered]);

  const handleOpen = useCallback((stretch) => {
    setDetailKey(stretch.key);
  }, []);

  const handleBack = useCallback(() => setDetailKey(null), []);

  const resetFilters = useCallback(() => {
    setQuery('');
    setCategoryFilter('');
    setZoneFilter('');
    setMuscleFilter('');
    setEquipmentFilter('');
    setDurationBucket('any');
    setMinDifficulty(1);
    setMaxDifficulty(4);
    setRatedFilter('all');
    setSortBy('name');
  }, []);

  const hasActiveFilters =
    Boolean(query) ||
    Boolean(categoryFilter) ||
    Boolean(zoneFilter) ||
    Boolean(muscleFilter) ||
    Boolean(equipmentFilter) ||
    durationBucket !== 'any' ||
    minDifficulty > 1 ||
    maxDifficulty < 4 ||
    ratedFilter !== 'all' ||
    sortBy !== 'name';

  if (detailKey) {
    const stretch = stretchDatabase[detailKey];
    return (
      <StretchDetailPage
        stretch={{ ...stretch, key: detailKey }}
        stretchKey={detailKey}
        data={data}
        updateData={updateData}
        readOnly={readOnly}
        onBack={handleBack}
        sportPrograms={sportPrograms}
        onOpenComplementaryExercise={onOpenComplementaryExercise}
        maxRecordsByExerciseId={maxRecordsByExerciseId}
        onRequestAddToProgram={readOnly ? undefined : onRequestAddToProgram}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="sport">
          <CardContent className="p-3">
            <p className="text-[11px] text-slate-400">Étirements en banque</p>
            <p className="text-xl font-bold text-white tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card variant="sport">
          <CardContent className="p-3">
            <p className="text-[11px] text-slate-400">Catégories</p>
            <p className="text-xl font-bold text-white tabular-nums">{stats.categories}</p>
          </CardContent>
        </Card>
        <Card variant="sport">
          <CardContent className="p-3">
            <p className="text-[11px] text-slate-400">Zones du corps</p>
            <p className="text-xl font-bold text-white tabular-nums">{stats.zones}</p>
          </CardContent>
        </Card>
        <Card variant="sport">
          <CardContent className="p-3">
            <p className="text-[11px] text-slate-400">Étirements notés</p>
            <p className="text-xl font-bold text-amber-300 tabular-nums">{stats.rated}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="sport">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un étirement (ex. dos, psoas, respi, hanches, sphinx…)"
              className="w-full pl-9 pr-3 py-2 bg-black border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Catégorie
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="">Toutes catégories</option>
                {STRETCH_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Zone du corps
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 capitalize"
              >
                <option value="">Toutes zones</option>
                {STRETCH_BODY_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Muscle ciblé
              <select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="">Tous muscles</option>
                {allPrimaryMuscles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Matériel
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="">Tout matériel</option>
                {EQUIPMENT_BUCKETS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Durée
              <select
                value={durationBucket}
                onChange={(e) => setDurationBucket(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                {DURATION_BUCKETS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Notes utilisateur
              <select
                value={ratedFilter}
                onChange={(e) => setRatedFilter(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                {RATED_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Niveau min
              <select
                value={minDifficulty}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMinDifficulty(next);
                  if (next > maxDifficulty) setMaxDifficulty(next);
                }}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value={1}>1 (facile)</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4 (avancé)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Niveau max
              <select
                value={maxDifficulty}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMaxDifficulty(next);
                  if (next < minDifficulty) setMinDifficulty(next);
                }}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value={1}>1 (facile)</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4 (avancé)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Tri
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={[
                'inline-flex items-center gap-1 text-[11px] rounded px-2 py-1 border transition',
                hasActiveFilters
                  ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-800 text-slate-600 cursor-not-allowed'
              ].join(' ')}
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser les filtres
            </button>
            <span className="text-xs text-slate-400 tabular-nums">
              {filtered.length} / {stats.total} étirement{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card variant="sport">
          <CardContent className="py-10 text-center">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aucun étirement ne correspond à ces filtres.</p>
            <p className="text-xs text-slate-500 mt-1">Essaie un autre mot-clé ou réinitialise les filtres.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedStretches.map((group) => (
            <section key={group.key} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-200 border-b border-[#0F4C5C]/50 pb-2">
                {group.label} ({group.groups.reduce((n, g) => n + g.rows.length, 0)})
              </h3>
              <p className="text-xs text-teal-400/85 -mt-1">{group.categorySummary}</p>
              {group.groups.map((sub) => (
                <div key={`${group.key}-${sub.category}`} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-teal-300/90">{sub.category}</h4>
                  <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {sub.rows.map((stretch) => (
                      <StretchCard
                        key={stretch.key}
                        stretch={stretch}
                        ratingForCard={ratings[stretch.key]}
                        onOpen={handleOpen}
                        onRequestAddToProgram={readOnly ? undefined : onRequestAddToProgram}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default StretchBankView;
