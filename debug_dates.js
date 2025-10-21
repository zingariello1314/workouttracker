// Simuler la logique de generatePastDatesForDay
const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function generatePastDatesForDay(dayName) {
  const dates = [];
  const today = new Date();
  const targetDayIndex = daysOrder.indexOf(dayName); // 0 = Lundi, 1 = Mardi, etc.
  
  console.log('Jour recherché:', dayName, '- Index dans daysOrder:', targetDayIndex);
  console.log('Aujourd\'hui:', today.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));
  
  // Trouver le dernier jour correspondant (aujourd'hui ou avant)
  let currentDate = new Date(today);
  while (currentDate.getDay() !== (targetDayIndex + 1) % 7) { // getDay(): 0=Dimanche, 1=Lundi, etc.
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  console.log('Dernier', dayName, 'trouvé:', currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));
  
  // Générer les 4 dernières occurrences de ce jour
  for (let i = 0; i < 4; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - (i * 7));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDateStr = `${year}-${month}-${day}`;
    
    dates.push({
      date: date,
      isoDateStr: isoDateStr,
      dayName: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()]
    });
    
    console.log(`  ${i+1}. ${isoDateStr} (${['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()]})`);
  }
  
  return dates;
}

console.log('=== Test pour SAMEDI ===');
generatePastDatesForDay('samedi');

console.log('\n=== Test pour VENDREDI ===');
generatePastDatesForDay('vendredi');