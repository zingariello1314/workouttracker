import React, { useState, useContext } from 'react';
import { WorkoutContext } from '../../context/WorkoutContext';
import { Play, Pause, Plus, Clock, Calendar, Archive, Settings, Edit3, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { typography } from '../../styles/typography';

const ProgramTab = () => {
  const { programs, activeProgram, createProgram, activateProgram, deactivateProgram, deleteProgram } = useContext(WorkoutContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    duration: 4, // semaines par défaut
    exercises: []
  });

  const formatDuration = (startDate, endDate = null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} mois`;
    }
  };

  const handleCreateProgram = () => {
    if (newProgram.name.trim()) {
      createProgram(newProgram);
      setNewProgram({ name: '', description: '', duration: 4, exercises: [] });
      setShowCreateForm(false);
    }
  };

  const handleActivateProgram = (programId) => {
    activateProgram(programId);
  };

  const handleDeactivateProgram = () => {
    deactivateProgram();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className={`${typography.presets.h1} mb-2`}>
              Programmes d'Entraînement
            </h1>
            <p className="text-slate-300">Gérez vos programmes et suivez votre progression</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau Programme
          </Button>
        </div>

        {/* Programme Actuel */}
        {activeProgram && (
          <Card className="mb-8 gradient-primary border-0">
            <CardContent>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className={`${typography.presets.h3} mb-2`}>Programme Actuel</h2>
                  <h3 className={`${typography.presets.h2} font-bold`}>{activeProgram.name}</h3>
                  {activeProgram.description && (
                    <p className="text-white/90 mt-2">{activeProgram.description}</p>
                  )}
                </div>
                <Button
                  onClick={handleDeactivateProgram}
                  className="bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30 px-3 py-2 rounded-lg transition-colors"
                >
                  <Pause size={16} className="mr-2" />
                  Désactiver
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/80 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Actif depuis {formatDuration(activeProgram.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Durée prévue: {activeProgram.duration} semaines</span>
                </div>
              </div>

              {/* Progression du programme */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/80 mb-2">
                  <span>Progression</span>
                  <span>{Math.min(100, Math.round((new Date() - new Date(activeProgram.startDate)) / (activeProgram.duration * 7 * 24 * 60 * 60 * 1000) * 100))}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, Math.round((new Date() - new Date(activeProgram.startDate)) / (activeProgram.duration * 7 * 24 * 60 * 60 * 1000) * 100))}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulaire de création */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className={typography.presets.h3}>Créer un Nouveau Programme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom du Programme *
                  </label>
                  <input
                    type="text"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Programme Force Débutant"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Décrivez les objectifs et caractéristiques de ce programme..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Durée (semaines)
                  </label>
                  <input
                    type="number"
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram({ ...newProgram, duration: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    max="52"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateProgram}
                  className="btn-primary"
                >
                  Créer le Programme
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des Programmes */}
        <Card>
          <CardHeader>
            <CardTitle className={typography.presets.h3}>Tous les Programmes</CardTitle>
          </CardHeader>
          <CardContent>
            {programs && programs.length > 0 ? (
              <div className="space-y-4">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className={`p-4 rounded-lg border transition-all ${
                      program.id === activeProgram?.id
                        ? 'border-purple-400/50 bg-purple-500/10'
                        : program.status === 'completed'
                        ? 'border-green-400/50 bg-green-500/10'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className={`${typography.presets.h4}`}>{program.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            program.id === activeProgram?.id
                              ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                              : program.status === 'completed'
                              ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                              : 'bg-slate-600/20 text-slate-300 border border-slate-500/30'
                          }`}>
                            {program.id === activeProgram?.id ? 'Actif' : program.status === 'completed' ? 'Terminé' : 'Inactif'}
                          </span>
                        </div>
                        
                        {program.description && (
                          <p className="text-slate-300 mb-3">{program.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>Durée: {program.duration} semaines</span>
                          </div>
                          {program.startDate && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>
                                {program.status === 'completed' 
                                  ? `Utilisé ${formatDuration(program.startDate, program.endDate)}`
                                  : program.id === activeProgram?.id
                                  ? `Actif depuis ${formatDuration(program.startDate)}`
                                  : `Créé le ${new Date(program.createdAt).toLocaleDateString()}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {program.id !== activeProgram?.id && program.status !== 'completed' && (
                          <Button
                            onClick={() => handleActivateProgram(program.id)}
                            className="bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-green-500/30 px-3 py-1 text-sm"
                          >
                            <Play size={14} className="mr-1" />
                            Activer
                          </Button>
                        )}
                        
                        <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        
                        {program.id !== activeProgram?.id && (
                          <button 
                            onClick={() => deleteProgram(program.id)}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Archive size={48} className="mx-auto mb-4 text-slate-500" />
                <p className={`${typography.presets.bodyLarge} mb-2`}>Aucun programme créé</p>
                <p className="text-sm">Commencez par créer votre premier programme d'entraînement</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgramTab;