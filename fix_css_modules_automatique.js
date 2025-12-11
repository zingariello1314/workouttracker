/**
 * 🔧 Fix Automatique CSS - Modules Historiques Sidebar
 * Script de correction automatique des problèmes d'affichage
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Le fix sera appliqué automatiquement
 */

(function() {
  'use strict';

  console.log('🔧 FIX AUTOMATIQUE CSS - MODULES HISTORIQUES');
  console.log('='.repeat(50));

  const cssFixManager = {
    
    /**
     * Configuration des modules historiques
     */
    config: {
      modules: [
        {
          selector: '.garmin-metrics-module',
          name: 'Garmin Metrics',
          icon: '⌚'
        },
        {
          selector: '.session-recorder-module', 
          name: 'Session Recorder',
          icon: '📊'
        },
        {
          selector: '.reading-progress-module',
          name: 'Reading Progress', 
          icon: '📚'
        },
        {
          selector: '.patrimony-evolution-module',
          name: 'Patrimony Evolution',
          icon: '💰'
        }
      ],
      
      // Styles de base pour tous les modules historiques
      baseStyles: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 215, 0, 0.15)',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      },
      
      // Styles pour les headers
      headerStyles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
        cursor: 'pointer'
      },
      
      // Styles pour le contenu
      contentStyles: {
        padding: '1rem',
        animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    },

    /**
     * Applique le fix automatique
     */
    applyFix() {
      console.log('🚀 Application du fix automatique...');
      
      let fixedCount = 0;
      let issuesFound = 0;
      
      this.config.modules.forEach(moduleConfig => {
        const result = this.fixModule(moduleConfig);
        if (result.fixed) {
          fixedCount++;
        }
        if (result.issues > 0) {
          issuesFound += result.issues;
        }
      });
      
      // Ajouter les styles CSS manquants
      this.injectMissingStyles();
      
      // Ajouter les classes manquantes
      this.addMissingClasses();
      
      // Corriger les variables CSS
      this.fixCSSVariables();
      
      console.log(`✅ Fix appliqué: ${fixedCount} modules corrigés`);
      if (issuesFound > 0) {
        console.log(`⚠️ ${issuesFound} problèmes détectés et corrigés`);
      }
      
      // Validation finale
      setTimeout(() => {
        this.validateFix();
      }, 500);
      
      return { fixedCount, issuesFound };
    },
    
    /**
     * Corrige un module spécifique
     */
    fixModule(moduleConfig) {
      const elements = document.querySelectorAll(moduleConfig.selector);
      let fixed = false;
      let issues = 0;
      
      if (elements.length === 0) {
        console.log(`❌ ${moduleConfig.icon} ${moduleConfig.name}: Module non trouvé`);
        return { fixed: false, issues: 1 };
      }
      
      elements.forEach((element, index) => {
        console.log(`🔧 Correction de ${moduleConfig.icon} ${moduleConfig.name}${elements.length > 1 ? ` [${index}]` : ''}...`);
        
        // Appliquer les styles de base
        Object.assign(element.style, this.config.baseStyles);
        
        // Ajouter les classes nécessaires
        element.classList.add('sidebar-section', 'historical-module');
        
        // Corriger la structure interne
        this.fixModuleStructure(element);
        
        // Ajouter les événements hover
        this.addHoverEffects(element);
        
        fixed = true;
      });
      
      return { fixed, issues };
    },
    
    /**
     * Corrige la structure interne d'un module
     */
    fixModuleStructure(element) {
      // Corriger le header
      const header = element.querySelector('.sidebar-section-header');
      if (header) {
        Object.assign(header.style, this.config.headerStyles);
        
        // S'assurer que le titre a les bonnes classes
        const title = header.querySelector('.sidebar-section-title');
        if (title) {
          title.style.display = 'flex';
          title.style.alignItems = 'center';
          title.style.gap = '0.5rem';
          title.style.fontSize = '1rem';
          title.style.fontWeight = '600';
          title.style.color = 'white';
          title.style.flex = '1';
        }
        
        // Corriger le badge "Nouveau"
        const badge = header.querySelector('.sidebar-module-badge');
        if (badge) {
          badge.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
          badge.style.color = 'white';
          badge.style.fontSize = '0.75rem';
          badge.style.fontWeight = '700';
          badge.style.padding = '2px 8px';
          badge.style.borderRadius = '10px';
          badge.style.marginLeft = '0.5rem';
        }
      }
      
      // Corriger le contenu
      const content = element.querySelector('.sidebar-section-content');
      if (content) {
        Object.assign(content.style, this.config.contentStyles);
      }
    },
    
    /**
     * Ajoute les effets hover
     */
    addHoverEffects(element) {
      element.addEventListener('mouseenter', () => {
        element.style.borderColor = 'rgba(255, 215, 0, 0.3)';
        element.style.boxShadow = '0 4px 15px rgba(255, 20, 147, 0.1)';
        element.style.transform = 'translateY(-2px)';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.borderColor = 'rgba(255, 215, 0, 0.15)';
        element.style.boxShadow = 'none';
        element.style.transform = 'translateY(0)';
      });
    },
    
    /**
     * Injecte les styles CSS manquants
     */
    injectMissingStyles() {
      const styleId = 'historical-modules-emergency-fix';
      
      // Supprimer le style existant s'il existe
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Fix d'urgence pour les modules historiques */
        .historical-module {
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 215, 0, 0.15) !important;
          border-radius: 0.75rem !important;
          margin-bottom: 1rem !important;
          overflow: hidden !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .historical-module:hover {
          border-color: rgba(255, 215, 0, 0.3) !important;
          box-shadow: 0 4px 15px rgba(255, 20, 147, 0.1) !important;
          transform: translateY(-2px) !important;
        }
        
        .historical-module .sidebar-section-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 1rem !important;
          background: rgba(255, 255, 255, 0.02) !important;
          border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
          cursor: pointer !important;
        }
        
        .historical-module .sidebar-section-title {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: white !important;
          flex: 1 !important;
        }
        
        .historical-module .sidebar-section-content {
          padding: 1rem !important;
          animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .historical-module .sidebar-module-badge {
          background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
          color: white !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          padding: 2px 8px !important;
          border-radius: 10px !important;
          margin-left: 0.5rem !important;
        }
        
        /* Animation fadeInUp */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Corrections spécifiques par module */
        .garmin-metrics-module,
        .session-recorder-module,
        .reading-progress-module,
        .patrimony-evolution-module {
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 215, 0, 0.15) !important;
          border-radius: 0.75rem !important;
          padding: 0 !important;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .historical-module .sidebar-section-header,
          .historical-module .sidebar-section-content {
            padding: 0.75rem !important;
          }
        }
      `;
      
      document.head.appendChild(style);
      console.log('💉 Styles CSS d\'urgence injectés');
    },
    
    /**
     * Ajoute les classes CSS manquantes
     */
    addMissingClasses() {
      this.config.modules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        elements.forEach(element => {
          element.classList.add('sidebar-section', 'historical-module');
        });
      });
      
      console.log('🏷️ Classes CSS manquantes ajoutées');
    },
    
    /**
     * Corrige les variables CSS
     */
    fixCSSVariables() {
      const root = document.documentElement;
      
      // Variables de base pour la sidebar (si manquantes)
      const sidebarVars = {
        '--sidebar-purple': '#8b5cf6',
        '--sidebar-cyan': '#06b6d4', 
        '--sidebar-gold': '#ffd700',
        '--sidebar-pink': '#ec4899',
        '--sidebar-green': '#10b981',
        '--sidebar-red': '#ef4444',
        '--sidebar-blue': '#3b82f6',
        '--sidebar-radius-md': '0.75rem',
        '--sidebar-spacing-md': '1rem',
        '--sidebar-spacing-sm': '0.5rem',
        '--sidebar-transition-normal': '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '--sidebar-transition-fast': '0.15s ease-out'
      };
      
      // Variables spécifiques aux modules historiques
      const historicalVars = {
        '--patrimony-primary': 'var(--sidebar-purple)',
        '--patrimony-secondary': 'var(--sidebar-cyan)',
        '--patrimony-success': 'var(--sidebar-green)',
        '--patrimony-warning': 'var(--sidebar-gold)',
        '--patrimony-danger': 'var(--sidebar-red)',
        '--patrimony-info': 'var(--sidebar-blue)'
      };
      
      // Appliquer les variables
      Object.entries({...sidebarVars, ...historicalVars}).forEach(([prop, value]) => {
        if (!root.style.getPropertyValue(prop)) {
          root.style.setProperty(prop, value);
        }
      });
      
      console.log('🎨 Variables CSS corrigées');
    },
    
    /**
     * Valide que le fix a été appliqué correctement
     */
    validateFix() {
      console.log('🔍 Validation du fix...');
      
      let validCount = 0;
      let totalCount = 0;
      
      this.config.modules.forEach(moduleConfig => {
        const elements = document.querySelectorAll(moduleConfig.selector);
        
        elements.forEach(element => {
          totalCount++;
          
          const isVisible = element.offsetHeight > 0 && element.offsetWidth > 0;
          const hasCorrectBackground = getComputedStyle(element).background.includes('rgba(255, 255, 255');
          const hasCorrectBorder = getComputedStyle(element).border.includes('rgba(255, 215, 0') || 
                                   getComputedStyle(element).borderColor.includes('255, 215, 0');
          
          if (isVisible && (hasCorrectBackground || hasCorrectBorder)) {
            validCount++;
            console.log(`✅ ${moduleConfig.icon} ${moduleConfig.name}: OK`);
          } else {
            console.log(`❌ ${moduleConfig.icon} ${moduleConfig.name}: Problème persistant`);
            console.log(`   Visible: ${isVisible}`);
            console.log(`   Background: ${hasCorrectBackground}`);
            console.log(`   Border: ${hasCorrectBorder}`);
          }
        });
      });
      
      const successRate = (validCount / totalCount) * 100;
      
      console.log('');
      console.log('📊 RÉSULTAT DE LA VALIDATION:');
      console.log(`   Modules validés: ${validCount}/${totalCount}`);
      console.log(`   Taux de succès: ${successRate.toFixed(1)}%`);
      
      if (successRate >= 100) {
        console.log('🎉 FIX RÉUSSI ! Tous les modules fonctionnent correctement.');
      } else if (successRate >= 75) {
        console.log('⚠️ Fix partiellement réussi. Quelques ajustements peuvent être nécessaires.');
      } else {
        console.log('❌ Fix échoué. Problèmes persistants détectés.');
        this.suggestManualFix();
      }
      
      return { validCount, totalCount, successRate };
    },
    
    /**
     * Suggère un fix manuel si le fix automatique échoue
     */
    suggestManualFix() {
      console.log('');
      console.log('🛠️ SUGGESTIONS DE FIX MANUEL:');
      console.log('');
      console.log('1. Vérifier l\'ordre d\'import CSS dans src/index.css:');
      console.log('   @import \'./styles/sidebar-premium.css\';');
      console.log('   @import \'./styles/historical-modules-fix.css\';');
      console.log('');
      console.log('2. Forcer le rechargement des styles:');
      console.log('   location.reload();');
      console.log('');
      console.log('3. Vérifier les erreurs dans la console (F12)');
      console.log('');
      console.log('4. Appliquer le fix manuel:');
      console.log('   cssFixManager.applyManualFix();');
    },
    
    /**
     * Fix manuel d'urgence
     */
    applyManualFix() {
      console.log('🚨 APPLICATION DU FIX MANUEL D\'URGENCE...');
      
      // Sélectionner TOUS les modules historiques
      const allModules = document.querySelectorAll(`
        .garmin-metrics-module,
        .session-recorder-module,
        .reading-progress-module,
        .patrimony-evolution-module,
        [class*="historical"],
        [class*="metrics"],
        [class*="recorder"],
        [class*="progress"],
        [class*="patrimony"]
      `);
      
      allModules.forEach(module => {
        // Styles de base forcés
        module.style.cssText = `
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 215, 0, 0.15) !important;
          border-radius: 0.75rem !important;
          margin-bottom: 1rem !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          min-height: 100px !important;
          position: relative !important;
        `;
        
        // Classes forcées
        module.classList.add('sidebar-section', 'historical-module');
      });
      
      console.log(`🔧 Fix manuel appliqué sur ${allModules.length} éléments`);
      
      // Validation immédiate
      setTimeout(() => {
        const visibleCount = Array.from(allModules).filter(m => m.offsetHeight > 50).length;
        console.log(`✅ ${visibleCount}/${allModules.length} modules maintenant visibles`);
      }, 100);
    },
    
    /**
     * Reset complet (en cas de problème)
     */
    resetAll() {
      console.log('🔄 RESET COMPLET...');
      
      // Supprimer tous les styles inline
      document.querySelectorAll('[style]').forEach(el => {
        el.removeAttribute('style');
      });
      
      // Supprimer le style d'urgence
      const emergencyStyle = document.getElementById('historical-modules-emergency-fix');
      if (emergencyStyle) {
        emergencyStyle.remove();
      }
      
      // Recharger la page
      console.log('🔄 Rechargement de la page...');
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  };
  
  // Exposer l'objet globalement
  window.cssFixManager = cssFixManager;
  
  // Appliquer le fix automatiquement
  cssFixManager.applyFix();
  
  console.log('');
  console.log('🔧 Fix Manager chargé !');
  console.log('📋 Fonctions disponibles :');
  console.log('   - cssFixManager.applyFix()');
  console.log('   - cssFixManager.validateFix()');
  console.log('   - cssFixManager.applyManualFix()');
  console.log('   - cssFixManager.resetAll()');
  
})();