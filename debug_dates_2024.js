// Test avec les vraies dates de 2024
const today2024 = new Date('2024-10-21'); // Simuler qu'on est le 21 octobre 2024

console.log('=== Test avec date réelle 2024 ===');
console.log('Date simulée aujourd\'hui:', today2024.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

// Test pour samedi
const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const targetDayIndex = daysOrder.indexOf('samedi'); // 5

let currentDate = new Date(today2024);
while (currentDate.getDay() !== (targetDayIndex + 1) % 7) {
  currentDate.setDate(currentDate.getDate() - 1);
}

console.log('Dernier samedi trouvé:', currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');
const day = String(currentDate.getDate()).padStart(2, '0');
const isoDateStr = `${year}-${month}-${day}`;

console.log('Format ISO pour le calendrier:', isoDateStr);
console.log('Cela correspond-il au 18/10/2024 de vos saisies ?', isoDateStr === '2024-10-19' ? 'OUI' : 'NON');

// Vérifier le vrai 18/10/2024
const date18Oct = new Date('2024-10-18');
console.log('\\n18/10/2024 est un:', date18Oct.toLocaleDateString('fr-FR', { weekday: 'long' }));
console.log('19/10/2024 est un:', new Date('2024-10-19').toLocaleDateString('fr-FR', { weekday: 'long' }));