import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, Waves, Activity, Play, Box, Plus, X, Trash2, Award } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';

const EnduranceTab = () => {
  const { data, updateData } = useWorkout();
  const { getWorkoutHistory } = useWorkoutStats();
  
  const [activeTab, setActiveTab] = useState('boxing');
  const [pushupSessions, setPushupSessions] = useState([]);
  const [boxingSessions, setBoxingSessions] = useState([]);
  const [swimmingSessions, setSwimmingSessions] = useState([]);
  const [jumpropeSessions, setJumpropeSessions] = useState([]);
  const [runningSessions, setRunningSessions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);

  // Charger les données d'endurance depuis les données principales
  useEffect(() => {
    loadEnduranceData();
  }, [data]);

  const loadEnduranceData = () => {
    // Charger depuis les données principales de l'app
    const enduranceData = data.enduranceData || {};
    
    setPushupSessions(enduranceData.pushupSessions || []);
    setBoxingSessions(enduranceData.boxingSessions || []);
    setSwimmingSessions(enduranceData.swimmingSessions || []);
    setJumpropeSessions(enduranceData.jumpropeSessions || []);
    setRunningSessions(enduranceData.runningSessions || []);
    setChallenges(enduranceData.challenges || []);
  };

  const saveEnduranceData = async (newData) => {
    try {
      await updateData({
        enduranceData: {
          ...data.enduranceData,
          ...newData,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur sauvegarde endurance:', error);
    }
  };

  // Récupérer les exercices d'endurance depuis l'historique des séances
  const getEnduranceExercisesFromHistory = () => {
    const history = getWorkoutHistory();
    const enduranceExercises = [];
    
    history.forEach(workout => {
      workout.exercises.forEach(exercise => {
        // Filtrer les exercices d'endurance selon votre base de données
        if (isEnduranceExercise(exercise.name)) {
          enduranceExercises.push({
            ...exercise,
            date: workout.date,
            workoutType: workout.type
          });
        }
      });
    });
    
    return enduranceExercises;
  };

  // Fonction pour identifier les exercices d'endurance
  const isEnduranceExercise = (exerciseName) => {
    const enduranceKeywords = [
      'boxe', 'boxing', 'natation', 'swimming', 'nage', 'piscine',
      'pompes', 'push-ups', 'push up', 'pushups', 'corde à sauter',
      'jump rope', 'course', 'running', 'jogging', 'cardio'
    ];
    
    const normalizedName = exerciseName.toLowerCase();
    return enduranceKeywords.some(keyword => normalizedName.includes(keyword));
  };

  // Formulaires pour chaque type d'activité
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    count: '',
    duration: '',
    notes: ''
  });

  const [boxingForm, setBoxingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    notes: ''
  });

  const [swimmingForm, setSwimmingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    swimType: 'crawl',
    laps: [{ distance: 25, time: '' }],
    notes: ''
  });

  const [jumpropeForm, setJumpropeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    type: 'continue',
    jumps: '',
    sessionNumber: 1,
    notes: ''
  });

  const [runningForm, setRunningForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    distance: '',
    duration: '',
    type: 'endurance',
    elevation: '',
    notes: ''
  });

  const [challengeForm, setChallengeForm] = useState({
    name: '',
    type: 'ponctuel',
    targetDate: '',
    startDate: '',
    endDate: '',
    frequency: 'daily',
    moment: 'matin',
    goalCount: '',
    goalDuration: '',
    goalDistance: '',
    activityType: 'pushups'
  });

  // Fonctions d'ajout de sessions
  const addPushupSession = async () => {
    const newSession = {
      id: Date.now(),
      ...sessionForm,
      validatedChallenges: []
    };

    const updatedChallenges = challenges.map(challenge => {
      if (challenge.activityType === 'pushups' && challenge.status === 'active') {
        const matchesGoal = 
          (!challenge.goalCount || parseInt(sessionForm.count) >= challenge.goalCount) &&
          (!challenge.goalDuration || parseFloat(sessionForm.duration) <= challenge.goalDuration);

        if (matchesGoal) {
          newSession.validatedChallenges.push(challenge.id);
          return { ...challenge, status: 'completed', completedAt: new Date().toISOString() };
        }
      }
      return challenge;
    });

    const updatedSessions = [...pushupSessions, newSession];
    setPushupSessions(updatedSessions);
    setChallenges(updatedChallenges);
    
    await saveEnduranceData({
      pushupSessions: updatedSessions,
      challenges: updatedChallenges
    });

    resetPushupForm();
    setShowSessionForm(false);
  };

  const addBoxingSession = async () => {
    const newSession = {
      id: Date.now(),
      ...boxingForm
    };

    const updatedSessions = [...boxingSessions, newSession];
    setBoxingSessions(updatedSessions);
    
    await saveEnduranceData({
      boxingSessions: updatedSessions
    });

    resetBoxingForm();
    setShowSessionForm(false);
  };

  const addSwimmingSession = async () => {
    const totalDistance = swimmingForm.laps.reduce((sum, lap) => sum + parseFloat(lap.distance || 0), 0);
    const totalTime = swimmingForm.laps.reduce((sum, lap) => {
      const [min, sec] = (lap.time || '0:0').split(':').map(Number);
      return sum + (min * 60 + sec);
    }, 0);
    const avgPace = totalDistance > 0 ? (totalTime / (totalDistance / 25)).toFixed(1) : 0;

    const newSession = {
      id: Date.now(),
      date: swimmingForm.date,
      time: swimmingForm.time,
      swimType: swimmingForm.swimType,
      laps: swimmingForm.laps,
      totalDistance,
      totalTime,
      avgPace,
      notes: swimmingForm.notes,
      validatedChallenges: []
    };

    // Vérifier validation défis
    const updatedChallenges = challenges.map(challenge => {
      if (challenge.activityType === 'swimming' && challenge.status === 'active') {
        const matchesGoal = 
          (!challenge.goalDistance || totalDistance >= challenge.goalDistance) &&
          (!challenge.goalTime || totalTime <= challenge.goalTime * 60);

        if (matchesGoal) {
          newSession.validatedChallenges.push(challenge.id);
          return { ...challenge, status: 'completed', completedAt: new Date().toISOString() };
        }
      }
      return challenge;
    });

    const updatedSessions = [...swimmingSessions, newSession];
    setSwimmingSessions(updatedSessions);
    setChallenges(updatedChallenges);
    
    await saveEnduranceData({
      swimmingSessions: updatedSessions,
      challenges: updatedChallenges
    });

    resetSwimmingForm();
    setShowSessionForm(false);
  };

  const addJumpropeSession = async () => {
    const newSession = {
      id: Date.now(),
      ...jumpropeForm
    };

    const updatedSessions = [...jumpropeSessions, newSession];
    setJumpropeSessions(updatedSessions);
    
    await saveEnduranceData({
      jumpropeSessions: updatedSessions
    });

    resetJumpropeForm();
    setShowSessionForm(false);
  };

  const addRunningSession = async () => {
    const distance = parseFloat(runningForm.distance) || 0;
    const duration = runningForm.duration || '0:00:00';
    const [hours, minutes, seconds] = duration.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const pace = distance > 0 ? (totalSeconds / distance / 60).toFixed(2) : 0; // min/km
    const speed = distance > 0 ? (distance / (totalSeconds / 3600)).toFixed(2) : 0; // km/h

    const newSession = {
      id: Date.now(),
      ...runningForm,
      pace,
      speed,
      totalSeconds
    };

    const updatedSessions = [...runningSessions, newSession];
    setRunningSessions(updatedSessions);
    
    await saveEnduranceData({
      runningSessions: updatedSessions
    });

    resetRunningForm();
    setShowSessionForm(false);
  };

  const addChallenge = async () => {
    const newChallenge = {
      id: Date.now(),
      ...challengeForm,
      status: 'active',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    const updatedChallenges = [...challenges, newChallenge];
    setChallenges(updatedChallenges);
    
    await saveEnduranceData({
      challenges: updatedChallenges
    });

    resetChallengeForm();
    setShowChallengeModal(false);
  };

  // Fonctions de suppression
  const deletePushupSession = async (id) => {
    const updatedSessions = pushupSessions.filter(s => s.id !== id);
    setPushupSessions(updatedSessions);
    await saveEnduranceData({ pushupSessions: updatedSessions });
  };

  const deleteBoxingSession = async (id) => {
    const updatedSessions = boxingSessions.filter(s => s.id !== id);
    setBoxingSessions(updatedSessions);
    await saveEnduranceData({ boxingSessions: updatedSessions });
  };

  const deleteSwimmingSession = async (id) => {
    const updatedSessions = swimmingSessions.filter(s => s.id !== id);
    setSwimmingSessions(updatedSessions);
    await saveEnduranceData({ swimmingSessions: updatedSessions });
  };

  const deleteJumpropeSession = async (id) => {
    const updatedSessions = jumpropeSessions.filter(s => s.id !== id);
    setJumpropeSessions(updatedSessions);
    await saveEnduranceData({ jumpropeSessions: updatedSessions });
  };

  const deleteRunningSession = async (id) => {
    const updatedSessions = runningSessions.filter(s => s.id !== id);
    setRunningSessions(updatedSessions);
    await saveEnduranceData({ runningSessions: updatedSessions });
  };

  // Fonctions pour le calendrier heatmap
  const getTotalActivities = () => {
    return boxingSessions.length + pushupSessions.length + swimmingSessions.length + 
           jumpropeSessions.length + runningSessions.length;
  };

  const getCurrentStreak = () => {
    const allSessions = [
      ...boxingSessions.map(s => ({ ...s, type: 'boxing' })),
      ...pushupSessions.map(s => ({ ...s, type: 'pushups' })),
      ...swimmingSessions.map(s => ({ ...s, type: 'swimming' })),
      ...jumpropeSessions.map(s => ({ ...s, type: 'jumprope' })),
      ...runningSessions.map(s => ({ ...s, type: 'running' }))
    ];
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasActivity = allSessions.some(session => session.date === dateStr);
      if (hasActivity) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getBestStreak = () => {
    const allSessions = [
      ...boxingSessions.map(s => ({ ...s, type: 'boxing' })),
      ...pushupSessions.map(s => ({ ...s, type: 'pushups' })),
      ...swimmingSessions.map(s => ({ ...s, type: 'swimming' })),
      ...jumpropeSessions.map(s => ({ ...s, type: 'jumprope' })),
      ...runningSessions.map(s => ({ ...s, type: 'running' }))
    ];
    
    if (allSessions.length === 0) return 0;
    
    const sortedSessions = allSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const prevDate = new Date(sortedSessions[i-1].date);
      const currDate = new Date(sortedSessions[i].date);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    return Math.max(maxStreak, currentStreak);
  };

  const getActiveDays = () => {
    const allSessions = [
      ...boxingSessions.map(s => ({ ...s, type: 'boxing' })),
      ...pushupSessions.map(s => ({ ...s, type: 'pushups' })),
      ...swimmingSessions.map(s => ({ ...s, type: 'swimming' })),
      ...jumpropeSessions.map(s => ({ ...s, type: 'jumprope' })),
      ...runningSessions.map(s => ({ ...s, type: 'running' }))
    ];
    
    const uniqueDays = new Set(allSessions.map(session => session.date));
    return uniqueDays.size;
  };

  const getMonthLabels = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months;
  };

  const getCalendarDays = () => {
    const year = selectedYear;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const days = [];
    
    // Ajouter les jours vides pour aligner avec le début de l'année
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter tous les jours de l'année
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getActivityCountForDay = (day) => {
    if (!day) return 0;
    
    const dateStr = day.toISOString().split('T')[0];
    let count = 0;
    
    if (selectedActivityFilter === 'all' || selectedActivityFilter === 'boxing') {
      count += boxingSessions.filter(s => s.date === dateStr).length;
    }
    if (selectedActivityFilter === 'all' || selectedActivityFilter === 'pushups') {
      count += pushupSessions.filter(s => s.date === dateStr).length;
    }
    if (selectedActivityFilter === 'all' || selectedActivityFilter === 'swimming') {
      count += swimmingSessions.filter(s => s.date === dateStr).length;
    }
    if (selectedActivityFilter === 'all' || selectedActivityFilter === 'jumprope') {
      count += jumpropeSessions.filter(s => s.date === dateStr).length;
    }
    if (selectedActivityFilter === 'all' || selectedActivityFilter === 'running') {
      count += runningSessions.filter(s => s.date === dateStr).length;
    }
    
    return count;
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const getActivitiesForDay = (day) => {
    if (!day) return [];
    
    const dateStr = day.toISOString().split('T')[0];
    const activities = [];
    
    boxingSessions.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'boxing',
        time: session.time,
        duration: `${session.duration} min`,
        distance: null
      });
    });
    
    pushupSessions.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'pushups',
        time: session.time,
        duration: session.duration,
        distance: `${session.count} pompes`
      });
    });
    
    swimmingSessions.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'swimming',
        time: session.time,
        duration: session.totalTime,
        distance: `${session.totalDistance}m`
      });
    });
    
    jumpropeSessions.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'jumprope',
        time: session.time,
        duration: session.duration,
        distance: session.jumps ? `${session.jumps} sauts` : null
      });
    });
    
    runningSessions.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'running',
        time: session.time,
        duration: session.duration,
        distance: `${session.distance}km`
      });
    });
    
    return activities.sort((a, b) => a.time.localeCompare(b.time));
  };

  const navigateToActivity = (activityType) => {
    setSelectedDay(null);
    setActiveTab(activityType);
  };

  // Fonctions de reset des formulaires
  const resetPushupForm = () => {
    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      count: '',
      duration: '',
      notes: ''
    });
  };

  const resetBoxingForm = () => {
    setBoxingForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '',
      notes: ''
    });
  };

  const resetSwimmingForm = () => {
    setSwimmingForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      swimType: 'crawl',
      laps: [{ distance: 25, time: '' }],
      notes: ''
    });
  };

  const resetJumpropeForm = () => {
    setJumpropeForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '',
      type: 'continue',
      jumps: '',
      sessionNumber: 1,
      notes: ''
    });
  };

  const resetRunningForm = () => {
    setRunningForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      distance: '',
      duration: '',
      type: 'endurance',
      elevation: '',
      notes: ''
    });
  };

  const resetChallengeForm = () => {
    setChallengeForm({
      name: '',
      type: 'ponctuel',
      targetDate: '',
      startDate: '',
      endDate: '',
      frequency: 'daily',
      moment: 'matin',
      goalCount: '',
      goalDuration: '',
      goalDistance: '',
      activityType: 'pushups'
    });
  };

  // Fonctions utilitaires
  const getActiveChallenges = () => {
    return challenges.filter(c => c.activityType === activeTab && c.status === 'active');
  };

  const addLap = () => {
    setSwimmingForm({
      ...swimmingForm,
      laps: [...swimmingForm.laps, { distance: 25, time: '' }]
    });
  };

  const removeLap = (index) => {
    const newLaps = swimmingForm.laps.filter((_, i) => i !== index);
    setSwimmingForm({ ...swimmingForm, laps: newLaps });
  };

  const updateLap = (index, field, value) => {
    const newLaps = [...swimmingForm.laps];
    newLaps[index][field] = value;
    setSwimmingForm({ ...swimmingForm, laps: newLaps });
  };

  const activeChallenges = getActiveChallenges();

  const menuItems = [
    { id: 'boxing', label: 'Boxe', icon: Box },
    { id: 'pushups', label: 'Pompes', icon: Dumbbell },
    { id: 'swimming', label: 'Natation', icon: Waves },
    { id: 'jumprope', label: 'Corde à sauter', icon: Activity },
    { id: 'running', label: 'Course', icon: Play },
    { id: 'calendar', label: 'Calendrier', icon: Calendar }
  ];

  // Composant pour afficher les exercices d'endurance depuis l'historique
  const EnduranceHistorySection = () => {
    const enduranceExercises = getEnduranceExercisesFromHistory();
    
    if (enduranceExercises.length === 0) {
      return (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Exercices d'Endurance depuis vos Séances</h3>
          <p className="text-slate-400">Aucun exercice d'endurance trouvé dans vos séances passées.</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Exercices d'Endurance depuis vos Séances</h3>
        <div className="space-y-3">
          {enduranceExercises.slice(0, 10).map((exercise, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{exercise.name}</span>
                  <span className="text-slate-400 ml-2">{exercise.reps} répétitions</span>
                </div>
                <div className="text-slate-400 text-sm">{exercise.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Menu latéral */}
      <div className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
        <div className="p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
            Endurance
          </h1>
          <p className="text-slate-400 text-sm mt-2">Suivez votre progression</p>
        </div>
        
        <nav className="px-4">
          {menuItems.map(item => {
            const Icon = item.icon;
            const count = challenges.filter(c => c.activityType === item.id && c.status === 'active').length;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl mb-2 transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-pink-500 to-violet-600 shadow-lg shadow-purple-500/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {count > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Section exercices d'endurance depuis l'historique */}
          <EnduranceHistorySection />

          {/* SECTION BOXE */}
          {activeTab === 'boxing' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Boxe</h2>
                  <p className="text-slate-400">Enregistrez vos sessions d'entraînement</p>
                </div>
                <button
                  onClick={() => setShowSessionForm(!showSessionForm)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle session
                </button>
              </div>

              {/* Formulaire de session boxe */}
              {showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session de boxe</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={boxingForm.date}
                        onChange={(e) => setBoxingForm({...boxingForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={boxingForm.time}
                        onChange={(e) => setBoxingForm({...boxingForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (minutes)</label>
                      <input
                        type="number"
                        step="5"
                        value={boxingForm.duration}
                        onChange={(e) => setBoxingForm({...boxingForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 60"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={boxingForm.notes}
                        onChange={(e) => setBoxingForm({...boxingForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Type d'entraînement, sparring, sac..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addBoxingSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Historique boxe */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {boxingSessions.length === 0 ? (
                    <div className="p-12 text-center">
                      <Box className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boxingSessions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={session.id} 
                              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.duration} min</span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => deleteBoxingSession(session.id)}
                                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION POMPES */}
          {activeTab === 'pushups' && (
            <>
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Pompes</h2>
                  <p className="text-slate-400">Gérez vos sessions et défis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSessionForm(!showSessionForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} en cours
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de session */}
              {showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm({...sessionForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Nombre de pompes</label>
                      <input
                        type="number"
                        value={sessionForm.count}
                        onChange={(e) => setSessionForm({...sessionForm, count: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (minutes)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm({...sessionForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 5"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={sessionForm.notes}
                        onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Commentaires optionnels..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addPushupSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'pushups').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'pushups').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalCount && `${challenge.goalCount} pompes`}
                                {challenge.goalCount && challenge.goalDuration && ' en '}
                                {challenge.goalDuration && `${challenge.goalDuration} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                            </span>
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {pushupSessions.length === 0 ? (
                    <div className="p-12 text-center">
                      <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Pompes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pushupSessions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={session.id} 
                              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.count}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{session.duration} min</td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {session.validatedChallenges?.length > 0 && (
                                    <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                      ✓ Défi validé
                                    </span>
                                  )}
                                  <button
                                    onClick={() => deletePushupSession(session.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION NATATION */}
          {activeTab === 'swimming' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Natation</h2>
                  <p className="text-slate-400">Suivez vos longueurs et performances</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSessionForm(!showSessionForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} en cours
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session de natation</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={swimmingForm.date}
                        onChange={(e) => setSwimmingForm({...swimmingForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={swimmingForm.time}
                        onChange={(e) => setSwimmingForm({...swimmingForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Type de nage</label>
                      <select
                        value={swimmingForm.swimType}
                        onChange={(e) => setSwimmingForm({...swimmingForm, swimType: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="crawl">Crawl</option>
                        <option value="brasse">Brasse</option>
                        <option value="dos">Dos</option>
                        <option value="papillon">Papillon</option>
                        <option value="mixte">Mixte</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-semibold">Longueurs</h4>
                      <button
                        onClick={addLap}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une longueur
                      </button>
                    </div>
                    <div className="space-y-3">
                      {swimmingForm.laps.map((lap, index) => (
                        <div key={index} className="flex gap-3 items-center bg-slate-900/30 p-4 rounded-xl">
                          <span className="text-slate-400 font-medium w-8">#{index + 1}</span>
                          <div className="flex-1">
                            <label className="block text-slate-400 text-xs mb-1">Distance (m)</label>
                            <input
                              type="number"
                              value={lap.distance}
                              onChange={(e) => updateLap(index, 'distance', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-slate-400 text-xs mb-1">Temps (mm:ss)</label>
                            <input
                              type="text"
                              value={lap.time}
                              onChange={(e) => updateLap(index, 'time', e.target.value)}
                              placeholder="1:30"
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>
                          {swimmingForm.laps.length > 1 && (
                            <button
                              onClick={() => removeLap(index)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={swimmingForm.notes}
                      onChange={(e) => setSwimmingForm({...swimmingForm, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      rows="3"
                      placeholder="Commentaires sur la séance..."
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addSwimmingSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {challenges.filter(c => c.activityType === 'swimming').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'swimming').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalDistance && `${challenge.goalDistance}m`}
                                {challenge.goalDistance && challenge.goalTime && ' en '}
                                {challenge.goalTime && `${challenge.goalTime} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                            </span>
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {swimmingSessions.length === 0 ? (
                    <div className="p-12 text-center">
                      <Waves className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {swimmingSessions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session) => (
                        <div key={session.id} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold text-lg">{session.date}</span>
                                <span className="text-slate-400">{session.time}</span>
                                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm">
                                  {session.swimType.charAt(0).toUpperCase() + session.swimType.slice(1)}
                                </span>
                              </div>
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-slate-400">Distance totale:</span>
                                  <span className="text-white font-bold ml-2">{session.totalDistance}m</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Temps total:</span>
                                  <span className="text-white font-bold ml-2">{Math.floor(session.totalTime / 60)}:{(session.totalTime % 60).toString().padStart(2, '0')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Allure moy:</span>
                                  <span className="text-white font-bold ml-2">{session.avgPace}s/25m</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.validatedChallenges?.length > 0 && (
                                <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                  ✓ Défi validé
                                </span>
                              )}
                              <button
                                onClick={() => deleteSwimmingSession(session.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="border-t border-slate-700/50 pt-4">
                            <h5 className="text-slate-400 text-sm mb-3">Détail des longueurs:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {session.laps.map((lap, idx) => (
                                <div key={idx} className="bg-slate-800/50 px-3 py-2 rounded-lg">
                                  <span className="text-slate-500 text-xs">#{idx + 1}</span>
                                  <span className="text-white font-medium ml-2">{lap.distance}m</span>
                                  <span className="text-slate-400 ml-2 text-sm">{lap.time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {session.notes && (
                            <div className="mt-4 text-slate-400 text-sm">
                              <span className="font-medium">Notes:</span> {session.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION CORDE À SAUTER */}
          {activeTab === 'jumprope' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Corde à Sauter</h2>
                  <p className="text-slate-400">Suivez vos sessions et défis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSessionForm(!showSessionForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        ⚠️ Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de session */}
              {showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={jumpropeForm.date}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={jumpropeForm.time}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (mm:ss)</label>
                      <input
                        type="text"
                        value={jumpropeForm.duration}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 5:30"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Type</label>
                      <select
                        value={jumpropeForm.type}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="continue">Continue</option>
                        <option value="fractionne">Fractionné</option>
                        <option value="technique">Technique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Nombre de sauts (optionnel)</label>
                      <input
                        type="number"
                        value={jumpropeForm.jumps}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, jumps: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Session #</label>
                      <input
                        type="number"
                        min="1"
                        value={jumpropeForm.sessionNumber}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, sessionNumber: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={jumpropeForm.notes}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Commentaires optionnels..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addJumpropeSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        addJumpropeSession();
                        setJumpropeForm({...jumpropeForm, sessionNumber: parseInt(jumpropeForm.sessionNumber) + 1});
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all"
                    >
                      Enregistrer et créer une autre
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'jumprope').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'jumprope').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                challenge.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                              </span>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalDuration && `${challenge.goalDuration} min`}
                                {challenge.goalDuration && challenge.goalCount && ' ou '}
                                {challenge.goalCount && `${challenge.goalCount} sauts`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {jumpropeSessions.length === 0 ? (
                    <div className="p-12 text-center">
                      <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Sauts</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Session</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jumpropeSessions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={session.id} 
                              className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10'}`}
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.duration}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                                  {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{session.jumps || '-'}</td>
                              <td className="px-6 py-4 text-slate-300">#{session.sessionNumber}</td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {session.validatedChallenges?.length > 0 && (
                                    <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                      ✓ Défi validé
                                    </span>
                                  )}
                                  <button
                                    onClick={() => deleteJumpropeSession(session.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION COURSE */}
          {activeTab === 'running' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Course</h2>
                  <p className="text-slate-400">Suivez vos performances et défis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSessionForm(!showSessionForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        ⚠️ Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de session */}
              {showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={runningForm.date}
                        onChange={(e) => setRunningForm({...runningForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={runningForm.time}
                        onChange={(e) => setRunningForm({...runningForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={runningForm.distance}
                        onChange={(e) => setRunningForm({...runningForm, distance: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 5.0"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (hh:mm:ss)</label>
                      <input
                        type="text"
                        value={runningForm.duration}
                        onChange={(e) => setRunningForm({...runningForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 0:25:30"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Type</label>
                      <select
                        value={runningForm.type}
                        onChange={(e) => setRunningForm({...runningForm, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="endurance">Endurance</option>
                        <option value="fractionne">Fractionné</option>
                        <option value="recuperation">Récupération</option>
                        <option value="tempo">Tempo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Dénivelé (m) - Optionnel</label>
                      <input
                        type="number"
                        value={runningForm.elevation}
                        onChange={(e) => setRunningForm({...runningForm, elevation: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 150"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={runningForm.notes}
                        onChange={(e) => setRunningForm({...runningForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Commentaires sur la course, conditions météo, sensations..."
                      />
                    </div>
                  </div>
                  
                  {/* Calculs automatiques */}
                  {runningForm.distance && runningForm.duration && (
                    <div className="mt-6 p-4 bg-slate-900/30 border border-slate-600/50 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Calculs automatiques</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Allure:</span>
                          <span className="text-white font-bold ml-2">
                            {(() => {
                              const distance = parseFloat(runningForm.distance);
                              const [hours, minutes, seconds] = runningForm.duration.split(':').map(Number);
                              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              const pace = distance > 0 ? (totalSeconds / distance / 60).toFixed(2) : 0;
                              return `${pace} min/km`;
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Vitesse:</span>
                          <span className="text-white font-bold ml-2">
                            {(() => {
                              const distance = parseFloat(runningForm.distance);
                              const [hours, minutes, seconds] = runningForm.duration.split(':').map(Number);
                              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              const speed = distance > 0 ? (distance / (totalSeconds / 3600)).toFixed(2) : 0;
                              return `${speed} km/h`;
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Dénivelé:</span>
                          <span className="text-white font-bold ml-2">
                            {runningForm.elevation ? `${runningForm.elevation}m` : 'Non renseigné'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addRunningSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'running').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'running').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                challenge.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                              </span>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalDistance && `${challenge.goalDistance}km`}
                                {challenge.goalDistance && challenge.goalDuration && ' en '}
                                {challenge.goalDuration && `${challenge.goalDuration} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {runningSessions.length === 0 ? (
                    <div className="p-12 text-center">
                      <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {runningSessions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session) => (
                        <div key={session.id} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold text-lg">{session.date}</span>
                                <span className="text-slate-400">{session.time}</span>
                                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                                  {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Distance:</span>
                                  <span className="text-white font-bold ml-2">{session.distance}km</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Durée:</span>
                                  <span className="text-white font-bold ml-2">{session.duration}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Allure:</span>
                                  <span className="text-white font-bold ml-2">{session.pace} min/km</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Vitesse:</span>
                                  <span className="text-white font-bold ml-2">{session.speed} km/h</span>
                                </div>
                                {session.elevation && (
                                  <div>
                                    <span className="text-slate-400">Dénivelé:</span>
                                    <span className="text-white font-bold ml-2">{session.elevation}m</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.validatedChallenges?.length > 0 && (
                                <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                  ✓ Défi validé
                                </span>
                              )}
                              <button
                                onClick={() => deleteRunningSession(session.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {session.notes && (
                            <div className="mt-4 text-slate-400 text-sm">
                              <span className="font-medium">Notes:</span> {session.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION CALENDRIER HEATMAP */}
          {activeTab === 'calendar' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Calendrier d'Activité</h2>
                  <p className="text-slate-400">Vue d'ensemble de vos activités d'endurance</p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                  <select
                    value={selectedActivityFilter}
                    onChange={(e) => setSelectedActivityFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="all">Toutes les activités</option>
                    <option value="boxing">Boxe</option>
                    <option value="pushups">Pompes</option>
                    <option value="swimming">Natation</option>
                    <option value="jumprope">Corde à sauter</option>
                    <option value="running">Course</option>
                  </select>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getTotalActivities()}</div>
                  <div className="text-slate-400 text-sm">Activités totales</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getCurrentStreak()}</div>
                  <div className="text-slate-400 text-sm">Jours consécutifs</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getBestStreak()}</div>
                  <div className="text-slate-400 text-sm">Meilleure série</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getActiveDays()}</div>
                  <div className="text-slate-400 text-sm">Jours actifs</div>
                </div>
              </div>

              {/* Heatmap */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Heatmap d'Activité - {selectedYear}</h3>
                
                {/* Légende */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-slate-400 text-sm">Moins d'activité</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-sm ${
                          level === 0 ? 'bg-slate-700' :
                          level === 1 ? 'bg-green-500/20' :
                          level === 2 ? 'bg-green-500/40' :
                          level === 3 ? 'bg-green-500/60' :
                          'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-400 text-sm">Plus d'activité</span>
                </div>

                {/* Calendrier simplifié */}
                <div className="space-y-4">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthName = getMonthLabels()[monthIndex];
                    const monthDate = new Date(selectedYear, monthIndex, 1);
                    const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
                    const firstDayOfWeek = monthDate.getDay();
                    
                    return (
                      <div key={monthIndex} className="bg-slate-900/30 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">{monthName}</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Jours de la semaine */}
                          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, dayIndex) => (
                            <div key={`header-${dayIndex}`} className="text-slate-500 text-xs text-center py-1">
                              {day}
                            </div>
                          ))}
                          
                          {/* Cases vides pour aligner */}
                          {Array.from({ length: firstDayOfWeek }, (_, i) => (
                            <div key={`empty-${i}`} className="w-6 h-6"></div>
                          ))}
                          
                          {/* Jours du mois */}
                          {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                            const dayNumber = dayIndex + 1;
                            const dayDate = new Date(selectedYear, monthIndex, dayNumber);
                            const activityCount = getActivityCountForDay(dayDate);
                            const intensity = Math.min(4, Math.floor(activityCount / 2));
                            
                            return (
                              <div
                                key={`day-${dayNumber}`}
                                className={`w-6 h-6 rounded-sm cursor-pointer transition-all hover:scale-110 flex items-center justify-center text-xs ${
                                  activityCount === 0 ? 'bg-slate-700 hover:bg-slate-600 text-slate-400' :
                                  intensity === 1 ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300' :
                                  intensity === 2 ? 'bg-green-500/40 hover:bg-green-500/50 text-green-200' :
                                  intensity === 3 ? 'bg-green-500/60 hover:bg-green-500/70 text-green-100' :
                                  'bg-green-500 hover:bg-green-400 text-white'
                                }`}
                                onClick={() => handleDayClick(dayDate)}
                                title={`${dayDate.toLocaleDateString('fr-FR')} - ${activityCount} activité${activityCount > 1 ? 's' : ''}`}
                              >
                                {dayNumber}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal des activités du jour */}
              {selectedDay && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-white">
                        Activités du {selectedDay.toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {getActivitiesForDay(selectedDay).map((activity, index) => (
                        <div 
                          key={index}
                          className="bg-slate-900/50 border border-slate-600/50 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
                          onClick={() => navigateToActivity(activity.type)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                activity.type === 'boxing' ? 'bg-red-500' :
                                activity.type === 'pushups' ? 'bg-orange-500' :
                                activity.type === 'swimming' ? 'bg-blue-500' :
                                activity.type === 'jumprope' ? 'bg-purple-500' :
                                'bg-green-500'
                              }`} />
                              <div>
                                <div className="text-white font-medium">
                                  {activity.type === 'boxing' ? 'Boxe' :
                                   activity.type === 'pushups' ? 'Pompes' :
                                   activity.type === 'swimming' ? 'Natation' :
                                   activity.type === 'jumprope' ? 'Corde à sauter' :
                                   'Course'}
                                </div>
                                <div className="text-slate-400 text-sm">{activity.time}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">{activity.duration}</div>
                              {activity.distance && (
                                <div className="text-slate-400 text-sm">{activity.distance}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {getActivitiesForDay(selectedDay).length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          Aucune activité enregistrée ce jour
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal création de défi */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-white">Créer un défi</h3>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Nom du défi</label>
                <input
                  type="text"
                  value={challengeForm.name}
                  onChange={(e) => setChallengeForm({...challengeForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: 100 pompes par jour"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Type d'activité</label>
                <select
                  value={challengeForm.activityType}
                  onChange={(e) => setChallengeForm({...challengeForm, activityType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="pushups">Pompes</option>
                  <option value="swimming">Natation</option>
                  <option value="jumprope">Corde à sauter</option>
                  <option value="running">Course</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Type de défi</label>
                <select
                  value={challengeForm.type}
                  onChange={(e) => setChallengeForm({...challengeForm, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="ponctuel">Ponctuel</option>
                  <option value="recurrent">Récurrent</option>
                  <option value="periode">Sur une période</option>
                </select>
              </div>

              {challengeForm.type === 'ponctuel' && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Date cible</label>
                  <input
                    type="date"
                    value={challengeForm.targetDate}
                    onChange={(e) => setChallengeForm({...challengeForm, targetDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              )}

              {challengeForm.type === 'recurrent' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Fréquence</label>
                    <select
                      value={challengeForm.frequency}
                      onChange={(e) => setChallengeForm({...challengeForm, frequency: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Moment</label>
                    <select
                      value={challengeForm.moment}
                      onChange={(e) => setChallengeForm({...challengeForm, moment: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="matin">Matin</option>
                      <option value="midi">Midi</option>
                      <option value="soir">Soir</option>
                    </select>
                  </div>
                </div>
              )}

              {challengeForm.type === 'periode' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Date début</label>
                    <input
                      type="date"
                      value={challengeForm.startDate}
                      onChange={(e) => setChallengeForm({...challengeForm, startDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Date fin</label>
                    <input
                      type="date"
                      value={challengeForm.endDate}
                      onChange={(e) => setChallengeForm({...challengeForm, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    {challengeForm.activityType === 'swimming' ? 'Distance (mètres)' : 
                     challengeForm.activityType === 'running' ? 'Distance (km)' : 
                     challengeForm.activityType === 'jumprope' ? 'Nombre de sauts' :
                     'Nombre'}
                  </label>
                  <input
                    type="number"
                    value={challengeForm.goalCount}
                    onChange={(e) => setChallengeForm({...challengeForm, goalCount: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Durée max (minutes)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={challengeForm.goalDuration}
                    onChange={(e) => setChallengeForm({...challengeForm, goalDuration: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowChallengeModal(false)}
                className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={addChallenge}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all"
              >
                Créer le défi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnduranceTab;
