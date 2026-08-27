import { computeCalendarChampionAnalysis } from './calendarDayChampion';
import { computeCalendarStepsLeaders } from './calendarStepsLeaders';
import { computeCalendarKcalLeader } from './calendarKcalLeader';
import { computeDayStrengthWeightedLoad } from './calendarDayTrainingScores';
import { findBestDaySteps } from './calendarMonthHighlights';

export const CALENDAR_BADGE_EMOJI = {
  steps: '👣',
  monthSteps: '🚶',
  kcal: '🔥',
  volume: '🏋️',
  run: '🏃',
  intensity: '⚡',
  champion2: '🥈',
  champion3: '🥉'
};

function enrichChampionWithVsAverage(champion, yearScored) {
  if (!champion) return null;
  const others = yearScored.filter((d) => d.date !== champion.date);
  const pool = others.length > 0 ? others : yearScored;
  const n = pool.length || 1;
  const sums = { reps: 0, volumeKg: 0, exercises: 0, enduranceMinutes: 0, runningKm: 0, activeKcal: 0 };
  for (const d of pool) {
    for (const k of Object.keys(sums)) sums[k] += d.breakdown[k] || 0;
  }
  const averages = Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, Math.round((v / n) * 10) / 10])
  );
  const vsAverage = {};
  for (const k of Object.keys(sums)) {
    const avg = averages[k] || 0;
    const val = champion.breakdown[k] || 0;
    vsAverage[k] = avg > 0 ? Math.round(((val - avg) / avg) * 100) : val > 0 ? 100 : 0;
  }
  return { ...champion, vsAverage };
}

function filterYearScored(allScored, year) {
  const prefix = `${year}-`;
  return allScored
    .filter((d) => d.date.startsWith(prefix))
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
}

function maxStrengthLoadLeader(workoutData, getExerciseNameById, year) {
  const prefix = `${year}-`;
  const grouped = new Set();
  const reps = workoutData?.reps || {};
  Object.keys(reps).forEach((key) => {
    const m = key.match(/^(\d{4}-\d{2}-\d{2})_/);
    if (m && m[1].startsWith(prefix)) grouped.add(m[1]);
  });

  let best = null;
  grouped.forEach((dateStr) => {
    const m = computeDayStrengthWeightedLoad(dateStr, workoutData, getExerciseNameById);
    if (m.totalLoad <= 0) return;
    if (!best || m.totalLoad > best.value) {
      best = { date: dateStr, value: m.totalLoad, volumeKg: m.volumeKg };
    }
  });
  return best;
}

function maxMetricLeader(yearScored, field) {
  let best = null;
  for (const d of yearScored) {
    const value = d.breakdown?.[field] ?? 0;
    if (value <= 0) continue;
    if (!best || value > best.value) {
      best = { date: d.date, value };
    }
  }
  return best;
}

function intensityMinutesLeader(garminData, year) {
  const prefix = `${year}-`;
  const daily = garminData?.dailyMetrics || {};
  let best = null;

  Object.entries(daily).forEach(([dateStr, dm]) => {
    if (!dateStr.startsWith(prefix)) return;
    const im = dm?.intensityMinutes;
    if (!im) return;
    const moderate = Math.max(0, Math.round(Number(im.moderate) || 0));
    const vigorous = Math.max(0, Math.round(Number(im.vigorous) || 0));
    let peak = moderate + vigorous * 2;
    if (peak <= 0 && im.total != null) {
      peak = Math.max(0, Math.round(Number(im.total) || 0));
    }
    if (peak <= 0) return;
    if (!best || peak > best.value) {
      best = { date: dateStr, value: peak };
    }
  });

  return best;
}

/**
 * Badges calendrier pour une année civile.
 * Médailles 🥈🥉 = 2e et 3e jour au score champion (mêmes critères que la couronne).
 */
export function computeCalendarYearDayBadges({
  workoutData,
  garminData,
  getExerciseNameById,
  classificationCtx,
  year = new Date().getFullYear()
}) {
  const { allScored } = computeCalendarChampionAnalysis({
    workoutData,
    garminData,
    getExerciseNameById,
    classificationCtx
  });

  const yearScored = filterYearScored(allScored, year);
  const championTopThree = yearScored.slice(0, 3).map((entry, idx) =>
    idx === 0 ? enrichChampionWithVsAverage(entry, yearScored) : entry
  );
  const championRankByDate = {};
  championTopThree.forEach((entry, idx) => {
    championRankByDate[entry.date] = idx + 1;
  });

  const stepsLeaders = computeCalendarStepsLeaders(workoutData, garminData, year);
  const monthStepsLeaderDates = [];
  for (let m = 0; m < 12; m += 1) {
    const last = new Date(year, m + 1, 0).getDate();
    const mm = String(m + 1).padStart(2, '0');
    const best = findBestDaySteps(garminData, workoutData, {
      start: `${year}-${mm}-01`,
      end: `${year}-${mm}-${String(last).padStart(2, '0')}`
    });
    if (best?.dateYmd) monthStepsLeaderDates.push(best.dateYmd);
  }
  const kcalLeader = computeCalendarKcalLeader(garminData, year);
  const volumeLeader = maxStrengthLoadLeader(workoutData, getExerciseNameById, year);
  const runLeader = maxMetricLeader(yearScored, 'runningKm');
  let intensityLeader = intensityMinutesLeader(garminData, year);
  if (!intensityLeader && yearScored[0]) {
    intensityLeader = { date: yearScored[0].date, value: yearScored[0].score };
  }

  return {
    year,
    championTopThree,
    championRankByDate,
    championDate: championTopThree[0]?.date ?? null,
    stepsTopThree: stepsLeaders.topThree,
    stepsLeaderDate: stepsLeaders.topThree[0]?.date ?? null,
    monthStepsLeaderDates,
    kcalLeaderDate: kcalLeader.leaderDate,
    volumeLeaderDate: volumeLeader?.date ?? null,
    runLeaderDate: runLeader?.date ?? null,
    intensityLeaderDate: intensityLeader?.date ?? null,
    volumeLeader,
    runLeader,
    intensityLeader
  };
}

/** @returns {Array<{ type?: 'crown', emoji?: string, title: string }>} */
export function calendarBadgesForDate(dateStr, badges) {
  if (!dateStr || !badges) return [];

  const items = [];
  const rank = badges.championRankByDate?.[dateStr];

  if (rank === 1) {
    items.push({ type: 'crown', title: 'Meilleur jour' });
  } else if (rank === 2) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.champion2, title: '2e meilleur jour' });
  } else if (rank === 3) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.champion3, title: '3e meilleur jour' });
  }

  if (badges.stepsLeaderDate === dateStr) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.steps, title: 'Jour le plus de pas' });
  } else if (Array.isArray(badges.monthStepsLeaderDates) && badges.monthStepsLeaderDates.includes(dateStr)) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.monthSteps, title: 'Jour le plus de pas du mois' });
  }
  if (badges.kcalLeaderDate === dateStr) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.kcal, title: 'Jour le plus de kcal actives' });
  }
  if (badges.volumeLeaderDate === dateStr) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.volume, title: 'Record de volume' });
  }
  if (badges.runLeaderDate === dateStr) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.run, title: 'Meilleure course' });
  }
  if (badges.intensityLeaderDate === dateStr) {
    items.push({ emoji: CALENDAR_BADGE_EMOJI.intensity, title: "Pic d'intensité" });
  }

  return items;
}

/** Échelle de taille des emojis : plus de colonnes année → plus petit (surtout 3–5 colonnes). */
export function calendarBadgeSizeScale({ compact = false, yearColumns = 3, isMonthView = false } = {}) {
  if (isMonthView) return 1.38;
  if (!compact) return 1.25;
  const cols = Math.max(1, Math.min(5, Number(yearColumns) || 3));
  if (cols <= 2) return 0.98;
  return Math.max(0.5, 0.9 - (cols - 3) * 0.11);
}

/** Réduction supplémentaire quand plusieurs badges sur une petite case (vue année). */
export function calendarBadgeCountScale(badgeCount, { compact = false } = {}) {
  const n = Math.max(0, Number(badgeCount) || 0);
  if (!compact || n <= 1) return 1;
  if (n >= 4) return 0.58;
  if (n >= 3) return 0.68;
  return 0.84;
}

function formatSteps(n) {
  return Number(n).toLocaleString('fr-FR');
}

/**
 * Badges avec libellé détaillé pour le panneau jour.
 * @returns {Array<{ type?: 'crown', emoji?: string, title: string, description: string }>}
 */
export function calendarBadgeDetailsForDate(dateStr, badges) {
  if (!dateStr || !badges) return [];

  const items = calendarBadgesForDate(dateStr, badges);
  const year = badges.year;

  return items.map((item) => {
    let description = item.title;

    const rank = badges.championRankByDate?.[dateStr];
    if (item.type === 'crown') {
      const ch = badges.championTopThree?.[0];
      description = ch
        ? `Meilleur jour d'entraînement ${year} — score composite maximal (reps ${ch.breakdown?.reps ?? '—'}, volume ${ch.breakdown?.volumeKg ?? '—'} kg, course ${ch.breakdown?.runningKm ?? '—'} km).`
        : `Meilleur jour d'entraînement ${year} (score composite reps + volume + course + kcal).`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.champion2) {
      const d = badges.championTopThree?.[1];
      description = d
        ? `2e meilleur jour ${year} — score ${d.score} (reps ${d.breakdown?.reps}, volume ${d.breakdown?.volumeKg} kg).`
        : `2e meilleur jour ${year} selon le même score que la couronne.`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.champion3) {
      const d = badges.championTopThree?.[2];
      description = d
        ? `3e meilleur jour ${year} — score ${d.score} (reps ${d.breakdown?.reps}, volume ${d.breakdown?.volumeKg} kg).`
        : `3e meilleur jour ${year} selon le même score que la couronne.`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.steps) {
      const hit = badges.stepsTopThree?.find((x) => x.date === dateStr);
      description = hit
        ? `Record de pas ${year} : ${formatSteps(hit.steps)} pas (Garmin + saisie manuelle).`
        : `Jour avec le plus de pas sur ${year}.`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.monthSteps) {
      description = `Jour avec le plus de pas de ce mois (hors record annuel, déjà marqué 👣).`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.kcal) {
      description = `Record de kcal actives Garmin sur ${year} pour cette date.`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.volume) {
      const v = badges.volumeLeader;
      description =
        v?.date === dateStr
          ? `Record musculation ${year} — charge pondérée (reps × difficulté × kg) : ${Math.round(v.value)} pts${v.volumeKg ? `, ${Math.round(v.volumeKg)} kg` : ''}.`
          : `Record de charge musculation pondérée sur ${year}.`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.run) {
      const r = badges.runLeader;
      description =
        r?.date === dateStr
          ? `Meilleure course ${year} : ${r.value} km enregistrés ce jour.`
          : `Jour avec le plus de km courus sur ${year}.`;
    } else if (item.emoji === CALENDAR_BADGE_EMOJI.intensity) {
      const i = badges.intensityLeader;
      description =
        i?.date === dateStr
          ? `Pic d'intensité Garmin ${year} : ${Math.round(i.value)} min équivalentes (modéré + soutenu×2).`
          : `Jour le plus intense sur ${year} (minutes modérées / soutenues).`;
    }

    return { ...item, description };
  });
}

export function calendarBadgeLegendItems() {
  return [
    { key: 'crown', label: '1er jour', crown: true },
    { key: 'champion2', emoji: CALENDAR_BADGE_EMOJI.champion2, label: '2e jour' },
    { key: 'champion3', emoji: CALENDAR_BADGE_EMOJI.champion3, label: '3e jour' },
    { key: 'steps', emoji: CALENDAR_BADGE_EMOJI.steps, label: 'pas (année)' },
    { key: 'monthSteps', emoji: CALENDAR_BADGE_EMOJI.monthSteps, label: 'pas (mois)' },
    { key: 'kcal', emoji: CALENDAR_BADGE_EMOJI.kcal, label: 'kcal' },
    { key: 'volume', emoji: CALENDAR_BADGE_EMOJI.volume, label: 'volume' },
    { key: 'run', emoji: CALENDAR_BADGE_EMOJI.run, label: 'course' },
    { key: 'intensity', emoji: CALENDAR_BADGE_EMOJI.intensity, label: 'intensité' }
  ];
}
