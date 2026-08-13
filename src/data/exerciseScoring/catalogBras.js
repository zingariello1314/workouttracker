import { scoringEntry } from './catalogHelpers';

export const CATALOG_BICEPS = [
  scoringEntry('Chin-ups lestées', 'reps', 6, 1.65, {
    muscleGroup: 'Biceps',
    aliases: ['weighted chin up']
  }),
  scoringEntry('Curl 21', 'reps', 3, 0.85, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl barre', 'reps', 3, 0.9, {
    muscleGroup: 'Biceps',
    aliases: ['barbell curl']
  }),
  scoringEntry('Curl barre EZ', 'reps', 3, 0.9, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl câble unilatéral', 'reps', 2, 0.75, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl concentration', 'reps', 3, 0.8, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl haltères', 'reps', 2, 0.75, {
    muscleGroup: 'Biceps',
    aliases: ['dumbbell curl']
  }),
  scoringEntry('Curl incliné', 'reps', 3, 0.9, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl marteau', 'reps', 2, 0.8, {
    muscleGroup: 'Biceps',
    aliases: ['hammer curl']
  }),
  scoringEntry('Curl poulie basse', 'reps', 2, 0.75, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl pupitre', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps',
    aliases: ['preacher curl']
  }),
  scoringEntry('Curl pupitre machine', 'reps', 2, 0.8, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl spider', 'reps', 3, 0.85, { muscleGroup: 'Biceps' }),
  scoringEntry('Curl Zottman', 'reps', 3, 0.85, { muscleGroup: 'Biceps' }),
  scoringEntry('Tractions supination', 'reps', 4, 1.3, {
    muscleGroup: 'Biceps',
    aliases: ['chin up', 'tractions supination']
  })
];

export const CATALOG_TRICEPS = [
  scoringEntry('Barre au front', 'reps', 3, 0.9, {
    muscleGroup: 'Triceps',
    aliases: ['skull crusher', 'barre au frontez']
  }),
  scoringEntry('Développé couché prise serrée', 'reps', 4, 1.1, {
    muscleGroup: 'Triceps',
    aliases: ['close grip bench press']
  }),
  scoringEntry('Dips aux anneaux', 'reps', 6, 1.55, { muscleGroup: 'Triceps' }),
  scoringEntry('Dips barre droite', 'reps', 4, 1.25, { muscleGroup: 'Triceps' }),
  scoringEntry('Dips coréens', 'reps', 6, 1.6, { muscleGroup: 'Triceps' }),
  scoringEntry('Dips lestés', 'reps', 6, 1.6, { muscleGroup: 'Triceps' }),
  scoringEntry('Dips triceps', 'reps', 4, 1.25, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension nuque haltère assis', 'reps', 2, 0.75, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension poulie', 'reps', 2, 0.7, {
    muscleGroup: 'Triceps',
    aliases: ['triceps pushdown']
  }),
  scoringEntry('Extension poulie corde', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension poulie pronation', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension poulie supination', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension triceps', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension triceps debout avec haltère', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('Extension unilatérale à la poulie', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('Extensions triceps allongé', 'reps', 3, 0.9, { muscleGroup: 'Triceps' }),
  scoringEntry('Extensions triceps unilatérales', 'reps', 2, 0.7, { muscleGroup: 'Triceps' }),
  scoringEntry('JM press', 'reps', 5, 1.15, { muscleGroup: 'Triceps' }),
  scoringEntry('Kickbacks triceps', 'reps', 2, 0.6, { muscleGroup: 'Triceps' }),
  scoringEntry('Pompes serrées', 'reps', 3, 1.1, {
    muscleGroup: 'Triceps',
    aliases: ['close grip push up']
  }),
  scoringEntry('Tate press', 'reps', 3, 0.8, { muscleGroup: 'Triceps' })
];

export const CATALOG_AVANT_BRAS = [
  scoringEntry('Curl poignet excentrique', 'reps', 2, 0.55, { muscleGroup: 'Avant-bras' }),
  scoringEntry('Extension doigts élastique', 'reps', 1, 0.35, { muscleGroup: 'Avant-bras' }),
  scoringEntry('Flexion poignet excentrique', 'reps', 2, 0.55, { muscleGroup: 'Avant-bras' }),
  scoringEntry('Ouverture main élastique', 'reps', 1, 0.35, { muscleGroup: 'Avant-bras' }),
  scoringEntry('Plate pinch', 'seconds', 4, 0.9, { muscleGroup: 'Avant-bras' }),
  scoringEntry('Reverse wrist curl', 'reps', 2, 0.55, { muscleGroup: 'Avant-bras' }),
  scoringEntry('Wrist curl', 'reps', 2, 0.55, {
    muscleGroup: 'Avant-bras',
    aliases: ['curl poignet']
  })
];
