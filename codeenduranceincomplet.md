import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, Waves, Activity, Play, Box, Plus, X, Trash2, Award } from 'lucide-react';

const EnduranceTracker = () => {
  const [activeTab, setActiveTab] = useState('pushups');
  const [pushupSessions, setPushupSessions] = useState([]);
  const [boxingSessions, setBoxingSessions] = useState([]);
  const [swimmingSessions, setSwimmingSessions] = useState([]);
  const [jumpropeSessions, setJumpropeSessions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const pushupResult = await window.storage.get('pushup_sessions');
      const boxingResult = await window.storage.get('boxing_sessions');
      const swimmingResult = await window.storage.get('swimming_sessions');
      const challengesResult = await window.storage.get('challenges');
      
      if (pushupResult) setPushupSessions(JSON.parse(pushupResult.value));
      if (boxingResult) setBoxingSessions(JSON.parse(boxingResult.value));
      if (swimmingResult) setSwimmingSessions(JSON.parse(swimmingResult.value));
      if (challengesResult) setChallenges(JSON.parse(challengesResult.value));
    } catch (error) {
      console.log('Première utilisation');
    }
  };

  const saveData = async (pushupSess, boxingSess, swimmingSess, challs) => {
    try {
      await window.storage.set('pushup_sessions', JSON.stringify(pushupSess));
      await window.storage.set('boxing_sessions', JSON.stringify(boxingSess));
      await window.storage.set('swimming_sessions', JSON.stringify(swimmingSess));
      await window.storage.set('challenges', JSON.stringify(challs));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

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
    activityType: 'pushups'
  });

  const addSession = () => {
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
    saveData(updatedSessions, boxingSessions, swimmingSessions, updatedChallenges);

    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      count: '',
      duration: '',
      notes: ''
    });
    setShowSessionForm(false);
  };

  const addChallenge = () => {
    const newChallenge = {
      id: Date.now(),
      ...challengeForm,
      status: 'active',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    const updatedChallenges = [...challenges, newChallenge];
    setChallenges(updatedChallenges);
    saveData(pushupSessions, boxingSessions, swimmingSessions, updatedChallenges);

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
      activityType: 'pushups'
    });
    setShowChallengeModal(false);
  };

  const addBoxingSession = () => {
    const newSession = {
      id: Date.now(),
      ...boxingForm
    };

    const updatedSessions = [...boxingSessions, newSession];
    setBoxingSessions(updatedSessions);
    saveData(pushupSessions, updatedSessions, swimmingSessions, challenges);

    setBoxingForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '',
      notes: ''
    });
    setShowSessionForm(false);
  };

  const addSwimmingSession = () => {
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
    saveData(pushupSessions, boxingSessions, updatedSessions, updatedChallenges);

    setSwimmingForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      swimType: 'crawl',
      laps: [{ distance: 25, time: '' }],
      notes: ''
    });
    setShowSessionForm(false);
  };

  const deleteSession = (id) => {
    const updatedSessions = pushupSessions.filter(s => s.id !== id);
    setPushupSessions(updatedSessions);
    saveData(updatedSessions, boxingSessions, swimmingSessions, challenges);
  };

  const deleteBoxingSession = (id) => {
    const updatedSessions = boxingSessions.filter(s => s.id !== id);
    setBoxingSessions(updatedSessions);
    saveData(pushupSessions, updatedSessions, swimmingSessions, challenges);
  };

  const deleteSwimmingSession = (id) => {
    const updatedSessions = swimmingSessions.filter(s => s.id !== id);
    setSwimmingSessions(updatedSessions);
    saveData(pushupSessions, boxingSessions, updatedSessions, challenges);
  };

  const deleteChallenge = (id) => {
    const updatedChallenges = challenges.filter(c => c.id !== id);
    setChallenges(updatedChallenges);
    saveData(pushupSessions, boxingSessions, swimmingSessions, updatedChallenges);
  };

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
                      onClick={addSession}
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
                                    onClick={() => deleteSession(session.id)}
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

          {activeTab !== 'pushups' && activeTab !== 'boxing' && activeTab !== 'swimming' && (
            <div className="text-center py-20">
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-12 max-w-md mx-auto">
                <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-slate-300 text-xl font-semibold mb-2">Section en construction</p>
                <p className="text-slate-500">Les fonctionnalités pour {menuItems.find(m => m.id === activeTab)?.label} seront bientôt disponibles</p>
              </div>
            </div>
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
                  <label className="block text-slate-300 text-sm font-medium mb-2">Nombre de pompes</label>
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

export default EnduranceTracker;
