// Test pour comprendre le vrai problème de dates

// Simuler la date d'aujourd'hui comme 21 octobre 2024 (lundi)
const today = new Date('2024-10-21');
console.log('=== Analyse du problème réel ===');
console.log('Date simulée aujourd\'hui:', today.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

// Fonction getDateStr simulée
function getDateStr(date) {
  return date.toISOString().split('T')[0];
}

// Fonction generatePastDatesForDay simulée
function generatePastDatesForDay(targetDay) {
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const targetDayIndex = dayNames.indexOf(targetDay.toLowerCase());
  
  if (targetDayIndex === -1) {
    return [];
  }

  const dates = [];
  const currentDate = new Date(today);
  
  // Trouver les 4 dernières occurrences de ce jour
  for (let i = 0; i < 28; i++) { // Chercher sur 4 semaines
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    
    if (checkDate.getDay() === targetDayIndex) {
      dates.push({
        date: new Date(checkDate),
        dateStr: getDateStr(checkDate)
      });
      
      if (dates.length === 4) break;
    }
  }
  
  return dates.reverse();
}

// Test avec "samedi"
console.log('\n=== Test avec "samedi" ===');
const samediDates = generatePastDatesForDay('samedi');
samediDates.forEach((dateInfo, index) => {
  const realDay = dateInfo.date.toLocaleDateString('fr-FR', { weekday: 'long' });
  console.log(`${index + 1}. ${dateInfo.dateStr} (${realDay})`);
});

// Vérifier spécifiquement le 18/10/2024
console.log('\n=== Vérification du 18/10/2024 ===');
const date18Oct = new Date('2024-10-18');
console.log('18/10/2024 est un:', date18Oct.toLocaleDateString('fr-FR', { weekday: 'long' }));
console.log('getDay() pour 18/10/2024:', date18Oct.getDay()); // 5 = vendredi
console.log('Format dateStr pour 18/10/2024:', getDateStr(date18Oct));

// Vérifier le 19/10/2024
console.log('\n=== Vérification du 19/10/2024 ===');
const date19Oct = new Date('2024-10-19');
console.log('19/10/2024 est un:', date19Oct.toLocaleDateString('fr-FR', { weekday: 'long' }));
console.log('getDay() pour 19/10/2024:', date19Oct.getDay()); // 6 = samedi
console.log('Format dateStr pour 19/10/2024:', getDateStr(date19Oct));

console.log('\n=== CONCLUSION ===');
console.log('Si vous avez saisi des exercices pour le "samedi 18/10", il y a une erreur car:');
console.log('- Le 18/10/2024 est un VENDREDI');
console.log('- Le 19/10/2024 est un SAMEDI');
console.log('Le calendrier affiche correctement les données du samedi (19/10)');
console.log('Mais l\'interface de saisie pourrait avoir une confusion jour/date');