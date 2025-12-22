import React, { useState, useContext } from 'react';
import { WorkoutContext } from '../../context/WorkoutContext';
import { Play, Pause, Plus, Clock, Calendar, Archive, Settings, Edit3, Trash2, Download, Eye } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { typography } from '../../styles/typography';
import { workoutProgram } from '../../data/workoutProgram';
import ProgramDetailView from '../ProgramDetailView';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';

const ProgramTab = () => {
  const { programs, activeProgram, addProgram, activateProgram, deactivateProgram, deleteProgram, updateProgram, data } = useContext(WorkoutContext);
  const { currentUser } = useAuth();
  const t = useTranslation();
  const { formatDate: formatLocaleDate } = useFormatters();
  const { showSuccess } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    duration: 4, // semaines par défaut
    exercises: []
  });

  // Fonction pour calculer les jours réels d'utilisation d'un programme
  const calculateRealUsageDays = (program) => {
    if (!program || !data || !data.checkedExercises) return 0;
    
    // Si le programme a un startDate, compter les jours avec exercices complétés depuis cette date
    if (program.startDate) {
      const programStartDate = new Date(program.startDate);
      programStartDate.setHours(0, 0, 0, 0);
      
      const endDate = program.endDate ? new Date(program.endDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const daysWithExercises = new Set();
      
      // Parcourir tous les exercices complétés
      Object.keys(data.checkedExercises).forEach(key => {
        if (data.checkedExercises[key]) {
          // Extraire la date de la clé (format: YYYY-MM-DD_exerciseId)
          const parts = key.split('_');
          if (parts.length >= 2) {
            const dateStr = parts[0];
            const exerciseDate = new Date(dateStr + 'T00:00:00');
            
            // Vérifier si la date est dans la période du programme
            if (exerciseDate >= programStartDate && exerciseDate <= endDate) {
              daysWithExercises.add(dateStr);
            }
          }
        }
      });
      
      return daysWithExercises.size;
    }
    
    return 0;
  };

  const formatDuration = (startDate, endDate = null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return t('program.duration.' + (diffDays > 1 ? 'days' : 'day'), { count: diffDays });
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t('program.duration.' + (weeks > 1 ? 'weeks' : 'week'), { count: weeks });
    } else {
      const months = Math.floor(diffDays / 30);
      return t('program.duration.months', { count: months });
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314';

  // Pour les utilisateurs non admin, on ne doit jamais exposer les programmes existants.
  const visiblePrograms = isAdmin ? programs : [];
  const visibleActiveProgram = isAdmin ? activeProgram : null;

  const handleCreateProgram = () => {
    if (newProgram.name.trim()) {
      addProgram(newProgram);
      setNewProgram({ name: '', description: '', duration: 4, exercises: [] });
      setShowCreateForm(false);
    }
  };

  const handleActivateProgram = (programId) => {
    activateProgram(programId);
  };

  const handleViewProgram = (program) => {
    setSelectedProgram(program);
  };

  const handleBackToList = () => {
    setSelectedProgram(null);
  };

  const handleUpdateProgram = (updatedProgram) => {
    updateProgram(updatedProgram);
    setSelectedProgram(updatedProgram);
  };

  const handleDeactivateProgram = () => {
    deactivateProgram();
  };

  // Fonction pour importer automatiquement le programme actuel
  const importCurrentProgram = () => {
    if (!isAdmin) {
      return;
    }
    // Conversion du programme actuel au format de l'application
    const convertedSchedule = {};
    
    Object.entries(workoutProgram).forEach(([day, dayData]) => {
      convertedSchedule[day] = {
        name: dayData.name,
        focus: dayData.focus,
        duration: dayData.duree || t('program.misc.notSpecified'),
        notes: dayData.notes || "",
        etirements: {
          matin: { 
            name: t('program.stretches.morning'), 
            duration: "5-7 min", 
            instructions: dayData.etirements?.matin || "" 
          },
          midi: { 
            name: t('program.stretches.midday'), 
            duration: "4-6 min", 
            instructions: dayData.etirements?.midi || "" 
          },
          soir: { 
            name: t('program.stretches.evening'), 
            duration: "5-7 min", 
            instructions: dayData.etirements?.soir || "" 
          }
        },
        exercises: [
          // Exercices classiques
          ...(dayData.exercices?.map(exercise => ({
            id: exercise.id,
            name: exercise.name,
            series: exercise.series,
            reps: "",
            rest: exercise.type?.includes('circuit') ? 30 : (exercise.type?.includes('superset') ? 45 : 90),
            intensity: exercise.series?.includes('4×') ? "heavy" : (exercise.series?.includes('3×') ? "moderate" : "light"),
            notes: exercise.notes || "",
            materiel: exercise.materiel || t('program.equipment.bodyWeight'),
            type: exercise.type || "standard"
          })) || []),
          // Activités complémentaires
          ...(dayData.complementaryActivity ? [{
            id: `complementary_${dayData.complementaryActivity.name.toLowerCase()}`,
            name: dayData.complementaryActivity.name,
            series: `1×${dayData.complementaryActivity.duration}min`,
            reps: "",
            rest: 0,
            intensity: "moderate",
            notes: `${dayData.complementaryActivity.timeSlot} - ${dayData.complementaryActivity.benefits.join(', ')}`,
            materiel: dayData.complementaryActivity.name === "Boxe" ? t('program.equipment.boxingGloves') : t('program.equipment.pool'),
            type: dayData.complementaryActivity.type
          }] : [])
        ],
        // Ajout des variantes salle si elles existent
        salleVariants: dayData.salleVariants ? {
          semaineA: {
            name: dayData.salleVariants.semaineA.name,
            exercises: dayData.salleVariants.semaineA.exercices.map(ex => ({
              id: ex.id,
              name: ex.name,
              series: ex.series,
              reps: "",
              rest: 90,
              intensity: "moderate",
              notes: ex.notes || "",
              materiel: t('program.equipment.gym'),
              type: "standard"
            }))
          },
          semaineB: {
            name: dayData.salleVariants.semaineB.name,
            exercises: dayData.salleVariants.semaineB.exercices.map(ex => ({
              id: ex.id,
              name: ex.name,
              series: ex.series,
              reps: "",
              rest: 90,
              intensity: "moderate",
              notes: ex.notes || "",
              materiel: t('program.equipment.gym'),
              type: "standard"
            }))
          }
        } : undefined
      };
    });

    const currentProgram = {
      id: Date.now().toString(),
      name: t('program.import.defaultName'),
      description: t('program.import.defaultDescription'),
      duration: 12, // 12 semaines
      goal: t('program.import.defaultGoal'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedule: convertedSchedule
    };

    addProgram(currentProgram);
    showSuccess(t('program.import.success'));
  };

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 min-h-screen text-white">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
        {selectedProgram ? (
          <ProgramDetailView 
            program={selectedProgram}
            onBack={handleBackToList}
            onUpdateProgram={handleUpdateProgram}
          />
        ) : (
          <>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className={`${typography.presets.h1} mb-2`}>
                  {t('program.title')}
                </h1>
                <p className="text-slate-300">{t('program.subtitle')}</p>
              </div>
              {isAdmin ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={importCurrentProgram}
                    className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2"
                  >
                    <Download size={20} />
                    {t('program.buttons.import')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
                  >
                    <Plus size={20} />
                    {t('program.buttons.new')}
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-slate-200 max-w-md">
                  Ce programme intégré est réservé à ton compte administrateur.  
                  Connecte-toi avec ton compte principal pour y accéder ou crée un
                  programme personnalisé ici.
                </div>
              )}
            </div>

        {/* Programme Actuel */}
        {visibleActiveProgram && (
          <Card className="mb-8 gradient-primary border-0">
            <CardContent>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className={`${typography.presets.h3} mb-2`}>{t('program.currentProgram.title')}</h2>
                  <h3 className={`${typography.presets.h2} font-bold`}>{visibleActiveProgram.name}</h3>
                  {visibleActiveProgram.description && (
                    <p className="text-white/90 mt-2">{visibleActiveProgram.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDeactivateProgram}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
                >
                  <Pause size={16} />
                  {t('program.currentProgram.deactivate')}
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/80 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{(() => {
                    const realDays = calculateRealUsageDays(visibleActiveProgram);
                    const daysText = realDays > 0 
                      ? `${realDays} jour${realDays > 1 ? 's' : ''}`
                      : formatDuration(visibleActiveProgram.startDate);
                    return t('program.currentProgram.activeSince', { duration: daysText });
                  })()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{t('program.currentProgram.plannedDuration', { weeks: activeProgram.duration })}</span>
                </div>
              </div>

              {/* Progression du programme */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/80 mb-2">
                  <span>{t('program.currentProgram.progress')}</span>
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
              <CardTitle className={typography.presets.h3}>{t('program.createForm.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('program.createForm.name')} {t('program.createForm.nameRequired')}
                  </label>
                  <input
                    type="text"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    className="input-field"
                    placeholder={t('program.createForm.namePlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('program.createForm.description')}
                  </label>
                  <textarea
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder={t('program.createForm.descriptionPlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('program.createForm.duration')}
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
                <button
                  type="button"
                  onClick={handleCreateProgram}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg"
                >
                  {t('program.buttons.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                >
                  {t('program.buttons.cancel')}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des Programmes */}
        <Card>
          <CardHeader>
            <CardTitle className={typography.presets.h3}>{t('program.list.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {visiblePrograms && visiblePrograms.length > 0 ? (
              <div className="space-y-4">
                {visiblePrograms.map((program) => (
                  <div
                    key={program.id}
                    className={`p-4 rounded-lg border transition-all ${
                      program.id === activeProgram?.id
                        ? 'border-purple-400/50 bg-purple-500/10'
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
                              : 'bg-slate-600/20 text-slate-300 border border-slate-500/30'
                          }`}>
                            {program.id === activeProgram?.id ? t('program.status.active') : t('program.status.inactive')}
                          </span>
                        </div>
                        
                        {program.description && (
                          <p className="text-slate-300 mb-3">{program.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{t('program.list.duration', { weeks: program.duration })}</span>
                          </div>
                          {program.startDate && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>
                                {(() => {
                                  const realDays = calculateRealUsageDays(program);
                                  const daysText = realDays > 0 
                                    ? `${realDays} jour${realDays > 1 ? 's' : ''}`
                                    : program.startDate ? formatDuration(program.startDate, program.endDate) : '';
                                  
                                  if (program.id === activeProgram?.id) {
                                    return t('program.list.activeSince', { duration: daysText || '0 jour' });
                                  } else if (program.startDate && realDays > 0) {
                                    return `Utilisé ${daysText}`;
                                  } else {
                                    return t('program.list.createdOn', { date: formatLocaleDate(new Date(program.createdAt)) });
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {program.id !== activeProgram?.id && (
                          <button
                            type="button"
                            onClick={() => handleActivateProgram(program.id)}
                            className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
                          >
                            <Play size={14} />
                            {t('program.buttons.activate')}
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleViewProgram(program)}
                          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
                        >
                          <Eye size={14} />
                          {t('program.buttons.view')}
                        </button>
                        
                        <button
                          type="button"
                          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        {program.id !== activeProgram?.id && (
                          <button
                            type="button"
                            onClick={() => deleteProgram(program.id)}
                            className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
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
                <p className={`${typography.presets.bodyLarge} mb-2`}>{t('program.misc.noPrograms')}</p>
                <p className="text-sm">{t('program.misc.noProgramsHint')}</p>
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}
        </div>
      </div>
    </div>
  );
};

export default ProgramTab;