// Script pour analyser les données actuellement stockées

// Simuler le contexte de l'application
console.log('=== Analyse des données stockées ===');
console.log('Date actuelle:', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

// Fonction getDateStr
function getDateStr(date) {
  return date.toISOString().split('T')[0];
}

// Vérifier les dates récentes
const today = new Date();
const samedi18Oct2025 = new Date('2025-10-18');
const samedi25Oct2025 = new Date('2025-10-25');

console.log('\n=== Vérification des dates 2025 ===');
console.log('18/10/2025 est un:', samedi18Oct2025.toLocaleDateString('fr-FR', { weekday: 'long' }));
console.log('25/10/2025 est un:', samedi25Oct2025.toLocaleDateString('fr-FR', { weekday: 'long' }));
console.log('Format dateStr pour 18/10/2025:', getDateStr(samedi18Oct2025));

// Simuler la fonction generatePastDatesForDay pour 2025
function generatePastDatesForDay(targetDay) {
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const targetDayIndex = dayNames.indexOf(targetDay.toLowerCase());
  
  if (targetDayIndex === -1) {
    return [];
  }

  const dates = [];
  const currentDate = new Date();
  
  // Trouver les 4 dernières occurrences de ce jour
  for (let i = 0; i < 28; i++) {
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

console.log('\n=== Dates générées pour "samedi" en 2025 ===');
const samediDates = generatePastDatesForDay('samedi');
samediDates.forEach((dateInfo, index) => {
  const realDay = dateInfo.date.toLocaleDateString('fr-FR', { weekday: 'long' });
  console.log(`${index + 1}. ${dateInfo.dateStr} (${realDay})`);
});

console.log('\n=== Clés d\'exercices possibles ===');
console.log('Si vous avez fait des exercices le 18/10/2025, les clés seraient:');
console.log('- Format: 2025-10-18_[exerciseId]');
console.log('- Exemple: 2025-10-18_1, 2025-10-18_2, etc.');