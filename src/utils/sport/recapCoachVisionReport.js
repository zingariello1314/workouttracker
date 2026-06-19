/**
 * Rapport Vision Coach structuré — KPIs, synthèse, sections filtrées (2025+ en 2026).
 */

import DateHelper from '../dateHelper';
import { JUSTIFICATION_REASONS } from '../dayJustificationUtils';
import { buildCoachVisionNarrative } from './recapCoachVision';
import {
  buildMonthlyCoachStats,
  findBestMonthFromMonths,
  monthLabelFr,
  relevantMonthCutoff
} from './recapCoachVisionTemporal';
import { getCompletionForWindow } from './recapCompletionTruth';
import { resolveStreetSkillPlan } from '../../features/profileQuestionnaire/quizStreetSkillGoal';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { challengeProgressPct } from './recapInsightHelpers';

const WEEKDAY_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const ACCENT_MAP = {
  temporal: 'teal',
  adherence: 'cyan',
  load: 'teal',
  endurance: 'sky',
  recovery: 'indigo',
  program: 'amber'
};

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function formatMonthYear(mk) {
  return mk ? `${monthLabelFr(mk)} ${mk.slice(0, 4)}` : '';
}

/** Supprime insights trop anciens (ex. creux 2024 quand on est en 2026). */
function isStaleInsight(text, endYmd) {
  const t = String(text || '');
  const currentYear = parseInt(String(endYmd).slice(0, 4), 10);
  const minYear = currentYear - 1;

  if (/creux de régularité|Arc mensuel/i.test(t)) return true;

  const years = [...t.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1], 10));
  if (years.some((y) => y < minYear)) return true;

  return false;
}

function dedupeSimilar(bullets) {
  const out = [];
  bullets.forEach((b) => {
    const key = b.slice(0, 40).toLowerCase();
    if (!out.some((x) => x.slice(0, 40).toLowerCase() === key)) out.push(b);
  });
  return out;
}

function classifyParagraph(p) {
  if (/^Garmin/i.test(p)) return 'recovery';
  if (/^Charge & performance/i.test(p)) return 'load';
  if (/^« .+ » cadre|^Programme actif/i.test(p)) return 'program';
  if (/^Dynamique récente|^Micro-dynamique/i.test(p)) return 'temporal';
  return 'temporal';
}

function splitIntoBullets(paragraph) {
  return paragraph
    .replace(/^[^:]+:\s*/, '')
    .split(/\s*[·•;]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function topDayOfWeek(dayOfWeek) {
  const trained = (dayOfWeek || []).filter((d) => d.plannedDays >= 2);
  if (!trained.length) return null;
  return {
    best: [...trained].sort((a, b) => b.plannedDays - a.plannedDays)[0],
    weak: [...trained].sort((a, b) => a.plannedDays - b.plannedDays)[0]
  };
}

function buildEnrichmentExtras(enrichment, assessment, snapshot) {
  const extras = { adherence: [], load: [], endurance: [], recovery: [] };
  const comp = enrichment?.completion;
  const just = enrichment?.justifications;
  const fb = enrichment?.feedback;
  const least = enrichment?.leastCheckedExercises?.slice(0, 2) || [];
  const dow = topDayOfWeek(enrichment?.dayOfWeek);
  const stretch = enrichment?.stretchZones;

  if (comp?.stretchPct != null && comp.exoPct != null && comp.exoPct - comp.stretchPct >= 25) {
    extras.adherence.push(`Étirements ~${comp.stretchPct} % vs exos ~${comp.exoPct} %.`);
  }

  if (just?.byReason?.[JUSTIFICATION_REASONS.MALADIE] >= 1) {
    extras.adherence.push(`${just.byReason[JUSTIFICATION_REASONS.MALADIE]} j. maladie/blessure au calendrier.`);
  }

  if (dow?.best) {
    extras.adherence.push(`Jour le plus actif : ${WEEKDAY_FR[dow.best.dow]} (${dow.best.plannedDays} séances).`);
  }

  if (least.length >= 1) {
    extras.adherence.push(`Exos à renforcer : ${least.map((e) => e.name).join(', ')}.`);
  }

  if (fb?.count >= 3 && fb.difficulte != null) {
    extras.adherence.push(`Difficulté ressentie ~${fb.difficulte}/10 (${fb.count} feedbacks).`);
  }

  const pp = enrichment?.pushPull;
  if (pp?.pushPct != null && (pp.push || 0) + (pp.pull || 0) >= 80) {
    extras.load.push(`Push/pull : ${pp.pushPct} % / ${pp.pullPct} %.`);
  }

  const muscles = enrichment?.muscleShareRows?.slice(0, 2) || [];
  if (muscles.length >= 1) {
    extras.load.push(`Dominante : ${muscles.map((m) => m.groupId).join(', ')}.`);
  }

  const per = enrichment?.digest?.perActivity || {};
  const run = per.running?.totals;
  if (run?.distanceKm >= 5) {
    extras.endurance.push(`${round1(run.distanceKm)} km · ${run.sessions || 0} sortie(s).`);
  }

  const completed = (enrichment?.digest?.challenges || []).filter((c) => c?.status === 'completed');
  if (completed.length >= 1) {
    extras.endurance.push(`${completed.length} défi(s) validé(s).`);
  }

  if (fb?.fatigue != null && fb.count >= 3) {
    extras.recovery.push(`Fatigue ~${fb.fatigue}/10.`);
  }

  return extras;
}

function buildLead({ periodComp, bestMonth, currentMk, streak, enrichment, answers, endYmd }) {
  const parts = [];
  const street = resolveStreetSkillPlan(answers || {});

  if (periodComp?.exoPct != null) {
    parts.push(
      periodComp.exoPct >= 80
        ? `adhérence solide (~${periodComp.exoPct} % des exos cochés)`
        : `complétion exos ~${periodComp.exoPct} %`
    );
  }

  if (bestMonth?.monthKey === currentMk) {
    parts.push(`${formatMonthYear(currentMk)} est ton meilleur mois récent (${bestMonth.trainedDays} j.)`);
  } else if (bestMonth) {
    parts.push(`meilleur mois récent : ${formatMonthYear(bestMonth.monthKey)}`);
  }

  if ((streak?.current ?? 0) >= 3) {
    parts.push(`série de ${streak.current} j.${streak.longest ? ` (record ${streak.longest} j.)` : ''}`);
  }

  const km = enrichment?.digest?.perActivity?.running?.totals?.distanceKm;
  if (km >= 8) parts.push(`${round1(km)} km de course sur la période`);

  if (street.labelFr) parts.push(`cap « ${street.labelFr} »`);

  if (!parts.length) return null;
  const year = endYmd.slice(0, 4);
  return `En ${year}, ${parts.join(' · ')}.`;
}

/**
 * @returns {{ kpis, sections, lead, text }}
 */
export function buildCoachVisionReport(opts = {}) {
  const text = buildCoachVisionNarrative(opts);
  const {
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    activeProgram = null,
    profileQuestionnaireRaw = null,
    programs = [],
    getTodayWorkout = null,
    isAdmin = false,
    isAuthenticated = false,
    garminData = null
  } = opts;

  const endYmd = window?.end || DateHelper.getTodayLocal();
  const windowStart = window?.start ?? null;
  const ctx = {
    programs,
    activeProgram,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    alignWithCalendar: true
  };
  const answers = normalizeProfileQuestionnaire(profileQuestionnaireRaw).answers || {};
  const periodComp =
    enrichment?.completion || getCompletionForWindow(snapshot, { start: windowStart, end: endYmd }, ctx);

  const months = buildMonthlyCoachStats(snapshot, endYmd, ctx, {
    windowStart,
    garminData,
    minMonthKey: relevantMonthCutoff(endYmd, 1)
  });
  const bestMonth = findBestMonthFromMonths(months);
  const currentMk = endYmd.slice(0, 7);

  const grouped = {
    temporal: [],
    adherence: [],
    load: [],
    endurance: [],
    recovery: [],
    program: []
  };

  text.split('\n\n').forEach((para) => {
    if (isStaleInsight(para, endYmd)) return;
    const bucket = classifyParagraph(para);
    const body = para.replace(/^[^:]+:\s*/, '').trim() || para;
    const bullets = body.includes('·') || body.includes(';') ? splitIntoBullets(para) : [body];
    bullets.forEach((b) => {
      const line = b.replace(/\.$/, '');
      if (!isStaleInsight(line, endYmd)) grouped[bucket].push(line);
    });
  });

  const extras = buildEnrichmentExtras(enrichment, assessment, snapshot);
  Object.keys(extras).forEach((k) => {
    extras[k].forEach((line) => {
      if (!grouped[k].some((x) => x.includes(line.slice(0, 20)))) grouped[k].push(line);
    });
  });

  const lead = buildLead({
    periodComp,
    bestMonth,
    currentMk,
    streak: enrichment?.streak,
    enrichment,
    answers,
    endYmd
  });

  const sectionMeta = {
    temporal: { title: 'Évolution récente' },
    adherence: { title: 'Calendrier & cohérence' },
    load: { title: 'Charge & muscles' },
    endurance: { title: 'Cardio & défis' },
    recovery: { title: 'Récupération' },
    program: { title: 'Priorité maintenant' }
  };

  const sections = ['temporal', 'adherence', 'load', 'endurance', 'recovery', 'program']
    .map((id) => {
      let bullets = dedupeSimilar(grouped[id]).filter((b) => !isStaleInsight(b, endYmd));

      if (id === 'program') {
        const street = resolveStreetSkillPlan(answers);
        if (street.labelFr && !bullets.some((b) => b.includes(street.labelFr))) {
          bullets.unshift(`Objectif : ${street.labelFr}.`);
        }
        const load = assessment?.sessionLoadAlignment28;
        if (load?.avgScore0to100 != null && load.avgScore0to100 < 60) {
          bullets.push('Exécuter le plan tel qu’écrit — pas de volume en plus.');
        } else if ((periodComp?.exoPct ?? 0) >= 85) {
          bullets.push('Consolider avant d’ajouter une contrainte.');
        } else {
          bullets.push('Tenir le rythme sans brûler la régularité.');
        }
      }

      bullets = bullets.slice(0, id === 'program' ? 3 : 2);
      if (!bullets.length) return null;

      return {
        id,
        title: sectionMeta[id].title,
        accent: ACCENT_MAP[id],
        summary: id === 'program' && activeProgram?.name ? activeProgram.name : undefined,
        bullets
      };
    })
    .filter(Boolean);

  const kpis = [];
  if (periodComp?.exoPct != null) {
    kpis.push({
      id: 'exo',
      label: 'Exos',
      value: `${periodComp.exoPct} %`,
      note: periodComp.exoChecked != null ? `${periodComp.exoChecked}/${periodComp.exoTotal}` : undefined,
      accent: 'teal'
    });
  }
  if (periodComp?.activeTrainingDays >= 1) {
    kpis.push({
      id: 'days',
      label: 'Jours',
      value: String(periodComp.activeTrainingDays),
      accent: 'cyan'
    });
  }
  const streak = enrichment?.streak;
  if (streak?.current >= 2) {
    kpis.push({
      id: 'streak',
      label: 'Série',
      value: `${streak.current} j.`,
      note: streak.longest ? `rec. ${streak.longest} j.` : undefined,
      accent: 'violet'
    });
  }
  const runKm = enrichment?.digest?.perActivity?.running?.totals?.distanceKm;
  if (runKm >= 1) {
    kpis.push({
      id: 'run',
      label: 'Course',
      value: `${round1(runKm)} km`,
      accent: 'sky'
    });
  }

  return { kpis: kpis.slice(0, 4), sections, lead, text };
}
