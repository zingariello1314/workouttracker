import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';

/**
 * Fixé sous la double barre Sport (nav principale + sous-onglets).
 */
export default function AnatomyStickyNav({
  onBackHome,
  onBackFamily,
  familyName,
  title,
  subtitle
}) {
  const t = useTranslation();

  return (
    <>
      <div
        className="sticky z-[38] -mx-4 px-4 py-3 md:-mx-8 md:px-8 mb-5 border-b border-slate-700/50 bg-[#0a0f14]/92 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        style={{ top: '8.25rem' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 border border-slate-600/50 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/80 transition-colors"
              >
                <Home className="h-3.5 w-3.5 opacity-70" />
                {t('anatomy.backHome', 'Accueil')}
              </button>
              {onBackFamily && familyName ? (
                <button
                  type="button"
                  onClick={onBackFamily}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/40 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {familyName}
                </button>
              ) : null}
            </div>
            {title ? (
              <div className="lg:text-right min-w-0">
                <h1 className="text-lg md:text-xl font-semibold text-white truncate">{title}</h1>
                {subtitle ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-xl lg:ml-auto">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onBackFamily || onBackHome}
        className="fixed bottom-6 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-slate-600/60 bg-slate-950/95 px-4 py-2.5 text-sm text-slate-100 shadow-xl lg:hidden"
        aria-label={t('anatomy.backShort', 'Retour')}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('anatomy.backShort', 'Retour')}
      </button>
    </>
  );
}
