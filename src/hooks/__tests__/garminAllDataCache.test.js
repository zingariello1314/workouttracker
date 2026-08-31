import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { invalidateGarminAllDataCache, loadAllData, peekGarminAllDataCache } from '../garminDataLoad';
import { dispatchGarminDataUpdated } from '../../utils/garminDataEvents';
import { setUseFallback } from '../garminDataUtils';

describe('loadAllData session cache', () => {
  beforeEach(() => {
    invalidateGarminAllDataCache();
    setUseFallback(true);
  });

  afterEach(() => {
    invalidateGarminAllDataCache();
  });

  it('renvoie le même snapshot mémoire au second appel', async () => {
    const first = await loadAllData(true);
    const second = await loadAllData(true);
    expect(second).toBe(first);
    expect(peekGarminAllDataCache()).toBe(first);
  });

  it('invalide le cache après une écriture Garmin', async () => {
    const first = await loadAllData(true);
    dispatchGarminDataUpdated({ source: 'test' });
    const second = await loadAllData(true);
    expect(second).not.toBe(first);
    expect(second).toEqual(first);
  });
});
