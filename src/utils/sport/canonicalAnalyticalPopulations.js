/**
 * Mission 20 — Autorité unique des populations analytiques.
 * Une métrique = une population + une méthode + une fenêtre.
 * Ne pas forcer l’égalité entre populations distinctes : les réconcilier.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import { classicExclusiveRepsForDay } from './recapP35DayModel';
import { collectLifetimeRepHistory } from './athleteJourney';
import { collectPushupEnduranceSessions } from './recapMuscleLoadEngine';
import { endurancePushupsAlreadyInWorkoutTotals } from '../../services/endurance/pushupEnduranceWorkoutKeys';
import { enduranceRepsForSession } from '../trainingLoadUtils';
import { isMockEnduranceSession } from '../calendarUtils';

/** Identités stables des populations (libellés distincts). */
export const POPULATION_ID = Object.freeze({
  RAW_CHECKED: 'raw_checked_reps',
  CLASSIC_SESSION: 'classic_session_catalog',
  STRENGTH_INCLUSIVE: 'strength_inclusive_exclusive_plus_challenges',
  BANNER_CALENDAR: 'banner_calendar_exclusive',
  COMPLEMENTARY_SYNCED: 'complementary_endurance_synced',
  ENDURANCE_UNSYNCED: 'endurance_pushups_unsynced',
  GTG_SYNC_DEDUCTION: 'gtg_sync_deduction'
});

export const POPULATION_LABEL = Object.freeze({
  [POPULATION_ID.RAW_CHECKED]: 'Répétitions cochées brutes (toutes clés)',
  [POPULATION_ID.CLASSIC_SESSION]: 'Renforcement classique (hors complémentaire)',
  [POPULATION_ID.STRENGTH_INCLUSIVE]:
    'Volume renforcement inclusif (exclusif GTG + défis endurance non sync)',
  [POPULATION_ID.BANNER_CALENDAR]: 'Bannière calendrier (exclusif, sans défis unsync)',
  [POPULATION_ID.COMPLEMENTARY_SYNCED]: 'Pompes endurance synchronisées',
  [POPULATION_ID.ENDURANCE_UNSYNCED]: 'Défis pompes non synchronisés dans reps',
  [POPULATION_ID.GTG_SYNC_DEDUCTION]: 'Volume GTG déduit des clés classiques'
});

function inWindow(date, window) {
  if (!date || !window?.start || !window?.end) return false;
  return date >= window.start && date <= window.end;
}

function enumerateDays(window) {
  if (!window?.start || !window?.end) return [];
  const out = [];
  const d0 = new Date(`${window.start}T12:00:00`);
  const d1 = new Date(`${window.end}T12:00:00`);
  for (let t = d0.getTime(); t <= d1.getTime(); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Agrégats bruts d’une fenêtre — source de vérité pour réconciliation.
 */
export function measurePopulationWindow(snapshot, window) {
  if (!snapshot || !window?.start || !window?.end) {
    return { ok: false, reason: 'window_required' };
  }
  const reps = snapshot.reps || {};
  const checked = snapshot.checkedExercises || {};
  let rawChecked = 0;
  let complementary = 0;
  let classicRaw = 0;
  let other = 0;
  const rawDays = new Set();
  const classicDays = new Set();

  Object.entries(reps).forEach(([key, value]) => {
    const date = key.slice(0, 10);
    if (!inWindow(date, window)) return;
    if (checked[key] !== true) return;
    const n = parseInt(String(value), 10) || 0;
    if (n <= 0) return;
    const id = key.slice(11);
    rawChecked += n;
    rawDays.add(date);
    if (String(id).includes('complementary')) {
      complementary += n;
    } else {
      classicRaw += n;
      classicDays.add(date);
      if (!/^\d+$/.test(id) && !/^ex_/.test(id) && !/^dup_/.test(id) && !/^db_/.test(id)) {
        other += n;
      }
    }
  });

  const grouped = aggregateCheckedRepsByDateAndExerciseId(reps, checked);
  let exclusiveSum = 0;
  let gtgDeducted = 0;
  let classicTotalSum = 0;
  const exclusiveDays = new Set();
  enumerateDays(window).forEach((ymd) => {
    const pack = classicExclusiveRepsForDay(snapshot, ymd);
    classicTotalSum += pack?.classicTotalReps || 0;
    exclusiveSum += pack?.classicExclusiveReps || 0;
    gtgDeducted += pack?.gtgSyncedReps || 0;
    if ((pack?.classicExclusiveReps || 0) > 0) exclusiveDays.add(ymd);
  });

  let enduranceUnsynced = 0;
  const unsyncedDates = [];
  (collectPushupEnduranceSessions(snapshot) || []).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = String(session?.date || '').slice(0, 10);
    if (!inWindow(ds, window)) return;
    if (endurancePushupsAlreadyInWorkoutTotals(snapshot, ds)) return;
    const n = enduranceRepsForSession('pushups', session) || 0;
    if (n <= 0) return;
    enduranceUnsynced += n;
    unsyncedDates.push(ds);
  });

  const lifetime = collectLifetimeRepHistory(snapshot, window.end);
  let classicCatalog = 0;
  const catalogDays = new Set();
  lifetime.forEach((sessions) => {
    sessions.forEach((s) => {
      if (!inWindow(s.date, window)) return;
      classicCatalog += s.reps;
      catalogDays.add(s.date);
    });
  });

  /** Volume inclusif analytique = exclusif jour (via grouped+GTG) + défis unsync. */
  let strengthInclusive = 0;
  const strengthDays = new Set();
  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    if (!inWindow(dateStr, window)) return;
    const pack = classicExclusiveRepsForDay(snapshot, dateStr);
    const row = (pack?.syncDeduction?.perKey || []).find(
      (entry) => String(entry.storageId) === String(idStr)
    );
    const allowed =
      pack?.classicTotalReps > 0 && row
        ? Math.max(0, Math.floor(Number(row.exclusiveReps) || 0))
        : r;
    if (allowed > 0) {
      strengthInclusive += allowed;
      strengthDays.add(dateStr);
    }
  });
  strengthInclusive += enduranceUnsynced;
  unsyncedDates.forEach((d) => strengthDays.add(d));

  const bannerCalendar = exclusiveSum; // sans défis unsync (comportement calendrier actuel)

  return {
    ok: true,
    window,
    populations: [
      {
        id: POPULATION_ID.RAW_CHECKED,
        value: rawChecked,
        days: rawDays.size,
        definition: POPULATION_LABEL[POPULATION_ID.RAW_CHECKED]
      },
      {
        id: POPULATION_ID.CLASSIC_SESSION,
        value: classicCatalog,
        days: catalogDays.size,
        definition: POPULATION_LABEL[POPULATION_ID.CLASSIC_SESSION]
      },
      {
        id: POPULATION_ID.STRENGTH_INCLUSIVE,
        value: strengthInclusive,
        days: strengthDays.size,
        definition: POPULATION_LABEL[POPULATION_ID.STRENGTH_INCLUSIVE]
      },
      {
        id: POPULATION_ID.BANNER_CALENDAR,
        value: bannerCalendar,
        days: exclusiveDays.size,
        definition: POPULATION_LABEL[POPULATION_ID.BANNER_CALENDAR]
      },
      {
        id: POPULATION_ID.COMPLEMENTARY_SYNCED,
        value: complementary,
        days: null,
        definition: POPULATION_LABEL[POPULATION_ID.COMPLEMENTARY_SYNCED]
      },
      {
        id: POPULATION_ID.ENDURANCE_UNSYNCED,
        value: enduranceUnsynced,
        days: unsyncedDates.length,
        definition: POPULATION_LABEL[POPULATION_ID.ENDURANCE_UNSYNCED],
        records: unsyncedDates.map((date) => ({ date, source: 'enduranceData.sessions.pushups' }))
      },
      {
        id: POPULATION_ID.GTG_SYNC_DEDUCTION,
        value: gtgDeducted,
        days: null,
        definition: POPULATION_LABEL[POPULATION_ID.GTG_SYNC_DEDUCTION]
      }
    ],
    detail: {
      classicRaw,
      other,
      classicTotalSum,
      exclusiveSum,
      complementary,
      enduranceUnsynced,
      gtgDeducted,
      catalogOnlyDays: [...catalogDays].filter((d) => !strengthDays.has(d)).sort(),
      strengthOnlyDays: [...strengthDays].filter((d) => !catalogDays.has(d)).sort()
    }
  };
}

/**
 * Table réutilisable : brut → inclusif → familles (classique).
 */
export function reconcilePopulationTable(snapshot, window, previousWindow = null) {
  const current = measurePopulationWindow(snapshot, window);
  const previous = previousWindow ? measurePopulationWindow(snapshot, previousWindow) : null;
  if (!current.ok) return current;

  const byId = (pack, id) => pack.populations.find((p) => p.id === id);

  const curInclusive = byId(current, POPULATION_ID.STRENGTH_INCLUSIVE);
  const curClassic = byId(current, POPULATION_ID.CLASSIC_SESSION);
  const curRaw = byId(current, POPULATION_ID.RAW_CHECKED);
  const curComp = byId(current, POPULATION_ID.COMPLEMENTARY_SYNCED);
  const curUnsync = byId(current, POPULATION_ID.ENDURANCE_UNSYNCED);
  const curGtg = byId(current, POPULATION_ID.GTG_SYNC_DEDUCTION);

  const steps = [
    {
      step: 'raw_checked',
      volume: curRaw.value,
      days: curRaw.days,
      note: 'Somme des clés reps cochées dans la fenêtre'
    },
    {
      step: 'minus_gtg_exclusive',
      volume: curRaw.value - curGtg.value,
      delta: -curGtg.value,
      note: 'Soustraction du volume GTG synchronisé sur les clés classiques'
    },
    {
      step: 'plus_unsynced_endurance',
      volume: curRaw.value - curGtg.value + curUnsync.value,
      delta: curUnsync.value,
      note: 'Ajout des défis pompes absents de complementary_endurance_pushups'
    },
    {
      step: 'strength_inclusive',
      volume: curInclusive.value,
      days: curInclusive.days,
      note: POPULATION_LABEL[POPULATION_ID.STRENGTH_INCLUSIVE]
    },
    {
      step: 'to_classic_session',
      volume: curClassic.value,
      days: curClassic.days,
      delta: curClassic.value - curInclusive.value,
      exclusions: {
        complementary: curComp.value,
        unsyncedEndurance: curUnsync.value,
        gtgStillInRawPath: curGtg.value,
        catalogOnlyDays: current.detail.catalogOnlyDays
      },
      note:
        'Population familles = catalogue lifetime hors complementary ; jours GTG-only restent inclus côté catalogue'
    }
  ];

  const identityCheck = {
    inclusiveFromParts: curRaw.value - curGtg.value + curUnsync.value,
    inclusiveMeasured: curInclusive.value,
    classicPlusCompPlusUnsyncMinusGtg:
      curClassic.value + curComp.value + curUnsync.value - curGtg.value,
    partsMatchInclusive:
      curRaw.value - curGtg.value + curUnsync.value === curInclusive.value
  };

  return {
    ok: true,
    window,
    previousWindow: previousWindow || null,
    current,
    previous,
    steps,
    identityCheck,
    comparators: {
      generalVsFamilyVolume: curInclusive.value - curClassic.value,
      generalVsFamilyDays: (curInclusive.days || 0) - (curClassic.days || 0)
    }
  };
}

/** Volume à utiliser selon le producteur. */
export function canonicalVolumeFor(purpose) {
  switch (purpose) {
    case 'family_composition':
    case 'session_catalog':
    case 'episode_ledger':
      return POPULATION_ID.CLASSIC_SESSION;
    case 'general_volume':
    case 'period_compare':
    case 'strength_stats':
      return POPULATION_ID.STRENGTH_INCLUSIVE;
    case 'calendar_banner':
      return POPULATION_ID.BANNER_CALENDAR;
    default:
      return POPULATION_ID.CLASSIC_SESSION;
  }
}
