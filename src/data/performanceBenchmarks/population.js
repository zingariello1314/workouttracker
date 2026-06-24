/**
 * Repères population — ordres de grandeur pour comparaisons « coach ».
 * Sources : moyennes loisir / adultes actifs (heuristiques, pas étude INSEE).
 */

export const POPULATION_REFERENCES = {
  /** Adulte français moyen (activité physique occasionnelle). */
  averageAdult: {
    label: 'adulte moyen',
    sessionsPerWeek: 0.9,
    runningKmPerYear: 35,
    runningKmPerMonth: 3
  },
  /** Coureur loisir typique. */
  recreationalRunner: {
    label: 'coureur loisir',
    sessionsPerWeek: 2.2,
    runningKmPerYear: 280,
    avg5kTimeSec: 28 * 60,
    avgMarathonTimeSec: 4 * 3600 + 26 * 60,
    avg5kPaceMinPerKm: 5.6
  },
  /** Coureur compétitif amateur. */
  competitiveRunner: {
    label: 'coureur compétitif amateur',
    sessionsPerWeek: 4.5,
    runningKmPerYear: 1200
  }
};
