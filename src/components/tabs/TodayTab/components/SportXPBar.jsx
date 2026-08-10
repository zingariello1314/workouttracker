/**
 * Barre XP Sport
 */

import React from 'react';
import {
  Dumbbell,
  Flame,
  Footprints,
  Target,
  CheckCircle,
  Trophy,
  Map,
  ListOrdered,
  Scale,
  Sparkles,
  Repeat,
  Salad
} from 'lucide-react';
import { useSportGrade } from '../../../../hooks/useSportGrade';
import SportGradeBarSummary from '../../../sport/grades/SportGradeBarSummary';
import { openSportRecapGradesView } from '../../../../utils/sport/recapViewConfig';
import { useWorkout } from '../../../../context/WorkoutContext';
import {
  SPORT_XP_PER_TOTAL_KG_VOLUME,
  SPORT_XP_LIFTED_VOLUME_CAP,
  SPORT_XP_PER_NUTRITION_FOOD_REGISTERED,
  sportXpReferenceTenRepsTwoStarBodyweight
} from '../../../../services/xp/xpCalculations';
import { useTranslation } from '../../../../utils/translations';

const SportXPBar = () => {
  const { totalXP, level, breakdown, progress, grades } = useSportGrade();
  const { setActiveTab } = useWorkout();
  const t = useTranslation();
  const goRecapGrades = () => {
    openSportRecapGradesView();
    setActiveTab('recap');
  };
  const gradesHint = t('recap.grades.openGradesHint', 'Voir le détail dans Récap → Grades');
  const xpOnLevel = progress.xpOnLevel ?? 0;
  const xpForLevel = progress.xpForLevel ?? 1000;
  const xpNeeded = progress.xpNeeded ?? 0;
  const pct = Math.min(100, Math.max(0, progress.percent ?? 0));

  const refTwoStarTenReps = sportXpReferenceTenRepsTwoStarBodyweight();

  return (
    <div className="rounded-xl border-2 border-[#0F4C5C]/85 bg-black p-4 shadow-lg shadow-black/40 space-y-4">
      <SportGradeBarSummary
        progressionGradeId={grades?.progression?.gradeId}
        progressionTier={grades?.progression?.tier}
        meritedGradeId={grades?.merited?.gradeId}
        meritedTier={grades?.merited?.tier}
        level={level}
        onClick={goRecapGrades}
        title={gradesHint}
      />

      <div className="mb-1 flex flex-wrap items-start justify-between gap-3 border-t border-[#0F4C5C]/35 pt-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
          <div className="min-w-0">
            <div className="font-semibold text-sky-50">Niveau {level}</div>
            <p className="mt-0.5 text-xs text-teal-200/75">
              XP sur le palier niveau {level} :{' '}
              <span className="font-semibold tabular-nums text-cyan-300">
                {xpOnLevel.toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500"> / </span>
              <span className="tabular-nums text-slate-300">
                {xpForLevel.toLocaleString('fr-FR')}
              </span>{' '}
              <span className="text-slate-500">XP</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <span className="text-sm text-teal-100/90">
            {totalXP.toLocaleString('fr-FR')} XP total
          </span>
          <div className="min-w-[9.5rem] rounded-lg border border-[#0F5C45]/45 bg-[#0F4C5C]/20 px-3 py-2 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-cyan-200/70">
              Reste jusqu&apos;au niveau {level + 1}
            </div>
            <div className="text-xl font-bold tabular-nums text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]">
              {xpNeeded.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-semibold text-cyan-100/90">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full border border-[#0F4C5C]/55 bg-black">
        <div
          className="h-full bg-gradient-to-r from-[#0F4C5C] via-cyan-700 to-emerald-700 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-teal-200/85">
        <span className="tabular-nums">
          Encore <span className="font-semibold text-cyan-200">{xpNeeded.toLocaleString('fr-FR')} XP</span> jusqu&apos;au
          niveau {level + 1}
        </span>
        <span className="text-teal-400/70">{Math.round(pct)} %</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9">
        <div className="flex items-center gap-1">
          <Dumbbell className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.reps.toLocaleString('fr-FR')} reps</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Scale className="h-3 w-3 shrink-0 text-amber-300/90" />
            <span className="text-sky-400/95">
              {(breakdown.liftedVolumeKg ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg×reps
            </span>
          </div>
          <span className="pl-4 text-[10px] leading-tight text-amber-200/85">
            +{(breakdown.liftedVolumeKgXp ?? 0).toLocaleString('fr-FR')} XP (dédup. 1 exo/jour)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.exercises} exercices</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 shrink-0 text-teal-300" />
            <span className="text-sky-400/95">
              {(breakdown.stretches ?? 0).toLocaleString('fr-FR')} étirements
            </span>
          </div>
          <span className="pl-4 text-[10px] leading-tight text-teal-200/85">
            +{(breakdown.stretchesXp ?? 0).toLocaleString('fr-FR')} XP (100→300 / coche selon notes)
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Repeat className="h-3 w-3 shrink-0 text-amber-300" />
            <span className="text-sky-400/95">
              {(breakdown.circuitCompletedDays ?? 0).toLocaleString('fr-FR')} circuits
            </span>
          </div>
          <span className="pl-4 text-[10px] leading-tight text-amber-200/85">
            +{(breakdown.circuitsXp ?? 0).toLocaleString('fr-FR')} XP
            {(breakdown.circuitTripleAchievedDays ?? 0) > 0
              ? ` · ${breakdown.circuitTripleAchievedDays} 3× cible`
              : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="h-3 w-3 shrink-0 text-[#e85d4c]" />
          <span className="text-sky-400/95">{breakdown.calories.toLocaleString('fr-FR')} cal</span>
        </div>
        <div className="flex items-center gap-1">
          <Footprints className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.steps.toLocaleString('fr-FR')} pas</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Salad className="h-3 w-3 shrink-0 text-emerald-300/95" />
            <span className="text-sky-400/95">
              {(breakdown.nutritionFoodItems ?? 0).toLocaleString('fr-FR')} aliments
            </span>
          </div>
          <span className="pl-4 text-[10px] leading-tight text-emerald-200/85">
            +{(breakdown.nutritionFoodXp ?? 0).toLocaleString('fr-FR')} XP (
            {SPORT_XP_PER_NUTRITION_FOOD_REGISTERED}× lignes journal)
          </span>
          <span className="pl-4 text-[10px] leading-tight text-slate-500">
            Réf. charge 10 reps ~2★ (reps pond.) ≈ {refTwoStarTenReps} XP
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.challenges} défis</span>
        </div>
        <div className="col-span-2 mt-1 border-t border-[#0F4C5C]/35 pt-2 text-[10px] leading-snug text-slate-500 sm:col-span-3 md:col-span-4 lg:col-span-9">
          <span className="font-medium text-slate-400">Répartition XP (hors trophées course/corde…) : </span>
          <span className="tabular-nums text-slate-400">
            {(breakdown.weightedRepsXp ?? 0).toLocaleString('fr-FR')} reps pond.
          </span>
          <span className="text-slate-600"> · </span>
          <span className="tabular-nums text-slate-400">
            {(breakdown.liftedVolumeKgXp ?? 0).toLocaleString('fr-FR')} vol. cumul (
            {SPORT_XP_PER_TOTAL_KG_VOLUME.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 3
            })}{' '}
            XP/kg, plaf. {SPORT_XP_LIFTED_VOLUME_CAP.toLocaleString('fr-FR')})
          </span>
          <span className="text-slate-600"> · </span>
          <span className="tabular-nums text-slate-400">
            {(breakdown.caloriesXp ?? 0).toLocaleString('fr-FR')} cal (0,5×kcal actives Garmin cumulées)
          </span>
          <span className="text-slate-600"> · </span>
          <span className="tabular-nums text-slate-400">
            {(breakdown.stepsXp ?? 0).toLocaleString('fr-FR')} pas
            {(breakdown.stepsXpDeclarative ?? 0) > 0
              ? ` (${(breakdown.stepsXpVerified ?? breakdown.stepsXp ?? 0).toLocaleString('fr-FR')} montre + ${(breakdown.stepsXpDeclarative ?? 0).toLocaleString('fr-FR')} déclaratif ×50 %)`
              : ' (0,01×pas cumulés)'}
          </span>
          {(breakdown.exercisesXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.exercisesXp.toLocaleString('fr-FR')} ex. cochés (5×)
              </span>
            </>
          ) : null}
          {(breakdown.stretchesXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.stretchesXp.toLocaleString('fr-FR')} étirements
                {(breakdown.stretches ?? 0) > 0
                  ? ` (${breakdown.stretches} cochés)`
                  : ''}
              </span>
            </>
          ) : null}
          {(breakdown.gtgXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.gtgXp.toLocaleString('fr-FR')} GTG
                {(breakdown.gtgReps ?? 0) > 0 ? ` (${breakdown.gtgReps} reps)` : ''}
              </span>
            </>
          ) : null}
          {(breakdown.circuitsXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.circuitsXp.toLocaleString('fr-FR')} circuits
                {(breakdown.circuitCompletedDays ?? 0) > 0
                  ? ` (${breakdown.circuitCompletedDays} cible(s) atteinte(s)`
                  : ''}
                {(breakdown.circuitTripleAchievedDays ?? 0) > 0
                  ? `, ${breakdown.circuitTripleAchievedDays}× 3× cible)`
                  : (breakdown.circuitCompletedDays ?? 0) > 0
                    ? ')'
                    : ''}
              </span>
            </>
          ) : null}
          {(breakdown.challengesXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.challengesXp.toLocaleString('fr-FR')} défis (50×)
              </span>
            </>
          ) : null}
          {(breakdown.sessionsFeedbackXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.sessionsFeedbackXp.toLocaleString('fr-FR')} séances +feedback (25×)
              </span>
            </>
          ) : null}
          {(breakdown.programCompletionBonusXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.programCompletionBonusXp.toLocaleString('fr-FR')} bonus complétion programme
              </span>
            </>
          ) : null}
          {(breakdown.nutritionFoodXp ?? 0) > 0 ? (
            <>
              <span className="text-slate-600"> · </span>
              <span className="tabular-nums text-slate-400">
                {breakdown.nutritionFoodXp.toLocaleString('fr-FR')} nutrition (
                {(breakdown.nutritionFoodItems ?? 0).toLocaleString('fr-FR')} aliments ×{' '}
                {SPORT_XP_PER_NUTRITION_FOOD_REGISTERED})
              </span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-amber-300" />
              <span className="text-sky-400/95">
                {(breakdown.runningTrophies ?? 0).toLocaleString('fr-FR')} XP trophées course
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Map className="h-3 w-3 shrink-0 text-emerald-400/90" />
              <span className="text-sky-400/95">
                {(breakdown.runningTotalDistanceKm ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
                cumul
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ListOrdered className="h-3 w-3 shrink-0 text-teal-400/90" />
              <span className="text-sky-400/95">
                {(breakdown.runningSessionCount ?? 0).toLocaleString('fr-FR')} sorties course
              </span>
            </div>
          </div>
          <span className="pl-4 text-[10px] leading-tight text-slate-500">
            {(breakdown.runningTrophyTiers ?? 0).toLocaleString('fr-FR')} paliers ·{' '}
            {(breakdown.runningTrophiesUnlocked ?? 0).toLocaleString('fr-FR')} trophées avec au moins un palier
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-violet-300" />
              <span className="text-sky-400/95">
                {(breakdown.jumpRopeTrophies ?? 0).toLocaleString('fr-FR')} XP trophées corde
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-cyan-300" />
              <span className="text-sky-400/95">
                {(breakdown.gainageTrophies ?? 0).toLocaleString('fr-FR')} XP trophées gainage
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-rose-300" />
              <span className="text-sky-400/95">
                {(breakdown.pushupTrophies ?? 0).toLocaleString('fr-FR')} XP trophées pompes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportXPBar;
