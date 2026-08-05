import React, { useMemo } from 'react';
import { layoutKindForSection } from './anatomyMuscleSectionLayout';
import { ANATOMY } from './anatomyTheme';

function Stars({ count = 5 }) {
  const n = Math.min(5, Math.max(0, count));
  return (
    <span className="text-amber-300/90 text-[10px] tracking-tight tabular-nums" aria-hidden>
      {'★'.repeat(n)}
      <span className="text-slate-600">{'☆'.repeat(5 - n)}</span>
    </span>
  );
}

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
        if (block.type === 'callout') {
          return (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm border ${
                block.tone === 'warn'
                  ? 'border-amber-500/25 bg-amber-950/20 text-amber-50/90'
                  : 'border-[#3897F0]/20 bg-[#3897F0]/8 text-slate-200'
              }`}
            >
              {block.title ? <div className="font-medium mb-1 text-white/90">{block.title}</div> : null}
              {block.text}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/** Découpe h3 + p / ul en cartes côte à côte. */
function blocksToCards(blocks) {
  const cards = [];
  let current = null;
  (blocks || []).forEach((block) => {
    if (block.type === 'h3') {
      if (current) cards.push(current);
      current = { title: block.text, body: [], items: [] };
      return;
    }
    if (!current) {
      current = { title: null, body: [], items: [] };
    }
    if (block.type === 'p') current.body.push(block.text);
    if (block.type === 'ul') current.items = block.items || [];
  });
  if (current) cards.push(current);
  return cards.filter((c) => c.title || c.body.length || c.items.length);
}

const PORTION_ACCENT = [
  'border-l-[#3897F0]/85 bg-[#3897F0]/[0.04]',
  'border-l-cyan-400/75 bg-cyan-400/[0.03]',
  'border-l-indigo-400/75 bg-indigo-400/[0.03]'
];

function PortionsLayout({ blocks }) {
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

  return (
    <div className="space-y-4">
      {intro.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-slate-950/50 px-4 py-3.5 sm:px-5 sm:py-4 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3897F0]/90">
            Un muscle, plusieurs faisceaux
          </p>
          {intro.map((t, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-200/95">
              {t}
            </p>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {cards.map((card, i) => {
          const [mainTitle, subTitle] = String(card.title || '').split(' — ');
          const accent = PORTION_ACCENT[i % PORTION_ACCENT.length];
          const index = String(i + 1).padStart(2, '0');
          return (
            <article
              key={i}
              className={`${ANATOMY.card} p-4 sm:p-5 border-l-[3px] ${accent}`}
            >
              <header className="mb-3 flex gap-3 sm:gap-4 items-start">
                <span
                  className="shrink-0 tabular-nums text-lg font-bold leading-none text-white/15 select-none"
                  aria-hidden
                >
                  {index}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white leading-snug">{mainTitle}</h4>
                  {subTitle ? (
                    <p className={`text-[11px] mt-1 uppercase tracking-wide ${ANATOMY.muted}`}>{subTitle}</p>
                  ) : null}
                </div>
              </header>
              <div className="space-y-2.5 pl-0 sm:pl-9">
                {card.body.map((t, j) => (
                  <p key={j} className="text-sm leading-relaxed text-slate-200/90">
                    {t}
                  </p>
                ))}
                {card.items?.length > 0 ? (
                  <div className="pt-2 mt-1 border-t border-white/[0.06]">
                    <p className={`text-[10px] uppercase tracking-wide mb-2 ${ANATOMY.muted}`}>
                      Exercices souvent utiles
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {card.items.map((item, k) => (
                        <span
                          key={k}
                          className="rounded-md border border-[#3897F0]/25 bg-[#3897F0]/10 px-2 py-1 text-[11px] text-slate-200 leading-snug"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CardGridBlocks({ blocks }) {
  const cards = useMemo(() => blocksToCards(blocks), [blocks]);
  if (cards.length === 0) return <ProseBlocks blocks={blocks} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`${ANATOMY.card} p-4 hover:border-white/10 transition-colors`}
        >
          {card.title ? (
            <h4 className="text-sm font-semibold text-slate-100 mb-2">{card.title}</h4>
          ) : null}
          {card.body.map((t, j) => (
            <p key={j} className="text-sm leading-relaxed mb-2 last:mb-0 text-slate-200/90">
              {t}
            </p>
          ))}
          {card.items.length > 0 ? (
            <div className="mt-2 space-y-2">
              {card.items.map((item, j) => (
                <p key={j} className={`text-xs leading-relaxed ${ANATOMY.muted}`}>
                  {item}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ChipGridBlocks({ blocks }) {
  const items = useMemo(() => {
    const all = [];
    (blocks || []).forEach((b) => {
      if (b.type === 'ul') all.push(...(b.items || []));
      if (b.type === 'p') all.push(b.text);
    });
    return all.filter(Boolean);
  }, [blocks]);
  if (items.length === 0) return <ProseBlocks blocks={blocks} />;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex max-w-full items-start gap-2 rounded-lg border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-xs text-slate-200 leading-snug`}
        >
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3897F0]/80" />
          {item}
        </span>
      ))}
    </div>
  );
}

function ExerciseMasonry({ blocks }) {
  const leadBlocks = (blocks || []).filter((b) => b.type === 'p' || b.type === 'h3');
  const exerciseBlocks = (blocks || []).filter((b) => b.type === 'exerciseBlock');
  const portion = (blocks || []).find((b) => b.type === 'portionTable');
  return (
    <div className="space-y-4">
      {leadBlocks.length > 0 ? <ProseBlocks blocks={leadBlocks} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {exerciseBlocks.map((block, i) => (
          <div
            key={i}
            className={`${ANATOMY.card} p-4`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-slate-200">{block.category}</span>
              {block.stars ? <Stars count={block.stars} /> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(block.items || []).map((item, j) => (
                <span
                  key={j}
                  className="rounded-md bg-slate-800/60 border border-slate-600/30 px-2 py-1 text-[11px] text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {portion ? (
        <div>
          {portion.title ? (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {portion.title}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            {(portion.rows || []).map((row, j) => (
              <div
                key={j}
                className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-3 min-h-[4.5rem]"
              >
                <div className="text-xs font-semibold text-[#3897F0] mb-2">{row.label}</div>
                <div className="flex flex-wrap gap-1">
                  {row.exercises.map((ex, k) => (
                    <span
                      key={k}
                      className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AnatomySectionPanel({ section, compact }) {
  if (!section) return null;
  const kind = layoutKindForSection(section.id);
  const inner = (() => {
    switch (kind) {
      case 'portions':
        return <PortionsLayout blocks={section.blocks} />;
      case 'cards':
        return <CardGridBlocks blocks={section.blocks} />;
      case 'chips':
        return <ChipGridBlocks blocks={section.blocks} />;
      case 'exercises':
        return <ExerciseMasonry blocks={section.blocks} />;
      default:
        return <ProseBlocks blocks={section.blocks} />;
    }
  })();

  return (
    <section className={compact ? `${ANATOMY.panel} !p-4` : ANATOMY.panel}>
      <h2 className="text-base font-semibold text-white mb-4">{section.title}</h2>
      {inner}
    </section>
  );
}

/** @deprecated — préférer AnatomySectionPanel */
export default function AnatomyContentRenderer({ blocks }) {
  return <ProseBlocks blocks={blocks} />;
}
