import React, { useEffect, useMemo, useState } from 'react';
import RecapPeriodHighlightsPanel from '../RecapPeriodHighlightsPanel';
import RecapAnalyseDetails from './RecapAnalyseDetails';
import { useTranslation } from '../../../../utils/translations';
import { useWorkout } from '../../../../context/WorkoutContext';
import { buildRecapPeriodCalendarAnalytics } from '../../../../utils/sport/recapCalendarPeriodAnalytics';
import { segmentRecapProseValues } from '../../../../utils/sport/recapProseMarks';

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
  const parts = segmentRecapProseValues(text);
  if (!parts.length) return null;
  return parts.map((part, index) =>
    part.mark ? (
      <em key={index} className="v">
        {part.text}
      </em>
    ) : (
      part.text
    )
  );
}

/** Badge depuis le kind — le blob texte est un filet de secours (évite GTG → Sommeil via « récup »). */
function motifClass(card, fallback) {
  const kind = String(card.kind || '').toLowerCase();
  if (kind.includes('sleep') || kind.includes('sommeil')) return 's';
  if (kind.includes('gtg')) return 'a';
  if (
    kind.includes('repertoire') ||
    kind.includes('emergence') ||
    kind.includes('span_new') ||
    kind.includes('first_exercise')
  ) {
    return 'm';
  }
  if (
    kind.includes('ms_return') ||
    kind.includes('ms_pr') ||
    kind.includes('progress') ||
    kind.includes('journey_pr') ||
    kind.includes('journey_progress')
  ) {
    return 'p';
  }
  if (
    kind.includes('rhythm') ||
    kind.includes('regular') ||
    kind.includes('continuity') ||
    kind.includes('freq')
  ) {
    return 'r';
  }
  if (kind.includes('pending') || kind.includes('absence') || kind.includes('alert')) return 'al';
  if (
    kind.includes('ms_cumul') ||
    kind.includes('ms_sessions') ||
    kind.includes('volume') ||
    kind.includes('density') ||
    kind.includes('peak')
  ) {
    return 'a';
  }

  const blob = `${card.title || ''} ${card.body || card.text || ''}`.toLowerCase();
  if (/sommeil|sleep|\bnuit\b/.test(blob)) return 's';
  if (/rythme|cadence|fréquence|frequence/.test(blob)) return 'r';
  if (/répertoire|repertoire|variété|variete/.test(blob)) return 'm';
  if (/progress|hausse|baisse| vs /.test(blob)) return 'p';
  // « manquerait » (hypothèse d’équilibre) ≠ alerte — éviter le faux positif.
  if (/\balerte\b|\battention\b|\bincomplet/.test(blob) || /\bmanque de\b|\bil manque\b/.test(blob)) {
    return 'al';
  }
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
  isAdmin = false,
  /** F7.0c — true tant que les cartes d’analyse finales ne sont pas publiées. */
  analysisLoading = false,
  analysisStatus = null
}) {
  const t = useTranslation();
  const { getCurrentData, data, getExerciseNameById } = useWorkout();
  const [family, setFamily] = useState('all');
  const [detailsOn, setDetailsOn] = useState(false);
  const [periodAnalytics, setPeriodAnalytics] = useState(null);
  // F7.0e : dates = fenêtre demandée (periodWindow), jamais enrichment d’une autre période.
  const resolvedWindow = periodWindow || null;
  const pub = assessment?.insightsPublication || null;
  const publicationMatchesPeriod =
    pub?.status === 'ready' &&
    (pub.period == null || String(pub.period) === String(period)) &&
    (!resolvedWindow?.start ||
      !pub.windowStart ||
      String(pub.windowStart) === String(resolvedWindow.start)) &&
    (!resolvedWindow?.end ||
      !pub.windowEnd ||
      String(pub.windowEnd) === String(resolvedWindow.end));
  const publicationReady = Boolean(publicationMatchesPeriod);
  const legacyReady =
    pub == null &&
    !analysisLoading &&
    analysisStatus !== 'loading' &&
    Boolean(assessment);
  // Jamais de cartes d’une autre période : « refreshing » sans publication alignée = écran vide/loader.
  const showInsightCards = publicationReady || legacyReady;
  // Ne jamais afficher des analytics dont la fenêtre ≠ période sélectionnée.
  const coherentAnalytics =
    periodAnalytics &&
    resolvedWindow?.start &&
    resolvedWindow?.end &&
    periodAnalytics.window?.start === resolvedWindow.start &&
    periodAnalytics.window?.end === resolvedWindow.end
      ? periodAnalytics
      : null;

  useEffect(() => {
    // Invalider immédiatement l’ancien header (évite libellé 2y + dates 30j).
    setPeriodAnalytics(null);
    setDetailsOn(false);
    if (!resolvedWindow?.start || !resolvedWindow?.end) {
      return undefined;
    }
    // F7.0f : pendant le loading insights, dates via periodWindow uniquement —
    // pas d’agrégation calendaire sync (source de saccades au changement de période).
    if (analysisLoading || analysisStatus === 'loading') {
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
    let cancelled = false;
    const runHeader = () => {
      if (cancelled) return;
      setPeriodAnalytics(buildRecapPeriodCalendarAnalytics({ ...base, phase: 'header' }));
    };
    const runFull = () => {
      if (cancelled) return;
      setPeriodAnalytics(buildRecapPeriodCalendarAnalytics({ ...base, phase: 'full' }));
      setDetailsOn(true);
    };
    const headerHandle = window.requestIdleCallback
      ? window.requestIdleCallback(runHeader, { timeout: 400 })
      : window.setTimeout(runHeader, 0);
    const fullHandle = window.requestIdleCallback
      ? window.requestIdleCallback(runFull, { timeout: 1600 })
      : window.setTimeout(runFull, 200);
    return () => {
      cancelled = true;
      if (window.requestIdleCallback) {
        window.cancelIdleCallback(headerHandle);
        window.cancelIdleCallback(fullHandle);
      } else {
        window.clearTimeout(headerHandle);
        window.clearTimeout(fullHandle);
      }
    };
  }, [
    data,
    getCurrentData,
    garminData,
    resolvedWindow?.start,
    resolvedWindow?.end,
    period,
    getExerciseNameById,
    recapState,
    analysisLoading,
    analysisStatus
  ]);

  const groups = useMemo(
    () => [
      { key: 'short', title: t('recap.assessment.horizonShort'), items: assessment?.insights?.shortTerm || [] },
      { key: 'medium', title: t('recap.assessment.horizonMedium'), items: assessment?.insights?.mediumTerm || [] },
      { key: 'long', title: t('recap.assessment.horizonLong'), items: assessment?.insights?.longTerm || [] }
    ],
    [assessment?.insights, t]
  );
  const cards = showInsightCards
    ? groups.flatMap((group) =>
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
      )
    : [];
  const familyCounts = cards.reduce((acc, card) => {
    acc[card.family] = (acc[card.family] || 0) + 1;
    return acc;
  }, {});
  const visible = family === 'all' ? cards : cards.filter((card) => card.family === family);
  const waitingInsights = analysisLoading || analysisStatus === 'loading' || !showInsightCards;

  return (
    <div className="rb-analyse">
      <RecapPeriodHighlightsPanel
        part="head"
        period={period}
        periodWindow={resolvedWindow}
        garminData={garminData}
        recapState={recapState}
        analytics={coherentAnalytics}
      />

      <div className="dist" role="tablist">
        <button type="button" className={family === 'all' ? 'on all' : 'all'} onClick={() => setFamily('all')}>
          {t('recap.analyse.filterAll', 'Toutes')} <b>{waitingInsights ? '…' : cards.length}</b>
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

      {waitingInsights ? (
        <p className="emp" role="status" aria-live="polite">
          {t('recap.analyse.loadingInsights', 'Préparation des analyses…')}
        </p>
      ) : visible.length === 0 ? (
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
              {card.evidence ? <div className="meta">{markValues(card.evidence)}</div> : null}
              {card.confidence ? <div className="meta">{card.confidence}</div> : null}
            </article>
          ))}
        </div>
      )}

      {detailsOn && !waitingInsights ? (
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

      {coherentAnalytics?.phase === 'full' ? (
        <RecapPeriodHighlightsPanel
          part="tail"
          period={period}
          periodWindow={resolvedWindow}
          garminData={garminData}
          recapState={recapState}
          analytics={coherentAnalytics}
        />
      ) : null}
    </div>
  );
}
