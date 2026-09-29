import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_BACKGROUND_ID,
  getBackgroundOption,
  isKnownBackgroundId,
  listBackgroundOptions,
} from '../backgroundRegistry';
import { defaultParams, normalizeParams, studioFor } from '../backgroundStudio';
import { createVariant } from '../backgroundVariants';
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
    expect(isKnownBackgroundId('accretion-disc-03')).toBe(true);
    expect(getBackgroundOption('accretion-disc-03').name).toBe("Disque d'accrétion");
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

  it('ajoute un fond distinct sans remplacer l’original', () => {
    const created = createVariant({
      name: 'Disque perso',
      baseId: 'accretion-disc-03',
      params: { density: 40, baseColor: '#1900ff' },
    });
    expect(created.id.startsWith('variant-')).toBe(true);
    expect(setAppBackgroundId(created.id)).toBe(created.id);
    expect(getBackgroundOption('accretion-disc-03').id).toBe('accretion-disc-03');
    expect(getBackgroundOption('accretion-disc-03').variant).toBeUndefined();
    expect(getBackgroundOption(created.id).name).toBe('Disque perso');
    expect(getBackgroundOption(created.id).params.density).toBe(40);
    expect(listBackgroundOptions().some((item) => item.id === 'momentum')).toBe(true);
    expect(studioFor('momentum')).toBeNull();
    expect(studioFor('accretion-disc-03')).toBeTruthy();
    expect(studioFor('particle-saturn')).toBeTruthy();
    expect(isKnownBackgroundId('chain-vortex')).toBe(true);
    expect(isKnownBackgroundId('chrome-cells')).toBe(true);
    expect(isKnownBackgroundId('cosmic-bg')).toBe(true);
    expect(isKnownBackgroundId('grass-field')).toBe(true);
    expect(studioFor('chain-vortex')?.title).toBe('Vortex de chaînes');
    expect(getBackgroundOption('grass-field').name).toBe("Champ d'herbe");
    expect(isKnownBackgroundId('tornado')).toBe(true);
    expect(getBackgroundOption('tornado').name).toBe('Tornade');
    expect(studioFor('tornado')?.title).toBe('Tornade');
    expect(defaultParams('tornado').repel).toBe(true);
    expect(defaultParams('tornado').topRadius).toBe(900);
    expect(defaultParams('tornado').direction).toBe('up');
    expect(defaultParams('grass-field').repel).toBe(true);
    expect(defaultParams('grass-field').distance).toBe(160);
    expect(normalizeParams('grass-field', {}).distance).toBe(160);
    expect(normalizeParams('grass-field', { distance: 100 }).distance).toBe(100);
    expect(normalizeParams('grass-field', { hover: 200 }).repel).toBe(true);
    expect(normalizeParams('grass-field', { repel: false }).repel).toBe(false);
    expect(defaultParams('chrome-cells').cursor).toBe(true);
    expect(normalizeParams('chrome-cells', { cursor: false }).cursor).toBe(false);
    expect(normalizeParams('tornado', { direction: 'sideways' }).direction).toBe('up');
  });
});
