import React, { useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { ArrowLeft, Dumbbell, Gauge, Heart, Calculator, Activity } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { useTranslation } from '../../../utils/translations';
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
import AnatomyBankHighlight from '../../anatomy/AnatomyBankHighlight';
import ExercisePerceivedRessentiPanel from './ExercisePerceivedRessentiPanel';
import ExerciseSimilarSection from './ExerciseSimilarSection';
import {
  perceivedStorageToDraft,
  draftToStoredPayload,
  perceivedDraftDirty,
  emptyPerceivedDraft
} from '../../../utils/exercisePerceivedRatingsModel';

/** Charte Sport fiche détail : fond noir, teal #0F4C5C, accent vert #0F5C45 */
const SPORT_SURFACE = 'bg-black ring-1 ring-[#0F5C45]/35';
const SPORT_BORDER = 'border border-[#0F4C5C]/75';
const SPORT_BORDER_SOFT = 'border border-[#0F4C5C]/55';
const SPORT_DIVIDER = 'border-[#0F4C5C]/40';
/** Typographie charte Sport : titres / labels teal-vert (#0F4C5C / #0F5C45) */
const SPORT_PAGE_TITLE = 'text-teal-100';
const SPORT_SECTION_LABEL = 'text-teal-400/95';
const SPORT_KICKER = 'text-[#58d4aa]';

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

/**
 * Fiche détaillée d’un exercice (charge, notes, explications par profil, aperçu Endurance).
 */
const ExerciseDetailPage = ({
  exercise,
  data,
  updateData,
  onBack,
  readOnly = false,
  onOpenSimilarBankExercise,
  onViewAllSimilarExerciseKeys,
  maxRecordsByExerciseId = null,
  onRequestAddToProgram,
  isAuthenticated = false
}) => {
  const t = useTranslation();
  const coeffs = data?.exerciseIntensityCoeffs || {};
  const ratingsMap = data?.exercisePerceivedRatings || {};
  const notesMap = data?.exercisePersonalNotes || {};
  const idKey = String(exercise.id);
  const perceivedStored = ratingsMap[idKey];

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const main =
      typeof document !== 'undefined' ? document.querySelector('main') : null;
    if (main) main.scrollTop = 0;
  }, [idKey]);

  const profile = useMemo(() => resolveExerciseDetailProfile(exercise), [exercise]);
  const pid = profile.profileId;

  const defaultCoeff = inferExerciseIntensityCoeff(exercise);
  const effectiveCoeff = resolveExerciseIntensityCoeff(exercise, coeffs);
  const [draftCoeff, setDraftCoeff] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftPerceived, setDraftPerceived] = useState(emptyPerceivedDraft);

  useEffect(() => {
    const c = coeffs[idKey];
    setDraftCoeff(c != null && c !== '' ? String(c) : '');
  }, [coeffs, idKey]);

  useEffect(() => {
    setDraftNotes(notesMap[idKey] || '');
  }, [notesMap, idKey]);

  useEffect(() => {
    setDraftPerceived(perceivedStorageToDraft(perceivedStored || {}));
  }, [idKey, perceivedStored]);

  const savedNotesNormalized = (notesMap[idKey] || '').trim();
  const draftNotesNormalized = draftNotes.trim();
  const detailRatingsDirty = useMemo(() => {
    if (readOnly) return false;
    const ratingsUnequal = perceivedDraftDirty(draftPerceived, perceivedStored);
    return ratingsUnequal || draftNotesNormalized !== savedNotesNormalized;
  }, [readOnly, draftPerceived, perceivedStored, draftNotesNormalized, savedNotesNormalized]);

  const persistCoeffs = (nextCoeffs) => {
    updateData({
      ...data,
      exerciseIntensityCoeffs: nextCoeffs
    });
  };

  const commitDetailRatingsAndNotes = useCallback(() => {
    if (readOnly) return;
    const storedPayload = draftToStoredPayload(draftPerceived);

    const nextRatings = { ...ratingsMap };
    if (!storedPayload) {
      delete nextRatings[idKey];
    } else {
      nextRatings[idKey] = storedPayload;
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
    setDraftPerceived(perceivedStorageToDraft(perceivedStored || {}));
    setDraftNotes(notesMap[idKey] || '');
  }, [idKey, notesMap, perceivedStored]);

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

  const anatomyPrimaryList = dbHit?.primaryMuscles ?? exercise?.primaryMuscles;
  const anatomySecondaryList = dbHit?.secondaryMuscles ?? exercise?.secondaryMuscles;

  const primaryMusclesForChips = useMemo(() => {
    const raw = anatomyPrimaryList;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (raw && typeof raw === 'string') {
      return raw
        .split(/[,;]|·|\//)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [anatomyPrimaryList]);

  const secondaryMusclesForChips = useMemo(() => {
    const raw = anatomySecondaryList;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (raw && typeof raw === 'string') {
      return raw
        .split(/[,;]|·|\//)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [anatomySecondaryList]);

  return (
    <div className="max-w-6xl mx-auto px-3 pb-16 space-y-6">
      <div className="flex flex-wrap items-start gap-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          className={`gap-2 shrink-0 ${SPORT_SECTION_LABEL} hover:text-teal-200`}
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('exercisesTab.detail.back', 'Retour aux exercices')}
        </Button>
        <div className="min-w-0 flex-1">
          <p className={`text-xs uppercase tracking-wide ${SPORT_KICKER} mb-1 font-semibold`}>
            {t('exercisesTab.detail.kicker', 'Sport · Exercices')}
          </p>
          <h1 className={`text-xl sm:text-2xl ${SPORT_PAGE_TITLE} leading-tight tracking-tight font-bold break-words`}>
            {exercise.name || exercise.nom}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LoadDifficultyStars coeff={effectiveCoeff} maxStars={5} />
            <span className="text-xs text-slate-500">
              <span className={`${SPORT_SECTION_LABEL}`}>
                {t('exercisesTab.detail.loadIndex', 'Indice charge')}
              </span>{' '}
              ≈{' '}
              <span className="text-slate-200 tabular-nums font-medium">
                {Math.round(effectiveCoeff * 100) / 100}
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-wide rounded-full border border-[#0F4C5C]/65 bg-black text-teal-200/95 px-2 py-0.5 shadow-sm shadow-black/40 ring-1 ring-[#0F5C45]/35">
              {t(volumeModeKey)}
            </span>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 shrink-0 ${SPORT_SURFACE} ${SPORT_BORDER_SOFT}`}
        >
          <Gauge className="w-5 h-5 text-amber-300" />
          <div>
            <div className={`text-[10px] uppercase tracking-wide ${SPORT_SECTION_LABEL}`}>
              {t('exercisesTab.detail.loadIndex', 'Indice charge')}
            </div>
            <div className={`text-lg font-semibold ${SPORT_PAGE_TITLE} tabular-nums`}>
              {Math.round(effectiveCoeff * 100) / 100}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,364px)] lg:gap-x-8 lg:items-start">
        <div className="space-y-6 min-w-0">
          <Card variant="sport" className="ring-1 ring-[#0F5C45]/40">
            <CardContent className="space-y-6 bg-black pt-6">
          <div className={`rounded-xl p-4 space-y-4 ${SPORT_SURFACE} ${SPORT_BORDER}`}>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className={`uppercase tracking-wide ${SPORT_SECTION_LABEL} font-semibold`}>
                {t('exercisesTab.detail.hero.kicker', 'Synthèse')}
              </span>
              <span className="text-slate-600">·</span>
              <span>{t('exercisesTab.detail.hero.recapHint', 'Utilisé pour le Récap et le calendrier (groupes ci-dessous).')}</span>
            </div>
            {heroExecution ? (
              <div>
                <div className={`text-xs font-semibold ${SPORT_SECTION_LABEL} mb-1.5`}>
                  {t('exercisesTab.detail.executionLabel', 'Exécution & consignes')}
                </div>
                <MultilineBlock
                  text={heroExecution}
                  className="text-sm text-slate-100 leading-relaxed space-y-2"
                />
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 bg-black ${SPORT_BORDER_SOFT} ring-1 ring-[#0F5C45]/25`}>
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${SPORT_SECTION_LABEL} mb-1`}>
                  {t('exercisesTab.detail.musclesPrimaryLabel', 'Principalement sollicités')}
                </div>
                <p className="text-sm text-white leading-snug">{heroPrimaryMuscles}</p>
              </div>
              <div className={`rounded-lg p-3 bg-black ${SPORT_BORDER_SOFT} ring-1 ring-[#0F4C5C]/30`}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/90 mb-1">
                  {t('exercisesTab.detail.musclesSecondaryLabel', 'Secondaires / stabilisation')}
                </div>
                <p className="text-sm text-white leading-snug">{heroSecondaryMuscles}</p>
              </div>
            </div>
          </div>

          {externalLoadWeightExplain && (
            <div
              className={`rounded-xl p-4 space-y-2 ${SPORT_SURFACE} border border-amber-500/25 ring-1 ring-[#0F5C45]/25`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wide ${SPORT_SECTION_LABEL}`}>
                {t('exercisesTab.detail.weightLoadTitle', 'Charge externe (kg saisis)')}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {externalLoadWeightExplain.median != null
                  ? t(
                      'exercisesTab.detail.weightLoadBodyWithMedian',
                      `Médiane de tes saisies : {{median}} kg. Le calendrier et le score « Aujourd’hui » multiplient la charge (reps × indice) : léger malus sous ta médiane, bonus modéré au-dessus. Sans poids saisi : 1× (neutre, pas « gratuit » par rapport à une série lourde).`,
                      {
                        median: String(Math.round(externalLoadWeightExplain.median * 10) / 10)
                      }
                    )
                  : t(
                      'exercisesTab.detail.weightLoadBodyNoMedian',
                      "Quelques enregistrements de kg construisent une médiane personnelle. En attendant, un poids saisi seul donne un léger bonus ; sans poids : 1×."
                    )}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className={`rounded-lg bg-black py-2 ${SPORT_BORDER_SOFT}`}>
                  <div className="text-slate-500">−15% kg</div>
                  <div className="text-white font-semibold tabular-nums">
                    ×{Math.round(externalLoadWeightExplain.at85 * 100) / 100}
                  </div>
                </div>
                <div className={`rounded-lg bg-black py-2 ${SPORT_BORDER_SOFT}`}>
                  <div className="text-slate-500">réf.</div>
                  <div className="text-white font-semibold tabular-nums">
                    ×{Math.round(externalLoadWeightExplain.at100 * 100) / 100}
                  </div>
                </div>
                <div className={`rounded-lg bg-black py-2 ${SPORT_BORDER_SOFT}`}>
                  <div className="text-slate-500">+15% kg</div>
                  <div className="text-white font-semibold tabular-nums">
                    ×{Math.round(externalLoadWeightExplain.at115 * 100) / 100}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className={`text-sm text-slate-300 leading-relaxed border-l-2 border-[#0F5C45]/70 pl-3`}>
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
            <p
              className={`text-sm text-amber-200/90 bg-black border border-amber-500/30 rounded-lg px-3 py-2 ring-1 ring-[#0F4C5C]/30`}
            >
              {t('exercisesTab.detail.readOnly', 'Connectez-vous pour enregistrer vos réglages et notes sur cet appareil.')}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold ${SPORT_SECTION_LABEL} mb-1`}>
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
                  className={`w-full px-3 py-2 rounded-lg bg-black ${SPORT_BORDER_SOFT} text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0F5C45]/50`}
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
              <label className={`block text-xs font-semibold ${SPORT_SECTION_LABEL} mb-1`}>
                {t('exercisesTab.detail.notesLabel', 'Notes personnelles')}
              </label>
              {readOnly ? (
                <p className="text-slate-300 text-sm whitespace-pre-wrap py-2">{draftNotes || '—'}</p>
              ) : (
                <textarea
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg bg-black ${SPORT_BORDER_SOFT} text-white text-sm resize-y min-h-[96px] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0F5C45]/50`}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder={t('exercisesTab.detail.notesPlaceholder', 'Variante, élastique, tempo…')}
                />
              )}
            </div>
          </div>

          <div className={`mt-6 pt-6 border-t ${SPORT_DIVIDER} space-y-4`}>
            <h3 className={`text-sm font-semibold ${SPORT_SECTION_LABEL} flex items-center gap-2`}>
              <Heart className="w-4 h-4 text-teal-400" />
              {t('exercisesTab.detail.perceivedTitle', 'Ressenti')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'exercisesTab.detail.perceivedHint',
                'Notes subjectives indépendantes du coefficient de charge calendrier : tu peux les réévaluer quand ton exécution ou ta condition change.'
              )}
            </p>
            <ExercisePerceivedRessentiPanel
              draft={draftPerceived}
              readOnly={readOnly}
              onDraftChange={(next) => setDraftPerceived(next)}
            />
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

      {profile.usesTieredIsometricLoad && (
        <Card variant="sport" className="border-amber-500/25 ring-1 ring-[#0F5C45]/35">
          <CardHeader variant="sport" className="pb-2">
            <CardTitle
              tone="sport"
              className={`text-base normal-case flex items-center gap-2 ${SPORT_SECTION_LABEL} tracking-tight`}
            >
              <Calculator className="w-5 h-5 text-teal-400" />
              {t('exercisesTab.detail.tieredIsoTitle', 'Gainage / planche : charge progressive (secondes)')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-200 leading-relaxed space-y-2 bg-black">
            <p>{t('exercisesTab.detail.tieredIsoBody', '')}</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>0–30 s : ×1,5 (effort encore « gérable » en stabilisation)</li>
              <li>30–60 s : ×2 (fatigue locale qui monte)</li>
              <li>Au-delà de 60 s : ×2,5 par seconde (tenue longue, coût métabolique plus élevé)</li>
            </ul>
            <p className="text-xs text-teal-500/80">
              {t(
                'exercisesTab.detail.tieredIsoFoot',
                'Le tout est calibré pour rester cohérent avec l’ancienne échelle « secondes × petit coefficient », puis multiplié par ton indice personnel.'
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {profile.showEndurancePanel && (txt('garminExplain') || profile.enduranceActivityType) && (
        <Card variant="sport" className="border-emerald-500/30 ring-1 ring-[#0F5C45]/35">
          <CardHeader variant="sport" className="pb-2">
            <CardTitle
              tone="sport"
              className={`text-lg normal-case flex items-center gap-2 ${SPORT_SECTION_LABEL} tracking-tight`}
            >
              <Heart className="w-5 h-5 text-teal-400" />
              {t('exercisesTab.detail.extendedSectionGarmin', 'Endurance, Garmin & charge dynamique')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-black">
            {txt('garminExplain') ? <MultilineBlock text={txt('garminExplain')} /> : null}
            {profile.enduranceActivityType === 'running' && lastRunningFactors && (
              <div
                className={`rounded-lg p-3 text-xs text-slate-300 space-y-1 bg-black ${SPORT_BORDER_SOFT} ring-1 ring-[#0F5C45]/20`}
              >
                <div className={`font-semibold ${SPORT_SECTION_LABEL} mb-2 flex items-center gap-2`}>
                  <Calculator className="w-4 h-4 text-teal-400" />
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
                <div className={`flex justify-between gap-2 pt-1 border-t ${SPORT_DIVIDER} font-medium text-emerald-200`}>
                  <span>{t('exercisesTab.detail.factorTotal', 'Total estimé')}</span>
                  <span className="tabular-nums">{computeRunningTrainingLoad(recentSessions[0])}</span>
                </div>
              </div>
            )}

            {recentSessions.length === 0 ? (
              <p className="text-sm text-slate-400">{t('exercisesTab.detail.noGarminData', '')}</p>
            ) : (
              <div>
                <div className={`text-sm font-semibold ${SPORT_SECTION_LABEL} mb-2`}>
                  {t('exercisesTab.detail.recentSessionsTitle', 'Dernières séances liées (aperçu)')}
                </div>
                <div className={`overflow-x-auto rounded-lg bg-black ${SPORT_BORDER_SOFT}`}>
                  <table className="w-full text-xs text-left">
                    <thead className={'bg-black border-b border-[#0F4C5C]/45 ' + SPORT_SECTION_LABEL}>
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
                          <tr
                            key={`${s.date}_${s.time}_${idx}`}
                            className="border-t border-[#0F4C5C]/30 text-slate-200"
                          >
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

      <Card variant="sport" className="ring-1 ring-[#0F5C45]/35">
        <CardHeader variant="sport" className="pb-2">
          <CardTitle
            tone="sport"
            className={`text-lg normal-case flex items-center gap-2 ${SPORT_SECTION_LABEL} tracking-tight`}
          >
            <Dumbbell className="w-5 h-5 text-teal-400" />
            {t('exercisesTab.detail.metaTitle', 'Infos programme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300 bg-black">
          {exercise.series && (
            <div className={`flex justify-between gap-4 border-b py-2 ${SPORT_DIVIDER}`}>
              <span className={`${SPORT_SECTION_LABEL}`}>{t('exercisesTab.detail.metaSeries', 'Séries (texte)')}</span>
              <span className="text-right text-white">{exercise.series}</span>
            </div>
          )}
          {(exercise.materiel || exercise.equipment) && (
            <div className={`flex justify-between gap-4 border-b py-2 ${SPORT_DIVIDER}`}>
              <span className={`${SPORT_SECTION_LABEL}`}>{t('exercisesTab.detail.metaEquipment', 'Équipement')}</span>
              <span className="text-right text-white">{exercise.materiel || exercise.equipment}</span>
            </div>
          )}
          {exercise.notes && (
            <div className="pt-1">
              <span className={`${SPORT_SECTION_LABEL} block mb-1 font-semibold`}>
                {t('exercisesTab.detail.coachNotes', 'Notes programme')}
              </span>
              <p className="text-slate-200">{exercise.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

          {onOpenSimilarBankExercise ? (
            <ExerciseSimilarSection
              exercise={exercise}
              data={data}
              onOpenSimilarExercise={onOpenSimilarBankExercise}
              onViewAllSimilar={onViewAllSimilarExerciseKeys || undefined}
              maxRecordsByExerciseId={maxRecordsByExerciseId}
              onRequestAddToProgram={onRequestAddToProgram}
              isAuthenticated={isAuthenticated}
            />
          ) : null}
        </div>

        <aside className="mt-8 lg:mt-0 space-y-4">
          <Card variant="sport" className={`${SPORT_BORDER} overflow-hidden`}>
            <CardHeader variant="sport" className="pb-2 border-b border-[#0F4C5C]/35">
              <CardTitle
                tone="sport"
                className="text-base normal-case flex items-center gap-2 text-teal-100 tracking-tight"
              >
                <Activity className="w-5 h-5 text-emerald-400" />
                {t('anatomy.bank.sectionTitle', 'Vue anatomique')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-black">
              <AnatomyBankHighlight
                primaryMuscles={anatomyPrimaryList}
                secondaryMuscles={anatomySecondaryList}
                mode="exercise"
                portrait
              />
              {primaryMusclesForChips.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                    {t('exercisesTab.detail.musclesPrimaryShort', 'Primaires')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {primaryMusclesForChips.map((m, i) => (
                      <span
                        key={`${m}-${i}`}
                        className="px-2 py-0.5 rounded-md border border-[#0F5C45]/40 bg-emerald-950/40 text-emerald-200 text-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {secondaryMusclesForChips.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-teal-600/90 mb-1">
                    {t('exercisesTab.detail.musclesSecondaryShort', 'Secondaires')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {secondaryMusclesForChips.map((m, i) => (
                      <span
                        key={`${m}-s-${i}`}
                        className="px-2 py-0.5 rounded-md border border-[#0F4C5C]/50 bg-black text-slate-300 text-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default ExerciseDetailPage;
