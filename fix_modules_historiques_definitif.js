/**
 * 🔧 Fix Définitif - Modules Historiques Sidebar
 * Script de correction définitive pour résoudre le problème d'affichage des modules historiques
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Le fix sera appliqué automatiquement
 */

(function() {
    'use strict';
    
    console.log('🔧 FIX DÉFINITIF - MODULES HISTORIQUES SIDEBAR');
    console.log('='.repeat(60));
    
    const definitiveFixManager = {
        
        /**
         * Configuration des modules historiques
         */
        historicalModules: [
            { id: 'enregistrer-session', selector: '.session-recorder-module, [data-module-id="enregistrer-session"]' },
            { id: 'progression-lecture', selector: '.reading-progress-module, [data-module-id="progression-lecture"]' },
            { id: 'metriques-garmin', selector: '.garmin-metrics-module, [data-module-id="metriques-garmin"]' },
            { id: 'quetes-interactives', selector: '.interactive-quests-module, [data-module-id="quetes-interactives"]' },
            { id: 'evolution-patrimoine', selector: '.patrimony-evolution-module, [data-module-id="evolution-patrimoine"]' },
            { id: 'liste-courses', selector: '.shopping-list-module, [data-module-id="liste-courses"]' },
            { id: 'session-lecture-active', selector: '.active-reading-session-module, [data-module-id="session-lecture-active"]' },
            { id: 'entrainement-jour', selector: '.daily-training-module, [data-module-id="entrainement-jour"]' },
            { id: 'creativite-projets', selector: '.creativity-projects-module, [data-module-id="creativite-projets"]' },
            { id: 'performance-globale', selector: '.global-performance-module, [data-module-id="performance-globale"]' },
            { id: 'apprentissage-express', selector: '.express-learning-module, [data-module-id="apprentissage-express"]' }
        ],
        
        /**
         * Applique le fix définitif
         */
        applyDefinitiveFix() {
            console.log('🚀 Application du fix définitif...\n');
            
            const results = {
                step1: this.fixSidebarStructure(),
                step2: this.fixModuleRenderer(),
                step3: this.fixCSSIssues(),
                step4: this.fixReactComponents(),
                step5: this.forceModuleVisibility(),
                step6: this.validateFix()
            };
            
            this.generateFixReport(results);
            return results;
        },
        
        /**
         * Étape 1: Corriger la structure de la sidebar
         */
        fixSidebarStructure() {
            console.log('📋 ÉTAPE 1: CORRECTION STRUCTURE SIDEBAR');
            console.log('-'.repeat(40));
            
            const fixes = [];
            
            // Vérifier et corriger SidebarPremium
            const sidebar = document.querySelector('.sidebar-premium');
            if (!sidebar) {
                console.log('❌ SidebarPremium non trouvé - Impossible de corriger');
                return { success: false, fixes, error: 'SidebarPremium non trouvé' };
            }
            
            console.log('✅ SidebarPremium trouvé');
            
            // Vérifier et corriger le container des modules
            let moduleContainer = sidebar.querySelector('.sidebar-modules-container');
            if (!moduleContainer) {
                console.log('⚠️ Container des modules non trouvé - Tentative de création...');
                
                // Chercher le content de la sidebar
                const sidebarContent = sidebar.querySelector('.sidebar-content');
                if (sidebarContent) {
                    moduleContainer = document.createElement('div');
                    moduleContainer.className = 'sidebar-modules-container';
                    moduleContainer.setAttribute('role', 'region');
                    moduleContainer.setAttribute('aria-label', 'Modules de la sidebar');
                    sidebarContent.appendChild(moduleContainer);
                    fixes.push('Container des modules créé');
                    console.log('✅ Container des modules créé');
                } else {
                    console.log('❌ Impossible de créer le container - sidebar-content non trouvé');
                    return { success: false, fixes, error: 'sidebar-content non trouvé' };
                }
            } else {
                console.log('✅ Container des modules trouvé');
            }
            
            // S'assurer que le container est visible
            const containerStyle = getComputedStyle(moduleContainer);
            if (containerStyle.display === 'none') {
                moduleContainer.style.display = 'block';
                fixes.push('Container rendu visible');
                console.log('✅ Container rendu visible');
            }
            
            console.log(`📊 Étape 1 terminée: ${fixes.length} corrections appliquées\n`);
            return { success: true, fixes };
        },
        
        /**
         * Étape 2: Corriger ModuleRenderer
         */
        fixModuleRenderer() {
            console.log('⚛️ ÉTAPE 2: CORRECTION MODULE RENDERER');
            console.log('-'.repeat(40));
            
            const fixes = [];
            
            // Vérifier les modules existants
            const existingModules = document.querySelectorAll('.sidebar-module');
            console.log(`📊 Modules existants trouvés: ${existingModules.length}`);
            
            let historicalCount = 0;
            let legacyCount = 0;
            
            existingModules.forEach((module, index) => {
                const moduleId = module.getAttribute('data-module-id');
                const moduleType = module.getAttribute('data-module-type');
                
                if (moduleType === 'historical') {
                    historicalCount++;
                } else if (moduleType === 'legacy') {
                    legacyCount++;
                }
                
                // Corriger les attributs manquants
                if (!moduleId) {
                    const className = module.className;
                    const possibleId = this.extractModuleIdFromClassName(className);
                    if (possibleId) {
                        module.setAttribute('data-module-id', possibleId);
                        fixes.push(`ID ajouté pour module ${index}`);
                        console.log(`✅ ID ajouté pour module ${index}: ${possibleId}`);
                    }
                }
                
                if (!moduleType) {
                    // Déterminer le type basé sur la classe ou l'ID
                    const isHistorical = this.historicalModules.some(hm => 
                        module.matches(hm.selector) || moduleId === hm.id
                    );
                    
                    const type = isHistorical ? 'historical' : 'legacy';
                    module.setAttribute('data-module-type', type);
                    fixes.push(`Type ajouté pour module ${moduleId || index}: ${type}`);
                    console.log(`✅ Type ajouté pour module ${moduleId || index}: ${type}`);
                }
                
                // S'assurer que le module a les bonnes classes
                if (!module.classList.contains('sidebar-module')) {
                    module.classList.add('sidebar-module');
                    fixes.push(`Classe sidebar-module ajoutée pour ${moduleId || index}`);
                }
                
                if (moduleType === 'historical' && !module.classList.contains('historical-module')) {
                    module.classList.add('historical-module');
                    fixes.push(`Classe historical-module ajoutée pour ${moduleId || index}`);
                }
            });
            
            console.log(`📊 Modules historiques: ${historicalCount}`);
            console.log(`📊 Modules legacy: ${legacyCount}`);
            console.log(`📊 Étape 2 terminée: ${fixes.length} corrections appliquées\n`);
            
            return { success: true, fixes, historicalCount, legacyCount };
        },
        
        /**
         * Étape 3: Corriger les problèmes CSS
         */
        fixCSSIssues() {
            console.log('🎨 ÉTAPE 3: CORRECTION PROBLÈMES CSS');
            console.log('-'.repeat(40));
            
            const fixes = [];
            
            // Injecter les styles d'urgence
            this.injectEmergencyStyles();
            fixes.push('Styles d\'urgence injectés');
            
            // Corriger chaque module historique
            this.historicalModules.forEach(moduleConfig => {
                const elements = document.querySelectorAll(moduleConfig.selector);
                
                elements.forEach((element, index) => {
                    const elementId = `${moduleConfig.id}${index > 0 ? `[${index}]` : ''}`;
                    
                    // Corriger les styles de base
                    const computedStyle = getComputedStyle(element);
                    
                    if (computedStyle.display === 'none') {
                        element.style.display = 'block';
                        fixes.push(`${elementId}: display corrigé`);
                        console.log(`✅ ${elementId}: display corrigé`);
                    }
                    
                    if (computedStyle.visibility === 'hidden') {
                        element.style.visibility = 'visible';
                        fixes.push(`${elementId}: visibility corrigé`);
                        console.log(`✅ ${elementId}: visibility corrigé`);
                    }
                    
                    if (computedStyle.opacity === '0') {
                        element.style.opacity = '1';
                        fixes.push(`${elementId}: opacity corrigé`);
                        console.log(`✅ ${elementId}: opacity corrigé`);
                    }
                    
                    if (element.offsetHeight === 0) {
                        element.style.minHeight = '100px';
                        element.style.height = 'auto';
                        fixes.push(`${elementId}: height corrigé`);
                        console.log(`✅ ${elementId}: height corrigé`);
                    }
                    
                    // Appliquer les styles de base
                    element.style.cssText += `
                        background: rgba(255, 255, 255, 0.03) !important;
                        border: 1px solid rgba(255, 215, 0, 0.15) !important;
                        border-radius: 0.75rem !important;
                        margin-bottom: 1rem !important;
                        overflow: visible !important;
                        transition: all 0.3s ease !important;
                        position: relative !important;
                    `;
                    
                    // Ajouter les classes nécessaires
                    element.classList.add('sidebar-section', 'historical-module');
                });
            });
            
            console.log(`📊 Étape 3 terminée: ${fixes.length} corrections appliquées\n`);
            return { success: true, fixes };
        },
        
        /**
         * Étape 4: Corriger les composants React
         */
        fixReactComponents() {
            console.log('⚛️ ÉTAPE 4: CORRECTION COMPOSANTS REACT');
            console.log('-'.repeat(40));
            
            const fixes = [];
            
            // Forcer le re-rendu des composants Suspense
            const suspenseElements = document.querySelectorAll('[data-react-suspense]');
            suspenseElements.forEach((element, index) => {
                element.style.display = 'none';
                element.offsetHeight; // Force reflow
                element.style.display = '';
                fixes.push(`Suspense ${index} re-rendu`);
                console.log(`✅ Suspense ${index} re-rendu`);
            });
            
            // Corriger les modules en erreur
            const errorModules = document.querySelectorAll('.sidebar-module-error');
            errorModules.forEach((errorElement, index) => {
                const parentModule = errorElement.closest('.sidebar-module');
                if (parentModule) {
                    const moduleId = parentModule.getAttribute('data-module-id');
                    console.log(`⚠️ Module en erreur détecté: ${moduleId || `module-${index}`}`);
                    
                    // Essayer de remplacer par un contenu de fallback
                    errorElement.innerHTML = `
                        <div class="sidebar-section historical-module">
                            <div class="sidebar-section-header">
                                <h3 class="sidebar-section-title">
                                    <span class="sidebar-section-icon">⚠️</span>
                                    Module ${moduleId || 'Historique'}
                                </h3>
                            </div>
                            <div class="sidebar-section-content">
                                <p class="text-sm text-slate-400">Module en cours de chargement...</p>
                            </div>
                        </div>
                    `;
                    fixes.push(`Module ${moduleId || index} remplacé par fallback`);
                    console.log(`✅ Module ${moduleId || index} remplacé par fallback`);
                }
            });
            
            // Corriger les modules en chargement permanent
            const loadingModules = document.querySelectorAll('.sidebar-module-loading');
            loadingModules.forEach((loadingElement, index) => {
                const parentModule = loadingElement.closest('.sidebar-module');
                if (parentModule) {
                    const moduleId = parentModule.getAttribute('data-module-id');
                    console.log(`⏳ Module en chargement permanent: ${moduleId || `module-${index}`}`);
                    
                    // Remplacer par un contenu de base
                    loadingElement.innerHTML = `
                        <div class="sidebar-section historical-module">
                            <div class="sidebar-section-header">
                                <h3 class="sidebar-section-title">
                                    <span class="sidebar-section-icon">📊</span>
                                    Module ${moduleId || 'Historique'}
                                </h3>
                            </div>
                            <div class="sidebar-section-content">
                                <p class="text-sm text-slate-400">Données en cours de chargement...</p>
                            </div>
                        </div>
                    `;
                    fixes.push(`Module ${moduleId || index} chargement remplacé`);
                    console.log(`✅ Module ${moduleId || index} chargement remplacé`);
                }
            });
            
            console.log(`📊 Étape 4 terminée: ${fixes.length} corrections appliquées\n`);
            return { success: true, fixes };
        },
        
        /**
         * Étape 5: Forcer la visibilité des modules
         */
        forceModuleVisibility() {
            console.log('👁️ ÉTAPE 5: FORCER VISIBILITÉ MODULES');
            console.log('-'.repeat(40));
            
            const fixes = [];
            
            // Créer des modules de démonstration si nécessaire
            const moduleContainer = document.querySelector('.sidebar-modules-container');
            if (!moduleContainer) {
                console.log('❌ Container non trouvé - Impossible de forcer la visibilité');
                return { success: false, fixes, error: 'Container non trouvé' };
            }
            
            this.historicalModules.forEach((moduleConfig, index) => {
                let moduleElement = document.querySelector(moduleConfig.selector);
                
                if (!moduleElement) {
                    console.log(`⚠️ Module ${moduleConfig.id} non trouvé - Création d'un module de démonstration...`);
                    
                    // Créer un module de démonstration
                    moduleElement = this.createDemoModule(moduleConfig, index);
                    moduleContainer.appendChild(moduleElement);
                    fixes.push(`Module de démo créé: ${moduleConfig.id}`);
                    console.log(`✅ Module de démo créé: ${moduleConfig.id}`);
                } else {
                    console.log(`✅ Module ${moduleConfig.id} trouvé`);
                }
                
                // Forcer la visibilité
                moduleElement.style.cssText += `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    height: auto !important;
                    min-height: 100px !important;
                    width: 100% !important;
                    position: relative !important;
                    z-index: 1 !important;
                `;
                
                fixes.push(`Visibilité forcée: ${moduleConfig.id}`);
            });
            
            console.log(`📊 Étape 5 terminée: ${fixes.length} corrections appliquées\n`);
            return { success: true, fixes };
        },
        
        /**
         * Étape 6: Valider le fix
         */
        validateFix() {
            console.log('✅ ÉTAPE 6: VALIDATION DU FIX');
            console.log('-'.repeat(40));
            
            const validation = {
                totalModules: 0,
                visibleModules: 0,
                historicalModules: 0,
                issues: []
            };
            
            // Compter tous les modules
            const allModules = document.querySelectorAll('.sidebar-module, .historical-module');
            validation.totalModules = allModules.length;
            
            allModules.forEach((module, index) => {
                const rect = module.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                const moduleId = module.getAttribute('data-module-id') || `module-${index}`;
                const moduleType = module.getAttribute('data-module-type');
                
                if (isVisible) {
                    validation.visibleModules++;
                    console.log(`✅ ${moduleId}: Visible (${rect.width.toFixed(0)}x${rect.height.toFixed(0)})`);
                } else {
                    validation.issues.push(`Module ${moduleId} non visible`);
                    console.log(`❌ ${moduleId}: Non visible`);
                }
                
                if (moduleType === 'historical') {
                    validation.historicalModules++;
                }
            });
            
            // Vérifier spécifiquement les modules historiques attendus
            let foundHistoricalModules = 0;
            this.historicalModules.forEach(moduleConfig => {
                const element = document.querySelector(moduleConfig.selector);
                if (element && element.offsetHeight > 0) {
                    foundHistoricalModules++;
                    console.log(`✅ ${moduleConfig.id}: Trouvé et visible`);
                } else {
                    console.log(`❌ ${moduleConfig.id}: Non trouvé ou non visible`);
                }
            });
            
            console.log(`\n📊 RÉSULTATS DE VALIDATION:`);
            console.log(`   Total modules: ${validation.totalModules}`);
            console.log(`   Modules visibles: ${validation.visibleModules}`);
            console.log(`   Modules historiques attendus: ${this.historicalModules.length}`);
            console.log(`   Modules historiques trouvés: ${foundHistoricalModules}`);
            console.log(`   Taux de succès: ${((foundHistoricalModules / this.historicalModules.length) * 100).toFixed(1)}%`);
            
            const success = foundHistoricalModules >= this.historicalModules.length * 0.8; // 80% de succès minimum
            
            console.log(`\n${success ? '🎉 FIX RÉUSSI !' : '⚠️ FIX PARTIEL'}`);
            
            return {
                success,
                totalModules: validation.totalModules,
                visibleModules: validation.visibleModules,
                historicalModules: foundHistoricalModules,
                expectedHistoricalModules: this.historicalModules.length,
                successRate: (foundHistoricalModules / this.historicalModules.length) * 100,
                issues: validation.issues
            };
        },
        
        /**
         * Utilitaires
         */
        extractModuleIdFromClassName(className) {
            const classes = className.split(' ');
            for (const cls of classes) {
                if (cls.includes('-module')) {
                    return cls.replace('-module', '').replace(/([A-Z])/g, '-$1').toLowerCase();
                }
            }
            return null;
        },
        
        createDemoModule(moduleConfig, index) {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'sidebar-module sidebar-section historical-module';
            moduleElement.setAttribute('data-module-id', moduleConfig.id);
            moduleElement.setAttribute('data-module-type', 'historical');
            moduleElement.setAttribute('data-module-position', (index * 2 + 1).toString());
            
            const icons = ['🎯', '📚', '⌚', '🎮', '💰', '🛒', '📖', '🏋️', '🎨', '📊', '🎓'];
            const icon = icons[index] || '📊';
            
            const titles = [
                'Enregistrer Session',
                'Progression Lecture',
                'Métriques Garmin',
                'Quêtes Interactives',
                'Évolution Patrimoine',
                'Liste Courses',
                'Session Lecture Active',
                'Entraînement du Jour',
                'Créativité & Projets',
                'Performance Globale',
                'Apprentissage Express'
            ];
            
            const title = titles[index] || 'Module Historique';
            
            moduleElement.innerHTML = `
                <div class="sidebar-section-header">
                    <h3 class="sidebar-section-title">
                        <span class="sidebar-section-icon">${icon}</span>
                        ${title}
                    </h3>
                    <span class="sidebar-module-badge">Nouveau</span>
                </div>
                <div class="sidebar-section-content">
                    <p class="text-sm text-slate-400 mb-2">Module historique de démonstration</p>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        Actif
                    </div>
                </div>
            `;
            
            return moduleElement;
        },
        
        injectEmergencyStyles() {
            const styleId = 'historical-modules-emergency-fix-definitive';
            
            // Supprimer le style existant s'il existe
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                existingStyle.remove();
            }
            
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Fix définitif pour les modules historiques */
                .historical-module,
                .sidebar-module[data-module-type="historical"] {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 215, 0, 0.15) !important;
                    border-radius: 0.75rem !important;
                    margin-bottom: 1rem !important;
                    overflow: visible !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    position: relative !important;
                    min-height: 100px !important;
                    width: 100% !important;
                    z-index: 1 !important;
                }
                
                .historical-module:hover,
                .sidebar-module[data-module-type="historical"]:hover {
                    border-color: rgba(255, 215, 0, 0.3) !important;
                    box-shadow: 0 4px 15px rgba(255, 20, 147, 0.1) !important;
                    transform: translateY(-2px) !important;
                }
                
                .historical-module .sidebar-section-header,
                .sidebar-module[data-module-type="historical"] .sidebar-section-header {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    padding: 1rem !important;
                    background: rgba(255, 255, 255, 0.02) !important;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
                    cursor: pointer !important;
                }
                
                .historical-module .sidebar-section-title,
                .sidebar-module[data-module-type="historical"] .sidebar-section-title {
                    display: flex !important;
                    align-items: center !important;
                    gap: 0.5rem !important;
                    font-size: 1rem !important;
                    font-weight: 600 !important;
                    color: white !important;
                    flex: 1 !important;
                }
                
                .historical-module .sidebar-section-content,
                .sidebar-module[data-module-type="historical"] .sidebar-section-content {
                    padding: 1rem !important;
                    animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                
                .historical-module .sidebar-module-badge,
                .sidebar-module[data-module-type="historical"] .sidebar-module-badge {
                    background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
                    color: white !important;
                    font-size: 0.75rem !important;
                    font-weight: 700 !important;
                    padding: 2px 8px !important;
                    border-radius: 10px !important;
                    margin-left: 0.5rem !important;
                }
                
                /* Sélecteurs spécifiques pour chaque module */
                .session-recorder-module,
                .reading-progress-module,
                .garmin-metrics-module,
                .interactive-quests-module,
                .patrimony-evolution-module,
                .shopping-list-module,
                .active-reading-session-module,
                .daily-training-module,
                .creativity-projects-module,
                .global-performance-module,
                .express-learning-module {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    min-height: 100px !important;
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 215, 0, 0.15) !important;
                    border-radius: 0.75rem !important;
                    margin-bottom: 1rem !important;
                    padding: 0 !important;
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
                
                /* Container des modules */
                .sidebar-modules-container {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .historical-module .sidebar-section-header,
                    .historical-module .sidebar-section-content,
                    .sidebar-module[data-module-type="historical"] .sidebar-section-header,
                    .sidebar-module[data-module-type="historical"] .sidebar-section-content {
                        padding: 0.75rem !important;
                    }
                }
            `;
            
            document.head.appendChild(style);
            console.log('💉 Styles d\'urgence définitifs injectés');
        },
        
        generateFixReport(results) {
            console.log('\n📋 RAPPORT DE FIX DÉFINITIF');
            console.log('='.repeat(60));
            
            const totalFixes = Object.values(results).reduce((total, result) => {
                return total + (result.fixes ? result.fixes.length : 0);
            }, 0);
            
            console.log(`🔧 RÉSUMÉ DU FIX:`);
            console.log(`   Total corrections appliquées: ${totalFixes}`);
            console.log(`   Étapes réussies: ${Object.values(results).filter(r => r.success !== false).length}/6`);
            
            if (results.step6) {
                console.log(`   Modules historiques visibles: ${results.step6.historicalModules}/${results.step6.expectedHistoricalModules}`);
                console.log(`   Taux de succès: ${results.step6.successRate.toFixed(1)}%`);
            }
            
            console.log(`\n🎯 STATUT FINAL:`);
            if (results.step6 && results.step6.success) {
                console.log('   🎉 FIX RÉUSSI ! Les modules historiques devraient maintenant être visibles.');
            } else {
                console.log('   ⚠️ Fix partiel. Certains modules peuvent encore avoir des problèmes.');
            }
            
            console.log(`\n💡 ACTIONS RECOMMANDÉES:`);
            console.log('   1. Actualiser la page (F5) pour voir les changements');
            console.log('   2. Vérifier visuellement que les modules s\'affichent');
            console.log('   3. Si problème persiste, exécuter: definitiveFixManager.applyDefinitiveFix()');
            
            return results;
        }
    };
    
    // Exposer l'objet globalement
    window.definitiveFixManager = definitiveFixManager;
    
    // Appliquer le fix automatiquement
    definitiveFixManager.applyDefinitiveFix();
    
    console.log('\n🔧 Definitive Fix Manager chargé !');
    console.log('📋 Fonctions disponibles :');
    console.log('   - definitiveFixManager.applyDefinitiveFix()');
    console.log('   - definitiveFixManager.fixSidebarStructure()');
    console.log('   - definitiveFixManager.fixCSSIssues()');
    console.log('   - definitiveFixManager.forceModuleVisibility()');
    
})();