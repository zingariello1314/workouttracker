// Test de catégorisation des exercices
import { enrichExercise } from './src/utils/programUtils.js';

// Exercices de test
const testExercises = [
  { id: 1, name: "Tractions pronation", series: "4×4-6", materiel: "barre" },
  { id: 2, name: "Pompes inclinées", series: "3×12", materiel: "banc" },
  { id: 3, name: "Curl alterné", series: "3×10", materiel: "haltère" },
  { id: 4, name: "Dips parallèles", series: "4×12", materiel: "parallèles" },
  { id: 5, name: "Gainage latéral", series: "30 sec", materiel: "poids du corps" },
  { id: 6, name: "Mountain climbers", series: "30 sec", materiel: "poids du corps" },
  { id: 7, name: "Planche", series: "1 min", materiel: "poids du corps" },
  { id: 8, name: "Squat", series: "3×15", materiel: "poids du corps" },
  { id: 9, name: "Fentes bulgares", series: "3×10", materiel: "banc" },
  { id: 10, name: "Vacuum allongé", series: "5 cycles", materiel: "poids du corps" }
];

console.log("=== TEST DE CATÉGORISATION ===");
testExercises.forEach(exercise => {
  const enriched = enrichExercise(exercise);
  console.log(`${exercise.name}:`);
  console.log(`  - Catégorie: ${enriched.metadata.category}`);
  console.log(`  - Groupe musculaire: ${enriched.metadata.primaryMuscleGroup}`);
  console.log(`  - Équipement: ${enriched.metadata.equipment}`);
  console.log(`  - Difficulté: ${enriched.metadata.difficulty}`);
  console.log("---");
});