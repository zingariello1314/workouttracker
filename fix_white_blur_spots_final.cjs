/**
 * CORRECTION FINALE DES TACHES DE BLUR BLANC
 * 
 * Problème identifié : Les pseudo-éléments ::before dans sidebar-visual-enhancements.css
 * utilisent --sidebar-bg-card: rgba(255, 255, 255, 0.06) qui crée des taches blanches
 * semi-transparentes en haut à droite des modules.
 * 
 * Solution : Masquer tous les pseudo-éléments ::before problématiques.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction finale des taches de blur blanc...');

// Chemin vers le fichier CSS problématique
const cssFilePath = path.join(__dirname, 'src/styles/sidebar-visual-enhancements.css');

try {
  // Lire le contenu du fichier CSS
  let cssContent = fs.readFileSync(cssFilePath, 'utf8');
  
  console.log('📖 Lecture du fichier CSS...');
  
  // Masquer tous les pseudo-éléments ::before qui causent les taches blanches
  const fixedCss = cssContent
    // Masquer .sidebar-section-enhanced::before
    .replace(
      /\.sidebar-section-enhanced::before\s*{[^}]*}/gs,
      `.sidebar-section-enhanced::before {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .sidebar-data-card-premium::before
    .replace(
      /\.sidebar-data-card-premium::before\s*{[^}]*}/gs,
      `.sidebar-data-card-premium::before {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .badge-premium::before
    .replace(
      /\.badge-premium::before\s*{[^}]*}/gs,
      `.badge-premium::before {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .stat-card-premium::before
    .replace(
      /\.stat-card-premium::before\s*{[^}]*}/gs,
      `.stat-card-premium::before {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .badge-glow
    .replace(
      /\.badge-glow\s*{[^}]*}/gs,
      `.badge-glow {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    )
    // Masquer .stat-background-pattern
    .replace(
      /\.stat-background-pattern\s*{[^}]*}/gs,
      `.stat-background-pattern {
  display: none !important; /* Masqué pour éviter les taches blanches */
}`
    );
  
  // Écrire le fichier corrigé
  fs.writeFileSync(cssFilePath, fixedCss, 'utf8');
  
  console.log('✅ Taches de blur blanc corrigées !');
  console.log('📝 Les pseudo-éléments ::before ont été masqués dans sidebar-visual-enhancements.css');
  console.log('🎨 Les modules devraient maintenant être propres sans taches blanches');
  
} catch (error) {
  console.error('❌ Erreur lors de la correction :', error.message);
}