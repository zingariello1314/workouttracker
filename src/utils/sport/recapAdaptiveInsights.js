/**
 * Moteur d'insights adaptatif pour le Récap > Analyse.
 * Sélection pondérée, diversité par pilier, remarques liées aux coches / GTG / PR / corrélations.
 */

import DateHelper from '../dateHelper';
import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import {
  buildGarminCardioById,
  computeRunningVolumeTotals,
  mergeRunningSessionsWithGarmin,
  sumRunningKmFromRows
} from './runningVolumeTruth';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { enumerateWindowDates } from './recapEnrichmentMetrics';
import {
  GTG_EXERCISE_DEFS,
  resolveGtgMaxReps,
  computeGtgRepsPerSet,
  summarizeGtgWindow
} from '../../services/endurance/gtgService';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { computeProgressionInsights } from './volumeProgressionEngine';
import { applyTrainingIntentToInsights } from './trainingIntentClassifier';
import {
  magnitudeWord,
  pctChange,
  garminStatsForWindow,
  acuteChronicRepsRatio,
  challengeProgressPct,
  challengeInsightText,
  findExerciseSessions
} from './recapInsightHelpers';

const HORIZON_LIMITS = { short: 8, medium: 7, long: 6 };

function inWindow(dateStr, window) {
  return dateStr && isDateInRecapWindow(dateStr, window);
}

function hashSig(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function formatFrDate(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function median(nums) {
  const v = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function stdDev(nums) {
  const v = nums.filter((n) => Number.isFinite(n));
  if (v.length < 2) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const var_ = v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length;
  return Math.sqrt(var_);
}

function exerciseDisplayName(exId, getExerciseNameById) {
  if (typeof getExerciseNameById === 'function') {
    const n = parseInt(String(exId), 10);
    if (Number.isFinite(n)) {
      const label = getExerciseNameById(n);
      if (label && String(label).trim()) return String(label).trim();
    }
  }
  return `Exercice ${exId}`;
}

/** @returns {Map<string, { date: string, reps: number }[]>} */
export function collectCheckedExerciseRepHistory(snapshot, window) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  const byEx = new Map();

  for (const key of Object.keys(reps)) {
    if (checked[key] !== true) continue;
    const dateStr = extractDateStrFromWorkoutKey(key);
    if (!inWindow(dateStr, window)) continue;
    const exId = extractExerciseIdFromWorkoutKey(key);
    if (!exId || exId.includes('complementary')) continue;
    const val = parseInt(String(reps[key]), 10);
    if (!Number.isFinite(val) || val <= 0) continue;

    if (!byEx.has(exId)) byEx.set(exId, []);
    const list = byEx.get(exId);
    const existing = list.find((s) => s.date === dateStr);
    if (existing) existing.reps = Math.max(existing.reps, val);
    else list.push({ date: dateStr, reps: val });
  }

  for (const list of byEx.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }
  return byEx;
}

function activeKcalSumForWindow(garminDailyMetrics, window) {
  if (!garminDailyMetrics || !window?.end) return 0;
  const dates = enumerateWindowDates(window, null, 400);
  let sum = 0;
  for (const d of dates) {
    const daily = garminDailyMetrics[d];
    if (!daily) continue;
    let n = 0;
    if (daily.calories && typeof daily.calories === 'object') {
      n = Number(daily.calories.active);
    } else {
      n = Number(daily.activeKilocalories ?? daily.activeKcal);
    }
    if (Number.isFinite(n) && n > 0) sum += Math.round(n);
  }
  return sum;
}

function runningVolumeForWindow(snapshot, garminData, window) {
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const allRows = computeRunningVolumeTotals(merged, garminById, {
    period: 'all',
    preFiltered: false
  }).rows || [];
  if (!window?.start || !window?.end) {
    return {
      totalKm: sumRunningKmFromRows(allRows),
      sessionCount: allRows.length,
      rows: allRows
    };
  }
  const rows = allRows.filter((r) => {
    const d = r?.date || r?.dateYmd;
    return d && d >= window.start && d <= window.end;
  });
  return {
    totalKm: sumRunningKmFromRows(rows),
    sessionCount: rows.length,
    rows
  };
}

function maxRecordedWeightKgInWindow(snapshot, window) {
  const weights = snapshot?.exerciseWeights || {};
  const setW = snapshot?.exerciseSetWeights || {};
  let max = 0;
  const parseNum = (s) => {
    const n = parseFloat(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  Object.keys(weights).forEach((k) => {
    if (!/^\d{4}-\d{2}-\d{2}_/.test(k)) return;
    const d = k.slice(0, 10);
    if (!inWindow(d, window)) return;
    max = Math.max(max, parseNum(weights[k]));
  });
  Object.entries(setW).forEach(([k, arr]) => {
    if (!/^\d{4}-\d{2}-\d{2}_/.test(k)) return;
    const d = k.slice(0, 10);
    if (!inWindow(d, window)) return;
    if (!Array.isArray(arr)) return;
    arr.forEach((cell) => {
      max = Math.max(max, parseNum(cell));
    });
  });
  return max;
}

function checkedMaxRepsForExerciseIds(byEx, idList) {
  let max = 0;
  for (const id of idList) {
    const sessions = findExerciseSessions(byEx, id);
    if (!sessions?.length) continue;
    max = Math.max(max, ...sessions.map((s) => s.reps));
  }
  return max;
}

function maxRecordsTouchedInWindow(snapshot, window) {
  const records = snapshot?.exerciseMaxRecords || [];
  return records.filter((r) => {
    const d = r?.recordDate || (r?.recordedAt ? String(r.recordedAt).slice(0, 10) : null);
    return d && inWindow(d, window);
  });
}

/** @param {object} opts */
function buildExerciseRepCandidates(opts) {
  const { snapshot, window, getExerciseNameById, todayYmd = window?.end || DateHelper.getTodayLocal() } = opts;
  const candidates = [];
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const lookbackStart = DateHelper.addDays(todayYmd, -28);

  for (const [exId, sessions] of byEx) {
    if (sessions.length < 3) continue;
    const name = exerciseDisplayName(exId, getExerciseNameById);
    const recent = sessions.filter((s) => s.date >= lookbackStart && s.date <= todayYmd);
    if (recent.length < 3) continue;

    const values = recent.map((s) => s.reps);
    const med = median(values);
    const sd = stdDev(values);
    if (med == null || med < 2) continue;

    const latest = sessions[sessions.length - 1];
    const prior = sessions.slice(0, -1);
    const prevMax = prior.length ? Math.max(...prior.map((s) => s.reps)) : 0;

    const isStableHabit = sd <= Math.max(1.5, med * 0.12) && recent.length >= 4;

    if (latest.reps > prevMax && prior.length >= 2) {
      const gain = latest.reps - prevMax;
      if (gain >= 1 && gain <= 5) {
        candidates.push({
          id: `ex.pr.${exId}.${latest.date}`,
          horizon: gain === 1 && isStableHabit ? 'short' : 'medium',
          pillar: 'training',
          weight: 72 + Math.min(18, gain * 4 + (isStableHabit ? 8 : 0)),
          text:
            gain === 1 && isStableHabit
              ? `${name} : tu es souvent autour de ${Math.round(med)} reps ; le ${formatFrDate(latest.date)} tu passes à ${latest.reps} (+1) — micro-progression à ancrer en répétant ce niveau.`
              : `${name} : nouveau pic à ${latest.reps} reps le ${formatFrDate(latest.date)} (max précédent ${prevMax}) — progresse prudemment sans viser l'échec la séance suivante.`
        });
      } else if (gain > 5) {
        candidates.push({
          id: `ex.pr.big.${exId}.${latest.date}`,
          horizon: 'medium',
          pillar: 'training',
          weight: 78,
          text: `${name} : saut net à ${latest.reps} reps le ${formatFrDate(latest.date)} (+${gain} vs ton max avant) — vérifie la forme et la récup avant de viser à nouveau ce chiffre.`
        });
      }
    }

    if (isStableHabit && latest.reps === Math.round(med) && recent.length >= 5) {
      candidates.push({
        id: `ex.habit.${exId}`,
        horizon: 'long',
        pillar: 'training',
        weight: 58,
        text: `${name} : routine stable (~${Math.round(med)} reps sur ${recent.length} séances récentes) — bon levier GTG ou +1 rep tous les 10–14 jours si la récup suit.`
      });
    }

    const belowHabit = recent.filter((s) => s.reps < med - 2);
    if (belowHabit.length >= 2 && recent[recent.length - 1].reps < med - 2) {
      candidates.push({
        id: `ex.dip.${exId}`,
        horizon: 'short',
        pillar: 'training',
        weight: 55,
        text: `${name} : dernières séances sous ta moyenne récente (~${Math.round(med)} reps) — fatigue, manque de sommeil ou séance volontairement légère ?`
      });
    }

    if (latest.reps === prevMax - 1 && prevMax >= 3) {
      candidates.push({
        id: `ex.near.pr.${exId}`,
        horizon: 'short',
        pillar: 'training',
        weight: 60,
        text: `${name} : ${latest.reps} reps le ${formatFrDate(latest.date)} — à 1 rep de ton max récent (${prevMax}), bonne zone pour retenter le record sans forcer.`
      });
    }

    const trendSlice = recent.slice(-5);
    if (trendSlice.length >= 4) {
      const first = trendSlice[0].reps;
      const last = trendSlice[trendSlice.length - 1].reps;
      const gainTrend = last - first;
      if (gainTrend >= 2 && gainTrend <= 6 && last <= prevMax) {
        candidates.push({
          id: `ex.trend.up.${exId}`,
          horizon: 'medium',
          pillar: 'training',
          weight: 58,
          text: `${name} : progression ${magnitudeWord((gainTrend / Math.max(first, 1)) * 100)} sur les dernières séances (${first} → ${last} reps) — la courbe monte même sans nouveau record.`
        });
      }
    }

    if (recent.length >= 2 && latest.reps < recent[recent.length - 2].reps - 2) {
      const drop = recent[recent.length - 2].reps - latest.reps;
      candidates.push({
        id: `ex.drop.session.${exId}`,
        horizon: 'short',
        pillar: 'training',
        weight: 52,
        text: `${name} : baisse de ${drop} reps vs la séance précédente — écoute le signal (récup, sommeil ou charge externe) plutôt que de rattraper d’emblée.`
      });
    }
  }

  return candidates;
}

function buildProgressionInsightCandidates(opts) {
  const { snapshot, window, getExerciseNameById } = opts;
  const raw = computeProgressionInsights(snapshot, window, getExerciseNameById);
  const insights = applyTrainingIntentToInsights(raw, snapshot);
  const out = [];
  for (const p of insights.slice(0, 4)) {
    if (!p.explanation || p.confidence < 0.65 || p.progressionType === 'neutral') continue;
    const horizon =
      p.progressionType === 'stall' || p.progressionType === 'regression' ? 'long' : 'medium';
    let weight = 55 + Math.round((p.confidence || 0) * 25);
    if (p.progressionType === 'strength' || p.progressionType === 'hypertrophy') weight += 8;
    if (p.progressionType === 'regression' && (p.confidence || 0) < 0.8) weight -= 15;
    const name = p.exerciseName ? `${p.exerciseName} : ` : '';
    out.push({
      id: `prog.${p.exerciseId}.${p.progressionType}`,
      horizon,
      pillar: 'training',
      weight,
      text: `${name}${p.explanation}.`
    });
  }
  return out;
}

function buildGtgCandidates(opts) {
  const { snapshot, window, profileQuestionnaireRaw } = opts;
  const endYmd = window?.end || DateHelper.getTodayLocal();
  const startYmd = window?.start || DateHelper.addDays(endYmd, -27);
  const qq = normalizeProfileQuestionnaire(profileQuestionnaireRaw);
  const ctx = { workoutData: snapshot, profileQuestionnaire: qq };
  const gtg = snapshot?.enduranceData?.gtg;
  const w28 = summarizeGtgWindow(gtg, startYmd, endYmd, ctx);
  const w7Start = DateHelper.addDays(endYmd, -6);
  const w7 = summarizeGtgWindow(gtg, w7Start, endYmd, ctx);
  const out = [];

  if (w7.daysWithAny >= 4 && w7.totalReps >= 20) {
    out.push({
      id: 'gtg.week.active',
      horizon: 'short',
      pillar: 'gtg',
      weight: 70 + Math.min(15, w7.daysWithAny),
      text: `Grease the Groove : ${w7.daysWithAny} j. cette semaine (~${w7.totalReps} reps cumulées) — fréquence nerveuse sans grosse fatigue, idéal pour monter tractions/dips/pompes.`
    });
  } else if (w28.daysWithAny >= 8 && w28.totalReps >= 80) {
    out.push({
      id: 'gtg.month.rhythm',
      horizon: 'medium',
      pillar: 'gtg',
      weight: 65,
      text: `GTG sur la période : ${w28.daysWithAny} j. actifs, ~${w28.totalReps} reps — le volume est là ; vise des jours à 100 % du plan GTG pour ancrer l'habitude.`
    });
  } else if (w28.daysWithAny === 0 && w28.hasConfig) {
    out.push({
      id: 'gtg.unused',
      horizon: 'long',
      pillar: 'gtg',
      weight: 42,
      text: `GTG configuré mais peu utilisé sur la période — même 2–3 mini-séries/jour peuvent faire monter les max sans casser la course.`
    });
  }

  if (w28.bestStreak >= 5) {
    out.push({
      id: 'gtg.streak',
      horizon: 'long',
      pillar: 'gtg',
      weight: 60 + Math.min(10, w28.bestStreak),
      text: `Meilleure série GTG : ${w28.bestStreak} j. consécutifs — la régularité compte plus que le volume d'un seul jour.`
    });
  }

  if (w28.daysAt100 >= 3) {
    out.push({
      id: 'gtg.full.days',
      horizon: 'medium',
      pillar: 'gtg',
      weight: 68,
      text: `${w28.daysAt100} jour(s) avec plan GTG complété à 100 % — bon signal de discipline sans surcharge.`
    });
  }

  if (w7.daysAt50 >= 3 && w7.daysAt100 < w7.daysAt50) {
    out.push({
      id: 'gtg.partial.week',
      horizon: 'short',
      pillar: 'gtg',
      weight: 58,
      text: `GTG : ${w7.daysAt50} jour(s) à ≥50 % du plan cette semaine — tu grignotes le volume ; vise 100 % sur 2–3 jours pour sentir l’effet nerveux.`
    });
  }

  if (w28.daysWithAny >= 5 && w28.totalReps > 0) {
    const avgDay = Math.round(w28.totalReps / Math.max(1, w28.daysWithAny));
    out.push({
      id: 'gtg.avg.reps',
      horizon: 'long',
      pillar: 'gtg',
      weight: 52,
      text: `GTG : ~${avgDay} reps/jour actif sur la période — reste en zone 40–60 % du max par mini-série pour éviter l’échec.`
    });
  }

  return out;
}

function buildGtgMaxLinkCandidates(opts) {
  const { snapshot, window, profileQuestionnaireRaw, getExerciseNameById } = opts;
  const qq = normalizeProfileQuestionnaire(profileQuestionnaireRaw);
  const ctx = { workoutData: snapshot, profileQuestionnaire: qq };
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const out = [];

  GTG_EXERCISE_DEFS.forEach((def) => {
    const gtgMax = resolveGtgMaxReps(def.id, ctx);
    if (gtgMax <= 0) return;
    const checkedMax = checkedMaxRepsForExerciseIds(
      byEx,
      def.recordExerciseIds.map(String)
    );
    if (checkedMax <= 0) return;

    const { reps: gtgTarget } = computeGtgRepsPerSet(gtgMax);
    const label =
      def.id === 'pullups'
        ? 'Tractions'
        : def.id === 'pushups'
          ? 'Pompes'
          : def.id === 'dips'
            ? 'Dips'
            : def.id;

    if (checkedMax >= gtgMax && checkedMax > gtgTarget * 1.5) {
      out.push({
        id: `gtg.max.beat.${def.id}`,
        horizon: 'medium',
        pillar: 'gtg',
        weight: 66 + Math.min(10, checkedMax - gtgMax),
        text: `${label} : max coché ${checkedMax} reps vs repère GTG ${gtgMax} — tu dépasses le plafond GTG en séance ; pense à mettre à jour le max GTG ou à séparer travail lourd et mini-séries.`
      });
    } else if (checkedMax >= gtgMax - 1 && checkedMax < gtgMax + 3) {
      out.push({
        id: `gtg.max.near.${def.id}`,
        horizon: 'short',
        pillar: 'gtg',
        weight: 62,
        text: `${label} : séances proches de ton max GTG (${gtgMax} reps, cible ~${gtgTarget}/mini-série) — bon moment pour consolider avant d’ajouter +1 au repère.`
      });
    }
  });

  const recentRecords = maxRecordsTouchedInWindow(snapshot, window);
  recentRecords.slice(0, 2).forEach((rec, i) => {
    const exId = rec?.exerciseId;
    const name = exerciseDisplayName(exId, getExerciseNameById);
    const repsVal = Number(rec?.reps) || 0;
    const wVal = Number(rec?.weightKg) || 0;
    const d = rec?.recordDate || String(rec?.recordedAt || '').slice(0, 10);
    if (repsVal <= 0 && wVal <= 0) return;
    out.push({
      id: `max.record.${exId}.${d}.${i}`,
      horizon: 'short',
      pillar: 'training',
      weight: 70 + Math.min(8, repsVal / 5),
      text:
        wVal > 0
          ? `${name} : record enregistré ${wVal} kg × ${repsVal || '?'} reps le ${formatFrDate(d)} — repère à ne pas brûler trop souvent.`
          : `${name} : max enregistré ${repsVal} reps le ${formatFrDate(d)} — compare avec tes coches programme pour voir si tu progresses au-delà du test.`
    });
  });

  return out;
}

function buildRecapMuscleAndMomentumCandidates(opts) {
  const { recapState, assessment, enrichment, snapshot, window } = opts;
  const out = [];

  const vol = recapState?.volumeTotals;
  if (vol?.strengthReps >= 80) {
    out.push({
      id: 'volume.strength',
      horizon: vol.strengthReps >= 1200 ? 'medium' : 'short',
      pillar: 'training',
      weight: 54 + Math.min(16, vol.strengthReps / 100),
      text: `~${Math.round(vol.strengthReps)} reps muscu cochées sur la période${vol.endurancePushupReps > 0 ? ` (+ ${vol.endurancePushupReps} pompes endurance)` : ''}.`
    });
  }

  const dominant = recapState?.dominantGroup;
  if (dominant && dominant !== 'full_body' && vol?.strengthReps >= 200) {
    const topEx = recapState?.topExercisesByGroup?.[dominant]?.[0];
    out.push({
      id: `muscle.dominant.${dominant}`,
      horizon: 'long',
      pillar: 'training',
      weight: 53,
      text: `Charge dominante : ${dominant.replace(/_/g, ' ')}${topEx?.name ? ` (souvent ${topEx.name})` : ''} — équilibre avec les groupes moins sollicités si tu enchaînes plusieurs semaines ainsi.`
    });
  }

  const momentum = assessment?.repsMomentumRatio;
  if (momentum != null && assessment?.totalReps28 >= 80) {
    if (momentum >= 1.15) {
      out.push({
        id: 'momentum.up',
        horizon: 'short',
        pillar: 'correlation',
        weight: 57,
        text: `Volume reps en hausse (~${Math.round((momentum - 1) * 100)} % vs quinzaine précédente) — surveille sommeil et douleurs si tu maintiens ce rythme.`
      });
    } else if (momentum <= 0.85) {
      out.push({
        id: 'momentum.down',
        horizon: 'medium',
        pillar: 'correlation',
        weight: 54,
        text: `Volume reps en baisse (~${Math.round((1 - momentum) * 100)} % vs quinzaine précédente) — repos, calendrier chargé ou phase de décharge ?`
      });
    }
  }

  const maxKg = maxRecordedWeightKgInWindow(snapshot, window);
  if (maxKg >= 20) {
    out.push({
      id: 'max.weight.window',
      horizon: 'medium',
      pillar: 'training',
      weight: 55 + Math.min(10, maxKg / 10),
      text: `Charge max enregistrée sur la période : ${maxKg} kg — utile pour calibrer la prochaine micro-progression.`
    });
  }

  const muscleRows = enrichment?.muscleShareRows || [];
  if (muscleRows.length >= 2) {
    const top = muscleRows[0];
    const second = muscleRows[1];
    if (top?.reps > 0 && second?.reps > 0 && top.reps / second.reps >= 1.6) {
      out.push({
        id: 'muscle.share.skew',
        horizon: 'long',
        pillar: 'correlation',
        weight: 50,
        text: `Répartition reps : ${top.groupId} ~${Math.round((top.reps / (top.reps + second.reps)) * 100)} % du top-2 — vérifie que ce n’est pas au détriment d’un groupe négligé.`
      });
    }
  }

  return out;
}

function buildEnduranceAndChallengeCandidates(opts) {
  const { enrichment, snapshot, garminData, window } = opts;
  const out = [];
  const digest = enrichment?.digest;
  const per = digest?.perActivity || {};
  const active = enrichment?.activeChallenges || [];
  const allChallenges = digest?.challenges || [];

  const vol = runningVolumeForWindow(snapshot, garminData, window);
  if (vol.totalKm >= 0.3) {
    const kmLabel = vol.totalKm < 10 ? vol.totalKm.toFixed(1) : String(Math.round(vol.totalKm));
    out.push({
      id: 'run.volume',
      horizon: vol.totalKm >= 15 ? 'medium' : 'short',
      pillar: 'cardio',
      weight: 58 + Math.min(22, vol.totalKm / 2),
      text: `Course (Momentum + Garmin) : ${kmLabel} km, ${vol.sessionCount} sortie${vol.sessionCount > 1 ? 's' : ''} — volume ${vol.totalKm >= 20 ? 'solide' : vol.totalKm >= 8 ? 'modéré' : 'en cours de construction'}.`
    });

    const endYmd = window?.end || DateHelper.getTodayLocal();
    const recentKm = (vol.rows || [])
      .filter((r) => {
        const d = r?.date || r?.dateYmd;
        return d && DateHelper.daysBetween(d, endYmd) != null && DateHelper.daysBetween(d, endYmd) <= 6;
      })
      .reduce((s, r) => s + (r.dist || r.distanceKm || 0), 0);
    const priorKm = (vol.rows || [])
      .filter((r) => {
        const d = r?.date || r?.dateYmd;
        const days = DateHelper.daysBetween(d, endYmd);
        return days != null && days >= 7 && days <= 13;
      })
      .reduce((s, r) => s + (r.dist || r.distanceKm || 0), 0);
    if (priorKm >= 2 && recentKm >= 0) {
      const chg = pctChange(recentKm, priorKm);
      if (chg != null && Math.abs(chg) >= 12) {
        out.push({
          id: chg > 0 ? 'run.week.up' : 'run.week.down',
          horizon: 'short',
          pillar: 'cardio',
          weight: 55 + Math.min(10, Math.abs(chg) / 5),
          text:
            chg > 0
              ? `Course : semaine en cours +${Math.round(chg)} % vs la précédente (~${recentKm.toFixed(1)} km) — montée ${magnitudeWord(chg)} du volume kilométrique.`
              : `Course : semaine en cours −${Math.round(Math.abs(chg))} % vs la précédente — baisse ${magnitudeWord(chg)} à croiser avec récup ou charge street.`
        });
      }
    }
  }

  const jump = per.jumprope?.totals?.jumps || 0;
  const pushEnd = per.pushups?.totals?.count || 0;
  const swimMin = per.swimming?.totals?.minutes || 0;
  const boxMin = per.boxing?.totals?.minutes || 0;
  const gainMin = per.gainage?.totals?.minutes || 0;

  if (jump >= 100) {
    out.push({
      id: 'endurance.jumprope',
      horizon: 'short',
      pillar: 'cardio',
      weight: 50 + Math.min(12, Math.log10(Math.max(10, jump))),
      text: `Corde à sauter : ~${jump.toLocaleString('fr-FR')} sauts — travail de pieds et cardio ${jump >= 2000 ? 'important' : jump >= 800 ? 'notable' : 'complémentaire'}.`
    });
  }
  if (pushEnd >= 50) {
    out.push({
      id: 'endurance.pushups',
      horizon: 'medium',
      pillar: 'cardio',
      weight: 50 + Math.min(10, pushEnd / 40),
      text: `Pompes (onglet Défis) : ${pushEnd} reps cumulées — ${pushEnd >= 500 ? 'gros volume d’endurance poussée' : 'complète bien avec le street si tu mixes les deux'}.`
    });
  }
  if (swimMin >= 15) {
    out.push({
      id: 'endurance.swim',
      horizon: 'medium',
      pillar: 'cardio',
      weight: 52,
      text: `Natation : ~${Math.round(swimMin)} min sur la période — récup active utile entre séances de tirage.`
    });
  }
  if (boxMin >= 10) {
    out.push({
      id: 'endurance.box',
      horizon: 'short',
      pillar: 'cardio',
      weight: 50,
      text: `Boxe : ~${Math.round(boxMin)} min — cardio nerveux en parallèle du renforcement.`
    });
  }
  if (gainMin >= 10) {
    out.push({
      id: 'endurance.gainage',
      horizon: 'long',
      pillar: 'training',
      weight: 48,
      text: `Gainage : ~${Math.round(gainMin)} min cumulées — socle utile pour tractions et posture.`
    });
  }

  allChallenges.slice(0, 4).forEach((ch, i) => {
    const prog = challengeProgressPct(ch, snapshot, per);
    const isCompleted = ch?.status === 'completed';
    out.push({
      id: `challenge.${ch?.id ?? i}.${isCompleted ? 'done' : 'active'}`,
      horizon: isCompleted ? 'short' : prog != null && prog >= 75 ? 'short' : 'medium',
      pillar: 'defis',
      weight: isCompleted ? 68 : 58 + (prog != null ? Math.min(15, prog / 8) : 0),
      text: challengeInsightText(ch, prog)
    });
  });

  active.slice(0, 2).forEach((ch, i) => {
    if (allChallenges.some((c) => c?.id === ch?.id)) return;
    const prog = challengeProgressPct(ch, snapshot, per);
    out.push({
      id: `challenge.active.${ch?.id ?? i}`,
      horizon: 'medium',
      pillar: 'defis',
      weight: 56,
      text: challengeInsightText(ch, prog)
    });
  });

  const bestRun = (vol.rows || [])
    .filter((r) => r.dist >= 2 && r.pace != null && r.pace >= 2.5 && r.pace <= 15)
    .sort((a, b) => a.pace - b.pace)[0];
  if (bestRun?.paceStr) {
    out.push({
      id: `run.pace.best.${bestRun.date}`,
      horizon: 'medium',
      pillar: 'cardio',
      weight: 60,
      text: `Meilleure allure sur la période : ${bestRun.paceStr}/km (${bestRun.dist.toFixed(1)} km le ${formatFrDate(bestRun.date)}) — repère utile pour calibrer les sorties faciles.`
    });
  }

  return out;
}

function buildCalendarCandidates(opts) {
  const { enrichment, assessment } = opts;
  const out = [];
  const streak = enrichment?.streak;
  const just = enrichment?.justifications;
  const comp = enrichment?.completion;
  const dow = enrichment?.dayOfWeek || [];

  if (streak?.current >= 3) {
    out.push({
      id: 'streak.current',
      horizon: streak.current >= 7 ? 'medium' : 'short',
      pillar: 'calendar',
      weight: 58 + Math.min(22, streak.current),
      text: `Série d'entraînement : ${streak.current} j. consécutif${streak.current > 1 ? 's' : ''}${streak.longest ? ` (record ${streak.longest} j.)` : ''}.`
    });
  }

  if (streak?.longest >= 10 && (streak.current || 0) < streak.longest * 0.4) {
    out.push({
      id: 'streak.below.record',
      horizon: 'long',
      pillar: 'calendar',
      weight: 54,
      text: `Record streak ${streak.longest} j. — tu es à ${streak.current || 0} j. : reprendre 2 séances courtes suffit souvent à relancer.`
    });
  }

  if (just?.total > 0) {
    out.push({
      id: 'justifications',
      horizon: 'medium',
      pillar: 'calendar',
      weight: 50 + Math.min(10, just.total),
      text: `${just.total} jour(s) justifié(s) sur la période${just.restDays ? ` (${just.restDays} repos)` : ''} — à croiser avec volume et récup.`
    });
  }

  if (comp?.daysFullyComplete >= 2 && comp.activeTrainingDays >= 4) {
    out.push({
      id: 'completion.full',
      horizon: 'medium',
      pillar: 'calendar',
      weight: 56,
      text: `${comp.daysFullyComplete} jour(s) à 100 % de complétion programme (${comp.activeTrainingDays} j. entraînés) — bonne adhérence fine.`
    });
  }

  const trainedDow = dow.filter((d) => d.plannedDays > 0 && d.avgCompletionPct != null);
  if (trainedDow.length >= 3) {
    const best = [...trainedDow].sort((a, b) => b.avgCompletionPct - a.avgCompletionPct)[0];
    const worst = [...trainedDow].sort((a, b) => a.avgCompletionPct - b.avgCompletionPct)[0];
    if (best.avgCompletionPct - worst.avgCompletionPct >= 8) {
      out.push({
        id: 'dow.spread',
        horizon: 'short',
        pillar: 'calendar',
        weight: 53,
        text: `Adhérence : ${best.label} ~${best.avgCompletionPct} % vs ${worst.label} ~${worst.avgCompletionPct} % — caler les séances clés sur tes jours forts.`
      });
    }
  }

  const least = enrichment?.leastCheckedExercises?.[0];
  if (least?.name && least.pct != null && least.pct < 25) {
    out.push({
      id: 'least.checked',
      horizon: 'short',
      pillar: 'training',
      weight: 51,
      text: `« ${least.name} » rarement coché (~${least.pct} % quand tu t'entraînes) — goulot possible ou exo à remplacer/déplacer.`
    });
  }

  if (assessment?.programCompletion28?.ratio != null && assessment.programCompletion28.ratio >= 0.55) {
    out.push({
      id: 'program.adherence',
      horizon: 'long',
      pillar: 'calendar',
      weight: 57,
      text: `Adhérence planning ~${Math.round(assessment.programCompletion28.ratio * 100)} % sur la fenêtre — la constance bat le volume ponctuel.`
    });
  }

  return out;
}

function buildGarminAndCorrelationCandidates(opts) {
  const { enrichment, garminPartial, garminDailyMetrics, assessment, snapshot, window } = opts;
  const out = [];
  const g = enrichment?.garmin;
  const pushPull = enrichment?.pushPull;
  const fb = enrichment?.feedback;
  const dm = garminDailyMetrics || garminPartial?.dailyMetrics;
  const gStats = garminStatsForWindow(dm, window || enrichment?.window);

  if (g?.avgSteps != null && g.daysWithSteps >= 3) {
    out.push({
      id: 'garmin.steps',
      horizon: 'short',
      pillar: 'garmin',
      weight: 50 + Math.min(16, g.avgSteps / 1500),
      text: `Garmin : ~${Math.round(g.avgSteps).toLocaleString('fr-FR')} pas/j (${g.daysWithSteps} j. mesurés) — NEAT ${g.avgSteps >= 9000 ? 'élevé' : g.avgSteps >= 6500 ? 'correct' : 'modeste'} en complément du street.`
    });
  }

  if (gStats?.weekStepsTrendConfident && gStats.avgPriorWeeksSteps > 0) {
    const chg = pctChange(gStats.weekStepsCurrent, gStats.avgPriorWeeksSteps);
    if (chg != null && Math.abs(chg) >= 5) {
      const word = magnitudeWord(chg);
      out.push({
        id: chg > 0 ? 'garmin.steps.up' : 'garmin.steps.down',
        horizon: 'short',
        pillar: 'garmin',
        weight: 56 + Math.min(10, Math.abs(chg) / 4),
        text:
          chg > 0
            ? `Pas Garmin en hausse ${word} cette semaine (~${Math.round(chg)} % vs tes semaines précédentes) — activité quotidienne en progression.`
            : `Pas Garmin en baisse ${word} (~${Math.round(Math.abs(chg))} %) — à croiser avec fatigue ou semaine plus structurée au street.`
      });
    }
  }

  if (g?.avgSleepHours != null) {
    if (g.avgSleepHours < 6.5) {
      out.push({
        id: 'garmin.sleep.low',
        horizon: 'medium',
        pillar: 'garmin',
        weight: 58,
        text: `Sommeil Garmin ~${g.avgSleepHours.toFixed(1)} h/j — sous le seuil confort ; la récup muscu/course en pâtit souvent avant que tu le ressentes à l’entraînement.`
      });
    } else if (g.avgSleepHours >= 7.2) {
      out.push({
        id: 'garmin.sleep.good',
        horizon: 'long',
        pillar: 'garmin',
        weight: 52,
        text: `Sommeil Garmin ~${g.avgSleepHours.toFixed(1)} h/j — bon socle pour absorber volume street et course.`
      });
    }
  }

  if (gStats?.avgStress28 != null && gStats.stressSampleDays >= 4) {
    out.push({
      id: gStats.avgStress28 >= 45 ? 'garmin.stress.high' : 'garmin.stress.ok',
      horizon: 'medium',
      pillar: 'garmin',
      weight: gStats.avgStress28 >= 45 ? 57 : 48,
      text:
        gStats.avgStress28 >= 45
          ? `Stress Garmin moyen ~${gStats.avgStress28}/100 — semaine chargée côté système nerveux ; séances légères ou GTG plutôt que records.`
          : `Stress Garmin contenu (~${gStats.avgStress28}/100) — marge pour pousser progressivement le volume.`
    });
  }

  const kcalSum = activeKcalSumForWindow(dm, window || enrichment?.window);
  if (kcalSum >= 2000) {
    out.push({
      id: 'garmin.kcal',
      horizon: 'medium',
      pillar: 'garmin',
      weight: 52 + Math.min(12, kcalSum / 4000),
      text: `~${kcalSum.toLocaleString('fr-FR')} kcal actives (Garmin) sur la période — dépense globale ${kcalSum >= 12000 ? 'élevée' : 'significative'}.`
    });
  }

  if (pushPull?.ratio != null) {
    if (pushPull.ratio >= 1.65) {
      out.push({
        id: 'pushpull.imbalance.high',
        horizon: 'medium',
        pillar: 'training',
        weight: 56,
        text: `Push/Pull ${pushPull.ratio} (push ${pushPull.pushPct} %) — tirage / face arrière à renforcer pour épaules et tractions.`
      });
    } else if (pushPull.ratio <= 0.75 && pushPull.pullPct > 0) {
      out.push({
        id: 'pushpull.pull.high',
        horizon: 'medium',
        pillar: 'training',
        weight: 52,
        text: `Pull dominant (${pushPull.pullPct} % des reps) — vérifie que la poussée suit si tu vises l’équilibre.`
      });
    } else if (pushPull.pushPct != null) {
      out.push({
        id: 'pushpull.balanced',
        horizon: 'long',
        pillar: 'training',
        weight: 48,
        text: `Push/Pull équilibré (${pushPull.pushPct} % / ${pushPull.pullPct} %) sur tes reps cochées — bon signe pour la posture.`
      });
    }
  }

  if (fb?.energieDelta != null) {
    if (fb.energieDelta >= 1) {
      out.push({
        id: 'feedback.energy.up',
        horizon: 'short',
        pillar: 'corps',
        weight: 52 + Math.min(8, fb.energieDelta),
        text: `Feedback : énergie +${fb.energieDelta.toFixed(1)} pt en fin de séance en moyenne — les séances t’activent plutôt qu’elles ne t’épuisent.`
      });
    } else if (fb.energieDelta <= -1.5) {
      out.push({
        id: 'feedback.energy.down',
        horizon: 'short',
        pillar: 'corps',
        weight: 54,
        text: `Feedback : énergie en baisse en fin de séance (~${fb.energieDelta.toFixed(1)} pt) — charge ou sommeil à ajuster.`
      });
    }
  }

  if (fb?.motivation != null && fb.count >= 3) {
    if (fb.motivation >= 7.5) {
      out.push({
        id: 'feedback.motivation.high',
        horizon: 'long',
        pillar: 'corps',
        weight: 50,
        text: `Motivation feedback ~${fb.motivation}/10 — état d’esprit favorable pour tenir le plan.`
      });
    } else if (fb.motivation <= 5) {
      out.push({
        id: 'feedback.motivation.low',
        horizon: 'medium',
        pillar: 'corps',
        weight: 52,
        text: `Motivation feedback ~${fb.motivation}/10 — simplifier le plan (moins d’exos, séances courtes) peut relancer l’adhérence.`
      });
    }
  }

  if (fb?.difficulte != null && fb.difficulte >= 7.5 && fb.count >= 3) {
    out.push({
      id: 'feedback.hard',
      horizon: 'short',
      pillar: 'corps',
      weight: 53,
      text: `Difficulté ressentie ~${fb.difficulte}/10 — les séances te coûtent ; une semaine allégée ou plus de repos actif peut aider.`
    });
  } else if (fb?.difficulte != null && fb.difficulte <= 4.5 && fb.count >= 4) {
    out.push({
      id: 'feedback.easy',
      horizon: 'long',
      pillar: 'corps',
      weight: 48,
      text: `Difficulté ressentie ~${fb.difficulte}/10 en moyenne — marge pour monter progressivement le volume ou viser des records sans risquer le surmenage.`
    });
  }

  const load = acuteChronicRepsRatio(snapshot, window || enrichment?.window);
  if (load?.ratio != null && load.chronicWeekly >= 30) {
    if (load.ratio >= 1.25) {
      const pct = Math.round((load.ratio - 1) * 100);
      out.push({
        id: 'load.acute.up',
        horizon: 'short',
        pillar: 'correlation',
        weight: 55 + Math.min(10, pct / 5),
        text: `Charge aiguë reps +${pct} % vs ta moyenne du mois — pic ${magnitudeWord(pct)} à surveiller si tu enchaînes plusieurs semaines ainsi.`
      });
    } else if (load.ratio <= 0.75) {
      out.push({
        id: 'load.deload',
        horizon: 'medium',
        pillar: 'correlation',
        weight: 50,
        text: `Volume reps en baisse vs le mois précédent — décharge naturelle ou creux ; utile avant de remonter progressivement.`
      });
    }
  }

  if (
    gStats?.weekStepsTrendConfident &&
    assessment?.totalReps28 >= 50 &&
    gStats.weekStepsCurrent > (gStats.avgPriorWeeksSteps || 0) * 1.05 &&
    assessment?.repsMomentumRatio >= 1.05
  ) {
    out.push({
      id: 'combo.steps.reps.up',
      horizon: 'medium',
      pillar: 'correlation',
      weight: 58,
      text: `Pas Garmin et volume reps montent ensemble — activité globale cohérente entre capteur et coches programme.`
    });
  }

  return out;
}

function buildSupplementaryCandidates(opts) {
  const { enrichment, assessment, activeProgram } = opts;
  const out = [];
  const circuits = enrichment?.circuits;
  const stretch = enrichment?.stretchZones;
  const weight = enrichment?.weight;
  const comp = enrichment?.completion;

  if (circuits?.activeDays >= 1) {
    out.push({
      id: 'circuits',
      horizon: circuits.totalRounds >= 15 ? 'medium' : 'short',
      pillar: 'training',
      weight: 50 + Math.min(12, circuits.totalRounds / 3),
      text: `Circuits : ${circuits.totalRounds} tours sur ${circuits.activeDays} j. — densité ${circuits.totalRounds >= 20 ? 'élevée' : 'modérée'} à intégrer dans la récup.`
    });
  }

  const topStretch = stretch?.rows?.[0];
  if (topStretch?.count >= 3) {
    const zoneLabel = topStretch.label || topStretch.zone || 'mobilité';
    out.push({
      id: 'stretch.zone',
      horizon: 'long',
      pillar: 'calendar',
      weight: 46,
      text: `Étirements : zone « ${zoneLabel} » la plus cochée (${topStretch.count}×) — bon réflexe mobilité sur la période.`
    });
  }

  if (stretch?.total >= 5 && stretch.rows?.length >= 2) {
    const low = stretch.rows[stretch.rows.length - 1];
    const top = stretch.rows[0];
    if (top.count >= 4 && low.count <= 1) {
      out.push({
        id: 'stretch.neglected',
        horizon: 'long',
        pillar: 'calendar',
        weight: 44,
        text: `Mobilité : « ${top.zone} » bien travaillée mais « ${low.zone} » quasi absente — déséquilibre souvent invisible sans ce type de suivi.`
      });
    }
  }

  if (weight?.deltaKg != null && Math.abs(weight.deltaKg) >= 0.3) {
    const dir = weight.deltaKg > 0 ? 'hausse' : 'baisse';
    out.push({
      id: 'weight.delta',
      horizon: 'medium',
      pillar: 'corps',
      weight: 50 + Math.min(8, Math.abs(weight.deltaKg)),
      text: `Poids : ${dir} de ${Math.abs(weight.deltaKg).toFixed(1)} kg sur la fenêtre (${weight.startKg} → ${weight.endKg} kg) — croise avec objectif et charge d’entraînement.`
    });
  }

  if (enrichment?.seriesOverrideDays >= 2) {
    out.push({
      id: 'series.override',
      horizon: 'short',
      pillar: 'training',
      weight: 51,
      text: `${enrichment.seriesOverrideDays} jour(s) avec séries/reps adaptées manuellement — tu ajustes le plan en live ; utile pour autopsier ce qui a coinçé.`
    });
  }

  const sla = assessment?.sessionLoadAlignment28;
  if (sla?.avgScore0to100 != null && sla.sessionDaysScored >= 3) {
    const score = sla.avgScore0to100 / 100;
    if (score >= 0.75) {
      out.push({
        id: 'sla.good',
        horizon: 'medium',
        pillar: 'calendar',
        weight: 54,
        text: `Prévu vs réalisé ~${Math.round(sla.avgScore0to100)} % (séries/reps du jour) — tu exécutes fidèlement ce que le programme demande.`
      });
    } else if (score <= 0.55) {
      out.push({
        id: 'sla.gap',
        horizon: 'short',
        pillar: 'calendar',
        weight: 53,
        text: `Écart prévu/réalisé ~${Math.round(sla.avgScore0to100)} % — soit le plan est ambitieux, soit les coches/charges sont incomplètes.`
      });
    }
  }

  if (comp?.globalPct != null && comp.globalPct >= 70 && comp.activeTrainingDays >= 3) {
    out.push({
      id: 'completion.global',
      horizon: 'long',
      pillar: 'calendar',
      weight: 52,
      text: `Complétion items ~${comp.globalPct} % sur ${comp.activeTrainingDays} j. entraînés — adhérence fine ${comp.globalPct >= 85 ? 'excellente' : 'honorable'}.`
    });
  }

  if (activeProgram?.name && enrichment?.leastCheckedExercises?.length >= 2) {
    const second = enrichment.leastCheckedExercises[1];
    if (second?.pct != null && second.pct < 30) {
      out.push({
        id: 'least.checked.2',
        horizon: 'long',
        pillar: 'training',
        weight: 47,
        text: `« ${second.name} » aussi peu coché (~${second.pct} %) — pattern récurrent sur 2 exercices du plan.`
      });
    }
  }

  return out;
}

function legacyToCandidates(legacyPistes) {
  const out = [];
  const map = [
    ['shortTerm', 'short'],
    ['mediumTerm', 'medium'],
    ['longTerm', 'long']
  ];
  map.forEach(([key, horizon]) => {
    (legacyPistes[key] || []).forEach((text, i) => {
      out.push({
        id: `legacy.${horizon}.${i}`,
        horizon,
        pillar: 'legacy',
        weight: 44,
        text
      });
    });
  });
  return out;
}

/**
 * Sélection diversifiée : poids + pénalité pilier déjà pris + tie-break signature.
 */
export function selectBalancedInsightTexts(candidates, horizon, limit, signature) {
  const pool = candidates.filter((c) => c.horizon === horizon && c.text);
  const picked = [];
  const usedPillars = new Set();
  const usedIds = new Set();

  while (picked.length < limit && pool.length > 0) {
    let best = null;
    let bestScore = -Infinity;
    for (const c of pool) {
      if (usedIds.has(c.id)) continue;
      let score = c.weight;
      if (usedPillars.has(c.pillar)) {
        const samePillarBest = picked.find((p) => p.pillar === c.pillar);
        if (samePillarBest && c.weight - samePillarBest.weight < 14) score -= 14;
        else score -= 8;
      }
      if (c.pillar === 'legacy') {
        if (picked.some((p) => p.pillar === 'legacy')) score -= 22;
        if (picked.length >= 2) score -= 10;
      }
      score += (hashSig(`${signature}:${c.id}`) % 17) * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best) break;
    picked.push(best);
    usedIds.add(best.id);
    usedPillars.add(best.pillar);
  }

  return picked.map((p) => p.text);
}

/**
 * @returns {{ insights: { shortTerm, mediumTerm, longTerm }, kpis: object, signature: string }}
 */
export function buildAdaptiveRecapInsights(opts = {}) {
  const {
    legacyPistes = {},
    enrichment = null,
    assessment = null,
    recapState = null,
    snapshot = {},
    window = enrichment?.window,
    garminData = null,
    garminPartial = null,
    garminDailyMetrics = null,
    period = 'all',
    getExerciseNameById = null,
    profileQuestionnaireRaw = null,
    activeProgram = null
  } = opts;

  const candidates = [
    ...legacyToCandidates(legacyPistes),
    ...buildExerciseRepCandidates({ snapshot, window, getExerciseNameById }),
    ...buildProgressionInsightCandidates({ snapshot, window, getExerciseNameById }),
    ...buildGtgCandidates({ snapshot, window, profileQuestionnaireRaw }),
    ...buildGtgMaxLinkCandidates({ snapshot, window, profileQuestionnaireRaw, getExerciseNameById }),
    ...buildEnduranceAndChallengeCandidates({ enrichment, snapshot, garminData, window }),
    ...buildCalendarCandidates({ enrichment, assessment }),
    ...buildGarminAndCorrelationCandidates({
      enrichment,
      garminPartial,
      garminDailyMetrics,
      assessment,
      snapshot,
      window
    }),
    ...buildRecapMuscleAndMomentumCandidates({
      recapState,
      assessment,
      enrichment,
      snapshot,
      window
    }),
    ...buildSupplementaryCandidates({ enrichment, assessment, activeProgram })
  ];

  const vol = runningVolumeForWindow(snapshot, garminData, window);
  const kcalSum = activeKcalSumForWindow(
    garminDailyMetrics || garminPartial?.dailyMetrics,
    window
  );
  const gtgEnd = window?.end || DateHelper.getTodayLocal();
  const gtgStart = window?.start || DateHelper.addDays(gtgEnd, -27);
  const gtgSum = summarizeGtgWindow(snapshot?.enduranceData?.gtg, gtgStart, gtgEnd, {
    workoutData: snapshot,
    profileQuestionnaire: normalizeProfileQuestionnaire(profileQuestionnaireRaw)
  });

  const signature = [
    period,
    window?.start,
    window?.end,
    vol.totalKm,
    vol.sessionCount,
    enrichment?.streak?.current,
    enrichment?.completion?.globalPct,
    assessment?.totalReps28,
    candidates.length,
    hashSig(JSON.stringify(candidates.map((c) => `${c.id}:${c.weight}`).slice(0, 12)))
  ].join('|');

  return {
    insights: {
      shortTerm: selectBalancedInsightTexts(candidates, 'short', HORIZON_LIMITS.short, signature),
      mediumTerm: selectBalancedInsightTexts(candidates, 'medium', HORIZON_LIMITS.medium, signature),
      longTerm: selectBalancedInsightTexts(candidates, 'long', HORIZON_LIMITS.long, signature)
    },
    kpis: {
      runningKm: vol.totalKm,
      runningSessions: vol.sessionCount,
      streakCurrent: enrichment?.streak?.current ?? 0,
      streakLongest: enrichment?.streak?.longest ?? 0,
      activeChallenges: enrichment?.activeChallenges?.length ?? 0,
      activeKcalSum: kcalSum,
      gtgDays: gtgSum.daysWithAny,
      gtgReps: gtgSum.totalReps
    },
    signature
  };
}
