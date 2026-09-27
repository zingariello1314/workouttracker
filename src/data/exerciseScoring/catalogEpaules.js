import { scoringEntry } from './catalogHelpers';

export const CATALOG_EPAULES = [
  scoringEntry('Cuban press', 'reps', 3, 0.75, { muscleGroup: 'Épaules' }),
  scoringEntry('Déplacements en équilibre sur les mains', 'seconds', 7, 1.5, {
    muscleGroup: 'Épaules',
    aliases: ['handstand walk']
  }),
  scoringEntry('Développé Arnold', 'reps', 3, 0.95, { muscleGroup: 'Épaules' }),
  scoringEntry('Développé militaire', 'reps', 4, 1.05, {
    muscleGroup: 'Épaules',
    aliases: ['overhead press', 'ohp']
  }),
  scoringEntry('Développé militaire haltères assis', 'reps', 3, 0.95, { muscleGroup: 'Épaules' }),
  scoringEntry('Élévation latérale unilatérale poulie cheville', 'reps', 2, 0.7, {
    muscleGroup: 'Épaules'
  }),
  scoringEntry('Élévations frontales', 'reps', 2, 0.65, { muscleGroup: 'Épaules' }),
  scoringEntry('Élévations latérales', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: ['lateral raise']
  }),
  scoringEntry('Élévations latérales poulie', 'reps', 2, 0.7, { muscleGroup: 'Épaules' }),
  scoringEntry('Face pull', 'reps', 2, 0.7, { muscleGroup: 'Épaules' }),
  scoringEntry("Farmer's walk", 'seconds', 3, 0.9, {
    muscleGroup: 'Épaules',
    aliases: ['farmers walk', 'marche du fermier']
  }),
  scoringEntry('Frog stand', 'seconds', 4, 0.95, { muscleGroup: 'Épaules' }),
  scoringEntry('Handstand push-ups assistées mur', 'reps', 5, 1.45, {
    muscleGroup: 'Épaules',
    aliases: ['hspu assisté mur', 'pompes poirier mur']
  }),
  scoringEntry('Handstand push-ups libres', 'reps', 8, 2.1, {
    muscleGroup: 'Épaules',
    aliases: ['hspu libre', 'handstand push up']
  }),
  scoringEntry('Inclinaison pseudo-planche statique', 'seconds', 5, 1.2, {
    muscleGroup: 'Épaules'
  }),
  scoringEntry('Landmine press', 'reps', 3, 0.9, { muscleGroup: 'Épaules' }),
  scoringEntry('Oiseau', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: ['reverse fly']
  }),
  scoringEntry('Oiseau poulie', 'reps', 2, 0.7, { muscleGroup: 'Épaules' }),
  scoringEntry('Oiseaux penché', 'reps', 2, 0.65, { muscleGroup: 'Épaules' }),
  scoringEntry('Pike push-ups', 'reps', 4, 1.15, {
    muscleGroup: 'Épaules',
    aliases: ['pike push up']
  }),
  scoringEntry('Planche sur coudes (elbow lever)', 'seconds', 5, 1.15, {
    muscleGroup: 'Épaules',
    key: 'planche sur coudes',
    aliases: ['elbow lever', 'planche sur coudes']
  }),
  scoringEntry('Pompes scapulaires', 'reps', 2, 0.65, { muscleGroup: 'Épaules' }),
  scoringEntry('Pose du corbeau (bakasana)', 'seconds', 3, 0.75, {
    muscleGroup: 'Épaules',
    key: 'pose du corbeau',
    aliases: ['bakasana', 'crow pose', 'pose du corbeau']
  }),
  scoringEntry('Prone Y raise', 'reps', 2, 0.6, { muscleGroup: 'Épaules' }),
  scoringEntry('Rotation externe élastique', 'reps', 1, 0.45, { muscleGroup: 'Épaules' }),
  scoringEntry('Shrugs', 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['haussements d épaules']
  }),
  scoringEntry('Skin the cat', 'reps', 6, 1.4, { muscleGroup: 'Épaules' }),
  scoringEntry('Straddle planche hold', 'seconds', 8, 1.8, {
    muscleGroup: 'Épaules',
    aliases: ['straddle planche']
  }),
  scoringEntry('Tenue en équilibre sur les mains au mur', 'seconds', 5, 1.1, {
    muscleGroup: 'Épaules',
    aliases: ['handstand hold mur', 'equilibre sur les mains mur']
  }),
  scoringEntry('Tirage menton barre', 'reps', 3, 0.9, {
    muscleGroup: 'Épaules',
    aliases: ['upright row']
  }),
  scoringEntry('Tuck planche hold', 'seconds', 6, 1.35, {
    muscleGroup: 'Épaules',
    aliases: ['tuck planche']
  }),
  scoringEntry('Y raise debout', 'reps', 2, 0.6, { muscleGroup: 'Épaules' }),
  scoringEntry('Développé militaire Smith', 'reps', 3, 0.95, {
    muscleGroup: 'Épaules',
    aliases: ['smith shoulder press']
  }),
  scoringEntry('Développé militaire haltères', 'reps', 3, 0.95, {
    muscleGroup: 'Épaules',
    aliases: ['dumbbell military press']
  }),
  scoringEntry('Oiseau machine', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: ['rear delt fly machine']
  }),
  scoringEntry("Planche complète", 'seconds', 8, 2.1, {
    muscleGroup: 'Épaules',
    aliases: ['full planche']
  }),
  scoringEntry("Maltese", 'seconds', 8, 2.2, {
    muscleGroup: 'Épaules',
    aliases: ['full maltese']
  }),
  scoringEntry("Maltese straddle", 'seconds', 8, 2, {
    muscleGroup: 'Épaules',
    aliases: ['straddle maltese']
  }),
  scoringEntry("Bent press kettlebell", 'reps', 4, 1.05, {
    muscleGroup: 'Épaules',
    aliases: ['kettlebell bent press']
  }),
  scoringEntry("Développé militaire élastique", 'reps', 2, 0.6, {
    muscleGroup: 'Épaules',
    aliases: ['band shoulder press']
  }),
  scoringEntry("Développé militaire kettlebell", 'reps', 2, 0.8, {
    muscleGroup: 'Épaules',
    aliases: ['kettlebell military press']
  }),
  scoringEntry("Développé épaules machine", 'reps', 2, 0.75, {
    muscleGroup: 'Épaules',
    aliases: ['machine shoulder press']
  }),
  scoringEntry("Développé épaules à la poulie", 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['cable shoulder press']
  }),
  scoringEntry("Développé nuque", 'reps', 3, 0.9, {
    muscleGroup: 'Épaules',
    aliases: ['behind the neck press']
  }),
  scoringEntry("Bradford press", 'reps', 3, 0.85, {
    muscleGroup: 'Épaules',
    aliases: ['bradford press']
  }),
  scoringEntry("Push press haltères", 'reps', 3, 0.95, {
    muscleGroup: 'Épaules',
    aliases: ['dumbbell push press']
  }),
  scoringEntry("Push press kettlebell", 'reps', 3, 0.95, {
    muscleGroup: 'Épaules',
    aliases: ['kettlebell push press']
  }),
  scoringEntry("Thruster barre", 'reps', 3, 1, {
    muscleGroup: 'Épaules',
    aliases: ['barbell thruster']
  }),
  scoringEntry("Thruster kettlebell", 'reps', 3, 1, {
    muscleGroup: 'Épaules',
    aliases: ['kettlebell thruster']
  }),
  scoringEntry("Tirage menton haltères", 'reps', 2, 0.75, {
    muscleGroup: 'Épaules',
    aliases: ['dumbbell upright row']
  }),
  scoringEntry("Tirage menton à la poulie", 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['cable upright row']
  }),
  scoringEntry("Tirage menton Smith", 'reps', 2, 0.75, {
    muscleGroup: 'Épaules',
    aliases: ['smith upright row']
  }),
  scoringEntry("Oiseau Smith", 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['smith rear delt row']
  }),
  scoringEntry("Oiseau élastique", 'reps', 1, 0.55, {
    muscleGroup: 'Épaules',
    aliases: ['band reverse fly']
  }),
  scoringEntry("Élévation latérale machine", 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: ['machine lateral raise']
  }),
  scoringEntry("Élévation latérale landmine", 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['landmine lateral raise']
  }),
  scoringEntry("Élévations frontales barre", 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: ['barbell front raise']
  }),
  scoringEntry("Élévations frontales poulie", 'reps', 2, 0.6, {
    muscleGroup: 'Épaules',
    aliases: ['cable front raise']
  }),
  scoringEntry("Élévations frontales élastique", 'reps', 1, 0.5, {
    muscleGroup: 'Épaules',
    aliases: ['band front raise']
  }),
  scoringEntry("Élévation frontale au disque", 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: ['plate front raise', 'élévation disque']
  }),
  scoringEntry("Élévation au disque jusqu'au-dessus de la tête", 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['plate overhead raise', 'développé disque']
  }),
  scoringEntry("Rotation externe à la poulie", 'reps', 1, 0.45, {
    muscleGroup: 'Épaules',
    aliases: ['cable external rotation']
  }),
  scoringEntry("Rotation externe haltères", 'reps', 1, 0.45, {
    muscleGroup: 'Épaules',
    aliases: ['dumbbell external rotation']
  }),
  scoringEntry("Rotation interne à la poulie", 'reps', 1, 0.4, {
    muscleGroup: 'Épaules',
    aliases: ['cable internal rotation']
  }),
  scoringEntry("Développé latéral haltère", 'reps', 2, 0.75, {
    muscleGroup: 'Épaules',
    aliases: ['dumbbell side press']
  }),
  scoringEntry("Around the world haltères", 'reps', 2, 0.6, {
    muscleGroup: 'Épaules',
    aliases: ['around the world']
  }),
  scoringEntry("Porté haltère bras tendu", 'seconds', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: ['overhead carry']
  }),
  scoringEntry("Cordes ondulatoires", 'seconds', 3, 0.85, {
    muscleGroup: 'Épaules',
    aliases: ['battling ropes']
  }),
  scoringEntry("Shrugs élastique", 'reps', 1, 0.5, {
    muscleGroup: "Épaules",
    aliases: ["shrugs élastique"]
  }),
  scoringEntry("Shrugs à la poulie", 'reps', 2, 0.65, {
    muscleGroup: "Épaules",
    aliases: ["shrugs poulie"]
  }),
  scoringEntry("Shrugs machine", 'reps', 2, 0.7, {
    muscleGroup: "Épaules",
    aliases: ["shrugs machine"]
  }),
  scoringEntry("Shrugs Smith", 'reps', 2, 0.75, {
    muscleGroup: "Épaules",
    aliases: ["shrugs smith"]
  }),
  scoringEntry("Dépression scapulaire au banc", 'reps', 1, 0.45, {
    muscleGroup: "Épaules",
    aliases: ["dépression scapulaire au banc"]
  }),
  scoringEntry("Presse stalder", 'reps', 7, 1.9, {
    muscleGroup: "Épaules",
    aliases: ["stalder press"]
  })
];
