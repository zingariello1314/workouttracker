import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import SidebarClock, { sidebarClockFormatters } from '../SidebarClock';

describe('SidebarClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-08T14:30:05'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche HH:MM:SS et met à jour chaque seconde sans dépendre de useSidebar', () => {
    render(<SidebarClock />);
    expect(screen.getAllByText('14:30:05').length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getAllByText('14:30:06').length).toBeGreaterThan(0);
  });

  it('parité des formateurs (affichage uniquement)', () => {
    const d = new Date('2025-12-08T09:05:07');
    expect(sidebarClockFormatters.formatTime(d)).toBe('09:05:07');
    expect(sidebarClockFormatters.formatYear(d)).toBe('2025');
    expect(sidebarClockFormatters.formatDayMonth(d).toLowerCase()).toContain('décembre');
  });
});
