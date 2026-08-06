/** Découpe intro/outro famille (paragraphes séparés par lignes vides). */
export function splitAnatomyParagraphs(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const ACCENT_CYCLE = [
  'border-l-[#3897F0]/85 bg-[#3897F0]/[0.04]',
  'border-l-cyan-400/75 bg-cyan-400/[0.03]',
  'border-l-indigo-400/75 bg-indigo-400/[0.03]',
  'border-l-violet-400/70 bg-violet-400/[0.03]'
];

/** Puces famille (vertical, sans chiffres) */
export const FAMILY_DOT_CLASS = [
  'bg-[#3897F0] shadow-[0_0_10px_rgba(56,151,240,0.55)]',
  'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)]',
  'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.45)]',
  'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
];

export function familyDotClassForIndex(i) {
  return FAMILY_DOT_CLASS[i % FAMILY_DOT_CLASS.length];
}

export function accentClassForIndex(i) {
  return ACCENT_CYCLE[i % ACCENT_CYCLE.length];
}

/** Libellé court au-dessus du premier bloc (famille ou section). */
export function kickerForFamilyIntro(familyName) {
  return familyName ? `Vue d’ensemble · ${familyName}` : 'Vue d’ensemble';
}

export function kickerForSection(sectionId, sectionTitle) {
  switch (sectionId) {
    case 'presentation':
      return 'Présentation';
    default:
      return null;
  }
}

export function blocksAreOnlyParagraphs(blocks) {
  if (!blocks?.length) return false;
  return blocks.every((b) => b.type === 'p' && b.text);
}

export function blocksHaveHeadings(blocks) {
  return (blocks || []).some((b) => b.type === 'h3');
}
