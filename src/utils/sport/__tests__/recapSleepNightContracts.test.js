import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  extractSleepNight,
  extractSleepNightsInWindow,
  SLEEP_ATTACHMENT_CONVENTION,
  classifySleepNightWindowRole,
  buildSleepNightProofFields
} from '../recapSleepNight';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const fixture = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/f2-sleep-nights-synthetic.json'),
    'utf8'
  )
);

describe('recapSleepNight contrats F2', () => {
  it('expose la convention wake_morning sur chaque nuit', () => {
    const night = extractSleepNight(fixture, '2026-11-01');
    expect(night).toBeTruthy();
    expect(night.ymd).toBe('2026-11-01');
    expect(night.attachment.id).toBe(SLEEP_ATTACHMENT_CONVENTION.id);
    expect(night.bedTime).toBe('00:45');
  });

  it('frontière 31 oct → 1 nov : deux clés distinctes', () => {
    const n31 = extractSleepNight(fixture, '2026-10-31');
    const n01 = extractSleepNight(fixture, '2026-11-01');
    expect(n31.hours).toBeCloseTo(7.5, 1);
    expect(n01.hours).toBeCloseTo(6.2, 1);
    expect(n31.ymd).not.toBe(n01.ymd);
  });

  it('nuit trop courte → null', () => {
    expect(extractSleepNight(fixture, '2026-11-03')).toBeNull();
  });

  it('fenêtre 7j : nuit hors fenêtre = historical / non publishable as observation', () => {
    const primary = { start: '2026-10-26', end: '2026-11-01' };
    const inWin = classifySleepNightWindowRole('2026-11-01', primary);
    const out = classifySleepNightWindowRole('2026-10-24', primary);
    expect(inWin.role).toBe('primary_observation');
    expect(out.role).toBe('historical_reference');

    const proofOut = buildSleepNightProofFields(
      extractSleepNight(fixture, '2026-10-24'),
      primary
    );
    expect(proofOut.publishAsPeriodObservation).toBe(false);
    expect(proofOut.role).toBe('historical_reference');

    const proofIn = buildSleepNightProofFields(
      extractSleepNight(fixture, '2026-11-01'),
      primary
    );
    expect(proofIn.publishAsPeriodObservation).toBe(true);
    expect(proofIn.nightYmd).toBe('2026-11-01');
  });

  it('extractSleepNightsInWindow respecte les bornes inclusives', () => {
    const nights = extractSleepNightsInWindow(fixture, '2026-10-31', '2026-11-02');
    const ymds = nights.map((n) => n.ymd);
    expect(ymds).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
    expect(ymds).not.toContain('2026-10-24');
    expect(ymds).not.toContain('2026-11-03');
  });
});
