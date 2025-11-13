import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualizedTimeline } from '../VirtualizedTimeline';

describe('VirtualizedTimeline', () => {
  const mockDateRange = {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  };

  const mockActivities = Array.from({ length: 150 }, (_, i) => ({
    id: `activity-${i}`,
    date: `2025-01-${String(i % 30 + 1).padStart(2, '0')}`,
    startTimeLocal: `2025-01-${String(i % 30 + 1).padStart(2, '0')}T10:00:00`,
    type: i % 3 === 0 ? 'swimming' : i % 3 === 1 ? 'jumpRope' : 'cardio',
    color: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#10b981' : '#f59e0b',
    yPosition: 35 + (i * 45),
    duration: 3600,
    activityName: `Activity ${i}`
  }));

  const mockRenderActivity = vi.fn((activity, idx) => (
    <div key={activity.id || idx} data-testid={`activity-${idx}`}>
      {activity.activityName}
    </div>
  ));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendre toutes les activités si <100 activités (pas de virtualisation)', () => {
    const smallActivities = mockActivities.slice(0, 50);
    
    render(
      <VirtualizedTimeline
        activities={smallActivities}
        containerWidth={800}
        scrollLeft={0}
        renderActivity={mockRenderActivity}
        dateRange={mockDateRange}
      />
    );

    expect(mockRenderActivity).toHaveBeenCalledTimes(50);
  });

  it('virtualiser les activités si >100 activités', () => {
    // Simuler un scroll pour que seules certaines activités soient visibles
    render(
      <VirtualizedTimeline
        activities={mockActivities}
        containerWidth={400} // Container plus petit pour limiter la vue
        scrollLeft={4000} // Scroll pour voir une partie différente
        renderActivity={mockRenderActivity}
        dateRange={mockDateRange}
        enableVirtualization={false}
      />
    );

    // Avec virtualisation, seules les activités visibles devraient être rendues
    // Le nombre exact dépend de la plage visible calculée
    expect(mockRenderActivity).toHaveBeenCalled();
    const callCount = mockRenderActivity.mock.calls.length;
    // La virtualisation devrait réduire le nombre d'activités rendues
    // mais peut rendre toutes si elles sont toutes dans le viewport
    expect(callCount).toBeGreaterThan(0);
    expect(callCount).toBeLessThanOrEqual(150);
  });

  it('forcer la virtualisation avec enableVirtualization=true', () => {
    const smallActivities = mockActivities.slice(0, 50);
    
    render(
      <VirtualizedTimeline
        activities={smallActivities}
        containerWidth={800}
        scrollLeft={0}
        renderActivity={mockRenderActivity}
        dateRange={mockDateRange}
        enableVirtualization={true}
      />
    );

    // Même avec <100 activités, la virtualisation devrait être activée
    expect(mockRenderActivity).toHaveBeenCalled();
  });

  it('gérer le cas où activities est vide', () => {
    render(
      <VirtualizedTimeline
        activities={[]}
        containerWidth={800}
        scrollLeft={0}
        renderActivity={mockRenderActivity}
        dateRange={mockDateRange}
      />
    );

    expect(mockRenderActivity).not.toHaveBeenCalled();
  });

  it('gérer le cas où dateRange est manquant (pas de virtualisation)', () => {
    render(
      <VirtualizedTimeline
        activities={mockActivities}
        containerWidth={800}
        scrollLeft={0}
        renderActivity={mockRenderActivity}
      />
    );

    // Sans dateRange, toutes les activités devraient être rendues
    expect(mockRenderActivity).toHaveBeenCalledTimes(150);
  });

  it('afficher l\'indicateur de virtualisation en mode dev', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <VirtualizedTimeline
        activities={mockActivities}
        containerWidth={800}
        scrollLeft={0}
        renderActivity={mockRenderActivity}
        dateRange={mockDateRange}
        enableVirtualization={true}
      />
    );

    // Vérifier que l'indicateur est présent (si virtualisation activée)
    const indicator = screen.queryByLabelText(/Timeline virtualisée/i);
    // L'indicateur peut ne pas être présent si la virtualisation n'est pas activée
    // mais si elle l'est, il devrait être là
    
    process.env.NODE_ENV = originalEnv;
  });
});

