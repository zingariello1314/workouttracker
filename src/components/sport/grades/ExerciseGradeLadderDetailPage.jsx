import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { LADDER_PROGRESS_GATES } from '../../../services/xp/exerciseGradeDiscovery';
import {
  exerciseMaterialLabelFr,
  groupRowsByMaterialAndTier,
  heroGradeIdForMaterial,
  tiersForMaterial
} from '../../../services/xp/exerciseGradeLadderUtils';
import { exerciseGradeById } from '../../../services/xp/exerciseGradeLadder';
import ExerciseGradeEmblem from './ExerciseGradeEmblem';
import GradeMechanicsIntro from './GradeMechanicsIntro';
import {
  RECAP_GRADE_DETAIL_FOCUS_ID,
  scrollToRecapGradeDetail
} from '../../../utils/sport/recapGradesScroll';

function gateForSortIndex(targetIndex) {
  const i = Math.max(0, Math.min(LADDER_PROGRESS_GATES.length - 1, targetIndex));
  return LADDER_PROGRESS_GATES[i];
}

/**
 * Fiche matériau (Bois → Platine) — même disposition que SportGradeDetailPage.
 */
export default function ExerciseGradeLadderDetailPage({ material, rows, onBack, onOpenExercise }) {
  const t = useTranslation();

  useEffect(() => {
    scrollToRecapGradeDetail();
  }, [material]);

  const tiers = tiersForMaterial(material);
  const grouped = groupRowsByMaterialAndTier(rows)[material] || { I: [], II: [], III: [] };
  const heroId = heroGradeIdForMaterial(material, rows);
  const heroGrade = exerciseGradeById(heroId);
  const accent = heroGrade.accent || '#2dd4bf';

  const userMaxSortInMaterial = useMemo(() => {
    return (rows || [])
      .filter((r) => r.grade?.material === material)
      .reduce((m, r) => Math.max(m, r.grade?.sortIndex ?? -1), -1);
  }, [rows, material]);

  const tierDetails = useMemo(
    () =>
      tiers.map((tier) => {
        const roman = tier.label.split(' ').pop();
        return {
          tier,
          roman,
          gate: gateForSortIndex(tier.sortIndex),
          exercises: grouped[roman] || [],
          reached: userMaxSortInMaterial >= tier.sortIndex
        };
      }),
    [tiers, grouped, userMaxSortInMaterial]
  );

  if (!material) return null;

  return (
    <div className="space-y-4 pb-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border border-[#0F4C5C]/50 bg-black/60 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-[#0F4C5C]/25 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        {t('recap.exerciseGrades.ladderDetailBack', 'Retour au parcours des grades exercice')}
      </button>

      <div
        id={RECAP_GRADE_DETAIL_FOCUS_ID}
        className="flex flex-col gap-5 scroll-mt-28 lg:flex-row lg:items-start lg:gap-6"
      >
        <div className="mx-auto w-full max-w-[300px] shrink-0 lg:mx-0 lg:sticky lg:top-4">
          <div
            className="overflow-hidden rounded-2xl border border-[#0F4C5C]/55 bg-black/90 shadow-lg"
            style={{ boxShadow: `0 12px 40px -16px ${accent}55` }}
          >
            <ExerciseGradeEmblem
              gradeId={heroGrade.id}
              gradeLabel={heroGrade.label}
              layout="detail"
              className="border-0 !max-w-none w-full rounded-none"
            />
          </div>
          <GradeMechanicsIntro variant="exercise-material" exerciseMaterial={material} />
          <div className="mt-3 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {exerciseMaterialLabelFr(material)}
            </h1>
            <p className="mt-0.5 text-sm text-teal-400/90">
              {t('recap.exerciseGrades.ladderDetailStatus', 'Grades par exercice')}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {t(
                'recap.exerciseGrades.ladderDetailHint',
                'Trois paliers par matériau — pic, volume et séances déterminent le grade de chaque mouvement.'
              )}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
              {t('recap.exerciseGrades.ladderDetailTiersTitle', 'Paliers (seuils indicatifs)')}
            </h2>
            <ul className="space-y-1.5">
              {tierDetails.map(({ tier, gate, reached, exercises }) => (
                <li
                  key={tier.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    reached
                      ? 'border-[#0F4C5C]/40 bg-black/40'
                      : 'border-slate-800/80 bg-black/20 text-slate-500'
                  }`}
                >
                  <span className="font-medium text-teal-100/90">{tier.label}</span>
                  <span className="tabular-nums text-slate-400 text-xs hidden sm:inline">
                    {t('recap.exerciseGrades.ladderGateShort', 'pic {{p}} · vol. {{v}} · {{c}} coches', {
                      p: gate.peak.toLocaleString('fr-FR'),
                      v: gate.life.toLocaleString('fr-FR'),
                      c: gate.checks.toLocaleString('fr-FR')
                    })}
                  </span>
                  {reached ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-amber-600/25 bg-amber-950/10 p-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600/90">
                {t('recap.exerciseGrades.ladderRecapTitle', 'Récap — tes exercices par palier')}
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                {t(
                  'recap.exerciseGrades.ladderRecapHint',
                  'Liste des mouvements où tu as atteint chaque palier dans ce matériau.'
                )}
              </p>
            </div>
            {tierDetails.map(({ tier, roman, exercises, gate }) => (
              <div
                key={`recap-${tier.id}`}
                className="rounded-lg border border-[#0F4C5C]/40 bg-black/60 px-3 py-3"
              >
                <h3 className="text-sm font-semibold text-teal-100">{tier.label}</h3>
                <p className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
                  {t('sport.exerciseGrade.progressPeak', 'Pic jour')}{' '}
                  {gate.peak.toLocaleString('fr-FR')} ·{' '}
                  {t('sport.exerciseGrade.progressLife', 'Reps totales')}{' '}
                  {gate.life.toLocaleString('fr-FR')} ·{' '}
                  {gate.checks.toLocaleString('fr-FR')}{' '}
                  {t('recap.exerciseGrades.checksShort', 'coches')}
                </p>
                {exercises.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {exercises.map((row) => (
                      <li key={row.benchmarkKey}>
                        <button
                          type="button"
                          onClick={() => onOpenExercise?.(row.benchmarkKey)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#0F4C5C]/35 bg-black/50 px-3 py-2 text-left text-sm text-teal-100 hover:border-teal-500/40 transition-colors"
                        >
                          <span className="font-medium truncate">{row.label}</span>
                          <span className="shrink-0 text-[10px] text-slate-500">{row.grade?.gradeLabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-600">
                    {t(
                      'recap.exerciseGrades.ladderNoExercisesPalier',
                      'Aucun exercice à ce palier pour l’instant.'
                    )}
                  </p>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
