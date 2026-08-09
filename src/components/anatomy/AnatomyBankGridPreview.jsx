import React, { useEffect, useMemo, useState } from 'react';
import {
  anatomyRasterFileBase,
  getAnatomyPreviewRasterSrc
} from '../../utils/anatomy/anatomyPreviewRasterKey';
import {
  anatomyPreviewStemHasFile,
  loadAnatomyPreviewStemSet,
  peekAnatomyPreviewStemSet
} from '../../utils/anatomy/anatomyPreviewStemIndex';
import {
  getSessionPreviewUrl,
  setSessionPreviewUrl,
  subscribeSessionPreviewCache
} from '../../utils/anatomy/anatomyPreviewSessionCache';
import { useAnatomyPreviewCapture } from './AnatomyPreviewCaptureProvider';

const PREVIEW_FRAME =
  'border-2 border-[#0F4C5C]/90 bg-black shadow-[0_0_18px_-5px_rgba(15,76,92,0.75),0_0_28px_-12px_rgba(15,92,69,0.35)]';

/**
 * Grille banque : image statique (WebP disque ou cache session), un seul WebGL global pour les manquants.
 */
export default function AnatomyBankGridPreview({ anatomy, mode = 'exercise', className = '' }) {
  const capture = useAnatomyPreviewCapture();
  const modeStr = mode === 'stretch' ? 'stretch' : 'exercise';
  const stem = useMemo(() => anatomyRasterFileBase(anatomy, modeStr), [anatomy, modeStr]);
  const fileSrc = useMemo(() => getAnatomyPreviewRasterSrc(anatomy, modeStr), [anatomy, modeStr]);

  const [indexReady, setIndexReady] = useState(() => peekAnatomyPreviewStemSet() != null);
  const [displaySrc, setDisplaySrc] = useState(() => {
    const cached = getSessionPreviewUrl(stem);
    if (cached) return cached;
    if (peekAnatomyPreviewStemSet()?.has(stem)) return fileSrc;
    return null;
  });

  useEffect(() => {
    let cancelled = false;
    loadAnatomyPreviewStemSet().then(() => {
      if (!cancelled) setIndexReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cached = getSessionPreviewUrl(stem);
    if (cached) {
      setDisplaySrc(cached);
      return undefined;
    }

    const unsub = subscribeSessionPreviewCache((updatedStem) => {
      if (updatedStem === stem) {
        setDisplaySrc(getSessionPreviewUrl(stem));
      }
    });

    if (!indexReady) return unsub;

    if (anatomyPreviewStemHasFile(stem)) {
      setDisplaySrc(fileSrc);
      return unsub;
    }

    capture?.enqueueCapture?.({ stem, anatomy });

    return unsub;
  }, [stem, fileSrc, anatomy, indexReady, capture]);

  const frameClass = `h-full w-full min-h-0 rounded-xl overflow-hidden ${PREVIEW_FRAME} outline-none isolate [contain:paint]`;

  return (
    <div
      className={`h-full w-full min-h-0 shrink-0 pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <div className={frameClass}>
        {displaySrc ? (
          <img
            src={displaySrc}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover object-center bg-black"
          />
        ) : (
          <div className="flex h-full w-full min-h-[180px] flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-950 to-black px-4 text-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-teal-900/40" />
            <span className="text-[10px] text-teal-700/90">Aperçu anatomie…</span>
          </div>
        )}
      </div>
    </div>
  );
}
