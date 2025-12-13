console.log('=== DIAGNOSTIC MODULES HISTORIQUES ===');
console.log('');

// Vérifier la structure des modules
const fs = require('fs');
const path = require('path');

const modulesPath = 'src/components/sidebar/historical';
const modules = fs.readdirSync(modulesPath).filter(f => f.endsWith('.jsx'));

console.log('Modules trouvés:', modules.length);
console.log('');

modules.forEach(module => {
  const filePath = path.join(modulesPath, module);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('--- ' + module + ' ---');
  
  // Vérifier la structure
  const hasSection = content.includes('<section className="sidebar-section">');
  const hasHeader = content.includes('<header className="sidebar-section-header">');
  const hasH2 = content.includes('<h2 className="sidebar-section-title">');
  const hasAriaHidden = content.includes('aria-hidden="true"');
  const hasNavButton = content.includes('className="nav-button"');
  const hasBadge = content.includes('Nouveau') || content.includes('sidebar-module-badge');
  const hasHistoricalClass = content.includes('historical-module');
  
  console.log('✓ Structure correcte:', hasSection && hasHeader && hasH2 ? '✅' : '❌');
  console.log('✓ Accessibilité:', hasAriaHidden ? '✅' : '❌');
  console.log('✓ Navigation:', hasNavButton ? '✅' : '❌');
  console.log('✓ Pas de badge "Nouveau":', !hasBadge ? '✅' : '❌');
  console.log('✓ Pas de classe historical-module:', !hasHistoricalClass ? '✅' : '❌');
  console.log('');
});

console.log('=== RÉSUMÉ ===');
console.log('Tous les modules doivent avoir:');
console.log('- <section className="sidebar-section">');
console.log('- <header className="sidebar-section-header">');
console.log('- <h2 className="sidebar-section-title">');
console.log('- aria-hidden="true" sur les icônes');
console.log('- Bouton de navigation avec className="nav-button"');
console.log('- Aucun badge "Nouveau"');
console.log('- Aucune classe "historical-module"');