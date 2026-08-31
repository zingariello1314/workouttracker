/**
 * Comparaisons hiérarchiques : personnel > programme > historique > population.
 * N'émet le niveau population (4) que si les niveaux 1–3 n'expliquent pas déjà le domaine.
 */

import { POPULATION_REFERENCES } from '../../data/performanceBenchmarks/population';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { buildWeightByDateMap } from './recapAssessmentSeries';
import {
  extractBenchmarkMetricsByExercise,
  benchmarkTierInsight
} from './strengthBenchmarkExtractors';
import { EXERCISE_BENCHMARK_REGISTRY } from './exerciseBenchmarkRegistry';
import { computeRunningVolumeTotals } from './runningVolumeTruth';
import DateHelper from '../dateHelper';

/**
 * @typedef {'personal'|'program'|'historical'|'population'} ComparisonLevel
 */

/**
 * @typedef {object} HierarchicalComparison
 * @property {string} id
 * @property {ComparisonLevel} level
 * @property {string} domain
 * @property {string} text
 * @property {number} confidence
 * @property {number} relevance
 * @property {Record<string, unknown>} [metrics]
 */

function resolveBodyWeightKg(snapshot, profileQuestionnaireRaw) {
  const map = buildWeightByDateMap(snapshot?.progressEntries);
  let latestYmd = null;
  let latestW = null;
  map.forEach((w, d) => {
    if (!latestYmd || d > latestYmd) {
      latestYmd = d;
      latestW = w;
    }
  });
  if (latestW != null) return latestW;
  const answers = normalizeProfileQuestionnaire(profileQuestionnaireRaw)?.answers || {};
  const n = Number(answers?.vitalsSelfReport?.weightKg ?? answers?.weightKg);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sessionsPerWeek(snapshot, window) {
  if (!window?.start || !window?.end) return 0;
  const dates = new Set();
  Object.keys(snapshot?.checkedExercises || {}).forEach((k) => {
    if (snapshot.checkedExercises[k] !== true) return;
    const d = k.slice(0, 10);
    if (d >= window.start && d <= window.end) dates.add(d);
  });
  const weeks = Math.max(1, DateHelper.getDateRange(window.start, window.end).length / 7);
  return Math.round((dates.size / weeks) * 10) / 10;
}

/**
 * Choisit la comparaison la plus pertinente par domaine (priorité niveau bas).
 * @param {HierarchicalComparison[]} rows
 * @param {number} [max=4]
 */
export function selectHierarchicalComparisons(rows, max = 4) {
  const byDomain = new Map();
  const levelRank = { personal: 1, program: 2, historical: 3, population: 4 };

  rows
    .filter((r) => r?.text && r.confidence >= 0.45)
    .sort((a, b) => {
      const lr = (levelRank[a.level] || 9) - (levelRank[b.level] || 9);
      if (lr !== 0) return lr;
      return b.relevance * b.confidence - a.relevance * a.confidence;
    })
    .forEach((row) => {
      if (!byDomain.has(row.domain)) byDomain.set(row.domain, row);
    });

  return [...byDomain.values()]
    .sort((a, b) => b.relevance * b.confidence - a.relevance * a.confidence)
    .slice(0, max);
}

/**
 * @param {object} opts
 * @returns {HierarchicalComparison[]}
 */
export function buildHierarchicalComparisons(opts = {}) {
  const {
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    trainingState = null,
    priorState = null,
    garminData = null,
    profileQuestionnaireRaw = null,
    getExerciseNameById = null
  } = opts;

  if (!window?.end) return [];

  const out = [];
  const features = trainingState?.features || {};
  const tier = trainingState?.context?.tier || assessment?.tier;

  const mom = assessment?.repsMomentumRatio;
  if (mom != null && mom >= 1.08) {
    out.push({
      id: 'cmp.personal.reps_momentum',
      level: 'personal',
      domain: 'volume',
      text: `Tu fais ~${Math.round((mom - 1) * 100)} % de reps en plus que sur ta période précédente — progression personnelle nette.`,
      confidence: 0.78,
      relevance: 0.88,
      metrics: { repsMomentumRatio: mom }
    });
  } else if (mom != null && mom <= 0.92) {
    out.push({
      id: 'cmp.personal.reps_slowdown',
      level: 'personal',
      domain: 'volume',
      text: `Ton volume reps est ~${Math.round((1 - mom) * 100)} % sous ta baseline récente — creux ou décharge par rapport à toi-même.`,
      confidence: 0.72,
      relevance: 0.8,
      metrics: { repsMomentumRatio: mom }
    });
  }

  if (priorState?.performance?.value && trainingState?.performance?.value) {
    const prev = priorState.performance.value;
    const cur = trainingState.performance.value;
    if (prev === 'declining' && cur !== 'declining' && cur !== 'unknown') {
      out.push({
        id: 'cmp.personal.perf_rebound',
        level: 'personal',
        domain: 'performance',
        text: 'Tes performances repartent après un creux récent — meilleure lecture que toute moyenne populationnelle.',
        confidence: 0.74,
        relevance: 0.86
      });
    }
  }

  const vol28 = features.volumeDelta28Pct ?? features.volume?.delta28Pct ?? null;
  const volHalf = features.periodHalfDeltaPct;
  if (vol28 != null && Number.isFinite(vol28) && Math.abs(vol28) >= 10 && Math.abs(vol28) <= 160) {
    out.push({
      id: 'cmp.personal.volume_delta',
      level: 'personal',
      domain: 'volume',
      text: `Volume ${vol28 >= 0 ? '+' : ''}${vol28} % vs tes 28 jours précédents — toi contre toi, même durée.`,
      confidence: 0.76,
      relevance: 0.82,
      metrics: { volumeDelta28Pct: vol28 }
    });
  } else if (
    volHalf != null &&
    Number.isFinite(volHalf) &&
    Math.abs(volHalf) >= 20 &&
    Math.abs(volHalf) <= 90 &&
    (vol28 == null || Math.abs(vol28) < 10)
  ) {
    out.push({
      id: 'cmp.personal.volume_half',
      level: 'personal',
      domain: 'volume',
      text: `Volume ${volHalf >= 0 ? '+' : ''}${volHalf} % entre la 1re et la 2e moitié de la période affichée — autre question que 28 j. vs 28 j.`,
      confidence: 0.62,
      relevance: 0.55,
      metrics: { periodHalfDeltaPct: volHalf }
    });
  }

  const prog = assessment?.programCompletion28?.ratio;
  if (prog != null && prog >= 0.78) {
    out.push({
      id: 'cmp.program.adherence_high',
      level: 'program',
      domain: 'adherence',
      text: `~${Math.round(prog * 100)} % du programme réalisé — tu exécutes bien ce que ton plan demande.`,
      confidence: 0.8,
      relevance: 0.85,
      metrics: { programRatio: prog }
    });
  } else if (prog != null && prog < 0.45) {
    out.push({
      id: 'cmp.program.adherence_low',
      level: 'program',
      domain: 'adherence',
      text: `Adhérence programme ~${Math.round(prog * 100)} % — l'écart principal est entre prévu et réalisé, pas vs une moyenne externe.`,
      confidence: 0.78,
      relevance: 0.84,
      metrics: { programRatio: prog }
    });
  }

  const sla = assessment?.sessionLoadAlignment28?.avgScore0to100;
  if (sla != null && sla >= 82 && assessment?.sessionLoadAlignment28?.sessionDaysScored >= 3) {
    out.push({
      id: 'cmp.program.load_aligned',
      level: 'program',
      domain: 'load',
      text: `Charge réalisée très proche du prévu (~${Math.round(sla)}/100) — ton programme est bien calibré pour toi.`,
      confidence: 0.82,
      relevance: 0.83,
      metrics: { sessionAlignment: sla }
    });
  }

  const tenure = assessment?.tenureDays;
  const reg = assessment?.regularityScore;
  if (tenure != null && tenure >= 120 && reg != null && reg >= 0.62) {
    out.push({
      id: 'cmp.historical.consistency',
      level: 'historical',
      domain: 'consistency',
      text: `${tenure} j. d'historique avec régularité ~${Math.round(reg * 100)} % — profil d'entraînement installé dans le temps.`,
      confidence: 0.75,
      relevance: 0.8,
      metrics: { tenureDays: tenure, regularity: reg }
    });
  }

  if (assessment?.lifetimeReps >= 15000) {
    out.push({
      id: 'cmp.historical.volume_veteran',
      level: 'historical',
      domain: 'volume',
      text: `${Math.round(assessment.lifetimeReps).toLocaleString('fr-FR')} reps cumulées — volume de carrière élevé ; compare-toi surtout à tes 4–8 dernières semaines.`,
      confidence: 0.7,
      relevance: 0.72,
      metrics: { lifetimeReps: assessment.lifetimeReps }
    });
  }

  const domainsWithStrongPersonal = new Set(
    out.filter((r) => r.level === 'personal' && r.relevance >= 0.82).map((r) => r.domain)
  );

  const spw = sessionsPerWeek(snapshot, window);
  const popSess = POPULATION_REFERENCES.averageAdult.sessionsPerWeek;
  if (
    spw >= 1.5 &&
    popSess > 0 &&
    !domainsWithStrongPersonal.has('consistency')
  ) {
    const ratio = Math.round((spw / popSess) * 10) / 10;
    if (ratio >= 1.6) {
      out.push({
        id: 'cmp.population.frequency',
        level: 'population',
        domain: 'consistency',
        text: `~${spw} séances/sem. vs ~${popSess} pour un adulte moyen (×${ratio}) — régularité au-dessus de la population générale.`,
        confidence: 0.68,
        relevance: 0.7,
        metrics: { sessionsPerWeek: spw, popRef: popSess }
      });
    }
  }

  const bodyWeightKg = resolveBodyWeightKg(snapshot, profileQuestionnaireRaw);
  const strengthExtract = extractBenchmarkMetricsByExercise(snapshot, window, getExerciseNameById);
  if (strengthExtract.structuredSessionCount >= 2 && !domainsWithStrongPersonal.has('performance')) {
    for (const def of EXERCISE_BENCHMARK_REGISTRY) {
      const metrics = strengthExtract.byBenchmarkKey.get(def.key);
      if (!metrics?.maxSetReps && !metrics?.maxWeightKg) continue;
      const insight = benchmarkTierInsight(def, metrics, bodyWeightKg);
      if (!insight?.text) continue;
      const isStrongTier = insight.priority >= 76;
      if (!isStrongTier && tier !== 'Débutant') continue;
      out.push({
        id: `cmp.population.strength.${def.key}`,
        level: 'population',
        domain: 'performance',
        text: insight.text.replace(/^Sur /, 'Référence population — sur '),
        confidence: 0.65,
        relevance: isStrongTier ? 0.74 : 0.62,
        metrics: { benchmarkKey: def.key }
      });
      break;
    }
  }

  if (window?.start && garminData != null) {
    const yearStart = `${window.end.slice(0, 4)}-01-01`;
    const yearTotals = computeRunningVolumeTotals(snapshot, garminData, {
      start: yearStart,
      end: window.end
    });
    const popKm = POPULATION_REFERENCES.averageAdult.runningKmPerYear;
    if (yearTotals.totalKm >= 80 && popKm > 0 && !domainsWithStrongPersonal.has('volume')) {
      const ratioKm = Math.round((yearTotals.totalKm / popKm) * 10) / 10;
      if (ratioKm >= 2) {
        out.push({
          id: 'cmp.population.running_year',
          level: 'population',
          domain: 'endurance',
          text: `${Math.round(yearTotals.totalKm).toLocaleString('fr-FR')} km courus cette année — ~×${ratioKm} vs un adulte français loisir moyen.`,
          confidence: 0.66,
          relevance: 0.71,
          metrics: { yearKm: yearTotals.totalKm }
        });
      }
    }
  }

  if (bodyWeightKg > 0 && strengthExtract.structuredSessionCount >= 1) {
    const pull = strengthExtract.byBenchmarkKey.get('pullups_strict');
    if (pull?.maxSetReps > 0) {
      const ratio = pull.maxSetReps / bodyWeightKg;
      if (ratio >= 0.2 && tier === 'Avancé') {
        out.push({
          id: 'cmp.personal.relative_strength',
          level: 'personal',
          domain: 'performance',
          text: `Tractions : ${pull.maxSetReps} reps à ${bodyWeightKg} kg — force relative (~${Math.round(ratio * 100) / 100} rep/kg) plus parlante qu'un classement générique.`,
          confidence: 0.72,
          relevance: 0.84,
          metrics: { maxReps: pull.maxSetReps, bodyWeightKg, ratio }
        });
      }
    }
  }

  return selectHierarchicalComparisons(out, 5);
}

/**
 * @param {HierarchicalComparison[]} comparisons
 */
export function comparisonsToInterpretationCandidates(comparisons) {
  return (comparisons || []).map((c) => ({
    id: c.id,
    type: 'hierarchical_comparison',
    pillar: 'comparison',
    horizon: c.level === 'population' ? 'long' : c.level === 'personal' ? 'short' : 'medium',
    state: c.level,
    evidence: [c.text],
    metrics: c.metrics || {},
    confidence: c.confidence,
    relevance: c.relevance,
    novelty: c.level === 'population' ? 0.72 : 0.8,
    actionability: c.level === 'program' ? 0.65 : 0.45,
    severity: 0.1,
    context: { level: c.level, domain: c.domain },
    text: c.text
  }));
}
