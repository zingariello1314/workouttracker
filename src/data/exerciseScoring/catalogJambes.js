import { scoringEntry } from './catalogHelpers';

export const CATALOG_QUADRICEPS = [
  scoringEntry('Adduction hanche élastique', 'reps', 1, 0.45, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Burpees', 'reps', 4, 1.2, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Copenhagen plank', 'seconds', 5, 1.15, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Extension quadriceps unilatérale machine', 'reps', 2, 0.75, {
    muscleGroup: 'Quadriceps'
  }),
  scoringEntry('Fentes', 'reps', 2, 0.9, {
    muscleGroup: 'Quadriceps',
    aliases: ['lunges', 'fente']
  }),
  scoringEntry('Fentes bulgares', 'reps', 4, 1.25, {
    muscleGroup: 'Quadriceps',
    aliases: ['bulgarian split squat']
  }),
  scoringEntry('Fentes marchées', 'reps', 3, 0.95, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Fentes sautées', 'reps', 4, 1.2, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Front squat', 'reps', 5, 1.2, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Hack squat', 'reps', 3, 1.0, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Landmine squat', 'reps', 3, 0.9, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Leg extension', 'reps', 2, 0.75, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Leg press unilatérale', 'reps', 4, 1.15, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Pistol squat', 'reps', 7, 1.8, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Presse à cuisses', 'reps', 3, 1.0, {
    muscleGroup: 'Quadriceps',
    aliases: ['leg press']
  }),
  scoringEntry('Saut sur box', 'reps', 4, 1.2, {
    muscleGroup: 'Quadriceps',
    aliases: ['box jump']
  }),
  scoringEntry('Shrimp squat', 'reps', 6, 1.5, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Sissy squat', 'reps', 6, 1.4, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Squat', 'reps', 3, 1.0, {
    muscleGroup: 'Quadriceps',
    aliases: ['squat barre', 'back squat']
  }),
  scoringEntry('Squat cosaque', 'reps', 4, 1.1, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Squat décliné rééducation genou', 'reps', 2, 0.7, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Squat gobelet', 'reps', 2, 0.85, {
    muscleGroup: 'Quadriceps',
    aliases: ['goblet squat']
  }),
  scoringEntry('Squat sauté', 'reps', 4, 1.15, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Squat Zercher', 'reps', 5, 1.2, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Step-down contrôlé', 'reps', 3, 0.9, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Step-up', 'reps', 2, 0.85, { muscleGroup: 'Quadriceps' }),
  scoringEntry('Wall sit', 'seconds', 2, 0.8, {
    muscleGroup: 'Quadriceps',
    aliases: ['chaise murale', 'wall sit']
  })
];

export const CATALOG_ISCHIO = [
  scoringEntry('Curl nordique', 'reps', 8, 1.9, {
    muscleGroup: 'Ischio-jambiers',
    aliases: ['nordic curl']
  }),
  scoringEntry('Good morning', 'reps', 3, 0.9, { muscleGroup: 'Ischio-jambiers' }),
  scoringEntry('Leg curl', 'reps', 2, 0.8, { muscleGroup: 'Ischio-jambiers' }),
  scoringEntry('Leg curl allongé', 'reps', 2, 0.8, { muscleGroup: 'Ischio-jambiers' }),
  scoringEntry('Soulevé de terre jambes tendues', 'reps', 4, 1.1, {
    muscleGroup: 'Ischio-jambiers',
    aliases: ['romanian deadlift', 'sdt jambes tendues']
  }),
  scoringEntry('Soulevé de terre roumain haltères', 'reps', 3, 1.0, { muscleGroup: 'Ischio-jambiers' }),
  scoringEntry('Soulevé de terre sumo', 'reps', 4, 1.1, {
    muscleGroup: 'Ischio-jambiers',
    aliases: ['sumo deadlift']
  })
];

export const CATALOG_MOLLETS = [
  scoringEntry('Mollets debout', 'reps', 1, 0.6, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets assis', 'reps', 1, 0.6, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets à la presse', 'reps', 2, 0.7, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets unilatéraux', 'reps', 3, 0.9, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets debout unilatéral machine', 'reps', 3, 0.95, { muscleGroup: 'Mollets' }),
  scoringEntry("Élévations pointes vers l'extérieur", 'reps', 1, 0.6, { muscleGroup: 'Mollets' }),
  scoringEntry("Élévations pointes vers l'intérieur", 'reps', 1, 0.6, { muscleGroup: 'Mollets' }),
  scoringEntry('Descente excentrique mollet', 'reps', 3, 0.85, { muscleGroup: 'Mollets' })
];

export const CATALOG_CHEVILLE = [
  scoringEntry('Tibialis raises mur', 'reps', 2, 0.6, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Éversion cheville élastique', 'reps', 1, 0.4, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Inversion cheville élastique', 'reps', 1, 0.4, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Équilibre unipodal', 'seconds', 2, 0.55, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Ramassage serviette', 'reps', 1, 0.35, { muscleGroup: 'Cheville / pied' })
];

export const CATALOG_FESSIERS = [
  scoringEntry('Abduction hanche debout élastique', 'reps', 1, 0.45, { muscleGroup: 'Fessiers' }),
  scoringEntry('Glute bridge', 'reps', 1, 0.7, {
    muscleGroup: 'Fessiers',
    aliases: ['pont fessier']
  }),
  scoringEntry('Glute bridge unilatéral', 'reps', 3, 0.9, { muscleGroup: 'Fessiers' }),
  scoringEntry('Hip thrust', 'reps', 2, 0.85, { muscleGroup: 'Fessiers' }),
  scoringEntry('Hip thrust unilatéral', 'reps', 4, 1.05, { muscleGroup: 'Fessiers' }),
  scoringEntry('Kettlebell swings', 'reps', 3, 1.0, { muscleGroup: 'Fessiers' }),
  scoringEntry('Monster walk', 'reps', 2, 0.55, { muscleGroup: 'Fessiers' })
];
