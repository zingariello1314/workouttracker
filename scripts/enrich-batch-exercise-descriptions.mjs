/**
 * Allonge et détaille les descriptions des exercices (et étirements) des batches GIF.
 * Attribue une difficulté 1–4 réaliste selon critères (équipement, unilatéral, skill…).
 * Usage: node scripts/enrich-batch-exercise-descriptions.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'package.json'));

const BATCHES = [
  {
    file: 'src/data/exerciseDatabasePectorauxGifBatch.js',
    exportName: 'EXERCISE_DATABASE_PECTORAUX_GIF_BATCH',
    kind: 'exercise',
  },
  {
    file: 'src/data/exerciseDatabaseEpaulesDosBrasGifBatch.js',
    exportName: 'EXERCISE_DATABASE_EPAULES_DOS_BRAS_GIF_BATCH',
    kind: 'exercise',
  },
  {
    file: 'src/data/exerciseDatabaseAbsJambesFessiersCardioGifBatch.js',
    exportName: 'EXERCISE_DATABASE_ABS_JAMBES_FESSIERS_CARDIO_GIF_BATCH',
    kind: 'exercise',
  },
  {
    file: 'src/data/stretchDatabasePectorauxGifBatch.js',
    exportName: 'STRETCH_DATABASE_PECTORAUX_GIF_BATCH',
    kind: 'stretch',
  },
  {
    file: 'src/data/stretchDatabaseEpaulesDosBrasGifBatch.js',
    exportName: 'STRETCH_DATABASE_EPAULES_DOS_BRAS_GIF_BATCH',
    kind: 'stretch',
  },
  {
    file: 'src/data/stretchDatabaseAbsJambesFessiersCardioGifBatch.js',
    exportName: 'STRETCH_DATABASE_ABS_JAMBES_FESSIERS_CARDIO_GIF_BATCH',
    kind: 'stretch',
  },
];

function blobOf(entry, key = '') {
  return `${key} ${entry.name || ''} ${(entry.variations || []).join(' ')} ${entry.equipment || ''}`.toLowerCase();
}

function inferFamily(blob, category) {
  if (/burpee|jump|sprint|run|bike|row.?erg|ski.?erg|cardio|jack|hop|skip/.test(blob) || category === 'Activités Complémentaires')
    return 'cardio';
  if (/crunch|sit.?up|plank|dead.?bug|hollow|leg.?raise|russian|twist|ab.?wheel|vacuum|dragon/.test(blob) || category === 'Abdominaux')
    return 'core';
  if (/squat|lunge|fente|step|leg.?press|leg.?extension|hack/.test(blob)) return 'squat';
  if (/deadlift|rdl|good.?morning|hip.?thrust|bridge|hinge|soulevé/.test(blob)) return 'hinge';
  if (/curl|preacher|hammer|concentration/.test(blob)) return 'curl';
  if (/extension|kickback|skull|pushdown|poulie.*triceps|overhead.*triceps/.test(blob)) return 'extension';
  if (/fly|écarté|crossover|pec.?deck|oiseau|rear.?delt/.test(blob)) return 'fly';
  if (/raise|élévation|lateral|front raise|shrug/.test(blob)) return 'raise';
  if (/row|rowing|pulldown|pull.?down|tirage|seal.?row/.test(blob)) return 'row';
  if (/pull.?up|chin.?up|traction|muscle.?up|front.?lever|back.?lever/.test(blob)) return 'pullup';
  if (/dip|push.?up|pompe|bench|press|développé|floor.?press/.test(blob)) return 'press';
  if (/calf|mollet|tibialis|wrist|poignet|forearm|grip|pinch/.test(blob)) return 'isolation';
  return 'general';
}

function realisticDifficulty(entry, key) {
  const blob = blobOf(entry, key);
  const eq = String(entry.equipment || '').toLowerCase();

  // Skills / calisthenics avancés
  if (/muscle.?up|front.?lever|back.?lever|planche|human.?flag|one.?arm.?pull|one.?arm.?push|pistol|shrimp|handstand.?push|hspu|iron.?cross/.test(blob)) {
    return 4;
  }
  if (/unilatéral|one.?arm|single.?arm|pistol|bulgarian|archer|typewriter|commando/.test(blob)) {
    if (/poids du corps|bodyweight/.test(eq) || /pull.?up|push.?up|dip|squat/.test(blob)) return 3;
  }
  if (/smith|machine|leg.?press|pec.?deck|assisted|assisté|ball|élastique|band/.test(blob + ' ' + eq)) {
    return 1;
  }
  if (/cardio|burpee|jump|sprint|run/.test(blob) && entry.category === 'Activités Complémentaires') {
    return /burpee|sprint|box.?jump/.test(blob) ? 2 : 1;
  }
  if (/isolation|curl|raise|fly|extension|calf|wrist|shrug/.test(inferFamily(blob, entry.category))) {
    return 2;
  }
  if (/barbell|barre|haltères|dumbbell|cable|poulie/.test(eq) || /press|row|squat|deadlift|pull.?up|dip/.test(blob)) {
    return /heavy|lest|weighted|pause|deficit|tempo/.test(blob) ? 3 : 2;
  }
  return 2;
}

function setupCue(family, equipment) {
  const eq = equipment || 'le matériel indiqué';
  const map = {
    press: `Installe-toi de façon stable avec ${eq}. Omoplates calées, poignets neutres, pieds ancrés.`,
    pullup: `Suspendu à la barre (ou prise équivalente), épaules loin des oreilles, gainage du tronc avant la première traction.`,
    row: `Prise solide sur ${eq}, buste stable, regard neutre. Initie le tirage par les omoplates, pas par les bras seuls.`,
    curl: `Coudes près du corps, épaules basses. Charge adaptée : le buste ne doit pas donner d’élan.`,
    extension: `Coudes fixes dans l’espace, avant-bras seuls en mouvement. Épaules basses, tronc gainé.`,
    fly: `Légère flexion des coudes maintenue constante. Poitrine ouverte, trajectoire en arc contrôlé.`,
    raise: `Charges légères prioritaires. Épaules basses, pas d’élan du buste ni des trapèzes pour “voler” la série.`,
    squat: `Pieds ancrés, genoux dans l’axe des pointes. Buste gainé, descente contrôlée jusqu’à l’amplitude propre.`,
    hinge: `Charnière de hanches, dos neutre, tibias relativement stables. La charge reste proche du corps.`,
    core: `Bassin neutre, côtes rentrées. Pas de traction cervicale : le regard suit le mouvement du tronc.`,
    cardio: `Rythme régulier, respiration ouverte. Qualité du pattern avant la vitesse.`,
    isolation: `Amplitude complète sans douleur, tempo lent. Isole la zone cible sans compensation.`,
    general: `Position de départ stable avec ${eq}. Contrôle chaque phase du mouvement.`,
  };
  return map[family] || map.general;
}

function executionCue(family) {
  const map = {
    press: `Pousse jusqu’à l’extension presque complète sans verrouiller d’un coup, puis redescends en contrôlant 2–3 secondes.`,
    pullup: `Tire jusqu’à ce que le menton dépasse clairement la barre (ou l’équivalent), sans balancier. Descente complète et contrôlée.`,
    row: `Amène les coudes vers l’arrière / le bas selon la variante, serre une seconde en haut, reviens sans lâcher les omoplates trop tôt.`,
    curl: `Fléchis jusqu’à la contraction maximale sans monter les coudes. Étire presque complètement en bas sans hyperextension brutale.`,
    extension: `Tends les coudes sans claquer l’articulation. Garde les bras hauts (ou la position de départ) stables pendant toute la série.`,
    fly: `Ouvre jusqu’à un étirement confortable de la poitrine / des deltoïdes, puis referme en contractant la cible — pas un développé déguisé.`,
    raise: `Monte jusqu’à l’horizontale (ou un peu au-dessus si la technique reste propre), marque une courte pause, redescends sans balancier.`,
    squat: `Descends en gardant les talons au sol, remonte en poussant le sol, hanches et genoux synchronisés.`,
    hinge: `Pousse les hanches vers l’arrière, ressent l’arrière de cuisse / fessiers, reviens en extension de hanches sans cambrer excessivement.`,
    core: `Contracte d’abord le transverse, exécute le geste sans arching lombaire ni élan des jambes sauf si la variante le demande explicitement.`,
    cardio: `Enchaîne les cycles en restant précis : chaque répétition ressemble à la précédente.`,
    isolation: `Focalise la sensation sur le muscle cible ; si d’autres zones prennent le relais, baisse la charge.`,
    general: `Exécute le pattern du GIF fidèlement : même amplitude, même tempo, sans à-coups.`,
  };
  return map[family] || map.general;
}

function notThisCue(name, category, family) {
  const bits = [];
  if (family === 'fly') bits.push(`Ce n’est pas un développé : si les coudes s’étendent trop, tu perds l’écarté.`);
  if (family === 'press') bits.push(`Ce n’est pas un écarté : la trajectoire reste un press, coudes sous la charge.`);
  if (family === 'curl') bits.push(`Ce n’est pas un rowing ni un développé : seuls les coudes fléchissent.`);
  if (family === 'row') bits.push(`Ce n’est pas un curl : le dos tire, les bras accompagnent.`);
  if (family === 'raise') bits.push(`Ce n’est pas un shrug : les trapèzes ne doivent pas avaler le mouvement.`);
  if (family === 'core') bits.push(`Ce n’est pas un élan de hanches pour “compter” des reps vides.`);
  if (category === 'Pectoraux' && /dip/.test(name.toLowerCase())) {
    bits.push(`Version pectoraux : buste légèrement penché ; la version triceps reste plus verticale.`);
  }
  if (!bits.length) {
    bits.push(`Reste sur cette variante précise — ne la confonds pas avec un mouvement voisin de la même famille ${category.toLowerCase()}.`);
  }
  return bits.join(' ');
}

function buildExerciseDescription(entry, key) {
  const name = entry.name;
  const category = entry.category || 'Musculation';
  const equipment = entry.equipment || 'Divers';
  const primary = (entry.primaryMuscles || []).join(', ') || category;
  const secondary = (entry.secondaryMuscles || []).filter(Boolean).join(', ');
  const blob = blobOf(entry, key);
  const family = inferFamily(blob, category);
  const unilateral = /unilatéral|one.?arm|single.?arm|unipodal|bulgarian|archer/.test(blob);

  const parts = [];
  parts.push(
    `${name}. Fiche banque « ${category} » — équipement : ${equipment}. ` +
      `Cible principale : ${primary}.` +
      (secondary ? ` Muscles secondaires : ${secondary}.` : '')
  );
  parts.push(setupCue(family, equipment));
  if (unilateral) {
    parts.push(
      `Travail unilatéral : termine un côté (ou alterne proprement) en gardant le bassin et les épaules de niveau — pas de rotation parasite pour aider.`
    );
  }
  parts.push(executionCue(family));
  parts.push(notThisCue(name, category, family));
  parts.push(
    `Respiration : expire sur la phase d’effort (poussée, tirage ou contraction), inspire sur le retour contrôlé. ` +
      `Repères de séance types : 3 à 4 séries de 8 à 15 répétitions (ou 6 à 10 si la charge est lourde / le geste exigeant), repos 60 à 90 s. ` +
      `Le GIF montre la trajectoire de référence : reproduis-la avant d’augmenter la charge.`
  );
  return parts.join(' ');
}

function buildStretchDescription(entry) {
  const name = entry.name;
  const zone = entry.bodyZone || 'full';
  const primary = (entry.primaryMuscles || []).join(', ') || zone;
  const duration = entry.defaultDuration || 45;
  return (
    `${name}. Étirement / mobilité (zone ${zone}), structures principalement visées : ${primary}. ` +
    `Installe la position indiquée sans forcer dès la première seconde. Avance jusqu’à une tension claire mais confortable — jamais de douleur vive ni de rebond. ` +
    `Respire lentement par le nez si possible, détends les épaules et la mâchoire. ` +
    `Maintiens environ ${duration} s (2 à 4 cycles), puis relâche progressivement. ` +
    `Ce n’est pas un exercice de force : ne le programme pas comme une série lestée. ` +
    `Contre-indications fréquentes : douleur articulaire aiguë, instabilité non contrôlée, inflammation en phase aiguë — adapte ou reporte.`
  );
}

function enrichExercise(entry, key) {
  return {
    ...entry,
    name: entry.name,
    category: entry.category,
    primaryMuscles: entry.primaryMuscles?.length ? entry.primaryMuscles : [entry.category],
    secondaryMuscles: entry.secondaryMuscles || [],
    equipment: entry.equipment || 'Divers',
    difficulty: realisticDifficulty(entry, key),
    isNew: true,
    description: buildExerciseDescription(entry, key),
    variations: Array.isArray(entry.variations) ? [...new Set(entry.variations.filter(Boolean))] : [],
  };
}

function enrichStretch(entry) {
  return {
    ...entry,
    name: entry.name,
    category: entry.category || 'Étirement',
    bodyZone: entry.bodyZone || 'full',
    primaryMuscles: entry.primaryMuscles?.length ? entry.primaryMuscles : ['Mobilité'],
    secondaryMuscles: entry.secondaryMuscles || [],
    equipment: entry.equipment || 'Aucun',
    defaultDuration: entry.defaultDuration || 45,
    position: entry.position || 'Selon le GIF',
    difficulty: typeof entry.difficulty === 'number' ? entry.difficulty : 1,
    description: buildStretchDescription(entry),
    instructions:
      entry.instructions && entry.instructions.length > 80
        ? entry.instructions
        : 'Place-toi sans précipitation. Cherche une tension progressive, maintiens en respirant calmement, puis sors de la position sans à-coup. Si une douleur apparaît, réduis l’amplitude ou arrête.',
    contraindications: entry.contraindications?.length
      ? entry.contraindications
      : ['Douleur articulaire aiguë', 'Instabilité non contrôlée', 'Phase inflammatoire sévère'],
    variations: Array.isArray(entry.variations) ? [...new Set(entry.variations.filter(Boolean))] : [],
  };
}

function writeBatch(fileRel, exportName, obj) {
  const abs = path.join(root, fileRel);
  const body = `/** Généré/enrichi par scripts/enrich-batch-exercise-descriptions.mjs — descriptions détaillées + difficulté réaliste. */\nexport const ${exportName} = ${JSON.stringify(obj, null, 2)};\n`;
  fs.writeFileSync(abs, body);
}

function main() {
  const stats = { exercises: 0, stretches: 0, descAvg: 0, diffHist: { 1: 0, 2: 0, 3: 0, 4: 0 } };
  let descSum = 0;

  for (const batch of BATCHES) {
    const abs = path.join(root, batch.file);
    delete require.cache[abs];
    const mod = require(abs);
    const raw = mod[batch.exportName] || {};
    const next = {};
    for (const [key, entry] of Object.entries(raw)) {
      if (batch.kind === 'exercise') {
        next[key] = enrichExercise(entry, key);
        stats.exercises += 1;
        descSum += next[key].description.length;
        stats.diffHist[next[key].difficulty] = (stats.diffHist[next[key].difficulty] || 0) + 1;
      } else {
        next[key] = enrichStretch(entry);
        stats.stretches += 1;
        descSum += next[key].description.length;
      }
    }
    writeBatch(batch.file, batch.exportName, next);
  }

  stats.descAvg = Math.round(descSum / Math.max(1, stats.exercises + stats.stretches));
  console.log(JSON.stringify(stats, null, 2));
}

main();
