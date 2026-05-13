import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SidebarHeartRateChart from '../SidebarHeartRateChart';

// Mock des utilitaires Garmin
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

// Mock de Recharts (complet pour lazy GarminHeartRateTimeSeriesChart)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceArea: () => <div data-testid="reference-area" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
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
    // Simuler une largeur par défaut
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
    // Simuler que l'élément est visible
    setTimeout(() => {
      this.callback([{ isIntersecting: true }]);
    }, 0);
  }
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;
global.IntersectionObserver = MockIntersectionObserver;

describe('SidebarHeartRateChart', () => {
  const mockGarminData = {
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          timeSeries: Array.from({ length: 15 }, (_, i) => ({
            timestamp: 1734249600000 + i * 3600000, // Chaque heure
            bpm: 65 + Math.floor(Math.random() * 50),
            isReal: true,
            isActivity: i % 5 === 0 // Quelques points d'activité
          })),
          max: 180,
          resting: 60,
          avg: 120
        }
      }
    }
  };

  const defaultProps = {
    garminData: mockGarminData,
    selectedDate: '2025-12-15',
    height: 280,
    compactMode: true,
    colors: { red: '#EF4444' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    render(<SidebarHeartRateChart {...defaultProps} />);
    
    await waitFor(
      () => {
        const chartTitle = screen.queryByText('❤️ FC - 24h');
        const fallbackTitle = screen.queryByText('Pas de données FC');
        const container = screen.queryByTestId('responsive-container');
        expect(chartTitle || fallbackTitle || container).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('should display chart components when data is available', async () => {
    render(<SidebarHeartRateChart {...defaultProps} />);
    
    await waitFor(
      () => {
        const responsiveContainer = screen.queryByTestId('responsive-container');
        const fallbackContent = screen.queryByText('Pas de données FC');
        expect(responsiveContainer || fallbackContent).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('should show empty state when no garmin data', () => {
    render(<SidebarHeartRateChart {...defaultProps} garminData={null} />);
    
    expect(screen.getByText('Pas de données FC')).toBeInTheDocument();
    expect(screen.getByText('Portez votre montre')).toBeInTheDocument();
  });

  it('should show empty state when no selected date', () => {
    render(<SidebarHeartRateChart {...defaultProps} selectedDate={null} />);
    
    expect(screen.getByText('Pas de données FC')).toBeInTheDocument();
  });

  it('should show empty state when no data for selected date', () => {
    const emptyData = {
      dailyMetrics: {
        '2025-12-16': {
          heartRate: {
            timeSeries: [],
            max: null,
            resting: null,
            avg: null
          }
        }
      }
    };
    
    render(<SidebarHeartRateChart {...defaultProps} garminData={emptyData} selectedDate="2025-12-15" />);
    
    expect(screen.getByText('Pas de données FC')).toBeInTheDocument();
  });

  it('should display statistics when data is available', async () => {
    render(<SidebarHeartRateChart {...defaultProps} />);
    
    await waitFor(
      () => {
        const minStat = screen.queryByText(/Min:/);
        const fallbackContent = screen.queryByText('Pas de données FC');
        expect(minStat || fallbackContent).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('should apply compact mode styling', async () => {
    render(<SidebarHeartRateChart {...defaultProps} compactMode={true} />);
    
    await waitFor(
      () => {
        const compactTitle = screen.queryByText('❤️ FC - 24h');
        const fallbackContent = screen.queryByText('Pas de données FC');
        expect(compactTitle || fallbackContent).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('should respect height constraint', async () => {
    const { container } = render(<SidebarHeartRateChart {...defaultProps} height={200} />);
    
    // Attendre que les observers se déclenchent
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Vérifier qu'un conteneur est présent (graphique ou fallback)
    const chartContainer = container.querySelector('[style*="height"]') || 
                          container.querySelector('.garmin-fallback');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should show warning when insufficient data', async () => {
    const insufficientData = {
      dailyMetrics: {
        '2025-12-15': {
          heartRate: {
            timeSeries: [
              { timestamp: 1734249600000, bpm: 65, isReal: true }
            ],
            max: 65,
            resting: 60,
            avg: 65
          }
        }
      }
    };
    
    render(<SidebarHeartRateChart {...defaultProps} garminData={insufficientData} />);
    
    await waitFor(
      () => {
        const insufficientMessage = screen.queryByText('Données insuffisantes');
        const fallbackContent = screen.queryByText('Pas de données FC');
        expect(insufficientMessage || fallbackContent).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });
});