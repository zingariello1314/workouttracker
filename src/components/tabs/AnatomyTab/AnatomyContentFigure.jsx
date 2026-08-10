import React, { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

/** Illustration fiche anatomie — clic pour agrandir. */
export default function AnatomyContentFigure({
  src,
  alt = '',
  caption,
  layout = 'landscape',
  className = ''
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const label = alt || caption || 'Illustration anatomique';

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!src) return null;
  const portrait = layout === 'portrait';

  const lightbox =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3897F0]"
            >
              Fermer
            </button>
            <figure
              className="relative max-h-[92vh] max-w-[min(96vw,1200px)] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={label}
                className="max-h-[min(85vh,900px)] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
              {caption ? (
                <figcaption
                  id={titleId}
                  className="mt-3 max-w-2xl text-center text-xs sm:text-sm leading-relaxed text-slate-300 px-2"
                >
                  {caption}
                </figcaption>
              ) : (
                <span id={titleId} className="sr-only">
                  {label}
                </span>
              )}
            </figure>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <figure
        className={`my-4 sm:my-5 ${portrait ? 'mx-auto w-full max-w-[min(100%,340px)]' : 'w-full max-w-3xl'} ${className}`.trim()}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group w-full text-left rounded-xl border border-white/[0.1] bg-[#0a0e14]/90 shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3897F0]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e14]"
          aria-label={`Agrandir : ${label}`}
        >
          <img
            src={src}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-contain transition-opacity group-hover:opacity-95"
          />
          <span className="block py-1.5 text-center text-[10px] text-slate-500 group-hover:text-slate-400 border-t border-white/[0.06]">
            Cliquer pour agrandir
          </span>
        </button>
        {caption ? (
          <figcaption className="mt-2.5 text-[11px] sm:text-xs leading-relaxed text-slate-500 px-0.5">
            {caption}
          </figcaption>
        ) : null}
      </figure>
      {lightbox}
    </>
  );
}

export function renderMuscleBlock(block, key) {
  if (!block) return null;
  if (block.type === 'figure') {
    return (
      <AnatomyContentFigure
        key={key}
        src={block.src}
        alt={block.alt}
        caption={block.caption}
        layout={block.layout}
      />
    );
  }
  return null;
}
