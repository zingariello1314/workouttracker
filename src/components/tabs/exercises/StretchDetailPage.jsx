/**
 * Fiche étirement : mise en page 2 colonnes (infos | 3D + muscles),
 * ressenti 7 curseurs pondérés, XP alignée avec `stretchPerceivedRatings` + xpCalculations.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Info,
  AlertTriangle,
  Target,
  Clock,
  Activity,
  Save,
  X,
  History,
  Sun,
  ListTree,
  Layers
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import AnatomyBankHighlight from '../../anatomy/AnatomyBankHighlight';
import { useTranslation } from '../../../utils/translations';
import StretchRessentiPanel from './StretchRessentiPanel';
import StretchComplementarySection from './StretchComplementarySection';
import { inferStretchIdealMoments } from '../../../utils/stretchIdealMoments';
import { countStretchCheckIns } from '../../../utils/stretchCheckInStats';
import {
  stretchDraftToStored,
  stretchStorageToDraft,
  stretchPerceivedDraftDirty,
  emptyStretchPerceivedDraft,
  computeStretchWeightedGlobal5,
  computeStretchXpFromRating
} from '../../../utils/stretchPerceivedRatings';

const SPORT_SURFACE = 'bg-black ring-1 ring-[#0F5C45]/35';
const SPORT_BORDER = 'border border-[#0F4C5C]/75';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r === 0 ? `${m} min` : `${m} min ${r} s`;
}

function StretchVariantsCard({ difficulty, t }) {
  const level = Number(difficulty) || 2;
  return (
    <div className={`rounded-2xl ${SPORT_BORDER} ${SPORT_SURFACE} p-4 sm:p-5 space-y-3`}>
      <h3 className="text-sm font-bold uppercase tracking-wide text-teal-400/95 flex items-center gap-2">
        <Layers className="w-4 h-4 text-[#58d4aa]" />
        {t('stretchesTab.variants.title', 'Variantes (adapter au jour « J »)')}
      </h3>
      <ul className="text-[13px] text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
        <li>
          {t(
            'stretchesTab.variants.easier',
            'Plus doux : diminue la profondeur, raccourcis la pause (ex. −20 %) ou fais quelques mouvements de respiration avant de tenir.'
          )}
        </li>
        <li>
          {level >= 3
            ? t(
                'stretchesTab.variants.harderAdv',
                'Plus engageant : va chercher quelques millimètres supplémentaires dans l’angle cible tout en gardant la respiration calme.'
              )
            : t(
                'stretchesTab.variants.harderBase',
                'Plus intense : lorsque tu es à l’aise, augmente très progressivement la durée maintenue plutôt que la « force » brute.'
              )}
        </li>
      </ul>
    </div>
  );
}

const StretchDetailPage = ({
  stretch,
  stretchKey,
  data,
  updateData,
  onBack,
  readOnly = false,
  /** Programmes utilisateur (pour le compteur de coches aligné XP). */
  sportPrograms,
  /** Ouvre une fiche exercice (banque force) depuis les complémentaires. */
  onOpenComplementaryExercise,
  maxRecordsByExerciseId,
  onRequestAddToProgram,
  isAuthenticated = false
}) => {
  const t = useTranslation();

  const ratings = data?.stretchPerceivedRatings || {};
  const notes = data?.stretchPersonalNotes || {};
  const initialStored = ratings[stretchKey] || {};
  const initialNote = notes[stretchKey] || '';

  const [draft, setDraft] = useState(() => stretchStorageToDraft(initialStored));
  const [draftNote, setDraftNote] = useState(initialNote);

  useEffect(() => {
    setDraft(stretchStorageToDraft(initialStored));
    setDraftNote(initialNote);
  }, [stretchKey, initialStored, initialNote]);

  const dirtyRatings = useMemo(
    () => stretchPerceivedDraftDirty(draft, initialStored),
    [draft, initialStored]
  );
  const dirty = dirtyRatings || draftNote !== initialNote;

  const xpDraft = useMemo(() => computeStretchXpFromRating({ ...draft }), [draft]);

  const checkInCount = useMemo(
    () => countStretchCheckIns(data || {}, stretchKey, { programs: sportPrograms }),
    [data, stretchKey, sportPrograms]
  );

  const globalStored5 = useMemo(
    () => computeStretchWeightedGlobal5(stretchStorageToDraft(initialStored)),
    [initialStored]
  );

  const idealMoments = useMemo(() => inferStretchIdealMoments(stretch), [stretch]);

  const commit = useCallback(() => {
    if (typeof updateData !== 'function' || !stretchKey) return;
    const nextRating = stretchDraftToStored(draft);
    updateData((prev) => {
      const prevRatings = { ...(prev?.stretchPerceivedRatings || {}) };
      if (nextRating) prevRatings[stretchKey] = nextRating;
      else delete prevRatings[stretchKey];
      return {
        ...prev,
        stretchPerceivedRatings: prevRatings,
        stretchPersonalNotes: {
          ...(prev?.stretchPersonalNotes || {}),
          [stretchKey]: draftNote
        }
      };
    });
  }, [stretchKey, draft, draftNote, updateData]);

  const cancel = useCallback(() => {
    setDraft(stretchStorageToDraft(initialStored));
    setDraftNote(initialNote);
  }, [initialStored, initialNote]);

  const resetRessenti = useCallback(() => {
    setDraft(emptyStretchPerceivedDraft());
  }, []);

  if (!stretch) return null;

  const headerTags = (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-md border border-[#0F5C45]/50 bg-[#0F5C45]/18 px-2 py-0.5 capitalize text-teal-100 tabular-nums">
        <Target className="w-3 h-3 text-teal-400 shrink-0" aria-hidden />
        {stretch.category}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-[#0F4C5C]/60 bg-black px-2 py-0.5 capitalize text-teal-200/95">
        {stretch.bodyZone}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-[#0F4C5C]/60 bg-black px-2 py-0.5 tabular-nums text-slate-200">
        <Clock className="w-3 h-3 text-teal-500/85 shrink-0" aria-hidden />
        {formatDuration(stretch.defaultDuration)}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-[#0F5C45]/35 bg-teal-950/40 px-2 py-0.5 tabular-nums text-[#58d4aa]">
        Niv. {stretch.difficulty}/4
      </span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-wrap items-start gap-4">
        <Button
          type="button"
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 border border-[#0F4C5C]/50 text-white px-3 py-1.5 text-sm flex items-center gap-2 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('stretchesTab.back', 'Retour')}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-teal-50 tracking-tight break-words">
                {stretch.name}
              </h1>
              <div className="mt-2">{headerTags}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,364px)] lg:gap-x-8 lg:items-start">
        <div className="space-y-5 min-w-0">
          <Card variant="sport" className={`${SPORT_BORDER} overflow-hidden`}>
            <CardHeader className="pb-2 border-b border-[#0F4C5C]/35">
              <CardTitle className="text-base flex items-center gap-2 text-teal-100">
                <Sun className="w-5 h-5 text-amber-400/90" />
                {t('stretchesTab.idealMoment.title', 'Moment idéal')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 flex flex-wrap gap-2">
              {idealMoments.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-100/95"
                >
                  {m.labelFr}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card variant="sport" className={SPORT_BORDER}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-teal-100">
                <Info className="w-5 h-5 text-sky-400" />
                {t('stretchesTab.description.title', 'Description & objectif')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed">{stretch.description}</p>
              <div>
                <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                  {t('stretchesTab.description.start', 'Position de départ')}
                </h4>
                <p className="text-sm text-slate-300">{stretch.position}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                  {t('stretchesTab.description.instructions', 'Instructions d’exécution')}
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{stretch.instructions}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                  {t('stretchesTab.description.equipment', 'Équipement')}
                </h4>
                <p className="text-sm text-slate-300">{stretch.equipment || t('stretchesTab.description.none', 'Aucun')}</p>
              </div>
            </CardContent>
          </Card>

          <StretchVariantsCard difficulty={stretch.difficulty} t={t} />

          {stretch.contraindications?.length > 0 && (
            <Card variant="sport" className="border border-amber-600/45 bg-amber-950/15 ring-1 ring-amber-700/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  {t('stretchesTab.contraindications.title', 'Contre-indications & précautions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm text-amber-50/90">
                  {stretch.contraindications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className={`rounded-2xl ${SPORT_BORDER} ${SPORT_SURFACE} p-4 sm:p-5`}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-teal-400/95 flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-sky-400" />
              {t('stretchesTab.history.title', 'Ton historique sur cet étirement')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {t('stretchesTab.history.checkIns', 'Coches enregistrées')}
                </p>
                <p className="text-lg font-bold text-white tabular-nums">{checkInCount}</p>
              </div>
              <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {t('stretchesTab.history.avgFeeling', 'Note moyenne (enregistrée)')}
                </p>
                <p className="text-lg font-bold text-sky-300 tabular-nums">
                  {globalStored5 == null ? '—' : `${(Math.round(globalStored5 * 10) / 10).toFixed(1)}/5`}
                </p>
              </div>
              <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {t('stretchesTab.history.xpPerCheck', 'XP par coche (actuel)')}
                </p>
                <p className="text-lg font-bold text-amber-200 tabular-nums">
                  {computeStretchXpFromRating(initialStored)} XP
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 leading-snug">
              {t(
                'stretchesTab.history.hint',
                'Les coches comptent les validations « Aujourd’hui » pour cet étirement dans ton programme. La note moyenne reflète ta dernière sauvegarde.'
              )}
            </p>
          </div>

          <StretchRessentiPanel
            draft={draft}
            readOnly={readOnly}
            onDraftChange={setDraft}
            xpNumeric={xpDraft}
          />

          <div className={`rounded-2xl ${SPORT_BORDER} ${SPORT_SURFACE} p-4`}>
            <label className="block text-xs font-medium text-teal-500/90 mb-1 flex items-center gap-2">
              <ListTree className="w-3.5 h-3.5" />
              {t('stretchesTab.personalNotes', 'Notes personnelles')}
            </label>
            {readOnly ? (
              <p className="text-slate-300 text-sm whitespace-pre-wrap py-2">{draftNote || '—'}</p>
            ) : (
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-black border border-[#0F4C5C]/55 text-white text-sm resize-y min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#0F5C45]/50"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder={t(
                  'stretchesTab.notesPlaceholder',
                  'Variantes, sensations, rappels pour la prochaine fois…'
                )}
              />
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-3">
              {dirty && (
                <>
                  <Button
                    type="button"
                    onClick={commit}
                    className="bg-[#0F5C45] hover:bg-[#0d6b50] text-white px-3 py-1.5 text-sm flex items-center gap-2 border border-[#0F5C45]/60"
                  >
                    <Save className="w-4 h-4" />
                    {t('stretchesTab.save', 'Enregistrer')}
                  </Button>
                  <Button
                    type="button"
                    onClick={cancel}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 text-sm flex items-center gap-2 border border-slate-600"
                  >
                    <X className="w-4 h-4" />
                    {t('stretchesTab.cancel', 'Annuler')}
                  </Button>
                </>
              )}
              <Button
                type="button"
                onClick={resetRessenti}
                disabled={readOnly}
                className="bg-transparent border border-[#0F4C5C]/60 text-teal-200/90 hover:bg-[#0F4C5C]/20 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                {t('stretchesTab.clearSliders', 'Réinitialiser les curseurs')}
              </Button>
            </div>
          )}

          <StretchComplementarySection
            stretch={stretch}
            data={data}
            onOpenExercise={onOpenComplementaryExercise}
            maxRecordsByExerciseId={maxRecordsByExerciseId}
            onRequestAddToProgram={onRequestAddToProgram}
            isAuthenticated={isAuthenticated}
          />
        </div>

        <aside className="mt-8 lg:mt-0 space-y-4">
          <Card variant="sport" className={SPORT_BORDER}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-teal-100">
                <Activity className="w-5 h-5 text-emerald-400" />
                {t('stretchesTab.anatomy.title', 'Vue anatomique')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnatomyBankHighlight
                primaryMuscles={stretch.primaryMuscles}
                secondaryMuscles={stretch.secondaryMuscles}
                mode="stretch"
                portrait
                stretchDatabaseKey={stretch.key}
              />
              <div>
                <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                  {t('stretchesTab.anatomy.primary', 'Primaires')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {stretch.primaryMuscles?.map((m, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md border border-[#0F5C45]/40 bg-emerald-950/40 text-emerald-200 text-xs"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              {stretch.secondaryMuscles?.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                    {t('stretchesTab.anatomy.secondary', 'Secondaires')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {stretch.secondaryMuscles.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md border border-[#0F4C5C]/50 bg-black text-slate-300 text-xs">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className={`rounded-2xl ${SPORT_BORDER} ${SPORT_SURFACE} px-4 py-3 flex items-center justify-between gap-2`}>
            <span className="text-[11px] text-slate-400 leading-snug">
              {t('stretchesTab.sidebar.xpReminder', 'Chaque coche « Aujourd’hui » utilise ta note pour l’XP.')}
            </span>
            <span className="shrink-0 text-sm font-bold text-amber-200 tabular-nums">{xpDraft} XP</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StretchDetailPage;
