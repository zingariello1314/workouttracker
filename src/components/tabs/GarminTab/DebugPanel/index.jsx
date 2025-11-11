import React from 'react';
import { CacheDiagnostics } from './CacheDiagnostics';
import { NetworkDiagnostics } from './NetworkDiagnostics';

export function DebugPanel({ status, cacheMeta }) {
  return (
    <div className="space-y-4">
      <NetworkDiagnostics status={status} />
      <CacheDiagnostics meta={cacheMeta} />
    </div>
  );
}
