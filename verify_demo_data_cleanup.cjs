#!/usr/bin/env node

/**
 * Script de vérification de la suppression des données de démonstration
 * Vérifie que toutes les données de démo ont été supprimées chirurgicalement
 */

const fs = require('fs');
const path = require('path');

const MODULES_DIR = 'src/components/sidebar/historical';

// Patterns à rechercher (qui ne devraient plus exister)
const DEMO_PATTERNS = [
  /DONNÉES DE DÉMONSTRATION/i,
  /données de démonstration/i,
  /demoData\s*=/,
  /demoProjects\s*=/,
  /demoSessions\s*=/,
  /demoMetrics\s*=/,
  /Clean Code.*Robert Martin/,
  /The Pragmatic Programmer.*Hunt/,
  /netWorth.*45230/,
  /monthlyBudget.*3500/,
  /todayCalories.*2200/,
  /weeklyWorkouts.*3/
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  DEMO_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        pattern: pattern.toString(),
        match: matches[0],
        line: content.substring(0, content.indexOf(matches[0])).split('\n').length
      });
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Vérification de la suppression des données de démonstration...\n');
  
  const moduleFiles = fs.readdirSync(MODULES_DIR)
    .filter(file => file.endsWith('.jsx'))
    .map(file => path.join(MODULES_DIR, file));
  
  let totalIssues = 0;
  let cleanFiles = 0;
  
  moduleFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const issues = checkFile(filePath);
    
    if (issues.length === 0) {
      console.log(`✅ ${fileName} - Propre`);
      cleanFiles++;
    } else {
      console.log(`❌ ${fileName} - ${issues.length} problème(s) détecté(s):`);
      issues.forEach(issue => {
        console.log(`   Ligne ${issue.line}: ${issue.match}`);
      });
      totalIssues += issues.length;
    }
  });
  
  console.log('\n📊 Résumé:');
  console.log(`   Fichiers vérifiés: ${moduleFiles.length}`);
  console.log(`   Fichiers propres: ${cleanFiles}`);
  console.log(`   Problèmes détectés: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 Suppression chirurgicale réussie !');
    console.log('   Toutes les données de démonstration ont été supprimées.');
    console.log('   Les modules utilisent maintenant uniquement les vraies données.');
  } else {
    console.log('\n⚠️  Suppression incomplète');
    console.log('   Certaines données de démonstration sont encore présentes.');
  }
  
  return totalIssues === 0;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main, checkFile };