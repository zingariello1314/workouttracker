import React from 'react';
import { Info } from 'lucide-react';

/**
 * Encadré explicatif au-dessus du heatmap sport : signaux de teinte + volumes kg×reps (dédupliqués).
 */
export default function SportCalendarColorFactorsPanel({ t, volume7dKg, volumeAllKg }) {
  const fmt = (n) =>
    Math.round(Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  return (
    <div className="mb-4 rounded-xl border-2 border-[#0F4C5C]/65 bg-black/90 p-4 text-left shadow-inner shadow-black/30">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-100">
        <Info className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
        {t('calendar.heatmapIntensityFactors.title')}
      </div>
      <p className="mb-3 text-xs leading-relaxed text-teal-200/80">
        {t('calendar.heatmapIntensityFactors.intro')}
      </p>
      <ul className="mb-4 list-inside list-disc space-y-1.5 text-[11px] leading-snug text-teal-100/85">
        <li>{t('calendar.heatmapIntensityFactors.bulletLevel')}</li>
        <li>{t('calendar.heatmapIntensityFactors.bulletLoad')}</li>
        <li>{t('calendar.heatmapIntensityFactors.bulletGarmin')}</li>
        <li>{t('calendar.heatmapIntensityFactors.bulletProgram')}</li>
        <li>{t('calendar.heatmapIntensityFactors.bulletFeedback')}</li>
        <li>{t('calendar.heatmapIntensityFactors.bulletVolumeRel')}</li>
      </ul>
      <div className="rounded-lg border border-[#0F5C45]/45 bg-teal-950/20 px-3 py-2 text-[11px] text-teal-100/90">
        <div className="mb-1 font-medium text-cyan-200/90">
          {t('calendar.heatmapIntensityFactors.volumeHeading')}
        </div>
        <div className="tabular-nums text-white">
          {t('calendar.heatmapIntensityFactors.volume7d', { kg: fmt(volume7dKg) })}
        </div>
        <div className="mt-1 tabular-nums text-white">
          {t('calendar.heatmapIntensityFactors.volumeAll', { kg: fmt(volumeAllKg) })}
        </div>
        <p className="mt-2 border-t border-[#0F4C5C]/40 pt-2 text-[10px] leading-snug text-teal-500/95">
          {t('calendar.heatmapIntensityFactors.volumeDedupeNote')}
        </p>
      </div>
    </div>
  );
}
