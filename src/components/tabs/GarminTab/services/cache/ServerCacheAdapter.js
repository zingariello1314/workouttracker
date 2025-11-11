import { buildCacheKey } from './cacheKey';

export class ServerCacheAdapter {
  constructor({ cacheSchemaVersion = 'v1' } = {}) {
    this.cacheSchemaVersion = cacheSchemaVersion;
  }
 
  get(response, rangeInfo, context = {}) {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (!response.cached) {
      return null;
    }

    const diagnostic = response.diagnostic || {};
    const ttl = diagnostic.cacheTtl ?? diagnostic.ttl ?? null;
    const cacheKey = buildCacheKey(rangeInfo, context, this.cacheSchemaVersion);

    return {
      data: response,
      ttl,
      schemaVersion: this.cacheSchemaVersion,
      cacheKey,
      source: 'server'
    };
  }
}
