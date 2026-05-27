import React, { useMemo, useState } from 'react';
import { getAnatomyPreviewRasterSrc } from '../../utils/anatomy/anatomyPreviewRasterKey';

const PREVIEW_FRAME =
  'border-2 border-[#0F4C5C]/90 bg-black shadow-[0_0_18px_-5px_rgba(15,76,92,0.75),0_0_28px_-12px_rgba(15,92,69,0.35)]';

/**
 * Aperçu banque grille : image WebP pré-générée depuis le GLB (zéro WebGl par carte).
 * Fallback visuel si le fichier absente tant que le batch de rendu n’est pas passé.
 */
export default function AnatomyBankCardRaster({ anatomy, mode = 'exercise', className = '', webglFallback = null }) {
  const src = useMemo(() => getAnatomyPreviewRasterSrc(anatomy, mode === 'stretch' ? 'stretch' : 'exercise'), [anatomy, mode]);
  const [broken, setBroken] = useState(false);

  /** Une seule boîte bordée : remplit la ligne grille (ex. h-[300px]) sans sous-cadre 5/4 + letterboxing. */
  const frameClass = `h-full w-full min-h-0 rounded-xl overflow-hidden ${PREVIEW_FRAME} outline-none`;

  return (
    <div className={`h-full w-full min-h-0 shrink-0 pointer-events-none select-none ${className}`} aria-hidden>
      <div className={frameClass}>
        {!broken ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover object-center bg-black"
            onError={() => setBroken(true)}
          />
        ) : webglFallback ? (
          <div className="h-full w-full min-h-[180px]">{webglFallback}</div>
        ) : (
          <div className="flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-950 to-black px-4 text-center">
            <span className="text-[11px] font-medium uppercase tracking-wide text-teal-700">Anatomie</span>
            <span className="text-[11px] leading-snug text-teal-600/85">
              Image de prévisualisation à générer (.webp).
              <br />
              Vue 3D interactive sur la fiche.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
