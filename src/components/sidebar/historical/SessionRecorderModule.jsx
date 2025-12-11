/**
 * SessionRecorderModule - Module d'enregistrement de sessions (Position 1)
 * 
 * Fonctionnalités:
 * - Boutons de navigation vers Sport/Livres/Apprentissage
 * - Timer de lecture intégré avec contrôles Play/Pause/Stop
 * - Modal obligatoire de fin de session lecture
 * - Menu d'apprentissage avec sélection matière et durée
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  BookOpen, 
  Dumbbell, 
  GraduationCap,
  Clock,
  Save,
  X
} from 'lucide-react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import { useNavigation } from '../../../hooks/useNavigation';
import { readingAPI, learningAPI } from '../../../services/dashboard/dashboardStorage';
import '../../../styles/session-recorder-module.css';

/**
 * Composant Timer de lecture
 */
const ReadingTimer = memo(({ 
  isActive, 
  elapsed, 
  onPlay, 
  onPause, 
  onStop 
}) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="reading-timer bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400">Timer Lecture</span>
        </div>
        <div className="text-lg font-mono text-white">
          {formatTime(elapsed)}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        {!isActive ? (
          <button
            onClick={onPlay}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
            aria-label="Démarrer le timer de lecture"
          >
            <Play className="w-4 h-4" />
            Play
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
            aria-label="Mettre en pause le timer de lecture"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}
        
        <button
          onClick={onStop}
          disabled={elapsed === 0}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200"
          aria-label="Arrêter le timer de lecture"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      </div>
    </div>
  );
});

ReadingTimer.displayName = 'ReadingTimer';

/**
 * Modal de fin de session lecture
 */
const SessionEndModal = memo(({ 
  isOpen, 
  onClose, 
  onSave, 
  sessionDuration,
  books = []
}) => {
  const [selectedBookId, setSelectedBookId] = useState('');
  const [pagesRead, setPagesRead] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBookId(books[0]?.id || '');
      setPagesRead('');
      setIsLoading(false);
    }
  }, [isOpen, books]);

  const handleSave = async () => {
    if (!selectedBookId || !pagesRead || parseInt(pagesRead) <= 0) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave({
        bookId: selectedBookId,
        pagesRead: parseInt(pagesRead),
        duration: sessionDuration
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Fin de session</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fermer la modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-400">Durée de la session</div>
            <div className="text-xl font-semibold text-white">{formatDuration(sessionDuration)}</div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Livre lu <span className="text-red-400">*</span>
            </label>
            {books.length === 0 ? (
              <div className="p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-center text-slate-400 text-sm">
                Aucun livre disponible
              </div>
            ) : (
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              >
                <option value="">Sélectionner un livre</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Nombre de pages lues <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              min="1"
              placeholder="Ex: 15"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedBookId || !pagesRead || parseInt(pagesRead) <= 0 || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SessionEndModal.displayName = 'SessionEndModal';

/**
 * Menu d'apprentissage
 */
const LearningMenu = memo(({ 
  isOpen, 
  onClose, 
  onSave,
  subjects = []
}) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when menu opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSubject('');
      setDuration('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!selectedSubject || !duration || parseInt(duration) <= 0) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave({
        subject: selectedSubject,
        duration: parseInt(duration)
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session d\'apprentissage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-10">
      <h4 className="text-sm font-semibold text-white mb-3">Enregistrer Apprentissage</h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Matière</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
          >
            <option value="">Sélectionner une matière</option>
            <option value="mathematics">Mathématiques</option>
            <option value="programming">Programmation</option>
            <option value="languages">Langues</option>
            <option value="science">Sciences</option>
            <option value="history">Histoire</option>
            <option value="philosophy">Philosophie</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Durée (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            min="1"
            placeholder="Ex: 30"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedSubject || !duration || parseInt(duration) <= 0 || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
});

LearningMenu.displayName = 'LearningMenu';

/**
 * Composant principal SessionRecorderModule
 */
const SessionRecorderModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  data = {},
  navigation
}) => {
  // États du timer de lecture
  const [readingTimer, setReadingTimer] = useState({
    isActive: false,
    elapsed: 0,
    startTime: null
  });

  // États des modals/menus
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showLearningMenu, setShowLearningMenu] = useState(false);

  // Données simulées (à remplacer par les vraies données)
  const books = data?.books || [];
  const subjects = data?.subjects || [];
  
  // Debug: Log des données reçues
  React.useEffect(() => {
    console.log('[SessionRecorderModule] Props reçues:', {
      moduleId,
      moduleType,
      data,
      navigation,
      booksCount: books.length,
      subjectsCount: subjects.length
    });
  }, [moduleId, moduleType, data, navigation, books.length, subjects.length]);

  // Effet pour le timer
  useEffect(() => {
    let interval;
    
    if (readingTimer.isActive) {
      interval = setInterval(() => {
        setReadingTimer(prev => ({
          ...prev,
          elapsed: prev.elapsed + 1
        }));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [readingTimer.isActive]);

  // Handlers du timer
  const handleTimerPlay = useCallback(() => {
    setReadingTimer(prev => ({
      ...prev,
      isActive: true,
      startTime: prev.startTime || Date.now()
    }));
  }, []);

  const handleTimerPause = useCallback(() => {
    setReadingTimer(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const handleTimerStop = useCallback(() => {
    if (readingTimer.elapsed > 0) {
      setShowSessionModal(true);
    }
  }, [readingTimer.elapsed]);

  const handleTimerReset = useCallback(() => {
    setReadingTimer({
      isActive: false,
      elapsed: 0,
      startTime: null
    });
  }, []);

  // Handlers de navigation
  const handleNavigateToSport = useCallback(async () => {
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'sport',
          subtab: 'aujourdhui',
          moduleId: 'session-recorder',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
      } catch (error) {
        console.error('Erreur de navigation vers Sport:', error);
        // Fallback
        navigation.setActiveTab('sport');
      }
    }
  }, [navigation]);

  const handleNavigateToBooks = useCallback(async () => {
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'books',
          subtab: 'reading',
          moduleId: 'books-reading-session',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
      } catch (error) {
        console.error('Erreur de navigation vers Livres:', error);
        // Fallback
        navigation.setActiveTab('books');
      }
    }
  }, [navigation]);

  // Handlers de sauvegarde
  const handleSaveReadingSession = useCallback(async (sessionData) => {
    try {
      // Sauvegarder via l'API existante
      await readingAPI.saveSession({
        bookId: sessionData.bookId,
        pagesRead: sessionData.pagesRead,
        duration: Math.floor(sessionData.duration / 60), // Convertir en minutes
        notes: sessionData.notes || ''
      });
      
      // Reset du timer
      handleTimerReset();
      
      // Émettre un événement de synchronisation pour mettre à jour la sidebar
      window.dispatchEvent(new CustomEvent('sidebar:session:saved', {
        detail: {
          type: 'reading',
          data: sessionData
        }
      }));
      
      // Émettre un événement pour synchroniser avec les modules principaux
      window.dispatchEvent(new CustomEvent('historical:session:stopped', {
        detail: {
          type: 'reading',
          bookId: sessionData.bookId,
          pagesRead: sessionData.pagesRead,
          duration: sessionData.duration
        }
      }));
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
      throw error;
    }
  }, [handleTimerReset]);

  const handleSaveLearningSession = useCallback(async (sessionData) => {
    try {
      // Sauvegarder via l'API existante
      await learningAPI.saveSession(sessionData.duration);
      
      // Émettre un événement de synchronisation pour mettre à jour la sidebar
      window.dispatchEvent(new CustomEvent('sidebar:session:saved', {
        detail: {
          type: 'learning',
          data: sessionData
        }
      }));
      
      // Émettre un événement pour synchroniser avec les modules principaux
      window.dispatchEvent(new CustomEvent('historical:session:stopped', {
        detail: {
          type: 'learning',
          subject: sessionData.subject,
          duration: sessionData.duration
        }
      }));
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session d\'apprentissage:', error);
      throw error;
    }
  }, []);

  return (
    <div 
      className="sidebar-section historical-module session-recorder-module"
      data-module-id={moduleId}
      data-module-type={moduleType}
    >
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          <span className="sidebar-section-icon">🎯</span>
          Enregistrer Session
        </h3>
      </div>

      <div className="sidebar-section-content space-y-4">
        {/* Boutons de navigation rapide */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleNavigateToSport}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            aria-label="Naviguer vers l'onglet Sport"
          >
            <Dumbbell className="w-4 h-4" />
            Sport
          </button>
          
          <button
            onClick={handleNavigateToBooks}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            aria-label="Naviguer vers l'onglet Livres"
          >
            <BookOpen className="w-4 h-4" />
            Livres
          </button>
        </div>

        {/* Timer de lecture */}
        <ReadingTimer
          isActive={readingTimer.isActive}
          elapsed={readingTimer.elapsed}
          onPlay={handleTimerPlay}
          onPause={handleTimerPause}
          onStop={handleTimerStop}
        />

        {/* Bouton Apprentissage avec menu déroulant */}
        <div className="relative">
          <button
            onClick={() => setShowLearningMenu(!showLearningMenu)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            aria-label="Enregistrer une session d'apprentissage"
            aria-expanded={showLearningMenu}
          >
            <GraduationCap className="w-4 h-4" />
            Apprentissage
          </button>

          <LearningMenu
            isOpen={showLearningMenu}
            onClose={() => setShowLearningMenu(false)}
            onSave={handleSaveLearningSession}
            subjects={subjects}
          />
        </div>
      </div>

      {/* Modal de fin de session lecture */}
      <SessionEndModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSave={handleSaveReadingSession}
        sessionDuration={readingTimer.elapsed}
        books={books}
      />
    </div>
  );
});

SessionRecorderModule.displayName = 'SessionRecorderModule';

export default SessionRecorderModule;