import React, { useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { buildRecapBenchmarkInsights } from '../../../utils/sport/recapBenchmarkInsights';
import { segmentRecapProseValues } from '../../../utils/sport/recapProseMarks';
import { RecapSection } from './components/RecapUiBlocks';
import RecapBenchmarkInsightDetailModal from './RecapBenchmarkInsightDetailModal';

const CATEGORY_META = {
  running: { label: 'Course', tone: 'running' },
  consistency: { label: 'Régularité', tone: 'consistency' },
  strength: { label: 'Street / force', tone: 's' },
  progression: { label: 'Progression séries/reps', tone: 'p' },
  wow: { label: 'Comparaisons', tone: 'k2' }
};

const LEAD_UNIT = '(?:%|reps?|kg|km|min|s|kcal|t)';

function tidyLead(value) {
  let s = String(value || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/\d+[.,]\d{3,}/, (m) => {
    const n = Number(m.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? String(Math.round(n * 10) / 10).replace('.', ',') : m;
  });
  return s.length > 0 && s.length <= 14 ? s : null;
}

function leadFromText(text) {
  const raw = String(text || '');
  const gap = raw.match(new RegExp(`manque\\s+([+-]?\\d(?:[\\d\\s:.,]|[.,]\\d){0,12}\\s?${LEAD_UNIT}?)`, 'i'));
  const gapLead = gap ? tidyLead(gap[1]) : null;
  if (gapLead) return gapLead;
  const percent = raw.match(/[+-]?\d[\d.,]*\s?%/);
  const percentLead = percent ? tidyLead(percent[0]) : null;
  if (percentLead) return percentLead;
  const fois = raw.match(/(\d+(?:[.,]\d+)?)\s*fois/i);
  const foisLead = fois ? tidyLead(fois[1]) : null;
  if (foisLead) return foisLead;
  const seances = raw.match(/(\d+[.,]\d+)\s*séances/i);
  if (seances) {
    const n = Number(seances[1].replace(',', '.'));
    if (Number.isFinite(n)) {
      const rounded = tidyLead(String(Math.round(n * 10) / 10).replace('.', ','));
      if (rounded) return rounded;
    }
  }
  const time = raw.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
  if (time) return time[0];
  const withUnit = raw.match(new RegExp(`[+-]?\\d(?:[\\d\\s]|[.,]\\d){0,12}\\s?${LEAD_UNIT}\\b`, 'i'));
  const unitLead = withUnit ? tidyLead(withUnit[0]) : null;
  if (unitLead) return unitLead;
  const grouped = raw.match(/\b\d{1,3}(?:\s\d{3})+\b/);
  if (grouped) return grouped[0];
  const pair = raw.match(/\b\d+\s?[×x]\s?\d+\b/);
  if (pair) return pair[0].replace(/x/gi, '×');
  return null;
}

function figureTone(text) {
  const s = String(text || '').toLowerCase();
  if (/manque|en baisse|régression|regression|stagnation/.test(s)) return 'gap';
  if (/place au|atteint|au-dessus|au dessus|plus rapide/.test(s)) return 'pos';
  return '';
}

function appendProseMarks(out, text, keyRef) {
  segmentRecapProseValues(text).forEach((part) => {
    if (part.mark) out.push(<em className="v" key={keyRef.i++}>{part.text}</em>);
    else out.push(part.text);
  });
}

function RichLine({ text }) {
  const src = String(text || '');
  const re = /(«[^»]+»|\b(?:novice|débutant|debutant|intermédiaire|intermediaire|confirmé|confirme|avancé|avance|élite|elite|moyen)\b|\b\d{1,2}:\d{2}(?::\d{2})?\b|\d+\s?[×x]\s?\d+)/gi;
  const out = [];
  let last = 0;
  const keyRef = { i: 0 };
  for (const match of src.matchAll(re)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (!token) continue;
    if (index > last) appendProseMarks(out, src.slice(last, index), keyRef);
    if (token.startsWith('«') && token.endsWith('»')) {
      out.push(<em className="q" key={keyRef.i++}>{token.slice(1, -1)}</em>);
    } else if (/^(novice|débutant|debutant|intermédiaire|intermediaire|confirmé|confirme|avancé|avance|élite|elite|moyen)$/i.test(token)) {
      out.push(<em className="q" key={keyRef.i++}>{token}</em>);
    } else {
      out.push(<em className="v" key={keyRef.i++}>{token}</em>);
    }
    last = index + token.length;
  }
  if (last < src.length) appendProseMarks(out, src.slice(last), keyRef);
  return out;
}

function InsightCard({ insight, onSelect }) {
  const meta = CATEGORY_META[insight.category] || CATEGORY_META.wow;
  const clickable = Boolean(insight.drillDown);
  const lead = leadFromText(insight.text);
  const inner = (
    <>
      <div className="n">{lead || '—'}</div>
      <div className="h">
        <span>{meta.label}</span>
        {clickable ? <span className="go">Détail →</span> : null}
      </div>
      <p><RichLine text={insight.text} /></p>
    </>
  );

  const tone = `${meta.tone} ${figureTone(insight.text)}`.trim();

  if (!clickable) {
    return (
      <div className={`rc ${tone}`}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(insight)}
      className={`rc ${tone}`}
    >
      {inner}
    </button>
  );
}

/**
 * Section « Coach repères » — sous la première rangée d'insights horizon (vue Analyse).
 */
export default function RecapBenchmarkCoachPanel({
  snapshot,
  enrichment,
  garminData,
  assessment,
  getExerciseNameById,
  profileQuestionnaireRaw,
  period,
  t
}) {
  const tr = t || ((k, d) => d);
  const { requestOpenCalendarDay } = useWorkout();
  const [selectedInsight, setSelectedInsight] = useState(null);

  const { insights } = useMemo(
    () =>
      buildRecapBenchmarkInsights({
        snapshot,
        enrichment,
        garminData,
        assessment,
        getExerciseNameById,
        profileQuestionnaireRaw,
        period
      }),
    [snapshot, enrichment, garminData, assessment, getExerciseNameById, profileQuestionnaireRaw, period]
  );

  if (!insights?.length) return null;

  return (
    <>
      <RecapSection
        title={tr('recap.benchmark.title', 'Repères & comparaisons')}
        subtitle={tr(
          'recap.benchmark.subtitle',
          'Votre profil comparé aux standards course, street workout et population — pas seulement des chiffres bruts.'
        )}
      >
        <div className="note">
          <span>
            {tr(
              'recap.benchmark.hint',
              'Estimations locales basées sur vos données Momentum et des repères sportifs publics. Cliquez sur une carte pour le détail.'
            )}
          </span>
        </div>
        <div className="rp">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onSelect={setSelectedInsight}
            />
          ))}
        </div>
      </RecapSection>

      {selectedInsight ? (
        <RecapBenchmarkInsightDetailModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
          onOpenCalendarDay={requestOpenCalendarDay}
          t={tr}
        />
      ) : null}
    </>
  );
}
