/**
 * Situation d’une métrique (palier lisible + score partiel 0–100 pour la note globale).
 */

/** @typedef {{ tierId: string, label: string, score: number, hint?: string }} MetricSituation */

/**
 * @param {number} value
 * @param {Array<{ max: number, tierId: string, label: string, score: number, hint?: string }>} bands — croissant par max
 */
export function situateByBands(value, bands) {
  const v = Number(value) || 0;
  for (let i = 0; i < bands.length; i += 1) {
    if (v <= bands[i].max) {
      return {
        tierId: bands[i].tierId,
        label: bands[i].label,
        score: bands[i].score,
        hint: bands[i].hint
      };
    }
  }
  const last = bands[bands.length - 1];
  return { tierId: last.tierId, label: last.label, score: last.score, hint: last.hint };
}

export function situateTrainingDaysPerWeek(days) {
  return situateByBands(days, [
    { max: 0, tierId: 'dormant', label: 'Très peu actif', score: 12, hint: 'Peu ou pas de séances enregistrées sur la période.' },
    { max: 1, tierId: 'occasional', label: 'Occasionnel', score: 32, hint: '1 jour type / semaine — bon pour repartir doucement.' },
    { max: 2, tierId: 'light', label: 'Léger', score: 48, hint: '2 j / semaine — base à consolider.' },
    { max: 3, tierId: 'steady', label: 'Régulier', score: 62, hint: '3 j / semaine — rythme solide pour progresser.' },
    { max: 4, tierId: 'committed', label: 'Assidu', score: 76, hint: '4 j / semaine — volume compatible avec la plupart des objectifs.' },
    { max: 5, tierId: 'high', label: 'Très assidu', score: 88, hint: '5 j / semaine — surveille récupération et sommeil.' },
    { max: 99, tierId: 'elite_freq', label: 'Fréquence élevée', score: 94, hint: '6–7 j / semaine — réservé si la récup suit.' }
  ]);
}

export function situateVolumeKgReps(kg) {
  return situateByBands(kg, [
    { max: 0, tierId: 'none', label: 'Non renseigné', score: 8 },
    { max: 2500, tierId: 'low', label: 'Volume léger', score: 38 },
    { max: 12000, tierId: 'moderate', label: 'Volume modéré', score: 58 },
    { max: 35000, tierId: 'solid', label: 'Volume solide', score: 74 },
    { max: 80000, tierId: 'high', label: 'Volume élevé', score: 86 },
    { max: 1e12, tierId: 'very_high', label: 'Volume très élevé', score: 92, hint: 'Pense deload ou semaines plus légères.' }
  ]);
}

export function situateRunningKm(km) {
  return situateByBands(km, [
    { max: 0, tierId: 'none', label: 'Pas de course loguée', score: 20 },
    { max: 8, tierId: 'starter', label: 'Initiation course', score: 42 },
    { max: 25, tierId: 'regular', label: 'Course régulière', score: 58 },
    { max: 55, tierId: 'endurance', label: 'Bon volume course', score: 72 },
    { max: 100, tierId: 'strong', label: 'Volume course marqué', score: 84 },
    { max: 1e6, tierId: 'race_prep', label: 'Gros volume course', score: 92 }
  ]);
}

export function situateTotalReps(reps) {
  return situateByBands(reps, [
    { max: 0, tierId: 'none', label: 'Aucune rep loguée', score: 10 },
    { max: 400, tierId: 'low', label: 'Volume reps léger', score: 40 },
    { max: 2000, tierId: 'moderate', label: 'Volume reps modéré', score: 58 },
    { max: 6000, tierId: 'solid', label: 'Volume reps solide', score: 74 },
    { max: 15000, tierId: 'high', label: 'Volume reps élevé', score: 86 },
    { max: 1e9, tierId: 'very_high', label: 'Volume reps très élevé', score: 92 }
  ]);
}

export function situateTenureDays(days) {
  return situateByBands(days, [
    { max: 0, tierId: 'new', label: 'Pas encore de trace', score: 15 },
    { max: 13, tierId: 'starting', label: 'Début de suivi', score: 35 },
    { max: 45, tierId: 'building', label: 'Habitude en construction', score: 52 },
    { max: 120, tierId: 'established', label: 'Pratique installée', score: 68 },
    { max: 365, tierId: 'experienced_track', label: 'Long suivi', score: 82 },
    { max: 1e6, tierId: 'veteran_track', label: 'Historique riche', score: 90 }
  ]);
}

export function situateProgramAdherencePct(pct) {
  return situateByBands(pct, [
    { max: 0, tierId: 'unknown', label: '—', score: 40 },
    { max: 35, tierId: 'low', label: 'Adhérence faible', score: 35, hint: 'Beaucoup de jours sans suivi du rythme prévu.' },
    { max: 55, tierId: 'fragile', label: 'Adhérence fragile', score: 50 },
    { max: 72, tierId: 'ok', label: 'Adhérence correcte', score: 65 },
    { max: 85, tierId: 'good', label: 'Bonne adhérence', score: 78 },
    { max: 100, tierId: 'excellent', label: 'Excellente adhérence', score: 90 }
  ]);
}

/** Bandes de placement globales (libellé nuancé). */
export const PLACEMENT_BANDS = [
  { max: 22, id: 'discovery', label: 'Découverte', description: 'Profil à structurer — le quiz et un programme guidé posent les bases.' },
  { max: 38, id: 'foundation', label: 'Fondations', description: 'Tu construis l’habitude ; priorité clarté, technique et régularité modeste.' },
  { max: 52, id: 'building', label: 'En progression', description: 'Capacité en montée — volume et complexité augmentent par paliers.' },
  { max: 66, id: 'structured', label: 'Pratique structurée', description: 'Bon équilibre entre charge, récupération et objectifs du quiz.' },
  { max: 80, id: 'confirmed', label: 'Profil confirmé', description: 'Données et habitudes solides — cycles plus exigeants possibles.' },
  { max: 100, id: 'advanced', label: 'Capacité avancée', description: 'Historique et profil compatibles avec une planification fine.' }
];

export function placementBandForScore(score0to100) {
  const s = Math.max(0, Math.min(100, Math.round(Number(score0to100) || 0)));
  for (const b of PLACEMENT_BANDS) {
    if (s <= b.max) return { score: s, ...b };
  }
  return { score: s, ...PLACEMENT_BANDS[PLACEMENT_BANDS.length - 1] };
}
