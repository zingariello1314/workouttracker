import { scoringEntry } from './catalogHelpers';

export const CATALOG_DORSAUX = [
  scoringEntry('Arch hold', 'seconds', 3, 0.85, {
    muscleGroup: 'Dorsaux',
    aliases: ['arch body hold']
  }),
  scoringEntry('Back lever tuck', 'seconds', 5, 1.15, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Bird dog', 'reps', 1, 0.5, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Front lever raises', 'reps', 7, 1.8, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Front lever tuck isométrique', 'seconds', 5, 1.2, {
    muscleGroup: 'Dorsaux',
    aliases: ['front lever tuck hold']
  }),
  scoringEntry('Front lever tuck rows', 'reps', 6, 1.5, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Ice cream makers', 'reps', 6, 1.55, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Landmine row', 'reps', 3, 0.95, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Machine row poitrine appuyée', 'reps', 2, 0.85, {
    muscleGroup: 'Dorsaux',
    aliases: ['chest supported row']
  }),
  scoringEntry('Muscle up strict', 'reps', 7, 2.0, {
    muscleGroup: 'Dorsaux',
    aliases: ['muscle-up strict', 'muscle up']
  }),
  scoringEntry("Muscle-up assisté à l'élastique", 'reps', 5, 1.4, {
    muscleGroup: 'Dorsaux',
    aliases: ['assisted muscle up', 'muscle up assisté']
  }),
  scoringEntry('Pull-over haltère', 'reps', 2, 0.75, {
    muscleGroup: 'Dorsaux',
    aliases: ['dumbbell pullover']
  }),
  scoringEntry('Pull-over poulie haute', 'reps', 2, 0.75, {
    muscleGroup: 'Dorsaux',
    aliases: ['cable pullover']
  }),
  scoringEntry('Rowing australien pieds surélevés', 'reps', 3, 0.9, {
    muscleGroup: 'Dorsaux',
    aliases: ['feet elevated inverted row']
  }),
  scoringEntry('Rowing barre', 'reps', 3, 1.0, {
    muscleGroup: 'Dorsaux',
    aliases: ['barbell row', 'rowing', 'tirage barre']
  }),
  scoringEntry('Rowing haltère', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: ['one arm row', 'rowing 1 bras']
  }),
  scoringEntry('Seal row au banc', 'reps', 3, 0.95, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Soulevé de terre', 'reps', 5, 1.3, {
    muscleGroup: 'Dorsaux',
    aliases: ['deadlift', 'sdt']
  }),
  scoringEntry('Soulevé de terre déficit', 'reps', 6, 1.4, {
    muscleGroup: 'Dorsaux',
    aliases: ['deficit deadlift']
  }),
  scoringEntry('Soulevé de terre jambes semi-tendues', 'reps', 4, 1.15, {
    muscleGroup: 'Dorsaux',
    aliases: ['romanian deadlift barre', 'sdt jambes semi-tendues']
  }),
  scoringEntry('Suspension à un bras', 'seconds', 7, 1.5, {
    muscleGroup: 'Dorsaux',
    aliases: ['one arm dead hang', 'dead hang un bras']
  }),
  scoringEntry('T-bar row', 'reps', 3, 1.0, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Tirage horizontal machine convergente', 'reps', 2, 0.9, {
    muscleGroup: 'Dorsaux'
  }),
  scoringEntry('Tirage horizontal poulie', 'reps', 2, 0.85, {
    muscleGroup: 'Dorsaux',
    aliases: ['seated cable row']
  }),
  scoringEntry('Tirage poulie haute prise neutre serrée', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux'
  }),
  scoringEntry('Tirage unilatéral poulie basse', 'reps', 2, 0.85, { muscleGroup: 'Dorsaux' }),
  scoringEntry('Tirage vertical', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: ['lat pulldown', 'tirage poulie haute']
  }),
  scoringEntry('Traction un bras négative', 'reps', 8, 2.3, {
    muscleGroup: 'Dorsaux',
    aliases: ['one arm negative pull up']
  }),
  scoringEntry('Tractions archer', 'reps', 7, 1.9, {
    muscleGroup: 'Dorsaux',
    aliases: ['archer pull up']
  }),
  scoringEntry('Tractions australiennes — prise pronation', 'reps', 2, 0.75, {
    key: 'tractions australiennes',
    muscleGroup: 'Dorsaux',
    aliases: ['tractions australiennes', 'inverted row', 'rowing australien', 'australian pull-up']
  }),
  scoringEntry('Tractions australiennes — prise serrée pronation', 'reps', 2, 0.78, {
    muscleGroup: 'Dorsaux',
    aliases: ['australian pull-up close grip', 'inverted row close grip']
  }),
  scoringEntry('Tractions australiennes — prise large pronation', 'reps', 3, 0.88, {
    muscleGroup: 'Dorsaux',
    aliases: ['australian pull-up wide grip', 'inverted row wide']
  }),
  scoringEntry('Tractions australiennes — prise large supination', 'reps', 2, 0.8, {
    muscleGroup: 'Dorsaux',
    aliases: ['australian chin-up wide', 'inverted row wide supinated']
  }),
  scoringEntry('Tractions australiennes — prise serrée supination', 'reps', 2, 0.72, {
    muscleGroup: 'Dorsaux',
    aliases: ['australian chin-up close', 'inverted row close supinated']
  }),
  scoringEntry('Tractions australiennes — prise neutre', 'reps', 2, 0.76, {
    muscleGroup: 'Dorsaux',
    aliases: ['australian pull-up neutral', 'inverted row hammer grip']
  }),
  scoringEntry('Tractions commando', 'reps', 4, 1.3, {
    muscleGroup: 'Dorsaux',
    aliases: ['commando pull up']
  }),
  scoringEntry('Tractions en L', 'reps', 6, 1.6, {
    muscleGroup: 'Dorsaux',
    aliases: ['l pull up', 'tractions L']
  }),
  scoringEntry('Tractions explosives poitrine barre', 'reps', 6, 1.7, {
    muscleGroup: 'Dorsaux',
    aliases: ['explosive pull up chest to bar']
  }),
  scoringEntry('Tractions inversées aux anneaux', 'reps', 3, 1.0, {
    muscleGroup: 'Dorsaux',
    aliases: ['ring row']
  }),
  scoringEntry('Tractions pronation', 'reps', 4, 1.35, {
    muscleGroup: 'Dorsaux',
    aliases: ['pull up pronation', 'tractions pronation']
  }),
  scoringEntry('Tractions scapulaires', 'reps', 3, 0.75, {
    muscleGroup: 'Dorsaux',
    aliases: ['scapular pull up']
  }),
  scoringEntry('Tractions typewriter', 'reps', 7, 1.85, {
    muscleGroup: 'Dorsaux',
    aliases: ['typewriter pull up']
  }),
  scoringEntry('Rowing haltère debout', 'reps', 3, 0.9, {
    muscleGroup: 'Dorsaux',
    aliases: ['dumbbell row standing']
  }),
  scoringEntry("Soulevé de terre trap bar", 'reps', 4, 1.1, {
    muscleGroup: "Dorsaux",
    aliases: ["soulevé de terre trap bar"]
  }),
  scoringEntry("Soulevé de terre haltères", 'reps', 3, 0.95, {
    muscleGroup: "Dorsaux",
    aliases: ["soulevé de terre haltères"]
  }),
  scoringEntry("Soulevé de terre Smith", 'reps', 3, 1, {
    muscleGroup: "Dorsaux",
    aliases: ["soulevé de terre smith"]
  }),
  scoringEntry("Soulevé de terre à la poulie", 'reps', 2, 0.8, {
    muscleGroup: "Dorsaux",
    aliases: ["soulevé de terre poulie"]
  }),
  scoringEntry("Soulevé de terre machine", 'reps', 3, 0.9, {
    muscleGroup: "Dorsaux",
    aliases: ["soulevé de terre machine"]
  }),
  scoringEntry("Rack pull", 'reps', 3, 1.05, {
    muscleGroup: "Dorsaux",
    aliases: ["rack pull"]
  }),
  scoringEntry("Pull-over barre", 'reps', 2, 0.8, {
    muscleGroup: "Dorsaux",
    aliases: ["pull-over barre"]
  }),
  scoringEntry("Pull-over machine", 'reps', 2, 0.75, {
    muscleGroup: "Dorsaux",
    aliases: ["pull-over machine"]
  }),
  scoringEntry("Tirage vertical supination", 'reps', 2, 0.85, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage vertical supination"]
  }),
  scoringEntry("Tirage vertical élastique", 'reps', 2, 0.6, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage vertical élastique"]
  }),
  scoringEntry("Tirage unilatéral poulie haute", 'reps', 2, 0.8, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage unilatéral poulie haute"]
  }),
  scoringEntry("Tirage unilatéral machine", 'reps', 2, 0.8, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage unilatéral machine"]
  }),
  scoringEntry("Tirage vertical machine", 'reps', 2, 0.85, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage vertical machine"]
  }),
  scoringEntry("Tirage vertical nuque", 'reps', 3, 0.9, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage vertical nuque"]
  }),
  scoringEntry("Tractions nuque", 'reps', 3, 1.05, {
    muscleGroup: "Dorsaux",
    aliases: ["tractions nuque"]
  }),
  scoringEntry("Tractions prise neutre", 'reps', 3, 1, {
    muscleGroup: "Dorsaux",
    aliases: ["tractions prise neutre"]
  }),
  scoringEntry("Tractions prise mixte", 'reps', 3, 1.05, {
    muscleGroup: "Dorsaux",
    aliases: ["tractions prise mixte"]
  }),
  scoringEntry("Tractions sternum", 'reps', 4, 1.25, {
    muscleGroup: "Dorsaux",
    aliases: ["tractions sternum"]
  }),
  scoringEntry("Tractions assistées", 'reps', 2, 0.7, {
    muscleGroup: "Dorsaux",
    aliases: ["tractions assistées"]
  }),
  scoringEntry("Muscle-up aux anneaux", 'reps', 4, 1.35, {
    muscleGroup: "Dorsaux",
    aliases: ["muscle-up aux anneaux"]
  }),
  scoringEntry("Rowing poulie haute", 'reps', 3, 0.9, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing poulie haute"]
  }),
  scoringEntry("Tirage rotatif poulie", 'reps', 3, 0.85, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage rotatif poulie"]
  }),
  scoringEntry("Rowing kayak poulie", 'reps', 3, 0.9, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing kayak poulie"]
  }),
  scoringEntry("Hyperextension", 'reps', 2, 0.75, {
    muscleGroup: "Dorsaux",
    aliases: ["hyperextension"]
  }),
  scoringEntry("Extension lombaire assise", 'reps', 2, 0.7, {
    muscleGroup: "Dorsaux",
    aliases: ["extension lombaire assise"]
  }),
  scoringEntry("Rowing Pendlay", 'reps', 4, 1.15, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing pendlay"]
  }),
  scoringEntry("Rowing Smith", 'reps', 3, 1, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing smith"]
  }),
  scoringEntry("Rowing kettlebell", 'reps', 3, 0.95, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing kettlebell"]
  }),
  scoringEntry("Renegade row", 'reps', 3, 1.05, {
    muscleGroup: "Dorsaux",
    aliases: ["renegade row"]
  }),
  scoringEntry("Tirage horizontal élastique", 'reps', 2, 0.65, {
    muscleGroup: "Dorsaux",
    aliases: ["tirage horizontal élastique"]
  }),
  scoringEntry("Rowing suspendu", 'reps', 3, 0.9, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing suspendu"]
  }),
  scoringEntry("Montée de corde", 'reps', 6, 1.5, {
    muscleGroup: "Dorsaux",
    aliases: ["montée de corde"]
  }),
  scoringEntry("Rowing haut machine", 'reps', 2, 0.85, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing haut machine"]
  }),
  scoringEntry("Rowing serviette", 'reps', 2, 0.7, {
    muscleGroup: "Dorsaux",
    aliases: ["rowing serviette"]
  })
];
