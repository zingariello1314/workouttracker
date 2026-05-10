import React, { useMemo } from 'react';
import { Heart, Moon, Sparkles, Star } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import {
  computeStretchCategoryMeans,
  computeStretchWeightedGlobal5,
  computeStretchXpFromRating,
  getStretchWeightDisplay,
  STRETCH_V2_KEYS,
  emptyStretchPerceivedDraft
} from '../../../utils/stretchPerceivedRatings';

const SPORT_CARD =
  'rounded-2xl border border-[#0F4C5C]/75 bg-black p-4 sm:p-5 ring-1 ring-[#0F5C45]/35 shadow-[0_0_24px_-12px_rgba(15,92,69,0.35)]';

function WeightBadge({ w }) {
  return (
    <span className="shrink-0 rounded-md border border-sky-500/45 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200 tabular-nums">
      × {w}
    </span>
  );
}

function StretchFiveSlider({
  sliderKey,
  label,
  lowLabel,
  highLabel,
  value,
  readOnly,
  onChange,
  t
}) {
  const v = Number(value) || 0;
  const id = `stretch-ressenti-${sliderKey}`;
  const w = getStretchWeightDisplay(sliderKey);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <label htmlFor={id} className="text-xs font-semibold text-teal-100/95">
            {label}
          </label>
          <p className="text-[10px] text-slate-500 leading-snug">
            <span className="text-slate-600">1</span> · {lowLabel}{' '}
            <span className="mx-1 text-slate-700">→</span> <span className="text-slate-600">5</span> · {highLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WeightBadge w={w} />
          {v > 0 ? (
            <span className="text-[11px] tabular-nums text-sky-300 font-medium">{v}/5</span>
          ) : (
            <span className="text-[10px] text-slate-600">{t('stretchesTab.ressenti.unset', '—')}</span>
          )}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={5}
        step={1}
        disabled={readOnly}
        value={v}
        onChange={(e) => onChange(sliderKey, Number(e.target.value))}
        className="w-full h-2 accent-sky-500 rounded-full bg-slate-800 appearance-none cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed [color-scheme:dark]"
      />
    </div>
  );
}

/**
 * Bloc notation pondérée 7 curseurs → note /5 → XP prévisualisée (charte Sport).
 */
export default function StretchRessentiPanel({
  draft,
  readOnly,
  onDraftChange,
  xpPreview,
  xpNumeric
}) {
  const t = useTranslation();

  const means = useMemo(() => computeStretchCategoryMeans(draft), [draft]);

  const global5 = useMemo(() => computeStretchWeightedGlobal5(draft), [draft]);

  const weightSum = STRETCH_V2_KEYS.reduce((s, k) => s + getStretchWeightDisplay(k), 0);

  const xp = xpNumeric ?? computeStretchXpFromRating({ ...draft });

  const setSlider = (key, n) => {
    const next = typeof draft === 'object' && draft ? { ...draft } : emptyStretchPerceivedDraft();
    next[key] = Math.max(0, Math.min(5, Number(n) || 0));
    onDraftChange(next);
  };

  const fmtMean = (m) =>
    m == null ? '—' : `${(Math.round(m * 10) / 10).toFixed(1)}/5`;

  return (
    <div className={`${SPORT_CARD} space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-teal-400/95 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#58d4aa]" />
            {t('stretchesTab.ressenti.title', 'Mon ressenti sur cet étirement')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
            {t(
              'stretchesTab.ressenti.subtitle',
              'Note globale calculée automatiquement à partir des critères renseignés — pilote ton XP.'
            )}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/55 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100 tabular-nums">
          <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {xp} XP
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Moon className="w-4 h-4 text-sky-400/90" />
            {t('stretchesTab.ressenti.blockDuring', 'Sensation pendant l’étirement')}
          </h4>
          <StretchFiveSlider
            sliderKey="stretchIntensityFeel"
            label={t('stretchesTab.ressenti.intensityFeel', 'Intensité de l’étirement ressenti')}
            lowLabel={t('stretchesTab.ressenti.intensityFeelLow', 'à peine ressenti')}
            highLabel={t('stretchesTab.ressenti.intensityFeelHigh', 'tension forte mais tenable')}
            value={draft.stretchIntensityFeel}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
          <StretchFiveSlider
            sliderKey="holdEase"
            label={t('stretchesTab.ressenti.holdEase', 'Facilité à tenir la position')}
            lowLabel={t('stretchesTab.ressenti.holdEaseLow', 'difficile de rester')}
            highLabel={t('stretchesTab.ressenti.holdEaseHigh', 'très confortable')}
            value={draft.holdEase}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
          <StretchFiveSlider
            sliderKey="painfulDiscomfort"
            label={t('stretchesTab.ressenti.painfulDiscomfort', 'Inconfort douloureux')}
            lowLabel={t('stretchesTab.ressenti.painLow', 'pas d’inconfort')}
            highLabel={t('stretchesTab.ressenti.painHigh', 'douleur vive à signaler')}
            value={draft.painfulDiscomfort}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
        </div>

        <div className="space-y-4 border-t border-[#0F4C5C]/40 pt-5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400/90" />
            {t('stretchesTab.ressenti.blockAfter', 'Effet ressenti après')}
          </h4>
          <StretchFiveSlider
            sliderKey="relaxationAfter"
            label={t('stretchesTab.ressenti.relaxAfter', 'Sensation de relâchement obtenu')}
            lowLabel={t('stretchesTab.ressenti.relaxLow', 'pas d’effet notable')}
            highLabel={t('stretchesTab.ressenti.relaxHigh', 'relâchement profond, muscles lâchés')}
            value={draft.relaxationAfter}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
          <StretchFiveSlider
            sliderKey="mobilityAfter"
            label={t('stretchesTab.ressenti.mobilityAfter', 'Mobilité améliorée juste après')}
            lowLabel={t('stretchesTab.ressenti.mobilityLow', 'pas de différence')}
            highLabel={t('stretchesTab.ressenti.mobilityHigh', 'amplitude nettement augmentée')}
            value={draft.mobilityAfter}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
        </div>

        <div className="space-y-4 border-t border-[#0F4C5C]/40 pt-5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#58d4aa]" />
            {t('stretchesTab.ressenti.blockMotivation', 'Motivation & régularité')}
          </h4>
          <StretchFiveSlider
            sliderKey="wantRegular"
            label={t('stretchesTab.ressenti.wantRegular', 'Envie de le refaire régulièrement')}
            lowLabel={t('stretchesTab.ressenti.wantLow', 'j’ai tendance à l’éviter')}
            highLabel={t('stretchesTab.ressenti.wantHigh', 'j’ai hâte de le refaire')}
            value={draft.wantRegular}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
          <StretchFiveSlider
            sliderKey="goalFit"
            label={t('stretchesTab.ressenti.goalFit', 'Pertinence perçue pour tes objectifs')}
            lowLabel={t('stretchesTab.ressenti.goalLow', 'pas aligné avec mes besoins')}
            highLabel={t('stretchesTab.ressenti.goalHigh', 'exactement ce dont j’ai besoin')}
            value={draft.goalFit}
            readOnly={readOnly}
            onChange={setSlider}
            t={t}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[11px] border-t border-[#0F4C5C]/40 pt-4">
        <div>
          <p className="text-slate-600 uppercase tracking-wide">{t('stretchesTab.ressenti.avgDuring', 'Sensation')}</p>
          <p className="text-teal-100 font-semibold tabular-nums mt-0.5">{fmtMean(means.during)}</p>
        </div>
        <div>
          <p className="text-slate-600 uppercase tracking-wide">{t('stretchesTab.ressenti.avgAfter', 'Effet après')}</p>
          <p className="text-teal-100 font-semibold tabular-nums mt-0.5">{fmtMean(means.after)}</p>
        </div>
        <div>
          <p className="text-slate-600 uppercase tracking-wide">{t('stretchesTab.ressenti.avgMotivation', 'Motivation')}</p>
          <p className="text-teal-100 font-semibold tabular-nums mt-0.5">{fmtMean(means.motivation)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm pt-2">
        <div>
          <p className="text-[11px] text-slate-600 uppercase tracking-wide font-medium">
            {t('stretchesTab.ressenti.weightedTotal', 'Note globale pondérée')}
          </p>
          <p className="text-xl font-bold text-sky-400 tabular-nums">
            {global5 == null ? '— /5' : `${(Math.round(global5 * 100) / 100).toFixed(1)} /5`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-600">{t('stretchesTab.ressenti.coeffLabel', 'Coeff. combinés')}</p>
          <p className="text-xs font-medium text-slate-400 tabular-nums">
            Σ {weightSum.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-600/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-amber-50/95">
          {xpPreview ??
            t('stretchesTab.ressenti.xpBarCaption', 'XP estimé par coche avec cette note')}
        </span>
        <span className="text-xs font-bold text-amber-100 tabular-nums inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          {xp} XP
        </span>
      </div>

      <p className="text-[10px] text-slate-600 leading-snug">
        {t(
          'stretchesTab.ressenti.sliderHint',
          'Curseur à gauche sur « — » = critère ignoré dans le score. Plus tu précises tes ressentis, plus l’XP reflète ta séance.'
        )}
      </p>
    </div>
  );
}
