import React from 'react';

/** Conteneur verre commun pour widgets accueil (config appliquée uniquement). */
export default function HomeWidgetShell({ title, accent = '#a06bff', children, className = '' }) {
  return (
    <div
      className={`relative flex min-h-0 w-full flex-col rounded-2xl border bg-black/10 px-4 py-3 shadow-2xl backdrop-blur-3xl md:rounded-3xl md:px-5 md:py-3.5 ${className}`}
      style={{
        borderColor: `color-mix(in srgb, ${accent} 28%, rgba(255,255,255,0.08))`
      }}
    >
      {title ? (
        <div className="mb-2 flex items-center md:mb-2.5">
          <h3
            className="mr-3 text-sm font-bold tracking-wider text-white"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {title}
          </h3>
          <div
            className="h-px flex-1"
            style={{
              background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 55%, transparent), transparent)`
            }}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
