import React from 'react';
import RecapPeriodHighlightsPanel from '../RecapPeriodHighlightsPanel';
import RecapAnalyseDetails from './RecapAnalyseDetails';
import { useTranslation } from '../../../../utils/translations';

const HORIZON_PILLS = {
  short: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
  medium: 'bg-teal-500/20 text-teal-200 border-teal-500/40',
  long: 'bg-emerald-600/20 text-emerald-200 border-emerald-600/40'
};

const REWARD_CARD = {
  daily: 'border-l-2 border-l-emerald-400/85',
  jalon: 'border-l-2 border-l-sky-400/90',
  discovery: 'border-l-2 border-l-violet-400/90',
  transformation: 'border-l-2 border-l-orange-400/90',
  historic: 'border-l-2 border-l-rose-500/90'
};

const REWARD_TITLE = {
  daily: 'text-emerald-100/95',
  jalon: 'text-sky-100/95',
  discovery: 'text-violet-100/95',
  transformation: 'text-orange-100/95',
  historic: 'text-rose-100/95'
};

function InsightColumn({ title, items, horizonKey, accent }) {
  const pill = HORIZON_PILLS[horizonKey] || HORIZON_PILLS.medium;
  const cards = items || [];

  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pill}`}>
          {title}
        </span>
      </div>
      {cards.length === 0 ? (
        <p className="text-[12px] leading-relaxed text-slate-500">Aucun signal assez robuste.</p>
      ) : (
        <div className="space-y-4">
          {cards.map((item, i) => {
            const card = typeof item === 'object' && item ? item : { body: String(item || '') };
            const tone = REWARD_CARD[card.rewardTone] || '';
            const titleTone = REWARD_TITLE[card.rewardTone] || 'text-teal-100/95';
            return (
              <article key={i} className={`border-t border-white/10 pt-3 first:border-t-0 first:pt-0 pl-3 ${tone}`}>
                {card.title ? (
                  <h4 className={`mb-1.5 text-[12px] font-semibold leading-snug ${titleTone}`}>{card.title}</h4>
                ) : null}
                <p className="whitespace-pre-line text-[12px] leading-relaxed text-slate-200/95">
                  {card.body || card.text}
                </p>
                {card.evidence ? (
                  <p className="mt-1.5 text-[10px] tracking-wide text-slate-500">{card.evidence}</p>
                ) : null}
                {card.confidence ? <p className="mt-0.5 text-[10px] text-slate-500">{card.confidence}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const shortTerm = assessment?.insights?.shortTerm || [];
  const mediumTerm = assessment?.insights?.mediumTerm || [];
  const longTerm = assessment?.insights?.longTerm || [];

  return (
    <div className="space-y-5">
      <RecapPeriodHighlightsPanel
        period={period}
        periodWindow={periodWindow ?? enrichment?.window}
        garminData={garminData}
        recapState={recapState}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <InsightColumn
          title={t('recap.assessment.horizonShort')}
          items={shortTerm}
          horizonKey="short"
          accent="border-cyan-500/35 bg-cyan-950/25"
        />
        <InsightColumn
          title={t('recap.assessment.horizonMedium')}
          items={mediumTerm}
          horizonKey="medium"
          accent="border-teal-500/35 bg-teal-950/30"
        />
        <InsightColumn
          title={t('recap.assessment.horizonLong')}
          items={longTerm}
          horizonKey="long"
          accent="border-emerald-600/35 bg-emerald-950/25"
        />
      </div>

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
    </div>
  );
}
