import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, BookOpen, Clock3, Trophy, Sparkles, Play, Pause, Square } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { TIMER_DEFAULTS, TIMER_COLORS } from '../../utils/apprentissageConstants';
import sounds from '../../utils/apprentissageAudio';

const DashboardLearningModule = () => {
  const { setActiveTab } = useWorkout();
  const { subjects, progressionData, isLoading, addXP, calculateSessionXP, saveSessionsHistory } = useApprentissageEngine();
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionsHistory, setSessionsHistory] = useState([]);
  const [timer, setTimer] = useState({
    isRunning: false,
    isPaused: false,
    currentSubject: null,
    remainingTime: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
    plannedDuration: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
    progress: 0,
    silentMode: false
  });

  const formatMinutes = (minutes) => {
    const value = Number(minutes) || 0;
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  };

  const globalStats = useMemo(() => {
    const subjectEntries = Object.entries(progressionData?.subjects || {});
    const ranked = subjectEntries
      .map(([name, data]) => ({
        name,
        xp: Number(data?.xp) || 0,
        level: Number(data?.level) || 1,
        sessions: Number(data?.sessions) || 0
      }))
      .sort((a, b) => b.xp - a.xp);

    return {
      subjectsCount: Array.isArray(subjects) ? subjects.length : 0,
      globalXP: Number(progressionData?.globalXP) || 0,
      globalLevel: Number(progressionData?.globalLevel) || 1,
      streak: Number(progressionData?.dailyStreak) || 0,
      totalStudyTime: Number(progressionData?.totalStudyTime) || 0,
      unlockedTrophies: (progressionData?.unlockedTrophies || []).length,
      topSubjects: ranked.slice(0, 3)
    };
  }, [progressionData, subjects]);

  const formatTimer = (seconds) => {
    const mins = Math.floor((Number(seconds) || 0) / 60);
    const secs = (Number(seconds) || 0) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navigateToLearning = (subView = 'matieres') => {
    try {
      localStorage.setItem('apprentissage.activeSubView', subView);
    } catch {
      // no-op
    }
    setActiveTab?.('apprentissage');
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('apprentissage_sessions_history');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSessionsHistory(parsed);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (!Array.isArray(subjects) || subjects.length === 0) return;
    if (selectedSubjectId) return;
    setSelectedSubjectId(subjects[0]?.id || '');
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    saveSessionsHistory?.(sessionsHistory || []);
  }, [sessionsHistory, saveSessionsHistory]);

  const handleTimerEnd = useCallback(() => {
    setTimer((prev) => {
      if (!prev.currentSubject) {
        return {
          ...prev,
          isRunning: false,
          isPaused: false,
          progress: 100
        };
      }

      const sessionData = {
        subject: prev.currentSubject.name,
        startTime: Date.now() - prev.plannedDuration * 1000,
        endTime: Date.now(),
        plannedDuration: prev.plannedDuration,
        actualWorkTime: prev.plannedDuration,
        pauseTime: 0,
        completed: true,
        type: 'work'
      };

      const baseXP = calculateSessionXP?.(sessionData) || 0;
      addXP?.(prev.currentSubject.name, baseXP, sessionData);
      setSessionsHistory((old) => [sessionData, ...old]);
      if (!prev.silentMode) sounds.sessionEnd();

      return {
        ...prev,
        isRunning: false,
        isPaused: false,
        progress: 100
      };
    });
  }, [addXP, calculateSessionXP]);

  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev.remainingTime <= 1) {
          return { ...prev, remainingTime: 0, progress: 100 };
        }
        const newRemaining = prev.remainingTime - 1;
        const progress = ((prev.plannedDuration - newRemaining) / prev.plannedDuration) * 100;
        if (newRemaining === TIMER_DEFAULTS.WARNING_TIME && !prev.silentMode) {
          sounds.warning();
        }
        return {
          ...prev,
          remainingTime: newRemaining,
          progress
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.isPaused]);

  useEffect(() => {
    if (timer.isRunning && timer.remainingTime <= 0) {
      handleTimerEnd();
    }
  }, [timer.isRunning, timer.remainingTime, handleTimerEnd]);

  const selectedSubject = useMemo(
    () => (subjects || []).find((s) => s.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const startLearningTimer = () => {
    if (!selectedSubject) return;
    setTimer({
      isRunning: true,
      isPaused: false,
      currentSubject: selectedSubject,
      remainingTime: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
      plannedDuration: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
      progress: 0,
      silentMode: timer.silentMode
    });
  };

  const togglePause = () => {
    setTimer((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const stopTimer = () => {
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      remainingTime: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
      plannedDuration: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
      progress: 0
    }));
  };

  const addTenMinutes = () => {
    setTimer((prev) => {
      const remainingTime = prev.remainingTime + 10 * 60;
      const plannedDuration = prev.plannedDuration + 10 * 60;
      const progress = ((plannedDuration - remainingTime) / plannedDuration) * 100;
      return { ...prev, remainingTime, plannedDuration, progress };
    });
  };

  const timerColor = useMemo(() => {
    if (timer.isPaused) return TIMER_COLORS.PAUSED;
    if (timer.remainingTime <= TIMER_DEFAULTS.WARNING_TIME) return TIMER_COLORS.WARNING;
    return TIMER_COLORS.RUNNING;
  }, [timer.isPaused, timer.remainingTime]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/25 bg-gradient-to-br from-slate-950/90 via-violet-950/35 to-fuchsia-950/20 shadow-[0_0_80px_rgba(168,85,247,0.18)]">
      <div className="relative p-6 md:p-7 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-fuchsia-500/20 border border-fuchsia-300/40 p-2">
              <GraduationCap className="w-6 h-6 text-fuchsia-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Apprentissage</h3>
              <p className="text-xs text-slate-300">Vue cockpit: progression, rythme et matières clés</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToLearning('matieres')}
              className="h-8 px-3 rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/20 text-fuchsia-100 text-xs font-medium hover:bg-fuchsia-500/30"
            >
              Accéder à matières
            </button>
            <button
              type="button"
              onClick={() => navigateToLearning('sessions')}
              className="h-8 px-3 rounded-lg border border-violet-400/45 bg-violet-500/20 text-violet-100 text-xs font-medium hover:bg-violet-500/30"
            >
              Accéder aux sessions
            </button>
            <button
              type="button"
              onClick={() => navigateToLearning('trophees')}
              className="h-8 px-3 rounded-lg border border-indigo-400/45 bg-indigo-500/20 text-indigo-100 text-xs font-medium hover:bg-indigo-500/30"
            >
              Accéder aux trophées
            </button>
            <button
              type="button"
              onClick={startLearningTimer}
              disabled={!selectedSubject || timer.isRunning}
              className="h-8 px-3 rounded-lg border border-emerald-400/45 bg-emerald-500/20 text-emerald-100 text-xs font-medium hover:bg-emerald-500/30 inline-flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Lancer timer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-fuchsia-500/30 bg-slate-900/55 p-3">
            <div className="text-xs text-slate-400 inline-flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Matières</div>
            <div className="text-xl font-bold text-white mt-0.5">{globalStats.subjectsCount}</div>
          </div>
          <div className="rounded-xl border border-violet-500/30 bg-slate-900/55 p-3">
            <div className="text-xs text-slate-400 inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> XP global</div>
            <div className="text-xl font-bold text-white mt-0.5">{globalStats.globalXP}</div>
          </div>
          <div className="rounded-xl border border-indigo-500/30 bg-slate-900/55 p-3">
            <div className="text-xs text-slate-400 inline-flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5" /> Temps total</div>
            <div className="text-sm font-bold text-white mt-1">{formatMinutes(globalStats.totalStudyTime)}</div>
          </div>
          <div className="rounded-xl border border-pink-500/30 bg-slate-900/55 p-3">
            <div className="text-xs text-slate-400 inline-flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Streak / Trophées</div>
            <div className="text-sm font-bold text-white mt-1">{globalStats.streak} jours • {globalStats.unlockedTrophies}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-emerald-100">Timer rapide (Dashboard)</div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300">Matière</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="h-8 px-2 rounded-md bg-slate-900/70 border border-slate-600 text-xs text-slate-100"
                disabled={timer.isRunning}
              >
                {(subjects || []).map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-4">
            <div className="text-center space-y-1">
              <div className="text-xs text-slate-400">{timer.currentSubject?.name || selectedSubject?.name || 'Aucune matière'}</div>
              <div className="text-4xl font-black" style={{ color: timerColor }}>{formatTimer(timer.remainingTime)}</div>
              <div className="text-xs text-slate-300">{timer.isRunning ? (timer.isPaused ? 'En pause' : 'En session') : 'Prêt à démarrer'}</div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, timer.progress))}%`, backgroundColor: timerColor }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {!timer.isRunning ? (
                <button type="button" onClick={startLearningTimer} disabled={!selectedSubject} className="h-8 px-3 rounded-lg border border-emerald-400/45 bg-emerald-500/20 text-emerald-100 text-xs font-medium hover:bg-emerald-500/30 inline-flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Démarrer
                </button>
              ) : (
                <>
                  <button type="button" onClick={togglePause} className="h-8 px-3 rounded-lg border border-amber-400/45 bg-amber-500/20 text-amber-100 text-xs font-medium hover:bg-amber-500/30 inline-flex items-center gap-1.5">
                    <Pause className="w-3.5 h-3.5" /> {timer.isPaused ? 'Reprendre' : 'Pause'}
                  </button>
                  <button type="button" onClick={addTenMinutes} className="h-8 px-3 rounded-lg border border-cyan-400/45 bg-cyan-500/20 text-cyan-100 text-xs font-medium hover:bg-cyan-500/30">
                    +10 min
                  </button>
                  <button type="button" onClick={stopTimer} className="h-8 px-3 rounded-lg border border-rose-400/45 bg-rose-500/20 text-rose-100 text-xs font-medium hover:bg-rose-500/30 inline-flex items-center gap-1.5">
                    <Square className="w-3.5 h-3.5" /> Stop
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setTimer((prev) => ({ ...prev, silentMode: !prev.silentMode }))}
                className="h-8 px-3 rounded-lg border border-slate-500/45 bg-slate-700/30 text-slate-200 text-xs font-medium hover:bg-slate-700/45"
              >
                {timer.silentMode ? '🔇 Muet' : '🔊 Son'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-xl border border-slate-700/70 bg-slate-900/45 p-3">
            <div className="text-sm font-semibold text-slate-100 mb-2">Top matières (XP)</div>
            {isLoading ? (
              <div className="text-sm text-slate-300">Chargement des données d&apos;apprentissage...</div>
            ) : globalStats.topSubjects.length === 0 ? (
              <div className="text-sm text-slate-400">Aucune matière enregistrée pour le moment.</div>
            ) : (
              <div className="space-y-2">
                {globalStats.topSubjects.map((subject) => (
                  <div key={subject.name} className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-100 truncate">{subject.name}</span>
                      <span className="text-xs text-fuchsia-200 shrink-0">Niv. {subject.level}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300">{subject.xp} XP • {subject.sessions} sessions</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-violet-400/25 bg-violet-500/5 p-3 space-y-2">
            <div className="text-sm font-semibold text-violet-100">Progression globale</div>
            <div className="rounded-lg border border-violet-400/25 bg-slate-950/50 p-2.5">
              <div className="text-xs text-slate-400">Niveau actuel</div>
              <div className="text-lg font-semibold text-white">Niveau {globalStats.globalLevel}</div>
            </div>
            <div className="rounded-lg border border-violet-400/25 bg-slate-950/50 p-2.5">
              <div className="text-xs text-slate-400">XP cumulé</div>
              <div className="text-lg font-semibold text-white">{globalStats.globalXP}</div>
            </div>
            <button
              type="button"
              onClick={() => navigateToLearning('sessions')}
              className="w-full h-8 px-3 rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-100 text-xs font-medium hover:bg-fuchsia-500/30"
            >
              Lancer une session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLearningModule;
