/**
 * Composant de démonstration pour le système de navigation précise
 * Permet de tester la navigation en conditions réelles
 * 
 * @module components/navigation/NavigationDemo
 */

import React, { useState } from 'react';
import { useNavigation } from '../../hooks/useNavigation';

/**
 * Composant de démonstration de la navigation
 */
const NavigationDemo = () => {
  const navigation = useNavigation();
  const [lastNavigation, setLastNavigation] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Exemples de navigation pour tester le système
  const navigationExamples = [
    {
      name: 'Sport > Aujourd\'hui',
      action: () => navigation.navigateToSportModule({
        subtab: 'today',
        moduleId: 'sport-today-main'
      })
    },
    {
      name: 'Livres > Session de lecture',
      action: () => navigation.navigateToBooksModule({
        subtab: 'reading',
        moduleId: 'books-reading-session'
      })
    },
    {
      name: 'Finance > Évolution patrimoine',
      action: () => navigation.navigateToFinanceModule({
        subtab: 'synthese',
        moduleId: 'finance-patrimony-evolution'
      })
    },
    {
      name: 'Quêtes > Liste quotidienne',
      action: () => navigation.navigateToQuestsModule({
        subtab: 'daily',
        moduleId: 'quests-daily-list'
      })
    },
    {
      name: 'Apprentissage > Module express',
      action: () => navigation.navigateToLearningModule({
        moduleId: 'learning-express-module'
      })
    }
  ];

  // Exécuter une navigation de test
  const executeNavigation = async (example) => {
    setIsNavigating(true);
    setLastNavigation({ name: example.name, status: 'en cours', timestamp: Date.now() });

    try {
      const result = await example.action();
      setLastNavigation({ 
        name: example.name, 
        status: result ? 'succès' : 'échec', 
        timestamp: Date.now() 
      });
    } catch (error) {
      setLastNavigation({ 
        name: example.name, 
        status: 'erreur', 
        error: error.message,
        timestamp: Date.now() 
      });
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg border border-slate-600 max-w-2xl">
      <h3 className="text-xl font-bold text-white mb-4">
        Démonstration Navigation Précise
      </h3>
      
      <p className="text-slate-300 mb-6 text-sm">
        Testez le système de navigation précise avec scroll automatique et mise en évidence des modules.
      </p>

      {/* État de navigation */}
      {lastNavigation && (
        <div className="mb-4 p-3 bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-300">Dernière navigation:</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white font-medium">{lastNavigation.name}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              lastNavigation.status === 'succès' ? 'bg-green-600 text-white' :
              lastNavigation.status === 'échec' ? 'bg-red-600 text-white' :
              lastNavigation.status === 'erreur' ? 'bg-red-700 text-white' :
              'bg-yellow-600 text-white'
            }`}>
              {lastNavigation.status}
            </span>
          </div>
          {lastNavigation.error && (
            <div className="text-red-300 text-xs mt-1">
              {lastNavigation.error}
            </div>
          )}
        </div>
      )}

      {/* Boutons de navigation */}
      <div className="space-y-2">
        {navigationExamples.map((example, index) => (
          <button
            key={index}
            onClick={() => executeNavigation(example)}
            disabled={isNavigating}
            className="w-full p-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-left transition-colors"
          >
            <div className="font-medium">{example.name}</div>
            <div className="text-slate-400 text-sm">
              Cliquez pour tester la navigation précise
            </div>
          </button>
        ))}
      </div>

      {/* Informations sur le système */}
      <div className="mt-6 p-3 bg-slate-900 rounded-lg">
        <div className="text-sm text-slate-300 mb-2">Fonctionnalités testées:</div>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Navigation vers onglets spécifiques</li>
          <li>• Activation automatique des sous-onglets</li>
          <li>• Scroll automatique vers les modules</li>
          <li>• Mise en évidence temporaire des modules</li>
          <li>• Gestion des erreurs et retry</li>
        </ul>
      </div>
    </div>
  );
};

export default NavigationDemo;