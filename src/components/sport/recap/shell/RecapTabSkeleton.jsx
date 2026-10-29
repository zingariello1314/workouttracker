import React from 'react';

function Block({ className = '' }) {
  return <div className={`rb-skel ${className}`} aria-hidden />;
}

export function RecapContentSkeleton() {
  return (
    <div className="rb-snap" style={{ gap: 16 }}>
      <div className="kgrid">
        {[1, 2, 3, 4, 5].map((i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>
      <Block className="h-48" />
      <Block className="h-64" />
    </div>
  );
}

/** Skeleton inline pour le lazy-load Récap — ne masque pas la sidebar ni le fond. */
export default function RecapTabSkeleton() {
  return (
    <div className="recap-board mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1400px] flex-col px-3 py-4 sm:px-4">
      <Block className="mb-4 h-[72px]" />
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="hidden w-[200px] shrink-0 space-y-2 lg:block">
          {[1, 2, 3, 4, 5].map((i) => (
            <Block key={i} className="h-11" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <RecapContentSkeleton />
        </div>
      </div>
    </div>
  );
}
