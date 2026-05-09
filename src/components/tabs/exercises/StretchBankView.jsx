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
  RotateCcw
} from 'lucide-react';
import Card, { CardContent } from '../../ui/Card';
import {
  stretchDatabase,
  searchStretches,
  STRETCH_CATEGORIES,
  STRETCH_BODY_ZONES,
  listStretches
} from '../../../data/stretchDatabase';
import StretchDetailPage, { computeStretchXpFromRating } from './StretchDetailPage';

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

const StretchCard = ({ stretch, ratingForCard, onOpen }) => {
  const xpPerCheck = computeStretchXpFromRating(ratingForCard);
  const noteCount = [ratingForCard?.difficulty, ratingForCard?.enjoyment, ratingForCard?.recovery]
    .filter((n) => n > 0).length;
  const avgNote = noteCount > 0
    ? (
        ((ratingForCard?.difficulty || 0) +
          (ratingForCard?.enjoyment || 0) +
          (ratingForCard?.recovery || 0)) /
        noteCount
      ).toFixed(1)
    : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(stretch)}
      className="text-left rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800/60 hover:border-teal-500/40 transition p-3 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white leading-snug flex-1 min-w-0">
          {stretch.name}
        </h4>
        <span className="shrink-0 text-[10px] text-slate-500 inline-flex items-center gap-0.5 tabular-nums">
          <Star className="w-3 h-3 text-amber-400" />
          {xpPerCheck} XP
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
        <span className="px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-200 inline-flex items-center gap-1 capitalize">
          <Target className="w-3 h-3" />
          {stretch.bodyZone}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
          {stretch.category}
        </span>
        <span className="text-slate-500 inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(stretch.defaultDuration)}
        </span>
        <span className="text-slate-500">
          Niv. {stretch.difficulty}/4
        </span>
      </div>

      {stretch.primaryMuscles?.length > 0 && (
        <div className="text-[10px] text-slate-500 truncate" title={stretch.primaryMuscles.join(', ')}>
          {stretch.primaryMuscles.slice(0, 3).join(' · ')}
          {stretch.primaryMuscles.length > 3 ? '…' : ''}
        </div>
      )}

      <div className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
        {stretch.description}
      </div>

      {avgNote !== null && (
        <div className="flex items-center justify-between text-[10px] text-amber-300/80 pt-1 border-t border-slate-800">
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3 h-3" />
            Note moyenne : {avgNote}/10
          </span>
          <span className="text-slate-500">{noteCount} critère{noteCount > 1 ? 's' : ''} évalué{noteCount > 1 ? 's' : ''}</span>
        </div>
      )}
    </button>
  );
};

const StretchBankView = ({ data, updateData, readOnly = false }) => {
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
    (stretchKey) => {
      const r = ratings[stretchKey];
      return Boolean(r && (r.difficulty > 0 || r.enjoyment > 0 || r.recovery > 0));
    },
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

    return sorted;
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
    const ratedKeys = Object.keys(ratings).filter((k) => {
      const r = ratings[k];
      return r && (r.difficulty > 0 || r.enjoyment > 0 || r.recovery > 0);
    });
    return {
      total: all.length,
      categories: STRETCH_CATEGORIES.length,
      zones: STRETCH_BODY_ZONES.length,
      rated: ratedKeys.length
    };
  }, [ratings]);

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
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((stretch) => (
            <StretchCard
              key={stretch.key}
              stretch={stretch}
              ratingForCard={ratings[stretch.key]}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StretchBankView;
