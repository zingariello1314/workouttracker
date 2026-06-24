/**
 * Repères course à pied — temps par distance (secondes).
 * `fasterThanSec` : si l'utilisateur termine en moins de temps, il dépasse ce palier.
 */

export const RUNNING_DISTANCE_BENCHMARKS = {
  m100: {
    label: '100 m',
    distanceKm: 0.1,
    minSessionKm: 0.08,
    maxSessionKm: 0.15,
    tiers: [
      { id: 'world_elite', label: 'élite mondiale', fasterThanSec: 10 },
      { id: 'national_elite', label: 'élite nationale', fasterThanSec: 11 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 12 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 13 },
      { id: 'good', label: 'bon', fasterThanSec: 14 },
      { id: 'avg', label: 'amateur', fasterThanSec: 17 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 20 }
    ]
  },
  m400: {
    label: '400 m',
    distanceKm: 0.4,
    minSessionKm: 0.35,
    maxSessionKm: 0.48,
    tiers: [
      { id: 'elite', label: 'élite', fasterThanSec: 48 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 52 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 58 },
      { id: 'good', label: 'bon', fasterThanSec: 65 },
      { id: 'avg', label: 'moyen', fasterThanSec: 75 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 90 }
    ]
  },
  m800: {
    label: '800 m',
    distanceKm: 0.8,
    minSessionKm: 0.75,
    maxSessionKm: 0.92,
    tiers: [
      { id: 'elite', label: 'élite', fasterThanSec: 110 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 120 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 130 },
      { id: 'good', label: 'bon', fasterThanSec: 150 },
      { id: 'avg', label: 'moyen', fasterThanSec: 180 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 240 }
    ]
  },
  m1000: {
    label: '1000 m',
    distanceKm: 1,
    minSessionKm: 0.95,
    maxSessionKm: 1.15,
    tiers: [
      { id: 'elite', label: 'élite', fasterThanSec: 160 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 180 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 210 },
      { id: 'good', label: 'bon', fasterThanSec: 240 },
      { id: 'avg', label: 'moyen', fasterThanSec: 300 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 360 }
    ]
  },
  m1500: {
    label: '1500 m',
    distanceKm: 1.5,
    minSessionKm: 1.4,
    maxSessionKm: 1.65,
    tiers: [
      { id: 'elite', label: 'élite', fasterThanSec: 220 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 240 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 270 },
      { id: 'good', label: 'bon', fasterThanSec: 300 },
      { id: 'avg', label: 'moyen', fasterThanSec: 360 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 480 }
    ]
  },
  '5k': {
    label: '5 km',
    distanceKm: 5,
    minSessionKm: 4.8,
    tiers: [
      { id: 'world_elite', label: 'élite mondiale', fasterThanSec: 13 * 60 },
      { id: 'elite_amateur', label: 'élite amateur', fasterThanSec: 17 * 60 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 20 * 60 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 23 * 60 },
      { id: 'good', label: 'bon', fasterThanSec: 27 * 60 },
      { id: 'avg', label: 'moyen', fasterThanSec: 32 * 60 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 40 * 60 }
    ]
  },
  '10k': {
    label: '10 km',
    distanceKm: 10,
    minSessionKm: 9.5,
    tiers: [
      { id: 'world_elite', label: 'élite mondiale', fasterThanSec: 27 * 60 },
      { id: 'elite_amateur', label: 'élite amateur', fasterThanSec: 35 * 60 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 40 * 60 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 45 * 60 },
      { id: 'good', label: 'bon', fasterThanSec: 50 * 60 },
      { id: 'avg', label: 'moyen', fasterThanSec: 60 * 60 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 75 * 60 }
    ]
  },
  half: {
    label: 'semi-marathon',
    distanceKm: 21.0975,
    minSessionKm: 20.5,
    tiers: [
      { id: 'world_elite', label: 'élite mondiale', fasterThanSec: 58 * 60 },
      { id: 'elite_amateur', label: 'élite amateur', fasterThanSec: 75 * 60 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 85 * 60 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 95 * 60 },
      { id: 'good', label: 'bon', fasterThanSec: 105 * 60 },
      { id: 'avg', label: 'moyen', fasterThanSec: 120 * 60 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 150 * 60 }
    ]
  },
  marathon: {
    label: 'marathon',
    distanceKm: 42.195,
    minSessionKm: 41,
    tiers: [
      { id: 'world_elite', label: 'élite mondiale', fasterThanSec: 2 * 3600 },
      { id: 'elite_amateur', label: 'élite amateur', fasterThanSec: 2 * 3600 + 40 * 60 },
      { id: 'excellent', label: 'excellent', fasterThanSec: 3 * 3600 },
      { id: 'very_good', label: 'très bon', fasterThanSec: 3 * 3600 + 30 * 60 },
      { id: 'good', label: 'bon', fasterThanSec: 4 * 3600 },
      { id: 'avg', label: 'moyen', fasterThanSec: 4 * 3600 + 30 * 60 },
      { id: 'beginner', label: 'débutant', fasterThanSec: 5 * 3600 }
    ]
  }
};

/** Kilomètres hebdomadaires — profil volume course. */
export const WEEKLY_KM_TIERS = [
  { id: 'occasional', label: 'occasionnel', min: 0, max: 10 },
  { id: 'regular', label: 'régulier', min: 10, max: 20 },
  { id: 'serious', label: 'amateur sérieux', min: 20, max: 40 },
  { id: 'invested', label: 'très investi', min: 40, max: 60 },
  { id: 'competitive', label: 'compétiteur', min: 60, max: 100 },
  { id: 'high_volume', label: 'gros volume', min: 100, max: 9999 }
];

/** Pas quotidiens — repères population. */
export const DAILY_STEPS_TIERS = [
  { id: 'sedentary', label: 'très sédentaire', min: 0, max: 2999 },
  { id: 'low', label: 'faiblement actif', min: 3000, max: 4999 },
  { id: 'active', label: 'actif', min: 5000, max: 7499 },
  { id: 'very_active', label: 'très actif', min: 7500, max: 9999 },
  { id: 'excellent', label: 'excellent', min: 10000, max: 19999 },
  { id: 'exceptional', label: 'exceptionnel', min: 20000, max: 999999 }
];

/** Allures de référence (min/km) → vitesse km/h indicative. */
export const PACE_REFERENCE = [
  { paceMinPerKm: 2.5, speedKmh: 24, label: '2:30/km' },
  { paceMinPerKm: 3.0, speedKmh: 20, label: '3:00/km' },
  { paceMinPerKm: 4.0, speedKmh: 15, label: '4:00/km' },
  { paceMinPerKm: 5.0, speedKmh: 12, label: '5:00/km' },
  { paceMinPerKm: 6.0, speedKmh: 10, label: '6:00/km' },
  { paceMinPerKm: 7.0, speedKmh: 8.6, label: '7:00/km' },
  { paceMinPerKm: 8.0, speedKmh: 7.5, label: '8:00/km' }
];

export const FAMOUS_RUNNING_RECORDS = {
  marathon: [
    { name: 'Kipchoge', timeSec: 2 * 3600 + 1 * 60 + 9 },
    { name: 'Kiptum', timeSec: 2 * 3600 + 35 }
  ],
  m1000: { label: '1000 m international', timeSec: 2 * 60 + 17 },
  mile: { label: 'Mile record mondial', timeSec: 3 * 60 + 43 },
  m1500: { label: '1500 m record mondial', timeSec: 3 * 60 + 26 },
  m5000: { label: '5000 m record mondial', timeSec: 12 * 60 + 35 },
  m10000: { label: '10000 m record mondial', timeSec: 26 * 60 + 11 }
};
