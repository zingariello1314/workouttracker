import React, { useMemo } from 'react';
import { familyDotClassForIndex } from './anatomyDigestLayout';
import {
  cardsFromBlocks,
  paragraphsFromBlocks,
  resolveFamilyArtDirection
} from './familySectionArt';

function ProseExtras({ blocks }) {
  const rest = (blocks || []).filter((b) => b.type !== 'p' && b.type !== 'h3');
  if (!rest.length) return null;
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200">
      {rest.map((block, i) => {
        if (block.type === 'ul' && block.items?.length) {
          return (
            <ul key={i} className="space-y-2 list-none">
              {block.items.map((item, j) => (
                <li key={j} className="text-slate-200/90 pl-3 border-l border-white/10">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}

function TitledCardBody({ card }) {
  return (
    <>
      {card.body.map((t, j) => (
        <p key={j} className="text-sm leading-[1.7] text-slate-100/88 mb-2 last:mb-0">
          {t}
        </p>
      ))}
      {card.items?.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-xs text-slate-300/90">
          {card.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/** 3 erreurs : 2 colonnes + bandeau pleine largeur en bas. */
export function FamilyErrorsBento({ blocks, narrow = false }) {
  const paragraphs = paragraphsFromBlocks(blocks);
  if (paragraphs.length === 0) return null;

  const top = paragraphs.slice(0, 2);
  const bottom = paragraphs.slice(2);

  return (
    <div className="space-y-3">
      {top.length > 0 ? (
        <div className={`grid gap-3 ${narrow ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
          {top.map((text, i) => (
            <article
              key={i}
              className="relative overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.14] to-[#14100a]/80 px-4 py-4 sm:px-5 sm:py-5 min-h-[7rem]"
            >
              <span
                className="pointer-events-none absolute -right-2 -top-3 text-5xl font-black text-amber-400/[0.08] select-none"
                aria-hidden
              >
                !
              </span>
              <p className="relative text-sm leading-[1.68] text-amber-50/92">{text}</p>
            </article>
          ))}
        </div>
      ) : null}
      {bottom.map((text, i) => (
        <article
          key={`b-${i}`}
          className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-600/[0.18] via-amber-500/[0.08] to-transparent px-4 py-4 sm:px-6 sm:py-4"
        >
          <p className="text-sm leading-[1.68] text-amber-50/90">{text}</p>
        </article>
      ))}
      <ProseExtras blocks={blocks} />
    </div>
  );
}

/** Saviez-vous : carte featured à gauche (2 lignes) + 2 cartes à droite — ou pile si colonne étroite. */
export function FamilyInsightFeature({ blocks, narrow = false }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  if (titled.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  const [featured, ...rest] = titled;

  if (narrow) {
    return (
      <div className="space-y-3">
        <article className="rounded-xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/[0.12] to-[#0a0e14] p-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80 mb-2 block">
            À retenir
          </span>
          <h4 className="text-sm font-semibold text-white leading-snug mb-2">{featured.title}</h4>
          <TitledCardBody card={featured} />
        </article>
        {rest.map((card, i) => (
          <article
            key={i}
            className="rounded-xl border border-white/[0.12] bg-[#121820]/90 px-3.5 py-3 flex gap-3 items-start"
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${familyDotClassForIndex(i + 1)}`}
              aria-hidden
            />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">{card.title}</h4>
              <TitledCardBody card={card} />
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 md:grid-rows-2 md:auto-rows-fr">
      <article className="md:row-span-2 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/[0.14] via-[#0c1518] to-[#060a10] p-5 sm:p-6 flex flex-col justify-center shadow-[0_16px_48px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-cyan-400/[0.07] blur-3xl" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/80 mb-3">
          À retenir
        </span>
        <h4 className="text-base sm:text-lg font-semibold text-white leading-snug mb-3">{featured.title}</h4>
        <TitledCardBody card={featured} />
      </article>
      {rest.map((card, i) => (
        <article
          key={i}
          className="rounded-xl border border-white/[0.12] bg-[#121820]/90 px-4 py-4 sm:px-5 flex gap-3 items-start"
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${familyDotClassForIndex(i + 1)}`}
            aria-hidden
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{card.title}</h4>
            <TitledCardBody card={card} />
          </div>
        </article>
      ))}
    </div>
  );
}

/** FAQ : 2 questions en haut, réponse longue en bandeau bas (répété par groupe de 3). */
export function FamilyFaqBento({ blocks, narrow = false }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  if (titled.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  const chunks = [];
  for (let i = 0; i < titled.length; i += 3) {
    chunks.push(titled.slice(i, i + 3));
  }

  return (
    <div className="space-y-6">
      {chunks.map((group, gi) => {
        const top = group.slice(0, 2);
        const bottom = group.slice(2);
        return (
          <div key={gi} className="space-y-3">
            {top.length > 0 ? (
              <div className={`grid gap-3 ${narrow ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                {top.map((card, i) => (
                  <article
                    key={i}
                    className="rounded-xl border border-[#3897F0]/35 bg-[#0a121c]/95 px-4 py-4 sm:px-5 relative pl-5 sm:pl-6 min-h-[6.5rem] shadow-[inset_0_1px_0_rgba(56,151,240,0.08)]"
                  >
                    <span
                      className="pointer-events-none absolute right-3 top-3 text-3xl font-serif text-[#3897F0]/[0.12] select-none"
                      aria-hidden
                    >
                      ?
                    </span>
                    <span
                      className="absolute left-3 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-[#3897F0] to-cyan-400/50"
                      aria-hidden
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5eb0ff]/90 mb-2">
                      Question
                    </p>
                    <h4 className="text-sm font-semibold text-white leading-snug mb-2.5">{card.title}</h4>
                    <TitledCardBody card={card} />
                  </article>
                ))}
              </div>
            ) : null}
            {bottom.map((card, i) => (
              <article
                key={`faq-${gi}-${i}`}
                className="rounded-xl border border-[#3897F0]/25 bg-gradient-to-r from-[#3897F0]/[0.1] to-transparent px-4 py-4 sm:px-6 sm:py-5"
              >
                <div className="flex flex-col sm:flex-row sm:gap-6 sm:items-start">
                  <h4 className="text-sm font-semibold text-white leading-snug sm:w-[38%] shrink-0 mb-2 sm:mb-0">
                    {card.title}
                  </h4>
                  <div
                    className={`sm:flex-1 ${
                      narrow ? '' : 'sm:border-l sm:border-white/10 sm:pl-6'
                    }`}
                  >
                    <TitledCardBody card={card} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Synthèse : deux colonnes égales, teinte violette. */
export function FamilySynthDual({ blocks, narrow = false }) {
  const paragraphs = paragraphsFromBlocks(blocks);
  if (paragraphs.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${narrow ? 'grid-cols-1' : 'md:grid-cols-2'} relative`}>
        {!narrow && paragraphs.length >= 2 ? (
          <div
            className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-violet-400/40 via-white/10 to-transparent -translate-x-1/2 pointer-events-none"
            aria-hidden
          />
        ) : null}
        {paragraphs.map((text, i) => (
          <article
            key={i}
            className={`rounded-xl px-4 py-4 sm:px-5 sm:py-5 ${
              i === 0
                ? 'border border-violet-400/35 bg-gradient-to-br from-violet-500/[0.12] to-[#12161c]/90 shadow-[0_8px_24px_rgba(139,92,246,0.08)]'
                : 'border border-white/[0.1] bg-[#12161c]/90'
            }`}
          >
            <p className="text-sm leading-[1.75] text-slate-100/92">{text}</p>
          </article>
        ))}
      </div>
      <ProseExtras blocks={blocks} />
    </div>
  );
}

/** Trois rôles : grille 3 colonnes (ou 1 col mobile / demi-colonne). */
export function FamilyRolesTrio({ blocks, narrow = false }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  if (titled.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  return (
    <div className={`grid gap-3 ${narrow ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
      {titled.map((card, i) => (
        <article
          key={i}
          className="rounded-xl border-t-[3px] border-t-emerald-400/70 border border-white/[0.08] bg-[#101820]/95 px-4 py-4 sm:px-5"
        >
          <span className="text-[10px] tabular-nums text-emerald-400/60 font-bold">{String(i + 1).padStart(2, '0')}</span>
          <h4 className="text-sm font-semibold text-white mt-1 mb-2.5 leading-snug">{card.title}</h4>
          <TitledCardBody card={card} />
        </article>
      ))}
    </div>
  );
}

/** Guide long (exercices-core) : chapitres empilés avec barre de couleur. */
export function FamilyGuideChapters({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const lead = cards.find((c) => !c.title && c.body.length);
  const titled = cards.filter((c) => c.title);
  const barColors = ['bg-emerald-400', 'bg-[#3897F0]', 'bg-cyan-400', 'bg-violet-400'];

  return (
    <div className="space-y-4">
      {lead ? (
        <p className="text-sm leading-[1.7] text-slate-100/88 border-l-2 border-emerald-400/50 pl-4">
          {lead.body.join(' ')}
        </p>
      ) : null}
      <div className="space-y-2">
        {titled.map((card, i) => (
          <article
            key={i}
            className="group rounded-lg border border-white/[0.07] bg-[#0e1218]/90 overflow-hidden"
          >
            <div className={`h-1 ${barColors[i % barColors.length]}/80`} />
            <div className="px-4 py-3.5 sm:px-5">
              <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
              <TitledCardBody card={card} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Biomécanique : timeline verticale. */
export function FamilyTimeline({ blocks, narrow = false }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);

  return (
    <div className="relative pl-6 sm:pl-8">
      <div className="absolute left-[11px] sm:left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-[#3897F0]/60 via-cyan-400/30 to-transparent" aria-hidden />
      <div className="space-y-6">
        {titled.map((card, i) => (
          <article key={i} className="relative">
            <span
              className={`absolute -left-6 sm:-left-8 top-1.5 h-3 w-3 rounded-full border-2 border-[#0f1419] ${familyDotClassForIndex(i)}`}
              aria-hidden
            />
            <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
            <TitledCardBody card={card} />
          </article>
        ))}
      </div>
    </div>
  );
}

/** Blessures : pile alternée rose. */
export function FamilyAlertStack({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const paragraphs = paragraphsFromBlocks(blocks);
  const items = cards.filter((c) => c.title).length ? cards.filter((c) => c.title) : null;

  if (items) {
    return (
      <div className="space-y-3">
        {items.map((card, i) => (
          <article
            key={i}
            className={`rounded-xl border border-rose-400/25 px-4 py-4 sm:px-5 ${
              i % 2 === 0 ? 'bg-rose-950/25 ml-0' : 'bg-rose-950/15 ml-0 sm:ml-6'
            }`}
          >
            <h4 className="text-sm font-semibold text-rose-100/95 mb-2">{card.title}</h4>
            <TitledCardBody card={card} />
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((text, i) => (
        <article
          key={i}
          className="rounded-xl border border-rose-400/30 bg-rose-950/20 px-4 py-3.5 text-sm leading-[1.7] text-rose-50/90"
        >
          {text}
        </article>
      ))}
    </div>
  );
}

/** Momentum / vision inline — un paragraphe mis en avant. */
export function FamilyCalloutVision({ blocks }) {
  const paragraphs = paragraphsFromBlocks(blocks);
  const text = paragraphs.join('\n\n') || '';
  if (!text) return <ProseExtras blocks={blocks} />;

  return (
    <div className="rounded-2xl border border-[#3897F0]/45 bg-gradient-to-br from-[#3897F0]/[0.2] via-[#0c1520] to-[#060a10] px-5 py-5 sm:px-7 sm:py-6 shadow-[0_16px_48px_rgba(56,151,240,0.1),inset_0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(94,176,255,0.12),transparent_45%)]" aria-hidden />
      <p className="relative text-sm md:text-[15px] leading-[1.78] text-slate-50/95 whitespace-pre-line">{text}</p>
      <ProseExtras blocks={blocks} />
    </div>
  );
}

/** Texte continu avec encadré léger. */
export function FamilyNarrativeInset({ blocks }) {
  const paragraphs = paragraphsFromBlocks(blocks);
  const rest = (blocks || []).filter((b) => b.type !== 'p');

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#121820]/60 px-4 py-4 sm:px-6 sm:py-5 space-y-4">
      {paragraphs.map((text, i) => (
        <p key={i} className="text-sm leading-[1.75] text-slate-100/90">
          {text}
        </p>
      ))}
      {rest.length > 0 ? <ProseExtras blocks={rest} /> : null}
    </div>
  );
}

/** Deux cartes titrées côte à côte. */
export function FamilyDuoTitled({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const titled = cards.filter((c) => c.title);
  if (titled.length === 0) return <FamilyNarrativeFlow blocks={blocks} />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {titled.map((card, i) => (
        <article
          key={i}
          className="rounded-xl border border-white/[0.1] bg-[#141b24]/90 px-4 py-4 sm:px-5"
        >
          <h4 className="text-sm font-semibold text-white mb-2.5 leading-snug">{card.title}</h4>
          <TitledCardBody card={card} />
        </article>
      ))}
    </div>
  );
}

/** Mix h3 + p sans layout spécial. */
export function FamilyPrinciplesMix({ blocks }) {
  const cards = useMemo(() => cardsFromBlocks(blocks), [blocks]);
  const leadParas = paragraphsFromBlocks(blocks);
  const titled = cards.filter((c) => c.title);

  return (
    <div className="space-y-4">
      {leadParas.length > 0 && titled.length === 0 ? (
        <FamilyNarrativeFlow blocks={blocks} />
      ) : (
        <>
          {titled.length >= 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {titled.slice(0, 2).map((card, i) => (
                <article key={i} className="rounded-xl border border-[#3897F0]/20 bg-[#0f1419] px-4 py-4">
                  <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
                  <TitledCardBody card={card} />
                </article>
              ))}
            </div>
          ) : null}
          {titled.slice(2).map((card, i) => (
            <article key={i} className="rounded-xl border border-white/[0.08] px-4 py-3.5">
              <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
              <TitledCardBody card={card} />
            </article>
          ))}
        </>
      )}
    </div>
  );
}

export function FamilyNarrativeFlow({ blocks }) {
  const paragraphs = paragraphsFromBlocks(blocks);
  const rest = (blocks || []).filter((b) => b.type !== 'p');
  if (paragraphs.length === 0 && rest.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((text, i) => (
        <p
          key={i}
          className={`leading-[1.75] text-slate-100/90 ${
            i === 0 ? 'text-[15px] text-slate-50/95' : 'text-sm pt-4 border-t border-white/[0.08]'
          }`}
        >
          {text}
        </p>
      ))}
      <ProseExtras blocks={rest} />
    </div>
  );
}

export function FamilySectionComposer({ section, columnWidth = 'full' }) {
  const direction = resolveFamilyArtDirection(section);
  const blocks = section?.blocks || [];
  const narrow = columnWidth === 'half';
  const layoutProps = { blocks, narrow };

  switch (direction) {
    case 'errors-bento':
      return <FamilyErrorsBento {...layoutProps} />;
    case 'insight-feature':
      return <FamilyInsightFeature {...layoutProps} />;
    case 'faq-bento':
      return <FamilyFaqBento {...layoutProps} />;
    case 'synth-dual':
      return <FamilySynthDual {...layoutProps} />;
    case 'roles-trio':
      return <FamilyRolesTrio {...layoutProps} />;
    case 'guide-chapters':
      return <FamilyGuideChapters blocks={blocks} />;
    case 'timeline':
      return <FamilyTimeline blocks={blocks} narrow={narrow} />;
    case 'alert-stack':
      return <FamilyAlertStack blocks={blocks} />;
    case 'callout-vision':
      return <FamilyCalloutVision blocks={blocks} />;
    case 'narrative-inset':
      return <FamilyNarrativeInset blocks={blocks} />;
    case 'duo-titled':
      return <FamilyDuoTitled blocks={blocks} />;
    case 'principles-mix':
      return <FamilyPrinciplesMix blocks={blocks} />;
    case 'narrative-flow':
    default:
      return <FamilyNarrativeFlow blocks={blocks} />;
  }
}
