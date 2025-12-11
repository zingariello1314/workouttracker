/**
 * 🔍 Diagnostic Final - Modules Historiques Sidebar
 * Script de diagnostic spécialisé pour identifier la cause exacte du problème d'affichage
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script et appuyer sur Entrée
 * 3. Analyser les résultats détaillés
 */

(function() {
    'use strict';
    
    console.log('🔍 DIAGNOSTIC FINAL - MODULES HISTORIQUES SIDEBAR');
    console.log('='.repeat(60));
    
    const finalDiagnostic = {
        
        /**
         * Configuration des modules historiques attendus
         */
        expectedModules: [
            { id: 'enregistrer-session', component: 'SessionRecorderModule', position: 1 },
            { id: 'progression-lecture', component: 'ReadingProgressModule', position: 3 },
            { id: 'metriques-garmin', component: 'GarminMetricsModule', position: 5 },
            { id: 'quetes-interactives', component: 'InteractiveQuestsModule', position: 7 },
            { id: 'evolution-patrimoine', component: 'PatrimonyEvolutionModule', position: 9 },
            { id: 'liste-courses', component: 'ShoppingListModule', position: 11 },
            { id: 'session-lecture-active', component: 'ActiveReadingSessionModule', position: 13 },
            { id: 'entrainement-jour', component: 'DailyTrainingModule', position: 15 },
            { id: 'creativite-projets', component: 'CreativityProjectsModule', position: 17 },
            { id: 'performance-globale', component: 'GlobalPerformanceModule', position: 19 },
            { id: 'apprentissage-express', component: 'ExpressLearningModule', position: 21 }
        ],
        
        /**
         * Diagnostic complet et détaillé
         */
        runCompleteDiagnostic() {
            console.log('🚀 Démarrage du diagnostic final...\n');
            
            const results = {
                step1: this.checkSidebarStructure(),
                step2: this.checkModuleRenderer(),
                step3: this.checkModuleAlternation(),
                step4: this.checkReactComponents(),
                step5: this.checkDataFlow(),
                step6: this.checkCSSIssues(),
                step7: this.checkJavaScriptErrors()
            };
            
            this.generateFinalReport(results);
            return results;
        },
        
        /**
         * Étape 1: Vérifier la structure de la sidebar
         */
        checkSidebarStructure() {
            console.log('📋 ÉTAPE 1: STRUCTURE SIDEBAR');
            console.log('-'.repeat(30));
            
            const analysis = {
                sidebarFound: false,
                moduleRendererFound: false,
                moduleContainerFound: false,
                issues: []
            };
            
            // Vérifier SidebarPremium
            const sidebar = document.querySelector('.sidebar-premium');
            analysis.sidebarFound = !!sidebar;
            
            if (!sidebar) {
                analysis.issues.push('❌ SidebarPremium non trouvé');
                console.log('❌ SidebarPremium non trouvé dans le DOM');
                return analysis;
            }
            
            console.log('✅ SidebarPremium trouvé');
            
            // Vérifier ModuleRenderer
            const moduleContainer = sidebar.querySelector('.sidebar-modules-container');
            analysis.moduleContainerFound = !!moduleContainer;
            
            if (!moduleContainer) {
                analysis.issues.push('❌ Container des modules non trouvé');
                console.log('❌ .sidebar-modules-container non trouvé');
            } else {
                console.log('✅ Container des modules trouvé');
                
                // Analyser le contenu du container
                const moduleItems = moduleContainer.querySelectorAll('.sidebar-module');
                console.log(`📊 Modules dans le container: ${moduleItems.length}`);
                
                moduleItems.forEach((item, index) => {
                    const moduleId = item.getAttribute('data-module-id');
                    const moduleType = item.getAttribute('data-module-type');
                    const modulePosition = item.getAttribute('data-module-position');
                    
                    console.log(`   ${index + 1}. ID: ${moduleId}, Type: ${moduleType}, Position: ${modulePosition}`);
                });
            }
            
            console.log(`\n📊 Résumé Structure: ${analysis.issues.length} problèmes détectés\n`);
            return analysis;
        },
        
        /**
         * Étape 2: Vérifier ModuleRenderer
         */
        checkModuleRenderer() {
            console.log('⚛️ ÉTAPE 2: MODULE RENDERER');
            console.log('-'.repeat(30));
            
            const analysis = {
                rendererActive: false,
                modulesRendered: 0,
                historicalModulesRendered: 0,
                legacyModulesRendered: 0,
                renderingErrors: [],
                details: []
            };
            
            // Vérifier les modules rendus
            const allModules = document.querySelectorAll('.sidebar-module');
            analysis.modulesRendered = allModules.length;
            
            console.log(`📊 Total modules rendus: ${analysis.modulesRendered}`);
            
            allModules.forEach((module, index) => {
                const moduleId = module.getAttribute('data-module-id');
                const moduleType = module.getAttribute('data-module-type');
                const modulePosition = module.getAttribute('data-module-position');
                
                const moduleAnalysis = {
                    index: index + 1,
                    id: moduleId,
                    type: moduleType,
                    position: modulePosition,
                    hasContent: module.children.length > 0,
                    isVisible: module.offsetHeight > 0 && module.offsetWidth > 0,
                    issues: []
                };
                
                if (moduleType === 'historical') {
                    analysis.historicalModulesRendered++;
                } else if (moduleType === 'legacy') {
                    analysis.legacyModulesRendered++;
                }
                
                if (!moduleAnalysis.hasContent) {
                    moduleAnalysis.issues.push('Pas de contenu');
                }
                
                if (!moduleAnalysis.isVisible) {
                    moduleAnalysis.issues.push('Non visible');
                }
                
                console.log(`   ${moduleAnalysis.index}. ${moduleAnalysis.id} (${moduleAnalysis.type}) - ${moduleAnalysis.isVisible ? '✅' : '❌'} ${moduleAnalysis.issues.length > 0 ? '⚠️ ' + moduleAnalysis.issues.join(', ') : ''}`);
                
                analysis.details.push(moduleAnalysis);
            });
            
            console.log(`📊 Modules historiques rendus: ${analysis.historicalModulesRendered}`);
            console.log(`📊 Modules legacy rendus: ${analysis.legacyModulesRendered}`);
            
            console.log(`\n📊 Résumé Renderer: ${analysis.renderingErrors.length} erreurs détectées\n`);
            return analysis;
        },
        
        /**
         * Étape 3: Vérifier l'alternance des modules
         */
        checkModuleAlternation() {
            console.log('🔄 ÉTAPE 3: ALTERNANCE MODULES');
            console.log('-'.repeat(30));
            
            const analysis = {
                alternationCorrect: true,
                expectedPattern: [],
                actualPattern: [],
                missingModules: [],
                unexpectedModules: [],
                positionErrors: []
            };
            
            // Pattern attendu
            for (let i = 1; i <= 21; i++) {
                const expectedType = i % 2 === 1 ? 'historical' : 'legacy';
                const expectedModule = this.expectedModules.find(m => m.position === i);
                
                if (expectedModule) {
                    analysis.expectedPattern.push({
                        position: i,
                        type: 'historical',
                        id: expectedModule.id,
                        component: expectedModule.component
                    });
                } else {
                    analysis.expectedPattern.push({
                        position: i,
                        type: 'legacy',
                        id: `legacy-${i}`,
                        component: 'LegacyModule'
                    });
                }
            }
            
            // Pattern actuel
            const actualModules = document.querySelectorAll('.sidebar-module');
            actualModules.forEach((module, index) => {
                const moduleId = module.getAttribute('data-module-id');
                const moduleType = module.getAttribute('data-module-type');
                const modulePosition = parseInt(module.getAttribute('data-module-position')) || (index + 1);
                
                analysis.actualPattern.push({
                    position: modulePosition,
                    type: moduleType,
                    id: moduleId,
                    actualIndex: index + 1
                });
            });
            
            // Comparer les patterns
            console.log('📋 Pattern attendu vs actuel:');
            
            for (let i = 0; i < Math.max(analysis.expectedPattern.length, analysis.actualPattern.length); i++) {
                const expected = analysis.expectedPattern[i];
                const actual = analysis.actualPattern[i];
                
                if (expected && actual) {
                    const match = expected.type === actual.type && expected.position === actual.position;
                    console.log(`   ${i + 1}. Attendu: ${expected.type}[${expected.position}] | Actuel: ${actual.type}[${actual.position}] ${match ? '✅' : '❌'}`);
                    
                    if (!match) {
                        analysis.alternationCorrect = false;
                        analysis.positionErrors.push(`Position ${i + 1}: attendu ${expected.type}, trouvé ${actual.type}`);
                    }
                } else if (expected && !actual) {
                    console.log(`   ${i + 1}. Attendu: ${expected.type}[${expected.position}] | Actuel: MANQUANT ❌`);
                    analysis.missingModules.push(expected);
                    analysis.alternationCorrect = false;
                } else if (!expected && actual) {
                    console.log(`   ${i + 1}. Attendu: AUCUN | Actuel: ${actual.type}[${actual.position}] ⚠️`);
                    analysis.unexpectedModules.push(actual);
                }
            }
            
            console.log(`\n📊 Résumé Alternance: ${analysis.alternationCorrect ? 'Correcte' : 'Incorrecte'}`);
            console.log(`📊 Modules manquants: ${analysis.missingModules.length}`);
            console.log(`📊 Modules inattendus: ${analysis.unexpectedModules.length}\n`);
            
            return analysis;
        },
        
        /**
         * Étape 4: Vérifier les composants React
         */
        checkReactComponents() {
            console.log('⚛️ ÉTAPE 4: COMPOSANTS REACT');
            console.log('-'.repeat(30));
            
            const analysis = {
                reactErrors: [],
                componentErrors: [],
                suspenseIssues: [],
                lazyLoadingIssues: []
            };
            
            // Capturer les erreurs React
            const originalError = console.error;
            const reactErrors = [];
            
            console.error = function(...args) {
                const message = args.join(' ');
                if (message.includes('React') || message.includes('Warning') || message.includes('Error')) {
                    reactErrors.push(message);
                }
                originalError.apply(console, args);
            };
            
            // Vérifier les composants Suspense
            const suspenseElements = document.querySelectorAll('[data-react-suspense]');
            console.log(`🔄 Éléments Suspense trouvés: ${suspenseElements.length}`);
            
            // Vérifier les erreurs de chargement lazy
            this.expectedModules.forEach(expectedModule => {
                const moduleElement = document.querySelector(`[data-module-id="${expectedModule.id}"]`);
                
                if (!moduleElement) {
                    analysis.lazyLoadingIssues.push(`Module ${expectedModule.id} non chargé`);
                    console.log(`❌ Module ${expectedModule.id} non chargé`);
                } else {
                    const hasError = moduleElement.querySelector('.sidebar-module-error');
                    const isLoading = moduleElement.querySelector('.sidebar-module-loading');
                    
                    if (hasError) {
                        analysis.componentErrors.push(`Module ${expectedModule.id} en erreur`);
                        console.log(`❌ Module ${expectedModule.id} en erreur`);
                    } else if (isLoading) {
                        analysis.suspenseIssues.push(`Module ${expectedModule.id} en chargement permanent`);
                        console.log(`⏳ Module ${expectedModule.id} en chargement permanent`);
                    } else {
                        console.log(`✅ Module ${expectedModule.id} chargé correctement`);
                    }
                }
            });
            
            // Restaurer console.error
            console.error = originalError;
            analysis.reactErrors = reactErrors;
            
            console.log(`\n📊 Résumé React: ${analysis.reactErrors.length} erreurs React, ${analysis.componentErrors.length} erreurs de composants\n`);
            return analysis;
        },
        
        /**
         * Étape 5: Vérifier le flux de données
         */
        checkDataFlow() {
            console.log('📊 ÉTAPE 5: FLUX DE DONNÉES');
            console.log('-'.repeat(30));
            
            const analysis = {
                sidebarDataAvailable: false,
                moduleDataAvailable: false,
                dataIssues: []
            };
            
            // Vérifier les données dans le localStorage
            const sidebarKeys = Object.keys(localStorage).filter(key => 
                key.includes('sidebar') || key.includes('quietquest')
            );
            
            console.log(`📦 Clés sidebar dans localStorage: ${sidebarKeys.length}`);
            sidebarKeys.forEach(key => {
                console.log(`   - ${key}`);
            });
            
            // Vérifier les données dans sessionStorage
            const sessionKeys = Object.keys(sessionStorage).filter(key => 
                key.includes('sidebar') || key.includes('quietquest')
            );
            
            console.log(`📦 Clés sidebar dans sessionStorage: ${sessionKeys.length}`);
            sessionKeys.forEach(key => {
                console.log(`   - ${key}`);
            });
            
            // Vérifier les événements de données
            console.log('🔄 Test d\'émission d\'événement de données...');
            
            window.dispatchEvent(new CustomEvent('sidebar:data:test', {
                detail: { test: true, timestamp: Date.now() }
            }));
            
            console.log(`\n📊 Résumé Données: ${analysis.dataIssues.length} problèmes détectés\n`);
            return analysis;
        },
        
        /**
         * Étape 6: Vérifier les problèmes CSS
         */
        checkCSSIssues() {
            console.log('🎨 ÉTAPE 6: PROBLÈMES CSS');
            console.log('-'.repeat(30));
            
            const analysis = {
                cssIssues: [],
                hiddenModules: [],
                styleConflicts: []
            };
            
            this.expectedModules.forEach(expectedModule => {
                const moduleElement = document.querySelector(`[data-module-id="${expectedModule.id}"]`);
                
                if (moduleElement) {
                    const computedStyle = getComputedStyle(moduleElement);
                    const rect = moduleElement.getBoundingClientRect();
                    
                    const styleIssues = [];
                    
                    if (computedStyle.display === 'none') styleIssues.push('display: none');
                    if (computedStyle.visibility === 'hidden') styleIssues.push('visibility: hidden');
                    if (computedStyle.opacity === '0') styleIssues.push('opacity: 0');
                    if (rect.height === 0) styleIssues.push('height: 0');
                    if (rect.width === 0) styleIssues.push('width: 0');
                    
                    if (styleIssues.length > 0) {
                        analysis.hiddenModules.push({
                            id: expectedModule.id,
                            issues: styleIssues
                        });
                        console.log(`❌ ${expectedModule.id}: ${styleIssues.join(', ')}`);
                    } else {
                        console.log(`✅ ${expectedModule.id}: Styles OK`);
                    }
                }
            });
            
            console.log(`\n📊 Résumé CSS: ${analysis.hiddenModules.length} modules avec problèmes CSS\n`);
            return analysis;
        },
        
        /**
         * Étape 7: Vérifier les erreurs JavaScript
         */
        checkJavaScriptErrors() {
            console.log('🐛 ÉTAPE 7: ERREURS JAVASCRIPT');
            console.log('-'.repeat(30));
            
            const analysis = {
                jsErrors: [],
                consoleErrors: [],
                networkErrors: []
            };
            
            // Capturer les erreurs JavaScript
            const originalError = console.error;
            const jsErrors = [];
            
            console.error = function(...args) {
                jsErrors.push(args.join(' '));
                originalError.apply(console, args);
            };
            
            // Forcer le re-rendu pour capturer les erreurs
            try {
                const sidebar = document.querySelector('.sidebar-premium');
                if (sidebar) {
                    // Déclencher un re-rendu
                    sidebar.style.display = 'none';
                    sidebar.offsetHeight; // Force reflow
                    sidebar.style.display = '';
                }
            } catch (error) {
                analysis.jsErrors.push(error.message);
                console.log(`❌ Erreur lors du re-rendu: ${error.message}`);
            }
            
            // Restaurer console.error
            console.error = originalError;
            analysis.consoleErrors = jsErrors;
            
            console.log(`\n📊 Résumé JavaScript: ${analysis.jsErrors.length} erreurs JS détectées\n`);
            return analysis;
        },
        
        /**
         * Génération du rapport final
         */
        generateFinalReport(results) {
            console.log('📋 RAPPORT FINAL DE DIAGNOSTIC');
            console.log('='.repeat(60));
            
            // Analyser les résultats
            const criticalIssues = [];
            const warnings = [];
            const recommendations = [];
            
            // Analyser chaque étape
            if (!results.step1.sidebarFound) {
                criticalIssues.push('SidebarPremium non trouvé - Problème d\'intégration React');
            }
            
            if (!results.step1.moduleContainerFound) {
                criticalIssues.push('Container des modules non trouvé - ModuleRenderer non rendu');
            }
            
            if (results.step2.historicalModulesRendered === 0) {
                criticalIssues.push('Aucun module historique rendu - Problème de configuration ou de chargement');
            }
            
            if (!results.step3.alternationCorrect) {
                warnings.push('Pattern d\'alternance incorrect');
            }
            
            if (results.step4.componentErrors.length > 0) {
                criticalIssues.push(`${results.step4.componentErrors.length} composants en erreur`);
            }
            
            if (results.step6.hiddenModules.length > 0) {
                warnings.push(`${results.step6.hiddenModules.length} modules cachés par CSS`);
            }
            
            // Afficher le résumé
            console.log(`🚨 PROBLÈMES CRITIQUES: ${criticalIssues.length}`);
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
            
            console.log(`\n⚠️ AVERTISSEMENTS: ${warnings.length}`);
            warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
            
            // Générer les recommandations
            if (criticalIssues.length === 0 && warnings.length === 0) {
                console.log('\n🎉 DIAGNOSTIC: Aucun problème critique détecté !');
                console.log('Les modules historiques devraient s\'afficher correctement.');
            } else {
                console.log('\n💡 RECOMMANDATIONS:');
                
                if (!results.step1.sidebarFound) {
                    recommendations.push('Vérifier que SidebarPremium est bien monté dans App.jsx');
                }
                
                if (!results.step1.moduleContainerFound) {
                    recommendations.push('Vérifier que ModuleRenderer est bien rendu dans SidebarPremium');
                }
                
                if (results.step2.historicalModulesRendered === 0) {
                    recommendations.push('Vérifier la configuration des modules dans moduleAlternationService');
                    recommendations.push('Vérifier que les composants historiques sont bien importés');
                }
                
                if (results.step4.componentErrors.length > 0) {
                    recommendations.push('Vérifier les erreurs React dans la console');
                    recommendations.push('Vérifier les props passées aux composants historiques');
                }
                
                if (results.step6.hiddenModules.length > 0) {
                    recommendations.push('Corriger les styles CSS qui cachent les modules');
                    recommendations.push('Exécuter le script de fix CSS');
                }
                
                recommendations.forEach((rec, index) => {
                    console.log(`   ${index + 1}. ${rec}`);
                });
            }
            
            console.log('\n🔧 ACTIONS SUGGÉRÉES:');
            console.log('   1. Exécuter: finalDiagnostic.fixCriticalIssues()');
            console.log('   2. Recharger la page et re-tester');
            console.log('   3. Vérifier les fichiers: SidebarPremium.jsx, ModuleRenderer.jsx');
            
            return {
                criticalIssues,
                warnings,
                recommendations,
                summary: {
                    sidebarFound: results.step1.sidebarFound,
                    modulesRendered: results.step2.modulesRendered,
                    historicalModulesRendered: results.step2.historicalModulesRendered,
                    alternationCorrect: results.step3.alternationCorrect,
                    componentErrors: results.step4.componentErrors.length,
                    hiddenModules: results.step6.hiddenModules.length
                }
            };
        },
        
        /**
         * Tentative de correction des problèmes critiques
         */
        fixCriticalIssues() {
            console.log('🔧 CORRECTION DES PROBLÈMES CRITIQUES');
            console.log('-'.repeat(40));
            
            let fixedCount = 0;
            
            // Fix 1: Forcer l'affichage des modules cachés
            this.expectedModules.forEach(expectedModule => {
                const moduleElement = document.querySelector(`[data-module-id="${expectedModule.id}"]`);
                
                if (moduleElement) {
                    const computedStyle = getComputedStyle(moduleElement);
                    
                    if (computedStyle.display === 'none') {
                        moduleElement.style.display = 'block';
                        console.log(`✅ ${expectedModule.id}: display corrigé`);
                        fixedCount++;
                    }
                    
                    if (computedStyle.visibility === 'hidden') {
                        moduleElement.style.visibility = 'visible';
                        console.log(`✅ ${expectedModule.id}: visibility corrigé`);
                        fixedCount++;
                    }
                    
                    if (computedStyle.opacity === '0') {
                        moduleElement.style.opacity = '1';
                        console.log(`✅ ${expectedModule.id}: opacity corrigé`);
                        fixedCount++;
                    }
                    
                    if (moduleElement.offsetHeight === 0) {
                        moduleElement.style.minHeight = '100px';
                        moduleElement.style.height = 'auto';
                        console.log(`✅ ${expectedModule.id}: height corrigé`);
                        fixedCount++;
                    }
                }
            });
            
            // Fix 2: Forcer le re-rendu de ModuleRenderer
            const moduleContainer = document.querySelector('.sidebar-modules-container');
            if (moduleContainer) {
                moduleContainer.style.display = 'none';
                moduleContainer.offsetHeight; // Force reflow
                moduleContainer.style.display = '';
                console.log('✅ ModuleRenderer re-rendu forcé');
                fixedCount++;
            }
            
            console.log(`\n🎉 Corrections appliquées: ${fixedCount} fixes`);
            
            // Re-lancer le diagnostic après correction
            setTimeout(() => {
                console.log('\n🔄 Vérification post-correction...');
                this.runCompleteDiagnostic();
            }, 1000);
        }
    };
    
    // Exposer l'objet globalement
    window.finalDiagnostic = finalDiagnostic;
    
    // Lancer le diagnostic automatiquement
    finalDiagnostic.runCompleteDiagnostic();
    
    console.log('\n🔧 Final Diagnostic chargé !');
    console.log('📋 Fonctions disponibles :');
    console.log('   - finalDiagnostic.runCompleteDiagnostic()');
    console.log('   - finalDiagnostic.fixCriticalIssues()');
    console.log('   - finalDiagnostic.checkSidebarStructure()');
    console.log('   - finalDiagnostic.checkModuleRenderer()');
    
})();