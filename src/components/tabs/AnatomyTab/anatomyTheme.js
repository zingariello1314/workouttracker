/** Classes UI Anatomie — modules & texte (pas le fond site ni le modèle 3D). */
export const ANATOMY = {
  card: 'rounded-xl bg-[#161B22] border border-white/[0.08]',
  cardPad: 'p-4',
  panel: 'rounded-xl bg-[#161B22] border border-white/[0.06] p-5 md:p-6',
  /** Panneau contenu actif — fiche muscle (cadre + aura gérés dans le panel) */
  musclePanel:
    'rounded-2xl border bg-[#0f1419]/90 p-5 md:p-7 relative overflow-hidden backdrop-blur-[2px]',
  /** Bloc section vue Famille — plus de contraste, lecture verticale */
  familySection:
    'rounded-2xl border border-[#3897F0]/25 bg-[#0f1419]/95 p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
  familyHero:
    'rounded-2xl border border-[#3897F0]/30 bg-gradient-to-br from-[#3897F0]/[0.14] via-[#0f1419] to-[#0a0e14] p-5 md:p-7 shadow-[0_12px_40px_rgba(56,151,240,0.08)]',
  familyVision:
    'rounded-2xl border border-[#3897F0]/35 bg-gradient-to-br from-[#3897F0]/20 via-[#121a24] to-[#0a0e14] p-5 md:p-6',
  familySectionTitle:
    'text-lg font-semibold text-white tracking-tight border-b border-[#3897F0]/35 pb-3 mb-5',
  accent: 'text-[#3897F0]',
  accentBright: 'text-[#5eb0ff]',
  accentHover: 'hover:text-[#5eb0ff]',
  muted: 'text-[#8E8E93]',
  body: 'text-slate-100/90',
  summary: 'text-sm text-[#8E8E93] leading-relaxed',
  labelUpper: 'text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]',
  sheetKicker: 'text-[11px] font-medium uppercase tracking-wider text-[#3897F0]',
  tabOn:
    'rounded-full px-4 py-1.5 text-xs font-medium border border-[#3897F0]/50 bg-[#3897F0]/10 text-white',
  tabOff:
    'rounded-full px-4 py-1.5 text-xs font-medium border border-white/10 text-[#8E8E93] hover:text-slate-200 hover:border-white/20 transition-colors',
  navOn: 'rounded-lg px-3 py-2 text-left text-sm bg-[#3897F0]/12 text-[#3897F0] font-medium',
  navOff:
    'rounded-lg px-3 py-2 text-left text-sm text-[#8E8E93] hover:text-slate-300 hover:bg-white/[0.03] transition-colors',
  breadcrumb: 'text-[#3897F0] hover:text-[#5eb0ff] transition-colors',
  listRowHover: 'hover:bg-white/[0.03]',
  listRowActive: 'bg-[#3897F0]/8',
  progressTrack: 'h-1 rounded-full bg-[#0d1117] overflow-hidden',
  progressFill: 'h-full rounded-full bg-[#3897F0]'
};
