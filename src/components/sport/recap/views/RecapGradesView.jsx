import React, { useState } from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useSportGrade } from '../../../../hooks/useSportGrade';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useSportGradeMilestones } from '../../../../hooks/useSportGradeMilestones';
import SportGradeRecapHero from '../../grades/SportGradeRecapHero';
import { sportGradeLabel, sportPalierLabel } from '../../grades/SportGradeIdentity';
import SportGradeEmblem from '../../grades/SportGradeEmblem';
import SportGradeLadderGallery from '../../grades/SportGradeLadderGallery';
import SportGradeDetailPage from '../../grades/SportGradeDetailPage';
import {
  SPORT_GRADE_GATES,
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
  const { totalXP, level, masteryScore, grades, progress, isLoading, aggregates } = useSportGrade();
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();
  const timeline = useSportGradeMilestones({ level, grades, totalXP });
  const [selectedGradeId, setSelectedGradeId] = useState(null);

  /** Ne pas masquer les grades pendant le chargement Garmin si l’XP workout est déjà calculée. */
  const gradesDataPending = isLoading && (totalXP ?? 0) <= 0;

  if (gradesDataPending) {
    return (
      <div className="animate-pulse space-y-4 rounded-xl border border-[#0F4C5C]/40 bg-black p-6 h-64" />
    );
  }

  const prog = grades?.progression;
  const mer = grades?.merited;
  const next = grades?.nextGateProgress;

  if (selectedGradeId) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-base font-bold text-white mb-1">
          {t('recap.grades.title', 'Grades & progression')}
        </h2>
        <p className="text-xs text-slate-500 max-w-2xl">
          {t(
            'recap.grades.intro',
            'Le niveau monte avec toute ton XP Sport. Les paliers I / II / III suivent le niveau. Passer au grade supérieur exige aussi une preuve d’activité (maîtrise, séances, reps ou kcal).'
          )}
        </p>
      </section>

      <SportGradeRecapHero
        progressionGradeId={prog?.gradeId}
        progressionTier={prog?.tier}
        meritedGradeId={mer?.gradeId}
        meritedTier={mer?.tier}
        level={level}
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
            'Dates enregistrées à partir de maintenant ; les grades déjà obtenus avant cette mise à jour peuvent apparaître sans date.'
          )}
        </p>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-600">{t('recap.grades.timelineEmpty', 'Aucun événement enregistré pour l’instant.')}</p>
        ) : (
          <ol className="relative border-l border-teal-800/60 ml-3 space-y-4 pl-5">
            {timeline.map((ev) => {
              const gradeName = sportGradeLabel(ev.gradeId, t);
              const dateLabel = ev.at
                ? new Date(ev.at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : t('recap.grades.timelineNoDate', 'Date non enregistrée');
              const title =
                ev.kind === 'gate'
                  ? t('recap.grades.timelineGate', `Passage au grade ${gradeName}`, { grade: gradeName })
                  : t('recap.grades.timelineTier', `Palier ${SPORT_TIER_ROMAN[ev.tier] || ev.tier} — ${gradeName}`, {
                      grade: gradeName,
                      palier: sportPalierLabel(ev.tier, t)
                    });
              return (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-teal-500 bg-black" />
                  <div className="flex flex-wrap items-start gap-2 gap-y-1">
                    <SportGradeEmblem gradeId={ev.gradeId} layout="chip" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-teal-50">{title}</div>
                      <div className="text-[10px] text-slate-500">
                        {dateLabel}
                        {ev.kind === 'gate' && ev.path
                          ? ` · ${t('recap.grades.timelinePath', `Voie ${ev.path}`, { path: ev.path })}`
                          : null}
                        {ev.kind === 'tier' && ev.levelMin
                          ? ` · ${t('sport.grades.levelShort', `Niveau ${ev.levelMin}`, { level: ev.levelMin })}`
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
          </div>
          <p className="text-[10px] text-slate-600">
            {t(
              'recap.grades.pathEHint',
              'Voie E (polyvalence) : atteindre 70 % sur A, B, C et D simultanément.'
            )}
          </p>
        </section>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-white mb-3">
          {t('recap.grades.history', 'Grades débloqués')}
        </h3>
        <ul className="space-y-2">
          {SPORT_GRADE_GATES.map((gate) => {
            const hist = grades?.gateHistory?.find((h) => h.toGradeId === gate.toGradeId);
            const passed = hist?.passed;
            const levelOk = level >= gate.levelMin;
            return (
              <li
                key={gate.toGradeId}
                className="flex items-center gap-3 rounded-lg border border-[#0F4C5C]/35 bg-black/50 px-3 py-2"
              >
                <SportGradeEmblem gradeId={gate.toGradeId} layout="chip" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-teal-50">
                    {sportGradeLabel(gate.toGradeId, t)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {passed
                      ? t('recap.grades.gateOk', `Validé (voie ${hist.path})`, { path: hist.path })
                      : levelOk
                        ? t('recap.grades.gatePending', 'Niveau OK — preuve d’activité manquante')
                        : t('recap.grades.gateLocked', 'Verrouillé')}
                  </div>
                </div>
                {passed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : levelOk ? (
                  <Circle className="h-5 w-5 text-amber-500 shrink-0" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-600 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <SportGradeLadderGallery
        level={level}
        progressionGradeId={prog?.gradeId}
        progressionTier={prog?.tier}
        onSelectGrade={setSelectedGradeId}
      />
    </div>
  );
}
