/** Helpers blocs fiche grand pectoral. */
export const p = (text) => ({ type: 'p', text });
export const h3 = (text) => ({ type: 'h3', text });
export const ul = (items) => ({ type: 'ul', items });

/** Présentation — modules éditoriaux (chips, split, callouts…). */
export const chips = (items) => ({ type: 'chips', items });
export const takeaway = (text, label = 'À retenir') => ({ type: 'takeaway', label, text });
export const pullquote = (lead, text) => ({ type: 'pullquote', lead, text });
export const splitCards = (cards, caption = null) => ({ type: 'split', cards, caption });
/** @param {'analogy'|'definition'|'warning'|'study'} variant */
export const pCallout = (variant, tag, text) => ({
  type: 'presentationCallout',
  variant,
  tag,
  text
});
export const exerciseGrid = (items) => ({ type: 'exerciseGrid', items });

const GRAND_PEC_FIG = '/anatomy/grand-pectoral';

/** @param {'landscape'|'portrait'} [layout] */
export const figure = (file, caption, alt = '', layout = 'landscape') => ({
  type: 'figure',
  src: `${GRAND_PEC_FIG}/${file}`,
  caption,
  alt: alt || caption,
  layout
});

export const figureAt = (folder, file, caption, alt = '', layout = 'landscape') => ({
  type: 'figure',
  src: `/anatomy/${folder}/${file}`,
  caption,
  alt: alt || caption,
  layout
});

/** Fonctions principales — cartes magazine */
export const functionEyebrow = (text) => ({ type: 'functionEyebrow', text });
export const functionNuance = (text) => ({ type: 'functionNuance', text });
export const functionSynthèse = (lead, text) => ({
  type: 'functionSynthèse',
  lead,
  text
});
