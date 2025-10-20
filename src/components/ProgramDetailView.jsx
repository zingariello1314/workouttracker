import React, { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Clock, 
  Dumbbell, 
  Sunrise, 
  Sun, 
  Sunset,
  Plus,
  Trash2
} from 'lucide-react';
import { typography } from '../styles/typography';

const ProgramDetailView = ({ program, onBack, onUpdateProgram }) => {
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingStretch, setEditingStretch] = useState(null);
  const [editedData, setEditedData] = useState({});

  const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const dayNames = {
    lundi: 'Lundi',
    mardi: 'Mardi', 
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche'
  };

  const stretchIcons = {
    matin: Sunrise,
    midi: Sun,
    soir: Sunset
  };

  const handleEditExercise = (dayKey, exerciseId) => {
    const exercise = program.schedule[dayKey].exercises.find(ex => ex.id === exerciseId);
    setEditingExercise({ dayKey, exerciseId });
    setEditedData(exercise);
  };

  const handleSaveExercise = () => {
    const updatedProgram = { ...program };
    const exerciseIndex = updatedProgram.schedule[editingExercise.dayKey].exercises.findIndex(
      ex => ex.id === editingExercise.exerciseId
    );
    
    if (exerciseIndex !== -1) {
      updatedProgram.schedule[editingExercise.dayKey].exercises[exerciseIndex] = {
        ...updatedProgram.schedule[editingExercise.dayKey].exercises[exerciseIndex],
        ...editedData
      };
      onUpdateProgram(updatedProgram);
    }
    
    setEditingExercise(null);
    setEditedData({});
  };

  const handleEditStretch = (dayKey, stretchType) => {
    const stretch = program.schedule[dayKey].etirements[stretchType];
    setEditingStretch({ dayKey, stretchType });
    setEditedData(stretch);
  };

  const handleSaveStretch = () => {
    const updatedProgram = { ...program };
    updatedProgram.schedule[editingStretch.dayKey].etirements[editingStretch.stretchType] = {
      ...updatedProgram.schedule[editingStretch.dayKey].etirements[editingStretch.stretchType],
      ...editedData
    };
    onUpdateProgram(updatedProgram);
    
    setEditingStretch(null);
    setEditedData({});
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setEditingStretch(null);
    setEditedData({});
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={onBack}
          className="bg-slate-600/20 text-slate-300 border border-slate-500/30 hover:bg-slate-600/30 flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Retour
        </Button>
        <div>
          <h1 className={`${typography.presets.h1} mb-2`}>{program.name}</h1>
          <p className="text-slate-300">{program.description}</p>
        </div>
      </div>

      {/* Informations générales */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Durée: {program.duration} semaines</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell size={16} />
              <span>Objectif: {program.goal}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programme détaillé par jour */}
      <div className="space-y-6">
        {daysOfWeek.map((dayKey) => {
          const dayData = program.schedule[dayKey];
          if (!dayData) return null;

          return (
            <Card key={dayKey} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-600">
                <CardTitle className={`${typography.presets.h2} flex items-center justify-between`}>
                  <div>
                    <span className="text-white">{dayNames[dayKey]}</span>
                    <span className="text-slate-300 font-normal ml-3">- {dayData.name}</span>
                  </div>
                  <div className="text-sm text-slate-400 font-normal">
                    {dayData.duration} • {dayData.focus}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Étirements */}
                {dayData.etirements && (
                  <div className="mb-8">
                    <h3 className={`${typography.presets.h3} mb-4 flex items-center gap-2`}>
                      <Sunrise size={20} className="text-orange-400" />
                      Étirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(dayData.etirements).map(([stretchType, stretch]) => {
                        const IconComponent = stretchIcons[stretchType];
                        const isEditing = editingStretch?.dayKey === dayKey && editingStretch?.stretchType === stretchType;
                        
                        return (
                          <div key={stretchType} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <IconComponent size={16} className="text-orange-400" />
                                <span className="font-medium capitalize">{stretchType}</span>
                              </div>
                              {!isEditing && (
                                <Button
                                  onClick={() => handleEditStretch(dayKey, stretchType)}
                                  className="p-1 h-auto bg-transparent hover:bg-slate-600/50 text-slate-400 hover:text-slate-200"
                                >
                                  <Edit3 size={14} />
                                </Button>
                              )}
                            </div>
                            
                            {isEditing ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editedData.name || ''}
                                  onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                  placeholder="Nom de l'étirement"
                                />
                                <input
                                  type="text"
                                  value={editedData.duration || ''}
                                  onChange={(e) => setEditedData({...editedData, duration: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                  placeholder="Durée"
                                />
                                <textarea
                                  value={editedData.instructions || ''}
                                  onChange={(e) => setEditedData({...editedData, instructions: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                  rows="3"
                                  placeholder="Instructions"
                                />
                                <div className="flex gap-2">
                                  <Button onClick={handleSaveStretch} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm">
                                    <Save size={14} className="mr-1" />
                                    Sauver
                                  </Button>
                                  <Button onClick={cancelEdit} className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 text-sm">
                                    <X size={14} className="mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-slate-200 mb-1">{stretch.name}</div>
                                <div className="text-xs text-slate-400 mb-2">{stretch.duration}</div>
                                <div className="text-xs text-slate-300 leading-relaxed">{stretch.instructions}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Exercices */}
                {dayData.exercises && dayData.exercises.length > 0 && (
                  <div>
                    <h3 className={`${typography.presets.h3} mb-4 flex items-center gap-2`}>
                      <Dumbbell size={20} className="text-blue-400" />
                      Exercices ({dayData.exercises.length})
                    </h3>
                    <div className="space-y-3">
                      {dayData.exercises.map((exercise, index) => {
                        const isEditing = editingExercise?.dayKey === dayKey && editingExercise?.exerciseId === exercise.id;
                        
                        return (
                          <div key={exercise.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <input
                                        type="text"
                                        value={editedData.name || ''}
                                        onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                        placeholder="Nom de l'exercice"
                                      />
                                      <input
                                        type="text"
                                        value={editedData.series || ''}
                                        onChange={(e) => setEditedData({...editedData, series: e.target.value})}
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                        placeholder="Séries (ex: 4×8-10)"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <input
                                        type="text"
                                        value={editedData.materiel || ''}
                                        onChange={(e) => setEditedData({...editedData, materiel: e.target.value})}
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                        placeholder="Matériel"
                                      />
                                      <select
                                        value={editedData.intensity || ''}
                                        onChange={(e) => setEditedData({...editedData, intensity: e.target.value})}
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                      >
                                        <option value="light">Léger</option>
                                        <option value="moderate">Modéré</option>
                                        <option value="heavy">Lourd</option>
                                        <option value="max">Maximum</option>
                                      </select>
                                      <input
                                        type="number"
                                        value={editedData.rest || ''}
                                        onChange={(e) => setEditedData({...editedData, rest: parseInt(e.target.value)})}
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                        placeholder="Repos (sec)"
                                      />
                                    </div>
                                    <textarea
                                      value={editedData.notes || ''}
                                      onChange={(e) => setEditedData({...editedData, notes: e.target.value})}
                                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                                      rows="2"
                                      placeholder="Notes techniques"
                                    />
                                    <div className="flex gap-2">
                                      <Button onClick={handleSaveExercise} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm">
                                        <Save size={14} className="mr-1" />
                                        Sauver
                                      </Button>
                                      <Button onClick={cancelEdit} className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 text-sm">
                                        <X size={14} className="mr-1" />
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-xs font-medium">
                                        {index + 1}
                                      </span>
                                      <h4 className="font-medium text-slate-200">{exercise.name}</h4>
                                      {exercise.type && exercise.type !== 'standard' && (
                                        <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-xs">
                                          {exercise.type}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-2">
                                      <div>
                                        <span className="text-slate-400">Séries:</span>
                                        <div className="font-medium">{exercise.series}</div>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Repos:</span>
                                        <div className="font-medium">{exercise.rest}s</div>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Intensité:</span>
                                        <div className="font-medium capitalize">{exercise.intensity}</div>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Matériel:</span>
                                        <div className="font-medium">{exercise.materiel}</div>
                                      </div>
                                    </div>
                                    
                                    {exercise.notes && (
                                      <div className="text-xs text-slate-400 italic mt-2">
                                        {exercise.notes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {!isEditing && (
                                <Button
                                  onClick={() => handleEditExercise(dayKey, exercise.id)}
                                  className="ml-3 p-2 h-auto bg-transparent hover:bg-slate-600/50 text-slate-400 hover:text-slate-200"
                                >
                                  <Edit3 size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Variantes Salle */}
                {dayData.salleVariants && (
                  <div className="mt-6">
                    <h3 className={`${typography.presets.h3} mb-4 flex items-center gap-2`}>
                      <Dumbbell size={20} className="text-purple-400" />
                      Variantes Salle
                    </h3>
                    
                    {/* Semaine A */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-purple-200 mb-3 flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-sm">
                          Semaine A
                        </span>
                        {dayData.salleVariants.semaineA.name}
                      </h4>
                      <div className="space-y-3">
                        {dayData.salleVariants.semaineA.exercises.map((exercise, index) => (
                          <div key={exercise.id} className="bg-purple-700/20 rounded-lg p-4 border border-purple-600/30">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-xs font-medium">
                                {index + 1}
                              </span>
                              <h5 className="font-medium text-slate-200">{exercise.name}</h5>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-2">
                              <div>
                                <span className="text-slate-400">Séries:</span>
                                <div className="font-medium">{exercise.series}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Repos:</span>
                                <div className="font-medium">{exercise.rest}s</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Intensité:</span>
                                <div className="font-medium capitalize">{exercise.intensity}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Matériel:</span>
                                <div className="font-medium">{exercise.materiel}</div>
                              </div>
                            </div>
                            
                            {exercise.notes && (
                              <div className="text-xs text-slate-400 italic mt-2">
                                {exercise.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Semaine B */}
                    <div>
                      <h4 className="text-lg font-semibold text-purple-200 mb-3 flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-sm">
                          Semaine B
                        </span>
                        {dayData.salleVariants.semaineB.name}
                      </h4>
                      <div className="space-y-3">
                        {dayData.salleVariants.semaineB.exercises.map((exercise, index) => (
                          <div key={exercise.id} className="bg-purple-700/20 rounded-lg p-4 border border-purple-600/30">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-xs font-medium">
                                {index + 1}
                              </span>
                              <h5 className="font-medium text-slate-200">{exercise.name}</h5>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-2">
                              <div>
                                <span className="text-slate-400">Séries:</span>
                                <div className="font-medium">{exercise.series}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Repos:</span>
                                <div className="font-medium">{exercise.rest}s</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Intensité:</span>
                                <div className="font-medium capitalize">{exercise.intensity}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Matériel:</span>
                                <div className="font-medium">{exercise.materiel}</div>
                              </div>
                            </div>
                            
                            {exercise.notes && (
                              <div className="text-xs text-slate-400 italic mt-2">
                                {exercise.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes du jour */}
                {dayData.notes && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h4 className="font-medium text-yellow-200 mb-2">Notes importantes</h4>
                    <p className="text-sm text-yellow-100">{dayData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramDetailView;