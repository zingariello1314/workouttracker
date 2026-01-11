/**
 * Script pour corriger les warnings Three.js
 * 
 * Ce script nettoie le cache Vite et force la re-optimisation
 * pour résoudre les conflits de versions Three.js.
 * 
 * Usage: node scripts/fix-three-warnings.js
 */

import { rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🧹 Nettoyage du cache Vite pour corriger les warnings Three.js...\n');

try {
  // Supprimer le cache Vite
  const cacheDir = join(rootDir, 'node_modules', '.vite');
  rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Cache Vite supprimé');
  
  console.log('\n📦 Prochaines étapes:');
  console.log('1. Redémarrer le serveur de développement (npm run dev)');
  console.log('2. Vérifier que les warnings Three.js ont disparu');
  console.log('3. Si les warnings persistent, décommenter "force: true" dans vite.config.js\n');
  
} catch (error) {
  console.error('❌ Erreur lors du nettoyage:', error.message);
  process.exit(1);
}
