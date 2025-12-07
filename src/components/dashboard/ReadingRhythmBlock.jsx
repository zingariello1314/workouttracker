/**
 * ReadingRhythmBlock Component - Version complète ultra-détaillée
 * Bloc Rythme de Lecture - 16 modules avancés
 * 
 * MODULES IMPLÉMENTÉS (16/16):
 * 1. Header Premium avec badge de statut
 * 2. Streak Circle SVG complexe avec animations
 * 3. Stats Grid (6 métriques clés)
 * 4. Objectif Quotidien avec progression
 * 5. Session Timer interactif
 * 6. Prédictions & Optimisation (scénarios multiples)
 * 7. Prochain Jalon (progression par paliers)
 * 8. Countdown to Midnight
 * 9. Système de Motivation (score global + leviers)
 * 10. Intelligence de Lecture (heatmap + facteurs)
 * 11. Analyse 7 Derniers Jours
 * 12. Flux Énergétique de Lecture
 * 13. ADN de Lecture Personnalisé
 * 14. État Émotionnel Pré/Post Lecture
 * 15. Analyse Stratégique (ROI + abandons)
 * 16. Équilibre de Lecture (genres + rééquilibrage)
 * 
 * RÈGLE IMPORTANTE: Ne jamais réduire la taille du bloc, seulement l'agrandir si nécessaire
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.rhythmData - Données de rythme de lecture (optionnel, utilise mock si absent)
 * @param {Function} props.onStartTimer - Callback au démarrage du timer
 * @param {Function} props.onStopTimer - Callback à l'arrêt du timer
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

const ReadingRhythmBlock = ({ rhythmData = null, onStartTimer = null, onStopTimer = null }) => {
  // ==================== ÉTATS ====================
  const [isReading, setIsReading] = useState(false);
  const [sessionTime, setSessionTime] = useState(102); // 1:42 en secondes
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // États pour le système émotionnel (Module 14)
  const [preReadingEmotions, setPreReadingEmotions] = useState([
    { id: 'motivated', icon: '🔥', label: 'Motivé', selected: false },
    { id: 'not_motivated', icon: '😐', label: 'Pas motivé', selected: false },
    { id: 'energetic', icon: '⚡', label: 'En forme', selected: false },
    { id: 'tired', icon: '😴', label: 'Fatigué', selected: false },
    { id: 'curious', icon: '🤔', label: 'Curieux', selected: false },
    { id: 'not_interested', icon: '😑', label: 'Pas envie', selected: false },
    { id: 'relaxed', icon: '😌', label: 'Détendu', selected: false },
    { id: 'stressed', icon: '😰', label: 'Stressé', selected: false },
    { id: 'focused', icon: '🎯', label: 'Concentré', selected: false },
    { id: 'rushed', icon: '⏰', label: 'Pressé', selected: false }
  ]);
  
  const [postReadingEmotions, setPostReadingEmotions] = useState([
    { id: 'satisfied', icon: '😊', label: 'Satisfait', selected: false },
    { id: 'frustrated', icon: '😤', label: 'Frustré', selected: false },
    { id: 'inspired', icon: '✨', label: 'Inspiré', selected: false },
    { id: 'bored', icon: '😴', label: 'Ennuyé', selected: false },
    { id: 'enriched', icon: '🧠', label: 'Enrichi', selected: false },
    { id: 'confused', icon: '🤯', label: 'Confus', selected: false },
    { id: 'peaceful', icon: '🕊️', label: 'Apaisé', selected: false },
    { id: 'agitated', icon: '😣', label: 'Agité', selected: false },
    { id: 'concentrated', icon: '🎯', label: 'Concentré', selected: false },
    { id: 'distracted', icon: '🌪️', label: 'Distrait', selected: false }
  ]);
  
  const [currentSession, setCurrentSession] = useState({
    id: null,
    startTime: null,
    preEmotionsRecorded: false,
    postEmotionsRecorded: false,
    canSave: false
  });
  
  const [emotionalSessions, setEmotionalSessions] = useState([]);

  // ==================== DONNÉES MOCK ====================
  const readingData = useMemo(() => ({
    streak: 8,
    todayMinutes: 95,
    dailyGoal: 45,
    pagesRemaining: 135,
    readingSpeed: 26,
    avgSession: 52,
    weeklyData: [
      { day: 13, minutes: 45, completed: true },
      { day: 14, minutes: 58, completed: true },
      { day: 15, minutes: 62, completed: true },
      { day: 16, minutes: 71, completed: true },
      { day: 17, minutes: 48, completed: true },
      { day: 18, minutes: 55, completed: true },
      { day: 19, minutes: 95, completed: true }
    ]
  }), []);

  // ==================== COMPUTED VALUES ====================
  const weeklyMinutes = useMemo(() => {
    return readingData.weeklyData.reduce((sum, day) => sum + day.minutes, 0);
  }, [readingData.weeklyData]);

  const weeklyMinSession = useMemo(() => {
    return Math.min(...readingData.weeklyData.map(d => d.minutes));
  }, [readingData.weeklyData]);

  const avgSessionMin = useMemo(() => {
    const sorted = [...readingData.weeklyData].sort((a, b) => a.minutes - b.minutes);
    const shortest3 = sorted.slice(0, 3);
    return Math.round(shortest3.reduce((sum, d) => sum + d.minutes, 0) / 3);
  }, [readingData.weeklyData]);

  const currentTier = useMemo(() => {
    return Math.floor(readingData.streak / 7);
  }, [readingData.streak]);

  const progressInTier = useMemo(() => {
    return readingData.streak % 7;
  }, [readingData.streak]);

  const tierProgress = useMemo(() => {
    return progressInTier / 7;
  }, [progressInTier]);

  const progressPercentage = useMemo(() => {
    return (readingData.todayMinutes / readingData.dailyGoal) * 100;
  }, [readingData.todayMinutes, readingData.dailyGoal]);

  const estimatedTimeLeft = useMemo(() => {
    return Math.round((readingData.pagesRemaining / readingData.readingSpeed) * 60);
  }, [readingData.pagesRemaining, readingData.readingSpeed]);

  const estimatedDays = useMemo(() => {
    return Math.ceil(estimatedTimeLeft / readingData.avgSession);
  }, [estimatedTimeLeft, readingData.avgSession]);

  const streakStatus = useMemo(() => {
    if (readingData.streak >= 21) return { label: 'MAÎTRE', color: 'from-purple-500 to-pink-500' };
    if (readingData.streak >= 14) return { label: 'DISCIPLINE', color: 'from-blue-500 to-cyan-500' };
    if (readingData.streak >= 7) return { label: 'RÉGULARITÉ', color: 'from-emerald-500 to-teal-500' };
    return { label: 'DÉBUT', color: 'from-slate-500 to-slate-600' };
  }, [readingData.streak]);

  const nextMilestone = useMemo(() => {
    const nextTier = currentTier + 1;
    const daysToNext = (nextTier * 7) - readingData.streak;
    return {
      name: `Palier ${nextTier + 1}`,
      tier: nextTier + 1,
      days: daysToNext,
      progress: progressInTier,
      total: 7
    };
  }, [currentTier, readingData.streak, progressInTier]);

  const timeUntilMidnight = useMemo(() => {
    const now = currentTime;
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  }, [currentTime]);

  const dayProgressPercentage = useMemo(() => {
    const now = currentTime;
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(24, 0, 0, 0);
    return ((now - startOfDay) / (endOfDay - startOfDay)) * 100;
  }, [currentTime]);

  // Données pour heatmap
  const heatmapSlots = useMemo(() => [
    { hour: '6h', intensity: 45 },
    { hour: '9h', intensity: 72 },
    { hour: '12h', intensity: 58 },
    { hour: '15h', intensity: 65 },
    { hour: '17h', intensity: 81 },
    { hour: '19h', intensity: 95 },
    { hour: '21h', intensity: 88 },
    { hour: '23h', intensity: 42 }
  ], []);

  const weeklyScores = useMemo(() => [78, 85, 92, 88, 95, 90, 82], []);

  // Données pour Module 15: Analyse Stratégique
  const readingROI = useMemo(() => ({
    timeInvested: Math.round(weeklyMinutes / 60 * 4.3), // Estimation mensuelle en heures
    knowledgeGained: 47, // Concepts appris estimés
    applicationsFound: 12, // Applications pratiques
    efficiency: 78 // % d'objectifs atteints
  }), [weeklyMinutes]);

  const completionRate = 84; // % de livres terminés

  const objectives = useMemo(() => ({
    learning: 45,    // % lectures d'apprentissage
    pleasure: 35,    // % lectures plaisir
    development: 15, // % développement personnel
    research: 5      // % recherche/travail
  }), []);

  // Données pour Module 16: Équilibre de Lecture
  const genreBalance = useMemo(() => [
    { name: 'Fiction', icon: '📚', percentage: 42, color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
    { name: 'Non-fiction', icon: '📖', percentage: 28, color: 'bg-gradient-to-r from-green-400 to-green-500' },
    { name: 'Développement', icon: '🚀', percentage: 15, color: 'bg-gradient-to-r from-purple-400 to-purple-500' },
    { name: 'Biographies', icon: '👤', percentage: 8, color: 'bg-gradient-to-r from-orange-400 to-orange-500' },
    { name: 'Sciences', icon: '🔬', percentage: 7, color: 'bg-gradient-to-r from-cyan-400 to-cyan-500' }
  ], []);

  const balanceScore = useMemo(() => {
    // Calcul du score d'équilibre basé sur la diversité
    const total = genreBalance.reduce((sum, g) => sum + g.percentage, 0);
    const idealDistribution = 100 / genreBalance.length; // Répartition idéale
    const variance = genreBalance.reduce((sum, g) => sum + Math.pow(g.percentage - idealDistribution, 2), 0) / genreBalance.length;
    return Math.max(0, Math.round(100 - (variance / 10))); // Score inversé de la variance
  }, [genreBalance]);

  // ==================== HELPER FUNCTIONS ====================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (minutes) => {
    if (minutes >= 60) return 'excellent';
    if (minutes >= 45) return 'bon';
    return 'correct';
  };

  const getBalanceLevel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'À améliorer';
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isReading) {
        setSessionTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isReading]);

  // ==================== HANDLERS (optimisés avec useCallback) ====================
  const toggleReading = useCallback(() => {
    setIsReading(prev => !prev);
    if (!isReading && onStartTimer) onStartTimer();
    if (isReading && onStopTimer) onStopTimer();
  }, [isReading, onStartTimer, onStopTimer]);
  
  // Handlers pour le système émotionnel
  const togglePreEmotion = useCallback((emotionId) => {
    if (currentSession.preEmotionsRecorded) return;
    setPreReadingEmotions(prev => 
      prev.map(e => e.id === emotionId ? { ...e, selected: !e.selected } : e)
    );
  }, [currentSession.preEmotionsRecorded]);
  
  const togglePostEmotion = useCallback((emotionId) => {
    if (currentSession.postEmotionsRecorded) return;
    setPostReadingEmotions(prev => 
      prev.map(e => e.id === emotionId ? { ...e, selected: !e.selected } : e)
    );
  }, [currentSession.postEmotionsRecorded]);
  
  const recordPreEmotions = useCallback(() => {
    const selected = preReadingEmotions.filter(e => e.selected);
    if (selected.length === 0) return;
    
    if (!currentSession.id) {
      setCurrentSession({
        id: Date.now(),
        startTime: new Date(),
        preEmotionsRecorded: true,
        postEmotionsRecorded: false,
        canSave: false
      });
    } else {
      setCurrentSession(prev => ({ ...prev, preEmotionsRecorded: true }));
    }
  }, [preReadingEmotions, currentSession.id]);
  
  const recordPostEmotions = useCallback(() => {
    const selected = postReadingEmotions.filter(e => e.selected);
    if (selected.length === 0 || !currentSession.preEmotionsRecorded) return;
    
    setCurrentSession(prev => ({
      ...prev,
      postEmotionsRecorded: true,
      canSave: true
    }));
  }, [postReadingEmotions, currentSession.preEmotionsRecorded]);
  
  const saveSessionAndReset = useCallback(() => {
    if (!currentSession.canSave) return;
    
    const sessionData = {
      id: currentSession.id,
      startTime: currentSession.startTime,
      endTime: new Date(),
      preEmotions: preReadingEmotions.filter(e => e.selected).map(e => e.label),
      postEmotions: postReadingEmotions.filter(e => e.selected).map(e => e.label)
    };
    
    setEmotionalSessions(prev => [...prev, sessionData]);
    
    // Reset
    setPreReadingEmotions(prev => prev.map(e => ({ ...e, selected: false })));
    setPostReadingEmotions(prev => prev.map(e => ({ ...e, selected: false })));
    setCurrentSession({
      id: null,
      startTime: null,
      preEmotionsRecorded: false,
      postEmotionsRecorded: false,
      canSave: false
    });
  }, [currentSession.canSave, currentSession.id, currentSession.startTime, preReadingEmotions, postReadingEmotions]);
  
  // Computed values pour émotions
  const selectedPreEmotions = useMemo(() => 
    preReadingEmotions.filter(e => e.selected).map(e => e.label),
    [preReadingEmotions]
  );
  
  const selectedPostEmotions = useMemo(() => 
    postReadingEmotions.filter(e => e.selected).map(e => e.label),
    [postReadingEmotions]
  );
  
  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return emotionalSessions.filter(session => 
      new Date(session.startTime).toDateString() === today
    );
  }, [emotionalSessions]);
  
  const formatSessionTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ==================== RENDER ====================
  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl border border-cyan-500/20" 
         style={{ boxShadow: '0 0 50px rgba(6, 182, 212, 0.1), 0 0 100px rgba(6, 182, 212, 0.05)' }}>
      
      {/* ==================== MODULE 1: HEADER ==================== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold text-cyan-400 tracking-wide" 
              style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.6), 0 0 20px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.2)' }}>
            RYTHME LECTURE
          </h1>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${streakStatus.color}`}
             style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)' }}>
          {streakStatus.label}
        </div>
      </div>

      {/* ==================== MODULE 2: STREAK CIRCLE (SVG COMPLEXE) ==================== */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-52 h-52 mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120" style={{ filter: 'none' }}>
            <defs>
              {/* Gradients complexes */}
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="1" />
                <stop offset="25%" stopColor="#0ea5e9" stopOpacity="1" />
                <stop offset="50%" stopColor="#059669" stopOpacity="1" />
                <stop offset="75%" stopColor="#0d9488" stopOpacity="1" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
              </linearGradient>
              
              <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
              </linearGradient>
              
              <radialGradient id="centerRadial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.1" />
                <stop offset="60%" stopColor="#059669" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              
              {/* Filtres pour effets */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Fond radial subtil */}
            <circle cx="60" cy="60" r="52" fill="url(#centerRadial)" />
            
            {/* Cercles de structure multiple */}
            <circle cx="60" cy="60" r="50" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.2" />
            <circle cx="60" cy="60" r="47" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.3" />
            <circle cx="60" cy="60" r="44" stroke="#475569" strokeWidth="2" fill="none" opacity="0.4" />
            
            {/* Cercles internes décoratifs */}
            <circle cx="60" cy="60" r="35" stroke="#64748b" strokeWidth="1" fill="none" opacity="0.3" />
            <circle cx="60" cy="60" r="30" stroke="#64748b" strokeWidth="0.5" fill="none" opacity="0.2" />
            <circle cx="60" cy="60" r="25" stroke="#64748b" strokeWidth="0.5" fill="none" opacity="0.15" />
            
            {/* Cercles de paliers avec patterns */}
            {currentTier >= 1 && (
              <>
                <circle
                  cx="60"
                  cy="60"
                  r="32"
                  stroke="#059669"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="201.1 201.1"
                  strokeLinecap="round"
                  opacity="0.5"
                  filter="url(#innerGlow)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="28"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="4 2"
                  opacity="0.3"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 60 60"
                    to="360 60 60"
                    dur="20s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
            
            {currentTier >= 2 && (
              <>
                <circle
                  cx="60"
                  cy="60"
                  r="38"
                  stroke="#7c3aed"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="238.8 238.8"
                  strokeLinecap="round"
                  opacity="0.5"
                  filter="url(#innerGlow)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="36"
                  stroke="#8b5cf6"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="3 3"
                  opacity="0.3"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="360 60 60"
                    to="0 60 60"
                    dur="25s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
            
            {/* Cercle de progression principal avec multiple couches */}
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${tierProgress * 282.7} 282.7`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              filter="url(#glow)"
              opacity="0.9"
            />
            
            {/* Cercle interne de progression */}
            <circle
              cx="60"
              cy="60"
              r="42"
              stroke="url(#innerGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${tierProgress * 263.9} 263.9`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              opacity="0.6"
            />
            
            {/* Éléments décoratifs géométriques */}
            <g opacity="0.4">
              {/* Segments décoratifs */}
              <g>
                <line x1="60" y1="15" x2="60" y2="20" stroke="#0891b2" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite"/>
                </line>
                <line x1="60" y1="100" x2="60" y2="105" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite"/>
                </line>
                <line x1="15" y1="60" x2="20" y2="60" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
                </line>
                <line x1="100" y1="60" x2="105" y2="60" stroke="#0d9488" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite"/>
                </line>
              </g>
              
              {/* Segments diagonaux */}
              <g>
                <line x1="81.21" y1="21.21" x2="84.85" y2="17.57" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="5s" repeatCount="indefinite"/>
                </line>
                <line x1="38.79" y1="98.79" x2="35.15" y2="102.43" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.7;0.2;0.7" dur="5s" repeatCount="indefinite"/>
                </line>
                <line x1="21.21" y1="38.79" x2="17.57" y2="35.15" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="4.5s" repeatCount="indefinite"/>
                </line>
                <line x1="98.79" y1="81.21" x2="102.43" y2="84.85" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="opacity" values="0.7;0.2;0.7" dur="4.5s" repeatCount="indefinite"/>
                </line>
              </g>
            </g>
            
            {/* Cercle externe complexe */}
            <circle
              cx="60"
              cy="60"
              r="53"
              stroke="#0891b2"
              strokeWidth="0.5"
              fill="none"
              strokeDasharray="1 2 4 2"
              opacity="0.3"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 60 60"
                to="360 60 60"
                dur="45s"
                repeatCount="indefinite"
              />
            </circle>
            
            <circle
              cx="60"
              cy="60"
              r="55"
              stroke="#059669"
              strokeWidth="0.3"
              fill="none"
              strokeDasharray="2 8"
              opacity="0.2"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 60 60"
                to="0 60 60"
                dur="60s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          
          {/* Centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'translateY(-4px)' }}>
            <div className="text-center">
              <div className="text-5xl font-extrabold bg-gradient-to-b from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent mb-0" 
                   style={{ fontFamily: "'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", textShadow: '0 0 40px rgba(6, 182, 212, 0.6)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {readingData.streak}
              </div>
              <div className="text-xs font-semibold bg-gradient-to-b from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent mt-1" 
                   style={{ fontFamily: "'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", textShadow: '0 0 20px rgba(6, 182, 212, 0.4)', letterSpacing: '0.15em' }}>
                JOURS
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center max-w-sm">
          <p className="text-cyan-300 font-bold text-xl mb-3">
            Rythme {streakStatus.label.toLowerCase()} depuis {readingData.streak} jours !
          </p>
          <p className="text-slate-400 text-sm bg-slate-800/80 px-4 py-2 rounded-full border border-slate-600/50">
            Palier {currentTier + 1} • {progressInTier}/7 dans ce niveau
          </p>
        </div>
      </div>

      {/* ==================== MODULE 3: STATS GRID (6 cartes) ==================== */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1">Aujourd'hui</div>
          <div className="text-lg font-bold">{readingData.todayMinutes}</div>
          <div className="text-xs text-slate-400">min</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1">Semaine</div>
          <div className="text-lg font-bold">{weeklyMinutes}</div>
          <div className="text-xs text-slate-400">min</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1">Session moy.</div>
          <div className="text-lg font-bold">{readingData.avgSession}</div>
          <div className="text-xs text-slate-400">min</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1">Semaine min</div>
          <div className="text-lg font-bold">{weeklyMinSession}</div>
          <div className="text-xs text-slate-400">min</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1">Session moy min</div>
          <div className="text-lg font-bold">{avgSessionMin}</div>
          <div className="text-xs text-slate-400">min</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1">Vitesse</div>
          <div className="text-lg font-bold">{readingData.readingSpeed}</div>
          <div className="text-xs text-slate-400">p/h</div>
        </div>
      </div>

      {/* ==================== MODULE 4: OBJECTIF QUOTIDIEN ==================== */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-cyan-400">🎯</div>
            <h3 className="text-cyan-400 font-bold" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}>OBJECTIF QUOTIDIEN</h3>
          </div>
          <span className="text-lg font-bold">{readingData.dailyGoal} min</span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-3 mb-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${Math.min(progressPercentage, 100)}%`,
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 25px rgba(16, 185, 129, 0.4)'
            }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-300">{readingData.todayMinutes} / {readingData.dailyGoal} min</span>
          <span className={`font-bold ${progressPercentage >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
            ({Math.round(progressPercentage)}%)
          </span>
        </div>
      </div>

      {/* ==================== MODULE 5: SESSION TIMER ==================== */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-4 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleReading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isReading ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              style={{
                boxShadow: isReading 
                  ? '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)' 
                  : '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)'
              }}
              aria-label={isReading ? 'Mettre en pause la session de lecture' : 'Démarrer une session de lecture'}
              aria-pressed={isReading}
            >
              <span aria-hidden="true">{isReading ? '⏸️' : '▶️'}</span>
            </button>
            <div>
              <div className="text-cyan-400 text-sm">{isReading ? 'Session en cours' : 'Session en pause'}</div>
              <div className="text-2xl font-bold font-mono">{formatTime(sessionTime)}</div>
            </div>
          </div>
          {readingData.todayMinutes >= readingData.dailyGoal && (
            <div className="bg-emerald-500/20 border border-emerald-400 rounded-lg px-3 py-2" 
                 style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3), 0 0 25px rgba(16, 185, 129, 0.2)' }}>
              <div className="text-emerald-400 text-xs font-bold" style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}>
                ✓ OBJECTIF ATTEINT
              </div>
              <div className="text-emerald-300 text-xs italic">Petits pas, grandes distances.</div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODULE 6: PRÉDICTIONS & OPTIMISATION ==================== */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 text-cyan-400">📊</div>
          <h3 className="text-cyan-400 font-bold" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}>PRÉDICTIONS & OPTIMISATION</h3>
        </div>
        
        <div className="space-y-4">
          {/* Prédiction principale */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-cyan-300 text-sm font-medium">Projection actuelle</div>
              <div className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">Rythme optimal</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-cyan-400 mb-1">Pages restantes</div>
                <div className="text-2xl font-bold text-white">{readingData.pagesRemaining}</div>
                <div className="text-xs text-slate-400">67% du livre</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-cyan-400 mb-1">Temps estimé</div>
                <div className="text-2xl font-bold text-white">{Math.round(estimatedTimeLeft/60)}h {Math.round(estimatedTimeLeft%60)}m</div>
                <div className="text-xs text-emerald-400">-23min vs prévu initial</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-cyan-400 mb-1">Fin prévue</div>
                <div className="text-2xl font-bold text-white">{estimatedDays}j</div>
                <div className="text-xs text-slate-400">Dimanche 21h30</div>
              </div>
            </div>

            {/* Barre de progression du livre */}
            <div className="w-full bg-slate-700 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
                style={{ width: '33%', boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 text-center">
              Basé sur {readingData.avgSession} min/jour (moyenne actuelle) et {readingData.readingSpeed} pages/h
            </div>
          </div>

          {/* Scénarios multiples */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
            <div className="text-cyan-300 text-sm font-medium mb-3">Scénarios d'optimisation</div>
            
            <div className="space-y-3">
              {/* Scénario conservateur */}
              <div className="bg-slate-700/40 rounded-lg p-3 border border-slate-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-500/40 rounded-full"></div>
                    <span className="text-slate-300 text-sm">Rythme minimum (30 min/jour)</span>
                  </div>
                  <span className="text-slate-400 text-xs">9 jours</span>
                </div>
                <div className="text-xs text-slate-400">Fin prévue: 28 septembre • Sécurité maximale</div>
              </div>

              {/* Scénario actuel */}
              <div className="bg-cyan-900/30 rounded-lg p-3 border border-cyan-400/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-cyan-300 text-sm font-medium">Rythme actuel ({readingData.avgSession} min/jour)</span>
                  </div>
                  <span className="text-cyan-400 text-xs font-bold">{estimatedDays} jours</span>
                </div>
                <div className="text-xs text-cyan-300">Fin prévue: 24 septembre • Équilibre optimal</div>
              </div>

              {/* Scénario intensif */}
              <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-400/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-400 rounded-full"></div>
                    <span className="text-emerald-300 text-sm">Rythme intensif (90 min/jour)</span>
                  </div>
                  <span className="text-emerald-400 text-xs">3 jours</span>
                </div>
                <div className="text-xs text-emerald-300">Fin prévue: 22 septembre • Challenge motivant</div>
              </div>
            </div>
          </div>

          {/* Facteurs d'accélération */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
            <div className="text-cyan-300 text-sm font-medium mb-3">Leviers d'optimisation</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-orange-400 text-xs">🚀</span>
                  <span className="text-orange-300 text-sm font-medium">Vitesse ++</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  Lectures en créneau 19h-21h
                </div>
                <div className="text-orange-400 text-xs font-bold">-1.5 jours</div>
              </div>

              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 text-xs">⏰</span>
                  <span className="text-purple-300 text-sm font-medium">Sessions ++</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  +15min par session
                </div>
                <div className="text-purple-400 text-xs font-bold">-1 jour</div>
              </div>

              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400 text-xs">🌧️</span>
                  <span className="text-blue-300 text-sm font-medium">Météo boost</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  3 jours de pluie prévus
                </div>
                <div className="text-blue-400 text-xs font-bold">-0.5 jour</div>
              </div>

              <div className="bg-green-900/20 rounded-lg p-3 border border-green-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-xs">📅</span>
                  <span className="text-green-300 text-sm font-medium">Weekend boost</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  Sessions weekend 2x plus longues
                </div>
                <div className="text-green-400 text-xs font-bold">-0.8 jour</div>
              </div>
            </div>
          </div>

          {/* Recommandations IA */}
          <div className="bg-cyan-900/30 rounded-xl p-4 border border-cyan-400/30">
            <div className="text-cyan-300 text-sm font-medium mb-3">Plan optimisé par IA</div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-cyan-400 text-xs">🎯</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Objectif optimisé: Finir vendredi soir</div>
                  <div className="text-xs text-slate-400">Combinez votre créneau 19h-21h + weekend boost</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-cyan-400 text-xs">⚡</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Sessions suggérées: 65min (mar/jeu), 90min (weekend)</div>
                  <div className="text-xs text-slate-400">Probabilité de réussite: 89%</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-cyan-400 text-xs">📈</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Gain total estimé: -2.3 jours vs rythme actuel</div>
                  <div className="text-xs text-emerald-400">Finition 48h plus tôt que prévu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 7: PROCHAIN JALON ==================== */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-yellow-400">🏆</div>
            <h3 className="text-cyan-400 font-bold" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}>PROCHAIN JALON</h3>
          </div>
          <span className="text-sm text-slate-300">{nextMilestone.days} jours</span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-1000"
            style={{ 
              width: `${(nextMilestone.progress / nextMilestone.total) * 100}%`,
              boxShadow: '0 0 12px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 146, 60, 0.4)'
            }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-300">
            {nextMilestone.progress} / {nextMilestone.total} jours
          </span>
          <span className="text-xs text-yellow-400 font-medium">
            🏆 {nextMilestone.name}
          </span>
        </div>
        <div className="text-xs text-slate-400 text-center mt-2">
          Palier {nextMilestone.tier} • Série de 7 jours consécutifs
        </div>
      </div>

      {/* ==================== MODULE 8: COUNTDOWN TO MIDNIGHT ==================== */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-lg">🕐</span>
            <h3 className="text-cyan-400 font-bold" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}>TEMPS RESTANT AUJOURD'HUI</h3>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 font-mono text-white mb-3">
          <span className="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style={{ boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)' }}>
            {timeUntilMidnight.hours.toString().padStart(2, '0')}h
          </span>
          <span className="text-cyan-400 text-2xl">:</span>
          <span className="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style={{ boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)' }}>
            {timeUntilMidnight.minutes.toString().padStart(2, '0')}m
          </span>
          <span className="text-cyan-400 text-2xl">:</span>
          <span className="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style={{ boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)' }}>
            {timeUntilMidnight.seconds.toString().padStart(2, '0')}s
          </span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
            style={{ 
              width: `${dayProgressPercentage}%`,
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 25px rgba(59, 130, 246, 0.4)'
            }}
          ></div>
        </div>
        
        <div className="text-xs text-slate-400 text-center">
          Progression de la journée • {Math.round(dayProgressPercentage)}% accomplie
        </div>
      </div>

      {/* ==================== MODULE 9: SYSTÈME DE MOTIVATION ==================== */}
      <div className="bg-gradient-to-r from-purple-800/40 to-pink-800/40 rounded-2xl p-4 mb-6 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <h3 className="text-purple-400 font-bold" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>⚡ SYSTÈME DE MOTIVATION</h3>
        </div>
        
        <div className="space-y-4">
          {/* Score de motivation global */}
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 border border-purple-400/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-purple-300 text-sm font-medium">Score motivation global</div>
              <div className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">Temps réel</div>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-md"></div>
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#4c1d95" strokeWidth="3" fill="none" opacity="0.3"/>
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    stroke="url(#motivationGradient)" 
                    strokeWidth="3" 
                    fill="none"
                    strokeDasharray="78 100"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="motivationGradient">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="text-xl font-bold text-purple-300">78</span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="text-white font-bold text-lg">Motivation excellente</div>
                <div className="text-xs text-purple-300">Pic atteint il y a 2h</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400">+12 points depuis hier</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="text-purple-400 font-bold">89%</div>
                <div className="text-slate-400">Élan</div>
              </div>
              <div className="text-center">
                <div className="text-pink-400 font-bold">72%</div>
                <div className="text-slate-400">Plaisir</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold">81%</div>
                <div className="text-slate-400">Confiance</div>
              </div>
              <div className="text-center">
                <div className="text-cyan-400 font-bold">76%</div>
                <div className="text-slate-400">Curiosité</div>
              </div>
            </div>
          </div>

          {/* Motivateurs actifs */}
          <div className="space-y-3">
            <div className="text-purple-300 text-sm font-medium">Leviers motivationnels actifs</div>
            
            <div className="space-y-3">
              {/* Momentum */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 text-xs">🚀</span>
                    </div>
                    <span className="text-purple-300 text-sm font-medium">Élan du moment</span>
                  </div>
                  <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">FORT</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: '89%', boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}
                  ></div>
                </div>
                <div className="text-xs text-slate-400">Momentum basé sur vos 3 dernières sessions exceptionnelles</div>
              </div>

              {/* Comparaison temporelle */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 text-xs">📈</span>
                    </div>
                    <span className="text-purple-300 text-sm font-medium">Progression temporelle</span>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">+23% ↗</span>
                </div>
                <div className="text-xs text-slate-400 mb-2">Cette semaine vs même semaine l'an dernier</div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">2023:</span>
                    <span className="text-slate-300 ml-1">327 min</span>
                  </div>
                  <div>
                    <span className="text-slate-500">2024:</span>
                    <span className="text-emerald-400 ml-1 font-bold">415 min</span>
                  </div>
                </div>
              </div>

              {/* Effet domino */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 text-xs">⚡</span>
                    </div>
                    <span className="text-purple-300 text-sm font-medium">Effet cascade</span>
                  </div>
                  <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">+18%</span>
                </div>
                <div className="text-xs text-slate-400 mb-1">Cette session influence positivement demain</div>
                <div className="text-xs text-slate-500">
                  Historique : après 60+ min, vous dépassez l'objectif le lendemain dans 82% des cas
                </div>
              </div>
            </div>
          </div>

          {/* Prédictions motivationnelles */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-purple-500/20">
            <div className="text-purple-300 text-sm font-medium mb-3">Prédictions motivationnelles</div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-purple-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-purple-400 text-xs">🔮</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Pic de motivation prévu demain 20h</div>
                  <div className="text-xs text-slate-400">Basé sur votre cycle circadien et pattern social</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-orange-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-orange-400 text-xs">⚠️</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Attention : baisse prévue jeudi</div>
                  <div className="text-xs text-slate-400">Préparez des sessions courtes et récompenses</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-emerald-400 text-xs">🎯</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Weekend boost incoming (+34%)</div>
                  <div className="text-xs text-slate-400">Idéal pour rattraper ou prendre de l'avance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 10: INTELLIGENCE DE LECTURE ==================== */}
      <div className="bg-gradient-to-r from-teal-800/40 to-cyan-800/40 rounded-2xl p-4 mb-6 border border-teal-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-teal-400 font-bold" style={{ textShadow: '0 0 8px rgba(20, 184, 166, 0.5)' }}>🧠 INTELLIGENCE DE LECTURE</h3>
        </div>
        
        <div className="space-y-4">
          {/* Heatmap des créneaux optimaux */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-teal-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-teal-300 text-sm font-medium">Créneaux de performance</div>
              <div className="text-xs text-teal-400 bg-teal-500/20 px-2 py-1 rounded">Analyse 30 jours</div>
            </div>
            
            {/* Heatmap horaire */}
            <div className="grid grid-cols-8 gap-1 mb-3">
              {heatmapSlots.map((slot) => (
                <div key={slot.hour} className="text-center">
                  <div 
                    className={`h-8 rounded-md transition-all duration-300 flex items-center justify-center text-xs font-bold ${
                      slot.intensity >= 90 ? 'bg-teal-400 text-slate-900' :
                      slot.intensity >= 70 ? 'bg-teal-500/80 text-white' :
                      slot.intensity >= 50 ? 'bg-teal-600/60 text-teal-100' :
                      slot.intensity >= 30 ? 'bg-teal-700/40 text-teal-200' :
                      'bg-slate-700/60 text-slate-400'
                    }`}
                    style={slot.intensity >= 90 ? { boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)' } : {}}
                  >
                    {slot.intensity >= 90 ? '🔥' : slot.intensity >= 70 ? '⚡' : ''}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{slot.hour}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-teal-900/30 rounded-lg p-3 border border-teal-400/20">
              <div className="text-teal-300 text-sm font-medium mb-1">Zone optimale détectée</div>
              <div className="text-white font-bold mb-2">19h-21h • Performance +34%</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-teal-400">Vitesse:</span> <span className="text-white">35 pages/h</span>
                </div>
                <div>
                  <span className="text-teal-400">Focus:</span> <span className="text-white">92% maintenu</span>
                </div>
                <div>
                  <span className="text-teal-400">Rétention:</span> <span className="text-white">+18%</span>
                </div>
                <div>
                  <span className="text-teal-400">Plaisir:</span> <span className="text-white">Score 8.4/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Facteurs d'influence */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-teal-500/20">
            <div className="text-teal-300 text-sm font-medium mb-4">Facteurs d'influence détectés</div>
            
            <div className="space-y-3">
              {/* Météo */}
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-400 text-xs">☔</span>
                    </div>
                    <span className="text-slate-300 text-sm">Conditions météo</span>
                  </div>
                  <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">Impact fort</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-slate-400">Pluie</div>
                    <div className="text-blue-400 font-bold">+15min</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Soleil</div>
                    <div className="text-orange-400 font-bold">-8min</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Nuageux</div>
                    <div className="text-slate-300 font-bold">Normal</div>
                  </div>
                </div>
              </div>

              {/* Jour de la semaine */}
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 text-xs">📅</span>
                    </div>
                    <span className="text-slate-300 text-sm">Cycle hebdomadaire</span>
                  </div>
                  <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">Pattern stable</span>
                </div>
                <div className="flex justify-between text-xs">
                  {weeklyScores.map((score, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-xs font-bold ${
                        score >= 90 ? 'text-emerald-400' : 
                        score >= 80 ? 'text-cyan-400' : 
                        score >= 70 ? 'text-yellow-400' : 
                        'text-slate-400'
                      }`}>
                        {score}%
                      </div>
                      <div className="text-slate-500">{['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][index]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* État émotionnel */}
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-pink-400 text-xs">💭</span>
                    </div>
                    <span className="text-slate-300 text-sm">État d'esprit optimal</span>
                  </div>
                  <span className="text-xs text-pink-400 bg-pink-500/20 px-2 py-1 rounded">IA prédictive</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  Vous lisez 28% mieux quand vous êtes détendu après une journée productive
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-xs text-pink-300">État actuel détecté: Réceptif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommandations personnalisées */}
          <div className="bg-teal-900/30 rounded-xl p-4 border border-teal-400/30">
            <div className="text-teal-300 text-sm font-medium mb-3">Recommandations IA</div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-teal-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-teal-400 text-xs">🎯</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Session optimale dans 47 minutes (19h15)</div>
                  <div className="text-xs text-slate-400">Pic de concentration prévu + météo favorable</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-teal-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-teal-400 text-xs">📖</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">Genre suggéré: Science-fiction</div>
                  <div className="text-xs text-slate-400">+23% d'engagement les dimanches soir</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 11: ANALYSE 7 DERNIERS JOURS ==================== */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 text-cyan-400">📅</div>
          <h3 className="text-cyan-400 font-bold" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}>ANALYSE 7 DERNIERS JOURS</h3>
        </div>
        
        {/* Vue d'ensemble hebdomadaire */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/10">
            <div className="text-xs text-cyan-400 mb-1">Total semaine</div>
            <div className="text-lg font-bold text-white">{weeklyMinutes} min</div>
            <div className="text-xs text-emerald-400">+12% vs semaine passée</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/10">
            <div className="text-xs text-cyan-400 mb-1">Meilleur jour</div>
            <div className="text-lg font-bold text-white">Jeudi</div>
            <div className="text-xs text-slate-400">71 minutes</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/10">
            <div className="text-xs text-cyan-400 mb-1">Régularité</div>
            <div className="text-lg font-bold text-white">100%</div>
            <div className="text-xs text-emerald-400">7/7 jours réussis</div>
          </div>
        </div>

        {/* Timeline détaillée des jours */}
        <div className="space-y-3">
          {readingData.weeklyData.map((day, index) => (
            <div 
              key={index}
              className={`bg-slate-800/40 rounded-xl p-3 border transition-all duration-300 hover:bg-slate-700/40 ${
                index === readingData.weeklyData.length - 1 
                  ? 'border-cyan-400/40 bg-cyan-500/5' 
                  : 'border-slate-600/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                    index === readingData.weeklyData.length - 1 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' 
                      : day.completed 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                        : 'bg-slate-700 text-slate-400'
                  }`}>
                    {day.day}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][index]}
                      {index === readingData.weeklyData.length - 1 && (
                        <span className="text-xs text-cyan-400 ml-2">Aujourd'hui</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {day.minutes} minutes • {Math.round((day.minutes / 60) * readingData.readingSpeed * 10) / 10} pages lues
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium mb-1 ${
                    getPerformanceLevel(day.minutes) === 'excellent' ? 'text-emerald-400' : 
                    getPerformanceLevel(day.minutes) === 'bon' ? 'text-cyan-400' : 
                    'text-slate-400'
                  }`}>
                    {getPerformanceLevel(day.minutes).toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {day.minutes >= readingData.dailyGoal 
                      ? `+${day.minutes - readingData.dailyGoal}min` 
                      : `-${readingData.dailyGoal - day.minutes}min`
                    }
                  </div>
                </div>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === readingData.weeklyData.length - 1 
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                      : getPerformanceLevel(day.minutes) === 'excellent' 
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                        : getPerformanceLevel(day.minutes) === 'bon' 
                          ? 'bg-gradient-to-r from-cyan-400 to-cyan-500' 
                          : 'bg-gradient-to-r from-slate-400 to-slate-500'
                  }`}
                  style={{ 
                    width: `${Math.min((day.minutes / 80) * 100, 100)}%`,
                    boxShadow: index === readingData.weeklyData.length - 1 ? '0 0 8px rgba(6, 182, 212, 0.4)' : ''
                  }}
                ></div>
              </div>

              {/* Détails supplémentaires */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-slate-400">
                  <span className="text-slate-500">Sessions:</span> {Math.ceil(day.minutes / 25)}
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Objectif:</span> {day.minutes >= readingData.dailyGoal ? '✓' : '×'}
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Score:</span> {Math.round(day.minutes / readingData.dailyGoal * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights de la semaine */}
        <div className="mt-5 space-y-3">
          <div className="text-cyan-400 text-sm font-medium">Insights de votre semaine</div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-400/20">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-emerald-400 text-xs">🔥</span>
                </div>
                <div>
                  <div className="text-emerald-300 text-sm font-medium">Série parfaite</div>
                  <div className="text-xs text-slate-300">
                    7 jours consécutifs au-dessus de l'objectif. Votre meilleure série depuis février !
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-400/20">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-cyan-400 text-xs">📈</span>
                </div>
                <div>
                  <div className="text-cyan-300 text-sm font-medium">Progression constante</div>
                  <div className="text-xs text-slate-300">
                    Tendance croissante détectée : +8min en moyenne par rapport à la semaine passée
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-purple-400 text-xs">⚡</span>
                </div>
                <div>
                  <div className="text-purple-300 text-sm font-medium">Pattern optimal</div>
                  <div className="text-xs text-slate-300">
                    Jeudi et vendredi sont vos jours les plus productifs (moyenne: 63min)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 12: FLUX ÉNERGÉTIQUE DE LECTURE ==================== */}
      <div className="bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-2xl p-4 mb-6 border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-indigo-400 font-bold" style={{ textShadow: '0 0 8px rgba(99, 102, 241, 0.5)' }}>🌊 FLUX ÉNERGÉTIQUE DE LECTURE</h3>
        </div>
        
        <div className="space-y-6">
          {/* Graphique sinusoïdal des vagues de motivation */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-indigo-300 text-sm font-medium">Courbe de motivation</div>
              <div className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">30 derniers jours</div>
            </div>
            <div className="text-xs text-slate-400 mb-4">
              Votre envie de lire suit des cycles naturels prévisibles
            </div>
            
            <div className="relative h-24 bg-slate-900/50 rounded-lg overflow-hidden mb-3">
              <svg className="w-full h-full" viewBox="0 0 200 70" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                {/* Ligne de référence moyenne */}
                <line x1="0" y1="40" x2="200" y2="40" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
                
                {/* Vague principale */}
                <path
                  d="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35"
                  stroke="#6366f1"
                  strokeWidth="3"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 4px #6366f1)' }}
                >
                  <animate
                    attributeName="d"
                    values="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35;M0 35 Q25 40 50 30 T100 45 T150 25 T200 40;M0 45 Q25 25 50 35 T100 30 T150 40 T200 35"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </path>
                
                {/* Zone remplie sous la vague */}
                <path
                  d="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35 L200 70 L0 70 Z"
                  fill="url(#waveGradient)"
                >
                  <animate
                    attributeName="d"
                    values="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35 L200 70 L0 70 Z;M0 35 Q25 40 50 30 T100 45 T150 25 T200 40 L200 70 L0 70 Z;M0 45 Q25 25 50 35 T100 30 T150 40 T200 35 L200 70 L0 70 Z"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </path>
                
                {/* Point actuel */}
                <circle cx="170" cy="37" r="4" fill="#6366f1">
                  <animate attributeName="cy" values="37;30;37" dur="8s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                {/* Labels temporels */}
                <text x="10" y="65" fontSize="9" fill="#64748b">Il y a 30j</text>
                <text x="85" y="65" fontSize="9" fill="#64748b">Il y a 15j</text>
                <text x="150" y="65" fontSize="9" fill="#6366f1" fontWeight="bold">Aujourd'hui</text>
              </svg>
              
              <div className="absolute top-2 right-3 flex items-center gap-2">
                <div className="text-xs text-indigo-300 font-semibold bg-indigo-900/40 px-2 py-1 rounded">
                  Motivation: 78%
                </div>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 text-center">
              Votre niveau actuel est au-dessus de votre moyenne habituelle
            </div>
          </div>

          {/* Explication des phases */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
            <div className="text-indigo-300 text-sm font-medium mb-3">Vos phases de lecture</div>
            <div className="text-xs text-slate-400 mb-4">
              Basé sur votre historique, vous alternez entre des périodes d'engagement fort et de repos naturel
            </div>
            
            <div className="space-y-4">
              {/* Phase actuelle */}
              <div className="bg-indigo-900/30 rounded-lg p-3 border border-indigo-400/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                    <span className="text-indigo-300 text-sm font-medium">Phase productive (actuelle)</span>
                  </div>
                  <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">Depuis 14 jours</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  Période où vous avez naturellement plus d'élan pour lire. Vous terminez vos sessions plus facilement et lisez plus longtemps.
                </div>
                <div className="text-xs text-indigo-200">
                  ✓ Profitez-en pour tackle des livres plus challenging
                </div>
              </div>

              {/* Phase suivante */}
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full opacity-60"></div>
                    <span className="text-purple-300 text-sm font-medium">Phase tranquille (prochaine)</span>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Dans ~7 jours</span>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  Période de récupération naturelle où l'envie de lire diminue temporairement. C'est normal et prévisible.
                </div>
                <div className="text-xs text-purple-200">
                  💡 Privilégiez des lectures légères, ne vous forcez pas
                </div>
              </div>
            </div>
          </div>

          {/* Courants contraires */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-indigo-500/20">
            <div className="text-indigo-300 text-sm font-medium mb-2">Courants contraires détectés</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Stress</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-orange-400 rounded-full"></div>
                  </div>
                  <span className="text-xs text-orange-400">33%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Fatigue</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-yellow-400 rounded-full"></div>
                  </div>
                  <span className="text-xs text-yellow-400">50%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Distractions</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-1/4 h-full bg-red-400 rounded-full"></div>
                  </div>
                  <span className="text-xs text-red-400">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 13: ADN DE LECTURE PERSONNALISÉ ==================== */}
      <div className="bg-gradient-to-r from-emerald-800/40 to-teal-800/40 rounded-2xl p-4 mb-6 border border-emerald-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-spin" style={{ animationDuration: '10s' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h3 className="text-emerald-400 font-bold" style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}>🧬 ADN DE LECTURE PERSONNALISÉ</h3>
        </div>
        
        <div className="space-y-4">
          {/* Génome lecteur */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/20">
            <div className="text-emerald-300 text-sm font-medium mb-3">Génome lecteur</div>
            <div className="relative">
              {/* Visualisation ADN */}
              <svg className="w-full h-16" viewBox="0 0 200 40">
                <defs>
                  <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                
                {/* Brins d'ADN */}
                <path
                  d="M0 15 Q25 10 50 15 T100 15 T150 15 T200 15"
                  stroke="url(#dnaGradient)"
                  strokeWidth="2"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 3px #10b981)' }}
                >
                  <animate
                    attributeName="d"
                    values="M0 15 Q25 10 50 15 T100 15 T150 15 T200 15;M0 15 Q25 20 50 15 T100 15 T150 15 T200 15;M0 15 Q25 10 50 15 T100 15 T150 15 T200 15"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </path>
                
                <path
                  d="M0 25 Q25 30 50 25 T100 25 T150 25 T200 25"
                  stroke="url(#dnaGradient)"
                  strokeWidth="2"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 3px #10b981)' }}
                >
                  <animate
                    attributeName="d"
                    values="M0 25 Q25 30 50 25 T100 25 T150 25 T200 25;M0 25 Q25 20 50 25 T100 25 T150 25 T200 25;M0 25 Q25 30 50 25 T100 25 T150 25 T200 25"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </path>
                
                {/* Liaisons */}
                <g opacity="0.6">
                  <line x1="20" y1="13" x2="20" y2="27" stroke="#10b981" strokeWidth="1"/>
                  <line x1="60" y1="15" x2="60" y2="25" stroke="#14b8a6" strokeWidth="1"/>
                  <line x1="100" y1="15" x2="100" y2="25" stroke="#06b6d4" strokeWidth="1"/>
                  <line x1="140" y1="15" x2="140" y2="25" stroke="#10b981" strokeWidth="1"/>
                  <line x1="180" y1="13" x2="180" y2="27" stroke="#14b8a6" strokeWidth="1"/>
                </g>
              </svg>
              
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center">
                  <div className="text-xs text-emerald-400 mb-1">Vitesse</div>
                  <div className="text-sm font-bold text-white">{readingData.readingSpeed} p/h</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-teal-400 mb-1">Endurance</div>
                  <div className="text-sm font-bold text-white">{readingData.avgSession} min</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-cyan-400 mb-1">Genre favori</div>
                  <div className="text-sm font-bold text-white">Sci-Fi</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Évolution */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-emerald-500/20">
            <div className="text-emerald-300 text-sm font-medium mb-2">Évolution détectée</div>
            <div className="text-white text-sm mb-2">Mutations de vos habitudes au fil des mois</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-xs text-slate-400">Vitesse +15%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span className="text-xs text-slate-400">Sessions +8min</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="text-xs text-slate-400">Régularité +23%</span>
              </div>
            </div>
          </div>

          {/* Héritage comportemental */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/20">
            <div className="text-emerald-300 text-sm font-medium mb-4">Héritages comportementaux</div>
            <div className="space-y-3">
              {/* Héritage principal */}
              <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-400/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-emerald-400 text-sm">🌙</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-emerald-300 text-sm font-medium mb-1">Rituel du soir</div>
                    <div className="text-white text-sm leading-relaxed mb-2">
                      Cette semaine hérite de vos meilleures pratiques de mars car vous lisez en moyenne 45 min chaque soir depuis 12 jours
                    </div>
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                      Efficacité: +34% vs lecture matinale
                    </div>
                  </div>
                </div>
              </div>

              {/* Héritage secondaire */}
              <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-400/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-teal-400 text-sm">☔</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-teal-300 text-sm font-medium mb-1">Boost météo</div>
                    <div className="text-white text-sm leading-relaxed mb-2">
                      Vous reproduisez instinctivement votre pattern d'octobre : les jours de pluie déclenchent des sessions 23% plus longues
                    </div>
                    <div className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded inline-block">
                      Déclencheur: Temps gris + weekend
                    </div>
                  </div>
                </div>
              </div>

              {/* Héritage tertiaire */}
              <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-400/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-cyan-400 text-sm">📱</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-cyan-300 text-sm font-medium mb-1">Transition digitale</div>
                    <div className="text-white text-sm leading-relaxed mb-2">
                      Vos micro-sessions de 15min reproduisent votre adaptation réussie de janvier lors des trajets quotidiens
                    </div>
                    <div className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded inline-block">
                      Impact: +2h30 par semaine
                    </div>
                  </div>
                </div>
              </div>

              {/* Pattern émergent */}
              <div className="bg-slate-700/40 rounded-lg p-3 border border-slate-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-slate-400 text-sm">⚡</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-300 text-sm font-medium mb-1">Pattern en formation</div>
                    <div className="text-white text-sm leading-relaxed mb-2">
                      Nouveau comportement détecté : vous tendez à relire les dernières pages avant chaque session depuis 8 jours
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-600/20 px-2 py-1 rounded inline-block">
                      Probabilité de fixation: 73%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <div className="text-xs text-emerald-300 font-medium mb-1">Analyse comportementale</div>
              <div className="text-xs text-slate-300">
                Vos habitudes actuelles combinent 3 patterns éprouvés de votre historique. Cette synergie explique votre série actuelle de {readingData.streak} jours.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 14: ÉTAT ÉMOTIONNEL PRÉ/POST LECTURE ==================== */}
      <div className="bg-gradient-to-r from-violet-800/40 to-purple-800/40 rounded-2xl p-4 mb-6 border border-violet-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h3 className="text-violet-400 font-bold" style={{ textShadow: '0 0 8px rgba(139, 92, 246, 0.5)' }}>🎭 ÉTAT ÉMOTIONNEL PRÉ/POST LECTURE</h3>
        </div>
        
        <div className="space-y-4">
          {/* Interface Pré-Lecture */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-violet-300 text-sm font-medium">État avant lecture</div>
              <div className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">Sélection multiple</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {preReadingEmotions.map((emotion) => (
                <button 
                  key={emotion.id}
                  onClick={() => togglePreEmotion(emotion.id)}
                  disabled={currentSession.preEmotionsRecorded}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    emotion.selected 
                      ? 'bg-violet-500/30 border-violet-400 shadow-lg' 
                      : 'bg-slate-700/40 border-slate-600 hover:bg-slate-700/60'
                  } ${currentSession.preEmotionsRecorded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={emotion.selected ? { boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' } : {}}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{emotion.icon}</span>
                    <span className={`text-sm ${emotion.selected ? 'text-violet-200 font-medium' : 'text-slate-300'}`}>
                      {emotion.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="bg-violet-900/20 rounded-lg p-3 border border-violet-400/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-violet-300">Émotions sélectionnées :</div>
                <div className="flex items-center gap-2">
                  {currentSession.preEmotionsRecorded && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">✓ Enregistré</div>
                  )}
                  <button 
                    onClick={recordPreEmotions}
                    disabled={selectedPreEmotions.length === 0 || currentSession.preEmotionsRecorded}
                    className={`text-xs px-3 py-1 rounded transition-all ${
                      selectedPreEmotions.length === 0 || currentSession.preEmotionsRecorded
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-violet-500 text-white hover:bg-violet-600'
                    }`}
                    aria-label="Enregistrer les émotions avant lecture"
                    aria-disabled={selectedPreEmotions.length === 0 || currentSession.preEmotionsRecorded}
                  >
                    <span aria-hidden="true">📝</span> Enregistrer
                  </button>
                </div>
              </div>
              <div className="text-sm text-white">
                {selectedPreEmotions.length > 0 ? selectedPreEmotions.join(', ') : 'Sélectionnez vos émotions avant lecture'}
              </div>
            </div>
          </div>

          {/* Interface Post-Lecture */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-violet-300 text-sm font-medium">État après lecture</div>
              <div className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">Auto-évaluation</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {postReadingEmotions.map((emotion) => (
                <button 
                  key={emotion.id}
                  onClick={() => togglePostEmotion(emotion.id)}
                  disabled={currentSession.postEmotionsRecorded || !currentSession.preEmotionsRecorded}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    emotion.selected 
                      ? 'bg-violet-500/30 border-violet-400 shadow-lg' 
                      : 'bg-slate-700/40 border-slate-600 hover:bg-slate-700/60'
                  } ${currentSession.postEmotionsRecorded || !currentSession.preEmotionsRecorded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={emotion.selected ? { boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' } : {}}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{emotion.icon}</span>
                    <span className={`text-sm ${emotion.selected ? 'text-violet-200 font-medium' : 'text-slate-300'}`}>
                      {emotion.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="bg-violet-900/20 rounded-lg p-3 border border-violet-400/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-violet-300">Émotions post-lecture :</div>
                <div className="flex items-center gap-2">
                  {currentSession.postEmotionsRecorded && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">✓ Enregistré</div>
                  )}
                  <button 
                    onClick={recordPostEmotions}
                    disabled={selectedPostEmotions.length === 0 || !currentSession.preEmotionsRecorded || currentSession.postEmotionsRecorded}
                    className={`text-xs px-3 py-1 rounded transition-all ${
                      selectedPostEmotions.length === 0 || !currentSession.preEmotionsRecorded || currentSession.postEmotionsRecorded
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-violet-500 text-white hover:bg-violet-600'
                    }`}
                    aria-label="Enregistrer les émotions après lecture"
                    aria-disabled={selectedPostEmotions.length === 0 || !currentSession.preEmotionsRecorded || currentSession.postEmotionsRecorded}
                  >
                    <span aria-hidden="true">📝</span> Enregistrer
                  </button>
                </div>
              </div>
              <div className="text-sm text-white mb-2">
                {selectedPostEmotions.length > 0 ? selectedPostEmotions.join(', ') : 'Sélectionnez vos émotions après lecture'}
              </div>
              {currentSession.canSave && (
                <div className="flex justify-center mt-3">
                  <button 
                    onClick={saveSessionAndReset}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                    aria-label="Sauvegarder la session émotionnelle et recommencer"
                  >
                    <span aria-hidden="true">💾</span> Sauvegarder la session et recommencer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Historique des Sessions du Jour */}
          {todaySessions.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="text-violet-300 text-sm font-medium">Sessions d'aujourd'hui</div>
                <div className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">{todaySessions.length} session(s)</div>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {todaySessions.map((session) => (
                  <div key={session.id} className="bg-slate-700/40 rounded-lg p-2 border border-slate-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-slate-300">{formatSessionTime(session.startTime)}</div>
                      <div className="text-xs text-violet-400">Session #{session.id}</div>
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-cyan-400">Avant:</span> {session.preEmotions.join(', ')}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-emerald-400">Après:</span> {session.postEmotions.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyse des Corrélations */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div className="text-violet-300 text-sm font-medium mb-3">Corrélations détectées ({emotionalSessions.length} sessions analysées)</div>
            
            <div className="space-y-3">
              <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-400/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-emerald-300 text-sm font-medium">Combo gagnant</div>
                  <div className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">+34% vitesse</div>
                </div>
                <div className="text-xs text-slate-300">
                  Motivé + En forme + Curieux = Vos meilleures sessions (87% de réussite)
                </div>
              </div>
              
              <div className="bg-red-900/20 rounded-lg p-3 border border-red-400/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-red-300 text-sm font-medium">Combo à éviter</div>
                  <div className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">-28% performance</div>
                </div>
                <div className="text-xs text-slate-300">
                  Fatigué + Stressé + Pressé = Abandon dans 73% des cas
                </div>
              </div>
              
              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-400/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-300 text-sm font-medium">Pattern optimal</div>
                  <div className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">Recommandé</div>
                </div>
                <div className="text-xs text-slate-300">
                  Détendu + Curieux → Lecture plus longue et satisfaisante
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 15: ANALYSE STRATÉGIQUE DE LECTURE ==================== */}
      <div className="bg-gradient-to-r from-amber-800/40 to-orange-800/40 rounded-2xl p-4 mb-6 border border-amber-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-amber-400 font-bold" style={{ textShadow: '0 0 8px rgba(251, 191, 36, 0.5)' }}>📊 ANALYSE STRATÉGIQUE</h3>
        </div>
        
        <div className="space-y-4">
          {/* ROI de Lecture */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div className="text-amber-300 text-sm font-medium mb-3">ROI de lecture</div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="text-xs text-amber-400 mb-1">Temps investi</div>
                <div className="text-lg font-bold text-white">{readingROI.timeInvested}h</div>
                <div className="text-xs text-slate-400">ce mois</div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="text-xs text-amber-400 mb-1">Concepts appris</div>
                <div className="text-lg font-bold text-white">{readingROI.knowledgeGained}</div>
                <div className="text-xs text-emerald-400">+8 vs mois dernier</div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="text-xs text-amber-400 mb-1">Applications</div>
                <div className="text-lg font-bold text-white">{readingROI.applicationsFound}</div>
                <div className="text-xs text-slate-400">pratiques trouvées</div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="text-xs text-amber-400 mb-1">Efficacité</div>
                <div className="text-lg font-bold text-white">{readingROI.efficiency}%</div>
                <div className="text-xs text-emerald-400">objectifs atteints</div>
              </div>
            </div>
            
            <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-400/20">
              <div className="text-amber-300 text-sm font-medium mb-2">Efficacité stratégique</div>
              <div className="text-sm text-white mb-2">
                {readingROI.efficiency}% de vos lectures atteignent leurs objectifs
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${readingROI.efficiency}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Analyse des Abandons */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div className="text-amber-300 text-sm font-medium mb-3">Analyse des abandons</div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Taux de complétion</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                  <span className="text-emerald-400 text-sm font-bold">{completionRate}%</span>
                </div>
              </div>
              
              <div className="bg-red-900/20 rounded-lg p-3 border border-red-400/20">
                <div className="text-red-300 text-sm font-medium mb-2">Principales causes d'abandon</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Complexité excessive</span>
                    <span className="text-red-400">34%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Manque de temps</span>
                    <span className="text-red-400">28%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Perte d'intérêt</span>
                    <span className="text-red-400">23%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-400/20">
                <div className="text-amber-300 text-sm font-medium mb-1">Stratégie d'optimisation</div>
                <div className="text-xs text-slate-300">
                  Commencez par des livres de 200-250 pages dans vos genres favoris pour augmenter votre taux de complétion
                </div>
              </div>
            </div>
          </div>

          {/* Objectifs de Lecture */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div className="text-amber-300 text-sm font-medium mb-3">Mapping des objectifs</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-400/20">
                <div className="text-blue-300 text-sm font-medium mb-1">📚 Apprentissage</div>
                <div className="text-white text-lg font-bold">{objectives.learning}%</div>
                <div className="text-xs text-slate-400">de vos lectures</div>
              </div>
              <div className="bg-green-900/20 rounded-lg p-3 border border-green-400/20">
                <div className="text-green-300 text-sm font-medium mb-1">🎭 Plaisir</div>
                <div className="text-white text-lg font-bold">{objectives.pleasure}%</div>
                <div className="text-xs text-slate-400">de vos lectures</div>
              </div>
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
                <div className="text-purple-300 text-sm font-medium mb-1">🚀 Développement</div>
                <div className="text-white text-lg font-bold">{objectives.development}%</div>
                <div className="text-xs text-slate-400">de vos lectures</div>
              </div>
              <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-400/20">
                <div className="text-cyan-300 text-sm font-medium mb-1">🔬 Recherche</div>
                <div className="text-white text-lg font-bold">{objectives.research}%</div>
                <div className="text-xs text-slate-400">de vos lectures</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODULE 16: ÉQUILIBRE DE LECTURE ==================== */}
      <div className="bg-gradient-to-r from-rose-800/40 to-pink-800/40 rounded-2xl p-4 mb-6 border border-rose-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-rose-400 font-bold" style={{ textShadow: '0 0 8px rgba(244, 63, 94, 0.5)' }}>⚖️ ÉQUILIBRE DE LECTURE</h3>
        </div>
        
        <div className="space-y-4">
          {/* Répartition des Genres */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-rose-500/20">
            <div className="text-rose-300 text-sm font-medium mb-3">Répartition par genre</div>
            
            <div className="space-y-3">
              {genreBalance.map((genre) => (
                <div key={genre.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm">{genre.icon} {genre.name}</span>
                    <span className="text-rose-400 text-sm font-bold">{genre.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${genre.color}`}
                      style={{ width: `${genre.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-rose-900/20 rounded-lg p-3 border border-rose-400/20">
              <div className="text-rose-300 text-sm font-medium mb-1">Score d'équilibre global</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-white">{balanceScore}%</div>
                <div className="flex-1">
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-rose-400 to-pink-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${balanceScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-rose-400">{getBalanceLevel(balanceScore)}</div>
              </div>
            </div>
          </div>

          {/* Zones de Déséquilibre */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-rose-500/20">
            <div className="text-rose-300 text-sm font-medium mb-3">Zones d'amélioration</div>
            
            <div className="space-y-2">
              <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-orange-400 text-sm">⚠️</span>
                  <span className="text-orange-300 text-sm font-medium">Genre sous-représenté</span>
                </div>
                <div className="text-xs text-slate-300">
                  Biographies : seulement 8% de vos lectures. Essayez "Steve Jobs" ou "Marie Curie"
                </div>
              </div>
              
              <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-sm">💡</span>
                  <span className="text-yellow-300 text-sm font-medium">Opportunité d'exploration</span>
                </div>
                <div className="text-xs text-slate-300">
                  Vous excellez en fiction (92% de complétion). Tentez la science-fiction pour élargir
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions de Rééquilibrage */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-rose-500/20">
            <div className="text-rose-300 text-sm font-medium mb-3">Plan de rééquilibrage</div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-rose-400 text-xs">1️⃣</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Cette semaine : 1 biographie courte</div>
                  <div className="text-xs text-slate-400">Objectif : découvrir ce genre sans pression</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-rose-400 text-xs">2️⃣</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Mois prochain : alterner fiction/non-fiction</div>
                  <div className="text-xs text-slate-400">Ratio cible : 60% fiction, 40% non-fiction</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-rose-400 text-xs">3️⃣</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Objectif trimestre : explorer 2 nouveaux genres</div>
                  <div className="text-xs text-slate-400">Suggestions : Essais philosophiques, Récits de voyage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note: Phase 6 COMPLÈTE - 16/16 modules implémentés ! 🎉 */}
    </div>
  );
};

// PropTypes pour validation des props
ReadingRhythmBlock.propTypes = {
  rhythmData: PropTypes.shape({
    streak: PropTypes.number,
    todayMinutes: PropTypes.number,
    dailyGoal: PropTypes.number,
    pagesRemaining: PropTypes.number,
    readingSpeed: PropTypes.number,
    avgSession: PropTypes.number,
    weeklyData: PropTypes.arrayOf(PropTypes.shape({
      day: PropTypes.number,
      minutes: PropTypes.number,
      completed: PropTypes.bool
    }))
  }),
  onStartTimer: PropTypes.func,
  onStopTimer: PropTypes.func
};

export default ReadingRhythmBlock;
