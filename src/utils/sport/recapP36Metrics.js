/**
 * P3.6 — Agrégats comportementaux (régularité, quantité, exercices, stabilité, assiduité).
 * @module recapP36Metrics
 */

import {
  buildP36OccasionTable,
  previousWindowEqualSpan,
  labelDow
} from './recapP36Occasions';
import { resolveGtgCanonicalExerciseId } from '../../services/endurance/gtgWorkoutSync';
import { normalizeGtgData } from '../../services/endurance/gtgService';

export const P36_THRESHOLDS = Object.freeze({
  MIN_WINDOW_DAYS_WEEKDAY: 14,
  MIN_DOW_ELIGIBLE: 3,
  MIN_RATE_GAP_PP: 15,
  MIN_VOLUME_SHARE_DOW: 0.28,
  /** Charge / jour actif : ≥2 séances, médiane ≥ +20 % vs jours réguliers. */
  MIN_ACTIVE_DAYS_FOR_LOAD: 2,
  MIN_LOAD_VS_FREQ_RATIO: 1.2,
  MIN_EXERCISE_DAYS: 3,
  MIN_EXERCISE_REP_SHARE: 0.22,
  MIN_WEEKS_STABILITY: 6,
  MAX_WEEKLY_ACTIVE_CV: 0.28,
  MIN_PROVEN_PLANNED_DOW: 3,
  MIN_COMPARE_ELIGIBLE_DOW: 3
});

function calendarSpanDays(window) {
  if (!window?.start || !window?.end) return 0;
  return (
    Math.round(
      (new Date(`${window.end}T12:00:00`) - new Date(`${window.start}T12:00:00`)) /
        86400000
    ) + 1
  );
}

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function cv(arr) {
  if (arr.length < 2) return null;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (!(mean > 0)) return null;
  const v =
    arr.reduce((s, x) => s + (x - mean) * (x - mean), 0) / arr.length;
  return Math.sqrt(v) / mean;
}

/**
 * @param {object} snapshot
 * @param {{ start: string, end: string }} window
 * @param {object} [opts]
 */
export function computeP36WindowMetrics(
  snapshot,
  window,
  {
    todayYmd = null,
    liveActiveProgram = null,
    getExerciseNameById = null,
    comparisonWindow = null,
    dayTableCache = null
  } = {}
) {
  const t0 =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  const sharedDayCache = dayTableCache instanceof Map ? dayTableCache : new Map();

  const occasions = buildP36OccasionTable(snapshot, window, {
    todayYmd,
    liveActiveProgram,
    getExerciseNameById,
    dayTableCache: sharedDayCache
  });
  const cWin = comparisonWindow || occasions.comparisonWindow;
  const occasionsC = cWin
    ? buildP36OccasionTable(snapshot, cWin, {
        todayYmd,
        liveActiveProgram,
        getExerciseNameById,
        dayTableCache: sharedDayCache
      })
    : null;

  const weekdayRegularity = summarizeWeekdayRegularity(occasions, occasionsC);
  const weekdayVolume = summarizeWeekdayVolume(occasions, occasionsC);
  const freqVsVolume = summarizeFreqVsVolume(weekdayRegularity, weekdayVolume);
  const exercises = summarizeExercisePlace(snapshot, window, getExerciseNameById);
  const exercisesC = cWin
    ? summarizeExercisePlace(snapshot, cWin, getExerciseNameById)
    : null;
  const exerciseContext = contextualizeExercises(exercises, exercisesC);
  const stability = summarizeWeeklyStability(occasions.days || []);
  const provenDow = summarizeProvenAdherenceDow(occasions);

  const elapsed =
    (typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now()) - t0;

  return {
    window: occasions.window,
    comparisonWindow: cWin,
    coverage: occasions.coverage,
    byDow: occasions.byDow,
    weekdayRegularity,
    weekdayVolume,
    freqVsVolume,
    exercises: exerciseContext,
    stability,
    provenDow,
    performance: {
      computeMs: Math.round(elapsed * 100) / 100,
      occasionMs: occasions.performance?.occasionMs
    },
    abstentions: collectAbstentions({
      weekdayRegularity,
      weekdayVolume,
      freqVsVolume,
      exercises: exerciseContext,
      stability,
      provenDow,
      spanDays: calendarSpanDays(window)
    })
  };
}

function summarizeWeekdayRegularity(occasions, occasionsC) {
  const span = calendarSpanDays(occasions.window);
  const rows = (occasions.byDow || []).filter(
    (r) => r.eligibleOccurrences >= P36_THRESHOLDS.MIN_DOW_ELIGIBLE
  );
  if (
    span < P36_THRESHOLDS.MIN_WINDOW_DAYS_WEEKDAY ||
    rows.length < 2
  ) {
    return {
      publishable: false,
      abstainReason: 'insufficient_weekday_sample',
      ranked: [],
      champion: null,
      tiedGroup: null
    };
  }

  const ranked = [...rows].sort(
    (a, b) => (b.rateClassicPct || 0) - (a.rateClassicPct || 0)
  );
  const top = ranked[0];
  const second = ranked[1];
  // Pas de « jour régulier » si aucune activité classique documentée.
  if (!top || !(top.rateClassicPct > 0) || !(top.withClassicExclusive >= 1)) {
    return {
      publishable: false,
      abstainReason: 'no_classic_activity_in_window',
      ranked: ranked.map((r) => ({
        dow: r.dow,
        label: r.label,
        rateClassicPct: r.rateClassicPct,
        rateAnyActivityPct: r.rateAnyActivityPct,
        eligibleOccurrences: r.eligibleOccurrences,
        withClassicExclusive: r.withClassicExclusive
      })),
      champion: null,
      tiedGroup: null
    };
  }
  const gap = (top.rateClassicPct || 0) - (second?.rateClassicPct || 0);
  const nearTies = ranked.filter(
    (r) =>
      (r.rateClassicPct || 0) > 0 &&
      Math.abs((r.rateClassicPct || 0) - (top.rateClassicPct || 0)) < 8
  );

  let champion = null;
  let tiedGroup = null;
  if (nearTies.length >= 2) {
    tiedGroup = nearTies.map((r) => ({
      dow: r.dow,
      label: r.label,
      rateClassicPct: r.rateClassicPct,
      eligibleOccurrences: r.eligibleOccurrences,
      withClassicExclusive: r.withClassicExclusive
    }));
  } else if (gap >= P36_THRESHOLDS.MIN_RATE_GAP_PP && top.withClassicExclusive >= 2) {
    champion = {
      dow: top.dow,
      label: top.label,
      rateClassicPct: top.rateClassicPct,
      eligibleOccurrences: top.eligibleOccurrences,
      withClassicExclusive: top.withClassicExclusive,
      gapPp: Math.round(gap * 10) / 10
    };
  }

  // Évolution vs C
  let evolution = null;
  if (champion && occasionsC) {
    const prev = (occasionsC.byDow || []).find((r) => r.dow === champion.dow);
    if (prev && prev.eligibleOccurrences >= P36_THRESHOLDS.MIN_COMPARE_ELIGIBLE_DOW) {
      const dRate = (champion.rateClassicPct || 0) - (prev.rateClassicPct || 0);
      evolution = {
        previousRatePct: prev.rateClassicPct,
        deltaPp: Math.round(dRate * 10) / 10,
        comparable: true
      };
    } else {
      evolution = { comparable: false };
    }
  }

  const publishable = Boolean(champion || (tiedGroup && tiedGroup.length >= 2));
  return {
    publishable,
    abstainReason: publishable ? null : 'no_clear_weekday_regularity_signal',
    ranked: ranked.map((r) => ({
      dow: r.dow,
      label: r.label,
      rateClassicPct: r.rateClassicPct,
      rateAnyActivityPct: r.rateAnyActivityPct,
      eligibleOccurrences: r.eligibleOccurrences,
      withClassicExclusive: r.withClassicExclusive
    })),
    champion,
    tiedGroup,
    evolution,
    metric: 'classic_activity_rate_over_eligible_weekdays'
  };
}

function summarizeWeekdayVolume(occasions, occasionsC) {
  const span = calendarSpanDays(occasions.window);
  const rows = (occasions.byDow || []).filter(
    (r) => r.eligibleOccurrences >= P36_THRESHOLDS.MIN_DOW_ELIGIBLE
  );
  if (span < P36_THRESHOLDS.MIN_WINDOW_DAYS_WEEKDAY || rows.length < 2) {
    return { publishable: false, abstainReason: 'insufficient_sample', top: null };
  }

  const totalReps = rows.reduce((s, r) => s + (r.classicExclusiveRepsSum || 0), 0);
  if (totalReps < 50) {
    return { publishable: false, abstainReason: 'low_volume', top: null };
  }

  const byShare = [...rows]
    .map((r) => ({
      ...r,
      share: (r.classicExclusiveRepsSum || 0) / totalReps,
      meanActive: r.meanClassicRepsPerActiveDay
    }))
    .sort((a, b) => b.share - a.share);

  const top = byShare[0];
  const second = byShare[1];
  const publishable =
    top.share >= P36_THRESHOLDS.MIN_VOLUME_SHARE_DOW &&
    top.withClassicExclusive >= 2 &&
    top.share - (second?.share || 0) >= 0.08;

  // Charge typique par jour actif (médiane) — distincte de la part du volume total.
  const loadRows = rows
    .filter(
      (r) =>
        (r.withClassicExclusive || 0) >= P36_THRESHOLDS.MIN_ACTIVE_DAYS_FOR_LOAD &&
        (r.activeClassicRepsList || []).length >=
          P36_THRESHOLDS.MIN_ACTIVE_DAYS_FOR_LOAD
    )
    .map((r) => {
      const list = [...(r.activeClassicRepsList || [])];
      return {
        dow: r.dow,
        label: r.label,
        withClassicExclusive: r.withClassicExclusive,
        medianActive: median(list),
        meanActive: r.meanClassicRepsPerActiveDay,
        classicExclusiveRepsSum: r.classicExclusiveRepsSum,
        values: list
      };
    })
    .sort((a, b) => (b.medianActive || 0) - (a.medianActive || 0));

  // Classement de charge / jour actif (toujours exposé pour le croisement freq≠volume).
  // Un « champion volume » par part reste soumis à MIN_VOLUME_SHARE_DOW.
  const topMeanActive =
    loadRows[0] != null && loadRows[0].medianActive != null
      ? {
          dow: loadRows[0].dow,
          label: loadRows[0].label,
          medianClassicRepsPerActiveDay: loadRows[0].medianActive,
          meanClassicRepsPerActiveDay: loadRows[0].meanActive,
          withClassicExclusive: loadRows[0].withClassicExclusive,
          classicExclusiveRepsSum: loadRows[0].classicExclusiveRepsSum,
          values: loadRows[0].values
        }
      : null;

  return {
    publishable,
    abstainReason: publishable ? null : 'no_clear_volume_concentration',
    totalClassicExclusiveReps: totalReps,
    top: publishable
      ? {
          dow: top.dow,
          label: top.label,
          sharePct: Math.round(top.share * 1000) / 10,
          classicExclusiveRepsSum: top.classicExclusiveRepsSum,
          meanClassicRepsPerActiveDay: top.meanActive,
          withClassicExclusive: top.withClassicExclusive,
          eligibleOccurrences: top.eligibleOccurrences
        }
      : null,
    topMeanActive,
    ranked: byShare.slice(0, 4).map((r) => ({
      label: r.label,
      sharePct: Math.round(r.share * 1000) / 10,
      meanActive: r.meanActive
    })),
    loadRanked: loadRows.slice(0, 4).map((r) => ({
      label: r.label,
      medianActive: r.medianActive,
      meanActive: r.meanActive,
      withClassicExclusive: r.withClassicExclusive,
      values: r.values
    })),
    unit: 'classic_exclusive_reps',
    evolution:
      publishable && occasionsC
        ? (() => {
            const prevRows = occasionsC.byDow || [];
            const prevTotal = prevRows.reduce(
              (s, r) => s + (r.classicExclusiveRepsSum || 0),
              0
            );
            const prev = prevRows.find((r) => r.dow === top.dow);
            if (!prev || prevTotal < 50) return { comparable: false };
            return {
              comparable: true,
              previousSharePct: Math.round(
                ((prev.classicExclusiveRepsSum || 0) / prevTotal) * 1000
              ) / 10
            };
          })()
        : null
  };
}

function summarizeFreqVsVolume(reg, vol) {
  if (!reg.publishable) {
    return { publishable: false, abstainReason: 'missing_freq_arm' };
  }

  const freqEntries = reg.tiedGroup?.length
    ? reg.tiedGroup
    : reg.champion
      ? [reg.champion]
      : [];
  if (!freqEntries.length) {
    return { publishable: false, abstainReason: 'missing_labels' };
  }
  const freqLabels = freqEntries.map((t) => t.label);
  const freqLabelSet = new Set(freqLabels);
  const freqRatePct =
    reg.champion?.rateClassicPct ?? reg.tiedGroup?.[0]?.rateClassicPct;

  // Référence de charge des jours réguliers (max des moyennes actives connues).
  const freqRefMeans = (vol.loadRanked || [])
    .filter((r) => freqLabelSet.has(r.label) && r.meanActive != null)
    .map((r) => r.meanActive);
  // Fallback : ranked share rows
  if (!freqRefMeans.length && Array.isArray(vol.ranked)) {
    for (const r of vol.ranked) {
      if (freqLabelSet.has(r.label) && r.meanActive != null) {
        freqRefMeans.push(r.meanActive);
      }
    }
  }
  const freqRefMean =
    freqRefMeans.length > 0 ? Math.max(...freqRefMeans) : null;

  // Bras 1 — concentration du volume total (part)
  if (
    vol.publishable &&
    vol.top &&
    !freqLabelSet.has(vol.top.label)
  ) {
    return {
      publishable: true,
      mode: 'share',
      freqLabels,
      freqLabel: freqLabels.join(', '),
      volLabel: vol.top.label,
      freqRatePct,
      volSharePct: vol.top.sharePct,
      volMeanActive: vol.top.meanClassicRepsPerActiveDay,
      volMedianActive: null,
      freqRefMean,
      note: 'Fréquence d’activité ≠ part du volume de période'
    };
  }

  // Bras 2 — charge typique / jour actif (médiane), vs jours réguliers
  const loadCandidates = (vol.loadRanked || [])
    .filter(
      (r) =>
        !freqLabelSet.has(r.label) &&
        (r.withClassicExclusive || 0) >=
          P36_THRESHOLDS.MIN_ACTIVE_DAYS_FOR_LOAD &&
        r.medianActive != null
    )
    .sort((a, b) => (b.medianActive || 0) - (a.medianActive || 0));
  const loadCand = loadCandidates[0];
  const threshold =
    freqRefMean != null
      ? freqRefMean * P36_THRESHOLDS.MIN_LOAD_VS_FREQ_RATIO
      : null;
  if (
    loadCand &&
    freqRefMean != null &&
    threshold != null &&
    loadCand.medianActive >= threshold
  ) {
    const values = [...(loadCand.values || [])].sort((a, b) => a - b);
    const n = values.length;
    // Sensibilité au pic : sur n<3, chaque observation doit franchir le seuil ;
    // sinon la médiane peut être tirée par une seule journée exceptionnelle.
    if (n > 0 && n < 3) {
      const minVal = values[0];
      if (!(minVal >= threshold)) {
        return {
          publishable: false,
          abstainReason: 'load_arm_spike_sensitive',
          volLabel: loadCand.label,
          volActiveDays: loadCand.withClassicExclusive,
          volValues: values,
          freqRefMean,
          threshold
        };
      }
    } else if (n >= 3) {
      const withoutMax = values.slice(0, -1);
      const medWithoutMax = median(withoutMax);
      if (medWithoutMax != null && medWithoutMax < threshold) {
        return {
          publishable: false,
          abstainReason: 'load_arm_spike_sensitive',
          volLabel: loadCand.label,
          volActiveDays: loadCand.withClassicExclusive,
          volValues: values,
          freqRefMean,
          threshold
        };
      }
    }

    /** @type {'punctual_limited'|'descriptive_tendency'|'repeated_habit'} */
    const strengthClass =
      n < 3
        ? 'punctual_limited'
        : n >= 5
          ? 'repeated_habit'
          : 'descriptive_tendency';

    return {
      publishable: true,
      mode: 'per_active_day',
      freqLabels,
      freqLabel: freqLabels.join(', '),
      volLabel: loadCand.label,
      freqRatePct,
      volSharePct: null,
      volMeanActive: loadCand.meanActive,
      volMedianActive: loadCand.medianActive,
      volActiveDays: loadCand.withClassicExclusive,
      volValues: values,
      strengthClass,
      freqRefMean,
      threshold,
      note: 'Fréquence d’activité ≠ quantité par séance active'
    };
  }

  if (vol.publishable && vol.top && freqLabelSet.has(vol.top.label)) {
    return { publishable: false, abstainReason: 'freq_volume_same_cluster' };
  }
  return {
    publishable: false,
    abstainReason: 'no_freq_volume_divergence'
  };
}

function summarizeExercisePlace(snapshot, window, getExerciseNameById) {
  const start = window?.start;
  const end = window?.end;
  if (!snapshot || !start || !end) {
    return { byFreq: [], byVolume: [], publishableFreq: false, publishableVol: false };
  }

  const gtg = normalizeGtgData(snapshot?.enduranceData?.gtg);
  const daySync = gtg.workoutSync || {};
  const syncedByDateId = new Map();
  for (const [date, ledger] of Object.entries(daySync)) {
    if (date < start || date > end) continue;
    if (!ledger || typeof ledger !== 'object') continue;
    for (const [gtgId, raw] of Object.entries(ledger)) {
      const n = Number(raw) || 0;
      if (n <= 0) continue;
      const sid = String(resolveGtgCanonicalExerciseId(gtgId, gtg.config));
      const key = `${date}::${sid}`;
      syncedByDateId.set(key, (syncedByDateId.get(key) || 0) + n);
    }
  }

  const byId = new Map();
  const ensure = (id) => {
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        days: new Set(),
        exclusiveReps: 0,
        identityConfidence: 'certain'
      });
    }
    return byId.get(id);
  };

  for (const [key, raw] of Object.entries(snapshot.reps || {})) {
    const m = String(key).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (!m) continue;
    const [, date, id] = m;
    if (date < start || date > end) continue;
    const total = parseInt(String(raw), 10) || 0;
    if (total <= 0) continue;
    const sync = syncedByDateId.get(`${date}::${id}`) || 0;
    const exclusive = Math.max(0, total - Math.min(sync, total));
    if (exclusive <= 0) continue;
    const row = ensure(String(id));
    row.days.add(date);
    row.exclusiveReps += exclusive;
  }

  // Hors périmètre « exercice classique programme » : GTG fallback, endurance synthétique.
  for (const row of byId.values()) {
    const id = String(row.id);
    if (
      id.startsWith('gtg_') ||
      id.startsWith('complementary_') ||
      id.startsWith('endurance_') ||
      id === 'pushup_endurance' ||
      /synthetic/i.test(id)
    ) {
      row.identityConfidence = 'uncertain';
    }
  }

  const list = [...byId.values()]
    .filter((r) => r.identityConfidence === 'certain')
    .map((r) => ({
      id: r.id,
      dayCount: r.days.size,
      exclusiveReps: r.exclusiveReps,
      label:
        (typeof getExerciseNameById === 'function' && getExerciseNameById(r.id)) ||
        `exercice ${r.id}`
    }));

  const totalReps = list.reduce((s, r) => s + r.exclusiveReps, 0);
  const byFreq = [...list].sort((a, b) => b.dayCount - a.dayCount || b.exclusiveReps - a.exclusiveReps);
  const byVolume = [...list].sort((a, b) => b.exclusiveReps - a.exclusiveReps);

  const topF = byFreq[0];
  const topV = byVolume[0];
  const publishableFreq =
    topF &&
    topF.dayCount >= P36_THRESHOLDS.MIN_EXERCISE_DAYS &&
    (byFreq[1] == null || topF.dayCount - byFreq[1].dayCount >= 1);

  const publishableVol =
    topV &&
    totalReps > 0 &&
    topV.exclusiveReps / totalReps >= P36_THRESHOLDS.MIN_EXERCISE_REP_SHARE &&
    topV.dayCount >= 2;

  return {
    byFreq,
    byVolume,
    totalExclusiveReps: totalReps,
    topFreq: publishableFreq ? topF : null,
    topVolume: publishableVol
      ? {
          ...topV,
          sharePct: Math.round((topV.exclusiveReps / totalReps) * 1000) / 10
        }
      : null,
    publishableFreq,
    publishableVol,
    unit: 'classic_exclusive_reps'
  };
}

function contextualizeExercises(w, c) {
  if (!w) {
    return {
      publishableFreq: false,
      publishableVol: false,
      abstainReason: 'no_data'
    };
  }
  const freqStatus = !w.topFreq
    ? null
    : !c?.topFreq
      ? 'no_comparison'
      : c.topFreq.id === w.topFreq.id
        ? 'stable_dominant_freq'
        : 'shifted_freq_leader';
  const volStatus = !w.topVolume
    ? null
    : !c?.topVolume
      ? 'no_comparison'
      : c.topVolume.id === w.topVolume.id
        ? 'stable_dominant_volume'
        : 'shifted_volume_leader';

  return {
    ...w,
    freqStatus,
    volStatus,
    comparisonHadData: Boolean(c?.byFreq?.length)
  };
}

function summarizeWeeklyStability(days) {
  // Semaines ISO locales : regrouper par lundi de semaine
  const byWeek = new Map();
  for (const d of days || []) {
    if (d.date && d.coexistence?.neither === false) {
      /* has activity somehow */
    }
    const active =
      d.classic?.hasExclusiveActivity || d.gtg?.hasActivity ? 1 : 0;
    const [y, m, dd] = String(d.date).split('-').map(Number);
    const dt = new Date(y, m - 1, dd);
    const day = dt.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const mon = new Date(dt);
    mon.setDate(dt.getDate() + mondayOffset);
    const weekId = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
    const cur = byWeek.get(weekId) || { activeDays: 0, daysInWindow: 0 };
    cur.daysInWindow += 1;
    cur.activeDays += active;
    byWeek.set(weekId, cur);
  }

  // Semaines entièrement dans la fenêtre uniquement (évite faux CV sur bords).
  const complete = [...byWeek.entries()]
    .filter(([, w]) => w.daysInWindow >= 7)
    .map(([, w]) => w.activeDays);

  if (complete.length < P36_THRESHOLDS.MIN_WEEKS_STABILITY) {
    return {
      publishable: false,
      abstainReason: 'insufficient_complete_weeks',
      weekCount: complete.length
    };
  }

  const med = median(complete);
  const coeff = cv(complete);
  const publishable =
    coeff != null &&
    coeff <= P36_THRESHOLDS.MAX_WEEKLY_ACTIVE_CV &&
    med != null &&
    med >= 2;

  return {
    publishable,
    abstainReason: publishable ? null : 'not_remarkably_stable',
    weekCount: complete.length,
    medianActiveDaysPerWeek: med,
    cvActiveDays: coeff != null ? Math.round(coeff * 1000) / 1000 : null,
    activeDaysSeries: complete
  };
}

function summarizeProvenAdherenceDow(occasions) {
  const candidates = (occasions.byDow || []).filter(
    (r) => r.provenPlannedWorkout >= P36_THRESHOLDS.MIN_PROVEN_PLANNED_DOW
  );
  if (candidates.length < 2) {
    return {
      publishable: false,
      abstainReason: 'insufficient_proven_planned_weekdays',
      candidates: []
    };
  }
  const ranked = [...candidates].sort(
    (a, b) => (b.provenAdherenceRatePct || 0) - (a.provenAdherenceRatePct || 0)
  );
  const top = ranked[0];
  const second = ranked[1];
  const gap =
    (top.provenAdherenceRatePct || 0) - (second.provenAdherenceRatePct || 0);
  const publishable = gap >= 15 && top.provenPlannedWorkout >= 3;
  return {
    publishable,
    abstainReason: publishable ? null : 'no_clear_proven_dow_gap',
    top: publishable
      ? {
          label: top.label,
          ratePct: top.provenAdherenceRatePct,
          provenPlannedWorkout: top.provenPlannedWorkout,
          provenPartialOrFull: top.provenPartialOrFull
        }
      : null,
    candidates: ranked.map((r) => ({
      label: r.label,
      ratePct: r.provenAdherenceRatePct,
      n: r.provenPlannedWorkout
    })),
    proofRequired: 'demonstrated_planCompareEligible'
  };
}

function collectAbstentions(pack) {
  const out = [];
  if (!pack.weekdayRegularity.publishable) {
    out.push({ family: 'A_regularity', reason: pack.weekdayRegularity.abstainReason });
  }
  if (!pack.weekdayVolume.publishable) {
    out.push({ family: 'B_volume', reason: pack.weekdayVolume.abstainReason });
  }
  if (!pack.freqVsVolume.publishable) {
    out.push({ family: 'B_freq_vs_vol', reason: pack.freqVsVolume.abstainReason });
  }
  if (!pack.exercises.publishableFreq && !pack.exercises.publishableVol) {
    out.push({ family: 'C_exercises', reason: 'no_dominant_exercise_signal' });
  }
  if (!pack.stability.publishable) {
    out.push({ family: 'D_stability', reason: pack.stability.abstainReason });
  }
  if (!pack.provenDow.publishable) {
    out.push({ family: 'E_proven', reason: pack.provenDow.abstainReason });
  }
  if (pack.spanDays < P36_THRESHOLDS.MIN_WINDOW_DAYS_WEEKDAY) {
    out.push({ family: 'window', reason: 'short_window_many_families_abstain' });
  }
  return out;
}

export { labelDow, median, cv };
