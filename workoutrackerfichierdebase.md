import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Settings, Trash2, Flame, BarChart3, Calendar, Plus, X } from 'lucide-react';

const WorkoutTrackerApp = () => {
  const workoutProgram = {
    lundi: {
      name: "Street Workout-Boxe",
      focus: "dos / core / contrôle",
      etirements: {
        matin: "1 min respiration nasale + 1 min auto-grandissement + 2 min mobilisation cervicale + 2 min rotations d'épaules",
        midi: "2 min psoas + 1 min rotation thoracique + 2 min pendule d'épaule",
        soir: "3 min jambe à la paroi + 1 min fléchisseurs hanche + 1 min dead hang"
      },
      exercices: [
        { id: 1, name: "Tractions pronation", series: "4×4-6" },
        { id: 2, name: "Tractions australiennes", series: "4×10" },
        { id: 3, name: "Dips parallèles", series: "4×12" },
        { id: 4, name: "Pompes inclinées pieds sur banc", series: "3×12" },
        { id: 5, name: "Pompes inclinées mains sur banc", series: "2×12" },
        { id: 6, name: "Relevés genoux barre", series: "2×20" },
        { id: 7, name: "Relevés genoux parallèles", series: "2×20" },
      ],
      duree: "1h"
    },
    mardi: {
      name: "Natation / Maison",
      focus: "Biceps / Pectoraux / Haut du torse",
      etirements: {
        matin: "3 min respiration allongée + 2 min mobilité scapulaire + 2 min étirement haut du dos",
        midi: "2 min ouverture Y + 1 min sphinx + 2 min massage myofascial",
        soir: "2 min cou + trapèzes + 2 min rouleau + 1 min respiration 4-4-4"
      },
      exercices: [
        { id: 1, name: "Pompes lestées", series: "4×10-12" },
        { id: 2, name: "Pompes inclinées", series: "4×12" },
        { id: 3, name: "Curl alterné haltère", series: "3×10 par bras" },
        { id: 4, name: "Curl marteau", series: "3×12 par bras" },
        { id: 5, name: "Curl Zottman", series: "3×10 par bras" },
        { id: 6, name: "Pompes serrées diamant", series: "3×12" },
        { id: 7, name: "Planche bras tendus", series: "3×30 sec" },
      ],
      duree: "45-55 min"
    },
    mercredi: {
      name: "Boxe - Maison",
      focus: "Pectoraux / Triceps / Épaules",
      etirements: {
        matin: "2 min ischio + 2 min activation fessiers + 2 min psoas",
        midi: "3 min assis mur + 2 min genoux-poitrine + 1 min respiration",
        soir: "3 min posture enfant + 1 min chat-vache + 2 min piriforme"
      },
      exercices: [
        { id: 1, name: "Pompes déclinées", series: "4×10" },
        { id: 2, name: "Pompes pseudo-planche", series: "3×10" },
        { id: 3, name: "Développé militaire unilatéral", series: "3×10 par bras" },
        { id: 4, name: "Élévations latérales", series: "12-15 par bras" },
        { id: 5, name: "Oiseaux", series: "12-15" },
        { id: 6, name: "Face pull", series: "15" },
        { id: 7, name: "Extensions triceps unilatérales", series: "10-12 par bras" },
        { id: 8, name: "Kickbacks triceps", series: "10-12 par bras" },
        { id: 9, name: "Pompes diamant lentes", series: "10-12" },
        { id: 10, name: "Pompes sur poignées tempo", series: "3×12" },
      ],
      duree: "60-70 min"
    },
    jeudi: {
      name: "Repos / Mobilité",
      focus: "Mobilité thoracique & cou",
      etirements: {
        matin: "2 min inclinaisons tête + 2 min cercles thoraciques + 2 min ouverture T",
        midi: "2 min wall slides + 1 min sternocléido + 2 min menton rentré",
        soir: "3 min tête suspendue + 2 min expand belly + 1 min sphinx"
      },
      exercices: [],
      duree: "Étirements"
    },
    vendredi: {
      name: "Street Workout variante",
      focus: "dos / core / contrôle - variante",
      etirements: {
        matin: "2 min appui mur + 1 min marche pieds nus + 2 min demi-pointes",
        midi: "2 min squat passif + 1 min balancier + 1 min jambes chaise",
        soir: "2 min pendule + 2 min relâchement lombaire + 2 min jambe verticale"
      },
      exercices: [
        { id: 1, name: "Tractions supination", series: "4×3 gilet" },
        { id: 2, name: "Tractions australiennes pieds surélevés", series: "4×10-12" },
        { id: 3, name: "Dips parallèles gilet", series: "3×6-8" },
        { id: 4, name: "Pompes déclinées", series: "5×10" },
        { id: 5, name: "Relevés genoux barre", series: "3×20" },
        { id: 6, name: "Relevés genoux parallèles", series: "2×20" },
      ],
      duree: "1h"
    },
    samedi: {
      name: "Maison - Variante",
      focus: "Biceps / Pectoraux / Haut du torse",
      etirements: {
        matin: "3 min marche lente + 1 min respiration alternée + 1 min auto-massage",
        midi: "2 min bras croisés + 2 min sphinx + 2 min pont fessier",
        soir: "3 min twist assis + 2 min psoas + 2 min jambes surélevées"
      },
      exercices: [
        { id: 1, name: "Pompes inclinées tempo", series: "4×10-12" },
        { id: 2, name: "Pompes serrées tempo", series: "3×12" },
        { id: 3, name: "Curl concentration assis", series: "3×10 par bras" },
        { id: 4, name: "Curl marteau", series: "3×12 par bras" },
        { id: 5, name: "Curl Zottman", series: "3×10-12 par bras" },
        { id: 6, name: "Planche avec lever bras alterné", series: "3×30 sec" },
      ],
      duree: "45-55 min"
    },
    dimanche: {
      name: "Maison - Repos",
      focus: "Pectoraux / Triceps / Épaules",
      etirements: {
        matin: "3 min respiration sans tension + 1 min balayage corporel + 1 min bras croisé",
        midi: "2 min chat-vache + 2 min cercles lents + 2 min psoas",
        soir: "5 min jambes en l'air + respiration 4-7-8 + recentrage"
      },
      exercices: [
        { id: 1, name: "Pompes sur poignées gilet", series: "4×10-12" },
        { id: 2, name: "Pompes pseudo-planche inclinées", series: "3×10" },
        { id: 3, name: "Développé militaire unilatéral assis", series: "3×10 par bras" },
        { id: 4, name: "Élévations frontales", series: "12-15 par bras" },
        { id: 5, name: "Oiseaux penché", series: "12-15" },
        { id: 6, name: "Face pull élastique", series: "15" },
        { id: 7, name: "Extensions triceps allongé", series: "10-12 par bras" },
        { id: 8, name: "Kickbacks triceps", series: "10-12 par bras" },
        { id: 9, name: "Pompes diamant lentes", series: "10-12" },
        { id: 10, name: "Pompes tempo sur poignées", series: "3×12" },
      ],
      duree: "60-70 min"
    }
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tab, setTab] = useState('today');
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [weekVariant, setWeekVariant] = useState('A');
  const [statsPeriod, setStatsPeriod] = useState('monthly');
  
  const [data, setData] = useState({
    checked: {},
    reps: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: []
  });

  const [newPhoto, setNewPhoto] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    measurements: { taille: '', poitrine: '', biceps: '', tour_taille: '', hanches: '', cuisses: '' },
    notes: ''
  });

  useEffect(() => {
    loadFromDB();
  }, []);

  useEffect(() => {
    saveToDB();
  }, [data]);

  const loadFromDB = () => {
    const request = indexedDB.open('WorkoutTrackerDB', 1);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };

    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['data'], 'readonly');
      const getReq = tx.objectStore('data').get('appData');
      
      getReq.onsuccess = () => {
        if (getReq.result) {
          setData(getReq.result);
          setWeekVariant(getReq.result.weekVariant || 'A');
        }
      };
    };
  };

  const saveToDB = () => {
    const request = indexedDB.open('WorkoutTrackerDB', 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['data'], 'readwrite');
      tx.objectStore('data').put(data, 'appData');
    };
  };

  const getDateStr = (date) => date.toISOString().split('T')[0];
  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  const getTodayWorkout = () => {
    const day = getDayName(currentDate);
    return workoutProgram[day];
  };

  const toggleCheck = (exerciseName) => {
    const key = `${getDateStr(currentDate)}-${exerciseName}`;
    setData({ ...data, checked: { ...data.checked, [key]: !data.checked[key] } });
  };

  const updateReps = (exerciseName, reps) => {
    const key = `${getDateStr(currentDate)}-${exerciseName}`;
    setData({ ...data, reps: { ...data.reps, [key]: parseInt(reps) || 0 } });
  };

  const toggleEtirement = (type) => {
    const key = `etirement-${getDateStr(currentDate)}-${type}`;
    setData({ ...data, checked: { ...data.checked, [key]: !data.checked[key] } });
  };

  const changeWeekVariant = (variant) => {
    setWeekVariant(variant);
    setData({ ...data, weekVariant: variant });
  };

  const startProgram = () => {
    setData({ ...data, startDate: getDateStr(new Date()) });
  };

  const resetAll = () => {
    if (window.confirm('Réinitialiser toutes les données ?')) {
      setData({
        checked: {},
        reps: {},
        startDate: null,
        weekVariant: 'A',
        progressPhotos: []
      });
      setWeekVariant('A');
    }
  };

  const getDateRange = () => {
    const end = new Date(currentDate);
    const start = new Date(currentDate);

    if (statsPeriod === 'weekly') {
      start.setDate(end.getDate() - 6);
    } else if (statsPeriod === 'monthly') {
      start.setMonth(end.getMonth());
      start.setDate(1);
    } else if (statsPeriod === 'yearly') {
      start.setFullYear(end.getFullYear());
      start.setMonth(0);
      start.setDate(1);
    }

    return { start, end };
  };

  const getStats = () => {
    const { start, end } = getDateRange();
    const stats = {};

    Object.entries(data.reps).forEach(([key, reps]) => {
      const [dateStr, ...parts] = key.split('-');
      const exercise = parts.join('-');
      const date = new Date(dateStr + 'T00:00:00');

      if (date >= start && date <= end && reps > 0) {
        if (!stats[exercise]) {
          stats[exercise] = { total: 0, sessions: 0, maxReps: 0, history: [] };
        }
        stats[exercise].total += reps;
        stats[exercise].sessions += 1;
        stats[exercise].maxReps = Math.max(stats[exercise].maxReps, reps);
        stats[exercise].history.push({ date: dateStr, reps });
      }
    });

    return Object.entries(stats)
      .map(([exercise, statData]) => {
        const sortedHistory = statData.history.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstReps = sortedHistory[0]?.reps || 0;
        const lastReps = sortedHistory[sortedHistory.length - 1]?.reps || 0;
        const progression = firstReps > 0 ? Math.round(((lastReps - firstReps) / firstReps) * 100) : 0;

        return {
          exercise,
          total: statData.total,
          sessions: statData.sessions,
          maxReps: statData.maxReps,
          average: Math.round(statData.total / statData.sessions),
          progression,
          history: sortedHistory
        };
      })
      .sort((a, b) => b.total - a.total);
  };

  const getCurrentStreak = () => {
    let streak = 0;
    let checkDate = new Date(currentDate);
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = getDateStr(checkDate);
      const hasWorkout = Object.keys(data.checked).some(
        key => key.startsWith(dateStr) && !key.includes('etirement') && data.checked[key]
      );

      if (!hasWorkout) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);

      if (data.startDate && checkDate < new Date(data.startDate)) break;
    }

    return streak;
  };

  const getLongestStreak = () => {
    if (!data.startDate) return 0;

    let maxStreak = 0;
    let currentStreak = 0;
    let checkDate = new Date(data.startDate);
    const endDate = new Date();

    checkDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    while (checkDate <= endDate) {
      const dateStr = getDateStr(checkDate);
      const hasWorkout = Object.keys(data.checked).some(
        key => key.startsWith(dateStr) && !key.includes('etirement') && data.checked[key]
      );

      if (hasWorkout) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    return maxStreak;
  };

  const addProgressPhoto = () => {
    if (!newPhoto.date) return;
    const newData = { ...data };
    newData.progressPhotos = [...(newData.progressPhotos || []), { ...newPhoto, id: Date.now() }];
    setData(newData);
    setNewPhoto({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      measurements: { taille: '', poitrine: '', biceps: '', tour_taille: '', hanches: '', cuisses: '' },
      notes: ''
    });
    setShowPhotoModal(false);
  };

  const deleteProgressPhoto = (id) => {
    setData({
      ...data,
      progressPhotos: data.progressPhotos.filter(p => p.id !== id)
    });
  };

  const today = getTodayWorkout();
  const dayName = getDayName(currentDate).charAt(0).toUpperCase() + getDayName(currentDate).slice(1);
  const statistics = getStats();
  const progressPhotos = data.progressPhotos || [];
  const daysUsed = data.startDate ? Math.floor((new Date() - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">💪 Workout Tracker</h1>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
              <Settings size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { id: 'today', label: '📅 Aujourd\'hui' },
              { id: 'stats', label: '📊 Stats' },
              { id: 'history', label: '📖 Historique' },
              { id: 'progress', label: '📸 Suivi' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-2 px-4 rounded-lg font-semibold transition whitespace-nowrap ${
                  tab === t.id ? 'bg-purple-600' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-slate-800 p-4 rounded-lg mb-4 space-y-3">
              <h3 className="font-bold">⚙️ Paramètres</h3>
              {!data.startDate ? (
                <button
                  onClick={startProgram}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold transition"
                >
                  ✓ Commencer le programme
                </button>
              ) : (
                <div className="text-sm space-y-1">
                  <p>📅 Démarré: {new Date(data.startDate).toLocaleDateString('fr-FR')}</p>
                  <p>📊 Jours utilisés: {daysUsed}</p>
                </div>
              )}
              <button
                onClick={resetAll}
                className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Réinitialiser
              </button>
            </div>
          )}
        </div>

        {/* Today Tab */}
        {tab === 'today' && (
          <>
            <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <p className="text-2xl font-bold">{dayName}</p>
                <p className="text-sm text-gray-400">{currentDate.toLocaleDateString('fr-FR')}</p>
              </div>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {today && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${today.focus.includes('Repos') ? 'bg-blue-900' : 'bg-gradient-to-r from-pink-600 to-purple-600'}`}>
                  <h2 className="text-2xl font-bold">{today.name}</h2>
                  <p className="text-sm opacity-90">{today.focus}</p>
                  <p className="text-xs mt-1">⏱️ {today.duree}</p>
                </div>

                {/* Étirements */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">🧘 Étirements</h3>
                  <div className="space-y-2 text-sm">
                    {['matin', 'midi', 'soir'].map(type => (
                      <div
                        key={type}
                        onClick={() => toggleEtirement(type)}
                        className={`p-3 rounded-lg cursor-pointer transition ${
                          data.checked[`etirement-${getDateStr(currentDate)}-${type}`]
                            ? 'bg-green-600 line-through'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <p className="capitalize font-semibold">{type}</p>
                        <p className="opacity-80 text-xs">{today.etirements[type]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercices */}
                {today.exercices.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-bold mb-3">🏋️ Exercices</h3>
                    <div className="space-y-3">
                      {today.exercices.map(ex => (
                        <div
                          key={ex.id}
                          onClick={() => toggleCheck(ex.name)}
                          className={`p-3 rounded-lg cursor-pointer transition ${
                            data.checked[`${getDateStr(currentDate)}-${ex.name}`]
                              ? 'bg-green-600'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={data.checked[`${getDateStr(currentDate)}-${ex.name}`] || false}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{ex.name}</p>
                              <p className="text-xs opacity-80">{ex.series}</p>
                            </div>
                          </div>
                          <div className="ml-7">
                            <input
                              type="number"
                              placeholder="Reps effectuées"
                              value={data.reps[`${getDateStr(currentDate)}-${ex.name}`] || ''}
                              onChange={(e) => updateReps(ex.name, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">📋 Variante</h3>
                  <div className="flex gap-2">
                    {['A', 'B'].map(v => (
                      <button
                        key={v}
                        onClick={() => changeWeekVariant(v)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition ${
                          weekVariant === v ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        Semaine {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="font-bold mb-3">📊 Période</h3>
              <div className="flex gap-2">
                {[
                  { key: 'weekly', label: 'Semaine' },
                  { key: 'monthly', label: 'Mois' },
                  { key: 'yearly', label: 'Année' }
                ].map(p => (
                  <button
                    key={p.key}
                    onClick={() => setStatsPeriod(p.key)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition text-sm ${
                      statsPeriod === p.key ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Streaks */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={24} />
                  <span className="font-bold text-sm">Streak actuel</span>
                </div>
                <p className="text-4xl font-bold">{getCurrentStreak()}</p>
                <p className="text-xs opacity-80 mt-1">jours</p>
              </div>

              <div className="bg-gradient-to-br from-amber-600 to-yellow-600 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={24} />
                  <span className="font-bold text-sm">Record</span>
                </div>
                <p className="text-4xl font-bold">{getLongestStreak()}</p>
                <p className="text-xs opacity-80 mt-1">jours max</p>
              </div>
            </div>

            {/* Top Exercices */}
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="font-bold mb-4">🏆 Top Exercices</h3>
              {statistics.length > 0 ? (
                <div className="space-y-3">
                  {statistics.slice(0, 10).map((stat, idx) => (
                    <div key={idx} className="bg-slate-700 p-3 rounded-lg">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Moy: {stat.average}</span>
                        <span>Max: {stat.maxReps}</span>
                        <span className={stat.progression >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {stat.progression >= 0 ? '▲' : '▼'} {Math.abs(stat.progression)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-1.5 rounded-full"
                          style={{ width: `${(stat.total / (statistics[0]?.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Aucune donnée</p>
              )}
            </div>

            {/* Résumé */}
            {statistics.length > 0 && (
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="font-bold mb-4">📈 Résumé</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total reps:</span>
                    <span className="font-bold text-purple-400">{statistics.reduce((sum, s) => sum + s.total, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exercices:</span>
                    <span className="font-bold text-purple-400">{statistics.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Moyenne/exo:</span>
                    <span className="font-bold text-purple-400">
                      {Math.round(statistics.reduce((sum, s) => sum + s.average, 0) / statistics.length)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Calendar size={20} /> Calendrier & Historique
              </h3>

              {/* Detailed History */}
              <div>
                <h4 className="font-bold mb-3">📝 Derniers entraînements</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(data.reps)
                    .filter(([, reps]) => reps > 0)
                    .sort((a, b) => new Date(b[0].split('-')[0]) - new Date(a[0].split('-')[0]))
                    .slice(0, 50)
                    .map(([key, reps]) => {
                      const [dateStr, ...parts] = key.split('-');
                      const exercise = parts.join('-');
                      return (
                        <div key={key} className="bg-slate-700 p-2 rounded text-sm">
                          <p className="font-semibold text-purple-300">{exercise}</p>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{new Date(dateStr).toLocaleDateString('fr-FR')}</span>
                            <span className="text-green-400 font-bold">{reps} reps</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {tab === 'progress' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">Suivi Corporel</h3>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg transition flex items-center gap-2"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>

              {/* Modal */}
              {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-slate-900 p-6 rounded-lg max-w-md w-full space-y-4 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg">Ajouter un suivi</h4>
                      <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Date</label>
                      <input
                        type="date"
                        value={newPhoto.date}
                        onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Poids (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newPhoto.weight}
                        onChange={(e) => setNewPhoto({ ...newPhoto, weight: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                        placeholder="70.5"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Mensurations (cm)</label>
                      <div className="space-y-2 mt-1">
                        <input type="number" step="0.1" value={newPhoto.measurements.taille} onChange={(e) => setNewPhoto({ ...newPhoto, measurements: { ...newPhoto.measurements, taille: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" placeholder="Taille" />
                        <input type="number" step="0.1" value={newPhoto.measurements.poitrine} onChange={(e) => setNewPhoto({ ...newPhoto, measurements: { ...newPhoto.measurements, poitrine: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" placeholder="Poitrine" />
                        <input type="number" step="0.1" value={newPhoto.measurements.biceps} onChange={(e) => setNewPhoto({ ...newPhoto, measurements: { ...newPhoto.measurements, biceps: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" placeholder="Biceps" />
                        <input type="number" step="0.1" value={newPhoto.measurements.tour_taille} onChange={(e) => setNewPhoto({ ...newPhoto, measurements: { ...newPhoto.measurements, tour_taille: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" placeholder="Tour taille" />
                        <input type="number" step="0.1" value={newPhoto.measurements.hanches} onChange={(e) => setNewPhoto({ ...newPhoto, measurements: { ...newPhoto.measurements, hanches: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" placeholder="Hanches" />
                        <input type="number" step="0.1" value={newPhoto.measurements.cuisses} onChange={(e) => setNewPhoto({ ...newPhoto, measurements: { ...newPhoto.measurements, cuisses: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" placeholder="Cuisses" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Notes</label>
                      <textarea
                        value={newPhoto.notes}
                        onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1 text-sm"
                        rows="2"
                        placeholder="Observations..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setShowPhotoModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg transition">
                        Annuler
                      </button>
                      <button onClick={addProgressPhoto} className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition font-semibold">
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Photos */}
              <div className="space-y-4">
                {progressPhotos.length > 0 ? (
                  progressPhotos
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(photo => (
                      <div key={photo.id} className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">{new Date(photo.date).toLocaleDateString('fr-FR')}</p>
                            {photo.weight && <p className="text-purple-400 font-semibold">⚖️ {photo.weight} kg</p>}
                          </div>
                          <button
                            onClick={() => deleteProgressPhoto(photo.id)}
                            className="text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {Object.values(photo.measurements).some(v => v) && (
                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            {photo.measurements.taille && (
                              <div className="bg-slate-600 p-2 rounded">
                                <p className="text-gray-300 text-xs">Taille</p>
                                <p className="font-bold">{photo.measurements.taille} cm</p>
                              </div>
                            )}
                            {photo.measurements.poitrine && (
                              <div className="bg-slate-600 p-2 rounded">
                                <p className="text-gray-300 text-xs">Poitrine</p>
                                <p className="font-bold">{photo.measurements.poitrine} cm</p>
                              </div>
                            )}
                            {photo.measurements.biceps && (
                              <div className="bg-slate-600 p-2 rounded">
                                <p className="text-gray-300 text-xs">Biceps</p>
                                <p className="font-bold">{photo.measurements.biceps} cm</p>
                              </div>
                            )}
                            {photo.measurements.tour_taille && (
                              <div className="bg-slate-600 p-2 rounded">
                                <p className="text-gray-300 text-xs">Tour taille</p>
                                <p className="font-bold">{photo.measurements.tour_taille} cm</p>
                              </div>
                            )}
                            {photo.measurements.hanches && (
                              <div className="bg-slate-600 p-2 rounded">
                                <p className="text-gray-300 text-xs">Hanches</p>
                                <p className="font-bold">{photo.measurements.hanches} cm</p>
                              </div>
                            )}
                            {photo.measurements.cuisses && (
                              <div className="bg-slate-600 p-2 rounded">
                                <p className="text-gray-300 text-xs">Cuisses</p>
                                <p className="font-bold">{photo.measurements.cuisses} cm</p>
                              </div>
                            )}
                          </div>
                        )}

                        {photo.notes && (
                          <div className="bg-slate-600 p-2 rounded text-sm italic text-gray-300">
                            📝 {photo.notes}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 text-center py-8">Aucune donnée de suivi</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTrackerApp;-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold">{idx + 1}. {stat.exercise}</p>
                          <p className="text-xs text-gray-400">{stat.sessions} séances</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-400">{stat.total}</p>
                          <p className="text-xs text-gray-400">reps</p>
                        </div>
                      </div>
                      <div className="flex justify