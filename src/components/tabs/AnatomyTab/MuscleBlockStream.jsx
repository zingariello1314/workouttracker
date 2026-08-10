import React from 'react';
import AnatomyContentFigure from './AnatomyContentFigure';

const pClass = 'text-sm leading-[1.68] text-slate-200/92';
const h3Class = 'text-sm font-semibold text-white mt-5 first:mt-0 mb-2';

/** Rendu séquentiel des blocs (texte + figures dans l’ordre éditorial). */
export default function MuscleBlockStream({ blocks, className = '' }) {
  const list = blocks || [];
  if (!list.length) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {list.map((block, i) => {
        if (block.type === 'p' && block.text) {
          return (
            <p key={i} className={pClass}>
              {block.text}
            </p>
          );
        }
        if (block.type === 'h3' && block.text) {
          return (
            <h3 key={i} className={h3Class}>
              {block.text}
            </h3>
          );
        }
        if (block.type === 'ul' && block.items?.length) {
          return (
            <ul key={i} className="space-y-2 list-none pl-0">
              {block.items.map((item, j) => (
                <li key={j} className="text-sm text-slate-200/90 pl-3 border-l border-teal-500/30">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'figure') {
          return (
            <AnatomyContentFigure
              key={i}
              src={block.src}
              alt={block.alt}
              caption={block.caption}
              layout={block.layout}
            />
          );
        }
        if (block.type === 'callout') {
          return (
            <div
              key={i}
              className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm text-slate-200/95"
            >
              {block.title ? <div className="font-medium text-amber-100/90 mb-1">{block.title}</div> : null}
              {block.text}
            </div>
          );
        }
        if (block.type === 'presentationCallout') {
          return (
            <div
              key={i}
              className="rounded-xl border border-[rgba(74,158,255,0.2)] bg-[rgba(74,158,255,0.1)] px-4 py-3 text-sm text-[#dbe4f0]"
            >
              {block.tag ? (
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7cb4ff] mb-1">
                  {block.tag}
                </div>
              ) : null}
              {block.text}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
