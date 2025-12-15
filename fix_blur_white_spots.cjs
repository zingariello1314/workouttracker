/**
 * CORRECTION DES TACHES DE BLUR BLANC
 * 
 * Problème identifié : Les éléments .time-shadow, .date-shadow, et .year-shadow
 * dans sidebar-premium.css créent des taches de blur blanc en haut à droite
 * des modules à cause de leur position absolute et filter blur.
 * 
 * Solution : Supprimer ou masquer ces éléments shadow qui causent le problème visuel.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des taches de blur blanc...');

// Chemin vers le fichier CSS problématique
const cssFilePath = path.join(__dirname, 'src/styles/sidebar-premium.css');

try {
  // Lire le contenu du fichier CSS
  let cssContent = fs.readFileSync(cssFilePath, 'utf8');
  
  console.log('📖 Lecture du fichier CSS...');
  
  // Supprimer ou masquer les éléments shadow qui causent les taches blanches
  const fixedCss = cssContent
    // Masquer .time-shadow
    .replace(
      /\.time-shadow\s*{[^}]*}/gs,
      `.time-shadow {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .date-shadow  
    .replace(
      /\.date-shadow\s*{[^}]*}/gs,
      `.date-shadow {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .year-shadow
    .replace(
      /\.year-shadow\s*{[^}]*}/gs,
      `.year-shadow {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .date-glow aussi au cas où
    .replace(
      /\.date-glow\s*{[^}]*}/gs,
      `.date-glow {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    );
  
  // Écrire le fichier corrigé
  fs.writeFileSync(cssFilePath, fixedCss, 'utf8');
  
  console.log('✅ Taches de blur blanc corrigées !');
  console.log('📝 Les éléments shadow ont été masqués dans sidebar-premium.css');
  console.log('🎨 Les modules devraient maintenant être propres sans taches blanches');
  
} catch (error) {
  console.error('❌ Erreur lors de la correction :', error.message);
}