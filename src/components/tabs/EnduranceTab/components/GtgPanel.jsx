import React, { useMemo, useState } from 'react';
import { BarChart3, Calendar, Clock, Zap } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import { normalizeGtgData } from '../../../../services/endurance/gtgService';
import { computeGtgXp } from '../../../../services/xp/gtgXpService';
import DefisDisciplineCalendarPanel from './DefisDisciplineCalendarPanel.jsx';
import GtgSessionsPanel from './GtgSessionsPanel.jsx';
import GtgStatsPanel from './GtgStatsPanel.jsx';

const tabBtn = (active) =>
  `rounded-xl border px-4 py-2 text-sm font-medium transition ${
    active
      ? 'border-violet-500/70 bg-violet-500/15 text-violet-100'
      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-violet-500/40'
  }`;

export default function GtgPanel() {
  const { data, activeProgram } = useWorkout();
  const { questionnaire: profileQuestionnaire } = useProfileQuestionnaire();
  const t = useTranslation();
  const [view, setView] = useState('sessions');

  const gtgData = useMemo(() => normalizeGtgData(data?.enduranceData?.gtg), [data?.enduranceData?.gtg]);
  const ctx = useMemo(
    () => ({ workoutData: data, profileQuestionnaire, t }),
    [data, profileQuestionnaire, t]
  );
  const xpSummary = useMemo(() => computeGtgXp(gtgData, ctx), [gtgData, ctx]);

  const subViews = [
    { id: 'sessions', label: t('endurance.subViews.sessionsAndChallenges'), icon: Clock },
    { id: 'stats', label: t('endurance.subViews.stats'), icon: BarChart3 },
    { id: 'calendar', label: t('endurance.subViews.calendar'), icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-950/40 p-3">
              <Zap className="h-7 w-7 text-violet-300" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{t('endurance.gtg.title')}</h3>
              <p className="mt-1 text-sm text-teal-200/80">{t('endurance.gtg.subtitle')}</p>
            </div>
          </div>
          <div className="rounded-xl border border-violet-500/40 bg-violet-950/30 px-4 py-3 text-center">
            <div className="text-xs uppercase tracking-wide text-violet-200/80">{t('endurance.gtg.xpTotal')}</div>
            <div className="text-3xl font-bold text-white tabular-nums">
              +{xpSummary.totalXp.toLocaleString('fr-FR')}
            </div>
            <div className="text-[11px] text-violet-300/75">{t('endurance.gtg.xpSportHint')}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {subViews.map((v) => {
            const Icon = v.icon;
            return (
              <button key={v.id} type="button" onClick={() => setView(v.id)} className={tabBtn(view === v.id)}>
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={14} />
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {view === 'sessions' && <GtgSessionsPanel />}
      {view === 'stats' && (
        <GtgStatsPanel gtgData={gtgData} ctx={ctx} activeProgram={activeProgram} />
      )}
      {view === 'calendar' && (
        <DefisDisciplineCalendarPanel
          activityKind="gtg"
          sessions={[]}
          gtgPayload={{ gtgData, ctx }}
        />
      )}
    </div>
  );
}
