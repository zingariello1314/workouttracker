import { describe, it, expect } from 'vitest';
import { safeParseMomentumApiV1Health, MomentumApiV1HealthSchema } from '../apiHealth.v1.js';

describe('MomentumApiV1HealthSchema', () => {
  it('accepte la charge utile serveur nominale', () => {
    const payload = {
      service: 'momentum-api',
      version: 1,
      status: 'ok',
      zlib_ready: true,
      auth_db_ready: true
    };
    expect(safeParseMomentumApiV1Health(payload).success).toBe(true);
  });

  it('rejette un service inconnu', () => {
    const bad = { service: 'other', version: 1, status: 'ok' };
    expect(safeParseMomentumApiV1Health(bad).success).toBe(false);
  });

  it('accepte des drapeaux Supabase optionnels', () => {
    const payload = {
      service: 'momentum-api',
      version: 1,
      status: 'ok',
      supabase_configured: false,
      supabase_reachable: false
    };
    expect(safeParseMomentumApiV1Health(payload).success).toBe(true);
  });

  it('parse strict depuis le schéma', () => {
    const v = MomentumApiV1HealthSchema.parse({
      service: 'momentum-api',
      version: 1,
      status: 'ok'
    });
    expect(v.version).toBe(1);
  });
});
