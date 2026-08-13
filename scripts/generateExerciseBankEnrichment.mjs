/**
 * Génère les fichiers d'enrichissement banque exercices.
 * Données : ./exerciseBankEnrichmentData.mjs (importé ci-dessous).
 * node scripts/generateExerciseBankEnrichment.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exerciseDatabase } from '../src/data/exerciseDatabase.js';
import { EXERCISE_DATA } from './exerciseBankEnrichmentData.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CATALOG_OUT = path.join(ROOT, 'src/data/exerciseScoring/catalogEnrichment.js');
const DB_OUT = path.join(ROOT, 'src/data/exerciseDatabaseEnrichment.js');

export function slugifyScoringKey(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function dbKey(name) {
  return String(name || '').toLowerCase().trim();
}

export function starsToDifficulty(stars) {
  if (stars <= 2) return 1;
  if (stars <= 3) return 2;
  if (stars <= 5) return 3;
  return 4;
}

function scoringEntry(name, unit, stars, coeff, opts = {}) {
  const scoringType = opts.scoringType || (unit === 'seconds' ? 'isometric' : 'dynamic');
  return {
    key: slugifyScoringKey(name),
    name,
    unit,
    difficultyStars: stars,
    intensityCoeff: coeff,
    scoringType,
    aliases: opts.aliases || [],
    muscleGroup: opts.muscleGroup || ''
  };
}

function escapeJsString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatStringArray(arr, indent = '    ') {
  if (!arr?.length) return '[]';
  const lines = arr.map((v) => `${indent}  '${escapeJsString(v)}'`);
  return `[\n${lines.join(',\n')}\n${indent}]`;
}

function formatScoringEntry(entry, indent = '  ') {
  const aliasBlock =
    entry.aliases?.length > 0
      ? `,\n${indent}  aliases: ${formatStringArray(entry.aliases, indent + '  ')}`
      : '';
  return `${indent}scoringEntry('${escapeJsString(entry.name)}', '${entry.unit}', ${entry.difficultyStars}, ${entry.intensityCoeff}, {\n${indent}  muscleGroup: '${escapeJsString(entry.muscleGroup)}'${aliasBlock}\n${indent}})`;
}

function formatDbEntry(key, entry) {
  return `  "${escapeJsString(key)}": {
    name: "${escapeJsString(entry.name)}",
    category: "${escapeJsString(entry.category)}",
    primaryMuscles: ${formatStringArray(entry.primaryMuscles, '    ')},
    secondaryMuscles: ${formatStringArray(entry.secondaryMuscles, '    ')},
    equipment: "${escapeJsString(entry.equipment)}",
    difficulty: ${entry.difficulty},
    description: "${escapeJsString(entry.description)}",
    variations: ${formatStringArray(entry.variations, '    ')}
  }`;
}

function resolveDuplicate(existing, incoming) {
  const carryNames = new Set([
    "farmer's carry",
    'suitcase carry',
    "waiter's carry",
    'overhead carry',
    'front rack carry',
    'bear hug carry',
    'zercher carry'
  ]);
  if (carryNames.has(dbKey(incoming.name)) && incoming.muscleGroup === 'Carries') return incoming;
  return existing;
}

function buildEntries() {
  const catalog = [];
  const database = {};
  const skipped = [];
  const seen = new Map();

  for (const ex of EXERCISE_DATA) {
    const key = dbKey(ex.name);
    if (exerciseDatabase[key]) {
      skipped.push({ name: ex.name, reason: 'existe déjà dans exerciseDatabase' });
      continue;
    }
    if (seen.has(key)) {
      const prev = seen.get(key);
      const chosen = resolveDuplicate(prev, ex);
      if (chosen === ex) {
        catalog[prev.catalogIndex] = scoringEntry(ex.name, ex.unit, ex.stars, ex.coeff, {
          muscleGroup: ex.muscleGroup,
          aliases: ex.variations?.slice(0, 3) || []
        });
        database[key] = {
          name: ex.name,
          category: ex.category,
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          equipment: ex.equipment,
          difficulty: starsToDifficulty(ex.stars),
          description: ex.description,
          variations: ex.variations
        };
        seen.set(key, { ...ex, catalogIndex: prev.catalogIndex });
      } else {
        skipped.push({ name: ex.name, reason: 'doublon interne (entrée antérieure conservée)' });
      }
      continue;
    }

    const catalogIndex = catalog.length;
    catalog.push(
      scoringEntry(ex.name, ex.unit, ex.stars, ex.coeff, {
        muscleGroup: ex.muscleGroup,
        aliases: ex.variations?.slice(0, 3) || []
      })
    );
    database[key] = {
      name: ex.name,
      category: ex.category,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      difficulty: starsToDifficulty(ex.stars),
      description: ex.description,
      variations: ex.variations
    };
    seen.set(key, { ...ex, catalogIndex });
  }

  return { catalog, database, skipped };
}

function writeCatalogFile(entries) {
  const body = entries.map((e) => formatScoringEntry(e)).join(',\n');
  const content = `import { scoringEntry } from './catalogHelpers';

/** Entrées scoring ajoutées par generateExerciseBankEnrichment.mjs */
export const CATALOG_ENRICHMENT = [
${body}
];
`;
  fs.mkdirSync(path.dirname(CATALOG_OUT), { recursive: true });
  fs.writeFileSync(CATALOG_OUT, content, 'utf8');
}

function writeDatabaseFile(entries) {
  const body = Object.entries(entries)
    .map(([key, entry]) => formatDbEntry(key, entry))
    .join(',\n');
  const content = `/** Fiches exercices ajoutées par generateExerciseBankEnrichment.mjs */
export const EXERCISE_DATABASE_ENRICHMENT = {
${body}
};
`;
  fs.writeFileSync(DB_OUT, content, 'utf8');
}

function main() {
  const { catalog, database, skipped } = buildEntries();
  writeCatalogFile(catalog);
  writeDatabaseFile(database);

  console.log('=== generateExerciseBankEnrichment ===');
  console.log(`Exercices ajoutés : ${catalog.length}`);
  console.log(`Fichier scoring : ${CATALOG_OUT}`);
  console.log(`Fichier database : ${DB_OUT}`);
  if (skipped.length) {
    console.log(`Doublons ignorés (${skipped.length}) :`);
    for (const s of skipped) console.log(`  - ${s.name} (${s.reason})`);
  } else {
    console.log('Doublons ignorés : 0');
  }
}

main();
