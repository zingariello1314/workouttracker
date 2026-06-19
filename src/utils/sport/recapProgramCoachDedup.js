/**
 * Équilibre et déduplication des insights coach programme.
 * Même signal = même message sous-jacent → une seule section (priorité la plus pertinente).
 * Signaux distincts sur un même exo (max, tendance, volume) → conservés.
 */

const SECTION_PRIORITY = [
  'progression',
  'trends',
  'recovery',
  'structural',
  'compliments',
  'recommendations'
];

const DEFAULT_LIMITS = {
  structural: 4,
  progression: 5,
  recovery: 4,
  trends: 5,
  compliments: 4,
  recommendations: 4
};

function sectionRank(section) {
  const i = SECTION_PRIORITY.indexOf(section);
  return i >= 0 ? i : 99;
}

/** @param {{ id?: string, signal?: string }} insight */
export function inferInsightSignal(insight) {
  if (insight?.signal) return insight.signal;
  const id = String(insight?.id || '');

  if (id.startsWith('freq.pullups')) return 'pullups.frequency';
  if (id.startsWith('freq.pushups')) return 'pushups.frequency';
  if (id.startsWith('legs.run') || id === 'legs.low') return 'legs.plan_vs_cardio';
  if (id.includes('push.pull')) return 'push_pull.balance';
  if (id.startsWith('muscle.top3') || id.startsWith('muscle.undertrained')) return id;

  if (id.startsWith('prog.max.')) return id.replace('prog.max.', 'ex:') + ':max';
  if (id.startsWith('prog.up.')) return id.replace('prog.up.', 'ex:') + ':trend_up';
  if (id.startsWith('prog.down.')) return id.replace('prog.down.', 'ex:') + ':trend_down';
  if (id.startsWith('prog.flat.')) return id.replace('prog.flat.', 'ex:') + ':plateau';
  if (id.startsWith('prog.vol.')) return id.replace('prog.vol.', 'ex:') + ':volume';
  if (id.startsWith('prog.near.')) return id.replace('prog.near.', 'ex:') + ':near_max';
  if (id.startsWith('prog.sla')) return 'completion.sla';
  if (id === 'prog.pullups.aggregate') return 'pullups.volume_period';
  if (id.startsWith('prog.momentum')) return 'reps.momentum';
  if (id.startsWith('prog.record.')) return id;
  if (id.startsWith('prog.weight.')) return id;

  if (id.startsWith('sleep.')) return 'sleep.average';
  if (id.startsWith('load.')) return 'load.acute_chronic';
  if (id.startsWith('stress.')) return 'stress.garmin';
  if (id.startsWith('hr.ef.')) return 'running.hr_efficiency';

  if (id === 'trend.steps.training') return 'steps.correlation_training';
  if (id.startsWith('trend.challenge')) return 'challenges.completed';
  if (id.startsWith('trend.run.')) return 'running.volume_trend';
  if (id.startsWith('trend.completion')) return 'completion.trend';
  if (id.startsWith('trend.feedback')) return id;
  if (id.startsWith('trend.gtg')) return 'gtg.correlation';
  if (id.startsWith('trend.reps')) return 'reps.momentum';
  if (id.startsWith('trend.ef.pull')) return 'pullups.correlation_running';
  if (id.startsWith('trend.sleep.push')) return 'sleep.correlation_push';

  if (id.startsWith('compl.streak')) return 'streak.current';
  if (id.startsWith('compl.steps')) return 'steps.daily_high';
  if (id.startsWith('compl.challenge')) return 'challenges.progress';
  if (id.startsWith('compl.progression')) return 'progression.highlight';
  if (id.startsWith('compl.cardio')) return 'cardio.strength_balance';
  if (id.startsWith('compl.adherence') || id.startsWith('compl.completion')) return 'adherence.global';

  if (id.startsWith('rec.stretch')) return 'stretch.low';
  if (id.startsWith('rec.pull')) return 'pullups.freq_low';
  if (id.startsWith('rec.rowing') || id.startsWith('rec.back')) return 'push_pull.recommend';

  return id || 'unknown';
}

/**
 * @param {Record<string, Array<{ id?: string, signal?: string, text?: string, weight?: number }>>} rawLevels
 * @param {Record<string, number>} [limits]
 */
export function balanceCoachProgramLevels(rawLevels, limits = DEFAULT_LIMITS) {
  /** @type {Map<string, { section: string, insight: object }>} */
  const winners = new Map();

  SECTION_PRIORITY.forEach((section) => {
    (rawLevels[section] || []).forEach((insight) => {
      if (!insight?.text) return;
      const signal = inferInsightSignal(insight);
      const weight = insight.weight ?? 50;
      const prev = winners.get(signal);
      if (!prev || sectionRank(section) < sectionRank(prev.section) || (section === prev.section && weight > (prev.insight.weight ?? 0))) {
        winners.set(signal, { section, insight: { ...insight, signal, weight } });
      }
    });
  });

  /** @type {Record<string, object[]>} */
  const out = {};
  SECTION_PRIORITY.forEach((section) => {
    out[section] = [];
  });

  winners.forEach(({ section, insight }) => {
    out[section].push(insight);
  });

  SECTION_PRIORITY.forEach((section) => {
    out[section].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    const cap = limits[section] ?? 4;
    out[section] = out[section].slice(0, cap);
  });

  return out;
}

export { DEFAULT_LIMITS as COACH_LEVEL_LIMITS };
