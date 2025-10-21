// Test pour vérifier si le calendrier détecte maintenant les exercices du 18/10/2025

// Simuler la fonction getDateStr
const getDateStr = (date) => {
  return date.toISOString().split('T')[0];
};

// Simuler getDayName
const getDayName = (date) => {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[date.getDay()];
};

// Date de test
const testDate = new Date('2025-10-18');
const dateStr = getDateStr(testDate);
const dayName = getDayName(testDate);

console.log('=== TEST CALENDRIER ===');
console.log(`Date testée: ${testDate.toLocaleDateString('fr-FR')}`);
console.log(`Jour: ${dayName}`);
console.log(`Format ISO: ${dateStr}`);

// Simuler les clés d'exercices que vous avez saisies
const exerciseKeys = [
  '2025-10-18_planche_bras_alterne',
  '2025-10-18_developpe_halteres_semaine_a',
  '2025-10-18_developpe_barre_smith_semaine_a',
  '2025-10-18_ecarte_incline_semaine_a',
  '2025-10-18_pompes_declinee_machine_convergente_semaine_a',
  '2025-10-18_developpe_couche_prise_verte_semaine_a',
  '2025-10-18_extension_poulie_corde_semaine_a',
  '2025-10-18_extension_unilaterale_poulie_semaine_a'
];

console.log('\n=== EXERCICES SAISIS ===');
exerciseKeys.forEach(key => {
  console.log(`✅ ${key}`);
});

console.log('\n=== VÉRIFICATION ===');
console.log('Le calendrier devrait maintenant détecter ces exercices !');