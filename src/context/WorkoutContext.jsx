import React, { createContext, useContext, useState } from 'react';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';
import { useWorkoutStats } from '../hooks/useWorkoutStats';

const WorkoutContext = createContext();

// Hook personnalisé pour utiliser le contexte
const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  // État principal
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [weekVariant, setWeekVariant] = useState('A');
  const [statsPeriod, setStatsPeriod] = useState('week');
  const [isGymMode, setIsGymMode] = useState(false);
  
  // États des modales
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [showAdvancedStatsModal, setShowAdvancedStatsModal] = useState(false);
  const [showSessionFeedback, setShowSessionFeedback] = useState(false);
  const [showExerciseVariations, setShowExerciseVariations] = useState(false);
  const [showProgramEditor, setShowProgramEditor] = useState(false);
  const [showTrainingCycles, setShowTrainingCycles] = useState(false);
  
  // États spécifiques
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [customPrograms, setCustomPrograms] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [progressForm, setProgressForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      thighs: ''
    },
    notes: ''
  });

  // Hooks personnalisés
  const { data, updateData } = useWorkoutData();
  const workoutLogic = useWorkoutLogic(data, updateData);
  const workoutStats = useWorkoutStats(data);

  // Fonctions utilitaires
  const changeDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const addProgressPhoto = (photoData) => {
    const newPhoto = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...photoData
    };
    
    const newData = {
      ...data,
      progressPhotos: [...(data.progressPhotos || []), newPhoto]
    };
    updateData(newData);
  };

  const deleteProgressPhoto = (photoId) => {
    const newData = {
      ...data,
      progressPhotos: data.progressPhotos.filter(photo => photo.id !== photoId)
    };
    updateData(newData);
  };

  // Fonctions de gestion des programmes
  const createProgram = (programData) => {
    const newProgram = {
      id: Date.now(),
      ...programData,
      status: 'inactive',
      createdAt: new Date().toISOString(),
      startDate: null,
      endDate: null
    };
    setPrograms(prev => [...prev, newProgram]);
  };

  const activateProgram = (programId) => {
    // Désactiver le programme actuel s'il y en a un
    if (activeProgram) {
      setPrograms(prev => prev.map(p => 
        p.id === activeProgram.id 
          ? { ...p, status: 'completed', endDate: new Date().toISOString() }
          : p
      ));
    }
    
    // Activer le nouveau programme
    const programToActivate = programs.find(p => p.id === programId);
    if (programToActivate) {
      const updatedProgram = {
        ...programToActivate,
        status: 'active',
        startDate: new Date().toISOString()
      };
      setPrograms(prev => prev.map(p => 
        p.id === programId ? updatedProgram : p
      ));
      setActiveProgram(updatedProgram);
    }
  };

  const deactivateProgram = () => {
    if (activeProgram) {
      setPrograms(prev => prev.map(p => 
        p.id === activeProgram.id 
          ? { ...p, status: 'completed', endDate: new Date().toISOString() }
          : p
      ));
      setActiveProgram(null);
    }
  };

  const deleteProgram = (programId) => {
    setPrograms(prev => prev.filter(p => p.id !== programId));
    if (activeProgram && activeProgram.id === programId) {
      setActiveProgram(null);
    }
  };

  const value = {
    // État
    currentDate,
    setCurrentDate,
    activeTab,
    setActiveTab,
    weekVariant,
    setWeekVariant,
    statsPeriod,
    setStatsPeriod,
    isGymMode,
    setIsGymMode,
    data,
    
    // Modales
    showSettings,
    setShowSettings,
    showPhotoModal,
    setShowPhotoModal,
    showProgressModal,
    setShowProgressModal,
    showChartsModal,
    setShowChartsModal,
    showHeatmapModal,
    setShowHeatmapModal,
    showAdvancedStatsModal,
    setShowAdvancedStatsModal,
    showSessionFeedback,
    setShowSessionFeedback,
    showExerciseVariations,
    setShowExerciseVariations,
    showProgramEditor,
    setShowProgramEditor,
    showTrainingCycles,
    setShowTrainingCycles,
    
    // États spécifiques
    selectedExercise,
    setSelectedExercise,
    sessionData,
    setSessionData,
    editingProgram,
    setEditingProgram,
    customPrograms,
    setCustomPrograms,
    programs,
    setPrograms,
    activeProgram,
    setActiveProgram,
    progressForm,
    setProgressForm,
    
    // Logique métier
    ...workoutLogic,
    ...workoutStats,
    
    // Fonctions utilitaires
    changeDate,
    addProgressPhoto,
    deleteProgressPhoto,
    createProgram,
    activateProgram,
    deactivateProgram,
    deleteProgram,
    updateData
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

// Exports
export { WorkoutContext, useWorkout };