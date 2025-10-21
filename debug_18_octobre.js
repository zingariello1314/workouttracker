// Script de debug pour analyser le problème du 18/10/2025

console.log('🔍 DEBUG: Analyse du problème 18/10/2025');

// Simuler les fonctions utilitaires
const getDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayName = (date) => {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[date.getDay()];
};

// Date problématique
const targetDate = new Date(2025, 9, 18); // 18 octobre 2025
const dateStr = getDateStr(targetDate);
const dayName = getDayName(targetDate);

console.log('📅 Date cible:', targetDate);
console.log('📅 Date string:', dateStr);
console.log('📅 Nom du jour:', dayName);
console.log('📅 Jour de la semaine (0=dimanche):', targetDate.getDay());

// Vérifier si c'est un samedi
console.log('🔍 Est-ce un samedi?', dayName === 'samedi');

// Simuler la génération de dates passées pour samedi
const generatePastDatesForDay = (targetDay, weeksBack = 6, maxDates = 6) => {
  const dates = [];
  const today = new Date();
  const currentDate = new Date(today);
  
  // Trouver le samedi le plus récent (ou aujourd'hui si c'est samedi)
  const daysUntilTargetDay = (6 - currentDate.getDay() + 7) % 7;
  if (daysUntilTargetDay > 0) {
    currentDate.setDate(currentDate.getDate() - (7 - daysUntilTargetDay));
  }
  
  // Générer les dates passées
  for (let i = 0; i < weeksBack && dates.length < maxDates; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (i * 7));
    
    // Ne pas inclure les dates futures
    if (date <= today) {
      dates.push(getDateStr(date));
    }
  }
  
  return dates.reverse();
};

// Tester la génération de dates pour samedi
const samediDates = generatePastDatesForDay('samedi');
console.log('📅 Dates de samedi générées:', samediDates);
console.log('🔍 Le 18/10/2025 est-il inclus?', samediDates.includes(dateStr));

// Vérifier les clés d'exercices possibles
const possibleExerciseKeys = [
  // Salle semaine A
  `${dateStr}_squat_bulgare`,
  `${dateStr}_developpe_couche_halteres`,
  `${dateStr}_rowing_halteres`,
  `${dateStr}_developpe_militaire_halteres`,
  `${dateStr}_curl_biceps`,
  `${dateStr}_extension_triceps`,
  `${dateStr}_crunchs`,
  `${dateStr}_planche`,
  
  // Salle semaine B
  `${dateStr}_squat_gobelet`,
  `${dateStr}_developpe_incline_halteres`,
  `${dateStr}_tirage_horizontal`,
  `${dateStr}_elevation_laterales`,
  `${dateStr}_curl_marteau`,
  `${dateStr}_dips_chaise`,
  `${dateStr}_russian_twists`,
  `${dateStr}_mountain_climbers`,
  
  // Street workout
  `${dateStr}_pompes`,
  `${dateStr}_tractions`,
  `${dateStr}_dips`,
  `${dateStr}_squats`,
  `${dateStr}_fentes`,
  `${dateStr}_burpees`,
  `${dateStr}_planche_street`,
  `${dateStr}_abdos_street`
];

console.log('🔍 Clés d\'exercices possibles pour le', dateStr, ':', possibleExerciseKeys);

// Simuler les données du localStorage (à remplacer par les vraies données)
console.log('⚠️  IMPORTANT: Vérifiez dans la console du navigateur si ces clés existent dans IndexedDB:');
possibleExerciseKeys.forEach(key => {
  console.log(`  - ${key}`);
});

console.log('🔧 ÉTAPES DE DEBUG:');
console.log('1. Ouvrez la console du navigateur (F12)');
console.log('2. Allez dans l\'onglet Application > IndexedDB > WorkoutTrackerDB');
console.log('3. Cherchez les clés qui commencent par "2025-10-18_"');
console.log('4. Vérifiez si elles correspondent aux clés listées ci-dessus');