import React, { useState } from 'react';
import SidebarHeartRateChart from '../SidebarHeartRateChart';

/**
 * Composant de démonstration pour SidebarHeartRateChart
 * Utilisé pour tester visuellement le composant avec différents jeux de données
 */
const SidebarHeartRateChartDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('realistic');

  // Données de démonstration réalistes
  const createRealisticData = () => {
    const baseTime = new Date('2025-12-15T06:00:00').getTime();
    const data = [];
    
    // Sommeil (6h-8h) - FC basse
    for (let i = 0; i < 8; i++) {
      data.push({
        timestamp: baseTime + i * 15 * 60 * 1000,
        bpm: 50 + Math.random() * 10,
        isReal: true
      });
    }
    
    // Réveil et activité matinale (8h-10h)
    for (let i = 0; i < 8; i++) {
      data.push({
        timestamp: baseTime + (8 + i * 0.25) * 60 * 60 * 1000,
        bpm: 65 + i * 5 + Math.random() * 15,
        isReal: true
      });
    }
    
    // Activité sportive (10h-11h)
    for (let i = 0; i < 12; i++) {
      data.push({
        timestamp: baseTime + (10 + i * 0.083) * 60 * 60 * 1000,
        bpm: 120 + Math.sin(i * 0.5) * 30 + Math.random() * 20,
        isReal: true,
        isActivity: i > 2 && i < 10
      });
    }
    
    // Récupération et journée normale (11h-22h)
    for (let i = 0; i < 22; i++) {
      data.push({
        timestamp: baseTime + (11 + i * 0.5) * 60 * 60 * 1000,
        bpm: 80 + Math.sin(i * 0.3) * 15 + Math.random() * 10,
        isReal: i % 2 === 0
      });
    }
    
    return data;
  };

  // Données éparses
  const createSparseData = () => [
    { timestamp: new Date('2025-12-15T08:00:00').getTime(), bpm: 65, isReal: true },
    { timestamp: new Date('2025-12-15T12:00:00').getTime(), bpm: 120, isReal: true },
    { timestamp: new Date('2025-12-15T16:00:00').getTime(), bpm: 95, isReal: true },
    { timestamp: new Date('2025-12-15T20:00:00').getTime(), bpm: 75, isReal: true }
  ];

  // Données avec activité intense
  const createIntenseActivityData = () => {
    const baseTime = new Date('2025-12-15T07:00:00').getTime();
    const data = [];
    
    // Données normales le matin
    for (let i = 0; i < 20; i++) {
      data.push({
        timestamp: baseTime + i * 30 * 60 * 1000,
        bpm: 70 + Math.random() * 20,
        isReal: true
      });
    }
    
    // Activité intense (course à pied)
    for (let i = 0; i < 30; i++) {
      data.push({
        timestamp: baseTime + (10 + i * 0.033) * 60 * 60 * 1000,
        bpm: 150 + Math.sin(i * 0.2) * 25 + Math.random() * 15,
        isReal: true,
        isActivity: true
      });
    }
    
    // Récupération
    for (let i = 0; i < 15; i++) {
      data.push({
        timestamp: baseTime + (11 + i * 0.5) * 60 * 60 * 1000,
        bpm: 120 - i * 3 + Math.random() * 10,
        isReal: true
      });
    }
    
    return data;
  };

  const demoData = {
    realistic: createRealisticData(),
    sparse: createSparseData(),
    intense: createIntenseActivityData(),
    empty: []
  };

  const createGarminData = (timeSeriesData) => ({
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          timeSeries: timeSeriesData,
          max: timeSeriesData.length > 0 ? Math.max(...timeSeriesData.map(d => d.bpm)) : null,
          resting: timeSeriesData.length > 0 ? Math.min(...timeSeriesData.map(d => d.bpm)) : null,
          avg: timeSeriesData.length > 0 ? Math.round(timeSeriesData.reduce((sum, d) => sum + d.bpm, 0) / timeSeriesData.length) : null
        }
      }
    }
  });

  const demoConfigs = [
    { key: 'realistic', label: 'Données Réalistes', description: 'Journée type avec sommeil, réveil, sport et récupération' },
    { key: 'sparse', label: 'Données Éparses', description: 'Peu de points de données dans la journée' },
    { key: 'intense', label: 'Activité Intense', description: 'Journée avec course à pied intense' },
    { key: 'empty', label: 'Aucune Donnée', description: 'Test de l\'état vide' }
  ];

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          Démonstration SidebarHeartRateChart
        </h1>
        
        {/* Sélecteur de démonstration */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Choisir un jeu de données :</h2>
          <div className="grid grid-cols-2 gap-3">
            {demoConfigs.map(config => (
              <button
                key={config.key}
                onClick={() => setSelectedDemo(config.key)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedDemo === config.key
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="font-medium">{config.label}</div>
                <div className="text-sm opacity-75">{config.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Informations sur les données */}
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-white font-medium mb-2">Informations sur les données :</h3>
          <div className="text-slate-300 text-sm space-y-1">
            <div>Points de données : {demoData[selectedDemo].length}</div>
            <div>Points réels : {demoData[selectedDemo].filter(d => d.isReal).length}</div>
            <div>Points d'activité : {demoData[selectedDemo].filter(d => d.isActivity).length}</div>
            {demoData[selectedDemo].length > 0 && (
              <>
                <div>FC Min : {Math.min(...demoData[selectedDemo].map(d => d.bpm))} bpm</div>
                <div>FC Max : {Math.max(...demoData[selectedDemo].map(d => d.bpm))} bpm</div>
                <div>FC Moyenne : {Math.round(demoData[selectedDemo].reduce((sum, d) => sum + d.bpm, 0) / demoData[selectedDemo].length)} bpm</div>
              </>
            )}
          </div>
        </div>

        {/* Démonstrations avec différentes configurations */}
        <div className="space-y-6">
          {/* Configuration standard */}
          <div>
            <h3 className="text-white font-medium mb-3">Configuration Standard (280px)</h3>
            <div className="max-w-md">
              <SidebarHeartRateChart
                garminData={createGarminData(demoData[selectedDemo])}
                selectedDate="2025-12-15"
                height={280}
                compactMode={true}
                colors={{ red: '#EF4444' }}
              />
            </div>
          </div>

          {/* Configuration compacte */}
          <div>
            <h3 className="text-white font-medium mb-3">Configuration Compacte (200px)</h3>
            <div className="max-w-md">
              <SidebarHeartRateChart
                garminData={createGarminData(demoData[selectedDemo])}
                selectedDate="2025-12-15"
                height={200}
                compactMode={true}
                colors={{ red: '#F59E0B' }}
              />
            </div>
          </div>

          {/* Configuration étendue */}
          <div>
            <h3 className="text-white font-medium mb-3">Configuration Étendue (300px max)</h3>
            <div className="max-w-md">
              <SidebarHeartRateChart
                garminData={createGarminData(demoData[selectedDemo])}
                selectedDate="2025-12-15"
                height={400} // Sera limité à 300px
                compactMode={true}
                colors={{ red: '#10B981' }}
              />
            </div>
          </div>
        </div>

        {/* Notes techniques */}
        <div className="mt-8 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-white font-medium mb-2">Notes Techniques :</h3>
          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
            <li>Le composant respecte la contrainte de hauteur maximale de 300px (Requirement 4.1)</li>
            <li>L'affichage est optimisé pour l'espace restreint de la sidebar (Requirement 4.4)</li>
            <li>La légende est compacte et adaptée à l'espace disponible</li>
            <li>Les couleurs et styles sont cohérents avec le sous-onglet Garmin (Requirement 2.1)</li>
            <li>Les données insuffisantes sont signalées avec un indicateur d'avertissement</li>
            <li>Les points d'activité sont mis en évidence en vert</li>
            <li>Le tooltip est adapté pour l'espace réduit</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeartRateChartDemo;