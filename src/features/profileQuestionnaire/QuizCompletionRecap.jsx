import React from 'react';
import { buildQuizCompletionRecap } from './buildQuizCompletionRecap.js';

const tierColor = (score) => {
  if (score >= 80) return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
  if (score >= 60) return 'text-cyan-200 border-cyan-500/40 bg-cyan-500/10';
  if (score >= 40) return 'text-amber-200 border-amber-500/40 bg-amber-500/10';
  return 'text-slate-300 border-slate-500/40 bg-slate-800/60';
};

/**
 * @param {object} props
 * @param {object} props.answers
 * @param {object} props.snapshot
 * @param {object[]} props.programs
 * @param {(id: string) => string} [props.getExerciseNameById]
 * @param {object|null} [props.garminDailyMetrics]
 */
const QuizCompletionRecap = ({
  answers,
  snapshot,
  programs,
  getExerciseNameById,
  garminDailyMetrics
}) => {
  const recap = buildQuizCompletionRecap({
    answers,
    snapshot,
    programs,
    getExerciseNameById,
    garminDailyMetrics
  });

  const {
    placement,
    metrics,
    quizSummary,
    existingProgramAnalysis,
    exercisePreferenceCompareFr,
    hasActivityLogs
  } = recap;

  return (
    <div className="space-y-5 max-h-[min(70vh,720px)] overflow-y-auto pr-1">
      <section className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-slate-900/80 p-5">
        <p className="text-xs uppercase tracking-wider text-violet-300/90">Ton profil coach</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <span className="text-4xl font-bold text-white tabular-nums">{placement.score0to100}</span>
            <span className="ml-1 text-lg text-slate-400">/ 100</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-violet-100">{placement.bandLabel}</p>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed max-w-xl">{placement.bandDescription}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-600 px-2.5 py-1 text-slate-300">
            {placement.experienceLabel}
          </span>
          <span className="rounded-full border border-slate-600 px-2.5 py-1 text-slate-300">
            Objectif : {placement.goalLabel}
          </span>
          <span className="rounded-full border border-slate-600/80 px-2.5 py-1 text-slate-400">
            {placement.dataTrust}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Ce que tu as indiqué au quiz</h4>
        <ul className="space-y-2 text-sm">
          {quizSummary.slice(0, 12).map((row) => (
            <li key={row.id} className="flex flex-col sm:flex-row sm:gap-2 border-b border-slate-800/80 pb-2 last:border-0">
              <span className="text-slate-500 shrink-0 sm:w-[42%]">{row.title}</span>
              <span className="text-slate-200">{row.valueLabel}</span>
            </li>
          ))}
        </ul>
      </section>

      {exercisePreferenceCompareFr ? (
        <section className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-4">
          <h4 className="text-sm font-semibold text-cyan-100 mb-2">Tes habitudes d’entraînement</h4>
          <p className="text-sm text-cyan-50/95 leading-relaxed">{exercisePreferenceCompareFr}</p>
        </section>
      ) : null}

      {existingProgramAnalysis ? (
        <section className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
          <h4 className="text-sm font-semibold text-amber-100 mb-2">Programme analysé</h4>
          <p className="text-sm text-amber-50/90 font-medium">{existingProgramAnalysis.programName}</p>
          <p className="text-xs text-amber-200/80 mt-1">{existingProgramAnalysis.emphasisLabel}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
            <li>
              Depuis {existingProgramAnalysis.programAgeDays} j — adhérence{' '}
              <strong>{existingProgramAnalysis.adherence?.adherencePct ?? '—'}%</strong>
              {existingProgramAnalysis.adherenceSituation?.label
                ? ` (${existingProgramAnalysis.adherenceSituation.label})`
                : ''}
              {' '}
              · {existingProgramAnalysis.adherence?.accomplishedDays}/
              {existingProgramAnalysis.adherence?.calendarDays} j (entraînement + repos respectés)
            </li>
            {existingProgramAnalysis.coachHints?.map((h) => (
              <li key={h} className="text-slate-300 text-xs leading-relaxed">
                → {h}
              </li>
            ))}
          </ul>
          {existingProgramAnalysis.exercisePatterns?.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-1 pr-2">Exercice</th>
                    <th className="py-1 pr-2">Séances</th>
                    <th className="py-1">Moy. reps</th>
                  </tr>
                </thead>
                <tbody>
                  {existingProgramAnalysis.exercisePatterns.slice(0, 5).map((ex) => (
                    <tr key={ex.exerciseId} className="border-t border-slate-800/60 text-slate-300">
                      <td className="py-1 pr-2">{ex.name}</td>
                      <td className="py-1 pr-2">{ex.sessions}</td>
                      <td className="py-1">{ex.avgReps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <h4 className="text-sm font-semibold text-white mb-1">Tes saisies Sport</h4>
        <p className="text-xs text-slate-500 mb-3">
          {hasActivityLogs
            ? 'Chaque indicateur a un palier — ils nourrissent ta note et le prochain programme.'
            : 'Pas encore de reps ou séances cochées : la note repose surtout sur le quiz ; coche tes séances pour affiner.'}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {metrics.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg border px-3 py-2.5 ${tierColor(m.situation?.score ?? 40)}`}
            >
              <p className="text-[11px] uppercase tracking-wide opacity-80">{m.label}</p>
              <p className="text-sm font-medium mt-0.5">{m.display}</p>
              <p className="text-xs mt-1 font-medium">{m.situation?.label}</p>
              {m.situation?.hint ? (
                <p className="text-[10px] mt-0.5 opacity-75 leading-snug">{m.situation.hint}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default QuizCompletionRecap;
