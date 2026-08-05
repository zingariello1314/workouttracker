import React, { useMemo } from 'react';
import { layoutKindForSection } from './anatomyMuscleSectionLayout';

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
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i} className="text-slate-300/95">
              {block.text}
            </p>
          );
        }
        if (block.type === 'callout') {
          return (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm border ${
                block.tone === 'warn'
                  ? 'border-amber-500/25 bg-amber-950/20 text-amber-50/90'
                  : 'border-cyan-500/20 bg-cyan-950/15 text-cyan-50/90'
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

function CardGridBlocks({ blocks }) {
  const cards = useMemo(() => blocksToCards(blocks), [blocks]);
  if (cards.length === 0) return <ProseBlocks blocks={blocks} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-700/40 bg-slate-900/35 p-4 hover:border-slate-600/50 transition-colors"
        >
          {card.title ? (
            <h4 className="text-sm font-semibold text-slate-100 mb-2">{card.title}</h4>
          ) : null}
          {card.body.map((t, j) => (
            <p key={j} className="text-xs text-slate-400 leading-relaxed mb-2 last:mb-0">
              {t}
            </p>
          ))}
          {card.items.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {card.items.map((item, j) => (
                <li key={j} className="text-xs text-slate-400 flex gap-2">
                  <span className="text-cyan-600/80 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
          className="inline-flex max-w-full items-start gap-2 rounded-lg border border-slate-600/35 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 leading-snug"
        >
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70" />
          {item}
        </span>
      ))}
    </div>
  );
}

function ExerciseMasonry({ blocks }) {
  const exerciseBlocks = (blocks || []).filter((b) => b.type === 'exerciseBlock');
  const portion = (blocks || []).find((b) => b.type === 'portionTable');
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {exerciseBlocks.map((block, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/35 bg-gradient-to-br from-slate-950/80 to-slate-900/30 p-4"
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
                <div className="text-xs font-semibold text-cyan-100/90 mb-2">{row.label}</div>
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
    <section
      className={`rounded-2xl border border-slate-700/30 bg-slate-950/25 backdrop-blur-sm ${
        compact ? 'p-4' : 'p-5 md:p-6'
      }`}
    >
      <h2 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <span className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent max-w-[3rem]" />
        {section.title}
      </h2>
      {inner}
    </section>
  );
}

/** @deprecated — préférer AnatomySectionPanel */
export default function AnatomyContentRenderer({ blocks }) {
  return <ProseBlocks blocks={blocks} />;
}
