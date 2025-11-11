/**
 * Bench résilience réseau (tryFetch) – simule des erreurs puis un succès.
 */

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { origin: 'http://localhost:3031' }
  };
}

if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = { now: () => Date.now() };
}

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = async (...args) => {
    throw new Error('Global fetch not available.');
  };
}

import { tryFetch } from '../../src/components/tabs/GarminTab/hooks/garminSyncFetch.js';

const createMockFetch = ({ failTimes, responseDelay = 50 }) => {
  let callCount = 0;
  return async (url, options = {}) => {
    callCount += 1;

    if (callCount <= failTimes) {
      return Promise.reject(new TypeError('Simulated network failure'));
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            ok: true,
            url,
            method: options.method || 'GET',
            attempt: callCount
          })
        });
      }, responseDelay);
    });
  };
};

const runScenario = async ({ failTimes, responseDelay }) => {
  const start = performance.now();
  globalThis.fetch = createMockFetch({ failTimes, responseDelay });

  try {
    const result = await tryFetch('/api/garmin/sync', { method: 'POST' }, failTimes + 1);
    const duration = performance.now() - start;
    return {
      failTimes,
      success: true,
      attempts: failTimes + 1,
      durationMs: Number(duration.toFixed(2)),
      payload: result
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      failTimes,
      success: false,
      attempts: failTimes + 1,
      durationMs: Number(duration.toFixed(2)),
      error: error.message
    };
  }
};

const SCENARIOS = [
  { failTimes: 0, responseDelay: 20 },
  { failTimes: 2, responseDelay: 50 },
  { failTimes: 3, responseDelay: 100 }
];

const main = async () => {
  const results = [];
  for (const scenario of SCENARIOS) {
    const outcome = await runScenario(scenario);
    results.push(outcome);
  }
  console.table(results.map(({ failTimes, success, durationMs, attempts }) => ({ failTimes, success, durationMs, attempts })));
};

main().catch((error) => {
  console.error('[bench] networkResilience failure:', error);
  process.exitCode = 1;
});
