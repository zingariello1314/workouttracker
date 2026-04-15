import React, { useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { recapIntensityGradientStops } from '../../../utils/sport/recapIntensityColors';

/** Échelle d’intensité affichée (repères sémantiques — couleurs indicatives). */
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

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return { r: 203, g: 213, b: 226 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  const x = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${x(r)}${x(g)}${x(b)}`;
}

function lerpHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex(
    A.r + (B.r - A.r) * k,
    A.g + (B.g - A.g) * k,
    A.b + (B.b - A.b) * k
  );
}

/**
 * Liste étendue : chaque palier « principal » + une nuance intermédiaire vers le suivant
 * (couleur = milieu du segment sur la palette affichée).
 */
function buildExpandedLegendRows() {
  const rows = [];
  for (let i = 0; i < INTENSITY_STEPS.length; i++) {
    rows.push({ ...INTENSITY_STEPS[i], variant: 'main' });
    if (i < INTENSITY_STEPS.length - 1) {
      const midColor = lerpHex(INTENSITY_STEPS[i].color, INTENSITY_STEPS[i + 1].color, 0.5);
      rows.push({ key: 'recap.legend.level.midTransition', color: midColor, variant: 'mid' });
    }
  }
  return rows;
}

/**
 * Légende charge / intensité pour le Récap (spectre continu + paliers détaillés).
 */
const RecapIntensityLegend = () => {
  const t = useTranslation();

  const expandedRows = useMemo(() => buildExpandedLegendRows(), []);
  const spectrumStops = useMemo(() => recapIntensityGradientStops(40, 1.08), []);
  const spectrumCss = useMemo(
    () => `linear-gradient(90deg, ${spectrumStops.map((s) => `${s.color} ${(s.offset * 100).toFixed(2)}%`).join(', ')})`,
    [spectrumStops]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">{t('recap.legendIntro')}</p>

      <div className="rounded-lg border border-slate-600/60 bg-slate-950/40 p-3 space-y-2">
        <p className="text-[11px] font-medium text-slate-300">{t('recap.legendSpectrumTitle')}</p>
        <div
          className="h-4 w-full rounded-md border border-white/15 shadow-inner"
          style={{ background: spectrumCss }}
          role="img"
          aria-label={t('recap.legendSpectrumAria')}
        />
        <p className="text-[10px] text-slate-500 leading-snug">{t('recap.legendSpectrumCaption')}</p>
        <p className="text-[10px] text-slate-500 tabular-nums">{t('recap.legendSpectrumEnds')}</p>
      </div>

      <ul className="space-y-1 max-h-[min(40vh,360px)] overflow-y-auto pr-1">
        {expandedRows.map((row, idx) => (
          <li
            key={`${row.key}-${idx}`}
            className={`flex items-center gap-2.5 text-xs leading-snug ${
              row.variant === 'mid' ? 'text-slate-400 pl-1' : 'text-slate-200'
            }`}
          >
            <span
              className={`shrink-0 rounded-sm border border-white/20 shadow-sm ${
                row.variant === 'mid' ? 'h-3 w-3 opacity-90' : 'h-3.5 w-3.5'
              }`}
              style={{ backgroundColor: row.color }}
              aria-hidden
            />
            <span>{t(row.key)}</span>
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
