import React, { useMemo } from 'react';
import { parseCircuitCopy } from '../../../utils/circuits/circuitCopyLayout';

function SectionFrame({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#0F4C5C]/75 bg-black">
      {title ? (
        <header className="border-b border-[#0F4C5C]/50 px-4 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58d4aa]">
            {title}
          </h2>
        </header>
      ) : null}
      <div className="space-y-3 px-4 py-4">{children}</div>
    </section>
  );
}

function Prose({ text, note = false }) {
  const parts = String(text || '').split('\n').filter(Boolean);
  return (
    <div className={`max-w-[68ch] space-y-2 ${note ? 'text-xs leading-relaxed text-slate-400' : 'text-sm leading-relaxed text-slate-200'}`}>
      {parts.map((part) => (
        <p key={part}>{part}</p>
      ))}
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[#0F4C5C]/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-teal-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')} className="border-b border-[#0F4C5C]/35 last:border-0">
              {row.map((cell, index) => (
                <td
                  key={`${cell}-${index}`}
                  className={`px-3 py-2.5 align-top ${index === 0 ? 'font-medium text-white' : 'text-slate-300'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpecGrid({ items }) {
  return (
    <dl className="grid overflow-hidden rounded-lg border border-[#0F4C5C]/55 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="border-b border-[#0F4C5C]/35 px-3 py-2.5 odd:bg-[#04140f] even:bg-black sm:[&:nth-last-child(-n+2)]:border-b-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">{item.label}</dt>
          <dd className="mt-0.5 text-sm text-slate-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LevelGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.name} className="rounded-lg border border-[#0F4C5C]/60 bg-[#04140f] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-200">{item.name}</p>
          {item.kicker ? <p className="mt-0.5 text-xs text-teal-100/75">{item.kicker}</p> : null}
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{item.text}</p>
        </article>
      ))}
    </div>
  );
}

function BlockView({ block }) {
  if (block.kind === 'table') return <DataTable headers={block.headers} rows={block.rows} />;
  if (block.kind === 'spec') return <SpecGrid items={block.items} />;
  if (block.kind === 'levels') return <LevelGrid items={block.items} />;
  if (block.kind === 'compare') {
    return (
      <div className="space-y-3">
        {block.intro?.length ? <Prose text={block.intro.join('\n')} /> : null}
        <DataTable headers={block.headers} rows={block.rows} />
      </div>
    );
  }
  if (block.kind === 'steps') {
    return (
      <ol className="space-y-1.5">
        {block.items.map((item, index) => (
          <li key={item} className="flex items-baseline gap-2 text-sm text-slate-200">
            <span className="w-5 shrink-0 text-[11px] font-semibold text-teal-300">{index + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.kind === 'list') {
    return (
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-slate-200">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#58d4aa]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <Prose text={block.text} note={block.note} />;
}

export default function CircuitRoutineCopy({ description, hideOrder = false }) {
  const sections = useMemo(() => {
    return parseCircuitCopy(description).filter((section) => !(hideOrder && section.kind === 'order'));
  }, [description, hideOrder]);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        if (section.kind === 'quote') {
          const text = section.blocks.map((block) => block.text || '').filter(Boolean).join(' ');
          return (
            <blockquote
              key={section.title}
              className="rounded-xl border border-[#0F5C45]/55 bg-[#041a13] px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58d4aa]">{section.title}</p>
              <p className="mt-2 max-w-[68ch] text-base leading-relaxed text-teal-50">{text}</p>
            </blockquote>
          );
        }
        return (
          <SectionFrame key={section.title || section.blocks[0]?.kind} title={section.title}>
            {section.blocks.map((block, index) => (
              <BlockView key={`${block.kind}-${index}`} block={block} />
            ))}
          </SectionFrame>
        );
      })}
    </div>
  );
}
