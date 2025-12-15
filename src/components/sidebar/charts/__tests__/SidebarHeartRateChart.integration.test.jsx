import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SidebarHeartRateChart from '../SidebarHeartRateChart';

// Mock des dépendances externes
vi.mock('../../../../utils/garminTimeSeriesUtils', () => ({
  prepareTimeSeriesForDisplay: vi.fn((data) => {
    // Simuler la décompression des données
    if (!data || data.length === 0) return [];
    
    return data.map((point, index) => ({
      timestamp: point.timestamp || Date.now() + index * 60000,
      bpm: point.bpm || 70 + Math.random() * 50,
      isReal: point.isReal !== false
    }));
  }),
  enrichHeartRateTimeSeriesForVisualization: vi.fn((data, options) => {
    if (!data || data.length === 0) {
      return {
        timeSeries: [],
        stats: null,
        hasEnoughDataForCurve: false,
        realPointsCount: 0,
        zones: {},
        metadata: { zoneThresholds: [], duration: 0 }
      };
    }

    const bpmValues = data.map(d => d.bpm).filter(b => b > 0);
    const stats = {
      min: Math.min(...bpmValues),
      max: Math.max(...bpmValues),
      avg: Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length)
    };

    return {
      timeSeries: data,
      stats,
      hasEnoughDataForCurve: data.length >= 10,
      realPointsCount: data.filter(d => d.isReal).length,
      zones: {
        1: 300, // Zone 1: 5 minutes
        2: 1200, // Zone 2: 20 minutes
        3: 600,  // Zone 3: 10 minutes
        4: 300,  // Zone 4: 5 minutes
        5: 0     // Zone 5: 0 minutes
      },
      metadata: {
        zoneThresholds: [
          { zone: 1, name: 'Zone 1 - Récupération', color: '#3B82F6', minBpm: 95, maxBpm: 114 },
          { zone: 2, name: 'Zone 2 - Aérobie', color: '#10B981', minBpm: 114, maxBpm: 133 },
          { zone: 3, name: 'Zone 3 - Tempo', color: '#F59E0B', minBpm: 133, maxBpm: 152 },
          { zone: 4, name: 'Zone 4 - Seuil', color: '#F97316', minBpm: 152, maxBpm: 171 },
          { zone: 5, name: 'Zone 5 - VO2Max', color: '#EF4444', minBpm: 171, maxBpm: 190 }
        ],
        duration: 2400, // 40 minutes total
        effectiveMaxHR: 190
      }
    };
  })
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children, data }) => (
    <div data-testid="area-chart" data-points={data?.length || 0}>
      {children}
    </div>
  ),
  Area: ({ dataKey }) => <div data-testid="area" data-key={dataKey} />,
  XAxis: ({ dataKey }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ domain }) => <div data-testid="y-axis" data-domain={JSON.stringify(domain)} />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

vi.mock('../../../tabs/GarminTab/components/charts/CustomDot', () => ({
  CustomDot: ({ payload, fill, r }) => (
    <div data-testid="custom-dot" data-bpm={payload?.bpm} data-fill={fill} data-r={r} />
  )
}));

describe('SidebarHeartRateChart Integration Tests', () => {
  const createMockGarminData = (timeSeriesData = []) => ({
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          timeSeries: timeSeriesData,
          max: 180,
          resting: 60,
          avg: 120
        }
      }
    }
  });

  const createTimeSeriesData = (count = 50) => {
    const baseTime = new Date('2025-12-15T08:00:00').getTime();
    return Array.from({ length: count }, (_, i) => ({
      timestamp: baseTime + i * 15 * 60 * 1000, // Points toutes les 15 minutes
      bpm: 60 + Math.sin(i / 10) * 30 + Math.random() * 20, // Variation réaliste
      isReal: i % 3 === 0 // Un point sur trois est "réel"
    }));
  };

  it('should handle realistic Garmin data flow', () => {
    const timeSeriesData = createTimeSeriesData(48); // Données sur 12 heures
    const garminData = createMockGarminData(timeSeriesData);
    
    render(
      <SidebarHeartRateChart
        garminData={garminData}
        selectedDate="2025-12-15"
        height={280}
        compactMode={true}
        colors={{ red: '#EF4444' }}
      />
    );

    // Vérifier que le composant s'affiche correctement
    expect(screen.getByText('❤️ FC - 24h')).toBeInTheDocument();
    
    // Vérifier que les statistiques sont affichées
    expect(screen.getByText(/Min:/)).toBeInTheDocument();
    expect(screen.getByText(/Max:/)).toBeInTheDocument();
    expect(screen.getByText(/Moy:/)).toBeInTheDocument();
    
    // Vérifier que le graphique est rendu
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
  });

  it('should display zones legend when zone data is available', () => {
    const timeSeriesData = createTimeSeriesData(30);
    const garminData = createMockGarminData(timeSeriesData);
    
    render(
      <SidebarHeartRateChart
        garminData={garminData}
        selectedDate="2025-12-15"
        compactMode={true}
      />
    );

    // Vérifier que la légende des zones est affichée
    expect(screen.getByText('Zones FC')).toBeInTheDocument();
  });

  it('should handle sparse data correctly', () => {
    const sparseData = [
      { timestamp: new Date('2025-12-15T08:00:00').getTime(), bpm: 65, isReal: true },
      { timestamp: new Date('2025-12-15T12:00:00').getTime(), bpm: 120, isReal: true },
      { timestamp: new Date('2025-12-15T18:00:00').getTime(), bpm: 85, isReal: true }
    ];
    const garminData = createMockGarminData(sparseData);
    
    render(
      <SidebarHeartRateChart
        garminData={garminData}
        selectedDate="2025-12-15"
        compactMode={true}
      />
    );

    // Avec peu de données, le composant devrait quand même s'afficher
    expect(screen.getByText('❤️ FC - 24h')).toBeInTheDocument();
    expect(screen.getByText('3 points')).toBeInTheDocument();
    
    // Vérifier l'indicateur de données insuffisantes
    expect(screen.getByTitle('Données insuffisantes')).toBeInTheDocument();
  });

  it('should adapt to different height constraints', () => {
    const timeSeriesData = createTimeSeriesData(20);
    const garminData = createMockGarminData(timeSeriesData);
    
    const { rerender } = render(
      <SidebarHeartRateChart
        garminData={garminData}
        selectedDate="2025-12-15"
        height={200}
        compactMode={true}
      />
    );

    // Vérifier que le composant respecte la contrainte de hauteur
    let chartContainer = screen.getByTestId('responsive-container').parentElement;
    expect(chartContainer).toHaveStyle({ height: '200px' });

    // Tester avec une hauteur plus grande que la limite
    rerender(
      <SidebarHeartRateChart
        garminData={garminData}
        selectedDate="2025-12-15"
        height={400}
        compactMode={true}
      />
    );

    // Devrait être limitée à 300px maximum
    chartContainer = screen.getByTestId('responsive-container').parentElement;
    expect(chartContainer).toHaveStyle({ height: '300px' });
  });

  it('should work with real-world data patterns', () => {
    // Simuler des données réelles avec des patterns typiques
    const realWorldData = [
      // Sommeil (FC basse)
      ...Array.from({ length: 8 }, (_, i) => ({
        timestamp: new Date('2025-12-15T00:00:00').getTime() + i * 60 * 60 * 1000,
        bpm: 45 + Math.random() * 10,
        isReal: true
      })),
      // Réveil et activité matinale
      ...Array.from({ length: 4 }, (_, i) => ({
        timestamp: new Date('2025-12-15T08:00:00').getTime() + i * 30 * 60 * 1000,
        bpm: 70 + i * 15 + Math.random() * 10,
        isReal: true
      })),
      // Activité sportive
      ...Array.from({ length: 6 }, (_, i) => ({
        timestamp: new Date('2025-12-15T10:00:00').getTime() + i * 10 * 60 * 1000,
        bpm: 140 + Math.sin(i) * 20 + Math.random() * 15,
        isReal: true,
        isActivity: i > 1 && i < 5
      })),
      // Récupération et fin de journée
      ...Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date('2025-12-15T14:00:00').getTime() + i * 60 * 60 * 1000,
        bpm: 80 - i * 2 + Math.random() * 10,
        isReal: true
      }))
    ];

    const garminData = createMockGarminData(realWorldData);
    
    render(
      <SidebarHeartRateChart
        garminData={garminData}
        selectedDate="2025-12-15"
        compactMode={true}
      />
    );

    // Vérifier que le composant gère bien les données complexes
    expect(screen.getByText('❤️ FC - 24h')).toBeInTheDocument();
    expect(screen.getByText(`${realWorldData.length} points`)).toBeInTheDocument();
    
    // Vérifier que les statistiques reflètent les données
    expect(screen.getByText(/Min:/)).toBeInTheDocument();
    expect(screen.getByText(/Max:/)).toBeInTheDocument();
    expect(screen.getByText(/Moy:/)).toBeInTheDocument();
  });
});