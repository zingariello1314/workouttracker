import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, RotateCcw, Play, Pause, CheckCircle, AlertCircle, BarChart3, Clock, Zap } from 'lucide-react';

const TrainingCycles = ({ isOpen, onClose, workoutData = [], programs = [] }) => {
  const [activeCycle, setActiveCycle] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Types de cycles prédéfinis
  const cycleTypes = [
    {
      id: 'linear',
      name: 'Périodisation Linéaire',
      description: 'Augmentation progressive de l\'intensité',
      phases: [
        { name: 'Adaptation', weeks: 2, intensity: 'light', focus: 'Volume élevé, technique' },
        { name: 'Accumulation', weeks: 3, intensity: 'moderate', focus: 'Volume modéré, force' },
        { name: 'Intensification', weeks: 2, intensity: 'heavy', focus: 'Intensité élevée' },
        { name: 'Réalisation', weeks: 1, intensity: 'max', focus: 'Performance maximale' }
      ]
    },
    {
      id: 'undulating',
      name: 'Périodisation Ondulante',
      description: 'Variation constante de l\'intensité',
      phases: [
        { name: 'Semaine Légère', weeks: 1, intensity: 'light', focus: 'Récupération active' },
        { name: 'Semaine Modérée', weeks: 1, intensity: 'moderate', focus: 'Volume équilibré' },
        { name: 'Semaine Intense', weeks: 1, intensity: 'heavy', focus: 'Intensité élevée' }
      ]
    },
    {
      id: 'block',
      name: 'Périodisation par Blocs',
      description: 'Blocs spécialisés successifs',
      phases: [
        { name: 'Bloc Anatomique', weeks: 4, intensity: 'moderate', focus: 'Hypertrophie, base' },
        { name: 'Bloc Force Max', weeks: 3, intensity: 'heavy', focus: 'Force maximale' },
        { name: 'Bloc Puissance', weeks: 2, intensity: 'explosive', focus: 'Puissance, vitesse' },
        { name: 'Compétition', weeks: 1, intensity: 'peak', focus: 'Performance' }
      ]
    }
  ];

  const intensityColors = {
    light: 'bg-green-500',
    moderate: 'bg-yellow-500',
    heavy: 'bg-orange-500',
    max: 'bg-red-500',
    explosive: 'bg-purple-500',
    peak: 'bg-pink-500'
  };

  const CreateCycleModal = () => {
    const [cycleName, setCycleName] = useState('');
    const [cycleType, setCycleType] = useState('linear');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [customPhases, setCustomPhases] = useState([]);

    const handleCreateCycle = () => {
      const selectedType = cycleTypes.find(type => type.id === cycleType);
      const totalWeeks = selectedType.phases.reduce((sum, phase) => sum + phase.weeks, 0);
      
      const newCycle = {
        id: Date.now(),
        name: cycleName,
        type: cycleType,
        programId: selectedProgramId,
        startDate,
        totalWeeks,
        phases: selectedType.phases,
        status: 'planned',
        currentPhase: 0,
        currentWeek: 0,
        createdAt: new Date().toISOString()
      };

      setCycles(prev => [...prev, newCycle]);
      setShowCreateCycle(false);
      setCycleName('');
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-6">Créer un nouveau cycle</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom du cycle
              </label>
              <input
                type="text"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Mon cycle d'entraînement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Programme de base
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="">Sélectionner un programme</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type de périodisation
              </label>
              <div className="space-y-3">
                {cycleTypes.map(type => (
                  <div
                    key={type.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      cycleType === type.id
                        ? 'border-purple-500 bg-purple-600/20'
                        : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => setCycleType(type.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{type.name}</h4>
                      <span className="text-sm text-gray-400">
                        {type.phases.reduce((sum, phase) => sum + phase.weeks, 0)} semaines
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{type.description}</p>
                    <div className="flex space-x-2">
                      {type.phases.map((phase, index) => (
                        <div
                          key={index}
                          className="flex-1 h-2 rounded"
                          style={{ 
                            backgroundColor: intensityColors[phase.intensity] || '#64748b',
                            width: `${(phase.weeks / type.phases.reduce((sum, p) => sum + p.weeks, 0)) * 100}%`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowCreateCycle(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateCycle}
              disabled={!cycleName || !selectedProgramId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg"
            >
              Créer le cycle
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CycleProgress = ({ cycle }) => {
    const currentPhase = cycle.phases[cycle.currentPhase];
    const totalWeeks = cycle.phases.reduce((sum, phase) => sum + phase.weeks, 0);
    const completedWeeks = cycle.phases.slice(0, cycle.currentPhase).reduce((sum, phase) => sum + phase.weeks, 0) + cycle.currentWeek;
    const progressPercentage = (completedWeeks / totalWeeks) * 100;

    return (
      <div className="bg-slate-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-white">{cycle.name}</h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">
              Semaine {completedWeeks + 1}/{totalWeeks}
            </span>
            <div className={`w-3 h-3 rounded-full ${
              cycle.status === 'active' ? 'bg-green-500' :
              cycle.status === 'completed' ? 'bg-blue-500' :
              'bg-gray-500'
            }`} />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Progression globale</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {currentPhase && (
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{currentPhase.name}</span>
              <div className={`w-3 h-3 rounded-full ${intensityColors[currentPhase.intensity]}`} />
            </div>
            <p className="text-sm text-gray-300">{currentPhase.focus}</p>
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          {cycle.status === 'planned' && (
            <button
              onClick={() => {
                setCycles(prev => prev.map(c => 
                  c.id === cycle.id ? { ...c, status: 'active' } : c
                ));
                setActiveCycle(cycle);
              }}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-1"
            >
              <Play size={16} />
              <span>Démarrer</span>
            </button>
          )}
          
          {cycle.status === 'active' && (
            <>
              <button
                onClick={() => {
                  setCycles(prev => prev.map(c => 
                    c.id === cycle.id ? { ...c, status: 'paused' } : c
                  ));
                }}
                className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center justify-center space-x-1"
              >
                <Pause size={16} />
                <span>Pause</span>
              </button>
              <button
                onClick={() => {
                  // Avancer d'une semaine
                  const newWeek = cycle.currentWeek + 1;
                  const currentPhaseWeeks = cycle.phases[cycle.currentPhase].weeks;
                  
                  if (newWeek >= currentPhaseWeeks) {
                    // Passer à la phase suivante
                    const newPhase = cycle.currentPhase + 1;
                    if (newPhase >= cycle.phases.length) {
                      // Cycle terminé
                      setCycles(prev => prev.map(c => 
                        c.id === cycle.id ? { ...c, status: 'completed' } : c
                      ));
                    } else {
                      setCycles(prev => prev.map(c => 
                        c.id === cycle.id ? { ...c, currentPhase: newPhase, currentWeek: 0 } : c
                      ));
                    }
                  } else {
                    setCycles(prev => prev.map(c => 
                      c.id === cycle.id ? { ...c, currentWeek: newWeek } : c
                    ));
                  }
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-1"
              >
                <TrendingUp size={16} />
                <span>Semaine suivante</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const CycleAnalytics = () => {
    const completedCycles = cycles.filter(cycle => cycle.status === 'completed');
    const activeCycle = cycles.find(cycle => cycle.status === 'active');
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Cycles complétés</p>
              <p className="text-2xl font-bold text-white">{completedCycles.length}</p>
            </div>
            <CheckCircle className="text-blue-200" size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600/80 to-green-700/80 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-200">Cycle actuel</p>
              <p className="text-lg font-bold text-white">
                {activeCycle ? activeCycle.name : 'Aucun'}
              </p>
            </div>
            <Target className="text-green-200" size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600/80 to-purple-700/80 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-200">Semaines totales</p>
              <p className="text-2xl font-bold text-white">
                {completedCycles.reduce((sum, cycle) => sum + cycle.totalWeeks, 0)}
              </p>
            </div>
            <Calendar className="text-purple-200" size={24} />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <RotateCcw size={24} />
            <span>Gestion des Cycles d'Entraînement</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <CycleAnalytics />

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Mes Cycles</h3>
            <button
              onClick={() => setShowCreateCycle(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Nouveau cycle</span>
            </button>
          </div>

          {cycles.length === 0 ? (
            <div className="text-center py-12 bg-slate-700 rounded-lg">
              <RotateCcw className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-400 mb-4">Aucun cycle d'entraînement créé</p>
              <button
                onClick={() => setShowCreateCycle(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Créer votre premier cycle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cycles.map(cycle => (
                <CycleProgress key={cycle.id} cycle={cycle} />
              ))}
            </div>
          )}

          {/* Légende des intensités */}
          <div className="mt-8 bg-slate-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Légende des intensités</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries({
                light: 'Légère (60-70%)',
                moderate: 'Modérée (70-80%)',
                heavy: 'Lourde (80-90%)',
                max: 'Maximale (90%+)',
                explosive: 'Explosive',
                peak: 'Pic de forme'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${intensityColors[key]}`} />
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCreateCycle && <CreateCycleModal />}
    </div>
  );
};

export default TrainingCycles;