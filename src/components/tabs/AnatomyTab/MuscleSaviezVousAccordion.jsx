import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { parseSaviezVousBlocks } from './saviezVousSectionLayout';
import { FamilyNarrativeFlow } from './FamilySectionLayouts';

const CARD_SHELL =
  'rounded-lg border border-[#252d3a] bg-[#161B26] overflow-hidden transition-colors';

function AccordionBody({ card }) {
  return (
    <div className="space-y-3 pb-4 pr-4 pl-[3.25rem] sm:pl-14">
      {card.body.map((t, j) => (
        <p key={j} className="text-sm leading-[1.72] text-[#94a3b8]">
          {t}
        </p>
      ))}
      {card.items?.length > 0 ? (
        <ol className="space-y-2 list-decimal list-inside marker:text-[#64748b] text-sm leading-[1.65] text-[#94a3b8]">
          {card.items.map((item, j) => (
            <li key={j} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function SaviezVousCallout({ block }) {
  const isWarn = block.tone === 'warn';
  const borderTone = isWarn ? 'border-l-amber-500' : 'border-l-[#4a9eff]';
  const titleTone = isWarn ? 'text-amber-400' : 'text-[#7cb4ff]';

  return (
    <article className={`${CARD_SHELL} border-l-[4px] ${borderTone} px-5 py-5 sm:px-6 sm:py-6`}>
      {block.title ? (
        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-3 ${titleTone}`}>
          {block.title}
        </p>
      ) : null}
      <div className="space-y-3">
        {(block.text || '')
          .split(/\n\n+/)
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="text-sm leading-[1.72] text-[#cbd5e1]/95">
              {para}
            </p>
          ))}
      </div>
    </article>
  );
}

function SourcesPanel({ card }) {
  const lines =
    card.items?.length > 0
      ? card.items
      : card.body.flatMap((t) => t.split(/\n+/).filter(Boolean));

  if (lines.length === 0) return null;

  return (
    <article className={`${CARD_SHELL} px-5 py-5 sm:px-6 sm:py-6`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b] mb-4">
        {card.title && !/sources/i.test(card.title) ? card.title : 'Sources citées'}
      </p>
      <ol className="space-y-2.5 list-decimal list-inside marker:text-[#475569] text-xs sm:text-[13px] leading-[1.65] text-[#94a3b8]">
        {lines.map((line, i) => (
          <li key={i} className="pl-0.5">
            {line}
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function MuscleSaviezVousAccordion({ blocks }) {
  const { items, sources, callouts, lead } = useMemo(
    () => parseSaviezVousBlocks(blocks),
    [blocks]
  );

  const [openSet, setOpenSet] = useState(() => new Set(items.length > 0 ? [0] : []));

  const toggle = useCallback((index) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        {lead.length > 0 ? (
          <FamilyNarrativeFlow
            blocks={lead.flatMap((c) => [
              ...c.body.map((text) => ({ type: 'p', text })),
              ...(c.items?.length ? [{ type: 'ul', items: c.items }] : [])
            ])}
          />
        ) : (
          <FamilyNarrativeFlow blocks={blocks.filter((b) => b.type !== 'callout')} />
        )}
        {sources ? <SourcesPanel card={sources} /> : null}
        {callouts.map((block, i) => (
          <SaviezVousCallout key={`co-${i}`} block={block} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {lead.length > 0 ? (
        <div className="mb-1 space-y-3">
          {lead.map((c, i) => (
            <AccordionBody key={`lead-${i}`} card={c} />
          ))}
        </div>
      ) : null}

      {items.map((card, i) => {
        const open = openSet.has(i);
        const num = String(i + 1).padStart(2, '0');
        const panelId = `saviez-panel-${i}`;
        const headerId = `saviez-header-${i}`;

        return (
          <article key={i} className={CARD_SHELL}>
            <button
              type="button"
              id={headerId}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span
                className="w-8 shrink-0 text-sm font-medium tabular-nums text-[#475569]"
                aria-hidden
              >
                {num}
              </span>
              <span className="flex-1 text-[15px] font-semibold leading-snug text-white pr-2">
                {card.title}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform duration-200 ${
                  open ? '-rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>
            {open ? (
              <div id={panelId} role="region" aria-labelledby={headerId}>
                <AccordionBody card={card} />
              </div>
            ) : null}
          </article>
        );
      })}

      {sources ? <SourcesPanel card={sources} /> : null}

      {callouts.length > 0 ? (
        <div className="space-y-2.5 pt-1">
          {callouts.map((block, i) => (
            <SaviezVousCallout key={`co-${i}`} block={block} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
