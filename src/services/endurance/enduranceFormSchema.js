const getCurrentDateStr = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getCurrentTimeStr = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const buildRatingDefaults = () => ({
  congestion: 0,
  motivation: 0,
  sentimentAvant: 0,
  sentimentApres: 0
});

const activityFactories = {
  pushups: () => ({
    date: getCurrentDateStr(),
    time: getCurrentTimeStr(),
    count: '',
    duration: '',
    notes: '',
    ...buildRatingDefaults()
  }),
  boxing: () => ({
    date: getCurrentDateStr(),
    time: getCurrentTimeStr(),
    duration: '',
    notes: '',
    ...buildRatingDefaults()
  }),
  swimming: () => ({
    date: getCurrentDateStr(),
    time: getCurrentTimeStr(),
    swimType: 'crawl',
    laps: [{ distance: 25, time: '' }],
    notes: '',
    heartRate: '',
    calories: '',
    pace100m: '',
    ...buildRatingDefaults()
  }),
  jumprope: () => ({
    date: getCurrentDateStr(),
    time: getCurrentTimeStr(),
    duration: '',
    type: 'continue',
    jumps: '',
    sessionNumber: 1,
    hrMax: '',
    hrAvg: '',
    bestStreak: '',
    jumpsPerMin: '',
    calories: '',
    notes: '',
    ...buildRatingDefaults(),
    fluidite: 0,
    transpiration: 0
  }),
  running: () => ({
    date: getCurrentDateStr(),
    time: getCurrentTimeStr(),
    distance: '',
    duration: '',
    type: 'endurance',
    elevation: '',
    notes: '',
    ...buildRatingDefaults()
  })
};

const challengeFactory = (activityType = 'pushups') => ({
  name: '',
  type: 'ponctuel',
  activityType,
  targetDate: '',
  startDate: '',
  endDate: '',
  frequency: 'daily',
  moment: 'matin',
  timeOfDay: '',
  dayOfWeek: undefined,
  goalCount: '',
  goalDuration: '',
  goalDistance: '',
  goalJumps: '',
  notes: ''
});

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export const ENDURANCE_ACTIVITY_TYPES = Object.keys(activityFactories);

const formConfig = {
  pushups: {
    columns: 2,
    fields: [
      { key: 'date', type: 'date', label: 'Date' },
      { key: 'time', type: 'time', label: 'Heure' },
      { key: 'count', type: 'number', label: 'Nombre de pompes', placeholder: 'Ex: 50' },
      { key: 'duration', type: 'number', label: 'Durée (minutes)', step: 0.5, placeholder: 'Ex: 5' },
      { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Commentaires optionnels...', colSpan: 2, rows: 3 }
    ],
    ratings: [
      { key: 'congestion', label: 'Congestion musculaire' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'sentimentAvant', label: 'Sentiment avant' },
      { key: 'sentimentApres', label: 'Sentiment après' }
    ],
    ratingTitle: 'Évaluation de la session',
    ratingsColumns: 2
  },
  boxing: {
    columns: 2,
    fields: [
      { key: 'date', type: 'date', label: 'Date' },
      { key: 'time', type: 'time', label: 'Heure' },
      { key: 'duration', type: 'number', label: 'Durée (minutes)', step: 5, placeholder: 'Ex: 60', colSpan: 2 },
      { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Type d\'entraînement, sparring, sac...', colSpan: 2, rows: 3 }
    ],
    ratings: [
      { key: 'congestion', label: 'Congestion musculaire' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'sentimentAvant', label: 'Sentiment avant' },
      { key: 'sentimentApres', label: 'Sentiment après' }
    ],
    ratingTitle: 'Évaluation de la session',
    ratingsColumns: 2
  },
  swimming: {
    columns: 2,
    fields: [
      { key: 'date', type: 'date', label: 'Date' },
      { key: 'time', type: 'time', label: 'Heure' },
      {
        key: 'swimType',
        type: 'select',
        label: 'Type de nage',
        options: [
          { label: 'Crawl', value: 'crawl' },
          { label: 'Brasse', value: 'brasse' },
          { label: 'Dos', value: 'dos' },
          { label: 'Papillon', value: 'papillon' },
          { label: 'Mixte', value: 'mixte' }
        ]
      },
      { key: 'notes', type: 'textarea', label: 'Notes', colSpan: 2, rows: 3, placeholder: 'Commentaires sur la séance...' }
    ],
    ratings: [
      { key: 'congestion', label: 'Congestion musculaire' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'sentimentAvant', label: 'Sentiment avant' },
      { key: 'sentimentApres', label: 'Sentiment après' }
    ],
    ratingTitle: 'Évaluation de la session',
    ratingsColumns: 2
  },
  jumprope: {
    columns: 2,
    fields: [
      { key: 'date', type: 'date', label: 'Date' },
      { key: 'time', type: 'time', label: 'Heure' },
      { key: 'duration', type: 'text', label: 'Durée (mm:ss)', placeholder: 'Ex: 10:00' },
      {
        key: 'type',
        type: 'select',
        label: 'Type de session',
        options: [
          { label: 'Continue', value: 'continue' },
          { label: 'Intervalles', value: 'interval' },
          { label: 'Double unders', value: 'double_under' }
        ]
      },
      { key: 'jumps', type: 'number', label: 'Nombre de sauts', placeholder: 'Ex: 500' },
      { key: 'sessionNumber', type: 'number', label: 'Session n°', placeholder: 'Ex: 1' },
      { key: 'hrMax', type: 'number', label: 'Fréquence cardiaque max (bpm)', placeholder: 'Ex: 175' },
      { key: 'hrAvg', type: 'number', label: 'Fréquence cardiaque moyenne (bpm)', placeholder: 'Ex: 150' },
      { key: 'bestStreak', type: 'number', label: 'Meilleure série (sauts)', placeholder: 'Ex: 120' },
      { key: 'jumpsPerMin', type: 'number', label: 'Sauts par minute', placeholder: 'Ex: 120' },
      { key: 'calories', type: 'number', label: 'Calories dépensées', placeholder: 'Ex: 180' },
      { key: 'notes', type: 'textarea', label: 'Notes', colSpan: 2, rows: 3 }
    ],
    ratings: [
      { key: 'congestion', label: 'Congestion musculaire' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'sentimentAvant', label: 'Sentiment avant' },
      { key: 'sentimentApres', label: 'Sentiment après' },
      { key: 'fluidite', label: 'Fluidité' },
      { key: 'transpiration', label: 'Transpiration' }
    ],
    ratingTitle: 'Évaluation de la session',
    ratingsColumns: 3
  },
  running: {
    columns: 2,
    fields: [
      { key: 'date', type: 'date', label: 'Date' },
      { key: 'time', type: 'time', label: 'Heure' },
      {
        key: 'distance',
        type: 'number',
        label: 'Distance (km)',
        placeholder: 'Ex: 5.2',
        step: 0.1
      },
      { key: 'duration', type: 'text', label: 'Durée (hh:mm:ss)', placeholder: 'Ex: 00:28:30' },
      {
        key: 'type',
        type: 'select',
        label: 'Type de course',
        options: [
          { label: 'Endurance fondamentale / footing', value: 'easy' },
          { label: 'Sortie longue', value: 'long_run' },
          { label: 'Course classique (endurance)', value: 'endurance' },
          { label: 'Fartlek', value: 'fartlek' },
          { label: 'Fractionné / intervalles', value: 'interval' },
          { label: 'Seuil / tempo', value: 'threshold' },
          { label: 'Tempo', value: 'tempo' },
          { label: 'Sprint / VMA courte', value: 'sprint' }
        ]
      },
      { key: 'elevation', type: 'number', label: 'Dénivelé (m)', placeholder: 'Ex: 120' },
      { key: 'notes', type: 'textarea', label: 'Notes', colSpan: 2, rows: 3 }
    ],
    ratings: [
      { key: 'congestion', label: 'Congestion' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'sentimentAvant', label: 'Sentiment avant' },
      { key: 'sentimentApres', label: 'Sentiment après' }
    ],
    ratingTitle: 'Évaluation de la session',
    ratingsColumns: 2
  }
};

export function createDefaultFormState(activityType) {
  const factory = activityFactories[activityType];
  if (!factory) {
    return {};
  }
  return deepClone(factory());
}

export function createDefaultChallengeFormState(activityType = 'pushups') {
  return deepClone(challengeFactory(activityType));
}

export function getFormConfig(activityType) {
  return formConfig[activityType] || null;
}


