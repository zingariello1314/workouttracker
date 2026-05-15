/**
 * 🧘 STRETCH SLOTS EDITOR — Édition des étirements d'un jour de programme
 *
 * Pour chaque moment (matin / midi / soir) :
 *   • affiche UNE carte par étirement individuel (nom + zone + durée + actions)
 *   • bouton « Modifier » : édition nom + consignes (surcharges persistées si ≠ banque)
 *   • boutons : monter / descendre / supprimer
 *   • bouton "+ Ajouter" qui ouvre un picker avec recherche live dans la banque
 *
 * Le composant gère aussi la conversion des formats legacy (string / objet enrichi)
 * vers le format canonique tableau au premier add/edit/delete (silencieux).
 *
 * @module StretchSlotsEditor
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Sunrise,
  Sun,
  Sunset,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Clock,
  Target,
  X,
  Pencil
} from 'lucide-react';
import Button from '../ui/Button';
import {
  stretchDatabase,
  searchStretches,
  STRETCH_CATEGORIES,
  STRETCH_BODY_ZONES
} from '../../data/stretchDatabase';
import {
  normalizeStretchSlots,
  buildDefaultStretchId,
  STRETCH_MOMENTS
} from '../../utils/stretchUtils';

const MOMENT_META = {
  matin: { label: 'Matin', Icon: Sunrise, accent: 'text-amber-300' },
  midi: { label: 'Midi', Icon: Sun, accent: 'text-sky-300' },
  soir: { label: 'Soir', Icon: Sunset, accent: 'text-indigo-300' }
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem === 0 ? `${min} min` : `${min}m${rem}s`;
}

/**
 * Génère un ID unique pour un nouvel item ajouté.
 * Préfère un ID dérivé du jour/moment (range 9000-9999) ; à défaut, timestamp + random.
 */
function generateNewItemId(dayKey, moment, existingItems) {
  const used = new Set(existingItems.map((it) => it.id));
  for (let idx = 1; idx <= 9; idx++) {
    const candidate = buildDefaultStretchId(dayKey, moment, idx);
    if (candidate && !used.has(candidate)) return candidate;
  }
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Convertit la slot canonique `{matin:[items], midi:[items], soir:[items]}`
 * (sortie de `normalizeStretchSlots`) en représentation BRUTE compacte
 * `{matin:[{id, stretchKey, duration}], ...}` à persister dans le programme.
 */
function slotsToRawEtirements(slots) {
  const out = { matin: [], midi: [], soir: [] };
  for (const moment of STRETCH_MOMENTS) {
    for (const item of slots[moment] || []) {
      const raw = {
        id: item.id,
        duration: Math.max(5, Math.round(Number(item.duration)) || 60)
      };
      if (item.stretchKey) {
        raw.stretchKey = item.stretchKey;
        const db = stretchDatabase[item.stretchKey];
        if (db) {
          const nm = String(item.name || '').trim();
          const ins = String(item.instructions || item.legacyText || '').trim();
          const dbName = String(db.name || '').trim();
          const dbIns = String(db.instructions || '').trim();
          if (nm && nm !== dbName) raw.name = nm;
          if (ins && ins !== dbIns) raw.instructions = ins;
        }
      } else {
        if (item.name) raw.name = item.name;
        if (item.instructions || item.legacyText) raw.instructions = item.instructions || item.legacyText;
      }
      out[moment].push(raw);
    }
  }
  return out;
}

const stretchEditKey = (moment, id) => `${moment}::${id}`;

const StretchSlotsEditor = memo(({ dayKey, etirements, onChange }) => {
  const slots = useMemo(() => normalizeStretchSlots(etirements, dayKey), [etirements, dayKey]);
  const [pickerMoment, setPickerMoment] = useState(null);
  /** Édition nom + consignes (clé moment::id) */
  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', instructions: '' });

  const updateSlots = useCallback(
    (mutator) => {
      const next = {
        matin: [...(slots.matin || [])],
        midi: [...(slots.midi || [])],
        soir: [...(slots.soir || [])]
      };
      mutator(next);
      onChange(slotsToRawEtirements(next));
    },
    [slots, onChange]
  );

  const handleAdd = useCallback(
    (moment, stretchKey) => {
      const dbEntry = stretchDatabase[stretchKey];
      if (!dbEntry) return;
      updateSlots((next) => {
        const id = generateNewItemId(dayKey, moment, next[moment]);
        next[moment].push({
          id,
          moment,
          stretchKey,
          name: dbEntry.name,
          duration: dbEntry.defaultDuration || 60,
          instructions: dbEntry.instructions || '',
          bodyZone: dbEntry.bodyZone || 'full',
          primaryMuscles: dbEntry.primaryMuscles || [],
          fromBank: true
        });
      });
      setPickerMoment(null);
    },
    [dayKey, updateSlots]
  );

  const handleRemove = useCallback(
    (moment, itemId) => {
      updateSlots((next) => {
        next[moment] = next[moment].filter((it) => it.id !== itemId);
      });
    },
    [updateSlots]
  );

  const handleMove = useCallback(
    (moment, itemId, direction) => {
      updateSlots((next) => {
        const arr = next[moment];
        const idx = arr.findIndex((it) => it.id === itemId);
        if (idx < 0) return;
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= arr.length) return;
        [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
      });
    },
    [updateSlots]
  );

  const handleEditDuration = useCallback(
    (moment, itemId, secondsRaw) => {
      const seconds = Math.max(5, Math.min(3600, parseInt(secondsRaw, 10) || 0));
      updateSlots((next) => {
        const item = next[moment].find((it) => it.id === itemId);
        if (item) item.duration = seconds;
      });
    },
    [updateSlots]
  );

  const openStretchEditor = useCallback((moment, item) => {
    setEditingKey(stretchEditKey(moment, item.id));
    setEditDraft({
      name: String(item.name || '').trim(),
      instructions: String(item.instructions || item.legacyText || '').trim()
    });
  }, []);

  const cancelStretchEditor = useCallback(() => {
    setEditingKey(null);
    setEditDraft({ name: '', instructions: '' });
  }, []);

  const saveStretchEditor = useCallback(
    (moment, itemId) => {
      const name = String(editDraft.name || '').trim();
      const instructions = String(editDraft.instructions || '').trim();
      updateSlots((next) => {
        const item = next[moment].find((it) => it.id === itemId);
        if (!item) return;
        item.name = name || item.name || 'Étirement';
        item.instructions = instructions;
        if (item.legacyText) item.legacyText = null;
      });
      cancelStretchEditor();
    },
    [editDraft.instructions, editDraft.name, updateSlots, cancelStretchEditor]
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {STRETCH_MOMENTS.map((moment) => {
          const items = slots[moment] || [];
          const meta = MOMENT_META[moment];
          const { Icon } = meta;
          return (
            <div
              key={moment}
              className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Icon size={16} className={meta.accent} />
                  {meta.label}
                  <span className="text-xs text-slate-400 font-normal">({items.length})</span>
                </h4>
                <Button
                  type="button"
                  onClick={() => setPickerMoment(moment)}
                  className="bg-teal-700/30 hover:bg-teal-600/40 border border-teal-500/40 text-teal-100 px-2 py-1 text-xs flex items-center gap-1"
                >
                  <Plus size={12} />
                  Ajouter
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucun étirement planifié pour ce moment.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, idx) => {
                    const rowKey = stretchEditKey(moment, item.id);
                    const isEditing = editingKey === rowKey;
                    return (
                    <li
                      key={item.id}
                      className="rounded border border-slate-700/50 bg-slate-900/40 p-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {!isEditing ? (
                            <div className="text-sm font-medium text-slate-100 leading-snug truncate" title={item.name}>
                              {item.name}
                            </div>
                          ) : (
                            <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                              Nom
                              <input
                                type="text"
                                value={editDraft.name}
                                onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                                className="mt-0.5 w-full rounded border border-slate-600 bg-black px-2 py-1 text-sm text-slate-100"
                                maxLength={200}
                              />
                            </label>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                            {item.bodyZone && item.bodyZone !== 'full' && (
                              <span className="inline-flex items-center gap-0.5 capitalize">
                                <Target size={10} />
                                {item.bodyZone}
                              </span>
                            )}
                            {!item.fromBank && (
                              <span className="text-amber-400">[hors banque]</span>
                            )}
                          </div>
                          {isEditing ? (
                            <label className="mt-2 block text-[10px] uppercase tracking-wide text-slate-500">
                              Consignes
                              <textarea
                                value={editDraft.instructions}
                                onChange={(e) => setEditDraft((d) => ({ ...d, instructions: e.target.value }))}
                                rows={4}
                                className="mt-0.5 w-full resize-y rounded border border-slate-600 bg-black px-2 py-1.5 text-xs text-slate-200"
                                placeholder="Notes pour toi (exécution, reps de respiration…)"
                              />
                            </label>
                          ) : null}
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <div className="flex items-center gap-1">
                              <Clock size={10} className="text-slate-500" />
                              <input
                                type="number"
                                min="5"
                                max="3600"
                                step="5"
                                value={item.duration}
                                onChange={(e) => handleEditDuration(moment, item.id, e.target.value)}
                                className="w-14 bg-black border border-slate-700 rounded px-1 py-0.5 text-[11px] text-slate-200"
                                aria-label="Durée en secondes"
                              />
                              <span className="text-[10px] text-slate-500">s ({formatDuration(item.duration)})</span>
                            </div>
                            {!isEditing ? (
                              <button
                                type="button"
                                onClick={() => openStretchEditor(moment, item)}
                                className="inline-flex items-center gap-1 rounded border border-teal-600/50 bg-teal-950/40 px-2 py-0.5 text-[11px] font-medium text-teal-200 hover:bg-teal-900/50"
                              >
                                <Pencil size={11} />
                                Modifier
                              </button>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveStretchEditor(moment, item.id)}
                                  className="rounded border border-emerald-600/60 bg-emerald-950/50 px-2 py-0.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-900/50"
                                >
                                  Enregistrer
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelStretchEditor}
                                  className="rounded border border-slate-600 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800/60"
                                >
                                  Annuler
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(moment, item.id, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Monter"
                          >
                            <ChevronUp size={12} className="text-slate-300" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(moment, item.id, 'down')}
                            disabled={idx === items.length - 1}
                            className="p-1 rounded hover:bg-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Descendre"
                          >
                            <ChevronDown size={12} className="text-slate-300" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(moment, item.id)}
                            className="p-1 rounded hover:bg-red-900/40 text-red-300"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {pickerMoment && (
        <StretchPickerModal
          moment={pickerMoment}
          alreadyUsedKeys={new Set(
            (slots[pickerMoment] || []).map((it) => it.stretchKey).filter(Boolean)
          )}
          onPick={(stretchKey) => handleAdd(pickerMoment, stretchKey)}
          onClose={() => setPickerMoment(null)}
        />
      )}
    </div>
  );
});

StretchSlotsEditor.displayName = 'StretchSlotsEditor';

// ─────────────────────────────────────────────────────────────────────────────
// PICKER MODAL — recherche live dans la banque d'étirements
// ─────────────────────────────────────────────────────────────────────────────

const StretchPickerModal = memo(({ moment, alreadyUsedKeys, onPick, onClose }) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  const results = useMemo(() => {
    let list = searchStretches(query);
    if (categoryFilter) list = list.filter((s) => s.category === categoryFilter);
    if (zoneFilter) list = list.filter((s) => s.bodyZone === zoneFilter);
    return list;
  }, [query, categoryFilter, zoneFilter]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sélection d'un étirement à ajouter"
    >
      <div
        className="bg-slate-950 border border-teal-500/30 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">
            Ajouter un étirement —{' '}
            <span className="text-teal-300 capitalize">{moment}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (ex. dos, psoas, respi, sphinx, hanches…)"
              className="w-full pl-8 pr-3 py-2 bg-black border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-black border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="">Toutes zones</option>
              {STRETCH_BODY_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <span className="ml-auto text-xs text-slate-400 self-center">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-2 py-2 space-y-1">
          {results.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-12">
              Aucun étirement trouvé. Essaie un autre mot-clé (ex. "respi", "épaules", "yoga").
            </div>
          )}
          {results.map((s) => {
            const isAlreadyUsed = alreadyUsedKeys.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onPick(s.key)}
                disabled={isAlreadyUsed}
                className={[
                  'w-full text-left px-3 py-2 rounded border transition-colors',
                  isAlreadyUsed
                    ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900/40 hover:bg-teal-900/30 hover:border-teal-500/50'
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{s.name}</div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-200 capitalize">
                        {s.bodyZone}
                      </span>
                      <span className="text-slate-500">{s.category}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock size={10} />
                        {formatDuration(s.defaultDuration)}
                      </span>
                      {s.primaryMuscles?.length > 0 && (
                        <span className="text-slate-500 truncate" title={s.primaryMuscles.join(', ')}>
                          {s.primaryMuscles.slice(0, 2).join(', ')}
                          {s.primaryMuscles.length > 2 ? `…` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAlreadyUsed ? (
                    <span className="text-[10px] text-slate-500 self-center">déjà ajouté</span>
                  ) : (
                    <Plus size={16} className="text-teal-300 shrink-0 self-center" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500">
          Astuce : tape un mot-clé (ex. <span className="text-teal-300">dos</span>,{' '}
          <span className="text-teal-300">psoas</span>,{' '}
          <span className="text-teal-300">respi</span>) — la recherche utilise les synonymes anatomiques.
        </div>
      </div>
    </div>
  );
});

StretchPickerModal.displayName = 'StretchPickerModal';

export default StretchSlotsEditor;
