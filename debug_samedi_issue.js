// Debug du problème des samedis
console.log('=== Problème identifié ===');
console.log('Date actuelle:', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

function getDateStr(date) {
  return date.toISOString().split('T')[0];
}

function generatePastDatesForDay(targetDay) {
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const targetDayIndex = dayNames.indexOf(targetDay.toLowerCase());
  
  if (targetDayIndex === -1) {
    return [];
  }

  const dates = [];
  const currentDate = new Date();
  
  console.log(`\nRecherche des 4 derniers "${targetDay}" depuis le ${currentDate.toLocaleDateString('fr-FR')}`);
  
  // Trouver les 4 dernières occurrences de ce jour
  for (let i = 0; i < 28; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    
    console.log(`Jour ${i}: ${checkDate.toLocaleDateString('fr-FR')} (${checkDate.toLocaleDateString('fr-FR', { weekday: 'long' })}) - getDay(): ${checkDate.getDay()}`);
    
    if (checkDate.getDay() === targetDayIndex) {
      dates.push({
        date: new Date(checkDate),
        dateStr: getDateStr(checkDate)
      });
      console.log(`  ✅ TROUVÉ: ${getDateStr(checkDate)}`);
      
      if (dates.length === 4) break;
    }
  }
  
  return dates.reverse();
}

const samediDates = generatePastDatesForDay('samedi');

console.log('\n=== Résultat final ===');
samediDates.forEach((dateInfo, index) => {
  console.log(`${index + 1}. ${dateInfo.dateStr}`);
});

console.log('\n=== Vérification du 18/10/2025 ===');
const date18Oct = new Date('2025-10-18');
console.log('18/10/2025 est un:', date18Oct.toLocaleDateString('fr-FR', { weekday: 'long' }));
console.log('Le 18/10/2025 est-il dans la liste?', samediDates.some(d => d.dateStr === '2025-10-18') ? 'OUI' : 'NON');

console.log('\n=== CONCLUSION ===');
console.log('Le problème: le 18/10/2025 n\'est PAS dans les 4 derniers samedis générés !');
console.log('Les 4 derniers samedis sont:', samediDates.map(d => d.dateStr).join(', '));
console.log('Vous avez saisi pour le 18/10/2025, mais le calendrier ne regarde que ces 4 dates.');