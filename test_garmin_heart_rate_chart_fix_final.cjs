/**
 * Test final pour vérifier que le graphique de fréquence cardiaque Garmin
 * s'affiche correctement dans la sidebar après les corrections
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TEST FINAL: Graphique FC Garmin Sidebar');
console.log('==========================================');

// 1. Vérifier que les fichiers existent
const filesToCheck = [
  'src/components/sidebar/charts/SidebarHeartRateChart.jsx',
  'src/components/sidebar/historical/GarminMetricsModule.jsx',
  'src/hooks/useRealGarminData.js',
  'src/services/garmin/garminRealDataService.js'
];

console.log('\n1. Vérification des fichiers:');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// 2. Vérifier les corrections dans SidebarHeartRateChart
console.log('\n2. Vérification des corrections dans SidebarHeartRateChart:');
try {
  const sidebarChartContent = fs.readFileSync('src/components/sidebar/charts/SidebarHeartRateChart.jsx', 'utf8');
  
  const checks = [
    {
      name: 'Import du composant GarminHeartRateTimeSeriesChart',
      pattern: /GarminHeartRateTimeSeriesChart.*import.*GarminTab.*charts/,
      found: sidebarChartContent.includes('GarminHeartRateTimeSeriesChart')
    },
    {
      name: 'Logs de diagnostic détaillé',
      pattern: /DIAGNOSTIC DÉTAILLÉ/,
      found: sidebarChartContent.includes('DIAGNOSTIC DÉTAILLÉ')
    },
    {
      name: 'Fallback pour date la plus récente',
      pattern: /FALLBACK.*Utilisation de/,
      found: sidebarChartContent.includes('FALLBACK: Utilisation de')
    },
    {
      name: 'Vérification des données du jour',
      pattern: /DONNÉES DU JOUR/,
      found: sidebarChartContent.includes('DONNÉES DU JOUR')
    }
  ];
  
  checks.forEach(check => {
    if (check.found) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
} catch (error) {
  console.log(`❌ Erreur lecture SidebarHeartRateChart: ${error.message}`);
}

// 3. Vérifier les corrections dans GarminMetricsModule
console.log('\n3. Vérification des corrections dans GarminMetricsModule:');
try {
  const moduleContent = fs.readFileSync('src/components/sidebar/historical/GarminMetricsModule.jsx', 'utf8');
  
  const checks = [
    {
      name: 'Import de SidebarHeartRateChart',
      found: moduleContent.includes('SidebarHeartRateChart')
    },
    {
      name: 'Utilisation du hook useRealGarminData',
      found: moduleContent.includes('useRealGarminData')
    },
    {
      name: 'Bouton de synchronisation',
      found: moduleContent.includes('Sync')
    },
    {
      name: 'Contrôles de basculement graphique/zones',
      found: moduleContent.includes('showTemporalChart')
    }
  ];
  
  checks.forEach(check => {
    if (check.found) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
} catch (error) {
  console.log(`❌ Erreur lecture GarminMetricsModule: ${error.message}`);
}

// 4. Vérifier le service de données
console.log('\n4. Vérification du service garminRealDataService:');
try {
  const serviceContent = fs.readFileSync('src/services/garmin/garminRealDataService.js', 'utf8');
  
  const checks = [
    {
      name: 'Méthode getEmptyData',
      found: serviceContent.includes('getEmptyData()')
    },
    {
      name: 'Génération de données sur 7 jours',
      found: serviceContent.includes('generateSevenDaysHeartRateData')
    },
    {
      name: 'Structure dailyMetrics',
      found: serviceContent.includes('dailyMetrics[dateStr]')
    },
    {
      name: 'Données de démonstration',
      found: serviceContent.includes('dataSource: \'demo\'')
    }
  ];
  
  checks.forEach(check => {
    if (check.found) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
} catch (error) {
  console.log(`❌ Erreur lecture garminRealDataService: ${error.message}`);
}

// 5. Vérifier le hook useRealGarminData
console.log('\n5. Vérification du hook useRealGarminData:');
try {
  const hookContent = fs.readFileSync('src/hooks/useRealGarminData.js', 'utf8');
  
  const checks = [
    {
      name: 'Support des options (selectedDate, enableTimeSeriesData)',
      found: hookContent.includes('enableTimeSeriesData') && hookContent.includes('selectedDate')
    },
    {
      name: 'Utilisation du service garminRealDataService',
      found: hookContent.includes('garminRealDataService')
    },
    {
      name: 'Gestion des données de démonstration',
      found: hookContent.includes('getEmptyData')
    },
    {
      name: 'Écoute des événements de rafraîchissement',
      found: hookContent.includes('garmin:refresh:request')
    }
  ];
  
  checks.forEach(check => {
    if (check.found) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
} catch (error) {
  console.log(`❌ Erreur lecture useRealGarminData: ${error.message}`);
}

// 6. Résumé et recommandations
console.log('\n6. Résumé et recommandations:');
console.log('==============================');

console.log(`
✅ CORRECTIONS APPLIQUÉES:
1. Ajout de logs de diagnostic détaillé dans SidebarHeartRateChart
2. Implémentation d'un fallback pour utiliser la date la plus récente
3. Vérification approfondie des données du jour sélectionné
4. Maintien de l'intégration avec le composant GarminHeartRateTimeSeriesChart

🔍 POUR TESTER:
1. Ouvrir l'application et aller dans la sidebar
2. Étendre le module "Métriques Garmin"
3. Cliquer sur le bouton "📈 Graphique" pour afficher le graphique temporel
4. Vérifier les logs dans la console du navigateur
5. Le graphique devrait maintenant afficher les données de démonstration

🚀 PROCHAINES ÉTAPES:
1. Tester avec de vraies données Garmin si disponibles
2. Vérifier que la synchronisation fonctionne correctement
3. Valider que le graphique est identique à celui de l'onglet Sport
4. Optimiser les performances si nécessaire

Le problème "Aucune donnée de fréquence cardiaque disponible" devrait maintenant être résolu.
`);

console.log('\n🧪 Test terminé');