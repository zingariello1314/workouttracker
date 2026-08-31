import { afterEach, describe, expect, it } from 'vitest';
import {
  getCoreSportTabsPreloadProgress,
  preloadCoreSportTabs,
  resetCoreSportTabsPreloadForTests,
  subscribeCoreSportTabsPreload
} from '../preloadTabs';

afterEach(() => {
  resetCoreSportTabsPreloadForTests();
});

describe('preloadCoreSportTabs', () => {
  it('reporte la progression puis ready quand les 3 chunks sont là', async () => {
    const seen = [];
    const unsub = subscribeCoreSportTabsPreload((progress) => {
      seen.push(progress.done);
    });

    let resolveToday;
    const todayPromise = new Promise((resolve) => {
      resolveToday = resolve;
    });
    const loaders = {
      recap: () => Promise.resolve({ default: {} }),
      today: () => todayPromise,
      calendar: () => Promise.resolve({ default: {} })
    };

    const done = preloadCoreSportTabs(loaders);
    expect(getCoreSportTabsPreloadProgress().ready).toBe(false);

    resolveToday({ default: {} });
    await done;

    expect(getCoreSportTabsPreloadProgress()).toMatchObject({
      done: 3,
      total: 3,
      ready: true,
      failed: false
    });
    expect(seen.at(-1)).toBe(3);
    unsub();
  });

  it('ne bloque pas ready si un chunk échoue', async () => {
    await preloadCoreSportTabs({
      recap: () => Promise.reject(new Error('network')),
      today: () => Promise.resolve({ default: {} }),
      calendar: () => Promise.resolve({ default: {} })
    });

    expect(getCoreSportTabsPreloadProgress()).toMatchObject({
      done: 3,
      ready: true,
      failed: true
    });
  });
});
