import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SidebarHeartRateChart from '../SidebarHeartRateChart';

// Mock des utilitaires Garmin
vi.mock('../../../../utils/garminTimeSeriesUtils', () => ({
  prepareTimeSeriesForDisplay: vi.fn((data) => data || []),
  enrichHeartRateTimeSeriesForVisualization: vi.fn((data) => ({
    timeSeries: data || [],
    stats: { min: 60, max: 180, avg: 120 },
    hasEnoughDataForCurve: true,
    realPointsCount: data?.length || 0,
    zones: {},
    metadata: {
      zoneThresholds: [],
      duration: 3600
    }
  }))
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

// Mock de ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

describe('SidebarHeartRateChart', () => {
  const mockGarminData = {
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          timeSeries: [
            { timestamp: 1734249600000, bpm: 65, isReal: true },
            { timestamp: 1734253200000, bpm: 120, isReal: true },
            { timestamp: 1734256800000, bpm: 85, isReal: true }
          ],
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

  it('should render without crashing', () => {
    render(<SidebarHeartRateChart {...defaultProps} />);
    expect(screen.getByText('❤️ FC - 24h')).toBeInTheDocument();
  });

  it('should display chart components when data is available', () => {
    render(<SidebarHeartRateChart {...defaultProps} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('should show empty state when no garmin data', () => {
    render(<SidebarHeartRateChart {...defaultProps} garminData={null} />);
    
    expect(screen.getByText('Aucune donnée FC disponible')).toBeInTheDocument();
    expect(screen.getByText('Synchronisez vos données Garmin')).toBeInTheDocument();
  });

  it('should show empty state when no selected date', () => {
    render(<SidebarHeartRateChart {...defaultProps} selectedDate={null} />);
    
    expect(screen.getByText('Aucune donnée FC disponible')).toBeInTheDocument();
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
    
    expect(screen.getByText('Aucune donnée FC pour 2025-12-15')).toBeInTheDocument();
  });

  it('should display statistics when data is available', () => {
    render(<SidebarHeartRateChart {...defaultProps} />);
    
    expect(screen.getByText(/Min:/)).toBeInTheDocument();
    expect(screen.getByText(/Max:/)).toBeInTheDocument();
    expect(screen.getByText(/Moy:/)).toBeInTheDocument();
  });

  it('should apply compact mode styling', () => {
    render(<SidebarHeartRateChart {...defaultProps} compactMode={true} />);
    
    // Vérifier que le titre est en mode compact
    expect(screen.getByText('❤️ FC - 24h')).toBeInTheDocument();
  });

  it('should respect height constraint', () => {
    const { container } = render(<SidebarHeartRateChart {...defaultProps} height={200} />);
    
    const chartContainer = container.querySelector('[style*="height"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should show warning when insufficient data', () => {
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
    
    expect(screen.getByTitle('Données insuffisantes')).toBeInTheDocument();
  });
});