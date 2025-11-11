export class CircuitBreaker {
  constructor({ maxFailures = 3, cooldownMs = 30000 } = {}) {
    this.maxFailures = maxFailures;
    this.cooldownMs = cooldownMs;
    this.failureCount = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  canAttempt() {
    if (this.state === 'closed') {
      return true;
    }

    const now = Date.now();
    if (this.openedAt && now - this.openedAt >= this.cooldownMs) {
      this.state = 'half-open';
      return true;
    }

    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  recordFailure() {
    this.failureCount += 1;

    if (this.failureCount >= this.maxFailures) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  getState() {
    return this.state;
  }

  getFailureCount() {
    return this.failureCount;
  }

  getCooldownRemaining() {
    if (this.state !== 'open' || !this.openedAt) {
      return 0;
    }
    const elapsed = Date.now() - this.openedAt;
    return Math.max(0, this.cooldownMs - elapsed);
  }

  reset() {
    this.failureCount = 0;
    this.state = 'closed';
    this.openedAt = null;
  }
}
