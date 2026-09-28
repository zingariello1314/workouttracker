import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_BACKGROUND_ID,
  getBackgroundOption,
  isKnownBackgroundId,
} from '../backgroundRegistry';
import {
  getAppBackgroundId,
  getAppBackgroundPreference,
  resolveActiveBackgroundId,
  setAppBackgroundId,
  updateAppBackgroundPreference,
} from '../appBackgroundPreference';

describe('fond de l’application', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('utilise Momentum quand aucun choix n’est enregistré', () => {
    expect(getAppBackgroundId()).toBe(DEFAULT_BACKGROUND_ID);
    expect(getBackgroundOption(null).id).toBe('momentum');
    expect(getBackgroundOption(null).name).toBe('Momentum');
    expect(getBackgroundOption(null).type).toBe('animated');
  });

  it('revient au fond par défaut si l’identifiant stocké n’existe plus', () => {
    localStorage.setItem('momentum.appBackgroundId', 'aurora-retire');
    expect(isKnownBackgroundId('aurora-retire')).toBe(false);
    expect(getAppBackgroundId()).toBe(DEFAULT_BACKGROUND_ID);
    expect(getBackgroundOption('aurora-retire').id).toBe(DEFAULT_BACKGROUND_ID);
  });

  it('relit un ancien identifiant simple', () => {
    localStorage.setItem('momentum.appBackgroundId', 'momentum');
    expect(getAppBackgroundPreference().mode).toBe('single');
    expect(getAppBackgroundId()).toBe('momentum');
  });

  it('conserve un fond connu', () => {
    expect(setAppBackgroundId('momentum')).toBe('momentum');
    expect(getAppBackgroundPreference().singleId).toBe('momentum');
    expect(getAppBackgroundId()).toBe('momentum');
  });

  it('ignore un identifiant inconnu à l’écriture et garde le défaut', () => {
    setAppBackgroundId('inconnu');
    expect(getAppBackgroundId()).toBe(DEFAULT_BACKGROUND_ID);
    expect(getAppBackgroundPreference().singleId).toBe(DEFAULT_BACKGROUND_ID);
  });

  it('assigne un fond à un onglet et retombe sur le repli ailleurs', () => {
    updateAppBackgroundPreference({
      mode: 'perTab',
      singleId: 'momentum',
      perTab: { settings: 'particle-saturn' },
    });
    expect(resolveActiveBackgroundId('settings')).toBe('particle-saturn');
    expect(resolveActiveBackgroundId('today')).toBe('momentum');
    expect(resolveActiveBackgroundId('calendar')).toBe('momentum');
  });

  it('ignore une assignation dont le fond n’existe plus', () => {
    localStorage.setItem('momentum.appBackgroundId', JSON.stringify({
      mode: 'perTab',
      singleId: 'momentum',
      perTab: { finance: 'retire' },
    }));
    expect(resolveActiveBackgroundId('finance')).toBe('momentum');
  });
});
