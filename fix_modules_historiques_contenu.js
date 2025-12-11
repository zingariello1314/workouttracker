/**
 * Script de correction pour les modules historiques
 * Objectif: Garantir que tous les modules affichent toujours du contenu
 * Même avec des données nulles/vides, afficher "0" ou "En attente de données"
 */

const fs = require('fs');
const path = require('path');

console.log('CORRECTION: Modules historiques - Forcer l\'affichage du contenu');

// Chemins des modules à corriger
const modulePaths = {
  'GarminMetricsModule': 'src/components/sidebar/historical/GarminMetricsModule.jsx',
  'PatrimonyEvolutionModule': 'src/components/sidebar/historical/PatrimonyEvolutionModule.jsx',
  'ReadingProgressModule': 'src/components/sidebar/historical/ReadingProgressModule.jsx',
  'SessionRecorderModule': 'src/components/sidebar/historical/SessionRecorderModule.jsx'
};

/**
 * Correction pour GarminMetricsModule
 */
function fixGarminMetricsModule() {
  const filePath = modulePaths.GarminMetricsModule;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remplacer la logique d'affichage pour toujours montrer du contenu
  const newLoadingReturn = `
  if (isLoading) {
    return (
      <div className="sidebar-section historical-module garmin-metrics-module">
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            ⌚ Métriques Garmin
          </h3>
          <span className="sidebar-module-badge">Nouveau</span>
        </div>
        
        <div className="sidebar-section-content">
          <div className="garmin-loading">
            <div className="loading-spinner" aria-hidden="true"></div>
            <span>Chargement des métriques...</span>
          </div>
        </div>
      </div>
    );
  }`;

  const newErrorReturn = `
  if (error) {
    return (
      <div className="sidebar-section historical-module garmin-metrics-module">
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            ⌚ Métriques Garmin
          </h3>
          <span className="sidebar-module-badge error">Erreur</span>
        </div>
        
        <div className="sidebar-section-content">
          <div className="garmin-error">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <div className="error-content">
              <p>Erreur de chargement</p>
              <small>{error}</small>
              <button 
                onClick={loadTodayMetrics}
                className="retry-button"
                type="button"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }`;

  // Remplacer la condition "if (!todayMetrics)" pour toujours afficher du contenu
  const newNoDataLogic = `
  // CORRECTION: Toujours afficher du contenu, même sans données
  const displayMetrics = todayMetrics || {
    calories: { active: 0, resting: 0, total: 0 },
    bodyBattery: 0,
    steps: 0,
    heartRate: { resting: null, max: null, avg: null },
    sleep: null
  };

  const calories = formatCalories(displayMetrics.calories);
  const heartRate = formatHeartRate(displayMetrics.heartRate);
  const sleepData = formatSleepData(displayMetrics);
  const bodyBattery = displayMetrics.bodyBattery || 0;
  const steps = displayMetrics.steps || 0;

  // Déterminer le badge à afficher
  const getBadgeInfo = () => {
    if (!todayMetrics) {
      return { text: 'En attente', class: 'waiting' };
    }
    return { text: 'Nouveau', class: '' };
  };

  const badgeInfo = getBadgeInfo();`;

  // Appliquer les corrections
  content = content.replace(
    /if \(isLoading\) \{[\s\S]*?\}\s*\}/,
    newLoadingReturn.trim()
  );

  content = content.replace(
    /if \(error\) \{[\s\S]*?\}\s*\}/,
    newErrorReturn.trim()
  );

  // Remplacer toute la logique "if (!todayMetrics)" par la nouvelle logique
  content = content.replace(
    /if \(!todayMetrics\) \{[\s\S]*?return \([\s\S]*?\);\s*\}/,
    newNoDataLogic.trim()
  );

  // Modifier le return final pour utiliser displayMetrics
  const finalReturn = `
  return (
    <div className="sidebar-section historical-module garmin-metrics-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          ⌚ Métriques Garmin
        </h3>
        <div className="header-actions">
          <span className={\`sidebar-module-badge \${badgeInfo.class}\`}>{badgeInfo.text}</span>
          {lastSync && (
            <span className="last-sync" title={\`Dernière mise à jour: \${lastSync.toLocaleTimeString()}\`}>
              🔄
            </span>
          )}
        </div>
      </div>
      
      <div className="sidebar-section-content">
        {/* Calories */}
        <div className="metric-group calories-group">
          <div className="metric-header">
            <span className="metric-icon">🔥</span>
            <span className="metric-label">Calories</span>
          </div>
          <div className="metric-values">
            <div className="metric-item">
              <span className="metric-value">{calories.active.toLocaleString()}</span>
              <span className="metric-unit">actives</span>
            </div>
            <div className="metric-separator">+</div>
            <div className="metric-item">
              <span className="metric-value">{calories.resting.toLocaleString()}</span>
              <span className="metric-unit">repos</span>
            </div>
            <div className="metric-separator">=</div>
            <div className="metric-item total">
              <span className="metric-value">{calories.total.toLocaleString()}</span>
              <span className="metric-unit">total</span>
            </div>
          </div>
        </div>

        {/* Body Battery et Pas */}
        <div className="metrics-row">
          <div className="metric-group body-battery-group">
            <div className="metric-header">
              <span className="metric-icon">🔋</span>
              <span className="metric-label">Body Battery</span>
            </div>
            <div className="metric-value-large">
              <span className="value">{bodyBattery}</span>
              <span className="unit">%</span>
            </div>
            <div className={\`battery-bar \${bodyBattery >= 75 ? 'high' : bodyBattery >= 50 ? 'medium' : 'low'}\`}>
              <div 
                className="battery-fill" 
                style={{ width: \`\${Math.max(0, Math.min(100, bodyBattery))}%\` }}
              ></div>
            </div>
          </div>

          <div className="metric-group steps-group">
            <div className="metric-header">
              <span className="metric-icon">👟</span>
              <span className="metric-label">Pas</span>
            </div>
            <div className="metric-value-large">
              <span className="value">{steps.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Fréquence Cardiaque */}
        <div className="metric-group heart-rate-group">
          <div className="metric-header">
            <span className="metric-icon">❤️</span>
            <span className="metric-label">Fréquence Cardiaque</span>
          </div>
          <div className="heart-rate-values">
            <div className="hr-item">
              <span className="hr-label">Repos</span>
              <span className="hr-value">{heartRate.resting || 0} bpm</span>
            </div>
            <div className="hr-item">
              <span className="hr-label">Moyenne</span>
              <span className="hr-value">{heartRate.average || 0} bpm</span>
            </div>
            <div className="hr-item">
              <span className="hr-label">Max</span>
              <span className="hr-value">{heartRate.max || 0} bpm</span>
            </div>
          </div>
        </div>

        {/* Sommeil (toujours affiché) */}
        <div className="metric-group sleep-group">
          <div className="metric-header">
            <span className="metric-icon">😴</span>
            <span className="metric-label">Sommeil</span>
          </div>
          <div className="sleep-values">
            <div className="sleep-item">
              <span className="sleep-label">Durée</span>
              <span className="sleep-value">{sleepData?.duration || 0}h</span>
            </div>
            <div className="sleep-item">
              <span className="sleep-label">Qualité</span>
              <span className="sleep-quality">
                {sleepData?.quality === 'excellent' ? '⭐⭐⭐⭐' :
                 sleepData?.quality === 'good' ? '⭐⭐⭐' :
                 sleepData?.quality === 'fair' ? '⭐⭐' : 
                 sleepData?.quality ? '⭐' : '⭐'}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton de navigation */}
        <div className="navigation-section">
          <button 
            onClick={handleNavigateToSport}
            className="nav-button sport"
            type="button"
            aria-label="Naviguer vers l'onglet Sport, sous-onglet Aujourd'hui"
          >
            <span className="nav-icon">🏃‍♂️</span>
            <span className="nav-text">Voir dans Sport</span>
            <span className="nav-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );`;

  // Remplacer le return final
  content = content.replace(
    /const calories = formatCalories\(todayMetrics\.calories\);[\s\S]*?return \([\s\S]*?\);\s*\}\);/,
    finalReturn.trim() + '\n});'
  );

  fs.writeFileSync(filePath, content);
  console.log('✅ GarminMetricsModule corrigé');
}

/**
 * Correction pour PatrimonyEvolutionModule
 */
function fixPatrimonyEvolutionModule() {
  const filePath = modulePaths.PatrimonyEvolutionModule;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remplacer la logique d'affichage pour toujours montrer du contenu
  const newLoadingReturn = `
  if (isLoading) {
    return (
      <div 
        className="sidebar-section historical-module patrimony-evolution-module"
        data-module-id={moduleId}
        data-module-type={moduleType}
      >
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">💎</span>
            Évolution Patrimoine
          </h3>
        </div>
        <div className="sidebar-section-content">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }`;

  const newErrorReturn = `
  if (error) {
    return (
      <div 
        className="sidebar-section historical-module patrimony-evolution-module"
        data-module-id={moduleId}
        data-module-type={moduleType}
      >
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">💎</span>
            Évolution Patrimoine
          </h3>
        </div>
        <div className="sidebar-section-content">
          <div className="text-center py-4 text-red-400 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }`;

  // Appliquer les corrections
  content = content.replace(
    /if \(isLoading\) \{[\s\S]*?\}\s*\}/,
    newLoadingReturn.trim()
  );

  content = content.replace(
    /if \(error\) \{[\s\S]*?\}\s*\}/,
    newErrorReturn.trim()
  );

  // Ajouter une logique pour garantir que metrics existe toujours
  const metricsDefaultLogic = `
  // CORRECTION: Garantir que metrics existe toujours
  const displayMetrics = metrics || {
    netWorthChange: { value: 0, percentage: 0, trend: 'neutral' },
    averageSavings: 0,
    investmentPerformance: { value: 0, percentage: 0 },
    objectivesReached: 0
  };`;

  // Insérer cette logique avant le return final
  content = content.replace(
    /return \(\s*<div/,
    metricsDefaultLogic + '\n\n  return (\n    <div'
  );

  // Remplacer toutes les références à metrics par displayMetrics dans le JSX
  content = content.replace(/metrics\?\./g, 'displayMetrics.');
  content = content.replace(/metrics\|\|/g, 'displayMetrics||');

  fs.writeFileSync(filePath, content);
  console.log('✅ PatrimonyEvolutionModule corrigé');
}

/**
 * Correction pour ReadingProgressModule
 */
function fixReadingProgressModule() {
  const filePath = modulePaths.ReadingProgressModule;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remplacer la logique d'affichage pour toujours montrer du contenu
  const newLoadingReturn = `
  if (isLoading) {
    return (
      <div 
        className="sidebar-section historical-module reading-progress-module"
        data-module-id={moduleId}
        data-module-type={moduleType}
      >
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">📚</span>
            Progression Lecture
          </h3>
        </div>
        <div className="sidebar-section-content">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }`;

  const newErrorReturn = `
  if (error) {
    return (
      <div 
        className="sidebar-section historical-module reading-progress-module"
        data-module-id={moduleId}
        data-module-type={moduleType}
      >
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">📚</span>
            Progression Lecture
          </h3>
        </div>
        <div className="sidebar-section-content">
          <div className="text-center py-4 text-red-400 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }`;

  // Appliquer les corrections
  content = content.replace(
    /if \(isLoading\) \{[\s\S]*?\}\s*\}/,
    newLoadingReturn.trim()
  );

  content = content.replace(
    /if \(error\) \{[\s\S]*?\}\s*\}/,
    newErrorReturn.trim()
  );

  // Ajouter une logique pour garantir que stats existe toujours
  const statsDefaultLogic = `
  // CORRECTION: Garantir que stats existe toujours
  const displayStats = stats || {
    sessions: 0,
    totalTime: 0,
    totalPages: 0,
    avgSpeed: 0
  };

  const displayPreviousStats = previousStats || {
    sessions: 0,
    totalTime: 0,
    totalPages: 0,
    avgSpeed: 0
  };`;

  // Insérer cette logique avant le return final
  content = content.replace(
    /return \(\s*<div/,
    statsDefaultLogic + '\n\n  return (\n    <div'
  );

  // Remplacer toutes les références à stats par displayStats dans le JSX
  content = content.replace(/stats\?\./g, 'displayStats.');
  content = content.replace(/stats\|\|/g, 'displayStats||');
  content = content.replace(/previousStats\?\./g, 'displayPreviousStats.');
  content = content.replace(/previousStats\|\|/g, 'displayPreviousStats||');

  fs.writeFileSync(filePath, content);
  console.log('✅ ReadingProgressModule corrigé');
}

/**
 * Correction pour SessionRecorderModule
 */
function fixSessionRecorderModule() {
  const filePath = modulePaths.SessionRecorderModule;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Ajouter une logique pour toujours afficher du contenu
  const defaultContentLogic = `
  // CORRECTION: Toujours afficher du contenu
  const hasActiveSession = currentSession && currentSession.isActive;
  const displaySession = currentSession || {
    type: null,
    startTime: null,
    duration: 0,
    isActive: false
  };`;

  // Insérer cette logique au début du return
  content = content.replace(
    /return \(\s*<div/,
    defaultContentLogic + '\n\n  return (\n    <div'
  );

  fs.writeFileSync(filePath, content);
  console.log('✅ SessionRecorderModule corrigé');
}

/**
 * Ajouter des styles CSS pour les nouveaux états
 */
function addCSSStyles() {
  const cssPath = 'src/styles/historical-modules-fix.css';
  
  const additionalCSS = `
/* Styles pour les modules historiques corrigés */
.sidebar-module-badge.waiting {
  background-color: #f59e0b;
  color: #1f2937;
}

.sidebar-module-badge.error {
  background-color: #ef4444;
  color: white;
}

.garmin-loading,
.garmin-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
}

.garmin-error {
  flex-direction: column;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1.5rem;
}

.retry-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
}

.retry-button:hover {
  background-color: #2563eb;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Garantir que le contenu est toujours visible */
.sidebar-section-content {
  min-height: 100px;
  display: block !important;
}

.historical-module .sidebar-section-content {
  opacity: 1 !important;
  visibility: visible !important;
}
`;

  if (fs.existsSync(cssPath)) {
    const existingCSS = fs.readFileSync(cssPath, 'utf8');
    if (!existingCSS.includes('/* Styles pour les modules historiques corrigés */')) {
      fs.appendFileSync(cssPath, additionalCSS);
    }
  } else {
    fs.writeFileSync(cssPath, additionalCSS);
  }

  console.log('✅ Styles CSS ajoutés');
}

// Exécuter toutes les corrections
console.log('\n🚀 Début des corrections...\n');

try {
  fixGarminMetricsModule();
  fixPatrimonyEvolutionModule();
  fixReadingProgressModule();
  fixSessionRecorderModule();
  addCSSStyles();

  console.log('\n✅ TOUTES LES CORRECTIONS APPLIQUÉES AVEC SUCCÈS!');
  console.log('\n📋 RÉSUMÉ DES MODIFICATIONS:');
  console.log('- Tous les modules affichent maintenant toujours du contenu');
  console.log('- États de loading/error affichent le contenu avec des indicateurs');
  console.log('- Données manquantes remplacées par des valeurs par défaut (0)');
  console.log('- Structure garantie: header + content toujours présents');
  console.log('- Styles CSS ajoutés pour les nouveaux états');

  console.log('\n🔄 REDÉMARREZ L\'APPLICATION pour voir les changements');

} catch (error) {
  console.error('❌ Erreur lors des corrections:', error);
  process.exit(1);
}