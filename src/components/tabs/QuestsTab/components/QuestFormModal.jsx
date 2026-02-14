/**
 * Composant modal pour créer/éditer une quête
 * 
 * ✅ PHASE 4 : Extraction du formulaire de quête
 * 
 * @module components/tabs/QuestsTab/components/QuestFormModal
 */

import React from 'react';
import { CATEGORIES, CRENEAUX, PRIERES, DIFFICULTIES, JOUR_OPTIONS, RECURRENCE_PRESETS, DURATION_OPTIONS } from '../constants';
import { formatDuration } from '../utils';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            {isEditing ? 'Modifier la quête' : 'Nouvelle quête'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="gradient-button-premium gradient-button-premium-sm rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-300 mb-1">Nom</label>
            <input
              type="text"
              value={questForm.nom}
              onChange={(e) =>
                setQuestForm((prev) => ({ ...prev, nom: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={questForm.description}
              onChange={(e) =>
                setQuestForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Catégorie</label>
              <select
                value={questForm.categorie}
                onChange={(e) => {
                  const cat = e.target.value;
                  setQuestForm((prev) => ({
                    ...prev,
                    categorie: cat,
                    priere: cat === 'Prière' ? (prev.priere || 'fajr') : '',
                  }));
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Difficulté</label>
              <select
                value={questForm.difficulte}
                onChange={(e) =>
                  setQuestForm((prev) => ({
                    ...prev,
                    difficulte: Number(e.target.value),
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Durée</label>
              <select
                value={Number(questForm.duree) || 30}
                onChange={(e) =>
                  setQuestForm((prev) => ({
                    ...prev,
                    duree: Number(e.target.value),
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              >
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {formatDuration(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Type</label>
              <select
                value={questForm.type}
                onChange={(e) =>
                  setQuestForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              >
                <option value="recurrente">Récurrente</option>
                <option value="exceptionnelle">Exceptionnelle</option>
              </select>
            </div>
          </div>

          {questForm.categorie === 'Prière' && (
            <div>
              <label className="block text-slate-300 mb-1">Quelle prière ?</label>
              <select
                value={questForm.priere || 'fajr'}
                onChange={(e) =>
                  setQuestForm((prev) => ({ ...prev, priere: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              >
                {PRIERES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-0.5">Heure calculée automatiquement selon ta position (Paramètres).</p>
            </div>
          )}

          {questForm.categorie !== 'Prière' && (
            <div className="space-y-2">
              <label className="block text-slate-300">Heure prévue (emploi du temps)</label>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
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
                    className="rounded border-slate-600"
                  />
                  <span>Plage</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
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
                    className="rounded border-slate-600"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                    title="Optionnel : heure de début ; la fin = début + durée de la quête"
                  />
                  <p className="text-xs text-slate-500">
                    Optionnel. Heure de début ; pour une période, la fin est calculée automatiquement (début + durée).
                  </p>
                </>
              )}
              <p className="text-xs text-slate-500">Les quêtes sont triées par heure dans la vue Aujourd'hui.</p>
            </div>
          )}

          {questForm.type === 'recurrente' ? (
            <div className="space-y-2">
              <label className="block text-slate-300">Jours</label>
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
                    className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                      questForm.jours?.includes(Number(j.value))
                        ? 'gradient-button-premium-variant'
                        : ''
                    }`}
                  >
                    {j.label.slice(0, 3)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
                {RECURRENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setQuestForm((prev) => ({ ...prev, jours: [...preset.jours] }))
                    }
                    className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={questForm.date}
                onChange={(e) =>
                  setQuestForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={questForm.active}
              onChange={(e) =>
                setQuestForm((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="rounded border-slate-600 bg-slate-900"
            />
            Quête active
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            className="gradient-button-premium gradient-button-premium-md rounded-lg"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
