/**
 * Panneau de test pour le système de navigation précise
 * Permet de tester toutes les fonctionnalités de navigation
 * 
 * @module components/navigation/NavigationTestPanel
 */

import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../hooks/useNavigation';

/**
 * Composant de test pour la navigation précise
 */
const NavigationTestPanel = ({ isVisible = false, onClose }) => {
  const navigation = useNavigation();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [navigationState, setNavigationState] = useState(null);

  // Mettre à jour l'état de navigation
  useEffect(() => {
    const updateState = () => {
      if (navigation.getNavigationState) {
        setNavigationState(navigation.getNavigationState());
      }
    };

    updateState();
    const interval = setInterval(updateState, 1000);
    
    return () => clearInterval(interval);
  }, [navigation]);

  // Tests de navigation prédéfinis
  const navigationTests = [
    {
      name: 'Navigation Sport > Aujourd\'hui',
      test: () => navigation.navigateToSportModule({
        subtab: 'today',
        moduleId: 'sport-today-main'
      })
    },
    {
      name: 'Navigation Livres > Lecture',
      test: () => navigation.navigateToBooksModule({
        subtab: 'reading',
        moduleId: 'books-reading-session'
      })
    },
    {
      name: 'Navigation Finance > Synthèse',
      test: () => navigation.navigateToFinanceModule({
        subtab: 'synthese',
        moduleId: 'finance-patrimony-evolution'
      })
    },
    {
      name: 'Navigation Quêtes > Quotidien',
      test: () => navigation.navigateToQuestsModule({
        subtab: 'daily',
        moduleId: 'quests-daily-list'
      })
    },
    {
      name: 'Navigation Apprentissage',
      test: () => navigation.navigateToLearningModule({
        moduleId: 'learning-express-module'
      })
    },
    {
      name: 'Navigation Nutrition > Quotidien',
      test: () => navigation.navigateToNutritionModule({
        subtab: 'daily',
        moduleId: 'nutrition-daily-tracking'
      })
    },
    {
      name: 'Navigation Accueil',
      test: () => navigation.navigateToHomeModule({
        moduleId: 'home-creative-projects'
      })
    },
    {
      name: 'Navigation Paramètres',
      test: () => navigation.navigateToSettingsModule({
        moduleId: 'settings-learning-module'
      })
    }
  ];

  // Exécuter un test individuel
  const runSingleTest = async (test) => {
    const startTime = Date.now();
    
    try {
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: test.name,
        success: result,
        duration,
        timestamp: new Date().toLocaleTimeString(),
        error: null
      };
      
      setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: test.name,
        success: false,
        duration,
        timestamp: new Date().toLocaleTimeString(),
        error: error.message
      };
      
      setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
      return testResult;
    }
  };

  // Exécuter tous les tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    for (const test of navigationTests) {
      await runSingleTest(test);
      // Délai entre les tests pour éviter les conflits
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsRunningTests(false);
  };

  // Nettoyer les navigations en attente
  const clearPendingNavigations = () => {
    if (navigation.cancelPendingNavigations) {
      navigation.cancelPendingNavigations();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <h2 className="text-xl font-bold text-white">
            Panneau de Test - Navigation Précise
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* État de navigation */}
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">État de Navigation</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-300">En cours:</span>
                <span className={`ml-2 ${navigationState?.isNavigating ? 'text-yellow-400' : 'text-green-400'}`}>
                  {navigationState?.isNavigating ? 'Oui' : 'Non'}
                </span>
              </div>
              <div>
                <span className="text-slate-300">En attente:</span>
                <span className="ml-2 text-blue-400">
                  {navigationState?.pendingCount || 0}
                </span>
              </div>
              {navigationState?.lastNavigation && (
                <div className="col-span-2">
                  <span className="text-slate-300">Dernière navigation:</span>
                  <div className="ml-2 text-slate-400 text-xs">
                    {navigationState.lastNavigation.target.tab} → {navigationState.lastNavigation.target.moduleId}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contrôles */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {isRunningTests ? 'Tests en cours...' : 'Lancer tous les tests'}
            </button>
            
            <button
              onClick={clearPendingNavigations}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              Annuler navigations en attente
            </button>
            
            <button
              onClick={() => setTestResults([])}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Effacer résultats
            </button>
          </div>

          {/* Tests individuels */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Tests Individuels</h3>
            <div className="grid grid-cols-2 gap-3">
              {navigationTests.map((test, index) => (
                <button
                  key={index}
                  onClick={() => runSingleTest(test)}
                  disabled={isRunningTests}
                  className="p-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg text-left transition-colors"
                >
                  <div className="font-medium text-sm">{test.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Résultats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Résultats des Tests ({testResults.length})
            </h3>
            
            {testResults.length === 0 ? (
              <div className="text-slate-400 text-center py-8">
                Aucun test exécuté
              </div>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-900/20 border-green-600/30'
                        : 'bg-red-900/20 border-red-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                          {result.success ? '✓' : '✗'}
                        </span>
                        <span className="text-white font-medium">{result.name}</span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {result.duration}ms - {result.timestamp}
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 text-red-300 text-sm">
                        Erreur: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationTestPanel;