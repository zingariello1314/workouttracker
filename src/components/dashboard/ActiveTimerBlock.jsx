/**
 * ActiveTimerBlock - Bloc Timer Actif (PRIORITY-HIGH)
 * Timer Pomodoro configurable avec pause et extension
 */

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Settings } from 'lucide-react';
import CircularGauge from './CircularGauge';

const ActiveTimerBlock = ({ onComplete }) => {
  const [config, setConfig] = useState({
    sessions: 4,
    focusDuration: 25, // minutes
    breakDuration: 5 // minutes
  });
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.focusDuration * 60); // seconds
  const [showConfig, setShowConfig] = useState(false);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const handleSessionComplete = () => {
    // Play notification sound
    playNotification();
    
    if (isBreak) {
      // Break finished, start next focus session
      if (currentSession < config.sessions) {
        setCurrentSession(prev => prev + 1);
        setIsBreak(false);
        setTimeLeft(config.focusDuration * 60);
      } else {
        // All sessions completed
        setIsActive(false);
        setCurrentSession(1);
        setIsBreak(false);
        setTimeLeft(config.focusDuration * 60);
        if (onComplete) onComplete();
      }
    } else {
      // Focus session finished, start break
      setIsBreak(true);
      setTimeLeft(config.breakDuration * 60);
    }
  };

  const playNotification = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentSession(1);
    setIsBreak(false);
    setTimeLeft(config.focusDuration * 60);
  };

  const handleExtend = () => {
    setTimeLeft(prev => prev + 300); // Add 5 minutes
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = isBreak ? config.breakDuration * 60 : config.focusDuration * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="active-timer-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <span className="text-2xl">⏱️</span>
          </div>
          Timer Actif
        </h3>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-300"
        >
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Config Panel */}
      {showConfig && !isActive && (
        <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Nombre de sessions</label>
            <input
              type="number"
              value={config.sessions}
              onChange={(e) => setConfig(prev => ({ ...prev, sessions: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
              min="1"
              max="10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Focus (min)</label>
              <input
                type="number"
                value={config.focusDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setConfig(prev => ({ ...prev, focusDuration: val }));
                  setTimeLeft(val * 60);
                }}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Pause (min)</label>
              <input
                type="number"
                value={config.breakDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
                min="1"
                max="30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <CircularGauge
            value={progress}
            max={100}
            size={200}
            strokeWidth={12}
            color={isBreak ? '#10b981' : '#8b5cf6'}
            showPercentage={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-mono font-bold text-white mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className={`text-sm font-semibold ${isBreak ? 'text-green-400' : 'text-purple-400'}`}>
              {isBreak ? '☕ Pause' : '🎯 Focus'}
            </div>
            {isPaused && (
              <div className="text-xs text-yellow-400 mt-1">En pause</div>
            )}
          </div>
        </div>
      </div>

      {/* Session Counter */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Session</div>
          <div className="text-2xl font-bold text-white">
            {currentSession} / {config.sessions}
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {Array.from({ length: config.sessions }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < currentSession - 1 ? 'bg-green-500' :
                  i === currentSession - 1 && isActive ? 'bg-purple-500 animate-pulse' :
                  'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Démarrer
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform flex items-center justify-center gap-2"
            >
              <Pause className="w-5 h-5" />
              {isPaused ? 'Reprendre' : 'Pause'}
            </button>
            <button
              onClick={handleExtend}
              className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-300 hover:scale-105 transform"
              title="Ajouter 5 minutes"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-300 hover:scale-105 transform"
              title="Réinitialiser"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Completion Message */}
      {!isActive && currentSession === 1 && timeLeft === config.focusDuration * 60 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl text-center">
          <div className="text-sm text-slate-300">
            ✨ Configurez votre timer et commencez une session de travail focalisé
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveTimerBlock;
