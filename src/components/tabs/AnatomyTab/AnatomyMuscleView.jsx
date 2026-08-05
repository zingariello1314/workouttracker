import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { getAnatomyFamily, getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';
import { getMuscleContent, hasMuscleContent } from '../../../data/anatomy/anatomyContent';
import { AnatomySectionPanel } from './AnatomyContentRenderer';
import AnatomyMuscleRail from './AnatomyMuscleRail';

const EXTRA_NAV = [
  { id: 'morphologie', title: 'Morphologie' },
  { id: 'faq', title: 'Questions fréquentes' }
];

function extractRelatedLines(content) {
  const rec = content?.sections?.find((s) => s.id === 'recrutement');
  if (!rec?.blocks) return [];
  return rec.blocks
    .filter((b) => b.type === 'p' && b.text)
    .map((b) => b.text)
    .slice(0, 4);
}

export default function AnatomyMuscleView({ muscleId, onOpenMuscle }) {
  const t = useTranslation();
  const muscle = getAnatomyMuscle(muscleId);
  const family = muscle ? getAnatomyFamily(muscle.familyId) : null;
  const content = getMuscleContent(muscleId);

  const navItems = useMemo(() => {
    const fromContent = (content?.sections || []).map((s) => ({ id: s.id, title: s.title }));
    const ids = new Set(fromContent.map((x) => x.id));
    const extra = EXTRA_NAV.filter((e) => !ids.has(e.id));
    return [...fromContent, ...extra];
  }, [content?.sections]);

  const [activeSectionId, setActiveSectionId] = useState(() => navItems[0]?.id || 'presentation');

  const activeSection = useMemo(() => {
    const found = content?.sections?.find((s) => s.id === activeSectionId);
    if (found) return found;
    if (activeSectionId === 'faq' || activeSectionId === 'morphologie') {
      return {
        id: activeSectionId,
        title: EXTRA_NAV.find((e) => e.id === activeSectionId)?.title || activeSectionId,
        blocks: [
          {
            type: 'p',
            text: t('anatomy.contentSoon', 'Contenu détaillé en cours de rédaction.')
          }
        ]
      };
    }
    return null;
  }, [activeSectionId, content?.sections, t]);

  const relatedMuscles = useMemo(() => extractRelatedLines(content), [content]);

  const onNavClick = useCallback((id) => {
    setActiveSectionId(id);
    if (typeof document !== 'undefined') {
      document.getElementById('anatomy-muscle-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (!muscle) {
    return (
      <p className="text-slate-400">{t('anatomy.muscleNotFound', 'Muscle introuvable.')}</p>
    );
  }

  return (
    <div className="pb-20">
      <div className="lg:grid lg:grid-cols-[minmax(140px,168px)_minmax(0,1fr)_minmax(240px,280px)] lg:gap-6 xl:gap-8 items-start">
        <nav className="hidden lg:flex flex-col gap-0.5 sticky top-[10.5rem]">
          {navItems.map((item) => {
            const active = item.id === activeSectionId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavClick(item.id)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'bg-cyan-950/50 text-cyan-100 font-medium'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </nav>

        <div id="anatomy-muscle-main" className="min-w-0 space-y-5">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-500/80">
              {t('anatomy.sheetLabel', 'Fiche muscle')} · {family?.name}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{muscle.name}</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{muscle.summary}</p>
          </header>

          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavClick(item.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs border ${
                  item.id === activeSectionId
                    ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-100'
                    : 'border-slate-700 text-slate-500'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {activeSection ? <AnatomySectionPanel section={activeSection} /> : null}

          {!hasMuscleContent(muscleId) && activeSectionId === 'presentation' ? (
            <p className="text-sm text-slate-500 italic">
              {t('anatomy.contentSoon', 'Contenu détaillé en cours de rédaction.')}
            </p>
          ) : null}
        </div>

        <AnatomyMuscleRail muscleId={muscleId} relatedMuscles={relatedMuscles} />
      </div>
    </div>
  );
}
