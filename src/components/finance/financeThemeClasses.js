/**
 * Thème Finance : fond noir, bordures et accents verts (#339C5A + dérivés).
 * Utilisé par les vues finance (ex. calendrier) pour une charte cohérente.
 */
export const financeAccent = '#339C5A';

export const financeTheme = {
  /** Bouton principal (accent marque) */
  btnPrimary:
    'rounded-lg border border-[#339C5A]/80 bg-[#339C5A]/18 px-3 py-2 text-sm font-semibold text-[#d4f5e6] shadow-md shadow-[#0a1812]/60 transition-colors hover:bg-[#339C5A]/28 hover:border-[#339C5A] disabled:cursor-not-allowed disabled:opacity-50',
  /** Bouton secondaire / fond sombre */
  btnSecondary:
    'rounded-lg border border-[#1e6b47]/70 bg-black px-3 py-2 text-sm font-medium text-[#b8e8d0]/95 transition-colors hover:border-[#339C5A]/55 hover:bg-black disabled:opacity-50',
  /** Petit bouton / icône */
  btnIcon:
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#339C5A]/45 bg-black text-[#c8efd9] transition-colors hover:border-[#339C5A]/75 hover:bg-[#339C5A]/12',
  /** Segment actif (toggle) */
  btnSegmentActive: 'bg-[#339C5A]/35 text-[#e8faf0] border-[#339C5A]/60',
  btnSegmentIdle:
    'bg-black text-[#8fbfa3] border-transparent hover:bg-black hover:text-[#c8efd9]',
  inset:
    'rounded-lg border border-[#1e6b47]/55 bg-black p-3 shadow-inner shadow-black/40',
  insetMuted: 'rounded-lg border border-[#1e6b47]/40 bg-black p-2',
  label: 'text-xs font-semibold uppercase tracking-wide text-[#7ecfae]/90',
  muted: 'text-[#8fbfa3]/95',
  mutedXs: 'text-[11px] text-[#6a9e86]/95',
  body: 'text-sm text-[#c8efd9]/92',
  divide: 'border-[#1e6b47]/50',
  /** Modale */
  modalPanel:
    'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-[#339C5A]/65 bg-black p-5 shadow-2xl shadow-[#339C5A]/15',
  modalTitle: 'text-lg font-bold text-[#e8faf0]',
};
