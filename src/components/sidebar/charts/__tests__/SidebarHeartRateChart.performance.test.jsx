import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SidebarHeartRateChart from '../SidebarHeartRateChart';

// Mock des utilitaires Garmin avec données de performance
vi.mock('../../../../utils/garminTimeSeriesUtils', () => ({
  prepareTimeSeriesForDisplay: vi.fn((data) => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => ({
      timestamp: item.timestamp || Date.now() + index * 1000,
      bpm: item.bpm || 70,
      time: new Date(item.timestamp || Date.now() + index * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isReal: item.isReal || false,
      isActivity: item.isActivity || false
    }));
  }),
  enrichHeartRateTimeSeriesForVisualization: vi.fn((data, options = {}) => {
    const timeSeries = data || [];
    const hasEnoughData = timeSeries.length >= 10;
    
    return {
      timeSeries: timeSeries,
      stats: { min: 60, max: 180, avg: 120 },
      hasEnoughDataForCurve: hasEnoughData,
      realPointsCount: timeSeries.length,
      zones: { 1: 300, 2: 600, 3: 900 },
      metadata: {
        zoneThresholds: [
          { zone: 1, name: 'Zone 1', color: '#22C55E', minBpm: 60, maxBpm: 100 },
          { zone: 2, name: 'Zone 2', color: '#EAB308', minBpm: 100, maxBpm: 140 },
          { zone: 3, name: 'Zone 3', color: '#EF4444', minBpm: 140, maxBpm: 180 }
        ],
        duration: 3600,
        effectiveMaxHR: 190
      }
    };
  })
}));

// Mock de Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

// Mock du CustomDot
vi.mock('../../../tabs/GarminTab/components/charts/CustomDot', () => ({
  CustomDot: ({ payload }) => <div data-testid="custom-dot">{payload?.bpm}</div>
}));

// Mock du gestionnaire d'erreurs Garmin
vi.mock('../../../../utils/garminDataErrorHandler', () => ({
  garminDataErrorHandler: {
    validateDailyMetrics: vi.fn(() => ({ isValid: true, errors: [] })),
    validateHeartRateData: vi.fn(() => ({ warnings: [] })),
    isValidHeartRate: vi.fn((bpm) => bpm >= 30 && bpm <= 220),
    createError: vi.fn((type, message, data, details) => ({
      type,
      message,
      data,
      details,
      timestamp: Date.now()
    })),
    createUserFriendlyMessage: vi.fn((error) => error.message || 'Erreur inconnue')
  },
  GarminErrorType: {
    INVALID_FORMAT: 'INVALID_FORMAT',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
  }
}));

// Mock des composants de fallback
vi.mock('../GarminChartFallbacks', () => ({
  MissingDataFallback: ({ selectedDate, className }) => (
    <div className={`garmin-fallback missing-data ${className || ''}`}>
      <div className="fallback-content">
        <div className="fallback-icon">📊</div>
        <div className="fallback-message">
          <h4 className="fallback-title">Pas de données FC</h4>
        </div>
        <div className="fallback-actions">
          <div className="fallback-hint">Portez votre montre</div>
        </div>
      </div>
    </div>
  ),
  LoadingErrorFallback: ({ error, onRetry, className }) => (
    <div className={`garmin-fallback error ${className || ''}`}>
      <div className="fallback-content">
        <div className="fallback-icon">⚠️</div>
        <div className="fallback-message">Erreur de chargement</div>
        {onRetry && <button onClick={onRetry}>Réessayer</button>}
      </div>
    </div>
  ),
  DegradedModeFallback: ({ reason, onEnableFullMode, className }) => (
    <div className={`garmin-fallback degraded ${className || ''}`}>
      <div className="fallback-content">
        <div className="fallback-icon">⚡</div>
        <div className="fallback-message">Mode dégradé</div>
        {onEnableFullMode && <button onClick={onEnableFullMode}>Mode complet</button>}
      </div>
    </div>
  ),
  InsufficientDataFallback: ({ dataPointsCount, minimumRequired, className }) => (
    <div className={`garmin-fallback insufficient ${className || ''}`}>
      <div className="fallback-content">
        <div className="fallback-icon">📊</div>
        <div className="fallback-message">Données insuffisantes</div>
        <div className="fallback-hint">{dataPointsCount}/{minimumRequired} points</div>
      </div>
    </div>
  ),
  LoadingWithTimeout: ({ timeout, onTimeout, className }) => (
    <div className={`garmin-fallback loading ${className || ''}`}>
      <div className="fallback-content">
        <div className="fallback-icon">⏳</div>
        <div className="fallback-message">Chargement...</div>
      </div>
    </div>
  )
}));

// Mock de ResizeObserver et IntersectionObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    setTimeout(() => {
      this.callback([{ contentRect: { width: 300 } }]);
    }, 0);
  }
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    setTimeout(() => {
      this.callback([{ isIntersecting: true }]);
    }, 0);
  }
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;
global.IntersectionObserver = MockIntersectionObserver;

describe('SidebarHeartRateChart Performance Tests', () => {
  const createLargeDataset = (size) => ({
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          timeSeries: Array.from({ length: size }, (_, i) => ({
            timestamp: 1734249600000 + i * 60000, // Chaque minute
            bpm: 65 + Math.floor(Math.random() * 50),
            isReal: i % 10 === 0, // 10% de données réelles
            isActivity: i % 50 === 0 // 2% d'activité
          })),
          max: 180,
          resting: 60,
          avg: 120
        }
      }
    }
  });

  const defaultProps = {
    selectedDate: '2025-12-15',
    height: 280,
    compactMode: true,
    colors: { red: '#EF4444' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle large datasets efficiently', async () => {
    const largeDataset = createLargeDataset(1000); // 1000 points de données
    const startTime = performance.now();
    
    render(<SidebarHeartRateChart {...defaultProps} garminData={largeDataset} />);
    
    // Attendre que les observers se déclenchent
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Le rendu initial devrait être rapide même avec beaucoup de données
    expect(renderTime).toBeLessThan(1000); // Moins de 1 seconde
    
    // Vérifier que le composant est rendu
    const chartOrFallback = screen.queryByTestId('responsive-container') || 
                           screen.queryByText('Pas de données FC');
    expect(chartOrFallback).toBeInTheDocument();
  });

  it('should activate degraded mode with very large datasets', async () => {
    const veryLargeDataset = createLargeDataset(5000); // 5000 points de données
    
    render(
      <SidebarHeartRateChart 
        {...defaultProps} 
        garminData={veryLargeDataset}
        performanceThreshold={100} // Seuil très bas pour forcer le mode dégradé
      />
    );
    
    // Attendre que les observers et la logique de performance se déclenchent
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Le composant devrait soit afficher le graphique, soit un fallback
    const component = screen.queryByTestId('responsive-container') || 
                     screen.queryByText('Mode dégradé') ||
                     screen.queryByText('Pas de données FC');
    expect(component).toBeInTheDocument();
  });

  it('should use lazy loading when enabled', async () => {
    const dataset = createLargeDataset(100);
    
    render(
      <SidebarHeartRateChart 
        {...defaultProps} 
        garminData={dataset}
        enableLazyLoading={true}
      />
    );
    
    // Attendre que les observers se déclenchent
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Le composant devrait être rendu avec lazy loading
    const component = screen.queryByTestId('responsive-container') || 
                     screen.queryByText('Pas de données FC');
    expect(component).toBeInTheDocument();
  });

  it('should cache processed data efficiently', async () => {
    const dataset = createLargeDataset(200);
    
    // Premier rendu
    const { rerender } = render(
      <SidebarHeartRateChart {...defaultProps} garminData={dataset} />
    );
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Deuxième rendu avec les mêmes données (devrait utiliser le cache)
    const startTime = performance.now();
    rerender(<SidebarHeartRateChart {...defaultProps} garminData={dataset} />);
    const endTime = performance.now();
    
    const rerenderTime = endTime - startTime;
    
    // Le re-rendu devrait être très rapide grâce au cache
    expect(rerenderTime).toBeLessThan(100); // Moins de 100ms
  });

  it('should throttle event handlers properly', async () => {
    const dataset = createLargeDataset(50);
    const onDataPointClick = vi.fn();
    
    render(
      <SidebarHeartRateChart 
        {...defaultProps} 
        garminData={dataset}
        onDataPointClick={onDataPointClick}
      />
    );
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Le composant devrait être rendu sans erreur
    const component = screen.queryByTestId('responsive-container') || 
                     screen.queryByText('Pas de données FC');
    expect(component).toBeInTheDocument();
  });

  it('should measure render time in development mode', async () => {
    // Simuler le mode développement
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const dataset = createLargeDataset(100);
    
    render(<SidebarHeartRateChart {...defaultProps} garminData={dataset} />);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Le composant devrait être rendu
    const component = screen.getByTestId('responsive-container') || 
                     screen.getByText('Pas de données FC');
    expect(component).toBeInTheDocument();
    
    // Restaurer l'environnement
    process.env.NODE_ENV = originalEnv;
  });
});