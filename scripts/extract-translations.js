/**
 * ✅ PHASE 4.2 : Script d'Extraction Automatique des Clés de Traduction
 * 
 * Performance :
 * - Parcourt récursivement tous les fichiers .jsx et .js
 * - Extraction intelligente des clés (supporte t('key'), t('key', fallback), t('key', fallback, params))
 * - Organisation par namespace pour faciliter la maintenance
 * - Génération de templates JSON organisés
 * 
 * Architecture :
 * - Utilise fs/promises pour les opérations asynchrones
 * - Support des modules ES (type: "module")
 * - Détection automatique des namespaces depuis les clés
 * - Génération de fichiers de template par namespace
 * 
 * @module scripts/extract-translations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Extrait toutes les clés de traduction depuis un fichier
 * Supporte plusieurs formats :
 * - t('key')
 * - t('key', 'fallback')
 * - t('key', 'fallback', { params })
 * - t('key', { params })
 * 
 * @param {string} filePath - Chemin du fichier
 * @param {string} content - Contenu du fichier
 * @returns {Set<string>} Set de clés de traduction trouvées
 */
const extractKeys = (filePath, content) => {
  const keys = new Set();
  
  // Pattern 1: t('key') ou t("key")
  // Pattern 2: t('key', ...) ou t("key", ...)
  // Supporte les guillemets simples et doubles
  const patterns = [
    // t('key') ou t("key")
    /t\(['"]([^'"]+)['"]\)/g,
    // t('key', ...) ou t("key", ...)
    /t\(['"]([^'"]+)['"]\s*,/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      // Ignorer les clés vides ou invalides
      if (key && key.trim().length > 0) {
        keys.add(key.trim());
      }
    }
  });
  
  return keys;
};

/**
 * Parcourt récursivement un répertoire et extrait les clés de tous les fichiers .jsx et .js
 * @param {string} dirPath - Chemin du répertoire
 * @param {Set<string>} allKeys - Set pour accumuler toutes les clés
 * @returns {Promise<void>}
 */
const scanDirectory = async (dirPath, allKeys) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Ignorer node_modules, dist, .git, etc.
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === 'coverage') {
        continue;
      }
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, allKeys);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const keys = extractKeys(fullPath, content);
          keys.forEach(key => allKeys.add(key));
        } catch (error) {
          console.warn(`⚠️  Erreur lors de la lecture de ${fullPath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Erreur lors du scan de ${dirPath}:`, error.message);
  }
};

/**
 * Organise les clés par namespace
 * @param {Set<string>} allKeys - Toutes les clés extraites
 * @returns {Object} Objet avec namespaces comme clés et arrays de clés comme valeurs
 */
const organizeByNamespace = (allKeys) => {
  const organized = {};
  const knownNamespaces = [
    'nav',
    'home',
    'settings',
    'common',
    'justification',
    'calendar',
    'stats',
    'today',
    'general',
    'exercises',
    'dataEntry',
    'program',
    'exercisesTab',
    'endurance',
    'progress',
    'history',
    'charts',
    'nutrition',
    'garmin',
    'bodyTracking',
    'nutritionAnalyses',
    'messages'
  ];
  
  allKeys.forEach(key => {
    const parts = key.split('.');
    const firstPart = parts[0];
    
    if (knownNamespaces.includes(firstPart)) {
      // Clé avec namespace connu
      const namespace = firstPart;
      const namespaceKey = parts.slice(1).join('.');
      
      if (!organized[namespace]) {
        organized[namespace] = [];
      }
      
      if (namespaceKey) {
        organized[namespace].push(namespaceKey);
      }
    } else {
      // Clé sans namespace (ancien système ou namespace inconnu)
      if (!organized['_legacy']) {
        organized['_legacy'] = [];
      }
      organized['_legacy'].push(key);
    }
  });
  
  // Trier les clés dans chaque namespace
  Object.keys(organized).forEach(namespace => {
    organized[namespace].sort();
  });
  
  return organized;
};

/**
 * Génère un template JSON pour un namespace
 * @param {string[]} keys - Clés du namespace
 * @param {string} namespace - Nom du namespace
 * @returns {string} JSON formaté
 */
const generateNamespaceTemplate = (keys, namespace) => {
  if (keys.length === 0) {
    return '{}';
  }
  
  // Organiser les clés en structure imbriquée
  const structure = {};
  
  keys.forEach(key => {
    const parts = key.split('.');
    let current = structure;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = '';
  });
  
  // Convertir en JSON formaté
  return JSON.stringify(structure, null, 2);
};

/**
 * Fonction principale
 */
const main = async () => {
  console.log('🔍 Extraction des clés de traduction...\n');
  
  const allKeys = new Set();
  const srcPath = path.join(PROJECT_ROOT, 'src');
  
  // Scanner récursivement le dossier src
  await scanDirectory(srcPath, allKeys);
  
  console.log(`✅ ${allKeys.size} clés uniques trouvées\n`);
  
  // Organiser par namespace
  const organized = organizeByNamespace(allKeys);
  
  // Afficher le résumé
  console.log('📊 Répartition par namespace :');
  Object.keys(organized).sort().forEach(namespace => {
    const count = organized[namespace].length;
    console.log(`   ${namespace}: ${count} clé${count > 1 ? 's' : ''}`);
  });
  console.log('');
  
  // Créer le dossier de sortie si nécessaire
  const outputDir = path.join(PROJECT_ROOT, 'src', 'utils', 'translations', 'templates');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Générer un fichier de template pour chaque namespace
  for (const [namespace, keys] of Object.entries(organized)) {
    const template = generateNamespaceTemplate(keys, namespace);
    const outputPath = path.join(outputDir, `${namespace}.json`);
    
    await fs.writeFile(outputPath, template, 'utf-8');
    console.log(`✅ Template généré: ${outputPath}`);
  }
  
  // Générer un fichier récapitulatif avec toutes les clés
  const allKeysArray = Array.from(allKeys).sort();
  const summary = {
    total: allKeysArray.length,
    extractedAt: new Date().toISOString(),
    keys: allKeysArray,
    byNamespace: Object.keys(organized).reduce((acc, ns) => {
      acc[ns] = organized[ns].length;
      return acc;
    }, {})
  };
  
  const summaryPath = path.join(outputDir, 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\n✅ Résumé généré: ${summaryPath}`);
  
  console.log(`\n✨ Extraction terminée ! ${allKeys.size} clés extraites et organisées.`);
};

// Exécuter le script
main().catch(error => {
  console.error('❌ Erreur lors de l\'extraction:', error);
  process.exit(1);
});





