// Debug des données du calendrier pour le 18/10/2025

console.log('=== DEBUG DONNÉES CALENDRIER ===');

// Simuler les données comme dans le contexte
const testDate = new Date('2025-10-18');
const dateStr = '2025-10-18';

// Simuler les données que vous avez saisies
const mockData = {
  reps: {
    '2025-10-18_planche_bras_alterne': '40',
    '2025-10-18_developpe_halteres_semaine_a': '30',
    '2025-10-18_developpe_barre_smith_semaine_a': '36',
    '2025-10-18_ecarte_incline_semaine_a': '44',
    '2025-10-18_pompes_declinee_machine_convergente_semaine_a': '0',
    '2025-10-18_developpe_couche_prise_verte_semaine_a': '0',
    '2025-10-18_extension_poulie_corde_semaine_a': '36'
  },
  checkedExercises: {
    '2025-10-18_planche_bras_alterne': true,
    '2025-10-18_developpe_halteres_semaine_a': true,
    '2025-10-18_developpe_barre_smith_semaine_a': true,
    '2025-10-18_ecarte_incline_semaine_a': true,
    '2025-10-18_pompes_declinee_machine_convergente_semaine_a': false,
    '2025-10-18_developpe_couche_prise_verte_semaine_a': false,
    '2025-10-18_extension_poulie_corde_semaine_a': true
  }
};

// Simuler le programme d'entraînement pour samedi
const samediWorkout = {
  salleVariants: {
    semaineA: {
      exercices: [
        { id: 'developpe_halteres_semaine_a', name: 'Développé haltères (Semaine A)' },
        { id: 'developpe_barre_smith_semaine_a', name: 'Développé barre ou Smith (Semaine A)' },
        { id: 'ecarte_incline_semaine_a', name: 'Écarté incliné (Semaine A)' },
        { id: 'pompes_declinee_machine_convergente_semaine_a', name: 'Pompes déclinées ou machine convergente (Semaine A)' },
        { id: 'developpe_couche_prise_verte_semaine_a', name: 'Développé couché prise verte (Semaine A)' },
        { id: 'extension_poulie_corde_semaine_a', name: 'Extension à la poulie corde (Semaine A)' },
        { id: 'extension_unilaterale_poulie_semaine_a', name: 'Extension unilatérale à la poulie (Semaine A)' }
      ]
    },
    semaineB: {
      exercices: []
    }
  },
  exercices: [
    { id: 'planche_bras_alterne', name: 'Planche avec lever de bras alterné' }
  ]
};

console.log('Date testée:', testDate.toLocaleDateString('fr-FR'));
console.log('Jour:', ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][testDate.getDay()]);

// Simuler la nouvelle logique corrigée
let exercisesList = [];

if (samediWorkout.salleVariants) {
  const semaineA = samediWorkout.salleVariants.semaineA?.exercices || [];
  const semaineB = samediWorkout.salleVariants.semaineB?.exercices || [];
  const streetExercices = samediWorkout.exercices || [];
  
  exercisesList = [...semaineA, ...semaineB, ...streetExercices];
}

console.log('\n=== EXERCICES DÉTECTÉS ===');
console.log('Nombre total d\'exercices possibles:', exercisesList.length);

let totalReps = 0;
let completedExercises = 0;

exercisesList.forEach(exercise => {
  const key = `${dateStr}_${exercise.id}`;
  const reps = parseInt(mockData.reps[key]) || 0;
  const isCompleted = mockData.checkedExercises[key] || false;
  
  console.log(`- ${exercise.name}:`);
  console.log(`  Clé: ${key}`);
  console.log(`  Répétitions: ${reps}`);
  console.log(`  Complété: ${isCompleted}`);
  
  if (isCompleted) {
    completedExercises++;
    totalReps += reps;
  }
});

console.log('\n=== RÉSULTAT ===');
console.log(`Exercices complétés: ${completedExercises}/${exercisesList.length}`);
console.log(`Total répétitions: ${totalReps}`);
console.log(`Intensité détectée: ${completedExercises > 0 ? 'OUI' : 'NON'}`);

if (completedExercises > 0) {
  console.log('🎉 LE CALENDRIER DEVRAIT MAINTENANT AFFICHER CES DONNÉES !');
} else {
  console.log('❌ Problème: aucun exercice détecté comme complété');
}