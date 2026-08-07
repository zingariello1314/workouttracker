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

function ContentKicker({ sectionId }) {
  const label = sectionKicker(sectionId);
  if (!label) return null;
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5eb0ff]/80 mb-3">
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

/** Texte présentation : guillemets « … » en emphase blanche. */
function PresentationText({ text, muted = false }) {
  const parts = String(text).split(/(«[^»]+»)/g);
  return (
    <p
      className={
        muted
          ? 'text-sm md:text-[15px] leading-[1.78] text-slate-400/95'
          : 'text-sm md:text-[15px] leading-[1.78] text-slate-50/98'
      }
    >
      {parts.map((part, i) =>
        part.startsWith('«') ? (
          <strong key={i} className="font-semibold text-white">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

/** Présentation approfondie — intro encadrée + paragraphes continus (colonne unique). */
function MusclePresentationEditorial({ blocks }) {
  const paras = paragraphsFromBlocks(blocks);
  if (paras.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  const [lead, ...rest] = paras;

  return (
    <div className="space-y-5 sm:space-y-6">
      <article className="rounded-xl border border-[#3897F0]/30 bg-[#1a2332]/90 px-4 py-4 sm:px-5 sm:py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="border-l-[3px] border-[#3897F0] pl-4 sm:pl-5">
          <PresentationText text={lead} />
        </div>
      </article>
      {rest.length > 0 ? (
        <div className="space-y-5 sm:space-y-6 px-0.5">
          {rest.map((text, i) => (
            <PresentationText key={i} text={text} muted />
          ))}
        </div>
      ) : null}
    </div>
  );
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

/** Fonctions : cartes horizontales sans numérotation type portions. */
function MuscleFunctionsGrid({ blocks, sectionId }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const lead = cards.find((c) => !c.title && c.body.length);
  const titled = cards.filter((c) => c.title);

  return (
    <div className="space-y-4">
      <ContentKicker sectionId={sectionId} />
      {lead ? (
        <p className="text-sm leading-[1.7] text-slate-200/90 rounded-lg bg-white/[0.03] px-3 py-2.5">
          {lead.body.join(' ')}
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
      return <MusclePresentationEditorial blocks={blocks} />;
    case 'portions-faisceaux':
      return <AnatomyPortionsLayout blocks={blocks} />;
    case 'portions-zones':
      return <MusclePortionsZones blocks={blocks} />;
    case 'anatomy-sheet':
      return <MuscleAnatomySheet blocks={blocks} sectionId={sectionId} />;
    case 'functions-grid':
      return <MuscleFunctionsGrid blocks={blocks} sectionId={sectionId} />;
    case 'functions-narrative':
      return <FamilyNarrativeFlow blocks={blocks} />;
    case 'morph-spotlight':
      return <MuscleMorphSpotlight blocks={blocks} />;
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
    case 'faq-bento':
      return <FamilyFaqBento blocks={blocks} />;
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
