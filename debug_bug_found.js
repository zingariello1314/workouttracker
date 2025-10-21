// Bug trouvé dans la logique de calcul des dates !

console.log('=== BUG IDENTIFIÉ ===');
console.log('Date actuelle:', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

// Logique ACTUELLE (bugguée) dans WorkoutHistorySection.jsx
function generatePastDatesForDayBUGGED(dayName) {
  const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const dates = [];
  const today = new Date();
  const targetDayIndex = daysOrder.indexOf(dayName); // Pour "Samedi" = 5
  
  console.log(`\n=== LOGIQUE BUGGÉE pour "${dayName}" ===`);
  console.log('targetDayIndex dans daysOrder:', targetDayIndex);
  console.log('Conversion: (targetDayIndex + 1) % 7 =', (targetDayIndex + 1) % 7);
  
  // Trouver le dernier jour correspondant (aujourd'hui ou avant)
  let currentDate = new Date(today);
  let steps = 0;
  while (currentDate.getDay() !== (targetDayIndex + 1) % 7) {
    currentDate.setDate(currentDate.getDate() - 1);
    steps++;
    if (steps < 10) { // Limiter l'affichage
      console.log(`Étape ${steps}: ${currentDate.toLocaleDateString('fr-FR')} (getDay: ${currentDate.getDay()})`);
    }
  }
  
  console.log(`Dernier ${dayName} trouvé:`, currentDate.toLocaleDateString('fr-FR'));
  
  // Générer les 4 dernières occurrences
  for (let i = 0; i < 4; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - (i * 7));
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Logique CORRECTE
function generatePastDatesForDayCORRECT(dayName) {
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const targetDayIndex = dayNames.indexOf(dayName.toLowerCase()); // Pour "samedi" = 6
  
  console.log(`\n=== LOGIQUE CORRECTE pour "${dayName}" ===`);
  console.log('targetDayIndex dans dayNames:', targetDayIndex);
  
  const dates = [];
  const currentDate = new Date();
  
  // Trouver les 4 dernières occurrences de ce jour
  for (let i = 0; i < 28; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    
    if (checkDate.getDay() === targetDayIndex) {
      dates.push(checkDate.toISOString().split('T')[0]);
      if (dates.length === 4) break;
    }
  }
  
  return dates.reverse();
}

// Test avec "Samedi"
const buggedResults = generatePastDatesForDayBUGGED('Samedi');
const correctResults = generatePastDatesForDayCORRECT('samedi');

console.log('\n=== COMPARAISON ===');
console.log('Logique buggée:', buggedResults);
console.log('Logique correcte:', correctResults);

console.log('\n=== VÉRIFICATION DU 18/10/2025 ===');
console.log('Dans logique buggée?', buggedResults.includes('2025-10-18') ? 'OUI' : 'NON');
console.log('Dans logique correcte?', correctResults.includes('2025-10-18') ? 'OUI' : 'NON');

console.log('\n=== CONCLUSION ===');
console.log('Le bug: la logique actuelle utilise un mauvais mapping des jours !');
console.log('Elle cherche le jour 6 (samedi en getDay) mais avec un calcul incorrect.');