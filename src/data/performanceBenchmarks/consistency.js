/** Fréquence d'entraînement et volume annuel de course. */

export const SESSIONS_PER_WEEK_TIERS = [
  { id: 'sedentary', label: 'sédentaire', min: 0, max: 0.4 },
  { id: 'occasional', label: 'occasionnel', min: 0.5, max: 1.4 },
  { id: 'regular', label: 'régulier', min: 1.5, max: 3.4 },
  { id: 'sporty', label: 'sportif', min: 3.5, max: 5.4 },
  { id: 'invested', label: 'très investi', min: 5.5, max: 999 }
];

export const YEARLY_RUNNING_KM_TIERS = [
  { id: 'low', label: '< 100 km/an', min: 0, max: 99 },
  { id: 'casual', label: '100–300 km/an', min: 100, max: 299 },
  { id: 'regular', label: '300–800 km/an', min: 300, max: 799 },
  { id: 'committed', label: '800–1500 km/an', min: 800, max: 1499 },
  { id: 'high', label: '1500–3000 km/an', min: 1500, max: 2999 },
  { id: 'ultra', label: '3000+ km/an', min: 3000, max: 999999 }
];

/** Durée typique de préparation semi-marathon (jours). */
export const SEMI_MARATHON_PREP_DAYS = 56;

/** Heures de course cumulées sur 8 semaines de prépa marathon loisir (ordre de grandeur). */
export const MARATHON_PREP_HOURS_8W = 15;
