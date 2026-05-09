/**
 * 🧘 STRETCH DETAIL PAGE
 *
 * Fiche détaillée d'UN étirement de la banque :
 *   • description / instructions / position / contre-indications
 *   • muscles primaires & secondaires
 *   • notes ressenti 3 critères × 10★ (Pénibilité / Plaisir / Récupération)
 *   • notes personnelles libres
 *   • aperçu de la formule XP (moyenne note → XP gagnés à chaque coche)
 *
 * Persistance : `data.stretchPerceivedRatings[stretchKey]`
 *               `data.stretchPersonalNotes[stretchKey]`
 *
 * @module StretchDetailPage
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Info,
  AlertTriangle,
  Target,
  Clock,
  Activity,
  Star,
  Save,
  X
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';

// Plages 1..10 avec composant simple jumeau de PerceivedTenStarRow d'ExerciseDetailPage
function PerceivedTenStarRow({ label, value, readOnly, onChange }) {
  const v = Math.max(0, Math.min(10, Number(value) || 0));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {v > 0 && <span className="text-[10px] text-slate-500 tabular-nums">{v}/10</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(n === v ? 0 : n)}
            className={`h-8 min-w-[2rem] rounded-md border text-sm leading-none transition ${
              n <= v
                ? 'border-amber-400/70 bg-amber-500/15 text-amber-300'
                : 'border-slate-700 bg-slate-950/80 text-slate-600'
            } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-500/50'}`}
            aria-label={`${n} sur 10`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Calcule l'XP gagné par étirement coché en fonction de la moyenne des 3 critères.
 * 1/10 → 100 XP, 10/10 → 300 XP, dégressif linéaire entre les deux.
 * 0 (jamais noté) → fallback 150 XP.
 */
export function computeStretchXpFromRating(rating) {
  const exec = Math.max(0, Math.min(10, Number(rating?.difficulty) || 0));
  const enjoy = Math.max(0, Math.min(10, Number(rating?.enjoyment) || 0));
  const rec = Math.max(0, Math.min(10, Number(rating?.recovery) || 0));

  const presentNotes = [exec, enjoy, rec].filter((n) => n > 0);
  if (presentNotes.length === 0) return 150;
  const avg = presentNotes.reduce((s, n) => s + n, 0) / presentNotes.length;
  return Math.round(100 + (avg - 1) * (200 / 9));
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r === 0 ? `${m} min` : `${m} min ${r} s`;
}

const StretchDetailPage = ({ stretch, stretchKey, data, updateData, onBack, readOnly = false }) => {
  const ratings = data?.stretchPerceivedRatings || {};
  const notes = data?.stretchPersonalNotes || {};
  const initialRating = ratings[stretchKey] || {};
  const initialNote = notes[stretchKey] || '';

  const [draftRating, setDraftRating] = useState({
    difficulty: initialRating.difficulty || 0,
    enjoyment: initialRating.enjoyment || 0,
    recovery: initialRating.recovery || 0
  });
  const [draftNote, setDraftNote] = useState(initialNote);

  const dirty = useMemo(() => {
    return (
      draftRating.difficulty !== (initialRating.difficulty || 0) ||
      draftRating.enjoyment !== (initialRating.enjoyment || 0) ||
      draftRating.recovery !== (initialRating.recovery || 0) ||
      draftNote !== initialNote
    );
  }, [draftRating, draftNote, initialRating, initialNote]);

  const xpPerCheck = useMemo(() => computeStretchXpFromRating(draftRating), [draftRating]);

  const commit = useCallback(() => {
    if (typeof updateData !== 'function' || !stretchKey) return;
    updateData((prev) => ({
      ...prev,
      stretchPerceivedRatings: {
        ...(prev?.stretchPerceivedRatings || {}),
        [stretchKey]: { ...draftRating }
      },
      stretchPersonalNotes: {
        ...(prev?.stretchPersonalNotes || {}),
        [stretchKey]: draftNote
      }
    }));
  }, [stretchKey, draftRating, draftNote, updateData]);

  const cancel = useCallback(() => {
    setDraftRating({
      difficulty: initialRating.difficulty || 0,
      enjoyment: initialRating.enjoyment || 0,
      recovery: initialRating.recovery || 0
    });
    setDraftNote(initialNote);
  }, [initialRating, initialNote]);

  if (!stretch) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 text-sm flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{stretch.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1 text-xs">
            <span className="px-2 py-0.5 rounded bg-teal-900/40 text-teal-200">{stretch.category}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
              <Target className="inline w-3 h-3 mr-1" />
              {stretch.bodyZone}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              <Clock className="inline w-3 h-3 mr-1" />
              {formatDuration(stretch.defaultDuration)}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Difficulté {stretch.difficulty}/4
            </span>
          </div>
        </div>
      </div>

      <Card className="border border-slate-700/80 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Info className="w-5 h-5 text-sky-400" />
            Description & objectif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">{stretch.description}</p>
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-1">Position de départ</h4>
            <p className="text-sm text-slate-300">{stretch.position}</p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-1">Instructions d'exécution</h4>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{stretch.instructions}</p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-1">Équipement</h4>
            <p className="text-sm text-slate-300">{stretch.equipment || 'Aucun'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-700/80 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-emerald-400" />
            Muscles & structures ciblés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-1">Primaires</h4>
            <div className="flex flex-wrap gap-1.5">
              {stretch.primaryMuscles?.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-200 text-xs">
                  {m}
                </span>
              ))}
            </div>
          </div>
          {stretch.secondaryMuscles?.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-1">Secondaires</h4>
              <div className="flex flex-wrap gap-1.5">
                {stretch.secondaryMuscles.map((m, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {stretch.contraindications?.length > 0 && (
        <Card className="border border-amber-700/40 bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Contre-indications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-amber-100/90">
              {stretch.contraindications.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border border-amber-500/30 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Heart className="w-5 h-5 text-amber-400" />
            Mon ressenti (3 critères × 10★)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Ces 3 notes pilotent l'XP gagnée à chaque fois que tu coches cet étirement dans
            « Aujourd'hui ». La moyenne 1/10 donne 100 XP, 10/10 donne 300 XP (dégressif linéaire).
          </p>
          <div className="space-y-5 max-w-xl">
            <PerceivedTenStarRow
              label="Pénibilité perçue"
              value={draftRating.difficulty}
              readOnly={readOnly}
              onChange={(n) => setDraftRating((p) => ({ ...p, difficulty: n }))}
            />
            <PerceivedTenStarRow
              label="Plaisir / motivation"
              value={draftRating.enjoyment}
              readOnly={readOnly}
              onChange={(n) => setDraftRating((p) => ({ ...p, enjoyment: n }))}
            />
            <PerceivedTenStarRow
              label="Récupération ressentie"
              value={draftRating.recovery}
              readOnly={readOnly}
              onChange={(n) => setDraftRating((p) => ({ ...p, recovery: n }))}
            />
          </div>

          <div className="rounded-lg border border-teal-500/30 bg-teal-900/15 px-3 py-2 max-w-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">XP par coche</span>
              <span className="text-teal-200 font-semibold tabular-nums inline-flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400" />
                {xpPerCheck} XP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {[draftRating.difficulty, draftRating.enjoyment, draftRating.recovery].some((n) => n > 0)
                ? 'Calculé sur la moyenne des notes saisies (les notes à 0 sont ignorées).'
                : "Pas encore noté — valeur médiane par défaut (150 XP). Tes notes affineront la valeur."}
            </p>
          </div>

          <div className="max-w-xl">
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes personnelles</label>
            {readOnly ? (
              <p className="text-slate-300 text-sm whitespace-pre-wrap py-2">{draftNote || '—'}</p>
            ) : (
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-white text-sm resize-y min-h-[80px]"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Variantes, sensations, contre-indications personnelles…"
              />
            )}
          </div>

          {!readOnly && dirty && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={commit} className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 text-sm flex items-center gap-2">
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>
              <Button type="button" onClick={cancel} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 text-sm flex items-center gap-2">
                <X className="w-4 h-4" />
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StretchDetailPage;
