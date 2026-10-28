import React, { useEffect, useMemo, useState } from 'react';
import RecapPeriodHighlightsPanel from '../RecapPeriodHighlightsPanel';
import RecapAnalyseDetails from './RecapAnalyseDetails';
import { useTranslation } from '../../../../utils/translations';
import { useWorkout } from '../../../../context/WorkoutContext';
import { buildRecapPeriodCalendarAnalytics } from '../../../../utils/sport/recapCalendarPeriodAnalytics';

const FAMILIES = {
  short: { id: 'a', cls: 'a' },
  medium: { id: 'p', cls: 'p' },
  long: { id: 'r', cls: 'r' }
};

const FAMILY_META = {
  a: { label: 'Activité', color: 'var(--d)' },
  p: { label: 'Progression', color: 'var(--a1)' },
  s: { label: 'Sommeil', color: 'var(--a2)' },
  r: { label: 'Rythme', color: 'var(--a3)' },
  m: { label: 'Répertoire', color: 'var(--a4)' },
  al: { label: 'Alerte', color: 'var(--a3)' }
};

function asCard(item) {
  if (typeof item === 'object' && item) return item;
  return { body: String(item || '') };
}

function markValues(text) {
  const raw = String(text || '');
  if (!raw) return null;
  const parts = raw.split(/(\d[\d\s.,]*\s?(?:%|km|reps|kcal|min|h)?)/gi);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <em key={index} className="v">
        {part}
      </em>
    ) : (
      part
    )
  );
}

function motifClass(card, fallback) {
  const blob = `${card.kind || ''} ${card.title || ''} ${card.body || card.text || ''}`.toLowerCase();
  if (/sommeil|sleep|nuit|récup|recup/.test(blob)) return 's';
  if (/rythme|cadence|fréquence|frequence|par jour|par séance|par seance/.test(blob)) return 'r';
  if (/répertoire|repertoire|variété|variete|mouvement/.test(blob)) return 'm';
  if (/progress|hausse|baisse| vs /.test(blob)) return 'p';
  if (/alerte|attention|manque|incomplet/.test(blob)) return 'al';
  return fallback;
}

function leadFigure(card) {
  const src = String(card.title || card.body || card.text || '').trim();
  const match = src.match(/(-?\d[\d\s.,]*\s*%(?:\s*(?:→|->|vs)\s*-?\d[\d\s.,]*\s*%?)?|\d+\s*(?:→|->)\s*\d+|\d[\d\s.,]*\s+vs\s+\d[\d\s.,]*)/i);
  if (!match) return null;
  const figure = match[1].trim();
  return figure.length >= 2 && figure.length <= 22 ? figure : null;
}

export default function RecapAnalyseView({
  assessment,
  synthesisCoach,
  profileQuestionnaireRaw,
  enrichment,
  programCoachAnalysis,
  activeProgram,
  period = '30d',
  garminData = null,
  periodWindow = null,
  recapState = null,
  isAdmin = false
}) {
  const t = useTranslation();
  const { getCurrentData, data, getExerciseNameById } = useWorkout();
  const [family, setFamily] = useState('all');
  const [detailsOn, setDetailsOn] = useState(false);
  const [periodAnalytics, setPeriodAnalytics] = useState(null);
  const resolvedWindow = periodWindow ?? enrichment?.window ?? null;

  useEffect(() => {
    if (!resolvedWindow?.start || !resolvedWindow?.end) {
      setPeriodAnalytics(null);
      return undefined;
    }
    const snap = getCurrentData();
    const base = {
      workoutData: snap,
      garminData,
      periodWindow: resolvedWindow,
      period,
      getExerciseNameById,
      recapState
    };
    setDetailsOn(false);
    setPeriodAnalytics(buildRecapPeriodCalendarAnalytics({ ...base, phase: 'header' }));
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      setPeriodAnalytics(buildRecapPeriodCalendarAnalytics({ ...base, phase: 'full' }));
      setDetailsOn(true);
    };
    const handle = window.requestIdleCallback
      ? window.requestIdleCallback(finish, { timeout: 900 })
      : window.setTimeout(finish, 80);
    return () => {
      cancelled = true;
      if (window.requestIdleCallback) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [data, getCurrentData, garminData, resolvedWindow, period, getExerciseNameById, recapState]);

  const groups = useMemo(
    () => [
      { key: 'short', title: t('recap.assessment.horizonShort'), items: assessment?.insights?.shortTerm || [] },
      { key: 'medium', title: t('recap.assessment.horizonMedium'), items: assessment?.insights?.mediumTerm || [] },
      { key: 'long', title: t('recap.assessment.horizonLong'), items: assessment?.insights?.longTerm || [] }
    ],
    [assessment?.insights, t]
  );
  const cards = groups.flatMap((group) =>
    group.items.map((item, index) => {
      const base = asCard(item);
      const cls = motifClass(base, FAMILIES[group.key].cls);
      return {
        ...base,
        key: `${group.key}-${index}`,
        family: cls,
        cls,
        badge: FAMILY_META[cls]?.label || group.title
      };
    })
  );
  const familyCounts = cards.reduce((acc, card) => {
    acc[card.family] = (acc[card.family] || 0) + 1;
    return acc;
  }, {});
  const visible = family === 'all' ? cards : cards.filter((card) => card.family === family);

  return (
    <div className="rb-analyse">
      <RecapPeriodHighlightsPanel
        part="head"
        period={period}
        periodWindow={resolvedWindow}
        garminData={garminData}
        recapState={recapState}
        analytics={periodAnalytics}
      />

      <div className="dist" role="tablist">
        <button type="button" className={family === 'all' ? 'on all' : 'all'} onClick={() => setFamily('all')}>
          {t('recap.analyse.filterAll', 'Toutes')} <b>{cards.length}</b>
        </button>
        {Object.entries(FAMILY_META).map(([id, meta]) =>
          familyCounts[id] ? (
            <button
              key={id}
              type="button"
              className={family === id ? 'on' : ''}
              style={{ '--a': meta.color }}
              onClick={() => setFamily(id)}
            >
              {meta.label} <b>{familyCounts[id]}</b>
            </button>
          ) : null
        )}
      </div>

      {visible.length === 0 ? (
        <p className="emp">{t('recap.analyse.emptyWindow', 'Pas assez de signal fiable sur cette fenêtre.')}</p>
      ) : (
        <div className="igrid">
          {visible.map((card) => (
            <article key={card.key} className={`k ${motifClass(card, card.cls)}`}>
              <header>
                <b>{card.badge}</b>
              </header>
              {leadFigure(card) ? <div className="n">{leadFigure(card)}</div> : null}
              {card.title ? <h4>{markValues(card.title)}</h4> : null}
              <p className="whitespace-pre-line">{markValues(card.body || card.text)}</p>
              {card.evidence ? <div className="meta">{card.evidence}</div> : null}
              {card.confidence ? <div className="meta">{card.confidence}</div> : null}
            </article>
          ))}
        </div>
      )}

      {detailsOn ? (
        <RecapAnalyseDetails
          assessment={assessment}
          synthesisCoach={synthesisCoach}
          profileQuestionnaireRaw={profileQuestionnaireRaw}
          enrichment={enrichment}
          programCoachAnalysis={programCoachAnalysis}
          activeProgram={activeProgram}
          period={period}
          garminData={garminData}
          isAdmin={isAdmin}
        />
      ) : null}

      {periodAnalytics?.phase === 'full' ? (
        <RecapPeriodHighlightsPanel
          part="tail"
          period={period}
          periodWindow={resolvedWindow}
          garminData={garminData}
          recapState={recapState}
          analytics={periodAnalytics}
        />
      ) : null}
    </div>
  );
}
