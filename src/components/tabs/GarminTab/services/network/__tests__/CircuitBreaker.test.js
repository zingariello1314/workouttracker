import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  it('ouvre le circuit après trop d’échecs puis se referme après cooldown', () => {
    vi.useFakeTimers();

    const breaker = new CircuitBreaker({ maxFailures: 2, cooldownMs: 1000 });

    expect(breaker.canAttempt()).toBe(true);

    breaker.recordFailure();
    expect(breaker.getState()).toBe('closed');

    breaker.recordFailure();
    expect(breaker.getState()).toBe('open');
    expect(breaker.canAttempt()).toBe(false);
    expect(breaker.getCooldownRemaining()).toBe(1000);

    vi.advanceTimersByTime(1000);
    expect(breaker.canAttempt()).toBe(true);
    breaker.recordSuccess();
    expect(breaker.getState()).toBe('closed');
    expect(breaker.getCooldownRemaining()).toBe(0);

    vi.useRealTimers();
  });
});
