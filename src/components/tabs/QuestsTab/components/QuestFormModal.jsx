/**
 * Composant modal pour créer/éditer une quête
 * 
 * ✅ PHASE 4 : Extraction du formulaire de quête
 * 
 * @module components/tabs/QuestsTab/components/QuestFormModal
 */

import React from 'react';
import {
  CATEGORIES,
  CRENEAUX,
  PRIERES,
  DIFFICULTIES,
  JOUR_OPTIONS,
  RECURRENCE_PRESETS,
  DURATION_OPTIONS,
  snapDureeToValidOption,
} from '../constants';
import { formatDuration } from '../utils';
import { qstatsMuted } from '../../../quests/stats/questsStatsTheme';

const MULTI_SLOT_LABELS = {
  matin: 'Matin',
  midi: 'Midi',
  'apres-midi': 'Après-midi',
  soir: 'Soir'
};

/**
 * Modal pour créer ou éditer une quête
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le modal est ouvert
 * @param {Function} props.onClose - Fonction pour fermer le modal
 * @param {Object} props.questForm - État du formulaire
 * @param {Function} props.setQuestForm - Fonction pour mettre à jour le formulaire
 * @param {boolean} props.isEditing - Si on est en mode édition
 * @param {Function} props.onSave - Fonction pour sauvegarder
 */
export const QuestFormModal = ({
  isOpen,
  onClose,
  questForm,
  setQuestForm,
  isEditing,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 backdrop-blur-sm px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
      <div className="rounded-2xl border-2 border-amber-400/75 bg-black max-w-lg w-full p-5 space-y-4 shadow-2xl shadow-black/60 max-h-[min(90dvh,calc(100vh-7rem))] overflow-y-auto my-2 sm:my-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-amber-50">
            {isEditing ? 'Modifier la quête' : 'Nouvelle quête'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-amber-600/50 bg-black/80 px-3 py-1.5 text-sm text-amber-200 hover:border-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-amber-200/90 mb-1">Nom</label>
            <input
              type="text"
              value={questForm.nom}
              onChange={(e) =>
                setQuestForm((prev) => ({ ...prev, nom: e.target.value }))
              }
              className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
            />
          </div>

          <div>
            <label className="block text-amber-200/90 mb-1">Description</label>
            <textarea
              rows={3}
              value={questForm.description}
              onChange={(e) =>
                setQuestForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-400/70"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-200/90 mb-1">Catégorie</label>
              <select
                value={questForm.categorie}
                onChange={(e) => {
                  const cat = e.target.value;
                  setQuestForm((prev) => ({
                    ...prev,
                    categorie: cat,
                    priere: cat === 'Prière' ? (prev.priere || 'fajr') : '',
                    completeWithTodaySportExercise:
                      cat === 'Sport' ? prev.completeWithTodaySportExercise : false,
                  }));
                }}
                className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-amber-200/90 mb-1">Difficulté</label>
              <select
                value={questForm.difficulte}
                onChange={(e) =>
                  setQuestForm((prev) => ({
                    ...prev,
                    difficulte: Number(e.target.value),
                  }))
                }
                className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {questForm.categorie === 'Sport' && (
            <label className="flex items-start gap-2.5 rounded-lg border border-amber-700/35 bg-amber-500/10 px-3 py-2.5 text-amber-100/95">
              <input
                type="checkbox"
                checked={Boolean(questForm.completeWithTodaySportExercise)}
                onChange={(e) =>
                  setQuestForm((prev) => ({
                    ...prev,
                    completeWithTodaySportExercise: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 shrink-0 rounded border-amber-500/60 bg-black/80 accent-amber-400"
              />
              <span>
                <span className="block font-medium text-amber-50">Lier à Aujourd’hui (Sport)</span>
                <span className="mt-0.5 block text-xs leading-snug text-amber-200/80">
                  Coche automatiquement cette quête le jour où tu marques au moins un exercice du programme comme
                  fait (onglet Sport → Aujourd’hui).
                </span>
              </span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-200/90 mb-1">Durée</label>
              <select
                value={snapDureeToValidOption(questForm.duree)}
                onChange={(e) =>
                  setQuestForm((prev) => ({
                    ...prev,
                    duree: Number(e.target.value),
                  }))
                }
                className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
              >
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {formatDuration(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-amber-200/90 mb-1">Type</label>
              <select
                value={questForm.type}
                onChange={(e) =>
                  setQuestForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
              >
                <option value="recurrente">Récurrente</option>
                <option value="exceptionnelle">Exceptionnelle</option>
              </select>
            </div>
          </div>

          {questForm.categorie === 'Prière' && (
            <div>
              <label className="block text-amber-200/90 mb-1">Quelle prière ?</label>
              <select
                value={questForm.priere || 'fajr'}
                onChange={(e) =>
                  setQuestForm((prev) => ({ ...prev, priere: e.target.value }))
                }
                className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
              >
                {PRIERES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className={`text-xs mt-0.5 ${qstatsMuted}`}>Heure calculée automatiquement selon ta position (Paramètres).</p>
            </div>
          )}

          {questForm.categorie !== 'Prière' && (
            <div className="space-y-2">
              <label className="block text-amber-200/90">Heure prévue (emploi du temps)</label>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 text-amber-200/90 cursor-pointer">
                  <input
                    type="radio"
                    name="heureType"
                    checked={questForm.heureType === 'creneau'}
                    onChange={() =>
                      setQuestForm((prev) => ({
                        ...prev,
                        heureType: 'creneau',
                        heure: '',
                        creneau: prev.creneau || 'matin',
                      }))
                    }
                    className="rounded border-amber-600/60 bg-black text-amber-400"
                  />
                  <span>Plage</span>
                </label>
                <label className="flex items-center gap-1.5 text-amber-200/90 cursor-pointer">
                  <input
                    type="radio"
                    name="heureType"
                    checked={questForm.heureType === 'precise'}
                    onChange={() =>
                      setQuestForm((prev) => ({
                        ...prev,
                        heureType: 'precise',
                        creneau: '',
                      }))
                    }
                    className="rounded border-amber-600/60 bg-black text-amber-400"
                  />
                  <span>Heure / Période</span>
                </label>
              </div>
              {questForm.heureType === 'creneau' ? (
                <select
                  value={questForm.creneau || 'matin'}
                  onChange={(e) =>
                    setQuestForm((prev) => ({ ...prev, creneau: e.target.value }))
                  }
                  className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
                >
                  {CRENEAUX.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="time"
                    value={questForm.heure || ''}
                    onChange={(e) =>
                      setQuestForm((prev) => ({ ...prev, heure: e.target.value || '' }))
                    }
                    className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
                    title="Optionnel : heure de début ; la fin = début + durée de la quête"
                  />
                  <p className={`text-xs ${qstatsMuted}`}>
                    Optionnel. Heure de début ; pour une période, la fin est calculée automatiquement (début + durée).
                  </p>
                </>
              )}
              <p className={`text-xs ${qstatsMuted}`}>Les quêtes sont triées par heure dans la vue Aujourd'hui.</p>
            </div>
          )}

          {!isEditing && questForm.categorie !== 'Prière' && (
            <div className="space-y-2 rounded-lg border border-amber-700/40 bg-black/60 p-3">
              <label className="flex items-center gap-2 text-xs text-amber-200/90">
                <input
                  type="checkbox"
                  checked={!!questForm.multiSlotsEnabled}
                  onChange={(e) =>
                    setQuestForm((prev) => ({
                      ...prev,
                      multiSlotsEnabled: e.target.checked
                    }))
                  }
                  className="rounded border-amber-600/60 bg-black text-amber-400"
                />
                Créer en multi-créneaux (matin / midi / après-midi / soir)
              </label>
              {questForm.multiSlotsEnabled && (
                <div className="space-y-2">
                  {(questForm.multiSlots || []).map((slotCfg, idx) => (
                    <div key={slotCfg.slot} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-amber-200/90 min-w-24">
                        <input
                          type="checkbox"
                          checked={!!slotCfg.enabled}
                          onChange={(e) =>
                            setQuestForm((prev) => ({
                              ...prev,
                              multiSlots: (prev.multiSlots || []).map((entry, entryIdx) =>
                                entryIdx === idx ? { ...entry, enabled: e.target.checked } : entry
                              )
                            }))
                          }
                          className="rounded border-amber-600/60 bg-black text-amber-400"
                        />
                        {MULTI_SLOT_LABELS[slotCfg.slot] || slotCfg.slot}
                      </label>
                      <input
                        type="time"
                        value={slotCfg.heure || ''}
                        onChange={(e) =>
                          setQuestForm((prev) => ({
                            ...prev,
                            multiSlots: (prev.multiSlots || []).map((entry, entryIdx) =>
                              entryIdx === idx ? { ...entry, heure: e.target.value || '' } : entry
                            )
                          }))
                        }
                        className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-1.5 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
                        title="Optionnel : heure précise pour ce créneau"
                      />
                    </div>
                  ))}
                  <p className={`text-xs ${qstatsMuted}`}>
                    Une quête sera créée par créneau sélectionné, avec suffixe automatique dans le nom.
                  </p>
                </div>
              )}
            </div>
          )}

          {questForm.type === 'recurrente' ? (
            <div className="space-y-2">
              <label className="block text-amber-200/90">Jours</label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {JOUR_OPTIONS.filter((j) => j.value !== 'all').map((j) => (
                  <button
                    key={j.value}
                    type="button"
                    onClick={() => {
                      const day = Number(j.value);
                      setQuestForm((prev) => {
                        const jours = Array.isArray(prev.jours) ? [...prev.jours] : [];
                        if (jours.includes(day)) {
                          return { ...prev, jours: jours.filter((d) => d !== day) };
                        }
                        return { ...prev, jours: [...jours, day].sort() };
                      });
                    }}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                      questForm.jours?.includes(Number(j.value))
                        ? 'border-amber-400 bg-amber-500/25 text-amber-50'
                        : 'border-amber-700/45 bg-black/70 text-amber-200/90 hover:border-amber-500/55'
                    }`}
                  >
                    {j.label.slice(0, 3)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 text-[11px] text-amber-200/85">
                {RECURRENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setQuestForm((prev) => ({ ...prev, jours: [...preset.jours] }))
                    }
                    className="rounded-lg border border-amber-700/45 bg-black/70 px-2.5 py-1 text-[11px] text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/10 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-amber-200/90 mb-1">Date</label>
              <input
                type="date"
                value={questForm.date}
                onChange={(e) =>
                  setQuestForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full bg-black/80 border border-amber-600/40 rounded-lg px-3 py-2 text-amber-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/70"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-amber-200/90">
            <input
              type="checkbox"
              checked={questForm.active}
              onChange={(e) =>
                setQuestForm((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="rounded border-amber-600/60 bg-black text-amber-400"
            />
            Quête active
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-amber-800/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-amber-600/50 bg-black/80 px-4 py-2 text-sm text-amber-200 hover:border-amber-400/70 hover:bg-amber-500/10 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg border-2 border-amber-400/80 bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-md shadow-amber-900/30 hover:from-amber-500 hover:to-amber-400 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
