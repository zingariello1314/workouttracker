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
  scoringEntry('Pistol squat haltère', 'reps', 5, 1.4, {
    muscleGroup: 'Quadriceps',
    aliases: ['dumbbell pistol', 'pistol haltère']
  }),
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
  }),
  scoringEntry('Presse verticale', 'reps', 3, 1.0, {
    muscleGroup: 'Quadriceps',
    aliases: ['vertical leg press', 'presse 90']
  }),
  scoringEntry('Squat Smith', 'reps', 3, 0.95, {
    muscleGroup: 'Quadriceps',
    aliases: ['smith squat']
  }),
  scoringEntry('Squat sumo', 'reps', 2, 0.85, {
    muscleGroup: 'Quadriceps',
    aliases: ['sumo squat']
  }),
  scoringEntry('Presse adducteurs et abducteurs', 'reps', 2, 0.7, {
    muscleGroup: 'Quadriceps',
    aliases: ['adductor machine', 'abductor machine']
  }),
  scoringEntry("Adduction de hanche à la poulie", 'reps', 2, 0.65, {
    muscleGroup: 'Quadriceps',
    aliases: ['cable hip adduction']
  }),
  scoringEntry("Adduction de hanche machine assise", 'reps', 2, 0.7, {
    muscleGroup: 'Quadriceps',
    aliases: ['seated hip adduction']
  }),
  scoringEntry("Adduction de hanche allongée", 'reps', 1, 0.5, {
    muscleGroup: 'Quadriceps',
    aliases: ['side lying hip adduction']
  }),
  scoringEntry("Fente et curl haltères", 'reps', 2, 0.85, {
    muscleGroup: 'Quadriceps',
    aliases: ['lunge with bicep curl']
  }),
  scoringEntry("Squat et curl haltères", 'reps', 2, 0.85, {
    muscleGroup: 'Quadriceps',
    aliases: ['squat to bicep curl']
  }),
  scoringEntry("Step-up équilibre et curl", 'reps', 3, 0.9, {
    muscleGroup: 'Quadriceps',
    aliases: ['step-up single leg curl']
  }),
  scoringEntry("Hack squat barre", 'reps', 3, 1, {
    muscleGroup: "Quadriceps",
    aliases: ["hack squat barre"]
  }),
  scoringEntry("Squat Jefferson", 'reps', 3, 1, {
    muscleGroup: "Quadriceps",
    aliases: ["squat jefferson"]
  }),
  scoringEntry("Squat sauté barre", 'reps', 3, 1.05, {
    muscleGroup: "Quadriceps",
    aliases: ["squat sauté barre"]
  }),
  scoringEntry("Squat sauté haltères", 'reps', 3, 0.95, {
    muscleGroup: "Quadriceps",
    aliases: ["squat sauté haltères"]
  }),
  scoringEntry("Fente latérale barre", 'reps', 3, 0.95, {
    muscleGroup: "Quadriceps",
    aliases: ["fente latérale barre"]
  }),
  scoringEntry("Fente révérence", 'reps', 2, 0.7, {
    muscleGroup: "Quadriceps",
    aliases: ["fente révérence"]
  }),
  scoringEntry("Squat élastique", 'reps', 2, 0.6, {
    muscleGroup: "Quadriceps",
    aliases: ["squat élastique"]
  }),
  scoringEntry("Squat haltères", 'reps', 2, 0.85, {
    muscleGroup: "Quadriceps",
    aliases: ["squat haltères"]
  }),
  scoringEntry("Front squat kettlebell", 'reps', 3, 0.95, {
    muscleGroup: "Quadriceps",
    aliases: ["front squat kettlebell"]
  }),
  scoringEntry("Front squat Smith", 'reps', 3, 0.95, {
    muscleGroup: "Quadriceps",
    aliases: ["front squat smith"]
  }),
  scoringEntry("Hack squat Smith", 'reps', 3, 0.95, {
    muscleGroup: "Quadriceps",
    aliases: ["hack squat smith"]
  }),
  scoringEntry("Squat à la ceinture", 'reps', 3, 1, {
    muscleGroup: "Quadriceps",
    aliases: ["squat ceinture"]
  }),
  scoringEntry("Presse à cuisses horizontale", 'reps', 2, 0.85, {
    muscleGroup: "Quadriceps",
    aliases: ["presse à cuisses horizontale"]
  }),
  scoringEntry("Retournement de pneu", 'reps', 4, 1.15, {
    muscleGroup: "Quadriceps",
    aliases: ["retournement de pneu"]
  }),
  scoringEntry("Fentes bulgares barre", 'reps', 4, 1.3, {
    muscleGroup: "Quadriceps",
    aliases: ["fentes bulgares barre"]
  }),
  scoringEntry("Fentes barre", 'reps', 3, 1.05, {
    muscleGroup: "Quadriceps",
    aliases: ["fente barre", "barbell lunge", "fente arrière barre"]
  }),
  scoringEntry("Fentes bulgares Smith", 'reps', 4, 1.2, {
    muscleGroup: "Quadriceps",
    aliases: ["fentes bulgares smith"]
  }),
  scoringEntry("Fentes bulgares élastique", 'reps', 3, 1, {
    muscleGroup: "Quadriceps",
    aliases: ["fentes bulgares élastique"]
  }),
  scoringEntry("Fente bulgare suspendue", 'reps', 4, 1.2, {
    muscleGroup: "Quadriceps",
    aliases: ["fente bulgare suspendue"]
  }),
  scoringEntry("Leg extension élastique", 'reps', 1, 0.5, {
    muscleGroup: "Quadriceps",
    aliases: ["leg extension élastique"]
  }),
  scoringEntry("Squat overhead", 'reps', 5, 1.35, {
    muscleGroup: "Quadriceps",
    aliases: ["squat overhead"]
  }),
  scoringEntry("Squat à genoux barre", 'reps', 2, 0.7, {
    muscleGroup: "Quadriceps",
    aliases: ["squat à genoux barre"]
  }),
  scoringEntry("Squat sur Bosu", 'reps', 2, 0.7, {
    muscleGroup: "Quadriceps",
    aliases: ["squat bosu"]
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
  }),
  scoringEntry("Soulevé de terre unilatéral barre", 'reps', 4, 1.1, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["soulevé de terre unilatéral barre"]
  }),
  scoringEntry("Soulevé de terre unilatéral haltères", 'reps', 3, 1, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["soulevé de terre unilatéral haltères"]
  }),
  scoringEntry("Soulevé de terre jambes tendues élastique", 'reps', 2, 0.75, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["soulevé de terre jambes tendues élastique"]
  }),
  scoringEntry("Good morning assis", 'reps', 3, 0.95, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["good morning assis"]
  }),
  scoringEntry("Good morning assis machine", 'reps', 2, 0.85, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["good morning assis machine"]
  }),
  scoringEntry("Good morning Smith", 'reps', 3, 0.95, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["good morning smith"]
  }),
  scoringEntry("Glute ham raise", 'reps', 4, 1.2, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["glute ham raise"]
  }),
  scoringEntry("Leg curl assis", 'reps', 2, 0.8, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["leg curl assis"]
  }),
  scoringEntry("Leg curl à genoux", 'reps', 2, 0.8, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["leg curl à genoux"]
  }),
  scoringEntry("Leg curl haltère", 'reps', 2, 0.75, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["leg curl haltère"]
  }),
  scoringEntry("Leg curl debout", 'reps', 2, 0.7, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["leg curl debout"]
  }),
  scoringEntry("Leg curl glissière", 'reps', 2, 0.7, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["leg curl glissière"]
  }),
  scoringEntry("Leg curl swiss ball", 'reps', 3, 0.9, {
    muscleGroup: "Ischio-jambiers",
    aliases: ["leg curl swiss ball"]
  })
];

export const CATALOG_MOLLETS = [
  scoringEntry('Mollets debout', 'reps', 1, 0.6, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets Smith sur step', 'reps', 2, 0.7, {
    muscleGroup: 'Mollets',
    aliases: ['smith calf raise', 'mollets debout smith']
  }),
  scoringEntry('Mollets assis', 'reps', 1, 0.6, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets à la presse', 'reps', 2, 0.7, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets unilatéraux', 'reps', 3, 0.9, { muscleGroup: 'Mollets' }),
  scoringEntry('Mollets debout unilatéral machine', 'reps', 3, 0.95, { muscleGroup: 'Mollets' }),
  scoringEntry('Élévations de mollets — pointes de pieds vers l’extérieur', 'reps', 1, 0.6, {
    muscleGroup: 'Mollets',
    key: "élévations pointes vers l'extérieur"
  }),
  scoringEntry('Élévations de mollets — pointes de pieds vers l’intérieur', 'reps', 1, 0.6, {
    muscleGroup: 'Mollets',
    key: "élévations pointes vers l'intérieur"
  }),
  scoringEntry('Descente excentrique mollet (Achille)', 'reps', 3, 0.85, {
    muscleGroup: 'Mollets',
    key: 'descente excentrique mollet'
  }),
  scoringEntry("Mollets donkey", 'reps', 2, 0.75, {
    muscleGroup: 'Mollets',
    aliases: ['donkey calf raise']
  }),
  scoringEntry("Mollets inversés Smith", 'reps', 2, 0.6, {
    muscleGroup: 'Mollets',
    aliases: ['smith reverse calf raise']
  }),
  scoringEntry("Mollets rotatifs machine", 'reps', 2, 0.7, {
    muscleGroup: 'Mollets',
    aliases: ['rotary calf']
  }),
  scoringEntry("Mollets debout balancé", 'reps', 2, 0.65, {
    muscleGroup: 'Mollets',
    aliases: ['rocking calf raise']
  })
];

export const CATALOG_CHEVILLE = [
  scoringEntry('Tibialis raises mur', 'reps', 2, 0.6, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Éversion cheville élastique', 'reps', 1, 0.4, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Inversion cheville élastique', 'reps', 1, 0.4, { muscleGroup: 'Cheville / pied' }),
  scoringEntry('Équilibre unipodal', 'seconds', 2, 0.55, { muscleGroup: 'Cheville / pied' }),
  scoringEntry("Tibialis élastique", 'reps', 1, 0.5, {
    muscleGroup: 'Cheville / pied',
    aliases: ['band reverse calf raise']
  })
];

export const CATALOG_FESSIERS = [
  scoringEntry('Abduction hanche debout élastique', 'reps', 1, 0.45, { muscleGroup: 'Fessiers' }),
  scoringEntry('Glute bridge', 'reps', 1, 0.7, {
    muscleGroup: 'Fessiers',
    aliases: ['pont fessier']
  }),
  scoringEntry('Glute bridge unilatéral', 'reps', 3, 0.9, { muscleGroup: 'Fessiers' }),
  scoringEntry('Hip thrust', 'reps', 2, 0.85, { muscleGroup: 'Fessiers' }),
  scoringEntry('Hip thrust Smith', 'reps', 3, 0.95, {
    muscleGroup: 'Fessiers',
    aliases: ['smith hip thrust', 'hip thrust smith']
  }),
  scoringEntry('Hip thrust pieds au mur', 'reps', 2, 0.75, {
    muscleGroup: 'Fessiers',
    aliases: ['wall hip thrust', 'hip thrust pieds contre le mur']
  }),
  scoringEntry('Hip thrust unilatéral', 'reps', 4, 1.05, { muscleGroup: 'Fessiers' }),
  scoringEntry('Kettlebell swings', 'reps', 3, 1.0, { muscleGroup: 'Fessiers' }),
  scoringEntry('Monster walk', 'reps', 2, 0.55, { muscleGroup: 'Fessiers' }),
  scoringEntry('Abduction de hanche machine assise', 'reps', 2, 0.7, {
    muscleGroup: 'Fessiers',
    aliases: ['lever seated hip abduction', 'abductor machine']
  }),
  scoringEntry('Abduction de hanche assise élastique', 'reps', 1, 0.5, {
    muscleGroup: 'Fessiers',
    aliases: ['seated band hip abduction']
  }),
  scoringEntry('Abduction de hanche pont latéral', 'reps', 3, 0.95, {
    muscleGroup: 'Fessiers',
    aliases: ['side plank leg lift', 'side bridge hip abduction']
  }),
  scoringEntry('Abduction de hanche allongée', 'reps', 1, 0.5, {
    muscleGroup: 'Fessiers',
    aliases: ['side lying hip abduction']
  }),
  scoringEntry('Abduction de hanche debout jambe tendue', 'reps', 2, 0.55, {
    muscleGroup: 'Fessiers',
    aliases: ['standing hip abduction', 'straight leg hip abduction']
  }),
  scoringEntry("Glute bridge barre", 'reps', 2, 0.8, {
    muscleGroup: "Fessiers",
    aliases: ["glute bridge barre"]
  }),
  scoringEntry("Glute bridge élastique", 'reps', 2, 0.65, {
    muscleGroup: "Fessiers",
    aliases: ["glute bridge élastique"]
  }),
  scoringEntry("Glute bridge barre pieds surélevés", 'reps', 3, 0.9, {
    muscleGroup: "Fessiers",
    aliases: ["glute bridge barre pieds surélevés"]
  }),
  scoringEntry("Hip thrust à genoux élastique", 'reps', 2, 0.7, {
    muscleGroup: "Fessiers",
    aliases: ["hip thrust genoux élastique"]
  }),
  scoringEntry("Extension de hanche à la poulie", 'reps', 2, 0.55, {
    muscleGroup: "Fessiers",
    aliases: ["extension de hanche poulie"]
  }),
  scoringEntry("Extension de hanche élastique penché", 'reps', 2, 0.55, {
    muscleGroup: "Fessiers",
    aliases: ["extension de hanche élastique penché"]
  }),
  scoringEntry("Kickback fessier machine", 'reps', 2, 0.7, {
    muscleGroup: "Fessiers",
    aliases: ["kickback fessier machine"]
  }),
  scoringEntry("Kickback fessier à la poulie", 'reps', 2, 0.7, {
    muscleGroup: "Fessiers",
    aliases: ["cable glute kickback", "kickback fessier poulie"]
  }),
  scoringEntry("Abduction de hanche debout à la poulie", 'reps', 2, 0.55, {
    muscleGroup: "Fessiers",
    aliases: ["cable hip abduction", "abduction hanche poulie"]
  }),
  scoringEntry("Pull-through élastique", 'reps', 2, 0.75, {
    muscleGroup: "Fessiers",
    aliases: ["pull-through élastique"]
  }),
  scoringEntry("Pull-through à la poulie", 'reps', 2, 0.8, {
    muscleGroup: "Fessiers",
    aliases: ["pull-through poulie"]
  }),
  scoringEntry("Reverse hyperextension", 'reps', 3, 0.85, {
    muscleGroup: "Fessiers",
    aliases: ["reverse hyperextension"]
  }),
  scoringEntry("Soulevé latéral un bras", 'reps', 3, 0.95, {
    muscleGroup: "Fessiers",
    aliases: ["soulevé latéral un bras"]
  })
];
