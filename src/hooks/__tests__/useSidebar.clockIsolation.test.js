/**
 * P0.4 — L’horloge 1s ne doit plus vivre dans useSidebar.
 * Un tick ne doit pas provoquer de re-render du hook (donc de SidebarPremium).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebar } from '../useSidebar';

vi.mock('../../services/sidebar/sidebarStorage', () => ({
  getPreferences: vi.fn(async () => ({
    expandedSections: { actions: true, metrics: true }
  })),
  updateSectionState: vi.fn(async () => {}),
  getSectionState: vi.fn(async () => true)
}));

describe('useSidebar — isolation horloge (P0.4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-08T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ne tick plus chaque seconde (pas de currentTime / getFormattedTime)', async () => {
    const { result } = renderHook(() => useSidebar());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.currentTime).toBeUndefined();
    expect(result.current.getFormattedTime).toBeUndefined();
    expect(result.current.systemStatus).toBeDefined();
  });

  it('ne re-rend pas après 5 secondes d’horloge murale', async () => {
    const { result } = renderHook(() => useSidebar());
    await act(async () => {
      await Promise.resolve();
    });

    const snap = result.current;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(snap);
  });

  it('conserve la même référence systemStatus si nightMode est inchangé après 60s', async () => {
    const { result } = renderHook(() => useSidebar());
    await act(async () => {
      await Promise.resolve();
    });

    const statusBefore = result.current.systemStatus;

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.systemStatus).toBe(statusBefore);
  });
});
