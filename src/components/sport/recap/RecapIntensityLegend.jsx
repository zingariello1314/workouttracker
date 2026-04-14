import React from 'react';
import { useTranslation } from '../../../utils/translations';

/** Échelle d’intensité affichée (alignée sur la spec produit — couleurs indicatives). */
const INTENSITY_STEPS = [
  { key: 'recap.legend.level.rest', color: '#cbd5e1' },
  { key: 'recap.legend.level.veryLow', color: '#7dd3fc' },
  { key: 'recap.legend.level.undertrained', color: '#38bdf8' },
  { key: 'recap.legend.level.light', color: '#86efac' },
  { key: 'recap.legend.level.optimal', color: '#22c55e' },
  { key: 'recap.legend.level.moderateHigh', color: '#facc15' },
  { key: 'recap.legend.level.high', color: '#fdba74' },
  { key: 'recap.legend.level.nearOverload', color: '#fb923c' },
  { key: 'recap.legend.level.overload', color: '#f87171' },
  { key: 'recap.legend.level.severe', color: '#dc2626' },
  { key: 'recap.legend.level.overtraining', color: '#a855f7' },
  { key: 'recap.legend.level.critical', color: '#3f0f14' }
];

/**
 * Légende charge / intensité pour le Récap (lisible immédiatement).
 */
const RecapIntensityLegend = () => {
  const t = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">{t('recap.legendIntro')}</p>
      <ul className="space-y-1.5 max-h-[min(40vh,320px)] overflow-y-auto pr-1">
        {INTENSITY_STEPS.map(({ key, color }) => (
          <li key={key} className="flex items-center gap-2.5 text-xs text-slate-200">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20 shadow-sm"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span className="leading-snug">{t(key)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-3 border-t border-slate-700/60">
        <p className="text-xs font-semibold text-slate-300 mb-2">{t('recap.legendRecoveryTitle')}</p>
        <ul className="space-y-1.5 text-xs text-slate-200">
          <li className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>
              🟢
            </span>
            {t('recap.legendRecovery.ready')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>
              🟡
            </span>
            {t('recap.legendRecovery.inProgress')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>
              🔴
            </span>
            {t('recap.legendRecovery.fatigued')}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RecapIntensityLegend;
