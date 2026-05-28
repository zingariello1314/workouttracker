import React, { memo } from 'react';
import { Footprints } from 'lucide-react';

const RunningDrillsBlock = memo(({ drillsCourse, embedded = false }) => {
  const items = Array.isArray(drillsCourse?.items) ? drillsCourse.items : [];
  if (!items.length) return null;

  return (
    <div className={embedded ? 'mt-6 pt-6 border-t border-[#0F4C5C]/50' : 'mb-8'}>
      <h3 className="text-lg font-semibold text-teal-50 flex items-center gap-2 mb-2">
        <Footprints size={20} className="text-sky-400" />
        Drills course
      </h3>
      {drillsCourse?.placementLabel && (
        <p className="text-xs text-slate-400 mb-3">{drillsCourse.placementLabel}</p>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-sky-500/25 bg-sky-950/20 p-4"
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

RunningDrillsBlock.displayName = 'RunningDrillsBlock';

export default RunningDrillsBlock;
