// Test final pour comprendre le problème du 18/10/2025

console.log('=== ANALYSE FINALE ===');

const today = new Date();
const date18Oct = new Date('2025-10-18');

console.log('Date actuelle:', today.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));
console.log('Date cible: 18/10/2025 (' + date18Oct.toLocaleDateString('fr-FR', { weekday: 'long' }) + ')');

// Calculer la différence en jours
const diffTime = today.getTime() - date18Oct.getTime();
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

console.log('\nDifférence:', diffDays, 'jours');
console.log('Le 18/10/2025 est dans', -diffDays, 'jours (futur)');

console.log('\n=== PROBLÈME IDENTIFIÉ ===');
console.log('🚨 VOUS AVEZ SAISI DES EXERCICES POUR UNE DATE FUTURE !');
console.log('📅 Aujourd\'hui: 21/10/2025');
console.log('📅 Votre saisie: 18/10/2025 (il y a 3 jours)');
console.log('');
console.log('Mais attendez... regardons mieux:');

// Vérification plus précise
if (date18Oct < today) {
  console.log('✅ Le 18/10/2025 est bien dans le passé');
  
  // Calculer combien de samedis il y a eu depuis
  let samediCount = 0;
  let checkDate = new Date(today);
  
  console.log('\nRecherche des samedis depuis aujourd\'hui:');
  for (let i = 0; i < 30; i++) {
    checkDate.setDate(today.getDate() - i);
    if (checkDate.getDay() === 6) { // samedi
      samediCount++;
      console.log(`Samedi ${samediCount}: ${checkDate.toLocaleDateString('fr-FR')} (${checkDate.toISOString().split('T')[0]})`);
      
      if (checkDate.toISOString().split('T')[0] === '2025-10-18') {
        console.log('  🎯 TROUVÉ LE 18/10/2025 !');
      }
      
      if (samediCount >= 5) break;
    }
  }
} else {
  console.log('❌ Le 18/10/2025 est dans le futur');
}

console.log('\n=== SOLUTION ===');
console.log('Le problème: l\'algorithme ne cherche que les 4 DERNIERS samedis');
console.log('Le 18/10/2025 était le samedi de cette semaine, mais il a été "poussé" hors de la liste');
console.log('Il faut soit:');
console.log('1. Augmenter le nombre de samedis affichés');
console.log('2. Ou inclure le samedi de la semaine courante même s\'il est passé');