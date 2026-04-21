/**
 * Modèles de défis gainage / corde (champs utilisés par enduranceChallengesService).
 */

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addCalendarDays(base, days) {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  x.setDate(x.getDate() + days);
  return x;
}

export const GAINAGE_CHALLENGE_PRESET_DEFS = [
  {
    id: 'gainage_ponctuel_300s',
    labelKey: 'endurance.gainagePresets.ponctuel300s',
    build: () => {
      const end = addCalendarDays(new Date(), 14);
      return {
        name: '5 min cumulées en planche (300 s) — 14 jours max',
        type: 'ponctuel',
        activityType: 'gainage',
        targetDate: isoDate(end),
        goalCount: 300,
        goalDuration: '',
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'gainage_recurrent_120s_21d',
    labelKey: 'endurance.gainagePresets.recurrent120s21',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 20);
      return {
        name: '≥ 120 s de planche par séance, 21 jours',
        type: 'recurrent',
        activityType: 'gainage',
        frequency: 'daily',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 120,
        goalDuration: '',
        targetDate: ''
      };
    }
  },
  {
    id: 'gainage_periode_240s',
    labelKey: 'endurance.gainagePresets.periode240s',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 27);
      return {
        name: 'Chaque séance ≥ 4 min de planche (240 s) sur 4 semaines',
        type: 'periode',
        activityType: 'gainage',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 240,
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'gainage_periode_360s',
    labelKey: 'endurance.gainagePresets.periode360s',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 27);
      return {
        name: 'Chaque séance ≥ 6 min de planche (360 s) sur 4 semaines',
        type: 'periode',
        activityType: 'gainage',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 360,
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'gainage_ponctuel_600s',
    labelKey: 'endurance.gainagePresets.ponctuel600s',
    build: () => {
      const end = addCalendarDays(new Date(), 21);
      return {
        name: '10 min cumulées en planche (600 s) — 21 jours max',
        type: 'ponctuel',
        activityType: 'gainage',
        targetDate: isoDate(end),
        goalCount: 600,
        goalDuration: '',
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'gainage_recurrent_240s_14d',
    labelKey: 'endurance.gainagePresets.recurrent240s14',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 13);
      return {
        name: '≥ 4 min de planche (240 s) par séance, 14 jours',
        type: 'recurrent',
        activityType: 'gainage',
        frequency: 'daily',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 240,
        goalDuration: '',
        targetDate: ''
      };
    }
  },
  {
    id: 'gainage_periode_420s',
    labelKey: 'endurance.gainagePresets.periode420s',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 27);
      return {
        name: 'Chaque séance ≥ 7 min de planche (420 s) sur 4 semaines',
        type: 'periode',
        activityType: 'gainage',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: 420,
        goalDuration: '',
        frequency: 'daily',
        targetDate: ''
      };
    }
  }
];

export const JUMPROPE_CHALLENGE_PRESET_DEFS = [
  {
    id: 'jumprope_ponctuel_800j',
    labelKey: 'endurance.jumpropePresets.ponctuel800',
    build: () => {
      const end = addCalendarDays(new Date(), 10);
      return {
        name: '800 sauts en une séance (10 jours max)',
        type: 'ponctuel',
        activityType: 'jumprope',
        targetDate: isoDate(end),
        goalCount: '',
        goalDuration: 1,
        goalJumps: 800,
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'jumprope_ponctuel_10min_600j',
    labelKey: 'endurance.jumpropePresets.ponctuel10min600',
    build: () => {
      const end = addCalendarDays(new Date(), 14);
      return {
        name: '10 min de corde + 600 sauts en une séance',
        type: 'ponctuel',
        activityType: 'jumprope',
        targetDate: isoDate(end),
        goalCount: '',
        goalDuration: 10,
        goalJumps: 600,
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'jumprope_recurrent_400j_30d',
    labelKey: 'endurance.jumpropePresets.recurrent400j30',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 29);
      return {
        name: '≥ 400 sauts par jour pendant 30 jours',
        type: 'recurrent',
        activityType: 'jumprope',
        frequency: 'daily',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: '',
        goalDuration: 1,
        goalJumps: 400,
        targetDate: ''
      };
    }
  },
  {
    id: 'jumprope_periode_15min',
    labelKey: 'endurance.jumpropePresets.periode15min',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 20);
      return {
        name: 'Chaque séance ≥ 15 min de corde (3 semaines)',
        type: 'periode',
        activityType: 'jumprope',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: '',
        goalDuration: 15,
        goalJumps: 1,
        frequency: 'daily',
        targetDate: ''
      };
    }
  },
  {
    id: 'jumprope_ponctuel_1200j_12min',
    labelKey: 'endurance.jumpropePresets.ponctuel1200j12min',
    build: () => {
      const end = addCalendarDays(new Date(), 14);
      return {
        name: '12 min de corde + 1200 sauts en une séance (14 jours max)',
        type: 'ponctuel',
        activityType: 'jumprope',
        targetDate: isoDate(end),
        goalCount: '',
        goalDuration: 12,
        goalJumps: 1200,
        frequency: 'daily',
        startDate: '',
        endDate: ''
      };
    }
  },
  {
    id: 'jumprope_recurrent_600j_21d',
    labelKey: 'endurance.jumpropePresets.recurrent600j21',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 20);
      return {
        name: '≥ 600 sauts + ≥ 10 min par jour pendant 21 jours',
        type: 'recurrent',
        activityType: 'jumprope',
        frequency: 'daily',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: '',
        goalDuration: 10,
        goalJumps: 600,
        targetDate: ''
      };
    }
  },
  {
    id: 'jumprope_periode_20min',
    labelKey: 'endurance.jumpropePresets.periode20min',
    build: () => {
      const start = new Date();
      const end = addCalendarDays(start, 27);
      return {
        name: 'Chaque séance ≥ 20 min de corde (4 semaines)',
        type: 'periode',
        activityType: 'jumprope',
        startDate: isoDate(start),
        endDate: isoDate(end),
        goalCount: '',
        goalDuration: 20,
        goalJumps: 1,
        frequency: 'daily',
        targetDate: ''
      };
    }
  }
];

export function buildGainagePresetChallenge(presetId) {
  const def = GAINAGE_CHALLENGE_PRESET_DEFS.find((p) => p.id === presetId);
  if (!def) return null;
  return def.build();
}

export function buildJumpropePresetChallenge(presetId) {
  const def = JUMPROPE_CHALLENGE_PRESET_DEFS.find((p) => p.id === presetId);
  if (!def) return null;
  return def.build();
}
