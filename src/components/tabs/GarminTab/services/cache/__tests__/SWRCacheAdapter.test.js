import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SWRCacheAdapter } from '../SWRCacheAdapter';

// Mock adapter de base pour les tests
class MockBaseAdapter {
  constructor() {
    this.data = new Map();
    this.timestamps = new Map();
  }

  buildKey(rangeInfo) {
    return `${rangeInfo.startDate || ''}_${rangeInfo.endDate || ''}`;
  }

  get(rangeInfo, context = {}) {
    const key = this.buildKey(rangeInfo);
    const cached = this.data.get(key);
    if (!cached) {
      return null;
    }
    const timestamp = this.timestamps.get(key) || 0;
    return {
      data: cached,
      timestamp,
      remainingMs: 60000 - (Date.now() - timestamp),
      ttlMs: 60000
    };
  }

  set(rangeInfo, data, context = {}) {
    const key = this.buildKey(rangeInfo);
    this.data.set(key, data);
    this.timestamps.set(key, Date.now());
  }
}

describe('SWRCacheAdapter', () => {
  let baseAdapter;
  let revalidateFn;
  let swrAdapter;

  beforeEach(() => {
    baseAdapter = new MockBaseAdapter();
    revalidateFn = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (swrAdapter) {
      swrAdapter.cleanup();
      swrAdapter = null;
    }
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Construction', () => {
    it('rejette si baseAdapter est manquant', () => {
      expect(() => {
        new SWRCacheAdapter({ revalidateFn });
      }).toThrow('SWRCacheAdapter requires a baseAdapter');
    });

    it('rejette si revalidateFn est manquant', () => {
      expect(() => {
        new SWRCacheAdapter({ baseAdapter });
      }).toThrow('SWRCacheAdapter requires a revalidateFn function');
    });

    it('crée une instance valide avec baseAdapter et revalidateFn', () => {
      swrAdapter = new SWRCacheAdapter({ baseAdapter, revalidateFn });
      expect(swrAdapter).toBeInstanceOf(SWRCacheAdapter);
    });
  });

  describe('get() - Stratégie SWR', () => {
    it('retourne null si aucune donnée en cache', async () => {
      swrAdapter = new SWRCacheAdapter({ baseAdapter, revalidateFn });
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const result = await swrAdapter.get(rangeInfo);
      expect(result).toBeNull();
      expect(revalidateFn).not.toHaveBeenCalled();
    });

    it('retourne immédiatement les données fraîches sans revalidation', async () => {
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { staleThresholdMs: 30000 }
      });
      
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const testData = { dailyMetrics: {}, activities: {} };
      
      // Mettre des données fraîches en cache
      baseAdapter.set(rangeInfo, testData);
      
      const result = await swrAdapter.get(rangeInfo);
      
      expect(result).toBeTruthy();
      expect(result.data).toEqual(testData);
      expect(result.stale).toBe(false);
      expect(result.swr).toBe(true);
      expect(revalidateFn).not.toHaveBeenCalled();
    });

    it('retourne les données stale et déclenche une revalidation en arrière-plan', async () => {
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { staleThresholdMs: 30000 }
      });
      
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const testData = { dailyMetrics: {}, activities: {} };
      
      // Mettre des données stale en cache (il y a plus de 30s)
      baseAdapter.set(rangeInfo, testData);
      const oldTimestamp = Date.now() - 40000; // 40 secondes
      baseAdapter.timestamps.set(baseAdapter.buildKey(rangeInfo), oldTimestamp);
      
      // Mock revalidateFn pour retourner de nouvelles données
      const newData = { dailyMetrics: { '2025-01-01': {} }, activities: {} };
      revalidateFn.mockResolvedValue({ data: newData, timestamp: Date.now() });
      
      const result = await swrAdapter.get(rangeInfo);
      
      // Vérifier que les données stale sont retournées immédiatement
      expect(result).toBeTruthy();
      expect(result.data).toEqual(testData);
      expect(result.stale).toBe(true);
      expect(result.swr).toBe(true);
      
      // Vérifier que la revalidation est déclenchée
      expect(revalidateFn).toHaveBeenCalledTimes(1);
      expect(revalidateFn).toHaveBeenCalledWith(rangeInfo, expect.any(Object));
    });

    it('évite les revalidations dupliquées pour la même clé', async () => {
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { staleThresholdMs: 30000, revalidateDebounceMs: 1000 }
      });
      
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const testData = { dailyMetrics: {}, activities: {} };
      
      // Mettre des données stale en cache
      baseAdapter.set(rangeInfo, testData);
      const oldTimestamp = Date.now() - 40000;
      baseAdapter.timestamps.set(baseAdapter.buildKey(rangeInfo), oldTimestamp);
      
      // Mock revalidateFn avec délai
      revalidateFn.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: testData, timestamp: Date.now() }), 100);
      }));
      
      // Appeler get() plusieurs fois rapidement
      const promise1 = swrAdapter.get(rangeInfo);
      const promise2 = swrAdapter.get(rangeInfo);
      const promise3 = swrAdapter.get(rangeInfo);
      
      await Promise.all([promise1, promise2, promise3]);
      
      // Vérifier qu'une seule revalidation a été déclenchée
      expect(revalidateFn).toHaveBeenCalledTimes(1);
    });

    it('respecte le debounce entre deux revalidations', async () => {
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { staleThresholdMs: 30000, revalidateDebounceMs: 2000 }
      });
      
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const testData = { dailyMetrics: {}, activities: {} };
      
      // Mettre des données stale en cache
      baseAdapter.set(rangeInfo, testData);
      const oldTimestamp = Date.now() - 40000;
      baseAdapter.timestamps.set(baseAdapter.buildKey(rangeInfo), oldTimestamp);
      
      revalidateFn.mockResolvedValue({ data: testData, timestamp: Date.now() });
      
      // Première revalidation
      await swrAdapter.get(rangeInfo);
      expect(revalidateFn).toHaveBeenCalledTimes(1);
      
      // Avancer le temps de moins que le debounce
      vi.advanceTimersByTime(1000);
      
      // Deuxième appel : devrait être debounced
      await swrAdapter.get(rangeInfo);
      expect(revalidateFn).toHaveBeenCalledTimes(1); // Toujours 1 car debounced
      
      // Avancer le temps au-delà du debounce
      vi.advanceTimersByTime(1500);
      
      // Troisième appel : devrait déclencher une nouvelle revalidation
      await swrAdapter.get(rangeInfo);
      expect(revalidateFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('set()', () => {
    it('met à jour le cache de base et nettoie le cache stale', async () => {
      swrAdapter = new SWRCacheAdapter({ baseAdapter, revalidateFn });
      
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const testData = { dailyMetrics: {}, activities: {} };
      
      // Mettre des données stale en cache
      baseAdapter.set(rangeInfo, testData);
      const oldTimestamp = Date.now() - 40000;
      baseAdapter.timestamps.set(baseAdapter.buildKey(rangeInfo), oldTimestamp);
      
      // Récupérer les données (va créer une entrée dans staleCache)
      await swrAdapter.get(rangeInfo);
      
      const key = swrAdapter.buildKey(rangeInfo, {});
      expect(swrAdapter.staleCache.has(key)).toBe(true);
      
      // Mettre à jour avec set()
      const newData = { dailyMetrics: { '2025-01-01': {} }, activities: {} };
      swrAdapter.set(rangeInfo, newData);
      
      // Vérifier que le cache de base est mis à jour
      const cached = baseAdapter.get(rangeInfo);
      expect(cached.data).toEqual(newData);
      
      // Vérifier que le cache stale est nettoyé
      expect(swrAdapter.staleCache.has(key)).toBe(false);
    });
  });

  describe('Revalidation automatique', () => {
    it('déclenche revalidation sur focus si revalidateOnFocus est activé', async () => {
      const mockWindow = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      global.window = mockWindow;
      
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { staleThresholdMs: 30000, revalidateOnFocus: true }
      });
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      
      // Mettre des données stale en cache d'abord
      const rangeInfo = { startDate: '2025-01-01', endDate: '2025-01-02' };
      const testData = { dailyMetrics: {}, activities: {} };
      baseAdapter.set(rangeInfo, testData);
      const oldTimestamp = Date.now() - 40000;
      baseAdapter.timestamps.set(baseAdapter.buildKey(rangeInfo), oldTimestamp);
      
      // Récupérer les données (va créer une entrée dans staleCache)
      await swrAdapter.get(rangeInfo);
      
      // Simuler le focus
      const focusHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'focus'
      )?.[1];
      
      if (focusHandler) {
        revalidateFn.mockResolvedValue({ data: testData, timestamp: Date.now() });
        await focusHandler();
        // revalidateAll() devrait appeler revalidate() pour chaque entrée stale
        expect(revalidateFn).toHaveBeenCalled();
      }
      
      delete global.window;
    });

    it('déclenche revalidation sur reconnexion réseau si revalidateOnReconnect est activé', async () => {
      const mockWindow = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      global.window = mockWindow;
      
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { revalidateOnReconnect: true }
      });
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      
      delete global.window;
    });
  });

  describe('cleanup()', () => {
    it('nettoie les listeners et timers', () => {
      const mockWindow = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      global.window = mockWindow;
      
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { revalidateOnFocus: true, revalidateOnReconnect: true }
      });
      
      swrAdapter.cleanup();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalled();
      expect(swrAdapter.staleCache.size).toBe(0);
      
      delete global.window;
    });
  });

  describe('isStale()', () => {
    it('détecte correctement les données stale', () => {
      swrAdapter = new SWRCacheAdapter({
        baseAdapter,
        revalidateFn,
        config: { staleThresholdMs: 30000 }
      });
      
      const freshData = { timestamp: Date.now() };
      expect(swrAdapter.isStale(freshData)).toBe(false);
      
      const staleData = { timestamp: Date.now() - 40000 };
      expect(swrAdapter.isStale(staleData)).toBe(true);
    });
  });
});

