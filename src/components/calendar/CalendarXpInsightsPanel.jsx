/**
 * Panneau XP « carrière » dans le récap jour du calendrier —
 * volume, temps, feedback, bonus programme, maîtrise, moyenne, trophées.
 */

import React, { useMemo } from 'react';
import { Award, Dumbbell, Flame, Gauge, Timer, Trophy, Zap } from 'lucide-react';
import { useSportGrade } from '../../hooks/useSportGrade';
import { formatCalendarSportDuration } from '../../utils/calendarSportStatsFormat';
import {
  SPORT_XP_LIFTED_VOLUME_CAP,
  SPORT_XP_PER_TOTAL_KG_VOLUME
} from '../../services/xp/xpCalculations';
import {
  MASTERY_WEIGHT_CALORIES,
  MASTERY_WEIGHT_EXERCISES,
  MASTERY_WEIGHT_STEPS,
  MASTERY_WEIGHT_WEIGHTED_REPS
} from '../../services/xp/sportMasteryScore';

function fmt(n, opts) {
  return Number(n || 0).toLocaleString('fr-FR', opts);
}

function StatCard({ id, icon: Icon, label, value, sub, accent = 'sky' }) {
  const accents = {
    sky: 'border-sky-500/35 from-sky-950/40 to-black text-sky-100',
    amber: 'border-amber-500/35 from-amber-950/35 to-black text-amber-100',
    violet: 'border-violet-500/35 from-violet-950/40 to-black text-violet-100',
    emerald: 'border-emerald-500/35 from-emerald-950/35 to-black text-emerald-100',
    rose: 'border-rose-500/35 from-rose-950/35 to-black text-rose-100',
    orange: 'border-orange-500/35 from-orange-950/35 to-black text-orange-100'
  };
  return (
    <article
      id={id}
      className={`scroll-mt-28 rounded-xl border bg-gradient-to-br p-3.5 ${accents[accent] || accents.sky}`}
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
        {Icon ? <Icon size={13} className="opacity-90" /> : null}
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums tracking-tight">{value}</div>
      {sub ? <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{sub}</p> : null}
    </article>
  );
}

function MasteryAxis({ label, points, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((points / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="truncate text-slate-400">{label}</span>
        <span className="shrink-0 tabular-nums text-cyan-200/90">{fmt(points)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500/80 to-cyan-300/90"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TrophyBoard({ id, title, xp, meta, tone }) {
  return (
    <div
      id={id}
      className={`scroll-mt-28 rounded-lg border px-3 py-2.5 ${tone}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{title}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums">{fmt(xp)} XP</div>
      {meta ? <div className="mt-0.5 text-[11px] text-slate-400">{meta}</div> : null}
    </div>
  );
}

export default function CalendarXpInsightsPanel() {
  const { breakdown, totalXP, masteryScore, dailyInsights, grades, level } = useSportGrade();
  const b = breakdown || {};

  const masteryAxes = useMemo(() => {
    const n = (v) => Math.max(0, Math.round(Number(v) || 0));
    const axes = [
      { label: 'Reps pondérées', points: Math.round(n(b.weightedRepsXp) * MASTERY_WEIGHT_WEIGHTED_REPS) },
      { label: 'Volume chargé', points: n(b.liftedVolumeKgXp) * 2 },
      { label: 'Calories', points: Math.round(n(b.caloriesXp) * MASTERY_WEIGHT_CALORIES) },
      { label: 'Pas', points: Math.round(n(b.stepsXp) * MASTERY_WEIGHT_STEPS) },
      { label: 'Exercices cochés', points: Math.round(n(b.exercisesXp) * MASTERY_WEIGHT_EXERCISES) },
      {
        label: 'Trophées endurance',
        points:
          n(b.runningTrophies) +
          n(b.jumpRopeTrophies) +
          n(b.gainageTrophies) +
          n(b.pushupTrophies)
      },
      {
        label: 'Séances / circuits / GTG',
        points: n(b.sessionsFeedbackXp) + n(b.circuitsXp) + n(b.gtgXp)
      },
      { label: 'Nutrition', points: n(b.nutritionFoodXp) }
    ].filter((a) => a.points > 0);
    const max = Math.max(1, ...axes.map((a) => a.points));
    return { axes, max };
  }, [b]);

  if (!totalXP && !masteryScore) return null;

  const avg = dailyInsights?.averageDailyXp ?? 0;
  const days = dailyInsights?.daysWithXp ?? 0;
  const merited = grades?.merited;
  const prog = grades?.progression;

  return (
    <section
      id="calendar-xp-insights"
      className="scroll-mt-28 space-y-4 rounded-2xl border border-teal-500/25 bg-gradient-to-b from-[#041512]/90 via-black/80 to-black p-4 shadow-[0_0_40px_-20px_rgba(45,212,191,0.35)]"
    >
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-teal-500/20 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-500/90">
            XP Sport — synthèse
          </p>
          <h4 className="mt-1 text-base font-semibold text-white">
            Ce que ton XP raconte vraiment
          </h4>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
            Volume, durée, feedback, maîtrise et boards trophées — les mêmes sources que la barre
            XP, mises en forme pour le récap calendrier.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-teal-200">{fmt(totalXP)}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">XP total</div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          id="calendar-xp-volume"
          icon={Dumbbell}
          accent="violet"
          label="Volume cumulé"
          value={`${fmt(b.liftedVolumeKg ?? 0, { maximumFractionDigits: 0 })} kg·reps`}
          sub={`${SPORT_XP_PER_TOTAL_KG_VOLUME.toLocaleString('fr-FR', {
            maximumFractionDigits: 3
          })} XP/kg · plafond ${fmt(SPORT_XP_LIFTED_VOLUME_CAP)} · dédup. 1 exo/jour → +${fmt(
            b.liftedVolumeKgXp || 0
          )} XP`}
        />
        <StatCard
          id="calendar-xp-weighted-time"
          icon={Timer}
          accent="sky"
          label="Temps pondéré"
          value={formatCalendarSportDuration(b.timeMinutes ?? 0)}
          sub={`Exos en durée → +${fmt(b.weightedTimeXp || 0)} XP. La durée compte quand l’effort est chronométré, pas seulement les reps.`}
        />
        <StatCard
          id="calendar-xp-feedback"
          icon={Flame}
          accent="orange"
          label="Séances + feedback"
          value={`+${fmt(b.sessionsFeedbackXp || 0)} XP`}
          sub="Chaque séance avec retour (effort / ressenti) nourrit cette ligne — ancrée aussi dans Récap → Séances."
        />
        <StatCard
          id="calendar-xp-program-bonus"
          icon={Award}
          accent="emerald"
          label="Bonus complétion programme"
          value={`+${fmt(b.programCompletionBonusXp || 0)} XP`}
          sub="Récompense la fidélité au plan (exercices cochés vs programme du jour), pas seulement le volume brut."
        />
        <StatCard
          id="calendar-xp-daily-avg"
          icon={Zap}
          accent="amber"
          label="Moyenne XP / jour actif"
          value={`${fmt(avg)} XP`}
          sub={
            days > 0
              ? `${fmt(totalXP)} XP ÷ ${fmt(days)} jours calendrier avec activité XP.`
              : 'Apparait dès qu’un jour enregistre de l’XP.'
          }
        />
        <StatCard
          id="calendar-xp-mastery"
          icon={Gauge}
          accent="rose"
          label="Score de maîtrise"
          value={fmt(masteryScore ?? 0)}
          sub={`Niveau ${level ?? '—'} · progression ${prog?.gradeId || '—'} · mérité ${
            merited?.gradeId || '—'
          }. Agrégat multi-axes pour les portes de grade.`}
        />
      </div>

      <div
        id="calendar-xp-mastery-axes"
        className="scroll-mt-28 rounded-xl border border-white/10 bg-black/40 p-3.5"
      >
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          <Gauge size={13} />
          Détail des axes de maîtrise
        </div>
        {masteryAxes.axes.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {masteryAxes.axes.map((axis) => (
              <MasteryAxis
                key={axis.label}
                label={axis.label}
                points={axis.points}
                max={masteryAxes.max}
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Pas encore assez d’activité pour détailler les axes.</p>
        )}
      </div>

      <div
        id="calendar-xp-trophy-summary"
        className="scroll-mt-28 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-950/25 to-black p-3.5"
      >
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-500/90">
          <Trophy size={13} />
          Synthèse paliers / trophées
        </div>
        <p className="text-sm text-amber-50/95">
          <span className="text-2xl font-bold tabular-nums text-amber-200">
            {fmt(b.runningTrophyTiers ?? 0)}
          </span>{' '}
          paliers ·{' '}
          <span className="text-2xl font-bold tabular-nums text-amber-200">
            {fmt(b.runningTrophiesUnlocked ?? 0)}
          </span>{' '}
          trophées avec au moins un palier
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Cumul des boards course, corde, gainage et pompes — le même total que le pied de la barre
          XP.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <TrophyBoard
          id="calendar-xp-board-running"
          title="Board course"
          xp={b.runningTrophies || 0}
          meta={`${fmt(b.runningTotalDistanceKm ?? 0, { maximumFractionDigits: 1 })} km · ${fmt(
            b.runningSessionCount ?? 0
          )} sorties`}
          tone="border-sky-500/30 bg-sky-950/20 text-sky-100"
        />
        <TrophyBoard
          id="calendar-xp-board-jumprope"
          title="Board corde"
          xp={b.jumpRopeTrophies || 0}
          meta="Trophées corde isolés (Endurance → Corde)"
          tone="border-violet-500/30 bg-violet-950/20 text-violet-100"
        />
        <TrophyBoard
          id="calendar-xp-board-plank"
          title="Board gainage"
          xp={b.gainageTrophies || 0}
          meta="Trophées gainage isolés (Endurance → Gainage)"
          tone="border-emerald-500/30 bg-emerald-950/20 text-emerald-100"
        />
      </div>
    </section>
  );
}
