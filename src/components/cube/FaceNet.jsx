import React from 'react';
import { faceStart } from '../../lib/cube/model';
import {
  DEFAULT_SCHEME,
  PHYSICAL_COLORS,
  PHYSICAL_ORDER,
  faceAppearance,
  orientationHints,
  physicalToFace
} from '../../lib/cube/colorScheme';

function FaceGrid({ face, facelets, paletteColor, onPaint, onPick, pickMode, selected, scheme }) {
  const start = faceStart(face);
  const look = faceAppearance(scheme, face);
  const hints = orientationHints(scheme);
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/80">
        {look.label}
      </p>
      <div className="grid grid-cols-3 gap-0.5 rounded-md border border-emerald-800/60 bg-emerald-950/40 p-1">
        {Array.from({ length: 9 }, (_, i) => {
          const color = facelets[start + i];
          const isCenter = i === 4;
          const swatch = faceAppearance(scheme, color);
          const isSel = selected && selected.face === face && selected.index === i;
          return (
            <button
              key={`${face}-${i}`}
              type="button"
              onClick={() => {
                if (pickMode) onPick?.(face, i);
                else onPaint(face, i, paletteColor);
              }}
              className={`h-8 w-8 rounded-sm border border-black/50 md:h-9 md:w-9 ${swatch.css || 'bg-zinc-800'} ${
                isCenter ? 'ring-1 ring-white/35' : ''
              } hover:ring-2 hover:ring-white/70 ${isSel ? 'ring-2 ring-emerald-300' : ''}`}
              aria-label={`${face} sticker ${i + 1}`}
            />
          );
        })}
      </div>
      <p className="max-w-[9.5rem] text-center text-[9px] leading-tight text-slate-500">{hints[face]}</p>
    </div>
  );
}

export default function FaceNet({
  facelets,
  paletteColor,
  onPaint,
  onSelectPalette,
  onPick,
  pickMode = false,
  selected = null,
  scheme = DEFAULT_SCHEME
}) {
  return (
    <div className="space-y-4">
      {!pickMode ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Palette</span>
        {PHYSICAL_ORDER.map((phys) => {
          const face = physicalToFace(scheme, phys);
          const swatch = PHYSICAL_COLORS[phys];
          return (
            <button
              key={phys}
              type="button"
              onClick={() => onSelectPalette(face)}
              className={`h-7 w-7 rounded-full border-2 ${swatch.css} ${
                paletteColor === face ? 'border-white scale-110' : 'border-black/40'
              }`}
              title={swatch.label}
            />
          );
        })}
      </div>
      ) : (
        <p className="text-xs text-slate-400">Clique une case du patron pour la sélectionner.</p>
      )}
      <div className="flex flex-col items-center gap-2">
        <FaceGrid
          face="U"
          facelets={facelets}
          paletteColor={paletteColor}
          onPaint={onPaint}
          onPick={onPick}
          pickMode={pickMode}
          selected={selected}
          scheme={scheme}
        />
        <div className="flex flex-wrap justify-center gap-2">
          {['L', 'F', 'R', 'B'].map((face) => (
            <FaceGrid
              key={face}
              face={face}
              facelets={facelets}
              paletteColor={paletteColor}
              onPaint={onPaint}
              onPick={onPick}
              pickMode={pickMode}
              selected={selected}
              scheme={scheme}
            />
          ))}
        </div>
        <FaceGrid
          face="D"
          facelets={facelets}
          paletteColor={paletteColor}
          onPaint={onPaint}
          onPick={onPick}
          pickMode={pickMode}
          selected={selected}
          scheme={scheme}
        />
      </div>
      <p className="text-[11px] text-slate-500">
        {pickMode
          ? 'La pastille choisie est suivie après chaque tour (comme une pièce).'
          : 'Peins aussi les centres comme tu les vois. U / F / R / … restent les faces de ta tenue.'}
      </p>
    </div>
  );
}
