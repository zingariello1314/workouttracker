/** Aura de fond (absolute inset-0) — panneau fiche muscle. */
export function muscleSectionGlow(sectionId) {
  switch (sectionId) {
    case 'presentation':
      return 'bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(56,151,240,0.12),transparent_55%)]';
    case 'portions':
      return 'bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(99,102,241,0.14),transparent_50%)]';
    case 'anatomie':
      return 'bg-[radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(45,212,191,0.1),transparent_55%)]';
    case 'fonctions':
      return 'bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(52,211,153,0.09),transparent_50%)]';
    case 'morphologie':
      return 'bg-[radial-gradient(ellipse_70%_55%_at_100%_50%,rgba(167,139,250,0.11),transparent_55%)]';
    case 'recrutement':
      return 'bg-[radial-gradient(ellipse_55%_70%_at_0%_50%,rgba(56,151,240,0.1),transparent_50%)]';
    case 'exercices':
      return 'bg-[radial-gradient(ellipse_75%_50%_at_50%_100%,rgba(52,211,153,0.08),transparent_55%)]';
    case 'erreurs':
      return 'bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(245,158,11,0.1),transparent_50%)]';
    case 'blessures':
      return 'bg-[radial-gradient(ellipse_65%_45%_at_0%_0%,rgba(244,63,94,0.09),transparent_50%)]';
    case 'saviez-vous':
      return 'bg-[radial-gradient(ellipse_70%_55%_at_100%_100%,rgba(34,211,238,0.1),transparent_55%)]';
    case 'faq':
      return 'bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(56,151,240,0.11),transparent_50%)]';
    case 'momentum':
      return 'bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(56,151,240,0.15),transparent_60%)]';
    case 'muscles':
      return 'bg-[radial-gradient(ellipse_65%_50%_at_0%_50%,rgba(56,151,240,0.08),transparent_55%)]';
    default:
      return 'bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(56,151,240,0.06),transparent_50%)]';
  }
}

export function muscleSectionBorderClass(sectionId) {
  switch (sectionId) {
    case 'presentation':
      return 'border-[#3897F0]/30 shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]';
    case 'portions':
      return 'border-indigo-400/35 shadow-[0_12px_36px_rgba(99,102,241,0.08)]';
    case 'anatomie':
      return 'border-teal-400/30 shadow-[0_10px_32px_rgba(45,212,191,0.06)]';
    case 'exercices':
      return 'border-emerald-400/28 shadow-[0_10px_32px_rgba(52,211,153,0.07)]';
    case 'erreurs':
      return 'border-amber-400/32 shadow-[0_10px_32px_rgba(245,158,11,0.07)]';
    case 'blessures':
      return 'border-rose-400/30 shadow-[0_10px_32px_rgba(244,63,94,0.07)]';
    case 'momentum':
      return 'border-[#3897F0]/40 shadow-[0_14px_44px_rgba(56,151,240,0.12)]';
    default:
      return 'border-white/[0.08] shadow-[0_8px_28px_rgba(0,0,0,0.4)]';
  }
}

export function muscleSectionTitleBorder(sectionId) {
  switch (sectionId) {
    case 'portions':
      return 'border-indigo-400/40';
    case 'anatomie':
      return 'border-teal-400/40';
    case 'exercices':
      return 'border-emerald-400/40';
    case 'erreurs':
      return 'border-amber-400/45';
    case 'blessures':
      return 'border-rose-400/40';
    case 'momentum':
      return 'border-[#5eb0ff]/50';
    default:
      return 'border-[#3897F0]/35';
  }
}

/** Petits libellés de section dans le contenu. */
export function sectionKicker(sectionId) {
  switch (sectionId) {
    case 'anatomie':
      return 'Attaches & structure';
    case 'fonctions':
      return 'Mécanique';
    case 'recrutement':
      return 'Progression';
    case 'exercices':
      return 'Entraînement';
    case 'morphologie':
      return 'Silhouette & génétique';
    default:
      return null;
  }
}

export const TAG_CHIP =
  'rounded-lg border border-teal-400/30 bg-teal-500/[0.08] px-2.5 py-1.5 text-[11px] text-teal-50/90 leading-snug shadow-[0_0_12px_rgba(45,212,191,0.08)]';

export const EXERCISE_PILL =
  'rounded-md bg-slate-900/80 border border-slate-600/35 px-2 py-1 text-[11px] text-slate-200/90 backdrop-blur-sm';

export const FUNCTION_CARD_SHELL = [
  'border-t-emerald-400/90 bg-gradient-to-b from-emerald-500/[0.06] to-transparent',
  'border-t-cyan-400/90 bg-gradient-to-b from-cyan-500/[0.06] to-transparent',
  'border-t-violet-400/90 bg-gradient-to-b from-violet-500/[0.06] to-transparent',
  'border-t-amber-400/90 bg-gradient-to-b from-amber-500/[0.06] to-transparent'
];
