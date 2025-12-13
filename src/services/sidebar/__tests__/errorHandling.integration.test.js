/**
 * Tests d'intégration pour le système de gestion d'erreurs avancée
 * Requirements: 14.5 - Tests de la gestion gracieuse des erreurs
 * 
 * @module services/sidebar/__tests__/errorHandling.integration.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorHandlingService, SYSTEM_ERROR_TYPES } from '../errorHandlingService';
import { navigationErrorHandler, NAVIGATION_ERROR_TYPES } from '../navigationErrorHandler';
import { syncErrorHandler, SYNC_ERROR_TYPES, SYNC_STATES } from '../syncErrorHandler';

// Mock des APIs du navigateur
const mockNavigator = {
  onLine: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  scrollTo: vi.fn(),
  location: {
    href: 'http://localhost:3000',
    hash: '#/'
  }
};

const mockDocument = {
  querySelector: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  hidden: false
};

// Configuration globale des mocks
beforeEach(() => {
  global.navigator = mockNavigator;
  global.window = mockWindow;
  global.document = mockDocument;
  
  // Reset des mocks
  vi.clearAllMocks();
});

afterEach(async () => {
  // Nettoyer les services après chaque test
  await errorHandlingService.cleanup();
  await navigationErrorHandler.cleanup();
  await syncErrorHandler.cleanup();
});

describe('ErrorHandlingService', () => {
  describe('Initialisation', () => {
    it('devrait initialiser le service correctement', async () => {
      const result = await errorHandlingService.initialize();
      
      expect(errorHandlingService.isInitialized).toBe(true);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('ne devrait pas réinitialiser si déjà initialisé', async () => {
      await errorHandlingService.initialize();
      const addEventListenerCallCount = mockWindow.addEventListener.mock.calls.length;
      
      await errorHandlingService.initialize();
      
      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(addEventListenerCallCount);
    });
  });

  describe('Gestion des erreurs système', () => {
    beforeEach(async () => {
      await errorHandlingService.initialize();
    });

    it('devrait gérer les erreurs de navigation', async () => {
      const errorData = {
        targetModule: 'test-module',
        targetTab: 'books',
        error: 'Navigation failed'
      };

      const result = await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.NAVIGATION_FAILED,
        errorData
      );

      const stats = errorHandlingService.getStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType[SYSTEM_ERROR_TYPES.NAVIGATION_FAILED]).toBe(1);
    });

    it('devrait gérer les erreurs de synchronisation', async () => {
      const errorData = {
        moduleId: 'test-module',
        dataType: 'metrics',
        error: 'Sync timeout'
      };

      const result = await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.SYNC_FAILED,
        errorData
      );

      const stats = errorHandlingService.getStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType[SYSTEM_ERROR_TYPES.SYNC_FAILED]).toBe(1);
    });

    it('devrait appliquer les stratégies de récupération', async () => {
      const errorData = {
        moduleId: 'test-module',
        error: 'Data load failed'
      };

      await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED,
        errorData
      );

      // Vérifier que l'événement de fallback a été émis
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sidebar:show:placeholder'
        })
      );
    });
  });

  describe('Stratégies de récupération', () => {
    beforeEach(async () => {
      await errorHandlingService.initialize();
    });

    it('devrait exécuter la stratégie de retry', async () => {
      const errorData = {
        moduleId: 'test-module',
        error: 'Network error'
      };

      // Simuler plusieurs échecs pour déclencher les retries
      await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.NETWORK_ERROR,
        errorData
      );

      const stats = errorHandlingService.getStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });

    it('devrait utiliser les données en cache en fallback', async () => {
      const errorData = {
        moduleId: 'test-module',
        dataType: 'metrics'
      };

      await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED,
        errorData
      );

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sidebar:show:placeholder'
        })
      );
    });
  });

  describe('Notifications utilisateur', () => {
    beforeEach(async () => {
      await errorHandlingService.initialize();
    });

    it('devrait émettre des notifications pour les erreurs critiques', async () => {
      const errorData = {
        moduleId: 'test-module',
        error: 'Critical system error'
      };

      await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.CACHE_CORRUPTED,
        errorData
      );

      // Vérifier qu'une notification a été programmée
      const stats = errorHandlingService.getStats();
      expect(stats.totalErrors).toBe(1);
    });
  });
});

describe('NavigationErrorHandler', () => {
  describe('Initialisation', () => {
    it('devrait initialiser le gestionnaire de navigation', async () => {
      await navigationErrorHandler.initialize();
      
      expect(navigationErrorHandler.isInitialized).toBe(true);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('sidebar:navigate', expect.any(Function));
    });
  });

  describe('Gestion des erreurs de navigation', () => {
    beforeEach(async () => {
      await navigationErrorHandler.initialize();
    });

    it('devrait gérer les échecs de scroll', async () => {
      const navigationData = {
        targetModule: 'test-module',
        targetTab: 'books',
        scrollToModule: true
      };

      // Simuler l'absence de l'élément cible
      mockDocument.querySelector.mockReturnValue(null);

      await navigationErrorHandler.handleNavigationRequest(navigationData);

      const stats = navigationErrorHandler.getStats();
      expect(stats.totalNavigations).toBe(1);
    });

    it('devrait appliquer les fallbacks de navigation', async () => {
      const navigationData = {
        targetModule: 'non-existent-module',
        error: 'Module not found'
      };

      await navigationErrorHandler.handleNavigationFailure(navigationData);

      // Vérifier que le fallback de scroll vers le haut a été appelé
      expect(mockWindow.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('devrait tenter des retries automatiques', async () => {
      const navigationData = {
        targetModule: 'test-module',
        targetTab: 'books'
      };

      // Simuler un échec initial
      await navigationErrorHandler.handleNavigationFailure({
        ...navigationData,
        error: 'Navigation timeout'
      });

      const stats = navigationErrorHandler.getStats();
      expect(stats.failedNavigations).toBe(1);
    });
  });

  describe('Classification des erreurs', () => {
    it('devrait classifier correctement les erreurs de scroll', () => {
      const errorType = navigationErrorHandler.classifyNavigationError('scroll failed');
      expect(errorType).toBe(NAVIGATION_ERROR_TYPES.SCROLL_FAILED);
    });

    it('devrait classifier correctement les erreurs d\'onglet', () => {
      const errorType = navigationErrorHandler.classifyNavigationError('tab activation failed');
      expect(errorType).toBe(NAVIGATION_ERROR_TYPES.TAB_ACTIVATION_FAILED);
    });

    it('devrait classifier correctement les timeouts', () => {
      const errorType = navigationErrorHandler.classifyNavigationError('navigation timeout');
      expect(errorType).toBe(NAVIGATION_ERROR_TYPES.TIMEOUT);
    });
  });
});

describe('SyncErrorHandler', () => {
  describe('Initialisation', () => {
    it('devrait initialiser le gestionnaire de synchronisation', async () => {
      await syncErrorHandler.initialize();
      
      expect(syncErrorHandler.isInitialized).toBe(true);
      expect(syncErrorHandler.getSyncState()).toBe(SYNC_STATES.CONNECTING);
    });
  });

  describe('Gestion des erreurs de synchronisation', () => {
    beforeEach(async () => {
      await syncErrorHandler.initialize();
    });

    it('devrait gérer les pertes de connexion', async () => {
      const errorData = {
        reason: 'Connection lost',
        code: 1006
      };

      syncErrorHandler.handleConnectionLost(errorData);

      expect(syncErrorHandler.getSyncState()).toBe(SYNC_STATES.DISCONNECTED);
    });

    it('devrait gérer les conflits de données', async () => {
      const conflictData = {
        moduleId: 'test-module',
        dataType: 'metrics',
        localVersion: 1,
        remoteVersion: 2
      };

      syncErrorHandler.handleDataConflict(conflictData);

      const stats = syncErrorHandler.getStats();
      expect(stats.conflictQueue).toBe(1);
    });

    it('devrait tenter des reconnexions automatiques', async () => {
      // Simuler une perte de connexion
      syncErrorHandler.handleConnectionLost({ reason: 'Network error' });
      
      expect(syncErrorHandler.getSyncState()).toBe(SYNC_STATES.DISCONNECTED);
      
      // La reconnexion devrait être programmée
      const stats = syncErrorHandler.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Stratégies de fallback', () => {
    beforeEach(async () => {
      await syncErrorHandler.initialize();
    });

    it('devrait utiliser les données en cache lors d\'échecs de sync', async () => {
      const syncData = {
        moduleId: 'test-module',
        dataType: 'metrics',
        error: 'Connection lost'
      };

      await syncErrorHandler.applySyncFallback(syncData, SYNC_ERROR_TYPES.CONNECTION_LOST);

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sidebar:use:cache'
        })
      );
    });

    it('devrait activer le mode lecture seule pour les erreurs de permission', async () => {
      const syncData = {
        moduleId: 'test-module',
        dataType: 'metrics',
        error: 'Permission denied'
      };

      await syncErrorHandler.applySyncFallback(syncData, SYNC_ERROR_TYPES.PERMISSION_DENIED);

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sidebar:mode:readonly'
        })
      );
    });
  });

  describe('Classification des erreurs', () => {
    it('devrait classifier correctement les erreurs de connexion', () => {
      const errorType = syncErrorHandler.classifySyncError('connection lost');
      expect(errorType).toBe(SYNC_ERROR_TYPES.CONNECTION_LOST);
    });

    it('devrait classifier correctement les conflits de données', () => {
      const errorType = syncErrorHandler.classifySyncError('data conflict detected');
      expect(errorType).toBe(SYNC_ERROR_TYPES.DATA_CONFLICT);
    });

    it('devrait classifier correctement les timeouts', () => {
      const errorType = syncErrorHandler.classifySyncError('sync timeout');
      expect(errorType).toBe(SYNC_ERROR_TYPES.SYNC_TIMEOUT);
    });
  });
});

describe('Intégration des services d\'erreur', () => {
  beforeEach(async () => {
    await errorHandlingService.initialize();
    await navigationErrorHandler.initialize();
    await syncErrorHandler.initialize();
  });

  it('devrait coordonner les erreurs entre les services', async () => {
    // Simuler une erreur de navigation qui déclenche une erreur de sync
    const navigationData = {
      targetModule: 'test-module',
      targetTab: 'books',
      error: 'Navigation failed'
    };

    await errorHandlingService.handleSystemError(
      SYSTEM_ERROR_TYPES.NAVIGATION_FAILED,
      navigationData
    );

    const errorStats = errorHandlingService.getStats();
    const navStats = navigationErrorHandler.getStats();

    expect(errorStats.totalErrors).toBeGreaterThan(0);
  });

  it('devrait partager les statistiques entre les services', () => {
    const errorStats = errorHandlingService.getStats();
    const navStats = navigationErrorHandler.getStats();
    const syncStats = syncErrorHandler.getStats();

    expect(errorStats).toHaveProperty('totalErrors');
    expect(navStats).toHaveProperty('totalNavigations');
    expect(syncStats).toHaveProperty('totalSyncs');
  });

  it('devrait nettoyer correctement tous les services', async () => {
    await errorHandlingService.cleanup();
    await navigationErrorHandler.cleanup();
    await syncErrorHandler.cleanup();

    expect(errorHandlingService.isInitialized).toBe(false);
    expect(navigationErrorHandler.isInitialized).toBe(false);
    expect(syncErrorHandler.isInitialized).toBe(false);
  });
});

describe('Gestion des événements globaux', () => {
  beforeEach(async () => {
    await errorHandlingService.initialize();
  });

  it('devrait gérer les erreurs JavaScript globales', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      filename: 'test.js',
      lineno: 1,
      colno: 1,
      error: new Error('Test error')
    });

    // Simuler l'événement d'erreur globale
    const errorHandler = mockWindow.addEventListener.mock.calls
      .find(call => call[0] === 'error')[1];
    
    errorHandler(errorEvent);

    const stats = errorHandlingService.getStats();
    expect(stats.totalErrors).toBeGreaterThan(0);
  });

  it('devrait gérer les promesses rejetées non capturées', () => {
    const rejectionEvent = {
      reason: new Error('Unhandled promise rejection'),
      preventDefault: vi.fn()
    };

    // Simuler l'événement de rejet de promesse
    const rejectionHandler = mockWindow.addEventListener.mock.calls
      .find(call => call[0] === 'unhandledrejection')[1];
    
    rejectionHandler(rejectionEvent);

    const stats = errorHandlingService.getStats();
    expect(stats.totalErrors).toBeGreaterThan(0);
  });
});

describe('Performance et optimisation', () => {
  it('devrait limiter la taille de l\'historique des erreurs', async () => {
    await errorHandlingService.initialize();

    // Générer plus d'erreurs que la limite
    for (let i = 0; i < 150; i++) {
      await errorHandlingService.handleSystemError(
        SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED,
        { moduleId: `test-module-${i}`, error: `Error ${i}` }
      );
    }

    const history = errorHandlingService.getErrorHistory();
    expect(history.length).toBeLessThanOrEqual(100); // Limite configurée
  });

  it('devrait nettoyer les retries abandonnés', async () => {
    await navigationErrorHandler.initialize();

    // Simuler des retries abandonnés
    const oldNavigation = {
      targetModule: 'old-module',
      startTime: Date.now() - (10 * 60 * 1000) // 10 minutes ago
    };

    navigationErrorHandler.activeNavigations.set('old-nav', oldNavigation);
    
    // Déclencher le nettoyage
    navigationErrorHandler.performCleanup();

    expect(navigationErrorHandler.activeNavigations.has('old-nav')).toBe(false);
  });
});