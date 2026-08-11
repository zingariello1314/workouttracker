import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useSportGrade } from '../../../../hooks/useSportGrade';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useSportGradeMilestones } from '../../../../hooks/useSportGradeMilestones';
import SportGradeRecapHero from '../../grades/SportGradeRecapHero';
import { sportGradeLabel } from '../../grades/SportGradeIdentity';
import SportGradeEmblem from '../../grades/SportGradeEmblem';
import SportGradeLadderGallery from '../../grades/SportGradeLadderGallery';
import SportGradeDetailPage from '../../grades/SportGradeDetailPage';
import RecapExerciseGradesView from '../../grades/RecapExerciseGradesView';
import { useExerciseGradeVitalsRefresh } from '../../grades/ExerciseGradeVitalsForm';
import { useExerciseGrades } from '../../../../hooks/useExerciseGrades';
import {
  SPORT_TIER_ROMAN
} from '../../../../services/xp/sportGradeCatalog';

function PathRow({ pathKey, data }) {
  if (!data) return null;
  const pct = Math.round(data.pct ?? 0);
  return (
    <div className="rounded-lg border border-[#0F4C5C]/40 bg-black/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-teal-100/90">
          {pathKey} — {data.label}
        </span>
        {data.met ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <span className="text-[10px] tabular-nums text-slate-500">{pct} %</span>
        )}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          className={`h-full transition-all ${data.met ? 'bg-emerald-500' : 'bg-cyan-600'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-500 tabular-nums">
        {Number(data.current).toLocaleString('fr-FR')} / {Number(data.target).toLocaleString('fr-FR')}
      </p>
    </div>
  );
}

export default function RecapGradesView() {
  const t = useTranslation();
  const { totalXP, level, masteryScore, grades, progress, isLoading, aggregates, dailyInsights } = useSportGrade();
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();
  const timeline = useSportGradeMilestones({ level, grades, totalXP });
  const timelineCurrentId = useMemo(() => {
    const prog = grades?.progression;
    if (!prog?.gradeId || !prog?.tier) return null;
    return `tier:${prog.gradeId}:${prog.tier}`;
  }, [grades?.progression?.gradeId, grades?.progression?.tier]);
  const [selectedGradeId, setSelectedGradeId] = useState(null);
  const [gradesSubTab, setGradesSubTab] = useState('sport');
  const [exerciseSortMode, setExerciseSortMode] = useState('grade');
  const { tick, bump } = useExerciseGradeVitalsRefresh();
  const exerciseGrades = useExerciseGrades({
    sortMode: exerciseSortMode,
    vitalsRefreshKey: tick,
    enabled: true
  });

  /** Ne pas bloquer les sous-onglets : seul le contenu Sport attend l’XP initiale. */
  const gradesDataPending = isLoading && (totalXP ?? 0) <= 0;

  const prog = grades?.progression;
  const mer = grades?.merited;
  const next = grades?.nextGateProgress;

  return (
    <div className="space-y-6">
      <section id="recap-grades-section" className="scroll-mt-28">
        <h2 className="text-base font-bold text-white mb-1">
          {t('recap.grades.title', 'Grades & progression')}
        </h2>
        <p className="text-xs text-slate-500 max-w-2xl">
          {gradesSubTab === 'sport'
            ? t(
                'recap.grades.intro',
                'Le niveau monte avec toute ton XP Sport. Les paliers I / II / III suivent le niveau. Passer au grade supérieur exige aussi une preuve d’activité (maîtrise, séances, reps ou kcal).'
              )
            : t(
                'recap.exerciseGrades.introShort',
                'Grades par mouvement (Bois → Platine) selon ton pic du jour, ton volume total et ton profil physique.'
              )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGradesSubTab('sport')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              gradesSubTab === 'sport'
                ? 'bg-[#0F4C5C] text-white'
                : 'border border-[#0F4C5C]/45 text-slate-400 hover:text-white'
            }`}
          >
            {t('recap.grades.subTabSport', 'Grades Sport (XP)')}
          </button>
          <button
            type="button"
            onClick={() => setGradesSubTab('exercises')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              gradesSubTab === 'exercises'
                ? 'bg-[#0F4C5C] text-white'
                : 'border border-[#0F4C5C]/45 text-slate-400 hover:text-white'
            }`}
          >
            {t('recap.grades.subTabExercises', 'Grades exercices')}
          </button>
        </div>
      </section>

      {gradesSubTab === 'exercises' ? (
        <RecapExerciseGradesView
          sortMode={exerciseSortMode}
          onSortModeChange={setExerciseSortMode}
          vitals={exerciseGrades.vitals}
          rows={exerciseGrades.rows}
          totalGradedExercises={exerciseGrades.totalGradedExercises}
          isComputing={exerciseGrades.isComputing}
          onVitalsSaved={bump}
          vitalsRefreshKey={tick}
        />
      ) : gradesDataPending ? (
        <div className="animate-pulse space-y-4 rounded-xl border border-[#0F4C5C]/40 bg-black p-6 h-64" />
      ) : selectedGradeId ? (
        <SportGradeDetailPage
          gradeId={selectedGradeId}
          onBack={() => setSelectedGradeId(null)}
          level={level}
          totalXP={totalXP}
          masteryScore={masteryScore}
          aggregates={aggregates}
          workoutData={workoutData}
          grades={grades}
        />
      ) : (
        <>
      <SportGradeRecapHero
        progressionGradeId={prog?.gradeId}
        progressionTier={prog?.tier}
        meritedGradeId={mer?.gradeId}
        meritedTier={mer?.tier}
        level={level}
        totalXP={totalXP}
        dailyInsights={dailyInsights}
      />

      <section className="rounded-xl border border-[#0F4C5C]/50 bg-black/80 p-4">
        <h3 className="text-sm font-semibold text-cyan-100 mb-2">
          {t('recap.grades.xpBlock', 'XP & niveau')}
        </h3>
        <p className="text-2xl font-bold tabular-nums text-white">{totalXP.toLocaleString('fr-FR')} XP</p>
        <p className="text-xs text-teal-200/80 mt-1">
          {t(
            'recap.grades.levelLine',
            `Niveau ${level} — ${progress.xpOnLevel} / ${progress.xpForLevel} XP sur ce palier`,
            {
              level,
              current: progress.xpOnLevel?.toLocaleString('fr-FR'),
              max: progress.xpForLevel?.toLocaleString('fr-FR')
            }
          )}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[#0F4C5C]/50 bg-black">
          <div
            className="h-full bg-gradient-to-r from-[#0F4C5C] to-emerald-600"
            style={{ width: `${progress.percent ?? 0}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {t(
            'recap.grades.masteryLine',
            `Score de maîtrise : ${masteryScore.toLocaleString('fr-FR')}`,
            { score: masteryScore.toLocaleString('fr-FR') }
          )}
        </p>
      </section>

      <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
        <h3 className="text-sm font-semibold text-white mb-1">
          {t('recap.grades.timelineTitle', 'Historique des grades')}
        </h3>
        <p className="text-[11px] text-slate-500 mb-4 max-w-2xl">
          {t(
            'recap.grades.timelineIntro',
            `Parcours reconstitué d’après ton niveau ${level} : du premier palier jusqu’à ta position actuelle. Les dates sont enregistrées à chaque nouveau palier ou grade débloqué.`,
            { level }
          )}
        </p>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-600">{t('recap.grades.timelineEmpty', 'Aucun événement enregistré pour l’instant.')}</p>
        ) : (
          <ol className="relative border-l border-teal-800/60 ml-3 space-y-4 pl-5">
            {timeline.map((ev) => {
              const gradeName = sportGradeLabel(ev.gradeId, t);
              const roman = SPORT_TIER_ROMAN[ev.tier] || ev.tier;
              const isCurrent = ev.id === timelineCurrentId;
              const dateLabel = ev.at
                ? new Date(ev.at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : null;
              const title =
                ev.kind === 'gate'
                  ? t('recap.grades.timelineGate', `Passage au grade ${gradeName}`, { grade: gradeName })
                  : t('recap.grades.timelineTier', `Palier ${roman} — ${gradeName}`, {
                      grade: gradeName,
                      palier: roman
                    });
              const levelLine =
                ev.levelMin != null
                  ? t('sport.grades.levelShort', `Niveau ${ev.levelMin}`, { level: ev.levelMin })
                  : null;
              return (
                <li key={ev.id} className="relative">
                  <span
                    className={`absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${
                      isCurrent ? 'border-emerald-400 bg-emerald-500/30' : 'border-teal-500 bg-black'
                    }`}
                  />
                  <div className="flex flex-wrap items-start gap-2 gap-y-1">
                    <SportGradeEmblem gradeId={ev.gradeId} layout="chip" />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${isCurrent ? 'text-emerald-100' : 'text-teal-50'}`}>
                        {title}
                        {isCurrent ? (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
                            {t('recap.grades.timelineYouAreHere', 'Actuel')}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {levelLine}
                        {dateLabel ? ` · ${dateLabel}` : null}
                        {ev.kind === 'gate' && ev.path
                          ? ` · ${t('recap.grades.timelinePath', `Voie ${ev.path}`, { path: ev.path })}`
                          : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {next ? (
        <section className="rounded-xl border border-amber-600/30 bg-amber-950/10 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-100">
            {t(
              'recap.grades.nextGate',
              `Prochain grade : ${sportGradeLabel(next.gate.toGradeId, t)}`,
              { grade: sportGradeLabel(next.gate.toGradeId, t) }
            )}
          </h3>
          <p className="text-[11px] text-slate-400">
            {t(
              'recap.grades.nextGateLevel',
              `Niveau minimum : ${next.gate.levelMin} (actuel : ${level})`,
              { n: next.gate.levelMin, level }
            )}
            {level >= next.gate.levelMin ? (
              <span className="text-emerald-400 ml-1">✓</span>
            ) : (
              <span className="text-amber-400 ml-1">—</span>
            )}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <PathRow pathKey="A" data={next.paths.A} />
            <PathRow pathKey="B" data={next.paths.B} />
            <PathRow pathKey="C" data={next.paths.C} />
            <PathRow pathKey="D" data={next.paths.D} />
            {next.paths.F ? <PathRow pathKey="F" data={next.paths.F} /> : null}
          </div>
          <p className="text-[10px] text-slate-600">
            {next.pathsRequired >= 4
              ? t(
                  'recap.grades.pathEHintFinalWithF',
                  'Voie E : 4 voies à 100 % ou ≥ {{pct}} % sur A, B, C, D et F simultanément.',
                  { pct: next.pathEThresholdPct ?? 90 }
                )
              : next.pathsRequired >= 2
                ? t(
                    'recap.grades.pathEHintPenultimateWithF',
                    'Voie E : 2 voies à 100 % ou ≥ {{pct}} % sur A, B, C, D et F simultanément.',
                    { pct: next.pathEThresholdPct ?? 80 }
                  )
                : t(
                    'recap.grades.pathEHint',
                    'Voie E (polyvalence) : atteindre {{pct}} % sur A, B, C et D simultanément.',
                    { pct: next.pathEThresholdPct ?? 70 }
                  )}
          </p>
        </section>
      ) : null}

      <SportGradeLadderGallery
        level={level}
        progressionGradeId={prog?.gradeId}
        progressionTier={prog?.tier}
        onSelectGrade={setSelectedGradeId}
        aggregates={aggregates}
        masteryScore={masteryScore}
      />
        </>
      )}
    </div>
  );
}
