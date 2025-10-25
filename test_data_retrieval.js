console.log("=== TEST DE SAUVEGARDE ET RÉCUPÉRATION DES DONNÉES ===");

// Simuler des données de test
const testData = {
  checkedExercises: {
    "2025-01-25_1": true,
    "2025-01-25_2": true,
    "2025-01-25_3": false
  },
  reps: {
    "2025-01-25_1": "45",
    "2025-01-25_2": "30",
    "2025-01-25_3": ""
  }
};

console.log("Données de test:", JSON.stringify(testData, null, 2));

// Test de la clé de récupération
const dateStr = "2025-01-25";
const exerciseId = 1;
const key = `${dateStr}_${exerciseId}`;

console.log(`Clé générée: ${key}`);
console.log(`Exercice coché: ${testData.checkedExercises[key]}`);
console.log(`Reps: ${testData.reps[key]}`);

// Vérifier les autres exercices
for (let i = 1; i <= 3; i++) {
  const testKey = `${dateStr}_${i}`;
  console.log(`Exercice ${i}: coché=${testData.checkedExercises[testKey]}, reps=${testData.reps[testKey]}`);
}