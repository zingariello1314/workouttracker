import React from 'react';

function Block({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

export function RecapContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1400px] flex-col px-3 py-4 sm:px-4">
      <Block className="mb-4 h-[72px] border border-[#0F4C5C]/30" />
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
