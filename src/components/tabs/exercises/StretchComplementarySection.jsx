import React, { useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { rankComplementaryExerciseKeysForStretch } from '../../../utils/stretchComplementaryExercises';
import { buildBankExerciseViewFromDatabaseKey } from '../../../utils/exerciseBankViewModel';
import SportBankExerciseCard from '../../sport/SportBankExerciseCard';
import { resolveExerciseIntensityCoeff } from '../../../utils/trainingLoadUtils';

const CAROUSEL_BATCH = 220;
const CARD_MIN_W = 260;

export default function StretchComplementarySection({
  stretch,
  data,
  onOpenExercise,
  maxRecordsByExerciseId,
  onRequestAddToProgram,
  isAuthenticated
}) {
  const t = useTranslation();
  const scrollerRef = useRef(null);

  const ranked = useMemo(
    () => rankComplementaryExerciseKeysForStretch(stretch, { limit: CAROUSEL_BATCH }),
    [stretch]
  );

  const views = useMemo(
    () =>
      ranked
        .map(({ key }) => buildBankExerciseViewFromDatabaseKey(key, t))
        .filter(Boolean),
    [ranked, t]
  );

  const intensityCoeffs = data?.exerciseIntensityCoeffs || {};

  const scrollBy = useCallback((dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.max(CARD_MIN_W + 16, Math.floor(el.clientWidth * 0.85)) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  if (!views.length || typeof onOpenExercise !== 'function') return null;

  return (
    <div className="rounded-2xl border border-[#0F4C5C]/75 bg-black p-4 sm:p-5 space-y-4 ring-1 ring-[#0F5C45]/40 shadow-[0_0_24px_-12px_rgba(15,92,69,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-teal-400/95">
          {t(
            'stretchesTab.complementary.title',
            'Exercices de force complémentaires'
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[#0F5C45]/50 bg-[#0F5C45]/20 p-2 text-teal-100 hover:bg-[#0F5C45]/35 transition disabled:opacity-35"
            aria-label={t('exercisesTab.detail.similar.scrollPrev', 'Voir les cartes précédentes')}
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#0F5C45]/50 bg-[#0F5C45]/20 p-2 text-teal-100 hover:bg-[#0F5C45]/35 transition disabled:opacity-35"
            aria-label={t('exercisesTab.detail.similar.scrollNext', 'Voir les cartes suivantes')}
            onClick={() => scrollBy(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {t(
          'stretchesTab.complementary.hint',
          'Propositions basées sur les mêmes critères que les « exercices similaires » (muscles, catégorie, équipement) pour relier étirements et séances de force.'
        )}
      </p>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label={t('stretchesTab.complementary.region', 'Exercices complémentaires')}
      >
        {views.map((ex) => (
          <div
            key={ex.id}
            className="w-[min(100%,280px)] shrink-0 snap-start"
            style={{ minWidth: CARD_MIN_W }}
          >
            <SportBankExerciseCard
              exercise={ex}
              onOpenDetail={onOpenExercise}
              effectiveLoadCoeff={resolveExerciseIntensityCoeff(ex, intensityCoeffs)}
              hasRecordedMax={maxRecordsByExerciseId?.has(String(ex.id))}
              maxRecord={maxRecordsByExerciseId?.get(String(ex.id)) || null}
              showAddButton={Boolean(isAuthenticated && onRequestAddToProgram)}
              onRequestAddToProgram={onRequestAddToProgram}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
