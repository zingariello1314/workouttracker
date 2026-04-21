/**
 * Thème « Paramètres » : fond noir, bordures et accents rouges.
 * Utilisé uniquement par l’onglet Paramètres et ses modales associées.
 */
export const settingsTheme = {
  /** Bouton principal (remplace gradient-button-premium) */
  btnPrimary:
    'rounded-lg border border-red-500/70 bg-red-950/55 px-4 py-2.5 text-sm font-medium text-red-100 shadow-md shadow-red-950/30 transition-colors hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2',
  /** Bouton secondaire / variante */
  btnSecondary:
    'rounded-lg border border-red-900/60 bg-black px-4 py-2.5 text-sm font-medium text-red-100/90 shadow-md shadow-black/40 transition-colors hover:bg-red-950/35 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2',
  /** Petit bouton */
  btnSm:
    'rounded-lg border border-red-500/65 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:bg-red-900/50 disabled:opacity-50',
  /** Encadré d’info / liste */
  inset:
    'rounded-lg border border-red-900/45 bg-red-950/25 p-4',
  insetSm: 'rounded-lg border border-red-900/40 bg-red-950/20 p-3',
  label: 'text-sm font-medium text-red-100/90',
  labelXs: 'text-xs font-medium text-red-200/85',
  muted: 'text-red-200/70',
  mutedXs: 'text-xs text-red-300/65',
  body: 'text-sm text-red-100/85',
  divide: 'border-red-900/45',
  /** Champ texte / select */
  input:
    'w-full rounded-lg border border-red-900/55 bg-black px-3 py-2 text-sm text-red-100 placeholder-red-500/35 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40',
  /** Conteneur modal (panneau) */
  modalPanel:
    'max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border-2 border-red-700/70 bg-black shadow-2xl shadow-red-950/50',
  modalHeader: 'flex items-center justify-between border-b border-red-900/50 p-6',
  modalFooter: 'flex justify-end gap-2 border-t border-red-900/50 p-6',
};
