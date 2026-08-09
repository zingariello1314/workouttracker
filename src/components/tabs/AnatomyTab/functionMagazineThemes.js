/** Thèmes couleur — section « Fonctions principales » (maquette grand pectoral). */

export function functionThemeKeyFromTitle(title = '') {
  const t = title;
  if (t.includes('Adduction horizontale')) return 'adduction-h';
  if (t === 'Adduction du bras' || t.includes('Adduction du bras')) return 'adduction';
  if (t.includes('Rotation médiale')) return 'rotation';
  if (t.includes('Flexion')) return 'flexion';
  if (t.includes('Extension')) return 'extension';
  if (t.includes('poussée') || t.includes('Poussée')) return 'poussee';
  if (t.includes('stabilisation') || t.includes('Stabilisation')) return 'stabilisation';
  if (t.includes('change selon')) return 'polyvalence';
  return 'default';
}

export const FUNCTION_MAGAZINE_THEMES = {
  'adduction-h': {
    pill: 'border-[#3b82f6]/55 bg-[#3b82f6]/12 text-[#93c5fd]',
    eyebrow: 'text-[#60a5fa]',
    cardAccent: 'border-l-[#3b82f6]',
    icon: 'border-[#3b82f6]/50 bg-[#3b82f6]/15 text-[#60a5fa] shadow-[0_0_20px_rgba(59,130,246,0.2)]'
  },
  adduction: {
    pill: 'border-[#8b5cf6]/55 bg-[#8b5cf6]/12 text-[#c4b5fd]',
    eyebrow: 'text-[#a78bfa]',
    cardAccent: 'border-l-[#8b5cf6]',
    icon: 'border-[#8b5cf6]/50 bg-[#8b5cf6]/15 text-[#a78bfa] shadow-[0_0_20px_rgba(139,92,246,0.2)]'
  },
  rotation: {
    pill: 'border-[#ec4899]/55 bg-[#ec4899]/12 text-[#f9a8d4]',
    eyebrow: 'text-[#f472b6]',
    cardAccent: 'border-l-[#ec4899]',
    icon: 'border-[#ec4899]/50 bg-[#ec4899]/15 text-[#f472b6] shadow-[0_0_20px_rgba(236,72,153,0.2)]'
  },
  flexion: {
    pill: 'border-[#14b8a6]/55 bg-[#14b8a6]/12 text-[#5eead4]',
    eyebrow: 'text-[#2dd4bf]',
    cardAccent: 'border-l-[#14b8a6]',
    icon: 'border-[#14b8a6]/50 bg-[#14b8a6]/15 text-[#2dd4bf] shadow-[0_0_20px_rgba(20,184,166,0.2)]'
  },
  extension: {
    pill: 'border-[#f97316]/55 bg-[#f97316]/12 text-[#fdba74]',
    eyebrow: 'text-[#fb923c]',
    cardAccent: 'border-l-[#f97316]',
    icon: 'border-[#f97316]/50 bg-[#f97316]/15 text-[#fb923c] shadow-[0_0_20px_rgba(249,115,22,0.2)]'
  },
  poussee: {
    pill: 'border-[#ef4444]/55 bg-[#ef4444]/12 text-[#fca5a5]',
    eyebrow: 'text-[#f87171]',
    cardAccent: 'border-l-[#ef4444]',
    icon: 'border-[#ef4444]/50 bg-[#ef4444]/15 text-[#f87171] shadow-[0_0_20px_rgba(239,68,68,0.2)]'
  },
  stabilisation: {
    pill: 'border-[#38bdf8]/55 bg-[#38bdf8]/12 text-[#7dd3fc]',
    eyebrow: 'text-[#38bdf8]',
    cardAccent: 'border-l-[#38bdf8]',
    icon: 'border-[#38bdf8]/50 bg-[#38bdf8]/15 text-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.2)]'
  },
  polyvalence: {
    pill: 'border-[#eab308]/55 bg-[#eab308]/10 text-[#fde047]',
    eyebrow: 'text-[#eab308]',
    cardAccent: 'border-l-[#eab308]',
    icon: 'border-[#eab308]/45 bg-[#eab308]/12 text-[#facc15] shadow-[0_0_18px_rgba(234,179,8,0.15)]',
    title: 'text-[#fde68a]'
  },
  default: {
    pill: 'border-[#64748b]/50 bg-[#64748b]/10 text-slate-300',
    eyebrow: 'text-[#94a3b8]',
    cardAccent: 'border-l-[#64748b]',
    icon: 'border-[#475569] bg-[#0f1419] text-[#94a3b8]'
  }
};

export function functionMagazineThemeForCard(card) {
  return FUNCTION_MAGAZINE_THEMES[functionThemeKeyFromTitle(card?.title)] || FUNCTION_MAGAZINE_THEMES.default;
}

export function functionPillLabelFromCard(card) {
  const t = card.title || '';
  if (t.includes('Rotation médiale')) return 'Rotation médiale';
  if (t.includes('Extension de l’épaule') || t.includes("Extension de l'épaule")) return 'Extension';
  if (t.includes('Flexion')) return 'Flexion';
  if (t === 'Adduction du bras') return 'Adduction';
  if (t.includes('poussée') || t.includes('Poussée')) return 'Poussée';
  if (t.includes('stabilisation') || t.includes('Stabilisation')) return 'Stabilisation';
  if (t.includes('Adduction horizontale')) return 'Adduction horizontale';
  return t;
}
