/**
 * P0.4 — Preuve : le tick d’horloge n’entraîne plus de re-render de ModuleRenderer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

const moduleRendererRenderCount = { n: 0 };

vi.mock('../../../hooks/useSidebar', () => ({
  useSidebar: () => ({
    systemStatus: {
      nightMode: false,
      connected: true,
      focusPercentage: 50
    },
    isMobileOpen: false,
    toggleSection: vi.fn(),
    isSectionExpanded: vi.fn(() => true),
    toggleMobileSidebar: vi.fn(),
    closeMobileSidebar: vi.fn()
  })
}));

vi.mock('../../../hooks/useSidebarData', () => ({
  useSidebarData: () => ({
    metrics: {},
    quests: [],
    sport: {},
    finance: {},
    nutrition: {},
    learning: {},
    shopping: {},
    today: {},
    todayDate: '2025-12-08',
    isLoading: false
  })
}));

vi.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() })
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { username: 'test' } })
}));

vi.mock('../ProfileCard3D', () => ({
  default: () => <div data-testid="profile-card" />
}));

vi.mock('../GradeArtCardOffer', () => ({
  default: () => <div data-testid="grade-offer" />
}));

vi.mock('../SpotifySidebarCard', () => ({
  default: () => <div data-testid="spotify" />
}));

vi.mock('../ModuleRenderer', () => ({
  default: function MockModuleRenderer() {
    moduleRendererRenderCount.n += 1;
    return <div data-testid="module-renderer" data-renders={moduleRendererRenderCount.n} />;
  }
}));

vi.mock('../../../utils/performanceMonitor', () => ({
  measureSync: (_n, fn) => fn(),
  SIDEBAR_OPERATIONS: { SIDEBAR_REFRESH: 'sidebar-refresh' }
}));

vi.mock('../../../dev/todayDiagnostics/diagIsolation', () => ({
  isDiagFlag: () => false
}));

import SidebarPremium from '../SidebarPremium';

describe('SidebarPremium — clock isolation (P0.4)', () => {
  beforeEach(() => {
    moduleRendererRenderCount.n = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-08T14:30:00'));
    global.requestAnimationFrame = vi.fn((cb) => {
      cb();
      return 1;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ModuleRenderer ne se re-rend pas pendant 5 ticks d’horloge', () => {
    render(<SidebarPremium />);
    const afterMount = moduleRendererRenderCount.n;
    expect(afterMount).toBeGreaterThanOrEqual(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(moduleRendererRenderCount.n).toBe(afterMount);
  });

  it('marque la sidebar comme horloge isolée', () => {
    const { container } = render(<SidebarPremium />);
    expect(container.querySelector('[data-sidebar-clock-isolated="1"]')).toBeTruthy();
  });
});
