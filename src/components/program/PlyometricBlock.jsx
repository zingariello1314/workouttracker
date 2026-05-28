import React, { memo } from 'react';
import { Zap } from 'lucide-react';

/**
 * Bloc pliométrie complémentaire (hors liste « Exercices »).
 */
const PlyometricBlock = memo(({ pliometrie, embedded = false, className = '' }) => {
  const items = Array.isArray(pliometrie?.items) ? pliometrie.items : [];
  if (!items.length) return null;

  return (
    <div
      className={
        embedded
          ? `mt-6 pt-6 border-t border-amber-600/30 ${className}`.trim()
          : `mb-8 ${className}`.trim()
      }
    >
      <h3 className="text-lg font-semibold text-teal-50 flex items-center gap-2 mb-2">
        <Zap size={20} className="text-amber-400" />
        Pliométrie
      </h3>
      {pliometrie?.placementLabel && (
        <p className="text-xs text-slate-400 mb-3">{pliometrie.placementLabel}</p>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-4"
          >
            <div className="font-medium text-slate-100">{item.name}</div>
            <div className="text-sm text-slate-300 mt-1">
              {item.series}
              {item.rest ? ` · repos ${item.rest}s` : ''}
            </div>
            {item.instructions && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.instructions}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

PlyometricBlock.displayName = 'PlyometricBlock';

export default PlyometricBlock;
