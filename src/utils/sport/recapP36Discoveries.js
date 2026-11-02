/**
 * P3.6 — Découvertes comportementales (habitudes, weekday, exercices, stabilité).
 * Abstention silencieuse si preuves insuffisantes.
 *
 * @module recapP36Discoveries
 */

import { CONTENT_CLASS } from './recapDiscoveryContentClass';
import { computeP36WindowMetrics } from './recapP36Metrics';
import { P36_KINDS, P36_RIVAL_GROUPS } from './recapP36Kinds';

export { P36_KINDS, P36_RIVAL_GROUPS };

function evidenceLine(evidence = {}) {
  if (typeof evidence === 'string') return evidence;
  if (Array.isArray(evidence)) return evidence.filter(Boolean).map(String).join(' · ');
  if (!evidence || typeof evidence !== 'object') return evidence == null ? '' : String(evidence);
  const parts = [];
  for (const [k, v] of Object.entries(evidence)) {
    if (k === 'phase' || v == null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') parts.push(String(v));
    else if (typeof v === 'object' && (v.name || v.label || v.title)) {
      parts.push(String(v.name || v.label || v.title));
    }
  }
  return parts.join(' · ');
}

function card({
  kind,
  title,
  body,
  nature = 'trajectory',
  contentClass = CONTENT_CLASS.ANALYTICAL,
  evidence = {},
  weights = {},
  metrics = {}
}) {
  const informative = Number(weights.informativeValue) || 70;
  const isDescriptive = contentClass === CONTENT_CLASS.DESCRIPTIVE;
  return {
    kind,
    title,
    body,
    nature,
    family: 'p36',
    contentClass,
    evidence: evidenceLine(evidence),
    weights: {
      importance: Math.min(0.9, Math.max(0.55, informative / 100)),
      reliability: isDescriptive ? 0.84 : 0.9,
      novelty: isDescriptive ? 0.55 : 0.7,
      fit: 0.9,
      ...weights
    },
    metrics: {
      phase: 'P3.6',
      contentClass,
      informativeValue: informative,
      ...metrics,
      evidenceDetail: evidence && typeof evidence === 'object' ? evidence : undefined
    }
  };
}

function fmtPct(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${String(n).replace('.', ',')} %`;
}

/**
 * @param {object} opts
 */
export function buildP36Discoveries({
  snapshot = null,
  window = null,
  todayYmd = null,
  liveActiveProgram = null,
  getExerciseNameById = null,
  includeP36Discoveries = true,
  dayTableCache = null
} = {}) {
  if (!includeP36Discoveries) {
    return { discoveries: [], metrics: null, abstentions: ['opt_out'] };
  }
  if (!snapshot || !window?.start || !window?.end) {
    return { discoveries: [], metrics: null, abstentions: ['missing_window'] };
  }

  const metrics = computeP36WindowMetrics(snapshot, window, {
    todayYmd,
    liveActiveProgram,
    getExerciseNameById,
    dayTableCache
  });

  const discoveries = [];

  // A — régularité weekday
  const reg = metrics.weekdayRegularity;
  if (reg.publishable && reg.tiedGroup?.length >= 2) {
    const labels = reg.tiedGroup.map((t) => t.label).join(', ');
    const sample = reg.tiedGroup[0];
    discoveries.push(
      card({
        kind: P36_KINDS.WEEKDAY_REGULARITY,
        title: 'Jours habituellement actifs',
        body:
          `Sur cette période, ${labels} présentent des fréquences d’entraînement classique enregistré proches ` +
          `(environ ${fmtPct(sample.rateClassicPct)} des occurrences éligibles). ` +
          `Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. ` +
          `L’absence d’enregistrement n’équivaut pas à une inactivité physique prouvée.`,
        evidence: { tiedGroup: reg.tiedGroup },
        metrics: {
          proofLevel: 'eligible_weekday_rates',
          metric: reg.metric
        },
        weights: { informativeValue: 74 }
      })
    );
  } else if (reg.publishable && reg.champion) {
    const c = reg.champion;
    let body =
      `Sur les ${c.eligibleOccurrences} ${c.label}s éligibles de la période, ` +
      `tu as une séance classique enregistrée ${c.withClassicExclusive} fois (${fmtPct(c.rateClassicPct)}). ` +
      `C’est le jour où ta présence classique documentée est la plus régulière`;
    if (c.gapPp != null) {
      body += ` (écart d’environ ${String(c.gapPp).replace('.', ',')} points avec le suivant)`;
    }
    body += '.';
    if (reg.evolution?.comparable && Math.abs(reg.evolution.deltaPp) >= 10) {
      body +=
        ` Sur la période précédente comparable, ce taux était de ${fmtPct(reg.evolution.previousRatePct)}.`;
    } else if (reg.evolution?.comparable && Math.abs(reg.evolution.deltaPp) < 8) {
      body += ` Ce rythme est resté proche de la période précédente.`;
    }
    body +=
      ' Ces taux portent sur les enregistrements, pas sur une activité physique non documentée.';
    discoveries.push(
      card({
        kind: P36_KINDS.WEEKDAY_REGULARITY,
        title: `${cap(c.label)} : jour le plus régulier`,
        body,
        evidence: { champion: c, evolution: reg.evolution },
        metrics: {
          proofLevel: 'eligible_weekday_rates',
          dow: c.dow,
          rateClassicPct: c.rateClassicPct
        },
        weights: { informativeValue: 82 }
      })
    );
  }

  // B — volume weekday
  const vol = metrics.weekdayVolume;
  if (vol.publishable && vol.top) {
    const t = vol.top;
    let body =
      `Les ${t.label}s concentrent ${fmtPct(t.sharePct)} des répétitions classiques enregistrées ` +
      `(hors sync GTG) sur la période`;
    if (t.meanClassicRepsPerActiveDay != null) {
      body +=
        `, soit environ ${Math.round(t.meanClassicRepsPerActiveDay)} répétitions par ${t.label} actif`;
    }
    body += '.';
    body +=
      ' Il s’agit de quantité documentée, pas d’une intensité physiologique.';
    discoveries.push(
      card({
        kind: P36_KINDS.WEEKDAY_VOLUME,
        title: `${cap(t.label)} : davantage de répétitions`,
        body,
        evidence: { top: t },
        metrics: {
          proofLevel: 'classic_exclusive_reps_share',
          unit: vol.unit,
          sharePct: t.sharePct
        },
        weights: { informativeValue: 76 }
      })
    );
  }

  // B cross freq vs volume
  const fv = metrics.freqVsVolume;
  if (fv.publishable) {
    const freqLabels = Array.isArray(fv.freqLabels) ? fv.freqLabels : [fv.freqLabel];
    const freqPhrase = formatWeekdayList(freqLabels);
    const freqIntro = `Tu t’entraînes plus régulièrement ${freqPhrase}`;
    const volActiveN = fv.volActiveDays ?? null;
    const strength = fv.strengthClass || 'descriptive_tendency';
    let body;
    if (fv.mode === 'per_active_day') {
      let loadVerb;
      if (strength === 'punctual_limited' || (volActiveN != null && volActiveN < 3)) {
        loadVerb = `comportent davantage de répétitions sur les ${volActiveN ?? 2} ${fv.volLabel}s actifs observés — constat limité, pas une habitude générale`;
      } else if (strength === 'repeated_habit') {
        loadVerb = `comportent régulièrement davantage de répétitions`;
      } else {
        loadVerb = `comportent généralement davantage de répétitions`;
      }
      body =
        `${freqIntro} ` +
        `(${fmtPct(fv.freqRatePct)} des occurrences éligibles enregistrées), ` +
        `mais tes séances du ${fv.volLabel} ${loadVerb} ` +
        `(médiane ~${Math.round(fv.volMedianActive ?? fv.volMeanActive)} reps par ${fv.volLabel} actif` +
        (fv.freqRefMean != null
          ? `, contre ~${Math.round(fv.freqRefMean)} sur ton jour régulier le plus chargé`
          : '') +
        ').';
    } else {
      body =
        `${freqIntro} ` +
        `(${fmtPct(fv.freqRatePct)} des occurrences éligibles enregistrées), ` +
        `mais tes séances du ${fv.volLabel} portent davantage de répétitions ` +
        `(${fmtPct(fv.volSharePct)} du volume classique de la période` +
        (fv.volMeanActive != null
          ? `, ~${Math.round(fv.volMeanActive)} reps par jour actif`
          : '') +
        ').';
    }
    const informativeValue =
      strength === 'punctual_limited' ? 68 : strength === 'repeated_habit' ? 90 : 86;
    discoveries.push(
      card({
        kind: P36_KINDS.FREQ_VS_VOLUME,
        title:
          strength === 'punctual_limited'
            ? 'Fréquence et charge divergent sur cette période'
            : 'Fréquence et charge ne coïncident pas',
        body,
        evidence: {
          ...fv,
          volValues: fv.volValues,
          strengthClass: strength
        },
        metrics: {
          proofLevel:
            fv.mode === 'per_active_day'
              ? 'freq_rate_vs_median_load_per_active_day'
              : 'freq_rate_vs_volume_share',
          mode: fv.mode,
          strengthClass: strength,
          note: fv.note
        },
        weights: { informativeValue }
      })
    );
  }

  // C — exercices
  const ex = metrics.exercises;
  if (ex.publishableFreq && ex.topFreq) {
    const f = ex.topFreq;
    let body =
      `${f.label} apparaît sur ${f.dayCount} journées de la période — ` +
      `c’est l’exercice le plus souvent présent en séances classiques.`;
    if (ex.freqStatus === 'stable_dominant_freq') {
      body += ' Cette place était déjà la sienne sur la période précédente.';
    } else if (ex.freqStatus === 'shifted_freq_leader') {
      body += ' Ce n’était pas le plus fréquent juste avant.';
    }
    discoveries.push(
      card({
        kind: P36_KINDS.EXERCISE_FREQ,
        title: `${f.label} : le plus souvent présent`,
        body,
        contentClass: CONTENT_CLASS.DESCRIPTIVE,
        evidence: { topFreq: f, freqStatus: ex.freqStatus },
        metrics: {
          exerciseId: f.id,
          dayCount: f.dayCount,
          proofLevel: 'classic_day_frequency',
          freqStatus: ex.freqStatus
        },
        weights: { informativeValue: 72 }
      })
    );
  }

  if (ex.publishableVol && ex.topVolume) {
    const v = ex.topVolume;
    // Si même exercice que freq et déjà publié, laisser E0 rivaliser
    let body =
      `${v.label} représente ${fmtPct(v.sharePct)} des répétitions classiques ` +
      `(hors sync GTG) de la période (${v.exclusiveReps} reps sur ${v.dayCount} jour${v.dayCount > 1 ? 's' : ''}).`;
    if (ex.volStatus === 'stable_dominant_volume') {
      body += ' Cette part dominante était déjà observée juste avant.';
    } else if (ex.volStatus === 'shifted_volume_leader') {
      body += ' Cette domination en volume est récente par rapport à la période précédente.';
    }
    discoveries.push(
      card({
        kind: P36_KINDS.EXERCISE_VOLUME,
        title: `${v.label} : plus grosse part du volume`,
        body,
        evidence: { topVolume: v, volStatus: ex.volStatus },
        metrics: {
          exerciseId: v.id,
          sharePct: v.sharePct,
          unit: 'classic_exclusive_reps',
          proofLevel: 'classic_exclusive_rep_share',
          volStatus: ex.volStatus,
          trajectoryOk: ex.volStatus === 'shifted_volume_leader'
        },
        weights: { informativeValue: 80 }
      })
    );
  }

  // D — stabilité
  const st = metrics.stability;
  if (st.publishable) {
    discoveries.push(
      card({
        kind: P36_KINDS.HABIT_STABILITY,
        title: 'Rythme hebdomadaire stable',
        body:
          `Sur ${st.weekCount} semaines suffisamment couvertes, tu as conservé environ ` +
          `${st.medianActiveDaysPerWeek} jour${st.medianActiveDaysPerWeek > 1 ? 's' : ''} ` +
          `d’activité enregistrée par semaine (médiane), avec peu de variation d’une semaine à l’autre. ` +
          `La stabilité ici décrit la présence, pas le volume ni la progression.`,
        evidence: {
          weekCount: st.weekCount,
          medianActiveDaysPerWeek: st.medianActiveDaysPerWeek,
          cvActiveDays: st.cvActiveDays
        },
        metrics: {
          proofLevel: 'weekly_active_day_cv',
          cvActiveDays: st.cvActiveDays
        },
        weights: { informativeValue: 78 }
      })
    );
  }

  // E — assiduité prouvée
  const pr = metrics.provenDow;
  if (pr.publishable && pr.top) {
    discoveries.push(
      card({
        kind: P36_KINDS.PROVEN_ADHERENCE_DOW,
        title: `Assiduité prouvée le ${pr.top.label}`,
        body:
          `Parmi les ${pr.top.provenPlannedWorkout} ${pr.top.label}s avec séance historiquement prévue et démontrée, ` +
          `${pr.top.provenPartialOrFull} ont une réalisation au moins partielle (${fmtPct(pr.top.ratePct)}). ` +
          `Seules les journées à plan comparable (snapshots proven) entrent dans ce taux.`,
        evidence: { top: pr.top },
        metrics: {
          proofLevel: 'demonstrated_plan_only',
          ratePct: pr.top.ratePct
        },
        weights: { informativeValue: 84 }
      })
    );
  }

  return {
    discoveries: discoveries.filter(
      (d) => d?.title && String(d.body || '').length >= 40
    ),
    metrics,
    abstentions: metrics.abstentions || []
  };
}

function cap(s) {
  const t = String(s || '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** « le lundi », « le lundi et le mardi », « le lundi, le mardi et le vendredi ». */
function formatWeekdayList(labels) {
  const parts = (labels || []).filter(Boolean).map((l) => `le ${l}`);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} et ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`;
}
