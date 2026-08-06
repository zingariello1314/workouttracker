import React, { useMemo } from 'react';
import { ANATOMY } from './anatomyTheme';

function ProseBlocks({ blocks }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200">
      {blocks.map((block, i) => {
        if (block.type === 'h3') {
          return (
            <h3 key={i} className="text-sm font-semibold text-white mt-4 first:mt-0">
              {block.text}
            </h3>
          );
        }
        if (block.type === 'p') {
          return (
            <p key={i} className="text-slate-200/95">
              {block.text}
            </p>
          );
        }
        if (block.type === 'ul' && block.items?.length) {
          return (
            <div key={i} className="space-y-2.5">
              {block.items.map((item, j) => (
                <p key={j} className="text-slate-200/95 pl-0">
                  {item}
                </p>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

const PORTION_TOP = [
  'from-[#3897F0]/70 via-[#3897F0]/30 to-transparent',
  'from-cyan-400/70 via-cyan-400/25 to-transparent',
  'from-indigo-400/70 via-indigo-400/25 to-transparent'
];

const PORTION_ACCENT = [
  'border-l-[#3897F0]/90 bg-[#3897F0]/[0.05] shadow-[0_8px_24px_rgba(56,151,240,0.06)]',
  'border-l-cyan-400/85 bg-cyan-400/[0.04] shadow-[0_8px_24px_rgba(34,211,238,0.05)]',
  'border-l-indigo-400/85 bg-indigo-400/[0.04] shadow-[0_8px_24px_rgba(129,140,248,0.05)]'
];

/** Faisceaux / chefs — seul layout avec numéros 01/02/03. */
export function AnatomyPortionsLayout({ blocks }) {
  const { intro, cards } = useMemo(() => {
    const intro = [];
    const cards = [];
    let current = null;
    (blocks || []).forEach((block) => {
      if (block.type === 'h3') {
        if (current) cards.push(current);
        current = { title: block.text, body: [], items: [] };
        return;
      }
      if (!current) {
        if (block.type === 'p') intro.push(block.text);
        return;
      }
      if (block.type === 'p') current.body.push(block.text);
      if (block.type === 'ul') current.items = block.items || [];
    });
    if (current) cards.push(current);
    return { intro, cards };
  }, [blocks]);

  if (cards.length === 0) return <ProseBlocks blocks={blocks} />;

  const gridFaisceaux = cards.length >= 2 && cards.length <= 3;

  return (
    <div className="space-y-5">
      {intro.length > 0 ? (
        <div className="rounded-xl border border-indigo-400/25 bg-gradient-to-r from-indigo-500/[0.08] to-transparent px-4 py-4 sm:px-5 sm:py-4 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/90">
            Un muscle · plusieurs faisceaux
          </p>
          {intro.map((t, i) => (
            <p key={i} className="text-sm leading-[1.68] text-slate-200/95">
              {t}
            </p>
          ))}
        </div>
      ) : null}
      <div className={`${gridFaisceaux ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'}`}>
        {cards.map((card, i) => {
          const [mainTitle, subTitle] = String(card.title || '').split(' — ');
          const accent = PORTION_ACCENT[i % PORTION_ACCENT.length];
          const topGrad = PORTION_TOP[i % PORTION_TOP.length];
          const index = String(i + 1).padStart(2, '0');
          const spanFull = gridFaisceaux && cards.length % 2 === 1 && i === cards.length - 1;
          return (
            <article
              key={i}
              className={`${ANATOMY.card} relative overflow-hidden p-0 border-l-[4px] ${accent} ${
                spanFull ? 'md:col-span-2' : ''
              }`}
            >
              <div className={`h-1 w-full bg-gradient-to-r ${topGrad}`} aria-hidden />
              <div className="p-4 sm:p-5">
                <header className="mb-3 flex gap-3 sm:gap-4 items-start">
                  <span
                    className="shrink-0 tabular-nums text-2xl sm:text-3xl font-black leading-none text-white/[0.12] select-none"
                    aria-hidden
                  >
                    {index}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h4 className="text-sm font-semibold text-white leading-snug">{mainTitle}</h4>
                    {subTitle ? (
                      <p className={`text-[10px] mt-1.5 uppercase tracking-wider ${ANATOMY.muted}`}>
                        {subTitle}
                      </p>
                    ) : null}
                  </div>
                </header>
                <div className="space-y-2.5 pl-0 sm:pl-11">
                  {card.body.map((t, j) => (
                    <p key={j} className="text-sm leading-[1.65] text-slate-200/90">
                      {t}
                    </p>
                  ))}
                  {card.items?.length > 0 ? (
                    <div className="pt-3 mt-2 border-t border-white/[0.07]">
                      <p className={`text-[10px] uppercase tracking-wide mb-2 ${ANATOMY.muted}`}>
                        Exercices souvent utiles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.items.map((item, k) => (
                          <span
                            key={k}
                            className="rounded-md border border-[#3897F0]/30 bg-[#3897F0]/12 px-2 py-1 text-[11px] text-slate-100/90 leading-snug"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
