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
    expect(isKnownBackgroundId('lattice-flight')).toBe(true);
    expect(getBackgroundOption('lattice-flight').name).toBe('Vol de lattice');
    expect(studioFor('lattice-flight')?.title).toBe('Vol de lattice');
    expect(defaultParams('lattice-flight').cursor).toBe(true);
    expect(defaultParams('lattice-flight').density).toBe(307);
    expect(normalizeParams('lattice-flight', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('light-cables')).toBe(true);
    expect(getBackgroundOption('light-cables').name).toBe('Câbles lumineux');
    expect(studioFor('light-cables')?.title).toBe('Câbles lumineux');
    expect(defaultParams('light-cables').cursor).toBe(true);
    expect(defaultParams('light-cables').accentColor).toBe('#ffb000');
    expect(defaultParams('light-cables').count).toBe(48);
    expect(defaultParams('light-cables').flow).toBe(300);
    expect(normalizeParams('light-cables', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('liquid-vortex')).toBe(true);
    expect(getBackgroundOption('liquid-vortex').name).toBe('Vortex liquide');
    expect(studioFor('liquid-vortex')?.title).toBe('Vortex liquide');
    expect(defaultParams('liquid-vortex').cursor).toBe(true);
    expect(defaultParams('liquid-vortex').smoke).toBe('#fff700');
    expect(defaultParams('liquid-vortex').swirl).toBe(10);
    expect(normalizeParams('liquid-vortex', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('mood-field')).toBe(true);
    expect(getBackgroundOption('mood-field').name).toBe("Champ d'humeur");
    expect(studioFor('mood-field')?.title).toBe("Champ d'humeur");
    expect(defaultParams('mood-field').cursor).toBe(true);
    expect(defaultParams('mood-field').intenseColor).toBe('#ff00b3');
    expect(defaultParams('mood-field').mood).toBe('intense');
    expect(defaultParams('mood-field').swirl).toBe(80);
    expect(normalizeParams('mood-field', { mood: 'calm' }).mood).toBe('calm');
    expect(isKnownBackgroundId('rain-puddle')).toBe(true);
    expect(getBackgroundOption('rain-puddle').name).toBe('Flaques de pluie');
    expect(studioFor('rain-puddle')?.title).toBe('Flaques de pluie');
    expect(defaultParams('rain-puddle').cursor).toBe(true);
    expect(defaultParams('rain-puddle').baseColor).toBe('#03661a');
    expect(defaultParams('rain-puddle').coverage).toBe(62);
    expect(defaultParams('rain-puddle').cursorRipple).toBe(100);
    expect(normalizeParams('rain-puddle', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('snowfall')).toBe(true);
    expect(getBackgroundOption('snowfall').name).toBe('Chute de neige');
    expect(studioFor('snowfall')?.title).toBe('Chute de neige');
    expect(defaultParams('snowfall').cursor).toBe(true);
    expect(defaultParams('snowfall').count).toBe(632);
    expect(defaultParams('snowfall').wind).toBe(-1);
    expect(defaultParams('snowfall').sizeMin).toBe(0.5);
    expect(normalizeParams('snowfall', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('toon-fireball')).toBe(true);
    expect(getBackgroundOption('toon-fireball').name).toBe('Boule de feu toon');
    expect(studioFor('toon-fireball')?.title).toBe('Boule de feu toon');
    expect(defaultParams('toon-fireball').density).toBe(18);
    expect(defaultParams('toon-fireball').size).toBe(182);
    expect(defaultParams('toon-fireball').fireCore).toBe('#ff0000');
    expect(defaultParams('toon-fireball').bloomStrength).toBe(172);
    expect(defaultParams('toon-fireball').cursor).toBeUndefined();
    expect(isKnownBackgroundId('wire-terrain')).toBe(true);
    expect(getBackgroundOption('wire-terrain').name).toBe('Terrain filaire');
    expect(studioFor('wire-terrain')?.title).toBe('Terrain filaire');
    expect(defaultParams('wire-terrain').cursor).toBe(true);
    expect(defaultParams('wire-terrain').density).toBe(120);
    expect(defaultParams('wire-terrain').lineColor).toBe('#b12b00');
    expect(defaultParams('wire-terrain').cameraHeight).toBe(94);
    expect(normalizeParams('wire-terrain', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('wire-terrain-02')).toBe(true);
    expect(getBackgroundOption('wire-terrain-02').name).toBe('Terrain filaire 2');
    expect(studioFor('wire-terrain-02')?.title).toBe('Terrain filaire 2');
    expect(defaultParams('wire-terrain-02').cursor).toBe(true);
    expect(defaultParams('wire-terrain-02').density).toBe(80);
    expect(defaultParams('wire-terrain-02').stars).toBe(50);
    expect(defaultParams('wire-terrain-02').lineColor).toBe('#ff2bd6');
    expect(normalizeParams('wire-terrain-02', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('particle-drift')).toBe(true);
    expect(getBackgroundOption('particle-drift').name).toBe('Dérive de particules');
    expect(studioFor('particle-drift')?.title).toBe('Dérive de particules');
    expect(defaultParams('particle-drift').cursor).toBe(true);
    expect(defaultParams('particle-drift').density).toBe(400);
    expect(defaultParams('particle-drift').dotSize).toBe(6);
    expect(defaultParams('particle-drift').linkDistance).toBe(230);
    expect(defaultParams('particle-drift').accentColor).toBe('#fdfd00');
    expect(normalizeParams('particle-drift', { cursor: false }).cursor).toBe(false);
    expect(isKnownBackgroundId('formula-stream')).toBe(true);
    expect(getBackgroundOption('formula-stream').name).toBe('Flux de formules');
    expect(studioFor('formula-stream')?.title).toBe('Flux de formules');
    expect(defaultParams('formula-stream').cursor).toBe(true);
    expect(defaultParams('formula-stream').density).toBe(18);
    expect(defaultParams('formula-stream').speed).toBe(69);
    expect(defaultParams('formula-stream').gap).toBe(81);
    expect(defaultParams('formula-stream').fontFamily).toBe('Georgia');
    expect(defaultParams('formula-stream').textOpacity).toBe(55);
    expect(normalizeParams('formula-stream', { cursor: false }).cursor).toBe(false);
  });
});
