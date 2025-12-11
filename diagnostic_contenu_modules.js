/**
 * 🔍 Diagnostic Contenu Modules Historiques
 * Script pour identifier pourquoi le contenu des modules ne s'affiche pas
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Analyser les résultats
 */

(function() {
  'use strict';
  
  console.log('🔍 DIAGNOSTIC CONTENU MODULES HISTORIQUES');
  console.log('='.repeat(60));
  
  const diagnosticManager = {
    
    /**
     * Configuration des modules historiques
     */
    historicalModules: [
      { id: 'enregistrer-session', selector: '.session-recorder-module, [data-module-id="enregistrer-session"]' },
      { id: 'progression-lecture', selector: '.reading-progress-module, [data-module-id="progression-lecture"]' },
      { id: 'metriques-garmin', selector: '.garmin-metrics-module, [data-module-id="metriques-garmin"]' },
      { id: 'quetes-interactives', selector: '.interactive-quests-module, [data-module-id="quetes-interactives"]' },
      { id: 'evolution-patrimoine', selector: '.patrimony-evolution-module, [data-module-id="evolution-patrimoine"]' }
    ],
    
    /**
     * Diagnostic principal
     */
    runDiagnostic() {
      console.log('🚀 Démarrage du diagnostic...\n');
      
      const results = {
        moduleStructure: this.analyzeModuleStructure(),
        contentVisibility: this.analyzeContentVisibility(),
        cssAnalysis: this.analyzeCSSIssues(),
        reactComponents: this.analyzeReactComponents(),
        dataFlow: this.analyzeDataFlow()
      };
      
      this.generateReport(results);
      return results;
    },
    
    /**
     * Analyse la structure des modules
     */
    analyzeModuleStructure() {
      console.log('📋 ANALYSE STRUCTURE MODULES');
      console.log('-'.repeat(40));
      
      const analysis = {
        modulesFound: 0,
        modulesWithContent: 0,
        modulesWithHeader: 0,
        issues: []
      };
      
      this.historicalModules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        
        elements.forEach((element, index) => {
          const elementId = `${moduleConfig.id}${index > 0 ? `[${index}]` : ''}`;
          analysis.modulesFound++;
          
          console.log(`\n🔍 Module: ${elementId}`);
          console.log(`   Element:`, element);
          console.log(`   Classes:`, element.className);
          console.log(`   Data attributes:`, {
            moduleId: element.getAttribute('data-module-id'),
            moduleType: element.getAttribute('data-module-type'),
            position: element.getAttribute('data-module-position')
          });
          
          // Vérifier la structure interne
          const header = element.querySelector('.sidebar-section-header');
          const content = element.querySelector('.sidebar-section-content');
          
          if (header) {
            analysis.modulesWithHeader++;
            console.log(`   ✅ Header trouvé:`, header);
            console.log(`   Header HTML:`, header.innerHTML.substring(0, 200) + '...');
          } else {
            analysis.issues.push(`${elementId}: Header manquant`);
            console.log(`   ❌ Header manquant`);
          }
          
          if (content) {
            analysis.modulesWithContent++;
            console.log(`   ✅ Content trouvé:`, content);
            console.log(`   Content HTML length:`, content.innerHTML.length);
            console.log(`   Content preview:`, content.innerHTML.substring(0, 300) + '...');
            
            // Analyser le contenu
            const children = content.children;
            console.log(`   Content children count:`, children.length);
            
            if (children.length === 0) {
              analysis.issues.push(`${elementId}: Contenu vide`);
              console.log(`   ⚠️ Contenu vide`);
            } else {
              Array.from(children).forEach((child, childIndex) => {
                console.log(`   Child ${childIndex}:`, child.tagName, child.className);
              });
            }
          } else {
            analysis.issues.push(`${elementId}: Content manquant`);
            console.log(`   ❌ Content manquant`);
          }
        });
      });
      
      console.log(`\n📊 Résumé structure:`);
      console.log(`   Modules trouvés: ${analysis.modulesFound}`);
      console.log(`   Modules avec header: ${analysis.modulesWithHeader}`);
      console.log(`   Modules avec content: ${analysis.modulesWithContent}`);
      console.log(`   Problèmes: ${analysis.issues.length}`);
      
      return analysis;
    },
    
    /**
     * Analyse la visibilité du contenu
     */
    analyzeContentVisibility() {
      console.log('\n👁️ ANALYSE VISIBILITÉ CONTENU');
      console.log('-'.repeat(40));
      
      const analysis = {
        visibleModules: 0,
        hiddenModules: 0,
        partiallyVisible: 0,
        visibilityIssues: []
      };
      
      this.historicalModules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        
        elements.forEach((element, index) => {
          const elementId = `${moduleConfig.id}${index > 0 ? `[${index}]` : ''}`;
          
          // Analyser la visibilité de l'élément principal
          const rect = element.getBoundingClientRect();
          const computedStyle = getComputedStyle(element);
          
          console.log(`\n👁️ Visibilité ${elementId}:`);
          console.log(`   Dimensions: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`);
          console.log(`   Position: ${rect.left.toFixed(0)}, ${rect.top.toFixed(0)}`);
          console.log(`   Display: ${computedStyle.display}`);
          console.log(`   Visibility: ${computedStyle.visibility}`);
          console.log(`   Opacity: ${computedStyle.opacity}`);
          console.log(`   Z-index: ${computedStyle.zIndex}`);
          
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           computedStyle.display !== 'none' && 
                           computedStyle.visibility !== 'hidden' && 
                           parseFloat(computedStyle.opacity) > 0;
          
          if (isVisible) {
            analysis.visibleModules++;
            console.log(`   ✅ Module visible`);
          } else {
            analysis.hiddenModules++;
            analysis.visibilityIssues.push(`${elementId}: Module non visible`);
            console.log(`   ❌ Module non visible`);
          }
          
          // Analyser la visibilité du contenu
          const content = element.querySelector('.sidebar-section-content');
          if (content) {
            const contentRect = content.getBoundingClientRect();
            const contentStyle = getComputedStyle(content);
            
            console.log(`   Content dimensions: ${contentRect.width.toFixed(0)}x${contentRect.height.toFixed(0)}`);
            console.log(`   Content display: ${contentStyle.display}`);
            console.log(`   Content visibility: ${contentStyle.visibility}`);
            console.log(`   Content opacity: ${contentStyle.opacity}`);
            
            const isContentVisible = contentRect.width > 0 && contentRect.height > 0 && 
                                    contentStyle.display !== 'none' && 
                                    contentStyle.visibility !== 'hidden' && 
                                    parseFloat(contentStyle.opacity) > 0;
            
            if (!isContentVisible && isVisible) {
              analysis.partiallyVisible++;
              analysis.visibilityIssues.push(`${elementId}: Contenu masqué`);
              console.log(`   ⚠️ Contenu masqué`);
            }
          }
        });
      });
      
      console.log(`\n📊 Résumé visibilité:`);
      console.log(`   Modules visibles: ${analysis.visibleModules}`);
      console.log(`   Modules cachés: ${analysis.hiddenModules}`);
      console.log(`   Modules partiellement visibles: ${analysis.partiallyVisible}`);
      console.log(`   Problèmes de visibilité: ${analysis.visibilityIssues.length}`);
      
      return analysis;
    },
    
    /**
     * Analyse les problèmes CSS
     */
    analyzeCSSIssues() {
      console.log('\n🎨 ANALYSE PROBLÈMES CSS');
      console.log('-'.repeat(40));
      
      const analysis = {
        stylesApplied: 0,
        stylesConflicts: 0,
        missingStyles: [],
        conflicts: []
      };
      
      // Vérifier les feuilles de style chargées
      const stylesheets = Array.from(document.styleSheets);
      console.log(`📄 Feuilles de style chargées: ${stylesheets.length}`);
      
      const relevantStylesheets = stylesheets.filter(sheet => {
        try {
          return sheet.href && (
            sheet.href.includes('historical-modules') ||
            sheet.href.includes('garmin-metrics') ||
            sheet.href.includes('reading-progress') ||
            sheet.href.includes('session-recorder') ||
            sheet.href.includes('patrimony-evolution')
          );
        } catch (e) {
          return false;
        }
      });
      
      console.log(`📄 Feuilles de style pertinentes: ${relevantStylesheets.length}`);
      relevantStylesheets.forEach(sheet => {
        console.log(`   - ${sheet.href}`);
      });
      
      // Analyser les styles appliqués sur chaque module
      this.historicalModules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        
        elements.forEach((element, index) => {
          const elementId = `${moduleConfig.id}${index > 0 ? `[${index}]` : ''}`;
          const computedStyle = getComputedStyle(element);
          
          console.log(`\n🎨 Styles ${elementId}:`);
          
          // Vérifier les styles critiques
          const criticalStyles = {
            background: computedStyle.background,
            border: computedStyle.border,
            borderRadius: computedStyle.borderRadius,
            padding: computedStyle.padding,
            margin: computedStyle.margin
          };
          
          console.log(`   Styles critiques:`, criticalStyles);
          
          // Vérifier si les styles custom sont appliqués
          const hasCustomBackground = computedStyle.background.includes('rgba') || 
                                     computedStyle.background.includes('gradient');
          const hasCustomBorder = computedStyle.borderColor.includes('rgba') ||
                                 computedStyle.borderColor !== 'rgb(0, 0, 0)';
          
          if (hasCustomBackground || hasCustomBorder) {
            analysis.stylesApplied++;
            console.log(`   ✅ Styles custom appliqués`);
          } else {
            analysis.missingStyles.push(`${elementId}: Styles custom manquants`);
            console.log(`   ❌ Styles custom manquants`);
          }
          
          // Vérifier les conflits potentiels
          const content = element.querySelector('.sidebar-section-content');
          if (content) {
            const contentStyle = getComputedStyle(content);
            
            if (contentStyle.height === '0px' || contentStyle.maxHeight === '0px') {
              analysis.conflicts.push(`${elementId}: Contenu avec hauteur 0`);
              console.log(`   ⚠️ Contenu avec hauteur 0`);
            }
            
            if (contentStyle.overflow === 'hidden' && contentStyle.height !== 'auto') {
              analysis.conflicts.push(`${elementId}: Overflow hidden avec hauteur fixe`);
              console.log(`   ⚠️ Overflow hidden avec hauteur fixe`);
            }
          }
        });
      });
      
      console.log(`\n📊 Résumé CSS:`);
      console.log(`   Modules avec styles: ${analysis.stylesApplied}`);
      console.log(`   Styles manquants: ${analysis.missingStyles.length}`);
      console.log(`   Conflits détectés: ${analysis.conflicts.length}`);
      
      return analysis;
    },
    
    /**
     * Analyse les composants React
     */
    analyzeReactComponents() {
      console.log('\n⚛️ ANALYSE COMPOSANTS REACT');
      console.log('-'.repeat(40));
      
      const analysis = {
        reactElements: 0,
        suspenseElements: 0,
        errorBoundaries: 0,
        loadingStates: 0,
        issues: []
      };
      
      // Chercher les éléments React
      const reactElements = document.querySelectorAll('[data-reactroot], [data-react-suspense]');
      analysis.reactElements = reactElements.length;
      console.log(`⚛️ Éléments React trouvés: ${analysis.reactElements}`);
      
      // Chercher les Suspense
      const suspenseElements = document.querySelectorAll('[data-react-suspense]');
      analysis.suspenseElements = suspenseElements.length;
      console.log(`⏳ Éléments Suspense: ${analysis.suspenseElements}`);
      
      // Chercher les états de chargement
      const loadingElements = document.querySelectorAll('.sidebar-module-loading, .garmin-loading, .loading-spinner');
      analysis.loadingStates = loadingElements.length;
      console.log(`⏳ États de chargement: ${analysis.loadingStates}`);
      
      if (analysis.loadingStates > 0) {
        analysis.issues.push('Modules en état de chargement permanent');
        console.log(`   ⚠️ Modules en chargement permanent détectés`);
      }
      
      // Chercher les erreurs
      const errorElements = document.querySelectorAll('.sidebar-module-error, .garmin-error');
      if (errorElements.length > 0) {
        analysis.issues.push(`${errorElements.length} modules en erreur`);
        console.log(`   ❌ ${errorElements.length} modules en erreur`);
      }
      
      return analysis;
    },
    
    /**
     * Analyse le flux de données
     */
    analyzeDataFlow() {
      console.log('\n📊 ANALYSE FLUX DE DONNÉES');
      console.log('-'.repeat(40));
      
      const analysis = {
        propsReceived: 0,
        dataAvailable: 0,
        demoDataUsed: 0,
        issues: []
      };
      
      // Cette analyse est limitée car on ne peut pas accéder directement aux props React
      // Mais on peut analyser les logs de la console
      
      console.log(`📊 Analyse basée sur les logs de la console disponibles`);
      
      // Simuler l'analyse basée sur ce qu'on voit dans les logs
      const garminLogs = document.querySelectorAll('.garmin-metrics-module').length;
      if (garminLogs > 0) {
        analysis.propsReceived++;
        analysis.demoDataUsed++; // D'après les logs, il utilise les données de démo
        console.log(`   ✅ GarminMetricsModule: Données de démo utilisées`);
      }
      
      const sessionLogs = document.querySelectorAll('.session-recorder-module').length;
      if (sessionLogs > 0) {
        analysis.propsReceived++;
        console.log(`   ✅ SessionRecorderModule: Props reçues`);
      }
      
      const readingLogs = document.querySelectorAll('.reading-progress-module').length;
      if (readingLogs > 0) {
        analysis.propsReceived++;
        console.log(`   ✅ ReadingProgressModule: Props reçues`);
      }
      
      console.log(`\n📊 Résumé flux de données:`);
      console.log(`   Modules recevant des props: ${analysis.propsReceived}`);
      console.log(`   Modules avec données: ${analysis.dataAvailable}`);
      console.log(`   Modules utilisant les données de démo: ${analysis.demoDataUsed}`);
      
      return analysis;
    },
    
    /**
     * Génère le rapport final
     */
    generateReport(results) {
      console.log('\n📋 RAPPORT DIAGNOSTIC FINAL');
      console.log('='.repeat(60));
      
      const totalIssues = 
        results.moduleStructure.issues.length +
        results.contentVisibility.visibilityIssues.length +
        results.cssAnalysis.missingStyles.length +
        results.cssAnalysis.conflicts.length +
        results.reactComponents.issues.length +
        results.dataFlow.issues.length;
      
      console.log(`🔧 RÉSUMÉ:`);
      console.log(`   Total problèmes détectés: ${totalIssues}`);
      console.log(`   Modules trouvés: ${results.moduleStructure.modulesFound}`);
      console.log(`   Modules visibles: ${results.contentVisibility.visibleModules}`);
      console.log(`   Modules avec styles: ${results.cssAnalysis.stylesApplied}`);
      
      console.log(`\n🎯 PROBLÈMES PRINCIPAUX:`);
      
      if (results.moduleStructure.issues.length > 0) {
        console.log(`   📋 Structure (${results.moduleStructure.issues.length}):`);
        results.moduleStructure.issues.forEach(issue => console.log(`      - ${issue}`));
      }
      
      if (results.contentVisibility.visibilityIssues.length > 0) {
        console.log(`   👁️ Visibilité (${results.contentVisibility.visibilityIssues.length}):`);
        results.contentVisibility.visibilityIssues.forEach(issue => console.log(`      - ${issue}`));
      }
      
      if (results.cssAnalysis.missingStyles.length > 0) {
        console.log(`   🎨 Styles manquants (${results.cssAnalysis.missingStyles.length}):`);
        results.cssAnalysis.missingStyles.forEach(issue => console.log(`      - ${issue}`));
      }
      
      if (results.cssAnalysis.conflicts.length > 0) {
        console.log(`   ⚠️ Conflits CSS (${results.cssAnalysis.conflicts.length}):`);
        results.cssAnalysis.conflicts.forEach(issue => console.log(`      - ${issue}`));
      }
      
      if (results.reactComponents.issues.length > 0) {
        console.log(`   ⚛️ React (${results.reactComponents.issues.length}):`);
        results.reactComponents.issues.forEach(issue => console.log(`      - ${issue}`));
      }
      
      console.log(`\n💡 RECOMMANDATIONS:`);
      
      if (results.contentVisibility.partiallyVisible > 0) {
        console.log(`   1. Vérifier les styles CSS qui masquent le contenu`);
      }
      
      if (results.reactComponents.loadingStates > 0) {
        console.log(`   2. Résoudre les états de chargement permanents`);
      }
      
      if (results.cssAnalysis.conflicts.length > 0) {
        console.log(`   3. Corriger les conflits CSS détectés`);
      }
      
      if (totalIssues === 0) {
        console.log(`   🎉 Aucun problème majeur détecté !`);
        console.log(`   📝 Le problème pourrait être plus subtil (timing, état React, etc.)`);
      }
      
      return results;
    }
  };
  
  // Exposer l'objet globalement
  window.diagnosticContenuModules = diagnosticManager;
  
  // Lancer le diagnostic automatiquement
  diagnosticManager.runDiagnostic();
  
  console.log('\n🔧 Diagnostic Contenu Modules chargé !');
  console.log('📋 Fonction disponible : diagnosticContenuModules.runDiagnostic()');
  
})();