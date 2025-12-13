/**
 * Script de nettoyage final pour la sidebar
 * Supprime les anciens scripts de debug et fichiers temporaires
 */

console.log('🧹 Nettoyage final des fichiers temporaires...');

import fs from 'fs';

// Liste des fichiers temporaires à supprimer
const filesToCleanup = [
  'fix_css_modules_automatique.js',
  'fix_css_modules_historiques.js',
  'fix_global_performance_urgent.js',
  'fix_hauteur_contenu_modules.js',
  'fix_modules_contenu_affichage.js',
  'fix_modules_contenu_simple.js',
  'fix_modules_display.js',
  'fix_modules_historiques_chirurgical.js',
  'fix_modules_historiques_contenu.js',
  'fix_modules_historiques_contenu_vide.js',
  'fix_modules_historiques_definitif.js',
  'fix_modules_historiques_urgence_complete.js',
  'diagnostic_affichage_modules_avance.js',
  'diagnostic_css_modules_browser.js',
  'diagnostic_modules_historiques_chirurgical.js',
  'diagnostic_modules_historiques_contenu.js',
  'diagnostic_modules_historiques_final.js',
  'diagnostic_modules_vides.js',
  'test_css_fix_modules.js',
  'test_final_modules_fix.js',
  'test_fix_modules_historiques.js',
  'test_module_props.js',
  'validation_finale_modules.js',
  'debug_historical_modules.js',
  'debug_sidebar_modules.js',
  'debug_sidebar_data.js'
];

let cleanedCount = 0;
let notFoundCount = 0;

filesToCleanup.forEach(filename => {
  try {
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename);
      console.log(`🗑️  Supprimé: ${filename}`);
      cleanedCount++;
    } else {
      notFoundCount++;
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la suppression de ${filename}:`, error.message);
  }
});

console.log('\n📊 Résumé du nettoyage:');
console.log(`🗑️  Fichiers supprimés: ${cleanedCount}`);
console.log(`📁 Fichiers non trouvés: ${notFoundCount}`);

// Garder les scripts utiles
console.log('\n📋 Scripts conservés pour référence future:');
const keptScripts = [
  'fix_sidebar_modules_critical.js',
  'test_sidebar_modules_final.js',
  'cleanup_sidebar_final.js'
];

keptScripts.forEach(script => {
  if (fs.existsSync(script)) {
    console.log(`✅ Conservé: ${script}`);
  }
});

console.log('\n🎉 Nettoyage terminé !');
console.log('💡 Votre workspace est maintenant propre et organisé.');
console.log('🚀 Redémarrez votre serveur de développement pour voir les améliorations.');