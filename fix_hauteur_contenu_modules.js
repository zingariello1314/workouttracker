/**
 * 🔧 Fix Hauteur Contenu Modules Historiques
 * Script pour corriger le problème de hauteur du contenu (33px au lieu de la hauteur normale)
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Le contenu devrait s'afficher correctement
 */

(function() {
  'use strict';
  
  console.log('🔧 FIX HAUTEUR CONTENU MODULES HISTORIQUES');
  console.log('='.repeat(60));
  
  const heightFixManager = {
    
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
     * Applique le fix de hauteur
     */
    applyHeightFix() {
      console.log('🚀 Application du fix de hauteur...\n');
      
      let totalFixed = 0;
      
      this.historicalModules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        
        elements.forEach((element, index) => {
          const elementId = `${moduleConfig.id}${index > 0 ? `[${index}]` : ''}`;
          
          console.log(`🔧 Traitement ${elementId}:`);
          
          // Trouver le contenu
          const content = element.querySelector('.sidebar-section-content');
          if (!content) {
            console.log(`   ❌ Contenu non trouvé`);
            return;
          }
          
          // Vérifier la hauteur actuelle
          const currentRect = content.getBoundingClientRect();
          console.log(`   📏 Hauteur actuelle: ${currentRect.height}px`);
          
          if (currentRect.height <= 50) {
            console.log(`   ⚠️ Hauteur trop faible détectée`);
            
            // Appliquer les corrections CSS
            content.style.cssText += `
              height: auto !important;
              min-height: 150px !important;
              max-height: none !important;
              overflow: visible !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              padding: 16px !important;
              box-sizing: border-box !important;
            `;
            
            // Forcer le recalcul du layout
            content.offsetHeight;
            
            // Vérifier la nouvelle hauteur
            const newRect = content.getBoundingClientRect();
            console.log(`   ✅ Nouvelle hauteur: ${newRect.height}px`);
            
            totalFixed++;
          } else {
            console.log(`   ✅ Hauteur correcte`);
          }
        });
      });
      
      console.log(`\n📊 Résumé:`);
      console.log(`   Modules corrigés: ${totalFixed}`);
      
      if (totalFixed > 0) {
        console.log(`\n🎉 Fix appliqué avec succès !`);
        console.log(`   Les modules devraient maintenant afficher leur contenu.`);
      } else {
        console.log(`\n💡 Aucune correction nécessaire.`);
      }
      
      return totalFixed;
    },
    
    /**
     * Injecte des styles CSS d'urgence
     */
    injectEmergencyStyles() {
      const styleId = 'height-fix-emergency-styles';
      
      // Supprimer le style existant s'il existe
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Fix d'urgence pour la hauteur du contenu des modules historiques */
        .sidebar-section-content,
        .historical-module .sidebar-section-content,
        .session-recorder-module .sidebar-section-content,
        .reading-progress-module .sidebar-section-content,
        .garmin-metrics-module .sidebar-section-content,
        .interactive-quests-module .sidebar-section-content,
        .patrimony-evolution-module .sidebar-section-content {
          height: auto !important;
          min-height: 150px !important;
          max-height: none !important;
          overflow: visible !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          padding: 16px !important;
          box-sizing: border-box !important;
          background: transparent !important;
        }
        
        /* S'assurer que les enfants sont visibles */
        .sidebar-section-content > * {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          margin-bottom: 12px !important;
        }
        
        /* Correction spécifique pour les grilles */
        .sidebar-section-content .grid,
        .sidebar-section-content .metric-group,
        .sidebar-section-content .metrics-row {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          margin-bottom: 12px !important;
          min-height: 40px !important;
        }
        
        /* Forcer l'affichage des métriques Garmin */
        .garmin-metrics-module .metric-group {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 215, 0, 0.2) !important;
          border-radius: 8px !important;
          padding: 12px !important;
          margin-bottom: 12px !important;
          min-height: 60px !important;
        }
        
        /* Forcer l'affichage des valeurs */
        .metric-value,
        .metric-label,
        .metric-icon {
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
          color: white !important;
        }
      `;
      
      document.head.appendChild(style);
      console.log('💉 Styles d\'urgence injectés');
    },
    
    /**
     * Fix complet
     */
    runCompleteFix() {
      console.log('🚀 Démarrage du fix complet...\n');
      
      // 1. Injecter les styles d'urgence
      this.injectEmergencyStyles();
      
      // 2. Appliquer le fix de hauteur
      const fixed = this.applyHeightFix();
      
      // 3. Forcer un refresh des modules
      setTimeout(() => {
        this.forceModuleRefresh();
      }, 100);
      
      return fixed;
    },
    
    /**
     * Force le refresh des modules
     */
    forceModuleRefresh() {
      console.log('\n🔄 Forçage du refresh des modules...');
      
      this.historicalModules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        
        elements.forEach((element, index) => {
          const elementId = `${moduleConfig.id}${index > 0 ? `[${index}]` : ''}`;
          
          // Forcer le recalcul du layout
          element.style.display = 'none';
          element.offsetHeight; // Force reflow
          element.style.display = 'block';
          
          console.log(`   🔄 ${elementId} rafraîchi`);
        });
      });
      
      console.log('✅ Refresh terminé');
    }
  };
  
  // Exposer l'objet globalement
  window.heightFixManager = heightFixManager;
  
  // Appliquer le fix automatiquement
  heightFixManager.runCompleteFix();
  
  console.log('\n🔧 Height Fix Manager chargé !');
  console.log('📋 Fonctions disponibles :');
  console.log('   - heightFixManager.runCompleteFix()');
  console.log('   - heightFixManager.applyHeightFix()');
  console.log('   - heightFixManager.forceModuleRefresh()');
  
})();