/**
 * 🔍 Diagnostic Avancé - Modules Historiques Sidebar
 * Script de diagnostic complet pour identifier pourquoi les modules ne s'affichent pas
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Analyser les résultats détaillés
 */

(function() {
    'use strict';
    
    console.log('🔍 DIAGNOSTIC AVANCÉ - MODULES HISTORIQUES SIDEBAR');
    console.log('='.repeat(60));
    
    const diagnosticManager = {
        
        /**
         * Configuration des modules à diagnostiquer
         */
        config: {
            modules: [
                {
                    selector: '.session-recorder-module',
                    name: 'Session Recorder',
                    icon: '📊',
                    expectedProps: ['moduleId', 'moduleType', 'data', 'navigation']
                },
                {
                    selector: '.reading-progress-module',
                    name: 'Reading Progress',
                    icon: '📚',
                    expectedProps: ['moduleId', 'moduleType', 'data', 'navigation']
                },
                {
                    selector: '.garmin-metrics-module',
                    name: 'Garmin Metrics',
                    icon: '⌚',
                    expectedProps: ['moduleId', 'moduleType', 'data', 'navigation']
                },
                {
                    selector: '.interactive-quests-module',
                    name: 'Interactive Quests',
                    icon: '🎯',
                    expectedProps: ['moduleId', 'moduleType', 'data', 'navigation']
                },
                {
                    selector: '.patrimony-evolution-module',
                    name: 'Patrimony Evolution',
                    icon: '💰',
                    expectedProps: ['moduleId', 'moduleType', 'data', 'navigation']
                },
                {
                    selector: '.shopping-list-module',
                    name: 'Shopping List',
                    icon: '🛒',
                    expectedProps: ['moduleId', 'moduleType', 'data', 'navigation']
                }
            ]
        },
        
        /**
         * Diagnostic complet
         */
        runFullDiagnostic() {
            console.log('🚀 Démarrage du diagnostic complet...\n');
            
            const results = {
                domAnalysis: this.analyzeDOMStructure(),
                cssAnalysis: this.analyzeCSSStyles(),
                reactAnalysis: this.analyzeReactComponents(),
                dataAnalysis: this.analyzeDataFlow(),
                performanceAnalysis: this.analyzePerformance(),
                integrationAnalysis: this.analyzeIntegration()
            };
            
            this.generateReport(results);
            return results;
        },
        
        /**
         * Analyse de la structure DOM
         */
        analyzeDOMStructure() {
            console.log('📋 ANALYSE DOM STRUCTURE');
            console.log('-'.repeat(30));
            
            const analysis = {
                modulesFound: 0,
                modulesVisible: 0,
                modulesHidden: 0,
                domIssues: [],
                details: []
            };
            
            // Analyser la sidebar principale
            const sidebar = document.querySelector('.sidebar-premium');
            if (!sidebar) {
                analysis.domIssues.push('❌ Sidebar premium non trouvée dans le DOM');
                return analysis;
            }
            
            console.log('✅ Sidebar premium trouvée');
            
            // Analyser chaque module
            this.config.modules.forEach(moduleConfig => {
                const elements = document.querySelectorAll(moduleConfig.selector);
                const moduleAnalysis = {
                    name: moduleConfig.name,
                    selector: moduleConfig.selector,
                    found: elements.length,
                    visible: 0,
                    hidden: 0,
                    issues: []
                };
                
                if (elements.length === 0) {
                    moduleAnalysis.issues.push('Module non trouvé dans le DOM');
                    console.log(`❌ ${moduleConfig.icon} ${moduleConfig.name}: Non trouvé`);
                } else {
                    elements.forEach((element, index) => {
                        const rect = element.getBoundingClientRect();
                        const computedStyle = getComputedStyle(element);
                        
                        const isVisible = (
                            rect.width > 0 && 
                            rect.height > 0 && 
                            computedStyle.display !== 'none' && 
                            computedStyle.visibility !== 'hidden' &&
                            computedStyle.opacity !== '0'
                        );
                        
                        if (isVisible) {
                            moduleAnalysis.visible++;
                            console.log(`✅ ${moduleConfig.icon} ${moduleConfig.name}[${index}]: Visible (${rect.width}x${rect.height})`);
                        } else {
                            moduleAnalysis.hidden++;
                            console.log(`❌ ${moduleConfig.icon} ${moduleConfig.name}[${index}]: Caché`);
                            
                            // Analyser pourquoi il est caché
                            const hiddenReasons = [];
                            if (rect.width === 0 || rect.height === 0) hiddenReasons.push('Dimensions nulles');
                            if (computedStyle.display === 'none') hiddenReasons.push('display: none');
                            if (computedStyle.visibility === 'hidden') hiddenReasons.push('visibility: hidden');
                            if (computedStyle.opacity === '0') hiddenReasons.push('opacity: 0');
                            
                            moduleAnalysis.issues.push(`Caché: ${hiddenReasons.join(', ')}`);
                            console.log(`   Raisons: ${hiddenReasons.join(', ')}`);
                        }
                    });
                }
                
                analysis.modulesFound += moduleAnalysis.found;
                analysis.modulesVisible += moduleAnalysis.visible;
                analysis.modulesHidden += moduleAnalysis.hidden;
                analysis.details.push(moduleAnalysis);
            });
            
            console.log(`\n📊 Résumé DOM: ${analysis.modulesFound} trouvés, ${analysis.modulesVisible} visibles, ${analysis.modulesHidden} cachés\n`);
            return analysis;
        },
        
        /**
         * Analyse des styles CSS
         */
        analyzeCSSStyles() {
            console.log('🎨 ANALYSE CSS STYLES');
            console.log('-'.repeat(30));
            
            const analysis = {
                stylesApplied: 0,
                stylesConflicts: [],
                missingStyles: [],
                details: []
            };
            
            this.config.modules.forEach(moduleConfig => {
                const elements = document.querySelectorAll(moduleConfig.selector);
                
                elements.forEach((element, index) => {
                    const computedStyle = getComputedStyle(element);
                    const styleAnalysis = {
                        name: `${moduleConfig.name}[${index}]`,
                        styles: {
                            display: computedStyle.display,
                            visibility: computedStyle.visibility,
                            opacity: computedStyle.opacity,
                            position: computedStyle.position,
                            zIndex: computedStyle.zIndex,
                            width: computedStyle.width,
                            height: computedStyle.height,
                            overflow: computedStyle.overflow,
                            transform: computedStyle.transform
                        },
                        issues: []
                    };
                    
                    // Vérifier les problèmes de style
                    if (computedStyle.display === 'none') {
                        styleAnalysis.issues.push('display: none appliqué');
                    }
                    if (computedStyle.visibility === 'hidden') {
                        styleAnalysis.issues.push('visibility: hidden appliqué');
                    }
                    if (computedStyle.opacity === '0') {
                        styleAnalysis.issues.push('opacity: 0 appliqué');
                    }
                    if (computedStyle.height === '0px') {
                        styleAnalysis.issues.push('height: 0 appliqué');
                    }
                    if (computedStyle.overflow === 'hidden' && computedStyle.height === '0px') {
                        styleAnalysis.issues.push('overflow: hidden avec height: 0');
                    }
                    
                    console.log(`${moduleConfig.icon} ${styleAnalysis.name}:`);
                    console.log(`   Display: ${styleAnalysis.styles.display}`);
                    console.log(`   Visibility: ${styleAnalysis.styles.visibility}`);
                    console.log(`   Opacity: ${styleAnalysis.styles.opacity}`);
                    console.log(`   Dimensions: ${styleAnalysis.styles.width} x ${styleAnalysis.styles.height}`);
                    
                    if (styleAnalysis.issues.length > 0) {
                        console.log(`   ⚠️ Problèmes: ${styleAnalysis.issues.join(', ')}`);
                        analysis.stylesConflicts.push(...styleAnalysis.issues);
                    }
                    
                    analysis.details.push(styleAnalysis);
                });
            });
            
            console.log(`\n📊 Résumé CSS: ${analysis.stylesConflicts.length} conflits détectés\n`);
            return analysis;
        },
        
        /**
         * Analyse des composants React
         */
        analyzeReactComponents() {
            console.log('⚛️ ANALYSE COMPOSANTS REACT');
            console.log('-'.repeat(30));
            
            const analysis = {
                reactErrors: [],
                renderingIssues: [],
                stateIssues: [],
                details: []
            };
            
            // Vérifier les erreurs React dans la console
            const originalError = console.error;
            const reactErrors = [];
            
            console.error = function(...args) {
                if (args.some(arg => typeof arg === 'string' && (
                    arg.includes('React') || 
                    arg.includes('Warning') || 
                    arg.includes('Error')
                ))) {
                    reactErrors.push(args.join(' '));
                }
                originalError.apply(console, args);
            };
            
            // Analyser les éléments React
            this.config.modules.forEach(moduleConfig => {
                const elements = document.querySelectorAll(moduleConfig.selector);
                
                elements.forEach((element, index) => {
                    const componentAnalysis = {
                        name: `${moduleConfig.name}[${index}]`,
                        hasReactProps: false,
                        hasReactState: false,
                        hasChildren: element.children.length > 0,
                        innerHTML: element.innerHTML.length,
                        issues: []
                    };
                    
                    // Vérifier si l'élément a des propriétés React
                    const reactKeys = Object.keys(element).filter(key => 
                        key.startsWith('__react') || key.startsWith('_react')
                    );
                    
                    componentAnalysis.hasReactProps = reactKeys.length > 0;
                    
                    if (!componentAnalysis.hasChildren && componentAnalysis.innerHTML === 0) {
                        componentAnalysis.issues.push('Élément vide (pas de contenu)');
                    }
                    
                    if (!componentAnalysis.hasReactProps) {
                        componentAnalysis.issues.push('Pas de propriétés React détectées');
                    }
                    
                    console.log(`${moduleConfig.icon} ${componentAnalysis.name}:`);
                    console.log(`   React Props: ${componentAnalysis.hasReactProps ? '✅' : '❌'}`);
                    console.log(`   Enfants: ${componentAnalysis.hasChildren ? componentAnalysis.hasChildren : '❌'}`);
                    console.log(`   Contenu HTML: ${componentAnalysis.innerHTML} caractères`);
                    
                    if (componentAnalysis.issues.length > 0) {
                        console.log(`   ⚠️ Problèmes: ${componentAnalysis.issues.join(', ')}`);
                        analysis.renderingIssues.push(...componentAnalysis.issues);
                    }
                    
                    analysis.details.push(componentAnalysis);
                });
            });
            
            // Restaurer console.error
            console.error = originalError;
            analysis.reactErrors = reactErrors;
            
            console.log(`\n📊 Résumé React: ${analysis.renderingIssues.length} problèmes de rendu\n`);
            return analysis;
        },
        
        /**
         * Analyse du flux de données
         */
        analyzeDataFlow() {
            console.log('📊 ANALYSE FLUX DE DONNÉES');
            console.log('-'.repeat(30));
            
            const analysis = {
                dataAvailable: false,
                sidebarData: null,
                moduleData: {},
                dataIssues: []
            };
            
            // Vérifier useSidebarData
            try {
                const sidebarElement = document.querySelector('.sidebar-premium');
                if (sidebarElement && sidebarElement._reactInternalFiber) {
                    // Essayer d'extraire les données React (méthode approximative)
                    console.log('🔍 Tentative d\'extraction des données React...');
                }
                
                // Vérifier les données dans le localStorage ou sessionStorage
                const storageKeys = Object.keys(localStorage).filter(key => 
                    key.includes('sidebar') || key.includes('module') || key.includes('historical')
                );
                
                console.log(`📦 Clés de stockage trouvées: ${storageKeys.length}`);
                storageKeys.forEach(key => {
                    console.log(`   - ${key}`);
                });
                
            } catch (error) {
                analysis.dataIssues.push(`Erreur d'analyse des données: ${error.message}`);
                console.log(`❌ Erreur d'analyse des données: ${error.message}`);
            }
            
            console.log(`\n📊 Résumé Données: ${analysis.dataIssues.length} problèmes détectés\n`);
            return analysis;
        },
        
        /**
         * Analyse des performances
         */
        analyzePerformance() {
            console.log('⚡ ANALYSE PERFORMANCES');
            console.log('-'.repeat(30));
            
            const analysis = {
                renderTime: 0,
                memoryUsage: 0,
                performanceIssues: []
            };
            
            // Mesurer le temps de rendu
            const startTime = performance.now();
            
            // Forcer un re-rendu pour mesurer
            this.config.modules.forEach(moduleConfig => {
                const elements = document.querySelectorAll(moduleConfig.selector);
                elements.forEach(element => {
                    element.style.display = element.style.display || 'block';
                });
            });
            
            const endTime = performance.now();
            analysis.renderTime = endTime - startTime;
            
            // Vérifier la mémoire (si disponible)
            if (performance.memory) {
                analysis.memoryUsage = performance.memory.usedJSHeapSize;
                console.log(`💾 Mémoire utilisée: ${(analysis.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
            }
            
            console.log(`⏱️ Temps de rendu: ${analysis.renderTime.toFixed(2)}ms`);
            
            if (analysis.renderTime > 100) {
                analysis.performanceIssues.push('Temps de rendu lent (>100ms)');
            }
            
            console.log(`\n📊 Résumé Performance: ${analysis.performanceIssues.length} problèmes détectés\n`);
            return analysis;
        },
        
        /**
         * Analyse de l'intégration
         */
        analyzeIntegration() {
            console.log('🔗 ANALYSE INTÉGRATION');
            console.log('-'.repeat(30));
            
            const analysis = {
                sidebarFound: false,
                modulesIntegrated: 0,
                integrationIssues: []
            };
            
            // Vérifier la présence de SidebarPremium
            const sidebar = document.querySelector('.sidebar-premium');
            analysis.sidebarFound = !!sidebar;
            
            if (!sidebar) {
                analysis.integrationIssues.push('SidebarPremium non trouvé');
                console.log('❌ SidebarPremium non trouvé dans le DOM');
                return analysis;
            }
            
            console.log('✅ SidebarPremium trouvé');
            
            // Vérifier l'alternance des modules
            const allSections = sidebar.querySelectorAll('.sidebar-section');
            console.log(`📋 Sections sidebar trouvées: ${allSections.length}`);
            
            let historicalCount = 0;
            let legacyCount = 0;
            
            allSections.forEach((section, index) => {
                const isHistorical = this.config.modules.some(module => 
                    section.matches(module.selector)
                );
                
                if (isHistorical) {
                    historicalCount++;
                    console.log(`   ${index}: Module historique`);
                } else {
                    legacyCount++;
                    console.log(`   ${index}: Module legacy`);
                }
            });
            
            analysis.modulesIntegrated = historicalCount;
            
            console.log(`📊 Modules historiques intégrés: ${historicalCount}`);
            console.log(`📊 Modules legacy: ${legacyCount}`);
            
            if (historicalCount === 0) {
                analysis.integrationIssues.push('Aucun module historique intégré');
            }
            
            console.log(`\n📊 Résumé Intégration: ${analysis.integrationIssues.length} problèmes détectés\n`);
            return analysis;
        },
        
        /**
         * Génération du rapport final
         */
        generateReport(results) {
            console.log('📋 RAPPORT FINAL DE DIAGNOSTIC');
            console.log('='.repeat(60));
            
            const totalIssues = 
                results.domAnalysis.domIssues.length +
                results.cssAnalysis.stylesConflicts.length +
                results.reactAnalysis.renderingIssues.length +
                results.dataAnalysis.dataIssues.length +
                results.performanceAnalysis.performanceIssues.length +
                results.integrationAnalysis.integrationIssues.length;
            
            console.log(`🔍 RÉSUMÉ EXÉCUTIF:`);
            console.log(`   Modules trouvés: ${results.domAnalysis.modulesFound}`);
            console.log(`   Modules visibles: ${results.domAnalysis.modulesVisible}`);
            console.log(`   Modules cachés: ${results.domAnalysis.modulesHidden}`);
            console.log(`   Total des problèmes: ${totalIssues}`);
            
            console.log(`\n🚨 PROBLÈMES CRITIQUES:`);
            
            if (results.domAnalysis.modulesFound === 0) {
                console.log(`   ❌ CRITIQUE: Aucun module historique trouvé dans le DOM`);
            }
            
            if (results.domAnalysis.modulesVisible === 0 && results.domAnalysis.modulesFound > 0) {
                console.log(`   ❌ CRITIQUE: Modules présents mais tous cachés`);
            }
            
            if (results.integrationAnalysis.modulesIntegrated === 0) {
                console.log(`   ❌ CRITIQUE: Aucun module historique intégré dans la sidebar`);
            }
            
            console.log(`\n💡 RECOMMANDATIONS:`);
            
            if (results.domAnalysis.modulesFound === 0) {
                console.log(`   1. Vérifier que les modules historiques sont bien rendus par React`);
                console.log(`   2. Vérifier l'intégration dans SidebarPremium.jsx`);
                console.log(`   3. Vérifier les conditions de rendu des modules`);
            }
            
            if (results.domAnalysis.modulesHidden > 0) {
                console.log(`   1. Corriger les styles CSS qui cachent les modules`);
                console.log(`   2. Vérifier les propriétés display, visibility, opacity`);
                console.log(`   3. Vérifier les dimensions (width, height)`);
            }
            
            if (results.reactAnalysis.renderingIssues.length > 0) {
                console.log(`   1. Vérifier les erreurs React dans la console`);
                console.log(`   2. Vérifier les props passées aux composants`);
                console.log(`   3. Vérifier les conditions de rendu dans les composants`);
            }
            
            console.log(`\n🔧 ACTIONS SUGGÉRÉES:`);
            console.log(`   1. Exécuter: diagnosticManager.fixIssues()`);
            console.log(`   2. Vérifier les fichiers: SidebarPremium.jsx, modules historiques`);
            console.log(`   3. Analyser les logs React pour les erreurs`);
            
            return results;
        },
        
        /**
         * Tentative de correction automatique
         */
        fixIssues() {
            console.log('🔧 TENTATIVE DE CORRECTION AUTOMATIQUE');
            console.log('-'.repeat(40));
            
            let fixedCount = 0;
            
            this.config.modules.forEach(moduleConfig => {
                const elements = document.querySelectorAll(moduleConfig.selector);
                
                elements.forEach((element, index) => {
                    const computedStyle = getComputedStyle(element);
                    let fixed = false;
                    
                    // Corriger display: none
                    if (computedStyle.display === 'none') {
                        element.style.display = 'block';
                        console.log(`✅ ${moduleConfig.icon} ${moduleConfig.name}[${index}]: display corrigé`);
                        fixed = true;
                    }
                    
                    // Corriger visibility: hidden
                    if (computedStyle.visibility === 'hidden') {
                        element.style.visibility = 'visible';
                        console.log(`✅ ${moduleConfig.icon} ${moduleConfig.name}[${index}]: visibility corrigé`);
                        fixed = true;
                    }
                    
                    // Corriger opacity: 0
                    if (computedStyle.opacity === '0') {
                        element.style.opacity = '1';
                        console.log(`✅ ${moduleConfig.icon} ${moduleConfig.name}[${index}]: opacity corrigé`);
                        fixed = true;
                    }
                    
                    // Corriger height: 0
                    if (computedStyle.height === '0px') {
                        element.style.height = 'auto';
                        element.style.minHeight = '100px';
                        console.log(`✅ ${moduleConfig.icon} ${moduleConfig.name}[${index}]: height corrigé`);
                        fixed = true;
                    }
                    
                    if (fixed) {
                        fixedCount++;
                    }
                });
            });
            
            console.log(`\n🎉 Corrections appliquées: ${fixedCount} modules corrigés`);
            
            // Re-lancer le diagnostic pour vérifier
            setTimeout(() => {
                console.log('\n🔄 Vérification post-correction...');
                this.runFullDiagnostic();
            }, 1000);
        }
    };
    
    // Exposer l'objet globalement
    window.diagnosticManager = diagnosticManager;
    
    // Lancer le diagnostic automatiquement
    diagnosticManager.runFullDiagnostic();
    
    console.log('\n🔧 Diagnostic Manager chargé !');
    console.log('📋 Fonctions disponibles :');
    console.log('   - diagnosticManager.runFullDiagnostic()');
    console.log('   - diagnosticManager.analyzeDOMStructure()');
    console.log('   - diagnosticManager.analyzeCSSStyles()');
    console.log('   - diagnosticManager.analyzeReactComponents()');
    console.log('   - diagnosticManager.fixIssues()');
    
})();