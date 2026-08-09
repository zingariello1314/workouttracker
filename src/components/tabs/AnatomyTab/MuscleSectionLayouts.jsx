import React, { useMemo } from 'react';
import { resolveMuscleArtDirection } from './muscleSectionArt';
import {
  EXERCISE_PILL,
  FUNCTION_CARD_SHELL,
  sectionKicker,
  TAG_CHIP
} from './anatomyVisualTokens';
import { familyDotClassForIndex } from './anatomyDigestLayout';
import { cardsFromBlocks, paragraphsFromBlocks } from './familySectionArt';
import { functionCardsFromBlocks } from './functionSectionLayout';
import {
  functionMagazineThemeForCard,
  functionPillLabelFromCard
} from './functionMagazineThemes';
import { progressionFromBlocks } from './progressionSectionLayout';
import MuscleSaviezVousAccordion from './MuscleSaviezVousAccordion';
import { AnatomyPortionsLayout } from './AnatomyPortionsLayout';
import {
  FamilyAlertStack,
  FamilyCalloutVision,
  FamilyErrorsBento,
  FamilyFaqBento,
  FamilyInsightFeature,
  FamilyNarrativeFlow
} from './FamilySectionLayouts';
import { ANATOMY } from './anatomyTheme';

function ContentKicker({ sectionId, className = '' }) {
  const label = sectionKicker(sectionId);
  if (!label) return null;
  const tone =
    sectionId === 'fonctions'
      ? 'text-[10px] font-bold uppercase tracking-[0.22em] text-[#6c7688] mb-4'
      : 'text-[10px] font-bold uppercase tracking-[0.22em] text-[#5eb0ff]/80 mb-3';
  return (
    <p className={`${tone} ${className}`.trim()}>
      {label}
    </p>
  );
}

function CardBody({ card, tagClass = TAG_CHIP }) {
  return (
    <>
      {card.body.map((t, j) => (
        <p key={j} className="text-sm leading-[1.68] text-slate-200/90 mb-2 last:mb-0">
          {t}
        </p>
      ))}
      {card.items?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {card.items.map((item, k) => (
            <span
              key={k}
              className={tagClass}
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

function Stars({ count = 5 }) {
  const n = Math.min(5, Math.max(0, count));
  return (
    <span className="text-amber-300/90 text-[10px] tracking-tight tabular-nums" aria-hidden>
      {'★'.repeat(n)}
      <span className="text-slate-600">{'☆'.repeat(5 - n)}</span>
    </span>
  );
}

/** Texte présentation : guillemets « … » en emphase. */
function PresentationText({ text, muted = false, className = '' }) {
  const parts = String(text).split(/(«[^»]+»)/g);
  const tone = muted ? 'text-[#a9b2c3]' : 'text-[#dbe4f0]';
  return (
    <p className={`text-[15px] leading-[1.75] m-0 ${tone} ${className}`.trim()}>
      {parts.map((part, i) =>
        part.startsWith('«') ? (
          <strong key={i} className="font-semibold text-[#c9d2e0]">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

/** Présentation approfondie — modules éditoriaux (intro, eyebrow, cartes, callouts). */
function MusclePresentationMagazine({ blocks }) {
  const nodes = useMemo(() => {
    const out = [];
    let i = 0;
    const list = blocks || [];
    let seenEyebrow = false;
    let introDone = false;

    while (i < list.length) {
      const b = list[i];
      if (b.type === 'chips') {
        i += 1;
        continue;
      }
      if (b.type === 'takeaway') {
        out.push({ kind: 'takeaway', label: b.label, text: b.text });
        i += 1;
        continue;
      }
      if (b.type === 'pullquote') {
        out.push({ kind: 'pullquote', lead: b.lead, text: b.text });
        i += 1;
        continue;
      }
      if (b.type === 'split') {
        out.push({ kind: 'split', cards: b.cards || [], caption: b.caption });
        i += 1;
        continue;
      }
      if (b.type === 'exerciseGrid') {
        out.push({ kind: 'exerciseGrid', items: b.items || [] });
        i += 1;
        continue;
      }
      if (b.type === 'presentationCallout') {
        out.push({
          kind: 'callout',
          variant: b.variant || 'definition',
          tag: b.tag,
          text: b.text
        });
        i += 1;
        continue;
      }
      if (b.type === 'callout') {
        out.push({ kind: 'editorialCallout', title: b.title, text: b.text, tone: b.tone });
        i += 1;
        continue;
      }
      if (b.type === 'comparisonTable') {
        out.push({ kind: 'comparisonTable', headers: b.headers, rows: b.rows });
        i += 1;
        continue;
      }
      if (b.type === 'trajet') {
        out.push({ kind: 'trajet', text: b.text });
        i += 1;
        continue;
      }
      if (b.type === 'ul') {
        out.push({ kind: 'list', items: b.items || [] });
        i += 1;
        continue;
      }
      if (b.type === 'h3') {
        seenEyebrow = true;
        out.push({ kind: 'eyebrow', text: b.text });
        i += 1;
        continue;
      }
      if (b.type === 'p') {
        const ps = [];
        while (i < list.length && list[i].type === 'p') {
          ps.push(list[i].text);
          i += 1;
        }
        if (!seenEyebrow && !introDone) {
          introDone = true;
          out.push({ kind: 'intro', paragraphs: ps });
        } else {
          out.push({ kind: 'card', paragraphs: ps });
        }
        continue;
      }
      i += 1;
    }
    return out;
  }, [blocks]);

  if (nodes.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  const calloutShell = {
    analogy: 'bg-[#151c28] border-white/[0.07]',
    definition: 'bg-[rgba(74,158,255,0.1)] border-[rgba(74,158,255,0.2)]',
    warning: 'bg-[rgba(232,169,74,0.1)] border-[rgba(232,169,74,0.25)]',
    study: 'bg-[rgba(78,203,143,0.1)] border-[rgba(78,203,143,0.2)]'
  };
  const calloutTag = {
    analogy: 'text-[#7cb4ff]',
    definition: 'text-[#7cb4ff]',
    warning: 'text-[#f0bd78]',
    study: 'text-[#7fdba8]'
  };
  const calloutBody = {
    analogy: 'text-[#a9b2c3] italic',
    definition: 'text-[#dbe4f0]',
    warning: 'text-[#dbe4f0]',
    study: 'text-[#a9b2c3]'
  };

  /** Espacement selon le couple module précédent → module actuel. */
  const gapBefore = (node, ni) => {
    if (ni === 0) return '';
    const prev = nodes[ni - 1];
    const cur = node.kind;
    const pk = prev?.kind;

    if (cur === 'eyebrow') {
      if (pk === 'intro') return 'mt-7 sm:mt-8';
      if (pk === 'takeaway') return 'mt-8 sm:mt-9';
      if (pk === 'pullquote') return 'mt-8 sm:mt-9';
      if (pk === 'card' && /Comparer|Synthèse|longueur|scapulaire|morphologie|Comprendre/i.test(node.text)) {
        return 'mt-9 sm:mt-10';
      }
      return 'mt-8 sm:mt-9';
    }

    if (pk === 'eyebrow') return 'mt-3.5 sm:mt-4';

    if (pk === 'intro') return 'mt-6 sm:mt-7';

    if (cur === 'pullquote') return 'mt-6 sm:mt-7';
    if (pk === 'pullquote') return 'mt-5 sm:mt-6';

    if (cur === 'takeaway') return 'mt-5 sm:mt-6';
    if (pk === 'takeaway') return 'mt-6 sm:mt-7';

    if (cur === 'split' || cur === 'exerciseGrid') return 'mt-4 sm:mt-5';
    if (pk === 'exerciseGrid') return 'mt-5 sm:mt-6';

    if (cur === 'callout' && pk === 'card') return 'mt-4 sm:mt-5';
    if (cur === 'card' && pk === 'callout') return 'mt-4 sm:mt-5';
    if (cur === 'callout' || pk === 'callout') return 'mt-4 sm:mt-5';
    if (cur === 'comparisonTable' || cur === 'trajet' || cur === 'list') return 'mt-4 sm:mt-5';
    if (cur === 'editorialCallout' || pk === 'editorialCallout') return 'mt-5 sm:mt-6';

    if (cur === 'card' && pk === 'card') return 'mt-4 sm:mt-5';

    return 'mt-4 sm:mt-5';
  };

  return (
    <div className="w-full max-w-[680px] pb-4">
      {nodes.map((node, ni) => {
        const wrap = (child) => (
          <div key={ni} className={gapBefore(node, ni)}>
            {child}
          </div>
        );

        if (node.kind === 'intro') {
          return wrap(
            <div className="rounded-r-[12px] border-l-[3px] border-[#4a9eff] bg-[rgba(74,158,255,0.1)] px-6 py-6 sm:py-7">
              {node.paragraphs.map((t, j) => (
                <PresentationText
                  key={j}
                  text={t}
                  className={j < node.paragraphs.length - 1 ? 'mb-4' : ''}
                />
              ))}
            </div>
          );
        }
        if (node.kind === 'eyebrow') {
          return wrap(
            <div className="flex items-center gap-2.5 pt-1 pb-1">
              <div className="w-[3px] h-4 shrink-0 rounded-[2px] bg-[#4a9eff]" aria-hidden />
              <span className="text-sm font-semibold text-white tracking-[0.01em]">{node.text}</span>
            </div>
          );
        }
        if (node.kind === 'card') {
          return wrap(
            <article className="rounded-[14px] border border-white/[0.07] bg-[#111721] px-6 py-5 sm:px-6 sm:py-6">
              {node.paragraphs.map((t, j) => (
                <PresentationText key={j} text={t} muted className="mb-4 last:mb-0" />
              ))}
            </article>
          );
        }
        if (node.kind === 'takeaway') {
          return wrap(
            <div className="rounded-[10px] border border-white/[0.07] bg-[#151c28] px-5 py-4 sm:px-[20px] sm:py-[18px]">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6c7688] mb-2">
                {node.label}
              </span>
              <p className="text-sm sm:text-[15px] leading-[1.65] text-[#7cb4ff] m-0">{node.text}</p>
            </div>
          );
        }
        if (node.kind === 'split') {
          return wrap(
            <div className="grid sm:grid-cols-2 gap-4">
              {node.cards.map((c, ci) => (
                <div
                  key={ci}
                  className="rounded-xl border border-white/[0.07] bg-[#151c28] px-5 py-5 sm:px-6 sm:py-[20px]"
                >
                  <span className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#7cb4ff] mb-2.5">
                    {c.tag}
                  </span>
                  <p className="text-sm leading-[1.68] text-[#a9b2c3] m-0">{c.text}</p>
                </div>
              ))}
              {node.caption ? (
                <p className="sm:col-span-2 text-[13px] leading-[1.65] text-[#6c7688] pt-2 m-0">
                  {node.caption}
                </p>
              ) : null}
            </div>
          );
        }
        if (node.kind === 'callout') {
          const v = node.variant || 'definition';
          return wrap(
            <div
              className={`rounded-xl border px-5 py-5 sm:px-[22px] sm:py-6 ${calloutShell[v] || calloutShell.definition}`}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.05em] mb-3 m-0 ${calloutTag[v]}`}
              >
                {node.tag}
              </p>
              <p className={`text-[14.5px] leading-[1.78] m-0 ${calloutBody[v]}`}>{node.text}</p>
            </div>
          );
        }
        if (node.kind === 'pullquote') {
          return wrap(
            <blockquote className="rounded-[14px] border border-white/[0.07] bg-[#111721] px-6 py-8 sm:px-[26px] sm:py-9 text-center">
              {node.lead ? (
                <p className="text-[13px] text-[#6c7688] m-0 mb-3">{node.lead}</p>
              ) : null}
              <p className="text-lg sm:text-[19px] font-semibold leading-[1.55] text-white m-0">
                {node.text}
              </p>
            </blockquote>
          );
        }
        if (node.kind === 'exerciseGrid') {
          return wrap(
            <div className="grid sm:grid-cols-2 gap-4">
              {node.items.map((ex) => (
                <div
                  key={ex.title}
                  className="rounded-xl border border-white/[0.07] bg-[#111721] px-5 py-5 sm:px-6 sm:py-[20px]"
                >
                  <p className="text-sm font-semibold text-white m-0 mb-2.5">{ex.title}</p>
                  <p className="text-[13.5px] leading-[1.68] text-[#a9b2c3] m-0">{ex.text}</p>
                </div>
              ))}
            </div>
          );
        }
        if (node.kind === 'list') {
          return wrap(
            <ul className="rounded-[14px] border border-white/[0.07] bg-[#111721] px-6 py-5 sm:py-6 space-y-2.5 list-none m-0">
              {node.items.map((item, j) => (
                <li key={j} className="text-[15px] leading-[1.7] text-[#a9b2c3] pl-3 border-l-2 border-[#4a9eff]/40">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (node.kind === 'trajet') {
          return wrap(
            <p className="text-center text-sm sm:text-[15px] tracking-wide text-[#7cb4ff] font-medium m-0 py-1">
              {node.text}
            </p>
          );
        }
        if (node.kind === 'comparisonTable') {
          const headers = node.headers || ['', 'Grand pectoral', 'Petit pectoral'];
          return wrap(
            <div className="overflow-x-auto rounded-[14px] border border-white/[0.07] bg-[#111721]">
              <table className="w-full min-w-[320px] text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    {headers.map((h, hi) => (
                      <th
                        key={hi}
                        className={`px-4 py-3 font-semibold text-[#7cb4ff] ${hi === 0 ? 'text-[#6c7688]' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {node.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-white/[0.05] last:border-0">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-4 py-3 align-top leading-[1.55] ${
                            ci === 0 ? 'font-medium text-[#c9d2e0]' : 'text-[#a9b2c3]'
                          }`}
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
        if (node.kind === 'editorialCallout') {
          const isGoal = String(node.title || '').includes('🎯');
          return wrap(
            <div
              className={`rounded-xl border px-5 py-5 sm:px-[22px] sm:py-6 ${
                isGoal
                  ? 'bg-[rgba(74,158,255,0.08)] border-[rgba(74,158,255,0.22)]'
                  : 'bg-[rgba(78,203,143,0.08)] border-[rgba(78,203,143,0.2)]'
              }`}
            >
              {node.title ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.05em] mb-2.5 m-0 text-[#7fdba8]">
                  {node.title}
                </p>
              ) : null}
              <p className="text-[14.5px] leading-[1.78] m-0 text-[#dbe4f0] whitespace-pre-line">{node.text}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/** @deprecated alias — préférer MusclePresentationMagazine */
function MusclePresentationEditorial({ blocks }) {
  return <MusclePresentationMagazine blocks={blocks} />;
}

/** Portions sans faisceaux h3 — zones fonctionnelles (pas de numéros). */
function MusclePortionsZones({ blocks }) {
  const paras = paragraphsFromBlocks(blocks);
  return (
    <div className="rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/[0.12] via-[#0f1419] to-[#080c12] p-5 sm:p-6 space-y-4 shadow-[0_12px_32px_rgba(99,102,241,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300/90">
        Zones fonctionnelles
      </p>
      {paras.map((text, i) => (
        <p
          key={i}
          className={`text-sm leading-[1.72] text-slate-100/90 ${i > 0 ? 'pt-4 border-t border-indigo-400/15' : ''}`}
        >
          {text}
        </p>
      ))}
    </div>
  );
}

/** Chapitres h3 + callouts (anatomie, blessures, programmation). */
function MuscleChapterFlow({ blocks, sectionId, accent = 'teal' }) {
  const nodes = useMemo(() => {
    const out = [];
    let i = 0;
    const list = blocks || [];
    while (i < list.length) {
      const b = list[i];
      if (b.type === 'callout') {
        out.push({ kind: 'callout', block: b });
        i += 1;
        continue;
      }
      if (b.type === 'takeaway') {
        out.push({ kind: 'takeaway', label: b.label, text: b.text });
        i += 1;
        continue;
      }
      if (b.type === 'trajet') {
        out.push({ kind: 'trajet', text: b.text });
        i += 1;
        continue;
      }
      if (b.type === 'p') {
        const ps = [];
        while (i < list.length && list[i].type === 'p') {
          ps.push(list[i]);
          i += 1;
        }
        out.push({ kind: 'lead', blocks: ps });
        continue;
      }
      if (b.type === 'h3') {
        const title = b.text;
        i += 1;
        const body = [];
        const items = [];
        const trajets = [];
        while (
          i < list.length &&
          (list[i].type === 'p' || list[i].type === 'ul' || list[i].type === 'trajet')
        ) {
          if (list[i].type === 'ul') {
            items.push(...(list[i].items || []));
          } else if (list[i].type === 'trajet') {
            trajets.push(list[i].text);
          } else {
            body.push(list[i].text);
          }
          i += 1;
        }
        out.push({ kind: 'chapter', title, body, items, trajets });
        continue;
      }
      i += 1;
    }
    return out;
  }, [blocks]);

  const borderByAccent = {
    teal: 'border-l-teal-400/85',
    violet: 'border-l-violet-400/85',
    rose: 'border-l-rose-400/85'
  };
  const border = borderByAccent[accent] || borderByAccent.teal;
  let leadShown = false;

  return (
    <div className="space-y-4">
      <ContentKicker sectionId={sectionId} />
      {nodes.map((node, ni) => {
        if (node.kind === 'lead') {
          if (!leadShown) {
            leadShown = true;
            return (
              <div
                key={ni}
                className="rounded-xl border border-white/[0.07] bg-slate-950/45 px-4 py-3.5 space-y-2.5"
              >
                {node.blocks.map((b, j) => (
                  <p key={j} className="text-sm leading-[1.68] text-slate-200/92">
                    {b.text}
                  </p>
                ))}
              </div>
            );
          }
          return (
            <div key={ni} className="space-y-2 px-1">
              {node.blocks.map((b, j) => (
                <p key={j} className="text-sm leading-[1.68] text-slate-200/88">
                  {b.text}
                </p>
              ))}
            </div>
          );
        }
        if (node.kind === 'chapter') {
          return (
            <article
              key={ni}
              className={`rounded-r-xl border border-white/[0.06] bg-[#0e141c]/90 py-3.5 pl-4 sm:pl-5 pr-4 border-l-[4px] ${border}`}
            >
              <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{node.title}</h4>
              {node.body.map((t, j) => (
                <p key={j} className="text-sm leading-[1.68] text-slate-200/88 mb-2 last:mb-0">
                  {t}
                </p>
              ))}
              {node.trajets?.map((t, j) => (
                <p
                  key={`tr-${j}`}
                  className="text-center text-sm tracking-wide text-[#7cb4ff] font-medium py-2 my-1"
                >
                  {t}
                </p>
              ))}
              {node.items?.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-[13px] text-slate-300/90 list-none">
                  {node.items.map((item, j) => (
                    <li key={j} className="pl-3 border-l border-white/10">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        }
        if (node.kind === 'callout') {
          const block = node.block;
          const warn = block.tone === 'warn';
          return (
            <div
              key={ni}
              className={`rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 ${
                warn
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-[#0c0a08] to-black'
                  : accent === 'violet'
                    ? 'border-violet-400/40 bg-gradient-to-br from-violet-950/35 via-[#0c0814] to-black'
                    : accent === 'rose'
                      ? 'border-rose-400/35 bg-gradient-to-br from-rose-950/30 to-black'
                      : 'border-[#3897F0]/40 bg-gradient-to-br from-[#3897F0]/[0.14] via-[#0c1520] to-[#060a10]'
              }`}
            >
              {block.title ? (
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                    warn ? 'text-amber-200/95' : 'text-teal-200/90'
                  }`}
                >
                  {block.title}
                </p>
              ) : null}
              <p className="text-sm leading-[1.72] text-slate-50/95 whitespace-pre-line">{block.text}</p>
            </div>
          );
        }
        if (node.kind === 'trajet') {
          return (
            <p
              key={ni}
              className="text-center text-sm tracking-wide text-[#7cb4ff] font-medium py-2 m-0"
            >
              {node.text}
            </p>
          );
        }
        if (node.kind === 'takeaway') {
          return (
            <div
              key={ni}
              className="rounded-[10px] border border-white/[0.07] bg-[#151c28] px-[18px] py-3.5"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6c7688] mb-1">
                {node.label}
              </span>
              <p className="text-sm leading-[1.65] text-[#7cb4ff] m-0 whitespace-pre-line">{node.text}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/** Anatomie : fiche technique 2 colonnes, listes en tags. */
function MuscleAnatomySheet({ blocks, sectionId }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  const lead = cards.find((c) => !c.title && c.body.length);

  if (titled.length === 0) {
    return <FamilyNarrativeFlow blocks={blocks} />;
  }

  return (
    <div className="space-y-4">
      <ContentKicker sectionId={sectionId} />
      {lead ? (
        <p className="text-sm leading-relaxed text-slate-200/90 border-l-2 border-teal-400/50 pl-4 italic">
          {lead.body.join(' ')}
        </p>
      ) : null}
      <div className={`grid gap-4 ${titled.length >= 2 ? 'md:grid-cols-2' : ''}`}>
        {titled.map((card, i) => (
          <article
            key={i}
            className="rounded-xl border border-teal-400/30 bg-[#0a1218]/95 p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(45,212,191,0.08)]"
          >
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300/95 mb-3 pb-2 border-b border-teal-400/20">
              {card.title}
            </h4>
            <CardBody card={card} />
          </article>
        ))}
      </div>
    </div>
  );
}

const FUNCTION_PILL_BASE =
  'rounded-lg border px-3 py-1.5 text-[11px] font-medium leading-snug';

const FUNCTION_CARD =
  'rounded-xl border border-[#334155]/90 bg-[#161b22] shadow-none border-l-[3px]';

function FunctionSectionIcon({ index }) {
  const stroke = 'currentColor';
  const icons = [
    <svg key="a" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M4 12h6M14 12h6M10 8l-2 4 2 4M14 8l2 4-2 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="b" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M16 6L8 12l8 6M8 12h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="c" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M12 4a8 8 0 1 1-5.3 13.9M12 4V8M12 4H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="d" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M8 18V8l4-3 4 3v10M12 5v13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="e" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M12 5v14M8 15l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    <svg key="f" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ];
  return icons[index % icons.length];
}

/** Fonctions principales — cartes empilées, pills, nuance, synthèse (maquette pectoraux). */
function MuscleFunctionsGrid({ blocks, sectionId, hideKicker = false }) {
  const parsed = useMemo(() => functionCardsFromBlocks(blocks), [blocks]);
  const { lead, cards, synthèse } = parsed;
  const hasMagazine = cards.some((c) => c.eyebrow || c.nuances.length > 0) || synthèse;

  const legacy = useMemo(() => {
    if (hasMagazine) return null;
    const allCards = cardsFromBlocks(blocks);
    const legacyLead = allCards.find((c) => !c.title && c.body.length);
    const titled = allCards.filter((c) => c.title);
    return { legacyLead, titled };
  }, [blocks, hasMagazine, cards]);

  if (!hasMagazine && legacy?.titled.length) {
    const { legacyLead, titled } = legacy;
    return (
      <div className="space-y-4">
        <ContentKicker sectionId={sectionId} />
        {legacyLead ? (
          <p className="text-sm leading-[1.7] text-slate-200/90 rounded-lg bg-white/[0.03] px-3 py-2.5">
            {legacyLead.body.join(' ')}
          </p>
        ) : null}
        <div className={`grid gap-3 ${titled.length >= 3 ? 'md:grid-cols-3' : titled.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {titled.map((card, i) => (
            <article
              key={i}
              className={`rounded-xl border border-white/[0.09] border-t-[3px] px-4 py-4 ${FUNCTION_CARD_SHELL[i % FUNCTION_CARD_SHELL.length]}`}
            >
              <h4 className="text-sm font-semibold text-white mb-2.5 leading-snug">{card.title}</h4>
              <CardBody card={card} tagClass="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-200/90" />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (!hasMagazine) {
    return <FamilyNarrativeFlow blocks={blocks} />;
  }

  const pillEntries = cards
    .filter((c) => c.eyebrow)
    .map((c) => ({
      label: functionPillLabelFromCard(c),
      theme: functionMagazineThemeForCard(c)
    }));

  return (
    <div className="space-y-4">
      {!hideKicker ? <ContentKicker sectionId={sectionId} /> : null}
      {lead.length > 0 ? (
        <p className="text-sm leading-[1.72] text-[#94a3b8] m-0">{lead.join(' ')}</p>
      ) : null}
      {pillEntries.length > 0 ? (
        <div className="flex flex-wrap gap-2 pb-1" role="list" aria-label="Fonctions">
          {pillEntries.map(({ label, theme }, i) => (
            <span
              key={i}
              className={`${FUNCTION_PILL_BASE} ${theme.pill}`}
              role="listitem"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {cards.map((card, i) => {
          const theme = functionMagazineThemeForCard(card);
          const titleClass = theme.title || 'text-white';
          return (
          <article key={i} className={`${FUNCTION_CARD} ${theme.cardAccent} p-5 sm:p-6`}>
            <div className="flex gap-3.5 sm:gap-4">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${theme.icon}`}
                aria-hidden
              >
                <FunctionSectionIcon index={i} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`text-base font-semibold leading-snug m-0 ${titleClass}`}>
                  {card.title}
                </h4>
                {card.eyebrow ? (
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] m-0 mt-1 mb-3 ${theme.eyebrow}`}>
                    {card.eyebrow}
                  </p>
                ) : (
                  <div className="mb-2.5" />
                )}
                {card.body.map((t, j) => (
                  <p key={j} className="text-[14px] leading-[1.7] text-[#94a3b8] m-0 mb-3 last:mb-0">
                    {t}
                  </p>
                ))}
                {card.nuances.map((text, ni) => (
                  <div
                    key={ni}
                    className="mt-4 rounded-lg border border-amber-600/45 bg-[#1c1810]/95 px-4 py-3.5"
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400 mb-2">
                      Nuance
                    </span>
                    <p className="text-[14px] leading-[1.65] text-[#d6cfc0] m-0">{text}</p>
                  </div>
                ))}
                {card.items?.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-[14px] leading-[1.65] text-[#94a3b8] list-disc pl-5 marker:text-slate-500">
                    {card.items.map((item, k) => (
                      <li key={k}>{String(item).trim()}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </article>
          );
        })}
      </div>
      {synthèse ? (
        <article
          className={`${FUNCTION_CARD} border-l-[3px] border-l-[#4a9eff] px-5 py-5 sm:px-6 sm:py-6 mt-1`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a9eff] m-0 mb-3">
            Synthèse
          </p>
          {synthèse.lead ? (
            <p className="text-[14px] leading-[1.7] text-[#64748b] italic m-0 mb-4 whitespace-pre-line">
              {synthèse.lead}
            </p>
          ) : null}
          {synthèse.text ? (
            <p className="text-[14px] sm:text-[15px] leading-[1.68] text-slate-100 font-semibold m-0 whitespace-pre-line">
              {synthèse.text}
            </p>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

/** Morphologie : 1ère idée mise en avant + grille. */
function MuscleMorphSpotlight({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const lead = cards.find((c) => !c.title && c.body.length);
  const titled = cards.filter((c) => c.title);
  if (titled.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  const [spot, ...rest] = titled;

  return (
    <div className="space-y-4">
      {lead ? <p className="text-sm text-slate-200/90 mb-1">{lead.body.join(' ')}</p> : null}
      <article className="relative overflow-hidden rounded-xl border border-violet-400/35 bg-gradient-to-br from-violet-500/[0.14] via-violet-950/20 to-[#0c1018] p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-400/[0.08] blur-2xl" aria-hidden />
        <h4 className="relative text-sm font-semibold text-white mb-2">{spot.title}</h4>
        <div className="relative">
          <CardBody card={spot} />
        </div>
      </article>
      {rest.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((card, i) => (
            <article
              key={i}
              className="rounded-xl border border-white/[0.1] bg-[#121820]/85 p-4 backdrop-blur-sm"
            >
              <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
              <CardBody card={card} />
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const PROGRESSION_PILL =
  'rounded-md border border-white/[0.1] bg-[#0a0e14]/90 px-2.5 py-1 text-[11px] text-slate-200/90';

function RirScaleBar({ items }) {
  const tones = [
    'bg-slate-600/50 border-slate-500/40 text-slate-300',
    'bg-[#3897F0]/35 border-[#3897F0]/50 text-[#b8d4ff]',
    'bg-amber-500/30 border-amber-400/45 text-amber-100',
    'bg-orange-600/35 border-orange-500/50 text-orange-100'
  ];
  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-lg overflow-hidden border border-white/[0.06]">
        {(items || []).map((item, i) => (
          <div
            key={i}
            className={`px-2 py-2.5 text-center border ${tones[i] || tones[0]}`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(items || []).map((item, i) => (
          <p key={i} className="text-[11px] leading-snug text-[#8b939f] m-0">
            <span className="font-semibold text-slate-400">{item.label}</span>
            {item.detail ? ` : ${item.detail}` : ''}
          </p>
        ))}
      </div>
    </div>
  );
}

function ProgressionFlowRow({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <span className="text-[#5eb0ff]/80 text-xs" aria-hidden>
              →
            </span>
          ) : null}
          <span
            className={`${PROGRESSION_PILL} ${i === steps.length - 1 && steps.length > 2 ? 'border-[#3897F0]/45 text-[#9ec5ff]' : ''}`}
          >
            {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Recrutement « Comment développer » : timeline numérotée, erreurs, synthèse. */
function MuscleProgressionTimeline({ blocks, sectionId }) {
  const data = useMemo(() => progressionFromBlocks(blocks), [blocks]);
  const { intro, steps, errors, summary, principle } = data;

  return (
    <div className="space-y-5">
      <ContentKicker sectionId={sectionId} />
      {intro.length > 0 ? (
        <div className="rounded-[14px] border border-white/[0.08] bg-[#131922]/95 px-5 py-5 sm:px-6">
          {intro.map((t, i) => (
            <p key={i} className="text-sm leading-[1.72] text-[#b8c0d0] m-0 mb-3 last:mb-0">
              {t}
            </p>
          ))}
        </div>
      ) : null}

      <div className="relative pl-10 sm:pl-12 space-y-5">
        <div
          className="absolute left-[15px] sm:left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-[#3897F0]/70 via-[#3897F0]/25 to-transparent"
          aria-hidden
        />
        {steps.map((step, si) => (
          <article key={step.number} className="relative">
            <span
              className="absolute -left-10 sm:-left-12 top-5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#3897F0]/75 bg-[#0a1018] text-xs font-bold text-[#5eb0ff] shadow-[0_0_16px_rgba(56,151,240,0.2)]"
              aria-hidden
            >
              {step.number}
            </span>
            <div className="rounded-[14px] border border-white/[0.08] bg-[#131922]/95 px-5 py-5 sm:px-6 shadow-[0_8px_28px_rgba(0,0,0,0.3)]">
              <h4 className="text-[15px] sm:text-base font-semibold text-white m-0 mb-3 leading-snug">
                {step.number}. {step.title}
              </h4>
              {step.body.map((t, j) => (
                <p key={j} className="text-sm leading-[1.68] text-[#b8c0d0] m-0 mb-3 last:mb-0">
                  {t}
                </p>
              ))}
              {step.quotes.length > 0 ? (
                <div className="my-4 space-y-2">
                  {step.quotes.map((q, qi) => (
                    <p
                      key={qi}
                      className="text-center text-sm italic text-[#9aa3b5] rounded-lg border border-white/[0.06] bg-[#0c1018]/80 px-4 py-3 m-0"
                    >
                      {q}
                    </p>
                  ))}
                </div>
              ) : null}
              {step.caveat ? (
                <div className="mt-4 rounded-[10px] border border-amber-500/35 bg-amber-950/20 px-4 py-3.5">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400/95 mb-1.5">
                    Cependant
                  </span>
                  <p className="text-sm leading-[1.65] text-[#d4cbb8] m-0">{step.caveat}</p>
                </div>
              ) : null}
              {step.portions.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {step.portions.map((port, pi) => (
                    <div
                      key={pi}
                      className={`rounded-xl border px-4 py-4 ${
                        pi === 0
                          ? 'border-[#3897F0]/40 bg-[#3897F0]/[0.06]'
                          : 'border-violet-400/40 bg-violet-500/[0.06]'
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.18em] m-0 mb-2 ${
                          pi === 0 ? 'text-[#7cb4ff]' : 'text-violet-300/95'
                        }`}
                      >
                        {port.name}
                      </p>
                      {port.body.map((t, j) => (
                        <p key={j} className="text-[13px] leading-[1.6] text-[#b8c0d0] m-0 mb-2 last:mb-0">
                          {t}
                        </p>
                      ))}
                      {port.items?.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-[12px] text-slate-300/90 list-disc pl-4 marker:text-slate-500">
                          {port.items.map((it, k) => (
                            <li key={k}>{String(it).trim()}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {step.exerciseGroups?.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {step.exerciseGroups.map((g, gi) => (
                    <div key={gi}>
                      <p className="text-sm font-medium text-slate-200/95 m-0 mb-2">{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(g.examples || []).map((ex, ei) => (
                          <span key={ei} className={PROGRESSION_PILL}>
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {step.items?.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-sm text-[#b8c0d0] list-disc pl-5 marker:text-slate-500">
                  {step.items.map((it, k) => (
                    <li key={k}>{String(it).trim()}</li>
                  ))}
                </ul>
              ) : null}
              {step.rirScale ? <RirScaleBar items={step.rirScale} /> : null}
              {step.flows?.map((flow, fi) => (
                <ProgressionFlowRow key={fi} steps={flow} />
              ))}
            </div>
          </article>
        ))}
      </div>

      {errors ? (
        <div className="space-y-4 pt-2">
          <h4 className="flex items-start gap-3 text-base font-semibold text-white m-0">
            <span className="mt-1 h-full min-h-[1.25rem] w-1 shrink-0 rounded-full bg-amber-400/90" aria-hidden />
            {errors.title}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {errors.items.slice(0, 2).map((err) => (
              <article
                key={err.number}
                className="relative rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-[#14100c]/90 px-4 py-4"
              >
                <span className="text-lg font-black text-amber-400/90 tabular-nums">
                  {String(err.number).padStart(2, '0')}
                </span>
                <h5 className="text-sm font-semibold text-amber-50 mt-1 mb-2">{err.title}</h5>
                {err.body.map((t, j) => (
                  <p key={j} className="text-[13px] leading-[1.65] text-[#c4b8a8] m-0 mb-1.5 last:mb-0">
                    {t}
                  </p>
                ))}
              </article>
            ))}
          </div>
          {errors.items.slice(2).map((err) => (
            <article
              key={err.number}
              className="rounded-xl border border-amber-500/28 bg-gradient-to-r from-amber-950/35 to-transparent px-4 py-4 sm:px-5"
            >
              <span className="text-sm font-black text-amber-400/85 tabular-nums mr-2">
                {String(err.number).padStart(2, '0')}
              </span>
              <span className="text-sm font-semibold text-amber-50">{err.title}</span>
              {err.body.map((t, j) => (
                <p key={j} className="text-[13px] leading-[1.65] text-[#c4b8a8] m-0 mt-2 mb-1.5 last:mb-0">
                  {t}
                </p>
              ))}
            </article>
          ))}
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-[14px] border border-white/[0.08] bg-[#151c28]/95 px-5 py-5 sm:px-6 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5eb0ff] m-0">
            {summary.title}
          </p>
          {summary.intro.map((t, i) => (
            <p key={i} className="text-sm text-[#8b939f] m-0">
              {t}
            </p>
          ))}
          <ul className="space-y-3 list-none m-0 p-0">
            {summary.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm leading-[1.65]">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3897F0]/25 text-[#5eb0ff] text-[10px]"
                  aria-hidden
                >
                  ✓
                </span>
                <span className="text-[#b8c0d0]">
                  {b.rest ? (
                    <>
                      <strong className="text-white font-semibold">{b.strong}</strong>
                      {' — '}
                      {b.rest}
                    </>
                  ) : (
                    <strong className="text-white font-semibold">{b.strong}</strong>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {principle ? (
        <article className="rounded-[14px] border border-white/[0.08] bg-[#131922]/95 border-l-[4px] border-l-[#3897F0]/85 px-5 py-5 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5eb0ff] m-0 mb-3">
            Le principe fondamental
          </p>
          <p className="text-sm sm:text-[15px] leading-[1.72] text-white font-medium m-0">{principle}</p>
        </article>
      ) : null}
    </div>
  );
}

/** Recrutement / principes : étapes 1·2·3 (pas 01/02 filigrane). */
function MusclePrinciplesSteps({ blocks, sectionId }) {
  const paras = paragraphsFromBlocks(blocks);
  const labels = ['1', '2', '3', '4', '5'];

  return (
    <div className="space-y-1">
      <ContentKicker sectionId={sectionId} />
      <div className="relative pl-8 sm:pl-10 space-y-6 pt-2">
      <div
        className="absolute left-[13px] sm:left-[17px] top-2 bottom-2 w-px bg-gradient-to-b from-[#3897F0] via-cyan-400/40 to-transparent"
        aria-hidden
      />
      {paras.map((text, i) => (
        <article key={i} className="relative rounded-lg border border-white/[0.05] bg-[#0d1218]/80 px-3 py-3 sm:px-4">
          <span
            className="absolute -left-8 sm:-left-10 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#3897F0]/55 bg-[#0a1018] text-xs font-bold text-[#5eb0ff] shadow-[0_0_14px_rgba(56,151,240,0.25)]"
            aria-hidden
          >
            {labels[i] || i + 1}
          </span>
          <p className="text-sm leading-[1.72] text-slate-100/90">{text}</p>
        </article>
      ))}
      </div>
    </div>
  );
}

/** Erreurs titrées (h3) : bento ambre 2 + 1. */
function MuscleErrorsTitled({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  const callouts = (blocks || []).filter((b) => b.type === 'callout');
  const top = titled.slice(0, 2);
  const bottom = titled.slice(2);

  return (
    <div className="space-y-3">
      {top.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {top.map((card, i) => (
            <article
              key={i}
              className="relative overflow-hidden rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/[0.12] to-amber-950/30 px-4 py-4"
            >
              <span className="pointer-events-none absolute right-2 top-1 text-4xl font-black text-amber-400/[0.07]" aria-hidden>
                !
              </span>
              <h4 className="text-sm font-semibold text-amber-50 mb-2">{card.title}</h4>
              <CardBody card={card} />
            </article>
          ))}
        </div>
      ) : null}
      {bottom.map((card, i) => (
        <article
          key={i}
          className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-600/15 to-transparent px-4 py-4 sm:px-5"
        >
          <h4 className="text-sm font-semibold text-amber-50 mb-2">{card.title}</h4>
          <CardBody card={card} />
        </article>
      ))}
      {callouts.map((block, i) => (
        <div
          key={`callout-${i}`}
          className="rounded-2xl border border-[#3897F0]/45 bg-gradient-to-br from-[#3897F0]/[0.18] via-[#0c1520] to-[#060a10] px-5 py-4 sm:px-6 sm:py-5 shadow-[0_12px_40px_rgba(56,151,240,0.08),inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          {block.title ? (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3897F0]/95 mb-2">
              {block.title}
            </p>
          ) : null}
          <p className="text-sm leading-[1.72] text-slate-50/95">{block.text}</p>
        </div>
      ))}
    </div>
  );
}

/** Coiffe / liste de muscles : grille 2×2. */
function MuscleRoster({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {titled.map((card, i) => (
        <article
          key={i}
          className="rounded-xl border border-white/[0.1] bg-gradient-to-br from-[#141c28] to-[#0e1218] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${familyDotClassForIndex(i)}`} aria-hidden />
            <h4 className="text-sm font-semibold text-white">{card.title}</h4>
          </div>
          <CardBody card={card} />
        </article>
      ))}
    </div>
  );
}

/** Exercices : chapitres h3 empilés + blocs étoiles + tableau objectifs. */
function MuscleExerciseGuide({ blocks }) {
  const nodes = useMemo(() => {
    const out = [];
    const list = blocks || [];
    let i = 0;
    while (i < list.length) {
      const b = list[i];
      if (b.type === 'p') {
        const ps = [];
        while (i < list.length && list[i].type === 'p') {
          ps.push(list[i]);
          i += 1;
        }
        out.push({ kind: 'lead', blocks: ps });
        continue;
      }
      if (b.type === 'h3') {
        const title = b.text;
        i += 1;
        const body = [];
        while (i < list.length && list[i].type === 'p') {
          body.push(list[i].text);
          i += 1;
        }
        out.push({ kind: 'chapter', title, body });
        continue;
      }
      if (b.type === 'exerciseBlock') {
        const exs = [];
        while (i < list.length && list[i].type === 'exerciseBlock') {
          exs.push(list[i]);
          i += 1;
        }
        out.push({ kind: 'exercises', blocks: exs });
        continue;
      }
      if (b.type === 'portionTable') {
        out.push({ kind: 'table', block: list[i] });
        i += 1;
        continue;
      }
      i += 1;
    }
    return out;
  }, [blocks]);

  const chapterColors = [
    'border-l-emerald-400/80',
    'border-l-cyan-400/80',
    'border-l-[#3897F0]/80',
    'border-l-violet-400/80'
  ];

  return (
    <div className="space-y-5">
      {nodes.map((node, ni) => {
        if (node.kind === 'lead') {
          return (
            <div key={ni} className="rounded-xl bg-[#0f1419]/80 border border-white/[0.06] px-4 py-3.5 space-y-2">
              {node.blocks.map((b, j) => (
                <p key={j} className="text-sm leading-relaxed text-slate-200/90">
                  {b.text}
                </p>
              ))}
            </div>
          );
        }
        if (node.kind === 'chapter') {
          const ci = nodes.filter((n, idx) => n.kind === 'chapter' && idx <= ni).length - 1;
          return (
            <article
              key={ni}
              className={`rounded-r-xl border border-white/[0.06] bg-[#0e141c]/90 py-3.5 pl-4 sm:pl-5 pr-4 border-l-[4px] ${chapterColors[ci % chapterColors.length]}`}
            >
              <h4 className="text-sm font-semibold text-white mb-2">{node.title}</h4>
              {node.body.map((t, j) => (
                <p key={j} className="text-sm leading-[1.68] text-slate-200/88 mb-2 last:mb-0">
                  {t}
                </p>
              ))}
            </article>
          );
        }
        if (node.kind === 'exercises') {
          return (
            <div key={ni} className="grid gap-3 md:grid-cols-2 pt-2">
              {node.blocks.map((block, i) => (
                <div key={i} className={`${ANATOMY.card} p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-slate-200">{block.category}</span>
                    {block.stars ? <Stars count={block.stars} /> : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(block.items || []).map((item, j) => (
                      <span
                        key={j}
                        className={EXERCISE_PILL}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        if (node.kind === 'table') {
          const portion = node.block;
          return (
            <div key={ni} className="pt-2">
              {portion.title ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80 mb-3">
                  {portion.title}
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-3">
                {(portion.rows || []).map((row, j) => (
                  <div
                    key={j}
                    className="rounded-xl border border-emerald-500/20 bg-slate-950/50 p-3 min-h-[4.5rem]"
                  >
                    <div className="text-xs font-semibold text-emerald-300/90 mb-2">{row.label}</div>
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
          );
        }
        return null;
      })}
    </div>
  );
}

function MuscleMobilityInset({ blocks }) {
  return (
    <div className="rounded-xl border border-sky-400/25 bg-sky-950/20 px-4 py-4 sm:px-5 space-y-3">
      <FamilyNarrativeFlow blocks={blocks} />
    </div>
  );
}

function MuscleRenforcementMix({ blocks }) {
  const lead = (blocks || []).filter((b) => b.type === 'p');
  const ex = (blocks || []).filter((b) => b.type === 'exerciseBlock');
  return (
    <div className="space-y-4">
      {lead.length > 0 ? <MusclePrinciplesSteps blocks={lead} /> : null}
      {ex.length > 0 ? <MuscleExerciseGuide blocks={ex} /> : null}
    </div>
  );
}

function MuscleDuoTitled({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {titled.map((card, i) => (
        <article key={i} className="rounded-xl border border-white/[0.1] bg-[#141b24]/90 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
          <CardBody card={card} />
        </article>
      ))}
    </div>
  );
}

export function MuscleSectionComposer({ section }) {
  const direction = resolveMuscleArtDirection(section);
  const blocks = section?.blocks || [];
  const sectionId = section?.id || '';

  switch (direction) {
    case 'presentation-editorial':
    case 'presentation-magazine':
      return <MusclePresentationMagazine blocks={blocks} />;
    case 'portions-faisceaux':
      return <AnatomyPortionsLayout blocks={blocks} />;
    case 'portions-zones':
      return <MusclePortionsZones blocks={blocks} />;
    case 'anatomy-sheet':
      return <MuscleAnatomySheet blocks={blocks} sectionId={sectionId} />;
    case 'anatomy-chapters':
      return <MuscleChapterFlow blocks={blocks} sectionId={sectionId} accent="teal" />;
    case 'volume-chapters':
      return <MuscleChapterFlow blocks={blocks} sectionId={sectionId} accent="violet" />;
    case 'blessures-chapters':
      return <MuscleChapterFlow blocks={blocks} sectionId={sectionId} accent="rose" />;
    case 'functions-grid':
      return (
        <MuscleFunctionsGrid
          blocks={blocks}
          sectionId={sectionId}
          hideKicker={Boolean(section._functionsMagazine)}
        />
      );
    case 'functions-narrative':
      return <FamilyNarrativeFlow blocks={blocks} />;
    case 'morph-spotlight':
      return <MuscleMorphSpotlight blocks={blocks} />;
    case 'progression-timeline':
      return <MuscleProgressionTimeline blocks={blocks} sectionId={sectionId} />;
    case 'principles-steps':
      return <MusclePrinciplesSteps blocks={blocks} sectionId={sectionId} />;
    case 'exercise-guide':
      return <MuscleExerciseGuide blocks={blocks} />;
    case 'errors-titled':
      return <MuscleErrorsTitled blocks={blocks} />;
    case 'errors-points':
      return <FamilyErrorsBento blocks={blocks} />;
    case 'alert-stack':
      return <FamilyAlertStack blocks={blocks} />;
    case 'insight-feature':
      return <FamilyInsightFeature blocks={blocks} />;
    case 'saviez-vous-accordion':
      return <MuscleSaviezVousAccordion blocks={blocks} />;
    case 'faq-bento':
      return <FamilyFaqBento blocks={blocks} encyclopedia={false} />;
    case 'callout-vision':
      return <FamilyCalloutVision blocks={blocks} />;
    case 'mobility-inset':
    case 'programme-inset':
    case 'volume-inset':
      return <MuscleMobilityInset blocks={blocks} />;
    case 'renforcement-mix':
      return <MuscleRenforcementMix blocks={blocks} />;
    case 'muscle-roster':
      return <MuscleRoster blocks={blocks} />;
    case 'duo-titled':
      return <MuscleDuoTitled blocks={blocks} />;
    case 'narrative-flow':
    default:
      return <FamilyNarrativeFlow blocks={blocks} />;
  }
}
