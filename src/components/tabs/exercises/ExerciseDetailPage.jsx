import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  Info,
  Gauge,
  BookOpen,
  Heart,
  Calculator
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { useTranslation } from '../../../utils/translations';
import { summarizeExerciseSeries } from '../../../utils/exerciseSeriesSummary';
import {
  resolveExerciseIntensityCoeff,
  inferExerciseIntensityCoeff,
  computeRunningTrainingLoad,
  analyzeRunningSessionFactors,
  computeMedianWeightKgForExercise,
  computeExternalLoadMultiplier
} from '../../../utils/trainingLoadUtils';
import { exerciseUsesExternalLoad } from '../../../utils/programUtils';
import { resolveExerciseDetailProfile } from '../../../utils/exerciseDetailProfile';
import {
  getExerciseDatabaseHit,
  getExerciseVolumeModeTranslationKey,
  formatMuscleList
} from '../../../utils/exerciseHeroContent';
import LoadDifficultyStars from '../../sport/LoadDifficultyStars';

function MultilineBlock({ text, className = 'text-sm text-slate-300 leading-relaxed space-y-3' }) {
  if (!text) return null;
  const parts = String(text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={className}>
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function profileText(t, profileId, field, fallback = '') {
  return t(`exercisesTab.detailProfiles.${profileId}.${field}`, fallback);
}

function PerceivedTenStarRow({ label, value, readOnly, onChange }) {
  const v = Math.max(0, Math.min(10, Number(value) || 0));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {v > 0 ? <span className="text-[10px] text-slate-500 tabular-nums">{v}/10</span> : null}
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
 * Fiche détaillée d’un exercice (charge, notes, explications par profil, aperçu Endurance).
 */
const ExerciseDetailPage = ({ exercise, data, updateData, onBack, readOnly = false }) => {
  const t = useTranslation();
  const summary = useMemo(() => summarizeExerciseSeries(exercise), [exercise]);
  const coeffs = data?.exerciseIntensityCoeffs || {};
  const ratingsMap = data?.exercisePerceivedRatings || {};
  const notesMap = data?.exercisePersonalNotes || {};
  const idKey = String(exercise.id);
  const perceived = ratingsMap[idKey] || {};

  const profile = useMemo(() => resolveExerciseDetailProfile(exercise), [exercise]);
  const pid = profile.profileId;

  const defaultCoeff = inferExerciseIntensityCoeff(exercise);
  const effectiveCoeff = resolveExerciseIntensityCoeff(exercise, coeffs);
  const [draftCoeff, setDraftCoeff] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftPerceived, setDraftPerceived] = useState({
    difficulty: 0,
    enjoyment: 0,
    recovery: 0
  });

  useEffect(() => {
    const c = coeffs[idKey];
    setDraftCoeff(c != null && c !== '' ? String(c) : '');
  }, [coeffs, idKey]);

  useEffect(() => {
    setDraftNotes(notesMap[idKey] || '');
  }, [notesMap, idKey]);

  useEffect(() => {
    setDraftPerceived({
      difficulty: perceived.difficulty || 0,
      enjoyment: perceived.enjoyment || 0,
      recovery: perceived.recovery || 0
    });
  }, [idKey, perceived.difficulty, perceived.enjoyment, perceived.recovery]);

  const savedNotesNormalized = (notesMap[idKey] || '').trim();
  const draftNotesNormalized = draftNotes.trim();
  const detailRatingsDirty = useMemo(() => {
    if (readOnly) return false;
    const ratingsUnequal =
      (draftPerceived.difficulty || 0) !== (perceived.difficulty || 0) ||
      (draftPerceived.enjoyment || 0) !== (perceived.enjoyment || 0) ||
      (draftPerceived.recovery || 0) !== (perceived.recovery || 0);
    return ratingsUnequal || draftNotesNormalized !== savedNotesNormalized;
  }, [
    readOnly,
    draftPerceived.difficulty,
    draftPerceived.enjoyment,
    draftPerceived.recovery,
    perceived.difficulty,
    perceived.enjoyment,
    perceived.recovery,
    draftNotesNormalized,
    savedNotesNormalized
  ]);

  const persistCoeffs = (nextCoeffs) => {
    updateData({
      ...data,
      exerciseIntensityCoeffs: nextCoeffs
    });
  };

  const commitDetailRatingsAndNotes = useCallback(() => {
    if (readOnly) return;
    const d = Math.max(0, Math.min(10, Number(draftPerceived.difficulty) || 0));
    const e = Math.max(0, Math.min(10, Number(draftPerceived.enjoyment) || 0));
    const r = Math.max(0, Math.min(10, Number(draftPerceived.recovery) || 0));
    const merged = { difficulty: d, enjoyment: e, recovery: r };
    const empty =
      (!merged.difficulty || merged.difficulty === 0) &&
      (!merged.enjoyment || merged.enjoyment === 0) &&
      (!merged.recovery || merged.recovery === 0);

    const nextRatings = { ...ratingsMap };
    if (empty) {
      delete nextRatings[idKey];
    } else {
      nextRatings[idKey] = merged;
    }

    const nextNotes = { ...notesMap };
    if (!draftNotes.trim()) {
      delete nextNotes[idKey];
    } else {
      nextNotes[idKey] = draftNotes.trim();
    }

    updateData({
      ...data,
      exercisePerceivedRatings: nextRatings,
      exercisePersonalNotes: nextNotes
    });
  }, [readOnly, draftPerceived, draftNotes, data, ratingsMap, notesMap, idKey, updateData]);

  const cancelDetailDraft = useCallback(() => {
    setDraftPerceived({
      difficulty: perceived.difficulty || 0,
      enjoyment: perceived.enjoyment || 0,
      recovery: perceived.recovery || 0
    });
    setDraftNotes(notesMap[idKey] || '');
  }, [idKey, notesMap, perceived.difficulty, perceived.enjoyment, perceived.recovery]);

  const handleCoeffBlur = () => {
    if (readOnly) return;
    const trimmed = draftCoeff.trim();
    const next = { ...coeffs };
    if (trimmed === '') {
      delete next[idKey];
      persistCoeffs(next);
      return;
    }
    const n = parseFloat(trimmed.replace(',', '.'));
    if (Number.isNaN(n) || n < 0.05) {
      setDraftCoeff(coeffs[idKey] != null ? String(coeffs[idKey]) : '');
      return;
    }
    next[idKey] = n;
    persistCoeffs(next);
  };

  const recentSessions = useMemo(() => {
    const act = profile.enduranceActivityType;
    if (!act) return [];
    const list = data?.enduranceData?.sessions?.[act];
    if (!Array.isArray(list)) return [];
    let rows = [...list]
      .filter((s) => s && s.date)
      .sort((a, b) => {
        const da = String(a.date).localeCompare(String(b.date));
        if (da !== 0) return -da;
        return String(b.time || '').localeCompare(String(a.time || ''));
      });
    if (profile.runningSessionTypes?.length) {
      rows = rows.filter((s) =>
        profile.runningSessionTypes.includes(String(s.type || '').toLowerCase())
      );
    }
    return rows.slice(0, 10);
  }, [data?.enduranceData?.sessions, profile]);

  const lastRunningFactors = useMemo(() => {
    if (profile.enduranceActivityType !== 'running' || recentSessions.length === 0) return null;
    return analyzeRunningSessionFactors(recentSessions[0]);
  }, [profile.enduranceActivityType, recentSessions]);

  const externalLoadWeightExplain = useMemo(() => {
    if (!exerciseUsesExternalLoad(exercise)) return null;
    const ew = data?.exerciseWeights;
    const med = computeMedianWeightKgForExercise(ew, exercise.id);
    const ref = med != null && med > 0 ? med : 20;
    return {
      median: med,
      at85: computeExternalLoadMultiplier(true, ref * 0.85, med ?? ref),
      at100: computeExternalLoadMultiplier(true, ref, med ?? ref),
      at115: computeExternalLoadMultiplier(true, ref * 1.15, med ?? ref)
    };
  }, [data?.exerciseWeights, exercise]);

  const txt = (field) => profileText(t, pid, field, profileText(t, 'strength_default', field, ''));

  const dbHit = useMemo(() => getExerciseDatabaseHit(exercise), [exercise]);
  const volumeModeKey = useMemo(() => getExerciseVolumeModeTranslationKey(profile), [profile]);

  const heroExecution = useMemo(() => {
    const parts = [];
    if (dbHit?.description) parts.push(String(dbHit.description).trim());
    const profExec = profileText(t, pid, 'execution', profileText(t, 'strength_default', 'execution', ''));
    if (profExec) parts.push(profExec);
    return parts.filter(Boolean).join('\n\n');
  }, [dbHit, pid, t]);

  const heroPrimaryMuscles = useMemo(() => {
    const fromDb = formatMuscleList(dbHit?.primaryMuscles);
    return (
      fromDb ||
      profileText(t, pid, 'musclesPrimary', profileText(t, 'strength_default', 'musclesPrimary', ''))
    );
  }, [dbHit, pid, t]);

  const heroSecondaryMuscles = useMemo(() => {
    const fromDb = formatMuscleList(dbHit?.secondaryMuscles);
    return (
      fromDb ||
      profileText(t, pid, 'musclesSecondary', profileText(t, 'strength_default', 'musclesSecondary', ''))
    );
  }, [dbHit, pid, t]);

  return (
    <div className="max-w-3xl mx-auto px-3 pb-16 space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="ghost" className="gap-2 text-slate-200" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          {t('exercisesTab.detail.back', 'Retour aux exercices')}
        </Button>
      </div>

      <Card className="border border-emerald-500/20 bg-slate-900/70 backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-emerald-400/90 mb-1">
                {t('exercisesTab.detail.kicker', 'Sport · Exercices')}
              </p>
              <CardTitle className="text-2xl text-white leading-tight">
                {exercise.name || exercise.nom}
              </CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <LoadDifficultyStars coeff={effectiveCoeff} maxStars={10} />
                <span className="text-xs text-slate-500">
                  {t('exercisesTab.detail.loadIndex', 'Indice charge')} ≈{' '}
                  <span className="text-slate-300 tabular-nums font-medium">
                    {Math.round(effectiveCoeff * 100) / 100}
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-wide rounded-full border border-sky-500/40 bg-sky-950/50 text-sky-200 px-2 py-0.5">
                  {t(volumeModeKey)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-2 border border-slate-600/80 shrink-0">
              <Gauge className="w-5 h-5 text-amber-300" />
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  {t('exercisesTab.detail.loadIndex', 'Indice charge')}
                </div>
                <div className="text-lg font-semibold text-white tabular-nums">
                  {Math.round(effectiveCoeff * 100) / 100}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-slate-600/70 bg-slate-950/55 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="uppercase tracking-wide text-emerald-400/90 font-semibold">
                {t('exercisesTab.detail.hero.kicker', 'Synthèse')}
              </span>
              <span className="text-slate-600">·</span>
              <span>{t('exercisesTab.detail.hero.recapHint', 'Utilisé pour le Récap et le calendrier (groupes ci-dessous).')}</span>
            </div>
            {heroExecution ? (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1.5">
                  {t('exercisesTab.detail.executionLabel', 'Exécution & consignes')}
                </div>
                <MultilineBlock
                  text={heroExecution}
                  className="text-sm text-slate-100 leading-relaxed space-y-2"
                />
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-950/25 border border-emerald-600/25 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90 mb-1">
                  {t('exercisesTab.detail.musclesPrimaryLabel', 'Principalement sollicités')}
                </div>
                <p className="text-sm text-slate-100 leading-snug">{heroPrimaryMuscles}</p>
              </div>
              <div className="rounded-lg bg-sky-950/25 border border-sky-600/25 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/90 mb-1">
                  {t('exercisesTab.detail.musclesSecondaryLabel', 'Secondaires / stabilisation')}
                </div>
                <p className="text-sm text-slate-100 leading-snug">{heroSecondaryMuscles}</p>
              </div>
            </div>
          </div>

          {externalLoadWeightExplain && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                {t('exercisesTab.detail.weightLoadTitle', 'Charge externe (kg saisis)')}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {externalLoadWeightExplain.median != null
                  ? t(
                      'exercisesTab.detail.weightLoadBodyWithMedian',
                      `Médiane de tes saisies : ${Math.round(externalLoadWeightExplain.median * 10) / 10} kg. Le calendrier et le score « Aujourd’hui » multiplient la charge (reps × indice) : léger malus sous ta médiane, bonus modéré au-dessus. Sans poids saisi : 1× (neutre, pas « gratuit » par rapport à une série lourde).`
                    )
                  : t(
                      'exercisesTab.detail.weightLoadBodyNoMedian',
                      "Quelques enregistrements de kg construisent une médiane personnelle. En attendant, un poids saisi seul donne un léger bonus ; sans poids : 1×."
                    )}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-950/60 border border-slate-700/80 py-2">
                  <div className="text-slate-500">−15% kg</div>
                  <div className="text-white font-semibold tabular-nums">
                    ×{Math.round(externalLoadWeightExplain.at85 * 100) / 100}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/60 border border-slate-700/80 py-2">
                  <div className="text-slate-500">réf.</div>
                  <div className="text-white font-semibold tabular-nums">
                    ×{Math.round(externalLoadWeightExplain.at100 * 100) / 100}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/60 border border-slate-700/80 py-2">
                  <div className="text-slate-500">+15% kg</div>
                  <div className="text-white font-semibold tabular-nums">
                    ×{Math.round(externalLoadWeightExplain.at115 * 100) / 100}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-emerald-500/40 pl-3">
            {t(
              'exercisesTab.detail.loadExplain',
              "L'indice reflète le poids d'une « unité » (rep ou seconde) dans le calendrier : plus il est élevé, plus l'exercice alourdit ta journée par rapport au volume brut. Tu peux l'ajuster si ton niveau ou ton exécution diffère du défaut."
            )}{' '}
            <span className="text-slate-400">
              {profile.calendarLoadMode === 'cardio_reference'
                ? t(
                    'exercisesTab.detail.loadExplainCardioExtra',
                    'Pour la course, la charge du jour vient surtout des séances Endurance (distance, durée, type, D+, allure, FC) ; l’indice ici sert aussi à comparer la dureté relative entre types d’exercices.'
                  )
                : profile.calendarLoadMode === 'tiered_isometric'
                  ? t(
                      'exercisesTab.detail.loadExplainIsoExtra',
                      'Pour ce type de hold, le calendrier applique des paliers sur les secondes : voir la section dédiée ci-dessous.'
                    )
                  : null}
            </span>
          </p>

          {readOnly && (
            <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
              {t('exercisesTab.detail.readOnly', 'Connectez-vous pour enregistrer vos réglages et notes sur cet appareil.')}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t('exercisesTab.detail.coeffLabel', 'Coefficient personnalisé')}
              </label>
              {readOnly ? (
                <p className="text-white py-2 tabular-nums">
                  {coeffs[idKey] != null
                    ? Math.round(Number(coeffs[idKey]) * 100) / 100
                    : `${t('exercisesTab.detail.coeffAuto', 'Auto (défaut)')} (${Math.round(defaultCoeff * 100) / 100})`}
                </p>
              ) : (
                <input
                  type="number"
                  min={0.05}
                  step={0.05}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-white"
                  placeholder={String(defaultCoeff)}
                  value={draftCoeff}
                  onChange={(e) => setDraftCoeff(e.target.value)}
                  onBlur={handleCoeffBlur}
                />
              )}
              <p className="text-xs text-slate-500 mt-1">
                {t('exercisesTab.detail.coeffHint', `Auto : ${defaultCoeff} — laisser vide pour revenir au calcul automatique.`, {
                  value: defaultCoeff
                })}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t('exercisesTab.detail.notesLabel', 'Notes personnelles')}
              </label>
              {readOnly ? (
                <p className="text-slate-300 text-sm whitespace-pre-wrap py-2">{draftNotes || '—'}</p>
              ) : (
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-white text-sm resize-y min-h-[96px]"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder={t('exercisesTab.detail.notesPlaceholder', 'Variante, élastique, tempo…')}
                />
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/60 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-amber-400" />
              {t('exercisesTab.detail.perceivedTitle', 'Ressenti (3 critères × 10)')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'exercisesTab.detail.perceivedHint',
                'Notes subjectives indépendantes du coefficient de charge calendrier : tu peux les réévaluer quand ton exécution ou ta condition change.'
              )}
            </p>
            <div className="space-y-5 max-w-xl">
              <PerceivedTenStarRow
                label={t('exercisesTab.detail.perceivedDifficulty', 'Pénibilité perçue')}
                value={draftPerceived.difficulty || 0}
                readOnly={readOnly}
                onChange={(n) => setDraftPerceived((p) => ({ ...p, difficulty: n }))}
              />
              <PerceivedTenStarRow
                label={t('exercisesTab.detail.perceivedEnjoyment', 'Plaisir / motivation')}
                value={draftPerceived.enjoyment || 0}
                readOnly={readOnly}
                onChange={(n) => setDraftPerceived((p) => ({ ...p, enjoyment: n }))}
              />
              <PerceivedTenStarRow
                label={t('exercisesTab.detail.perceivedRecovery', 'Récupération ressentie')}
                value={draftPerceived.recovery || 0}
                readOnly={readOnly}
                onChange={(n) => setDraftPerceived((p) => ({ ...p, recovery: n }))}
              />
            </div>
            {!readOnly && detailRatingsDirty && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" size="sm" onClick={commitDetailRatingsAndNotes}>
                  {t('common.save', 'Enregistrer')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelDetailDraft}>
                  {t('common.cancel', 'Annuler')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-violet-500/20 bg-slate-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <BookOpen className="w-5 h-5 text-violet-300" />
            {t('exercisesTab.detail.extendedSectionCoeff', 'Comprendre l’indice de charge')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultilineBlock text={txt('coeffExplain')} />
        </CardContent>
      </Card>

      {profile.usesTieredIsometricLoad && (
        <Card className="border border-amber-500/25 bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-100">
              <Calculator className="w-5 h-5 text-amber-300" />
              {t('exercisesTab.detail.tieredIsoTitle', 'Gainage / planche : charge progressive (secondes)')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-50/90 leading-relaxed space-y-2">
            <p>{t('exercisesTab.detail.tieredIsoBody', '')}</p>
            <ul className="list-disc pl-5 space-y-1 text-amber-100/85">
              <li>0–30 s : ×1,5 (effort encore « gérable » en stabilisation)</li>
              <li>30–60 s : ×2 (fatigue locale qui monte)</li>
              <li>Au-delà de 60 s : ×2,5 par seconde (tenue longue, coût métabolique plus élevé)</li>
            </ul>
            <p className="text-xs text-amber-200/70">
              {t(
                'exercisesTab.detail.tieredIsoFoot',
                'Le tout est calibré pour rester cohérent avec l’ancienne échelle « secondes × petit coefficient », puis multiplié par ton indice personnel.'
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-700/80 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Info className="w-5 h-5 text-sky-400" />
            {t('exercisesTab.detail.extendedSectionNotes', 'À quoi servent les notes personnelles ?')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultilineBlock text={txt('notesExplain')} />
        </CardContent>
      </Card>

      <Card className="border border-slate-700/80 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Calculator className="w-5 h-5 text-sky-400" />
            {t('exercisesTab.detail.extendedSectionCalendar', 'Comment c’est compté dans le calendrier')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultilineBlock text={txt('calendarExplain')} />
        </CardContent>
      </Card>

      {profile.showEndurancePanel && (txt('garminExplain') || profile.enduranceActivityType) && (
        <Card className="border border-emerald-600/30 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Heart className="w-5 h-5 text-emerald-400" />
              {t('exercisesTab.detail.extendedSectionGarmin', 'Endurance, Garmin & charge dynamique')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {txt('garminExplain') ? <MultilineBlock text={txt('garminExplain')} /> : null}
            {profile.enduranceActivityType === 'running' && lastRunningFactors && (
              <div className="rounded-lg border border-slate-600/60 bg-slate-950/60 p-3 text-xs text-slate-300 space-y-1">
                <div className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-300" />
                  {t('exercisesTab.detail.loadFactorsTitle', 'Détail charge (dernière séance affichée)')}
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('exercisesTab.detail.factorVolume', 'Volume de base')}</span>
                  <span className="tabular-nums text-white">{Math.round(lastRunningFactors.volume * 10) / 10}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('exercisesTab.detail.factorType', 'Type de course')}</span>
                  <span className="tabular-nums text-white">×{lastRunningFactors.tf}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('exercisesTab.detail.factorPace', 'Allure')}</span>
                  <span className="tabular-nums text-white">×{lastRunningFactors.paceMult}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('exercisesTab.detail.factorElev', 'Dénivelé +')}</span>
                  <span className="tabular-nums text-white">×{Math.round(lastRunningFactors.elevMult * 1000) / 1000}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('exercisesTab.detail.factorHr', 'FC moyenne')}</span>
                  <span className="tabular-nums text-white">×{lastRunningFactors.hrMult}</span>
                </div>
                <div className="flex justify-between gap-2 pt-1 border-t border-slate-700/80 font-medium text-emerald-200">
                  <span>{t('exercisesTab.detail.factorTotal', 'Total estimé')}</span>
                  <span className="tabular-nums">{computeRunningTrainingLoad(recentSessions[0])}</span>
                </div>
              </div>
            )}

            {recentSessions.length === 0 ? (
              <p className="text-sm text-slate-400">{t('exercisesTab.detail.noGarminData', '')}</p>
            ) : (
              <div>
                <div className="text-sm font-medium text-slate-200 mb-2">
                  {t('exercisesTab.detail.recentSessionsTitle', 'Dernières séances liées (aperçu)')}
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-700/80">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-400">
                      <tr>
                        <th className="p-2">{t('exercisesTab.detail.colDate', 'Date')}</th>
                        <th className="p-2">{t('exercisesTab.detail.colDistance', 'km')}</th>
                        <th className="p-2">{t('exercisesTab.detail.colDuration', 'Durée')}</th>
                        <th className="p-2">{t('exercisesTab.detail.colElev', 'D+ m')}</th>
                        <th className="p-2">{t('exercisesTab.detail.colType', 'Type')}</th>
                        <th className="p-2 text-right">{t('exercisesTab.detail.colLoad', 'Charge est.')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.map((s, idx) => {
                        const loadCell =
                          profile.enduranceActivityType === 'running'
                            ? computeRunningTrainingLoad(s)
                            : '—';
                        return (
                          <tr key={`${s.date}_${s.time}_${idx}`} className="border-t border-slate-700/60 text-slate-200">
                            <td className="p-2 whitespace-nowrap">{s.date}</td>
                            <td className="p-2 tabular-nums">{s.distance ?? '—'}</td>
                            <td className="p-2">{s.duration || '—'}</td>
                            <td className="p-2 tabular-nums">{s.elevation !== '' && s.elevation != null ? s.elevation : '—'}</td>
                            <td className="p-2">{s.type || '—'}</td>
                            <td className="p-2 text-right tabular-nums text-emerald-200/90">{loadCell}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-700/80 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-sky-400" />
            {t('exercisesTab.detail.volumeSection', 'Volume indiqué au programme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
            <div className="text-white font-medium">{summary.headline || '—'}</div>
            {summary.detail && <p className="text-sm text-slate-400 mt-2 leading-relaxed">{summary.detail}</p>}
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-400">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-400" />
            <span>
              {t(
                'exercisesTab.detail.volumeFootnote',
                'Ce bloc décode la ligne « séries » du programme : c’est une cible, pas ton historique. Ce que tu fais vraiment se saisit dans Aujourd’hui et apparaît dans le Calendrier.'
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-700/80 bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Dumbbell className="w-5 h-5 text-violet-400" />
            {t('exercisesTab.detail.metaTitle', 'Infos programme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {exercise.series && (
            <div className="flex justify-between gap-4 border-b border-slate-700/60 py-2">
              <span className="text-slate-500">{t('exercisesTab.detail.metaSeries', 'Séries (texte)')}</span>
              <span className="text-right text-white">{exercise.series}</span>
            </div>
          )}
          {(exercise.materiel || exercise.equipment) && (
            <div className="flex justify-between gap-4 border-b border-slate-700/60 py-2">
              <span className="text-slate-500">{t('exercisesTab.detail.metaEquipment', 'Équipement')}</span>
              <span className="text-right text-white">{exercise.materiel || exercise.equipment}</span>
            </div>
          )}
          {exercise.notes && (
            <div className="pt-1">
              <span className="text-slate-500 block mb-1">{t('exercisesTab.detail.coachNotes', 'Notes programme')}</span>
              <p className="text-slate-200">{exercise.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExerciseDetailPage;
