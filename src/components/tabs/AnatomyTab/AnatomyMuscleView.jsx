import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { getAnatomyFamily, getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';
import { getMuscleContent, hasMuscleContent } from '../../../data/anatomy/anatomyContent';
import { AnatomySectionPanel } from './AnatomyContentRenderer';
import AnatomyMuscleRail from './AnatomyMuscleRail';
import { ANATOMY } from './anatomyTheme';

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
    return (content?.sections || []).map((s) => ({ id: s.id, title: s.title }));
  }, [content?.sections]);

  const [activeSectionId, setActiveSectionId] = useState(() => navItems[0]?.id || 'presentation');

  const activeSection = useMemo(() => {
    const found = content?.sections?.find((s) => s.id === activeSectionId);
    if (found) return found;
    return null;
  }, [activeSectionId, content?.sections, t]);

  const relatedMuscles = useMemo(() => extractRelatedLines(content), [content]);

  const onNavClick = useCallback((id) => {
    setActiveSectionId(id);
  }, []);

  if (!muscle) {
    return (
      <p className="text-slate-400">{t('anatomy.muscleNotFound', 'Muscle introuvable.')}</p>
    );
  }

  return (
    <div className="pb-20">
      <div className="lg:grid lg:grid-cols-[minmax(148px,180px)_minmax(0,1fr)_minmax(248px,300px)] lg:gap-6 xl:gap-8 items-start">
        <nav className={`hidden lg:flex flex-col gap-0.5 sticky top-28 ${ANATOMY.card} ${ANATOMY.cardPad} py-3`}>
          {navItems.map((item) => {
            const active = item.id === activeSectionId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavClick(item.id)}
                className={active ? ANATOMY.navOn : ANATOMY.navOff}
              >
                {item.title}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          <header className="space-y-2">
            <p className={ANATOMY.sheetKicker}>
              {t('anatomy.sheetLabel', 'Fiche muscle')} · {family?.name}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{muscle.name}</h1>
            <p className={ANATOMY.summary}>{muscle.summary}</p>
          </header>

          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavClick(item.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs border ${
                  item.id === activeSectionId ? ANATOMY.tabOn : ANATOMY.tabOff
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
