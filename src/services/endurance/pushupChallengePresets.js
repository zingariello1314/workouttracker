/**
 * Modèles de défis « pompes » : uniquement champs utilisés par l’onglet Pompes (count, duration, dates).
 * Le type `pushups_cumul` agrège les `count` sur la période (voir enduranceChallengesService).
 */

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addCalendarDays(base, days) {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  x.setDate(x.getDate() + days);
  return x;
}

/** @typedef {{ id: string, labelKey: string, build: () => object }} PushupPresetDef */

/** @type {PushupPresetDef[]} */
export const PUSHUP_CHALLENGE_PRESET_DEFS = [
  {
    id: 'pushups_ponctuel_100',
    labelKey: 'endurance.pushupPresets.ponctuel100',
    build: () => {
      const end = addCalendarDays(new Date(), 10);
      return {
        name: '100 pompes en une séance (10 jours max)',
        type: 'ponctuel',
        activityType: 'pushups',
        targetDate: isoDate(end),
        goalCount: 100,
        goalDuration: '',
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'pushups_recurrent_25_daily',
    labelKey: 'endurance.pushupPresets.daily25',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 13);
      return {
        name: '25 pompes par jour (14 jours)',
        type: 'recurrent',
        activityType: 'pushups',
        frequency: 'daily',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 25,
        goalDuration: '',
        targetDate: ''
      };
    }
  },
  {
    id: 'pushups_periode_min40',
    labelKey: 'endurance.pushupPresets.periodMin40',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 20);
      return {
        name: 'Chaque séance ≥ 40 pompes (3 semaines)',
        type: 'periode',
        activityType: 'pushups',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 40,
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'pushups_cumul_500',
    labelKey: 'endurance.pushupPresets.cumul500',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 30);
      return {
        name: '500 pompes cumulées sur le mois',
        type: 'pushups_cumul',
        activityType: 'pushups',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalTotalCount: 500,
        goalCount: '',
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'pushups_cumul_1500',
    labelKey: 'endurance.pushupPresets.cumul1500',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 59);
      return {
        name: '1500 pompes cumulées sur 60 jours',
        type: 'pushups_cumul',
        activityType: 'pushups',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalTotalCount: 1500,
        goalCount: '',
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'pushups_ponctuel_200',
    labelKey: 'endurance.pushupPresets.ponctuel200',
    build: () => {
      const end = addCalendarDays(new Date(), 14);
      return {
        name: '200 pompes en une séance (14 jours max)',
        type: 'ponctuel',
        activityType: 'pushups',
        targetDate: isoDate(end),
        goalCount: 200,
        goalDuration: '',
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'pushups_recurrent_50_daily_30',
    labelKey: 'endurance.pushupPresets.daily50x30',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 29);
      return {
        name: '50 pompes par jour pendant 30 jours',
        type: 'recurrent',
        activityType: 'pushups',
        frequency: 'daily',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 50,
        goalDuration: '',
        targetDate: ''
      };
    }
  },
  {
    id: 'pushups_periode_min80',
    labelKey: 'endurance.pushupPresets.periodMin80',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 27);
      return {
        name: 'Chaque séance ≥ 80 pompes pendant 4 semaines',
        type: 'periode',
        activityType: 'pushups',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 80,
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'pushups_cumul_5000',
    labelKey: 'endurance.pushupPresets.cumul5000',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 89);
      return {
        name: '5000 pompes cumulées sur 90 jours',
        type: 'pushups_cumul',
        activityType: 'pushups',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalTotalCount: 5000,
        goalCount: '',
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  }
];

export function buildPushupPresetChallenge(presetId) {
  const def = PUSHUP_CHALLENGE_PRESET_DEFS.find((p) => p.id === presetId);
  if (!def) return null;
  return def.build();
}
