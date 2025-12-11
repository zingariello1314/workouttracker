/**
 * 🔧 Diagnostic CSS pour les modules historiques de la sidebar
 * À exécuter dans la console du navigateur (F12)
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Utiliser les fonctions disponibles :
 *    - diagnosticModules.runFullDiagnostic()
 *    - diagnosticModules.checkModule('.garmin-metrics-module')
 *    - diagnosticModules.compareWithOldModules()
 */

(function() {
  'use strict';

  const diagnosticModules = {
    
    /**
     * Diagnostic complet de tous les modules historiques
     */
    runFullDiagnostic() {
      console.log('🔍 DIAGNOSTIC COMPLET DES MODULES HISTORIQUES');
      console.log('='.repeat(50));
      
      const results = {
        timestamp: new Date().toISOString(),
        modules: {},
        summary: {
          total: 0,
          working: 0,
          issues: 0
        }
      };
      
      // Modules historiques à tester
      const historicalModules = [
        '.garmin-metrics-module',
        '.session-recorder-module', 
        '.reading-progress-module',
        '.patrimony-evolution-module'
      ];
      
      historicalModules.forEach(selector => {
        const moduleResult = this.checkModule(selector);
        results.modules[selector] = moduleResult;
        results.summary.total++;
        
        if (moduleResult.status === 'OK') {
          results.summary.working++;
        } else {
          results.summary.issues++;
        }
      });
      
      // Affichage du résumé
      console.log(`📊 RÉSUMÉ:`);
      console.log(`   Total: ${results.summary.total} modules`);
      console.log(`   ✅ Fonctionnels: ${results.summary.working}`);
      console.log(`   ⚠️ Problèmes: ${results.summary.issues}`);
      console.log('');
      
      // Affichage détaillé
      Object.entries(results.modules).forEach(([selector, result]) => {
        const status = result.status === 'OK' ? '✅' : '❌';
        console.log(`${status} ${selector}:`);
        console.log(`   Visible: ${result.visible ? '✅' : '❌'}`);
        console.log(`   Hauteur: ${result.dimensions.height}px`);
        console.log(`   Background: ${result.styles.hasCorrectBackground ? '✅' : '❌'}`);
        console.log(`   Border: ${result.styles.hasCorrectBorder ? '✅' : '❌'}`);
        
        if (result.issues.length > 0) {
          console.log(`   🚨 Problèmes: ${result.issues.join(', ')}`);
        }
        console.log('');
      });
      
      return results;
    },
    
    /**
     * Diagnostic d'un module spécifique
     */
    checkModule(selector) {
      const element = document.querySelector(selector);
      
      if (!element) {
        return {
          status: 'NOT_FOUND',
          selector,
          issues: ['Module non trouvé dans le DOM']
        };
      }
      
      const styles = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      const result = {
        status: 'OK',
        selector,
        visible: this.isVisible(element),
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        styles: {
          display: styles.display,
          visibility: styles.visibility,
          background: styles.background,
          border: styles.border,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          margin: styles.margin,
          hasCorrectBackground: this.checkBackground(styles.background),
          hasCorrectBorder: this.checkBorder(styles.border),
          hasCorrectRadius: this.checkBorderRadius(styles.borderRadius)
        },
        classes: Array.from(element.classList),
        issues: []
      };
      
      // Vérifications
      if (!result.visible) {
        result.issues.push('Module non visible');
        result.status = 'ISSUE';
      }
      
      if (result.dimensions.height < 50) {
        result.issues.push('Hauteur trop petite (possiblement tronqué)');
        result.status = 'ISSUE';
      }
      
      if (!result.styles.hasCorrectBackground) {
        result.issues.push('Background incorrect');
        result.status = 'ISSUE';
      }
      
      if (!result.styles.hasCorrectBorder) {
        result.issues.push('Border incorrect');
        result.status = 'ISSUE';
      }
      
      return result;
    },
    
    /**
     * Vérifie si un élément est visible
     */
    isVisible(element) {
      const styles = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return (
        styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        styles.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
      );
    },
    
    /**
     * Vérifie si le background est correct
     */
    checkBackground(background) {
      // Recherche les patterns attendus
      const expectedPatterns = [
        'rgba(255, 255, 255, 0.03)',
        'rgba(255,255,255,0.03)',
        'rgb(255, 255, 255)',
        'linear-gradient'
      ];
      
      return expectedPatterns.some(pattern => 
        background.toLowerCase().includes(pattern.toLowerCase())
      );
    },
    
    /**
     * Vérifie si la border est correcte
     */
    checkBorder(border) {
      const expectedPatterns = [
        'rgba(255, 215, 0',
        'rgba(255,215,0',
        'rgb(255, 215, 0)',
        'gold',
        'yellow'
      ];
      
      return expectedPatterns.some(pattern => 
        border.toLowerCase().includes(pattern.toLowerCase())
      );
    },
    
    /**
     * Vérifie si le border-radius est correct
     */
    checkBorderRadius(borderRadius) {
      // Accepte différents formats de border-radius
      return borderRadius && borderRadius !== '0px' && borderRadius !== 'none';
    },
    
    /**
     * Compare avec les anciens modules pour vérifier la cohérence
     */
    compareWithOldModules() {
      console.log('🔄 COMPARAISON AVEC LES ANCIENS MODULES');
      console.log('='.repeat(50));
      
      // Sélecteurs des anciens modules (sections sidebar existantes)
      const oldModuleSelectors = [
        '.sidebar-section:not(.historical-module)',
        '.progression-globale-section',
        '.quetes-jour-section',
        '.activite-physique-section'
      ];
      
      // Sélecteurs des nouveaux modules
      const newModuleSelectors = [
        '.garmin-metrics-module',
        '.session-recorder-module',
        '.reading-progress-module',
        '.patrimony-evolution-module'
      ];
      
      const oldModuleStyles = this.getModuleStyles(oldModuleSelectors);
      const newModuleStyles = this.getModuleStyles(newModuleSelectors);
      
      console.log('📊 ANCIENS MODULES:');
      this.displayStylesComparison(oldModuleStyles);
      
      console.log('📊 NOUVEAUX MODULES:');
      this.displayStylesComparison(newModuleStyles);
      
      // Analyse des différences
      console.log('🔍 ANALYSE DES DIFFÉRENCES:');
      const differences = this.analyzeStyleDifferences(oldModuleStyles, newModuleStyles);
      differences.forEach(diff => {
        console.log(`   ${diff.severity === 'high' ? '🚨' : '⚠️'} ${diff.property}: ${diff.description}`);
      });
      
      return {
        oldModules: oldModuleStyles,
        newModules: newModuleStyles,
        differences
      };
    },
    
    /**
     * Récupère les styles des modules
     */
    getModuleStyles(selectors) {
      const styles = [];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          if (this.isVisible(element)) {
            const computedStyles = getComputedStyle(element);
            styles.push({
              selector: `${selector}[${index}]`,
              background: computedStyles.background,
              border: computedStyles.border,
              borderRadius: computedStyles.borderRadius,
              padding: computedStyles.padding,
              margin: computedStyles.margin,
              height: element.offsetHeight
            });
          }
        });
      });
      
      return styles;
    },
    
    /**
     * Affiche une comparaison de styles
     */
    displayStylesComparison(moduleStyles) {
      moduleStyles.forEach(style => {
        console.log(`   ${style.selector}:`);
        console.log(`     Background: ${style.background.substring(0, 50)}...`);
        console.log(`     Border: ${style.border}`);
        console.log(`     Border-radius: ${style.borderRadius}`);
        console.log(`     Height: ${style.height}px`);
      });
      console.log('');
    },
    
    /**
     * Analyse les différences entre anciens et nouveaux modules
     */
    analyzeStyleDifferences(oldStyles, newStyles) {
      const differences = [];
      
      // Analyse des backgrounds
      const oldBackgrounds = oldStyles.map(s => s.background);
      const newBackgrounds = newStyles.map(s => s.background);
      
      const backgroundConsistency = this.checkConsistency(oldBackgrounds, newBackgrounds);
      if (!backgroundConsistency.consistent) {
        differences.push({
          property: 'Background',
          severity: 'high',
          description: 'Incohérence dans les backgrounds entre anciens et nouveaux modules'
        });
      }
      
      // Analyse des borders
      const oldBorders = oldStyles.map(s => s.border);
      const newBorders = newStyles.map(s => s.border);
      
      const borderConsistency = this.checkConsistency(oldBorders, newBorders);
      if (!borderConsistency.consistent) {
        differences.push({
          property: 'Border',
          severity: 'medium',
          description: 'Incohérence dans les borders entre anciens et nouveaux modules'
        });
      }
      
      // Analyse des hauteurs
      const oldHeights = oldStyles.map(s => s.height);
      const newHeights = newStyles.map(s => s.height);
      
      const avgOldHeight = oldHeights.reduce((a, b) => a + b, 0) / oldHeights.length;
      const avgNewHeight = newHeights.reduce((a, b) => a + b, 0) / newHeights.length;
      
      if (Math.abs(avgOldHeight - avgNewHeight) > 50) {
        differences.push({
          property: 'Height',
          severity: 'medium',
          description: `Différence significative de hauteur (${Math.round(avgOldHeight)}px vs ${Math.round(avgNewHeight)}px)`
        });
      }
      
      return differences;
    },
    
    /**
     * Vérifie la cohérence entre deux ensembles de valeurs
     */
    checkConsistency(oldValues, newValues) {
      // Simplifié : vérifie si les valeurs sont similaires
      const oldUnique = [...new Set(oldValues)];
      const newUnique = [...new Set(newValues)];
      
      return {
        consistent: oldUnique.length <= 2 && newUnique.length <= 2,
        oldVariations: oldUnique.length,
        newVariations: newUnique.length
      };
    },
    
    /**
     * Test de performance CSS
     */
    performanceTest() {
      console.log('⚡ TEST DE PERFORMANCE CSS');
      console.log('='.repeat(50));
      
      const startTime = performance.now();
      
      // Simule des interactions sur les modules
      const modules = document.querySelectorAll('.historical-module');
      modules.forEach(module => {
        // Simule hover
        module.dispatchEvent(new MouseEvent('mouseenter'));
        module.dispatchEvent(new MouseEvent('mouseleave'));
        
        // Force un reflow
        module.offsetHeight;
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ Temps d'exécution: ${duration.toFixed(2)}ms`);
      
      if (duration > 16) {
        console.log('⚠️ Performance dégradée (>16ms)');
      } else {
        console.log('✅ Performance acceptable');
      }
      
      return { duration, acceptable: duration <= 16 };
    },
    
    /**
     * Génère un rapport complet
     */
    generateReport() {
      console.log('📋 GÉNÉRATION DU RAPPORT COMPLET');
      console.log('='.repeat(50));
      
      const report = {
        timestamp: new Date().toISOString(),
        diagnostic: this.runFullDiagnostic(),
        comparison: this.compareWithOldModules(),
        performance: this.performanceTest()
      };
      
      console.log('📄 Rapport généré. Utilisez console.log(report) pour voir les détails.');
      
      return report;
    }
  };
  
  // Expose l'objet globalement
  window.diagnosticModules = diagnosticModules;
  
  console.log('🔧 Diagnostic CSS Modules chargé !');
  console.log('📋 Fonctions disponibles :');
  console.log('   - diagnosticModules.runFullDiagnostic()');
  console.log('   - diagnosticModules.checkModule(".garmin-metrics-module")');
  console.log('   - diagnosticModules.compareWithOldModules()');
  console.log('   - diagnosticModules.performanceTest()');
  console.log('   - diagnosticModules.generateReport()');
  console.log('');
  console.log('💡 Commencez par : diagnosticModules.runFullDiagnostic()');
  
})();