/** Tonnage mensuel (kg déplacés = séries × reps × poids). */

export const MONTHLY_TONNAGE_TIERS_KG = [
  { id: 't10', label: '10 tonnes', minKg: 10_000, maxKg: 24_999 },
  { id: 't25', label: '25 tonnes', minKg: 25_000, maxKg: 49_999 },
  { id: 't50', label: '50 tonnes', minKg: 50_000, maxKg: 99_999 },
  { id: 't100', label: '100 tonnes', minKg: 100_000, maxKg: 249_999 },
  { id: 't250', label: '250 tonnes', minKg: 250_000, maxKg: 499_999 },
  { id: 't500', label: '500 tonnes+', minKg: 500_000, maxKg: 9_999_999_999 }
];

/** Poids type d'un bus urbain (comparaison wow). */
export const URBAN_BUS_WEIGHT_KG = 12_000;
