import React, { useMemo, useState } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import { normalizeGtgData } from '../../../../services/endurance/gtgService';
import { computeGtgXp } from '../../../../services/xp/gtgXpService';
import DefisDisciplineCalendarPanel from './DefisDisciplineCalendarPanel.jsx';
import GtgSessionsPanel from './GtgSessionsPanel.jsx';
import GtgStatsPanel from './GtgStatsPanel.jsx';
import GtgProtocolGuide from './GtgProtocolGuide.jsx';

export default function GtgPanel() {
  const { data, activeProgram } = useWorkout();
  const { questionnaire: profileQuestionnaire } = useProfileQuestionnaire();
  const t = useTranslation();
  const [mainTab, setMainTab] = useState('practice');
  const [view, setView] = useState('sessions');

  const gtgData = useMemo(() => normalizeGtgData(data?.enduranceData?.gtg), [data?.enduranceData?.gtg]);
  const ctx = useMemo(
    () => ({ workoutData: data, profileQuestionnaire, t }),
    [data, profileQuestionnaire, t]
  );
  const xpSummary = useMemo(() => computeGtgXp(gtgData, ctx), [gtgData, ctx]);

  const subViews = [
    { id: 'sessions', label: t('endurance.subViews.sessionsAndChallenges') },
    { id: 'stats', label: t('endurance.subViews.stats') },
    { id: 'calendar', label: t('endurance.subViews.calendar') }
  ];

  return (
    <div>
      <header className="head">
        <div>
          <div className="kicker">Défis / Grease the Groove</div>
          <h1 className="long">Grease the Groove</h1>
          <p>{t('endurance.gtg.subtitle')}</p>
        </div>
        <div className="gxp">
          <span className="lab">{t('endurance.gtg.xpTotal')}</span>
          <b className="num">+{xpSummary.totalXp.toLocaleString('fr-FR')}</b>
          <span className="tiny">{t('endurance.gtg.xpSportHint')}</span>
        </div>
      </header>
      <div className="modes">
        <button
          type="button"
          onClick={() => setMainTab('practice')}
          aria-pressed={mainTab === 'practice'}
        >
          {t('endurance.gtg.mainTabs.practice')}
        </button>
        <button
          type="button"
          onClick={() => setMainTab('protocol')}
          aria-pressed={mainTab === 'protocol'}
        >
          {t('endurance.gtg.mainTabs.protocol')}
        </button>
      </div>

      {mainTab === 'protocol' && <GtgProtocolGuide />}

      {mainTab === 'practice' && (
      <>
        <div className="defis-tabs" role="tablist">
          {subViews.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-selected={view === v.id}
            >
              {v.label}
            </button>
          ))}
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
      </>
      )}
    </div>
  );
}
