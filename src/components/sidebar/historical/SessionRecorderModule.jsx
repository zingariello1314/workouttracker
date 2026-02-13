/**
 * SessionRecorderModule - Module d'enregistrement de sessions REFONTE
 * 
 * Fonctionnalités:
 * - Design carré compact et harmonieux
 * - Boutons équilibrés avec animations fluides
 * - Navigation intelligente vers Sport/Livres/Apprentissage
 * - Timer moderne avec états visuels
 * - Interface intuitive et guidée
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Save,
  X,
  Clock,
  Play,
  Pause,
  Square
} from 'lucide-react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import { readingAPI } from '../../../services/dashboard/dashboardStorage';

// Composants refactés
import TimerDisplay from './refonte/TimerDisplay';
import ActivitySelector from './refonte/ActivitySelector';
import TimerControls from './refonte/TimerControls';

// Styles refonte
import '../../../styles/session-recorder-refonte.css';

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
 * Composant principal SessionRecorderModule - REFONTE MODERNE
 */
const SessionRecorderModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // États du timer de lecture
  const [readingTimer, setReadingTimer] = useState({
    isActive: false,
    isPaused: false,
    elapsed: 0,
    startTime: null
  });

  // États des modals/menus
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeActivity, setActiveActivity] = useState(null);

  // Données simulées (à remplacer par les vraies données)
  const books = data?.books || [];

  // Effet pour le timer
  useEffect(() => {
    let interval;
    
    if (readingTimer.isActive) {
      interval = setInterval(() => {
        setReadingTimer(prev => {
          const newTimer = {
            ...prev,
            elapsed: prev.elapsed + 1
          };
          
          // Émettre l'événement de mise à jour du timer
          window.dispatchEvent(new CustomEvent('reading:timer:update', {
            detail: {
              isActive: newTimer.isActive,
              elapsed: newTimer.elapsed,
              startTime: newTimer.startTime
            }
          }));
          
          return newTimer;
        });
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
      isPaused: false,
      startTime: prev.startTime || Date.now()
    }));
  }, []);

  const handleTimerPause = useCallback(() => {
    setReadingTimer(prev => ({
      ...prev,
      isActive: false,
      isPaused: true
    }));
  }, []);

  const handleTimerStop = useCallback(() => {
    if (readingTimer.elapsed > 0) {
      setShowSessionModal(true);
      
      // Émettre l'événement d'arrêt du timer
      window.dispatchEvent(new CustomEvent('reading:timer:stop', {
        detail: {
          elapsed: readingTimer.elapsed,
          startTime: readingTimer.startTime
        }
      }));
    }
  }, [readingTimer.elapsed, readingTimer.startTime]);

  const handleTimerReset = useCallback(() => {
    setReadingTimer({
      isActive: false,
      isPaused: false,
      elapsed: 0,
      startTime: null
    });
    setActiveActivity(null);
  }, []);

  // Handlers de navigation améliorés
  const handleNavigateToSport = useCallback(async () => {
    setActiveActivity('sport');
    
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'sport',
          subtab: 'aujourdhui',
          moduleId: 'session-recorder',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
        
        // Émettre événement pour synchronisation
        window.dispatchEvent(new CustomEvent('session:activity:selected', {
          detail: { type: 'sport', timestamp: Date.now() }
        }));
      } catch (error) {
        console.error('Erreur de navigation vers Sport:', error);
        // Fallback
        navigation.setActiveTab('sport');
      }
    }
  }, [navigation]);

  const handleNavigateToBooks = useCallback(async () => {
    setActiveActivity('books');
    
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'books',
          subtab: 'reading',
          moduleId: 'books-reading-session',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
        
        // Émettre événement pour synchronisation
        window.dispatchEvent(new CustomEvent('session:activity:selected', {
          detail: { type: 'books', timestamp: Date.now() }
        }));
      } catch (error) {
        console.error('Erreur de navigation vers Livres:', error);
        // Fallback
        navigation.setActiveTab('books');
      }
    }
  }, [navigation]);

  const handleNavigateToLearning = useCallback(async () => {
    setActiveActivity('learning');
    
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'apprentissage',
          subtab: 'aujourdhui',
          moduleId: 'learning-session',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
        
        // Émettre événement pour synchronisation
        window.dispatchEvent(new CustomEvent('session:activity:selected', {
          detail: { type: 'learning', timestamp: Date.now() }
        }));
      } catch (error) {
        console.error('Erreur de navigation vers Apprentissage:', error);
        // Fallback
        navigation.setActiveTab('apprentissage');
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



  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Enregistrer Session"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🎯</span>
          Enregistrer Session
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>

      {isExpanded && (
        <div className="sidebar-section-content session-recorder-module-content">
        <>
          {/* Sélecteur d'activités */}
          <ActivitySelector
            onSportClick={handleNavigateToSport}
            onBooksClick={handleNavigateToBooks}
            onLearningClick={handleNavigateToLearning}
            activeActivity={activeActivity}
          />

          {/* Timer carré compact */}
          <TimerDisplay
            elapsed={readingTimer.elapsed}
            isActive={readingTimer.isActive}
            isPaused={readingTimer.isPaused}
          />
          
          {/* Contrôles du timer harmonisés */}
          <TimerControls
            isActive={readingTimer.isActive}
            elapsed={readingTimer.elapsed}
            onPlay={handleTimerPlay}
            onPause={handleTimerPause}
            onStop={handleTimerStop}
          />


          
          {/* Modal de fin de session lecture */}
          <SessionEndModal
            isOpen={showSessionModal}
            onClose={() => setShowSessionModal(false)}
            onSave={handleSaveReadingSession}
            sessionDuration={readingTimer.elapsed}
            books={books}
          />
        </>
        </div>
      )}
    </section>
  );
});

SessionRecorderModule.displayName = 'SessionRecorderModule';

export default SessionRecorderModule;